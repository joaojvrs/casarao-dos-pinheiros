import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Check, KeyRound, Mail, Pencil, Phone, Plus, Shield, Trash2, UserRound, Users, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { getCurrentAccess, inviteStaff, listStaffUsers, removeStaff, updateStaff } from '../services/auth';
import type { AppRole, PermissionSet, StaffUser } from '../types/auth';

type StaffRole = Exclude<AppRole, 'visitor' | 'guest' | 'master'>;

const ROLE_LABELS: Record<StaffRole | 'master', string> = {
  attendant:    'Atendimento',
  frontdesk:    'Recepcao',
  kitchen:      'Cozinha',
  housekeeping: 'Governanca',
  financial:    'Financeiro',
  hr:           'RH & Escalas',
  manager:      'Gerencia',
  admin:        'Administrador',
  master:       'Master',
};

const ROLE_PERMISSIONS: Record<StaffRole, PermissionSet> = {
  attendant:    { guests: true, roomService: true },
  frontdesk:    { bookings: true, guests: true, roomService: true },
  kitchen:      { kitchen: true, roomService: true },
  housekeeping: { housekeeping: true, guests: true },
  financial:    { payments: true, reports: true },
  hr:           { hr: true },
  manager:      { bookings: true, guests: true, kitchen: true, housekeeping: true, roomService: true, payments: true, reports: true, hr: true },
  admin:        { bookings: true, guests: true, kitchen: true, housekeeping: true, roomService: true, payments: true, users: true, reports: true, settings: true, hr: true },
};

const PERMISSION_LABELS: Record<keyof PermissionSet, string> = {
  bookings:     'Hospedagens',
  guests:       'Hospedes',
  kitchen:      'Cozinha',
  housekeeping: 'Governanca',
  roomService:  'Pedidos',
  payments:     'Pagamentos',
  users:        'Usuarios',
  reports:      'Relatorios',
  settings:     'Configuracoes',
  hr:           'RH & Escalas',
};

export function AccessPortal({ onBack }: { onBack: () => void }) {
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<StaffUser[]>([]);

  // Invite form
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<StaffRole>('attendant');
  const [permissions, setPermissions] = useState<PermissionSet>(ROLE_PERMISSIONS.attendant);
  const [inviteSent, setInviteSent] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<StaffRole>('attendant');
  const [editPermissions, setEditPermissions] = useState<PermissionSet>({});
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  // Remove state
  const [removeConfirmId, setRemoveConfirmId] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState('');

  const permissionEntries = useMemo(() => Object.entries(PERMISSION_LABELS) as Array<[keyof PermissionSet, string]>, []);

  const customized = useMemo(
    () => permissionEntries.some(([key]) => Boolean(permissions[key]) !== Boolean(ROLE_PERMISSIONS[role][key])),
    [permissionEntries, permissions, role],
  );

  const editCustomized = useMemo(
    () => permissionEntries.some(([key]) => Boolean(editPermissions[key]) !== Boolean(ROLE_PERMISSIONS[editRole][key])),
    [permissionEntries, editPermissions, editRole],
  );

  useEffect(() => {
    getCurrentAccess().then(async access => {
      const canManage = access.role === 'master' || access.role === 'admin';
      setAllowed(canManage);
      if (canManage) {
        try { setUsers(await listStaffUsers()); } catch { /* ignore */ }
      }
      setLoading(false);
    });
  }, []);

  const reloadUsers = async () => { try { setUsers(await listStaffUsers()); } catch { /* ignore */ } };

  const changeRole = (nextRole: StaffRole) => {
    setRole(nextRole);
    setPermissions(ROLE_PERMISSIONS[nextRole]);
  };

  const togglePermission = (key: keyof PermissionSet) =>
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));

  const resetPermissions = () => setPermissions(ROLE_PERMISSIONS[role]);

  const submitInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    setInviteError('');
    setInviteSent('');
    setSubmitting(true);
    try {
      const invited = await inviteStaff({
        fullName, email, phone, role, permissions,
      });
      setInviteSent(invited.email);
      setFullName(''); setEmail(''); setPhone('');
      changeRole('attendant');
      await reloadUsers();
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Nao foi possivel convidar usuario.');
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (user: StaffUser) => {
    setEditingId(user.id);
    setEditRole((user.role as StaffRole) || 'attendant');
    setEditPermissions(user.permissions);
    setEditError('');
    setRemoveConfirmId(null);
    setRemoveError('');
  };

  const cancelEdit = () => { setEditingId(null); setEditError(''); };

  const changeEditRole = (nextRole: StaffRole) => {
    setEditRole(nextRole);
    setEditPermissions(ROLE_PERMISSIONS[nextRole]);
  };

  const toggleEditPermission = (key: keyof PermissionSet) =>
    setEditPermissions(prev => ({ ...prev, [key]: !prev[key] }));

  const saveEdit = async (userId: string) => {
    setEditSaving(true);
    setEditError('');
    try {
      await updateStaff({ userId, role: editRole, permissions: editPermissions });
      await reloadUsers();
      setEditingId(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Nao foi possivel salvar.');
    } finally {
      setEditSaving(false);
    }
  };

  const startRemove = (userId: string) => {
    setRemoveConfirmId(userId);
    setRemoveError('');
    setEditingId(null);
  };

  const cancelRemove = () => { setRemoveConfirmId(null); setRemoveError(''); };

  const confirmRemove = async (userId: string) => {
    setRemoving(true);
    setRemoveError('');
    try {
      await removeStaff({ userId });
      await reloadUsers();
      setRemoveConfirmId(null);
    } catch (err) {
      setRemoveError(err instanceof Error ? err.message : 'Nao foi possivel remover.');
      setRemoving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#f7f3ea] flex items-center justify-center text-sm text-black/50">Carregando acessos...</div>;
  }

  if (!allowed) {
    return (
      <main className="min-h-screen bg-[#f7f3ea] px-5 py-6">
        <button onClick={onBack} className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 hover:bg-black/5"><ArrowLeft size={18} /></button>
        <section className="mx-auto mt-20 max-w-md rounded-lg border border-black/8 bg-white p-7 text-center shadow-sm">
          <Shield className="mx-auto mb-4 text-[#9d7a4f]" size={34} />
          <h1 className="font-serif text-3xl">Acesso restrito.</h1>
          <p className="mt-3 text-sm leading-6 text-black/55">Somente usuarios autorizados podem gerenciar acessos da equipe.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#20140d]">
      <header className="border-b border-black/8 bg-[#121a16] px-5 py-5 text-white md:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <button onClick={onBack} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 hover:bg-white/10"><ArrowLeft size={18} /></button>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#d7b98d]">Master</p>
            <h1 className="font-serif text-3xl">Acessos da equipe</h1>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-7 md:grid-cols-[420px_1fr] md:px-10">

        {/* ── Formulario de convite ── */}
        <motion.form onSubmit={submitInvite} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="self-start rounded-lg border border-black/8 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#efe4d4] text-[#735333]"><Plus size={18} /></span>
            <h2 className="font-serif text-2xl">Convidar usuario</h2>
          </div>

          <div className="space-y-4">
            <Field label="Nome completo" icon={UserRound}><input value={fullName} onChange={e => setFullName(e.target.value)} /></Field>
            <Field label="E-mail" icon={Mail}><input type="email" value={email} onChange={e => setEmail(e.target.value)} /></Field>
            <Field label="Telefone" icon={Phone}><input value={phone} onChange={e => setPhone(e.target.value)} /></Field>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-black/35"><KeyRound size={13} />Perfil</span>
              <select value={role} onChange={e => changeRole(e.target.value as StaffRole)} className="h-12 w-full rounded-lg border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-[#9d7a4f]">
                {(Object.keys(ROLE_PERMISSIONS) as StaffRole[]).map(item => <option key={item} value={item}>{ROLE_LABELS[item]}</option>)}
              </select>
            </label>

            <PermissionGrid
              entries={permissionEntries}
              active={permissions}
              standard={ROLE_PERMISSIONS[role]}
              onToggle={togglePermission}
              customized={customized}
              onReset={resetPermissions}
            />

            {inviteError && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-900">{inviteError}</p>}
            {inviteSent && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950">
                <p className="font-semibold">Convite enviado.</p>
                <p className="mt-1">Um email foi enviado para <strong>{inviteSent}</strong> com o link de acesso.</p>
              </div>
            )}

            <button type="submit" disabled={submitting} className="w-full rounded-lg bg-[#20140d] py-4 text-xs font-bold uppercase tracking-[0.22em] text-white transition hover:bg-[#3a2a1f] disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? 'Enviando convite...' : 'Enviar convite'}
            </button>
          </div>
        </motion.form>

        {/* ── Lista de usuarios ── */}
        <section className="rounded-lg border border-black/8 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#efe4d4] text-[#735333]"><Users size={18} /></span>
            <h2 className="font-serif text-2xl">Usuarios internos</h2>
          </div>

          <div className="space-y-3">
            {users.map(user => (
              <article key={user.id} className="rounded-lg border border-black/8 overflow-hidden">

                {/* Cabecalho do card */}
                <div className="flex flex-col gap-3 p-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{user.fullName}</h3>
                    <p className="mt-1 text-sm text-black/48 truncate">{user.email} · {user.phone}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="rounded-full bg-[#efe4d4] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#735333]">
                      {ROLE_LABELS[user.role as StaffRole] || user.role}
                    </span>
                    {editingId !== user.id && removeConfirmId !== user.id && (
                      <>
                        <button
                          onClick={() => startEdit(user)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/10 text-black/45 transition hover:border-[#9d7a4f]/50 hover:text-[#735333]"
                          title="Editar acessos"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => startRemove(user.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/10 text-black/45 transition hover:border-red-300 hover:text-red-600"
                          title="Remover acesso"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Chips de permissao (modo visualizacao) */}
                {editingId !== user.id && removeConfirmId !== user.id && (
                  <div className="flex flex-wrap gap-2 px-4 pb-4">
                    {Object.entries(user.permissions).filter(([, v]) => v).map(([key]) => (
                      <span key={key} className="inline-flex items-center gap-1 rounded-full border border-black/8 px-2.5 py-1 text-[11px] text-black/55">
                        <Check size={11} />{PERMISSION_LABELS[key as keyof PermissionSet] || key}
                      </span>
                    ))}
                    {Object.values(user.permissions).every(v => !v) && (
                      <span className="text-xs text-black/35">Sem permissoes especificas.</span>
                    )}
                  </div>
                )}

                {/* Painel de edicao inline */}
                <AnimatePresence>
                  {editingId === user.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-black/8 bg-[#faf7f0] px-4 pb-4 pt-4"
                    >
                      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-black/35">Editar acessos</p>

                      <label className="mb-3 block">
                        <span className="mb-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-black/35"><KeyRound size={12} />Perfil</span>
                        <select
                          value={editRole}
                          onChange={e => changeEditRole(e.target.value as StaffRole)}
                          className="h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-[#9d7a4f]"
                        >
                          {(Object.keys(ROLE_PERMISSIONS) as StaffRole[]).map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                        </select>
                      </label>

                      <PermissionGrid
                        entries={permissionEntries}
                        active={editPermissions}
                        standard={ROLE_PERMISSIONS[editRole]}
                        onToggle={toggleEditPermission}
                        customized={editCustomized}
                        onReset={() => setEditPermissions(ROLE_PERMISSIONS[editRole])}
                        compact
                      />

                      {editError && <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2.5 text-sm font-medium text-red-900">{editError}</p>}

                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => saveEdit(user.id)}
                          disabled={editSaving}
                          className="flex-1 rounded-lg bg-[#20140d] py-2.5 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:bg-[#3a2a1f] disabled:opacity-60"
                        >
                          {editSaving ? 'Salvando...' : 'Salvar'}
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={editSaving}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-black/10 text-black/50 transition hover:border-black/25"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Confirmacao de remocao inline */}
                <AnimatePresence>
                  {removeConfirmId === user.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-red-100 bg-red-50 px-4 pb-4 pt-4"
                    >
                      <p className="text-sm font-semibold text-red-900">Remover <span className="font-bold">{user.fullName}</span>?</p>
                      <p className="mt-1 text-xs text-red-700">O acesso ao sistema sera revogado imediatamente. Esta acao nao pode ser desfeita.</p>

                      {removeError && <p className="mt-2 rounded-lg border border-red-300 bg-white p-2 text-xs font-medium text-red-900">{removeError}</p>}

                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => confirmRemove(user.id)}
                          disabled={removing}
                          className="flex-1 rounded-lg bg-red-700 py-2.5 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:bg-red-800 disabled:opacity-60"
                        >
                          {removing ? 'Removendo...' : 'Confirmar remocao'}
                        </button>
                        <button
                          onClick={cancelRemove}
                          disabled={removing}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-red-200 text-red-500 transition hover:border-red-300"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </article>
            ))}

            {users.length === 0 && (
              <p className="rounded-lg border border-black/8 bg-[#faf7f0] p-4 text-sm text-black/50">
                Nenhum usuario interno cadastrado ainda.
              </p>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

function PermissionGrid({
  entries, active, standard, onToggle, customized, onReset, compact = false,
}: {
  entries: Array<[keyof PermissionSet, string]>;
  active: PermissionSet;
  standard: PermissionSet;
  onToggle: (key: keyof PermissionSet) => void;
  customized: boolean;
  onReset: () => void;
  compact?: boolean;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-black/35">Permissoes</p>
        {customized && (
          <button type="button" onClick={onReset} className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#735333] hover:text-[#20140d]">
            Restaurar padrao
          </button>
        )}
      </div>
      {!compact && (
        <p className="mb-3 text-xs leading-5 text-black/45">
          O perfil preenche um padrao, mas voce pode adicionar ou remover acessos para este usuario.
        </p>
      )}
      <div className="grid grid-cols-2 gap-2">
        {entries.map(([key, label]) => {
          const isStandard = Boolean(standard[key]);
          const isActive = Boolean(active[key]);
          return (
            <button
              key={key}
              type="button"
              onClick={() => onToggle(key)}
              className={`rounded-lg border px-3 py-2 text-left text-xs font-medium transition ${isActive ? 'border-[#3a6b4a] bg-[#3a6b4a] text-white' : 'border-black/10 bg-white text-black/55 hover:border-[#9d7a4f]/50'}`}
            >
              <span className="block">{label}</span>
              {isStandard && (
                <span className={`mt-0.5 block text-[9px] uppercase tracking-[0.12em] ${isActive ? 'text-white/65' : 'text-black/35'}`}>
                  Padrao
                </span>
              )}
            </button>
          );
        })}
      </div>
      {customized && <p className="mt-3 text-xs font-medium text-[#735333]">Acesso personalizado.</p>}
    </div>
  );
}

function Field({ label, icon: Icon, children }: { label: string; icon: LucideIcon; children: React.ReactElement<{ className?: string }> }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-black/35"><Icon size={13} />{label}</span>
      {React.cloneElement(children, {
        className: 'h-12 w-full rounded-lg border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-[#9d7a4f]',
      })}
    </label>
  );
}
