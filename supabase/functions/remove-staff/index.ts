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

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Metodo nao permitido.' }, 405);

  try {
    const authHeader = req.headers.get('Authorization') || '';
    const { userId } = await req.json();

    if (!userId) return json({ error: 'ID do usuario nao informado.' }, 400);

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
    if (requester.user.id === userId) {
      return json({ error: 'Voce nao pode remover sua propria conta.' }, 403);
    }

    const { data: targetData } = await admin.auth.admin.getUserById(userId);
    const targetRole = targetData?.user?.app_metadata?.role;
    if (targetRole === 'master') {
      return json({ error: 'Nao e possivel remover o usuario master.' }, 403);
    }
    if (requesterRole === 'admin' && targetRole === 'admin') {
      return json({ error: 'Somente o master pode remover um administrador.' }, 403);
    }

    await admin.from('profiles').delete().eq('id', userId);

    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) throw deleteError;

    return json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro inesperado.';
    return json({ error: message }, 500);
  }
});
