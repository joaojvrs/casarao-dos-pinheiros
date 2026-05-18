import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const DEFAULT_ROLE = 'visitor';

interface RegisterRequest {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function cleanPhone(phone: string) {
  return phone.replace(/[^\d+]/g, '');
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Metodo nao permitido.' }, 405);

  try {
    const payload = await req.json() as RegisterRequest;
    const fullName = String(payload.fullName || '').trim();
    const email = String(payload.email || '').trim().toLowerCase();
    const phone = cleanPhone(String(payload.phone || ''));
    const password = String(payload.password || '');

    if (fullName.length < 3) return json({ error: 'Informe o nome completo.' }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Informe um e-mail valido.' }, 400);
    if (phone.replace(/\D/g, '').length < 10) return json({ error: 'Informe um telefone valido.' }, 400);
    if (password.length < 8) return json({ error: 'A senha precisa ter pelo menos 8 caracteres.' }, 400);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) return json({ error: 'Backend sem configuracao do Supabase.' }, 500);

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      phone,
      user_metadata: {
        full_name: fullName,
        phone,
        role: DEFAULT_ROLE,
      },
      app_metadata: {
        role: DEFAULT_ROLE,
      },
    });

    if (createError) {
      const duplicated = createError.message.toLowerCase().includes('already') || createError.status === 422;
      return json({ error: duplicated ? 'Ja existe um usuario cadastrado com este e-mail.' : createError.message }, duplicated ? 409 : 400);
    }

    if (!created.user) return json({ error: 'Nao foi possivel criar o usuario.' }, 500);

    const { error: profileError } = await supabase.from('profiles').upsert({
      id: created.user.id,
      email,
      full_name: fullName,
      phone,
      role: DEFAULT_ROLE,
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      await supabase.auth.admin.deleteUser(created.user.id);
      throw profileError;
    }

    return json({
      user: {
        userId: created.user.id,
        email,
        role: DEFAULT_ROLE,
      },
    }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro inesperado ao cadastrar usuario.';
    return json({ error: message }, 500);
  }
});
