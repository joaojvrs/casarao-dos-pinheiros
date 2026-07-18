import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function startOfMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Metodo nao permitido.' }, 405);

  try {
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) return json({ error: 'Backend sem configuracao do Supabase.' }, 500);

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: requester } = await supabase.auth.getUser(token);
    const role = String(requester.user?.app_metadata?.role || 'visitor');
    const permissions = requester.user?.app_metadata?.permissions || {};

    if (!requester.user || role === 'visitor' || role === 'guest') {
      return json({ error: 'Acesso restrito a equipe.' }, 403);
    }

    const canViewFinancial = ['master', 'admin', 'manager'].includes(role) || Boolean(permissions.reports);
    const today = new Date().toISOString().slice(0, 10);
    const monthStart = startOfMonth(new Date());

    const { data: activeBookings, error: activeError } = await supabase
      .from('bookings')
      .select('id, guests_count, total, check_in, check_out, status')
      .in('status', ['pending', 'confirmed'])
      .lte('check_in', today)
      .gt('check_out', today);

    if (activeError) throw activeError;

    const { data: monthBookings, error: monthError } = await supabase
      .from('bookings')
      .select('id, guests_count, total, lodging_total, extras_total, experiences_total, nights, check_in, check_out, status')
      .gte('check_in', monthStart)
      .in('status', ['pending', 'confirmed', 'completed', 'checked_in', 'checked_out']);

    if (monthError) throw monthError;

    // Occupancy: rooms come from housekeeping inventory; occupied rooms from active
    // front-desk assignments. Guarded so a missing table never breaks the summary.
    let totalRooms = 0;
    let occupiedRooms = 0;
    try {
      const { count: roomsCount } = await supabase
        .from('hk_rooms')
        .select('id', { count: 'exact', head: true })
        .neq('status', 'bloqueado');
      totalRooms = roomsCount || 0;
      const { count: occupiedCount } = await supabase
        .from('fd_room_assignments')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'checked_in');
      occupiedRooms = occupiedCount || 0;
    } catch (_roomError) {
      totalRooms = 0;
      occupiedRooms = 0;
    }

    // Restaurant revenue for the month (paid sales), guarded and only for finance roles.
    let restaurantRevenue = 0;
    if (canViewFinancial) {
      try {
        const { data: sales } = await supabase
          .from('restaurant_sales')
          .select('total, created_at, status')
          .eq('status', 'paid')
          .gte('created_at', `${monthStart}T00:00:00Z`);
        restaurantRevenue = (sales || []).reduce((sum, sale) => sum + Number(sale.total || 0), 0);
      } catch (_salesError) {
        restaurantRevenue = 0;
      }
    }

    const { data: recentBookings, error: recentError } = await supabase
      .from('bookings')
      .select('id, confirmation_code, total, guests_count, check_in, check_out, status, accommodations(name), guests(name)')
      .order('created_at', { ascending: false })
      .limit(8);

    if (recentError) throw recentError;

    const activeGuests = (activeBookings || []).reduce((sum, booking) => sum + Number(booking.guests_count || 0), 0);
    const monthRevenue = canViewFinancial ? (monthBookings || []).reduce((sum, booking) => sum + Number(booking.total || 0), 0) : 0;
    const lodgingRevenue = canViewFinancial ? (monthBookings || []).reduce((sum, booking) => sum + Number(booking.lodging_total || 0), 0) : 0;
    const consumptionRevenue = canViewFinancial ? (monthBookings || []).reduce((sum, booking) => sum + Number(booking.extras_total || 0) + Number(booking.experiences_total || 0), 0) : 0;
    const averageTicket = monthBookings?.length ? Math.round(monthRevenue / monthBookings.length) : 0;

    // Hotel KPIs. Room-nights sold this month → ADR; available room-nights so far → RevPAR.
    const roomNightsMonth = (monthBookings || []).reduce((sum, booking) => sum + Number(booking.nights || 0), 0);
    const now = new Date();
    const daysElapsed = Math.max(1, now.getUTCDate());
    const availableRoomNights = totalRooms * daysElapsed;
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
    const adr = canViewFinancial && roomNightsMonth > 0 ? Math.round(lodgingRevenue / roomNightsMonth) : 0;
    const revpar = canViewFinancial && availableRoomNights > 0 ? Math.round(lodgingRevenue / availableRoomNights) : 0;

    return json({
      summary: {
        canViewFinancial,
        activeGuests,
        activeBookings: activeBookings?.length || 0,
        monthBookings: monthBookings?.length || 0,
        monthRevenue,
        lodgingRevenue,
        consumptionRevenue,
        restaurantRevenue,
        averageTicket,
        totalRooms,
        occupiedRooms,
        occupancyRate,
        roomNightsMonth,
        adr,
        revpar,
        recentBookings: (recentBookings || []).map(booking => ({
          id: booking.id,
          confirmationCode: booking.confirmation_code,
          total: canViewFinancial ? booking.total : 0,
          guestsCount: booking.guests_count,
          checkIn: booking.check_in,
          checkOut: booking.check_out,
          status: booking.status,
          accommodation: Array.isArray(booking.accommodations) ? booking.accommodations[0]?.name : booking.accommodations?.name,
          guest: Array.isArray(booking.guests) ? booking.guests[0]?.name : booking.guests?.name,
        })),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro inesperado ao carregar operacao.';
    return json({ error: message }, 500);
  }
});
