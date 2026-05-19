import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getCurrentAccess } from '../services/auth';
import { getDefaultRouteForAccess } from '../lib/access-routing';

type PageState = 'loading' | 'ready' | 'invalid' | 'done';

export function SetPasswordPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<PageState>('loading');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // SDK processa o hash automaticamente e dispara onAuthStateChange
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') && session) {
        setState('ready');
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setState('ready');
      } else if (!window.location.hash.includes('access_token')) {
        setState('invalid');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError('A senha deve ter pelo menos 8 caracteres.'); return; }
    if (password !== confirm) { setError('As senhas nao conferem.'); return; }

    setError('');
    setSubmitting(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw new Error(updateError.message);
      const access = await getCurrentAccess();
      navigate(getDefaultRouteForAccess(access.role, access.permissions), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nao foi possivel definir a senha.');
      setSubmitting(false);
    }
  };

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-[#f7f3ea] flex items-center justify-center text-sm text-black/50">
        Validando convite...
      </div>
    );
  }

  if (state === 'invalid') {
    return (
      <main className="min-h-screen bg-[#f7f3ea] flex items-center justify-center px-5">
        <div className="w-full max-w-md rounded-lg border border-black/8 bg-white p-7 text-center shadow-sm">
          <h1 className="font-serif text-3xl">Link invalido.</h1>
          <p className="mt-3 text-sm text-black/55">O link de convite expirou ou ja foi utilizado.</p>
          <button
            onClick={() => navigate('/login')}
            className="mt-6 w-full rounded-lg bg-[#20140d] py-3 text-xs font-bold uppercase tracking-[0.22em] text-white transition hover:bg-[#3a2a1f]"
          >
            Ir para o login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f3ea] flex items-center justify-center px-5">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-lg border border-black/8 bg-white p-7 shadow-sm"
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#9d7a4f]">Bem-vindo</p>
        <h1 className="mt-1 font-serif text-3xl">Defina sua senha.</h1>
        <p className="mt-2 text-sm text-black/55">Crie uma senha para acessar o sistema.</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-black/35">
              <Lock size={13} />Senha
            </span>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="new-password"
                className="h-12 w-full rounded-lg border border-black/10 bg-white px-4 pr-12 text-sm outline-none transition focus:border-[#9d7a4f]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full text-black/40 hover:bg-black/5"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="mt-1 text-[11px] text-black/38">Minimo de 8 caracteres.</p>
          </label>

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-black/35">
              <Lock size={13} />Confirmar senha
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              autoComplete="new-password"
              className="h-12 w-full rounded-lg border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-[#9d7a4f]"
            />
          </label>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-900">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-[#20140d] py-4 text-xs font-bold uppercase tracking-[0.22em] text-white transition hover:bg-[#3a2a1f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Salvando...' : 'Definir senha e entrar'}
          </button>
        </form>
      </motion.div>
    </main>
  );
}
