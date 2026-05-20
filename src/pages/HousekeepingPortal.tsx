import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  BedDouble,
  Check,
  ClipboardCheck,
  ClipboardList,
  DoorOpen,
  ImagePlus,
  Loader2,
  PackageSearch,
  Plus,
  ShieldAlert,
  Sparkles,
  Wrench,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchHKSummary,
  finishCleaning,
  saveLostFound,
  saveMaintenanceOrder,
  startCleaning,
  updateChecklist,
  updateLostFoundStatus,
  updateMaintenanceStatus,
  updateRoomStatus,
} from '../services/housekeeping';
import { supabase } from '../lib/supabase';
import type {
  HKChecklistItem,
  HKCleaningLog,
  HKLostFound,
  HKMaintenanceOrder,
  HKRoom,
  HKSummary,
  LostFoundStatus,
  MaintenanceCategory,
  MaintenancePriority,
  MaintenanceStatus,
  RoomStatus,
} from '../types/housekeeping';

type HKTab = 'mapa' | 'manutencao' | 'achados';
type MaintenanceFilter = 'todas' | 'aberta' | 'em_andamento' | 'concluida';

const EMPTY_SUMMARY: HKSummary = {
  rooms: [],
  cleaning_logs_today: [],
  maintenance_orders: [],
  lost_found: [],
  metrics: {
    quartos_limpos: 0,
    quartos_sujos: 0,
    em_limpeza: 0,
    ocupados: 0,
    bloqueados: 0,
    em_manutencao: 0,
    ordens_abertas: 0,
    ordens_alta_prioridade: 0,
    achados_aguardando: 0,
  },
};

const TABS: { id: HKTab; label: string; icon: LucideIcon }[] = [
  { id: 'mapa', label: 'Mapa de UHs', icon: DoorOpen },
  { id: 'manutencao', label: 'Manutencao', icon: Wrench },
  { id: 'achados', label: 'Achados & Perdidos', icon: PackageSearch },
];

const STATUS_CLASSES: Record<RoomStatus, string> = {
  limpo: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  sujo: 'border-red-200 bg-red-50 text-red-900',
  em_limpeza: 'border-amber-200 bg-amber-50 text-amber-900',
  ocupado: 'border-sky-200 bg-sky-50 text-sky-900',
  bloqueado: 'border-gray-200 bg-gray-100 text-gray-700',
  em_manutencao: 'border-orange-200 bg-orange-50 text-orange-900',
};

const STATUS_LABELS: Record<string, string> = {
  limpo: 'Limpo',
  sujo: 'Sujo',
  em_limpeza: 'Em limpeza',
  ocupado: 'Ocupado',
  bloqueado: 'Bloqueado',
  em_manutencao: 'Manutencao',
  aberta: 'Aberta',
  em_andamento: 'Em andamento',
  concluida: 'Concluida',
  cancelada: 'Cancelada',
  aguardando: 'Aguardando',
  notificado: 'Notificado',
  devolvido: 'Devolvido',
  descartado: 'Descartado',
};

function roomStatusLabel(status: string) {
  return STATUS_LABELS[status] || status;
}

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function orderCode(id: string) {
  return `OS-${id.slice(0, 4).toUpperCase()}`;
}

function lostCode(id: string) {
  return `AP-${id.slice(0, 4).toUpperCase()}`;
}

export function HousekeepingPortal({ onBack }: { onBack: () => void }) {
  const auth = useAuth();
  const [activeTab, setActiveTab] = useState<HKTab>('mapa');
  const [summary, setSummary] = useState<HKSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<HKRoom | null>(null);

  const isManager = ['master', 'admin', 'manager'].includes(auth.role);

  const loadSummary = async () => {
    const data = await fetchHKSummary();
    setSummary(data);
    setSelectedRoom(room => room ? data.rooms.find(item => item.id === room.id) || null : null);
  };

  const run = async (message: string, operation: () => Promise<unknown>) => {
    setWorking(true);
    setError('');
    setNotice('');
    try {
      await operation();
      await loadSummary();
      setNotice(message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nao foi possivel concluir a operacao.');
    } finally {
      setWorking(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchHKSummary()
      .then(data => { if (mounted) setSummary(data); })
      .catch(err => { if (mounted) setError(err instanceof Error ? err.message : 'Nao foi possivel carregar a governanca.'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#20140d]">
      <header className="border-b border-black/8 bg-[#121a16] px-5 py-5 text-white md:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <button onClick={onBack} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 transition hover:bg-white/10">
            <ArrowLeft size={18} />
          </button>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#d7b98d]">Governanca</p>
            <h1 className="font-serif text-3xl">UHs, limpeza e manutencao</h1>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-6 md:px-10">
        {(error || notice) && (
          <div className={`mb-4 flex items-center justify-between rounded-lg border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
            <span>{error || notice}</span>
            <button onClick={() => { setError(''); setNotice(''); }}><X size={15} /></button>
          </div>
        )}

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Metric icon={Sparkles} label="Limpos" value={loading ? '...' : String(summary.metrics.quartos_limpos)} />
          <Metric icon={ClipboardCheck} label="Em limpeza / ocupados" value={loading ? '...' : String(summary.metrics.em_limpeza + (summary.metrics.ocupados || 0))} />
          <Metric icon={BedDouble} label="Sujos" value={loading ? '...' : String(summary.metrics.quartos_sujos)} tone="warn" />
          <Metric icon={ShieldAlert} label="Bloq. / manut." value={loading ? '...' : String(summary.metrics.bloqueados + summary.metrics.em_manutencao)} />
        </div>

        <nav className="mb-6 flex gap-2 overflow-x-auto rounded-lg border border-black/8 bg-white p-2 shadow-sm">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)} className={`flex h-11 shrink-0 items-center gap-2 rounded-md px-3 text-xs font-bold uppercase tracking-[0.16em] transition ${activeTab === id ? 'bg-[#20140d] text-white' : 'text-black/48 hover:bg-black/5 hover:text-black/75'}`}>
              <Icon size={15} />
              {label}
            </button>
          ))}
        </nav>

        {loading ? (
          <div className="flex min-h-[360px] items-center justify-center rounded-lg border border-black/8 bg-white">
            <Loader2 className="animate-spin text-[#9d7a4f]" size={30} />
          </div>
        ) : (
          <>
            {activeTab === 'mapa' && <RoomMap rooms={summary.rooms} onSelect={setSelectedRoom} />}
            {activeTab === 'manutencao' && (
              <MaintenancePanel
                rooms={summary.rooms}
                orders={summary.maintenance_orders}
                working={working}
                isManager={isManager}
                onSave={(data) => run('Ordem de manutencao salva.', () => saveMaintenanceOrder(data))}
                onUpdateStatus={(orderId, status, descricao, resolucao) => run('Status da ordem atualizado.', () => updateMaintenanceStatus(orderId, status, descricao, resolucao))}
              />
            )}
            {activeTab === 'achados' && (
              <LostFoundPanel
                rooms={summary.rooms}
                items={summary.lost_found}
                working={working}
                onSave={(data) => run('Achado registrado.', () => saveLostFound(data))}
                onUpdateStatus={(id, status, devolvidoPara) => run('Status do item atualizado.', () => updateLostFoundStatus(id, status, devolvidoPara))}
              />
            )}
          </>
        )}
      </section>

      {selectedRoom && (
        <RoomDrawer
          room={selectedRoom}
          logs={summary.cleaning_logs_today}
          orders={summary.maintenance_orders}
          isManager={isManager}
          userId={auth.user?.id || ''}
          working={working}
          onClose={() => setSelectedRoom(null)}
          onStartCleaning={(roomId) => run('Limpeza iniciada.', () => startCleaning(roomId, auth.user!.id))}
          onUpdateChecklist={(logId, checklist) => run('Progresso salvo.', () => updateChecklist(logId, checklist))}
          onFinishCleaning={(logId, roomId, observacao) => run('Limpeza concluida.', () => finishCleaning(logId, roomId, observacao))}
          onManualStatus={(roomId, status, camareiraId) => run('Status do quarto atualizado.', () => updateRoomStatus(roomId, status, camareiraId))}
        />
      )}
    </main>
  );
}

function RoomMap({ rooms, onSelect }: { rooms: HKRoom[]; onSelect: (room: HKRoom) => void }) {
  return (
    <section className="rounded-lg border border-black/8 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#efe4d4] text-[#735333]"><DoorOpen size={18} /></span>
        <h2 className="font-serif text-2xl">Mapa de unidades habitacionais</h2>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(90px,1fr))] gap-3">
        {rooms.map(room => (
          <button key={room.id} onClick={() => onSelect(room)} className={`min-h-24 rounded-lg border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md ${STATUS_CLASSES[room.status]}`}>
            <p className="text-lg font-bold">{room.numero}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em]">{roomStatusLabel(room.status)}</p>
            {room.status === 'em_limpeza' && <p className="mt-2 truncate text-[11px] opacity-70">{room.camareira?.nome || 'Camareira'}</p>}
          </button>
        ))}
      </div>
    </section>
  );
}

function RoomDrawer({ room, logs, orders, isManager, userId, working, onClose, onStartCleaning, onUpdateChecklist, onFinishCleaning, onManualStatus }: {
  room: HKRoom;
  logs: HKCleaningLog[];
  orders: HKMaintenanceOrder[];
  isManager: boolean;
  userId: string;
  working: boolean;
  onClose: () => void;
  onStartCleaning: (roomId: string) => void;
  onUpdateChecklist: (logId: string, checklist: HKChecklistItem[]) => void;
  onFinishCleaning: (logId: string, roomId: string, observacao?: string) => void;
  onManualStatus: (roomId: string, status: RoomStatus, camareiraId?: string) => void;
}) {
  const activeLog = logs.find(log => log.room_id === room.id && log.status === 'em_andamento');
  const lastDone = logs.find(log => log.room_id === room.id && log.status === 'concluido');
  const roomOrder = orders.find(order => order.room_id === room.id && order.status !== 'concluida');
  const [checklist, setChecklist] = useState<HKChecklistItem[]>(activeLog?.checklist || []);
  const [manualStatus, setManualStatus] = useState<RoomStatus>(room.status);
  const [observacao, setObservacao] = useState('');
  const pending = checklist.filter(item => !item.done);

  useEffect(() => {
    setChecklist(activeLog?.checklist || []);
    setManualStatus(room.status);
  }, [activeLog, room.status]);

  const updateItem = (id: string, patch: Partial<HKChecklistItem>) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, ...patch } : item));
  };

  return (
    <aside className="fixed inset-y-0 right-0 z-[700] w-full max-w-xl overflow-y-auto border-l border-black/10 bg-[#f7f3ea] p-5 shadow-2xl">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-black/35">Quarto {room.numero}</p>
          <h2 className="font-serif text-3xl">{roomStatusLabel(room.status)}</h2>
        </div>
        <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 hover:bg-black/5"><X size={17} /></button>
      </div>

      <section className="rounded-lg border border-black/8 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Info label="Tipo" value={room.tipo} />
          <Info label="Andar" value={String(room.andar)} />
          <Info label="Capacidade" value={`${room.capacidade} pessoas`} />
          <Info label="Atualizado" value={formatDateTime(room.updated_at)} />
        </div>
      </section>

      {room.status === 'sujo' && (
        <button disabled={working || !userId} onClick={() => onStartCleaning(room.id)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#3a6b4a] py-3 text-xs font-bold uppercase tracking-[0.18em] text-white disabled:opacity-50">
          <ClipboardCheck size={16} /> Iniciar limpeza
        </button>
      )}

      {room.status === 'em_limpeza' && activeLog && (
        <section className="mt-4 rounded-lg border border-black/8 bg-white p-4 shadow-sm">
          <h3 className="font-serif text-2xl">Checklist de limpeza</h3>
          <div className="mt-4 space-y-3">
            {checklist.map(item => (
              <div key={item.id} className="rounded-lg border border-black/8 bg-[#faf7f0] p-3">
                <label className="flex items-start gap-3 text-sm font-semibold">
                  <input type="checkbox" checked={item.done} onChange={e => updateItem(item.id, { done: e.target.checked })} className="mt-1" />
                  <span>{item.label}</span>
                </label>
                {item.done && (
                  <input value={item.foto_url || ''} onChange={e => updateItem(item.id, { foto_url: e.target.value || null })} placeholder="URL da foto, se houver" className="mt-3 h-10 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-[#9d7a4f]" />
                )}
              </div>
            ))}
          </div>
          <textarea value={observacao} onChange={e => setObservacao(e.target.value)} placeholder="Observação final, se houver" className="mt-4 min-h-20 w-full rounded-lg border border-black/10 bg-white p-3 text-sm outline-none focus:border-[#9d7a4f]" />
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button disabled={working} onClick={() => onUpdateChecklist(activeLog.id, checklist)} className="rounded-lg border border-black/10 py-3 text-xs font-bold uppercase tracking-[0.16em] text-black/60 hover:border-black/25 disabled:opacity-50">Salvar progresso</button>
            <button title={pending.length ? 'Todos os itens precisam estar concluídos.' : 'Concluir limpeza'} disabled={working || pending.length > 0} onClick={() => onFinishCleaning(activeLog.id, room.id, observacao)} className="rounded-lg bg-[#20140d] py-3 text-xs font-bold uppercase tracking-[0.16em] text-white disabled:opacity-45">Concluir limpeza</button>
          </div>
        </section>
      )}

      {room.status === 'limpo' && (
        <section className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          Ultima limpeza concluida: {formatDateTime(lastDone?.concluido_em)}
        </section>
      )}

      {room.status === 'em_manutencao' && (
        <section className="mt-4 rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900">
          <p className="font-bold">{roomOrder ? `${orderCode(roomOrder.id)} · ${roomOrder.descricao}` : 'Quarto em manutenção.'}</p>
          {roomOrder && <p className="mt-1">Status: {roomStatusLabel(roomOrder.status)} · Responsável: {roomOrder.responsavel?.nome || 'Sem responsável'}</p>}
        </section>
      )}

      {room.status === 'ocupado' && (
        <section className="mt-4 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
          Quarto ocupado pela recepcao. No check-out ele volta automaticamente como sujo para a fila de limpeza.
        </section>
      )}

      {isManager && (
        <section className="mt-4 rounded-lg border border-black/8 bg-white p-4 shadow-sm">
          <h3 className="font-serif text-2xl">Ajuste manual</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
            <select value={manualStatus} onChange={e => setManualStatus(e.target.value as RoomStatus)} className="h-12 rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-[#9d7a4f]">
              {(['limpo', 'sujo', 'em_limpeza', 'ocupado', 'bloqueado', 'em_manutencao'] as RoomStatus[]).map(status => <option key={status} value={status}>{roomStatusLabel(status)}</option>)}
            </select>
            <button disabled={working} onClick={() => onManualStatus(room.id, manualStatus, manualStatus === 'em_limpeza' ? userId : undefined)} className="h-12 rounded-lg bg-[#20140d] px-5 text-xs font-bold uppercase tracking-[0.16em] text-white disabled:opacity-50">Salvar</button>
          </div>
        </section>
      )}
    </aside>
  );
}

function MaintenancePanel({ rooms, orders, working, isManager, onSave, onUpdateStatus }: {
  rooms: HKRoom[];
  orders: HKMaintenanceOrder[];
  working: boolean;
  isManager: boolean;
  onSave: (data: { room_id?: string; local_livre?: string; categoria: MaintenanceCategory; descricao: string; prioridade: MaintenancePriority; responsavel_id?: string; foto_url?: string }) => void;
  onUpdateStatus: (orderId: string, status: MaintenanceStatus, descricao?: string, resolucao?: string) => void;
}) {
  const [filter, setFilter] = useState<MaintenanceFilter>('todas');
  const [openForm, setOpenForm] = useState(false);
  const [useRoom, setUseRoom] = useState(true);
  const [roomId, setRoomId] = useState('');
  const [localLivre, setLocalLivre] = useState('');
  const [categoria, setCategoria] = useState<MaintenanceCategory>('hidraulica');
  const [prioridade, setPrioridade] = useState<MaintenancePriority>('media');
  const [descricao, setDescricao] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [fotoName, setFotoName] = useState('');
  const [fotoUploading, setFotoUploading] = useState(false);
  const [fotoError, setFotoError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedOrder, setSelectedOrder] = useState<HKMaintenanceOrder | null>(null);
  const [draftStatus, setDraftStatus] = useState<MaintenanceStatus>('aberta');
  const [statusObservation, setStatusObservation] = useState('');
  const [resolution, setResolution] = useState('');
  const visibleOrders = orders.filter(order => filter === 'todas' || order.status === filter);

  useEffect(() => {
    if (!roomId && rooms[0]) setRoomId(rooms[0].id);
  }, [roomId, rooms]);

  useEffect(() => {
    if (!selectedOrder) return;
    setDraftStatus(selectedOrder.status);
    setStatusObservation('');
    setResolution(selectedOrder.resolucao || '');
  }, [selectedOrder]);

  const handleFotoUpload = async (file: File) => {
    setFotoUploading(true);
    setFotoError('');
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `maintenance/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('housekeeping-attachments').upload(path, file, { upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from('housekeeping-attachments').getPublicUrl(path);
      setFotoUrl(data.publicUrl);
      setFotoName(file.name);
    } catch {
      setFotoError('Nao foi possivel anexar a foto. Tente novamente.');
    } finally {
      setFotoUploading(false);
    }
  };

  const clearFoto = () => {
    setFotoUrl('');
    setFotoName('');
    setFotoError('');
  };

  const statusOptions = (['aberta', 'em_andamento', 'concluida', ...(isManager ? ['cancelada'] : [])] as MaintenanceStatus[]);
  const modalCanSave = selectedOrder
    && (draftStatus !== selectedOrder.status || statusObservation.trim().length > 0 || (draftStatus === 'concluida' && resolution.trim() !== (selectedOrder.resolucao || '').trim()))
    && (draftStatus !== 'concluida' || resolution.trim().length >= 3);

  const saveSelectedOrderStatus = () => {
    if (!selectedOrder) return;
    onUpdateStatus(
      selectedOrder.id,
      draftStatus,
      statusObservation.trim() || `Status alterado para ${roomStatusLabel(draftStatus)}`,
      draftStatus === 'concluida' ? resolution.trim() : undefined,
    );
    setSelectedOrder(null);
  };

  return (
    <section className="rounded-lg border border-black/8 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-black/35">Ordens de manutencao</p>
          <h2 className="font-serif text-2xl">Pendências técnicas</h2>
        </div>
        <button onClick={() => setOpenForm(v => !v)} className="flex h-10 items-center gap-2 rounded-lg bg-[#20140d] px-4 text-xs font-bold uppercase tracking-[0.16em] text-white"><Plus size={14} /> Nova OS</button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {(['todas', 'aberta', 'em_andamento', 'concluida'] as MaintenanceFilter[]).map(item => (
          <button key={item} onClick={() => setFilter(item)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${filter === item ? 'bg-[#20140d] text-white' : 'bg-[#faf7f0] text-black/55'}`}>{item === 'todas' ? 'Todas' : roomStatusLabel(item)}</button>
        ))}
      </div>

      {openForm && (
        <div className="mb-5 grid gap-3 rounded-lg border border-black/8 bg-[#faf7f0] p-4 md:grid-cols-2">
          <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={useRoom} onChange={e => setUseRoom(e.target.checked)} /> Vincular quarto</label>
          {useRoom ? (
            <Field label="Quarto"><select value={roomId} onChange={e => setRoomId(e.target.value)}>{rooms.map(room => <option key={room.id} value={room.id}>{room.numero}</option>)}</select></Field>
          ) : (
            <Field label="Local livre"><input value={localLivre} onChange={e => setLocalLivre(e.target.value)} placeholder="Corredor 2º andar" /></Field>
          )}
          <Field label="Categoria"><select value={categoria} onChange={e => setCategoria(e.target.value as MaintenanceCategory)}>{(['eletrica', 'hidraulica', 'climatizacao', 'mobiliario', 'outros'] as MaintenanceCategory[]).map(item => <option key={item} value={item}>{item}</option>)}</select></Field>
          <Field label="Prioridade"><select value={prioridade} onChange={e => setPrioridade(e.target.value as MaintenancePriority)}>{(['alta', 'media', 'baixa'] as MaintenancePriority[]).map(item => <option key={item} value={item}>{item}</option>)}</select></Field>
          <div>
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-black/38">Foto anexa</span>
            <div className="flex items-center gap-3">
              {fotoUrl ? (
                <img src={fotoUrl} alt="Foto anexada" className="h-14 w-14 shrink-0 rounded-lg border border-black/8 object-cover" />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-dashed border-black/15 bg-white">
                  {fotoUploading ? <Loader2 size={20} className="animate-spin text-black/35" /> : <ImagePlus size={20} className="text-black/25" />}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-black/55">
                  {fotoName || (fotoUrl ? 'Foto anexada' : 'Nenhum anexo selecionado')}
                </div>
                <div className="mt-1.5 flex gap-2">
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={fotoUploading} className="flex items-center gap-1.5 rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-black/60 transition hover:border-[#9d7a4f] disabled:opacity-50">
                    {fotoUploading ? <Loader2 size={12} className="animate-spin" /> : <ImagePlus size={12} />}
                    {fotoUploading ? 'Enviando...' : 'Anexar foto'}
                  </button>
                  {fotoUrl && (
                    <button type="button" onClick={clearFoto} className="flex items-center gap-1 rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs text-red-600 transition hover:border-red-200">
                      <X size={12} /> Remover
                    </button>
                  )}
                </div>
                {fotoError && <p className="mt-1 text-xs text-red-600">{fotoError}</p>}
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp,image/heic" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFotoUpload(f); e.target.value = ''; }}
            />
          </div>
          <label className="md:col-span-2">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-black/38">Descrição</span>
            <textarea value={descricao} onChange={e => setDescricao(e.target.value)} className="min-h-24 w-full rounded-lg border border-black/10 bg-white p-3 text-sm outline-none focus:border-[#9d7a4f]" />
          </label>
          <button disabled={working || fotoUploading || descricao.trim().length < 5} onClick={() => onSave({ room_id: useRoom ? roomId : undefined, local_livre: useRoom ? undefined : localLivre, categoria, prioridade, descricao, foto_url: fotoUrl })} className="h-12 rounded-lg bg-[#3a6b4a] text-xs font-bold uppercase tracking-[0.16em] text-white disabled:opacity-50">Abrir ordem</button>
        </div>
      )}

      <div className="space-y-3">
        {visibleOrders.map(order => (
          <article key={order.id} onClick={() => setSelectedOrder(order)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setSelectedOrder(order); }} className="cursor-pointer rounded-lg border border-black/8 bg-white p-4 text-left transition hover:border-[#9d7a4f]/45 hover:bg-[#fffdf8]">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="font-semibold">{orderCode(order.id)} · {order.room?.numero ? `Quarto ${order.room.numero}` : order.local_livre || 'Local livre'}</p>
                <p className="mt-1 text-sm text-black/55">{order.descricao}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge label={roomStatusLabel(order.status)} tone={order.status === 'concluida' ? 'green' : order.status === 'em_andamento' ? 'yellow' : 'red'} />
                <Badge label={order.prioridade} tone={order.prioridade === 'alta' ? 'red' : order.prioridade === 'media' ? 'yellow' : 'gray'} />
              </div>
            </div>
            <p className="mt-3 text-xs text-black/42">Responsável: {order.responsavel?.nome || 'Sem responsável'} · Aberta em {formatDateTime(order.aberta_em)}</p>
            {order.foto_url && (
              <a href={order.foto_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-black/10 bg-[#faf7f0] p-2 text-xs font-semibold text-black/60 transition hover:border-[#9d7a4f]">
                <img src={order.foto_url} alt="Anexo da ordem" className="h-10 w-10 rounded-md object-cover" />
                Ver foto anexa
              </a>
            )}
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-[#9d7a4f]">Abrir detalhes</p>
          </article>
        ))}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-black/35">Pendência técnica</p>
                <h3 className="mt-1 font-serif text-2xl">{orderCode(selectedOrder.id)} · {selectedOrder.room?.numero ? `Quarto ${selectedOrder.room.numero}` : selectedOrder.local_livre || 'Local livre'}</h3>
              </div>
              <button type="button" onClick={() => setSelectedOrder(null)} className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-black/55 transition hover:border-black/20">
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 grid gap-3 rounded-lg bg-[#faf7f0] p-4 text-sm md:grid-cols-3">
              <Info label="Status atual" value={roomStatusLabel(selectedOrder.status)} />
              <Info label="Prioridade" value={roomStatusLabel(selectedOrder.prioridade)} />
              <Info label="Categoria" value={roomStatusLabel(selectedOrder.categoria)} />
              <Info label="Responsável" value={selectedOrder.responsavel?.nome || 'Sem responsável'} />
              <Info label="Aberta em" value={formatDateTime(selectedOrder.aberta_em)} />
              <Info label="Concluída em" value={formatDateTime(selectedOrder.concluida_em)} />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-[1fr_220px]">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/35">Descrição</p>
                <p className="mt-2 rounded-lg border border-black/8 bg-white p-3 text-sm text-black/70">{selectedOrder.descricao}</p>
              </div>
              {selectedOrder.foto_url && (
                <a href={selectedOrder.foto_url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-black/8 bg-[#faf7f0]">
                  <img src={selectedOrder.foto_url} alt="Anexo da ordem" className="h-36 w-full object-cover" />
                  <span className="block px-3 py-2 text-xs font-semibold text-black/60">Abrir foto anexa</span>
                </a>
              )}
            </div>

            <div className="mt-5 grid gap-3 rounded-lg border border-black/8 bg-[#faf7f0] p-4 md:grid-cols-2">
              <Field label="Novo status">
                <select value={draftStatus} onChange={e => setDraftStatus(e.target.value as MaintenanceStatus)}>
                  {statusOptions.map(status => <option key={status} value={status}>{roomStatusLabel(status)}</option>)}
                </select>
              </Field>
              {draftStatus === 'concluida' && (
                <label>
                  <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-black/38">Resolução</span>
                  <input value={resolution} onChange={e => setResolution(e.target.value)} placeholder="O que foi feito" className="h-12 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-[#9d7a4f]" />
                </label>
              )}
              <label className="md:col-span-2">
                <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-black/38">Observações</span>
                <textarea value={statusObservation} onChange={e => setStatusObservation(e.target.value)} placeholder="Ex.: peça solicitada, hóspede avisado, vistoria feita..." className="min-h-24 w-full rounded-lg border border-black/10 bg-white p-3 text-sm outline-none transition focus:border-[#9d7a4f]" />
              </label>
            </div>

            <div className="mt-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/35">Histórico</p>
              <div className="mt-3 space-y-2 border-l border-black/10 pl-3">
                {selectedOrder.events.length ? selectedOrder.events.map(event => (
                  <div key={event.id} className="relative text-xs text-black/60">
                    <span className="absolute -left-[17px] top-1 h-2 w-2 rounded-full bg-[#9d7a4f]" />
                    <strong>{roomStatusLabel(event.status)}</strong> · {formatDateTime(event.created_at)} {event.descricao ? `· ${event.descricao}` : ''}
                  </div>
                )) : <p className="text-sm text-black/45">Sem movimentações registradas.</p>}
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setSelectedOrder(null)} className="h-11 rounded-lg border border-black/10 px-5 text-xs font-bold uppercase tracking-[0.16em] text-black/60">Fechar</button>
              <button type="button" disabled={working || !modalCanSave} onClick={saveSelectedOrderStatus} className="h-11 rounded-lg bg-[#3a6b4a] px-5 text-xs font-bold uppercase tracking-[0.16em] text-white disabled:opacity-50">
                Salvar atualização
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function LostFoundPanel({ rooms, items, working, onSave, onUpdateStatus }: {
  rooms: HKRoom[];
  items: HKLostFound[];
  working: boolean;
  onSave: (data: { room_id?: string; descricao: string; foto_url?: string; local_guarda?: string; hospede_nome?: string; hospede_contato?: string }) => void;
  onUpdateStatus: (id: string, status: LostFoundStatus, devolvidoPara?: string) => void;
}) {
  const [openForm, setOpenForm] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [descricao, setDescricao] = useState('');
  const [localGuarda, setLocalGuarda] = useState('');
  const [hospedeNome, setHospedeNome] = useState('');
  const [hospedeContato, setHospedeContato] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [fotoName, setFotoName] = useState('');
  const [fotoUploading, setFotoUploading] = useState(false);
  const [fotoError, setFotoError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedItem, setSelectedItem] = useState<HKLostFound | null>(null);
  const [draftStatus, setDraftStatus] = useState<LostFoundStatus>('aguardando');
  const [returnTo, setReturnTo] = useState('');
  const awaiting = items.filter(item => item.status === 'aguardando').length;

  useEffect(() => {
    if (!selectedItem) return;
    setDraftStatus(selectedItem.status);
    setReturnTo(selectedItem.devolvido_para || '');
  }, [selectedItem]);

  const handleFotoUpload = async (file: File) => {
    setFotoUploading(true);
    setFotoError('');
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `lost-found/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('housekeeping-attachments').upload(path, file, { upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from('housekeeping-attachments').getPublicUrl(path);
      setFotoUrl(data.publicUrl);
      setFotoName(file.name);
    } catch {
      setFotoError('Nao foi possivel anexar a foto. Tente novamente.');
    } finally {
      setFotoUploading(false);
    }
  };

  const clearFoto = () => {
    setFotoUrl('');
    setFotoName('');
    setFotoError('');
  };

  const saveSelectedItemStatus = () => {
    if (!selectedItem) return;
    onUpdateStatus(selectedItem.id, draftStatus, draftStatus === 'devolvido' ? returnTo.trim() : undefined);
    setSelectedItem(null);
  };

  const itemCanSave = selectedItem
    && draftStatus !== selectedItem.status
    && (draftStatus !== 'devolvido' || returnTo.trim().length >= 2);

  return (
    <section className="rounded-lg border border-black/8 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-black/35">Achados e perdidos</p>
          <h2 className="font-serif text-2xl">{items.length} itens · {awaiting} aguardando contato</h2>
        </div>
        <button onClick={() => setOpenForm(v => !v)} className="flex h-10 items-center gap-2 rounded-lg bg-[#20140d] px-4 text-xs font-bold uppercase tracking-[0.16em] text-white"><Plus size={14} /> Registrar achado</button>
      </div>

      {openForm && (
        <div className="mb-5 grid gap-3 rounded-lg border border-black/8 bg-[#faf7f0] p-4 md:grid-cols-2">
          <Field label="Quarto"><select value={roomId} onChange={e => setRoomId(e.target.value)}><option value="">Sem quarto</option>{rooms.map(room => <option key={room.id} value={room.id}>{room.numero}</option>)}</select></Field>
          <Field label="Local de guarda"><input value={localGuarda} onChange={e => setLocalGuarda(e.target.value)} /></Field>
          <Field label="Hóspede"><input value={hospedeNome} onChange={e => setHospedeNome(e.target.value)} /></Field>
          <Field label="Contato"><input value={hospedeContato} onChange={e => setHospedeContato(e.target.value)} /></Field>
          <div>
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-black/38">Foto anexa</span>
            <div className="flex items-center gap-3">
              {fotoUrl ? (
                <img src={fotoUrl} alt="Foto anexada" className="h-14 w-14 shrink-0 rounded-lg border border-black/8 object-cover" />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-dashed border-black/15 bg-white">
                  {fotoUploading ? <Loader2 size={20} className="animate-spin text-black/35" /> : <ImagePlus size={20} className="text-black/25" />}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-black/55">
                  {fotoName || (fotoUrl ? 'Foto anexada' : 'Nenhum anexo selecionado')}
                </div>
                <div className="mt-1.5 flex gap-2">
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={fotoUploading} className="flex items-center gap-1.5 rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-black/60 transition hover:border-[#9d7a4f] disabled:opacity-50">
                    {fotoUploading ? <Loader2 size={12} className="animate-spin" /> : <ImagePlus size={12} />}
                    {fotoUploading ? 'Enviando...' : 'Anexar foto'}
                  </button>
                  {fotoUrl && (
                    <button type="button" onClick={clearFoto} className="flex items-center gap-1 rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs text-red-600 transition hover:border-red-200">
                      <X size={12} /> Remover
                    </button>
                  )}
                </div>
                {fotoError && <p className="mt-1 text-xs text-red-600">{fotoError}</p>}
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp,image/heic" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFotoUpload(f); e.target.value = ''; }}
            />
          </div>
          <label className="md:col-span-2">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-black/38">Descrição</span>
            <textarea value={descricao} onChange={e => setDescricao(e.target.value)} className="min-h-20 w-full rounded-lg border border-black/10 bg-white p-3 text-sm outline-none focus:border-[#9d7a4f]" />
          </label>
          <div className="flex gap-2">
            <button disabled={working || fotoUploading || descricao.trim().length < 3} onClick={() => onSave({ room_id: roomId || undefined, descricao, foto_url: fotoUrl, local_guarda: localGuarda, hospede_nome: hospedeNome, hospede_contato: hospedeContato })} className="h-12 rounded-lg bg-[#3a6b4a] px-5 text-xs font-bold uppercase tracking-[0.16em] text-white disabled:opacity-50">Salvar</button>
            <button onClick={() => setOpenForm(false)} className="h-12 rounded-lg border border-black/10 px-5 text-xs font-bold uppercase tracking-[0.16em] text-black/60">Cancelar</button>
          </div>
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        {items.map(item => (
          <article key={item.id} onClick={() => setSelectedItem(item)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setSelectedItem(item); }} className="cursor-pointer rounded-lg border border-black/8 bg-white p-4 transition hover:border-[#9d7a4f]/45 hover:bg-[#fffdf8]">
            <div className="flex gap-3">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#faf7f0] text-2xl">
                {item.foto_url ? <img src={item.foto_url} alt="" className="h-full w-full object-cover" /> : '◻'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold">{lostCode(item.id)} · {item.descricao}</p>
                  <Badge label={roomStatusLabel(item.status)} tone={item.status === 'devolvido' ? 'green' : item.status === 'notificado' ? 'blue' : item.status === 'descartado' ? 'gray' : 'yellow'} />
                </div>
                <p className="mt-1 text-xs text-black/42">Quarto {item.room?.numero || '-'} · {formatDateTime(item.encontrado_em)}</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 rounded-lg bg-[#faf7f0] p-3 text-sm md:grid-cols-2">
              <Info label="Guardado em" value={item.local_guarda || '-'} />
              <Info label="Hóspede" value={item.hospede_nome || '-'} />
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-[#9d7a4f]">Abrir detalhes</p>
          </article>
        ))}
      </div>

      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-black/35">Achado e perdido</p>
                <h3 className="mt-1 font-serif text-2xl">{lostCode(selectedItem.id)} · {selectedItem.descricao}</h3>
              </div>
              <button type="button" onClick={() => setSelectedItem(null)} className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-black/55 transition hover:border-black/20">
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 grid gap-3 rounded-lg bg-[#faf7f0] p-4 text-sm md:grid-cols-3">
              <Info label="Status atual" value={roomStatusLabel(selectedItem.status)} />
              <Info label="Quarto" value={selectedItem.room?.numero || '-'} />
              <Info label="Encontrado em" value={formatDateTime(selectedItem.encontrado_em)} />
              <Info label="Guardado em" value={selectedItem.local_guarda || '-'} />
              <Info label="Hóspede" value={selectedItem.hospede_nome || '-'} />
              <Info label="Contato" value={selectedItem.hospede_contato || '-'} />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-[1fr_220px]">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/35">Descrição</p>
                <p className="mt-2 rounded-lg border border-black/8 bg-white p-3 text-sm text-black/70">{selectedItem.descricao}</p>
                <div className="mt-3 grid gap-3 rounded-lg border border-black/8 bg-white p-3 text-sm md:grid-cols-2">
                  <Info label="Notificado em" value={formatDateTime(selectedItem.notificado_em)} />
                  <Info label="Devolvido em" value={formatDateTime(selectedItem.devolvido_em)} />
                  <Info label="Devolvido para" value={selectedItem.devolvido_para || '-'} />
                </div>
              </div>
              {selectedItem.foto_url && (
                <a href={selectedItem.foto_url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-black/8 bg-[#faf7f0]">
                  <img src={selectedItem.foto_url} alt="Anexo do achado" className="h-36 w-full object-cover" />
                  <span className="block px-3 py-2 text-xs font-semibold text-black/60">Abrir foto anexa</span>
                </a>
              )}
            </div>

            <div className="mt-5 grid gap-3 rounded-lg border border-black/8 bg-[#faf7f0] p-4 md:grid-cols-2">
              <Field label="Novo status">
                <select value={draftStatus} onChange={e => setDraftStatus(e.target.value as LostFoundStatus)}>
                  {(['aguardando', 'notificado', 'devolvido', 'descartado'] as LostFoundStatus[]).map(status => <option key={status} value={status}>{roomStatusLabel(status)}</option>)}
                </select>
              </Field>
              {draftStatus === 'devolvido' && (
                <label>
                  <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-black/38">Devolvido para</span>
                  <input value={returnTo} onChange={e => setReturnTo(e.target.value)} placeholder="Nome de quem recebeu" className="h-12 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-[#9d7a4f]" />
                </label>
              )}
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setSelectedItem(null)} className="h-11 rounded-lg border border-black/10 px-5 text-xs font-bold uppercase tracking-[0.16em] text-black/60">Fechar</button>
              <button type="button" disabled={working || !itemCanSave} onClick={saveSelectedItemStatus} className="h-11 rounded-lg bg-[#3a6b4a] px-5 text-xs font-bold uppercase tracking-[0.16em] text-white disabled:opacity-50">
                Salvar atualização
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactElement }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-black/38">{label}</span>
      {React.cloneElement(children, {
        className: 'h-12 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-[#9d7a4f]',
      } as React.HTMLAttributes<HTMLElement>)}
    </label>
  );
}

function Metric({ icon: Icon, label, value, tone }: { icon: LucideIcon; label: string; value: string; tone?: 'warn' }) {
  return (
    <div className="rounded-lg border border-black/8 bg-white p-5 shadow-sm">
      <Icon size={18} className={tone === 'warn' ? 'mb-4 text-red-700' : 'mb-4 text-[#9d7a4f]'} />
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-black/35">{label}</p>
      <p className="mt-2 font-serif text-3xl">{value}</p>
    </div>
  );
}

function Badge({ label, tone }: { label: string; tone: 'red' | 'yellow' | 'green' | 'gray' | 'blue' }) {
  const classes = {
    red: 'bg-red-50 text-red-800',
    yellow: 'bg-amber-50 text-amber-800',
    green: 'bg-emerald-50 text-emerald-800',
    gray: 'bg-gray-100 text-gray-700',
    blue: 'bg-blue-50 text-blue-800',
  };
  return <span className={`h-fit rounded-full px-3 py-1 text-xs font-bold ${classes[tone]}`}>{label}</span>;
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/35">{label}</p>
      <p className="mt-1 font-medium text-black/70">{value}</p>
    </div>
  );
}
