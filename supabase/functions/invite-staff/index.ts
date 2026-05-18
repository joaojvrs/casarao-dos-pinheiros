import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const ALLOWED_ROLES = ['attendant', 'frontdesk', 'kitchen', 'housekeeping', 'financial', 'hr', 'manager', 'admin'] as const;
type StaffRole = typeof ALLOWED_ROLES[number];

interface InviteStaffRequest {
  fullName: string;
  email: string;
  phone: string;
  role: StaffRole;
  permissions: Record<string, boolean>;
}

const ROLE_PERMISSIONS: Record<StaffRole, Record<string, boolean>> = {
  attendant: { guests: true, roomService: true },
  frontdesk: { bookings: true, guests: true, roomService: true },
  kitchen: { kitchen: true, roomService: true },
  housekeeping: { housekeeping: true, guests: true },
  financial: { payments: true, reports: true },
  hr: { hr: true },
  manager: { bookings: true, guests: true, kitchen: true, housekeeping: true, roomService: true, payments: true, reports: true, hr: true },
  admin: { bookings: true, guests: true, kitchen: true, housekeeping: true, roomService: true, payments: true, users: true, reports: true, settings: true, hr: true },
};

const ALL_PERMISSIONS = ['bookings', 'guests', 'kitchen', 'housekeeping', 'roomService', 'payments', 'users', 'reports', 'settings', 'hr'] as const;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function cleanPhone(phone: string) {
  return phone.replace(/[^\d+]/g, '');
}

function randomPassword() {
  return `${crypto.randomUUID().replace(/-/g, '').slice(0, 14)}A!`;
}

function sanitizePermissions(role: StaffRole, permissions: Record<string, boolean>) {
  if (role === 'admin') return ROLE_PERMISSIONS.admin;

  const allowedSensitive = role === 'manager';
  return Object.fromEntries(
    ALL_PERMISSIONS
      .map(key => [key, Boolean(permissions[key])] as const)
      .filter(([key, enabled]) => {
        if (!enabled) return false;
        if ((key === 'users' || key === 'settings') && !allowedSensitive) return false;
        return true;
      }),
  );
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Metodo nao permitido.' }, 405);

  try {
    const authHeader = req.headers.get('Authorization') || '';
    const payload = await req.json() as InviteStaffRequest;
    const fullName = String(payload.fullName || '').trim();
    const email = String(payload.email || '').trim().toLowerCase();
    const phone = cleanPhone(String(payload.phone || ''));
    const role = payload.role;

    if (fullName.length < 3) return json({ error: 'Informe o nome completo.' }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Informe um e-mail valido.' }, 400);
    if (phone.replace(/\D/g, '').length < 10) return json({ error: 'Informe um telefone valido.' }, 400);
    if (!ALLOWED_ROLES.includes(role)) return json({ error: 'Perfil de acesso invalido.' }, 400);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) return json({ error: 'Backend sem configuracao do Supabase.' }, 500);

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: authHeader } },
    });

    const { data: requester } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    const requesterRole = requester.user?.app_metadata?.role;
    if (!requester.user || !['master', 'admin'].includes(String(requesterRole))) {
      return json({ error: 'Acesso restrito ao usuario master ou administrador.' }, 403);
    }

    if (requesterRole === 'admin' && role === 'admin') {
      return json({ error: 'Somente o usuario master pode convidar outro administrador.' }, 403);
    }

    const permissions = sanitizePermissions(role, payload.permissions || {});
    const password = randomPassword();

    const { data: invited, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      phone,
      user_metadata: {
        full_name: fullName,
        phone,
      },
      app_metadata: {
        role,
        permissions,
      },
    });

    if (createError) {
      const duplicated = createError.message.toLowerCase().includes('already') || createError.status === 422;
      return json({ error: duplicated ? 'Ja existe um usuario cadastrado com este e-mail.' : createError.message }, duplicated ? 409 : 400);
    }

    if (!invited.user) return json({ error: 'Nao foi possivel convidar o usuario.' }, 500);

    const { error: profileError } = await supabase.from('profiles').upsert({
      id: invited.user.id,
      email,
      full_name: fullName,
      phone,
      role,
      permissions,
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      await supabase.auth.admin.deleteUser(invited.user.id);
      throw profileError;
    }

    return json({
      user: {
        userId: invited.user.id,
        email,
        role,
        permissions,
        temporaryPassword: password,
      },
    }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro inesperado ao convidar usuario.';
    return json({ error: message }, 500);
  }
});
