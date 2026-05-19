import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const ALLOWED_ROLES = ['attendant', 'frontdesk', 'kitchen', 'housekeeping', 'financial', 'hr', 'manager', 'admin'] as const;
type StaffRole = typeof ALLOWED_ROLES[number];

const ROLE_PERMISSIONS: Record<StaffRole, Record<string, boolean>> = {
  attendant:    { guests: true, roomService: true },
  frontdesk:    { bookings: true, guests: true, roomService: true },
  kitchen:      { kitchen: true, roomService: true },
  housekeeping: { housekeeping: true, guests: true },
  financial:    { payments: true, reports: true },
  hr:           { hr: true },
  manager:      { bookings: true, guests: true, kitchen: true, housekeeping: true, roomService: true, payments: true, reports: true, hr: true },
  admin:        { bookings: true, guests: true, kitchen: true, housekeeping: true, roomService: true, payments: true, users: true, reports: true, settings: true, hr: true },
};

const ALL_PERMISSIONS = ['bookings', 'guests', 'kitchen', 'housekeeping', 'roomService', 'payments', 'users', 'reports', 'settings', 'hr'] as const;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
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
    const { userId, role, permissions: rawPermissions } = await req.json();

    if (!userId) return json({ error: 'ID do usuario nao informado.' }, 400);
    if (!ALLOWED_ROLES.includes(role)) return json({ error: 'Perfil de acesso invalido.' }, 400);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) return json({ error: 'Backend sem configuracao.' }, 500);

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${serviceRoleKey}` } },
    });

    const { data: requester } = await admin.auth.getUser(authHeader.replace('Bearer ', ''));
    const requesterRole = requester.user?.app_metadata?.role;
    if (!requester.user || !['master', 'admin'].includes(String(requesterRole))) {
      return json({ error: 'Acesso restrito.' }, 403);
    }
    if (requesterRole === 'admin' && role === 'admin') {
      return json({ error: 'Somente o master pode promover a administrador.' }, 403);
    }

    const { data: targetData } = await admin.auth.admin.getUserById(userId);
    const targetRole = targetData?.user?.app_metadata?.role;
    if (targetRole === 'master') {
      return json({ error: 'Nao e possivel alterar o usuario master.' }, 403);
    }
    if (requesterRole === 'admin' && targetRole === 'admin') {
      return json({ error: 'Somente o master pode alterar outro administrador.' }, 403);
    }

    const permissions = sanitizePermissions(role, rawPermissions || {});

    const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
      app_metadata: { role, permissions },
    });
    if (updateError) throw updateError;

    const { error: profileError } = await admin.from('profiles').update({
      role,
      permissions,
      updated_at: new Date().toISOString(),
    }).eq('id', userId);
    if (profileError) throw profileError;

    return json({ success: true, role, permissions });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro inesperado.';
    return json({ error: message }, 500);
  }
});
