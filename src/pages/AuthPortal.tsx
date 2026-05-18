import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Lock, Mail, Phone, ShieldCheck, UserRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getDefaultRouteForAccess } from '../lib/access-routing';
import { getCurrentAccess, registerUser, signInUser, signOutUser } from '../services/auth';

type AuthMode = 'register' | 'login';

export function AuthPortal({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const [mode, setMode] = useState<AuthMode>('register');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: string } | null)?.from;

  useEffect(() => {
    if (!auth.loading && auth.authenticated) {
      navigate(from || getDefaultRouteForAccess(auth.role, auth.permissions), { replace: true });
    }
  }, [auth.authenticated, auth.loading, auth.permissions, auth.role, from, navigate]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      if (mode === 'register') {
        if (password !== confirmPassword) throw new Error('As senhas nao conferem.');
        await registerUser({ fullName, email, phone, password });
        await signInUser(email, password);
      } else {
        await signInUser(email, password);
      }
      const access = await getCurrentAccess();
      await auth.refreshAccess();
      navigate(from || getDefaultRouteForAccess(access.role, access.permissions), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nao foi possivel autenticar.');
    } finally {
      setSubmitting(false);
    }
  };

  const logout = async () => {
    setError('');
    setSuccess('');
    await signOutUser();
  };

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#1f140d]">
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-8">
        <img src="/1761873782563-CabanaMata_Frente_2.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-28" />
        <div className="absolute inset-0 bg-[#101815]/82" />

        <button onClick={onBack} className="absolute left-5 top-5 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-md transition hover:bg-white/18">
          <ArrowLeft size={18} />
        </button>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-lg border border-white/12 bg-white shadow-2xl md:grid-cols-[0.95fr_1.05fr]">
          <aside className="bg-[#151d18] p-7 text-white md:p-9">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.34em] text-[#d7b98d]">Conta Vale do Eden</p>
            <h1 className="font-serif text-4xl leading-tight md:text-5xl">Sua conta de hospedagem.</h1>
            <p className="mt-5 text-sm leading-7 text-white/62">
              Acesse reservas, preferências e atendimento personalizado com segurança.
            </p>

            <div className="mt-8 space-y-3 text-sm text-white/70">
              <Info icon={ShieldCheck} label="Segurança" value="acesso protegido" />
              <Info icon={Mail} label="Conta" value="e-mail confirmado" />
              <Info icon={Phone} label="Contato" value="telefone para atendimento" />
            </div>
          </aside>

          <section className="p-6 md:p-9">
            {auth.authenticated && auth.user ? (
              <div className="flex min-h-[480px] flex-col justify-center">
                <span className="mb-5 flex h-13 w-13 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <CheckCircle2 size={26} />
                </span>
                <h2 className="font-serif text-4xl">Usuario autenticado.</h2>
                <div className="mt-6 space-y-3 rounded-lg border border-black/8 bg-[#faf7f0] p-4 text-sm">
                  <Row label="E-mail" value={auth.user.email || '-'} />
                  <Row label="Nome" value={String(auth.user.user_metadata.full_name || '-')} />
                  <Row label="Telefone" value={String(auth.user.user_metadata.phone || '-')} />
                </div>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button onClick={onBack} className="flex-1 rounded-lg bg-[#20140d] py-3 text-xs font-bold uppercase tracking-[0.22em] text-white transition hover:bg-[#3a2a1f]">
                    Continuar
                  </button>
                  <button onClick={logout} className="flex-1 rounded-lg border border-black/10 py-3 text-xs font-bold uppercase tracking-[0.22em] text-black/60 transition hover:border-black/25">
                    Sair
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-6 flex rounded-lg bg-black/5 p-1">
                  <button onClick={() => setMode('register')} className={`flex-1 rounded-md py-2 text-xs font-bold uppercase tracking-[0.18em] transition ${mode === 'register' ? 'bg-white shadow-sm' : 'text-black/42'}`}>
                    Cadastro
                  </button>
                  <button onClick={() => setMode('login')} className={`flex-1 rounded-md py-2 text-xs font-bold uppercase tracking-[0.18em] transition ${mode === 'login' ? 'bg-white shadow-sm' : 'text-black/42'}`}>
                    Login
                  </button>
                </div>

                <form onSubmit={submit} className="space-y-4">
                  {mode === 'register' && (
                    <>
                      <Field label="Nome completo" icon={UserRound}><input value={fullName} onChange={e => setFullName(e.target.value)} /></Field>
                      <Field label="Telefone" icon={Phone}><input value={phone} onChange={e => setPhone(e.target.value)} /></Field>
                    </>
                  )}

                  <Field label="E-mail" icon={Mail}><input type="email" value={email} onChange={e => setEmail(e.target.value)} /></Field>
                  <Field label="Senha" icon={Lock}>
                    <div className="relative">
                      <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="h-12 w-full rounded-lg border border-black/10 bg-white px-4 pr-12 text-sm outline-none transition focus:border-[#9d7a4f]" />
                      <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-black/40 hover:bg-black/5">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </Field>

                  {mode === 'register' && (
                    <Field label="Confirmar senha" icon={Lock}><input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} /></Field>
                  )}

                  {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-900">{error}</p>}
                  {success && <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-900">{success}</p>}

                  <button type="submit" disabled={submitting} className="w-full rounded-lg bg-[#20140d] py-4 text-xs font-bold uppercase tracking-[0.22em] text-white transition hover:bg-[#3a2a1f] disabled:cursor-not-allowed disabled:opacity-60">
                    {submitting ? 'Processando...' : mode === 'register' ? 'Criar conta' : 'Entrar'}
                  </button>
                </form>
              </>
            )}
          </section>
        </motion.div>
      </section>
    </main>
  );
}

function Field({ label, icon: Icon, children }: { label: string; icon: LucideIcon; children: React.ReactElement<{ className?: string }> }) {
  const child = children.type === 'input'
    ? React.cloneElement(children, {
      className: 'h-12 w-full rounded-lg border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-[#9d7a4f]',
    })
    : children;

  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-black/35"><Icon size={13} />{label}</span>
      {child}
    </label>
  );
}

function Info({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
      <Icon size={16} className="text-[#d7b98d]" />
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">{label}</p>
        <p>{value}</p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-black/42">{label}</span>
      <strong className="text-right font-semibold">{value}</strong>
    </div>
  );
}
