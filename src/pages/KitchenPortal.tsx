import React, { useEffect, useRef, useMemo, useState } from 'react';
import {
  ArrowLeft, BarChart3, Boxes, ChefHat, Check, ChevronDown, ChevronUp,
  Eye, EyeOff, ImagePlus, Loader2, Minus, Plus, ReceiptText, Truck,
  UtensilsCrossed, WalletCards, X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { LucideIcon } from 'lucide-react';
import type { RestaurantProductInput } from '../types/restaurant';
import {
  adjustRestaurantStock, closeRestaurantCash, closeRestaurantTab,
  createRestaurantOrder, getRestaurantSummary, openRestaurantCash,
  openRestaurantTab, saveRestaurantProduct, updateRestaurantOrderStatus,
} from '../services/restaurant';
import type {
  RestaurantOrder, RestaurantOrderStatus, RestaurantPaymentMethod,
  RestaurantProduct, RestaurantSummary, RestaurantTab,
} from '../types/restaurant';

type KitchenTab = 'orders' | 'tables' | 'stock' | 'finance' | 'reports';
type Cart = Record<string, number>;

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const EMPTY_SUMMARY: RestaurantSummary = {
  products: [], categories: [], orders: [], tabs: [], sales: [], cashSession: null,
  stockMovements: [], receivables: [], payables: [], staff: [],
  metrics: { activeOrders: 0, openTabs: 0, lowStock: 0, dailyRevenue: 0, pendingRevenue: 0 },
};

const NAV_TABS: { id: KitchenTab; label: string; icon: LucideIcon }[] = [
  { id: 'orders', label: 'Pedidos', icon: ChefHat },
  { id: 'tables', label: 'Comandas', icon: ReceiptText },
  { id: 'stock', label: 'Estoque', icon: Boxes },
  { id: 'finance', label: 'Financeiro', icon: WalletCards },
  { id: 'reports', label: 'Relatorios', icon: BarChart3 },
];

const PAYMENT_LABELS: Record<RestaurantPaymentMethod, string> = {
  card: 'Cartao', pix: 'Pix', cash: 'Dinheiro', room: 'Conta do quarto', courtesy: 'Cortesia',
};

function cents(v: number) { return BRL.format(Number(v || 0) / 100); }

function categoryNameOf(p: RestaurantProduct) {
  const c = p.restaurant_categories;
  if (Array.isArray(c)) return c[0]?.name || 'Sem categoria';
  return c?.name || 'Sem categoria';
}

function tableLabel(tab: RestaurantTab) {
  const t = tab.restaurant_tables;
  const v = Array.isArray(t) ? t[0] : t;
  return v?.location || v?.code || tab.code || 'Restaurante';
}

function roomLabel(origin: string, allTabs: RestaurantTab[]) {
  const tab = allTabs.find(t => t.code === origin);
  if (tab) return tableLabel(tab);
  if (origin === 'guest') return 'Hospede (app)';
  if (origin === 'garcom') return 'Garcom';
  return origin || 'Restaurante';
}

function statusLabel(s: string) {
  const L: Record<string, string> = {
    new: 'Novo', preparing: 'Preparando', ready: 'Pronto',
    delivered: 'Entregue', cancelled: 'Cancelado',
    open: 'Aberta', pending_payment: 'Aguard. pagamento', paid: 'Paga',
  };
  return L[s] || s;
}

// ============================================================

export function KitchenPortal({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<KitchenTab>('orders');
  const [summary, setSummary] = useState<RestaurantSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const openTabs = useMemo(() => summary.tabs.filter(t => t.status === 'open' || t.status === 'pending_payment'), [summary.tabs]);
  const lowStockProducts = useMemo(() => summary.products.filter(p => Number(p.stock_quantity) < Number(p.min_stock)), [summary.products]);
  const activeOrders = useMemo(() => summary.orders.filter(o => ['new', 'preparing', 'ready'].includes(o.status)), [summary.orders]);

  const run = async (msg: string, op: () => Promise<unknown>) => {
    setWorking(true); setError(''); setNotice('');
    try {
      await op();
      setSummary(await getRestaurantSummary());
      setNotice(msg);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nao foi possivel concluir a operacao.');
    } finally {
      setWorking(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getRestaurantSummary()
      .then(d => { if (mounted) setSummary(d); })
      .catch(e => { if (mounted) setError(e instanceof Error ? e.message : 'Erro ao carregar.'); })
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
            <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#d7b98d]">Restaurante & cozinha</p>
            <h1 className="font-serif text-3xl">Operacao gastronomica</h1>
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
          <Metric icon={ChefHat} label="Pedidos ativos" value={loading ? '...' : String(summary.metrics.activeOrders)} />
          <Metric icon={ReceiptText} label="Comandas abertas" value={loading ? '...' : String(summary.metrics.openTabs)} />
          <Metric icon={Boxes} label="Alertas estoque" value={loading ? '...' : String(summary.metrics.lowStock)} tone={summary.metrics.lowStock ? 'warn' : 'ok'} />
          <Metric icon={WalletCards} label="Vendas do dia" value={loading ? '...' : cents(summary.metrics.dailyRevenue)} />
        </div>

        <nav className="mb-6 flex gap-2 overflow-x-auto rounded-lg border border-black/8 bg-white p-2 shadow-sm">
          {NAV_TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)} className={`flex h-11 shrink-0 items-center gap-2 rounded-md px-4 text-xs font-bold uppercase tracking-[0.16em] transition ${activeTab === id ? 'bg-[#20140d] text-white' : 'text-black/48 hover:bg-black/5 hover:text-black/75'}`}>
              <Icon size={15} />{label}
            </button>
          ))}
        </nav>

        {loading ? (
          <div className="flex min-h-[360px] items-center justify-center rounded-lg border border-black/8 bg-white">
            <Loader2 className="animate-spin text-[#9d7a4f]" size={30} />
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
            <section className="space-y-6">
              {activeTab === 'orders' && (
                <OrdersPanel
                  orders={summary.orders}
                  products={summary.products}
                  tabs={openTabs}
                  allTabs={summary.tabs}
                  working={working}
                  onCreateOrder={input => run('Pedido lancado.', () => createRestaurantOrder(input))}
                  onUpdateStatus={(id, status) => run('Status atualizado.', () => updateRestaurantOrderStatus(id, status))}
                />
              )}
              {activeTab === 'tables' && (
                <TablesPanel
                  tabs={summary.tabs}
                  orders={summary.orders}
                  working={working}
                  onOpenTab={(code, loc) => run('Comanda aberta.', () => openRestaurantTab({ tableCode: code, location: loc }))}
                  onCloseTab={(tabId, method, discount) => run('Comanda fechada.', () => closeRestaurantTab({ tabId, paymentMethod: method, discount }))}
                />
              )}
              {activeTab === 'stock' && (
                <StockPanel
                  products={summary.products}
                  lowStockProducts={lowStockProducts}
                  working={working}
                  onSaveProduct={input => run('Produto salvo.', () => saveRestaurantProduct(input))}
                  onAdjustStock={(productId, qty, reason) => run('Estoque atualizado.', () => adjustRestaurantStock({ productId, quantity: qty, reason }))}
                />
              )}
              {activeTab === 'finance' && (
                <FinancePanel
                  summary={summary}
                  working={working}
                  onOpenCash={amt => run('Caixa aberto.', () => openRestaurantCash({ openingAmount: amt }))}
                  onCloseCash={(id, amt) => run('Caixa fechado.', () => closeRestaurantCash({ sessionId: id, closingAmount: amt }))}
                />
              )}
              {activeTab === 'reports' && <ReportsPanel summary={summary} />}
            </section>

            <aside className="space-y-4">
              <LiveQueue orders={activeOrders} allTabs={summary.tabs} />
              {lowStockProducts.length > 0 && (
                <section className="rounded-lg border border-black/8 bg-white p-5 shadow-sm">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.24em] text-black/35">Estoque critico</p>
                  <div className="space-y-2">
                    {lowStockProducts.map(item => (
                      <div key={item.id} className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2 text-sm text-red-900">
                        <span>{item.name}</span>
                        <strong>{Number(item.stock_quantity)}/{Number(item.min_stock)}</strong>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}

// ---------- LiveQueue ----------

function LiveQueue({ orders, allTabs }: { orders: RestaurantOrder[]; allTabs: RestaurantTab[] }) {
  const byRoom = useMemo(() => {
    const groups: Record<string, RestaurantOrder[]> = {};
    for (const o of orders) {
      const key = o.origin || 'restaurante';
      if (!groups[key]) groups[key] = [];
      groups[key].push(o);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [orders]);

  return (
    <section className="rounded-lg border border-black/8 bg-[#151d18] p-5 text-white shadow-sm">
      <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.28em] text-[#d7b98d]">Fila ao vivo</p>
      {byRoom.length === 0 && <p className="text-sm text-white/45">Sem pedidos ativos.</p>}
      <div className="space-y-4">
        {byRoom.map(([origin, roomOrders]) => (
          <div key={origin}>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
              {roomLabel(origin, allTabs)}
            </p>
            <div className="space-y-1.5">
              {roomOrders.map(o => (
                <div key={o.id} className="flex items-start justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold">{o.order_number}</p>
                    <p className="mt-0.5 truncate text-[11px] leading-4 text-white/50">
                      {(o.restaurant_order_items || []).map(i => `${i.quantity}x ${i.name}`).join(', ') || '—'}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    o.status === 'new' ? 'bg-amber-500/20 text-amber-300' :
                    o.status === 'preparing' ? 'bg-blue-500/20 text-blue-300' :
                    'bg-emerald-500/20 text-emerald-300'
                  }`}>{statusLabel(o.status)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------- OrdersPanel ----------

function OrdersPanel({ orders, products, tabs, allTabs, working, onCreateOrder, onUpdateStatus }: {
  orders: RestaurantOrder[];
  products: RestaurantProduct[];
  tabs: RestaurantTab[];
  allTabs: RestaurantTab[];
  working: boolean;
  onCreateOrder: (input: { tabId: string; origin: string; items: { productId: string; quantity: number }[] }) => void;
  onUpdateStatus: (orderId: string, status: RestaurantOrderStatus) => void;
}) {
  const [selectedTabId, setSelectedTabId] = useState('');
  const [cart, setCart] = useState<Cart>({});
  const [filter, setFilter] = useState<RestaurantOrderStatus | 'all'>('all');

  const activeProducts = useMemo(() => products.filter(p => p.active), [products]);

  useEffect(() => {
    if (!selectedTabId && tabs[0]) setSelectedTabId(tabs[0].id);
  }, [tabs, selectedTabId]);

  const addToCart = (id: string) => setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  const adjustCart = (id: string, delta: number) => setCart(prev => {
    const next = { ...prev, [id]: (prev[id] || 0) + delta };
    if (next[id] <= 0) delete next[id];
    return next;
  });

  const cartEntries = useMemo(() => Object.entries(cart).filter(([, q]) => q > 0), [cart]);
  const cartTotal = useMemo(() => cartEntries.reduce((sum, [id, qty]) => {
    const p = products.find(x => x.id === id);
    return sum + (p ? Number(p.sale_price) * qty : 0);
  }, 0), [cartEntries, products]);

  const handleLaunch = () => {
    if (!selectedTabId || cartEntries.length === 0) return;
    const tab = tabs.find(t => t.id === selectedTabId);
    onCreateOrder({ tabId: selectedTabId, origin: tab?.code || 'Restaurante', items: cartEntries.map(([productId, quantity]) => ({ productId, quantity })) });
    setCart({});
  };

  const ordersByRoom = useMemo(() => {
    const src = filter === 'all' ? orders : orders.filter(o => o.status === filter);
    const groups: Record<string, { label: string; orders: RestaurantOrder[] }> = {};
    for (const o of src) {
      const key = o.origin || 'restaurante';
      if (!groups[key]) groups[key] = { label: roomLabel(key, allTabs), orders: [] };
      groups[key].orders.push(o);
    }
    for (const g of Object.values(groups)) {
      g.orders.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }
    return Object.values(groups).sort((a, b) => a.label.localeCompare(b.label));
  }, [orders, filter, allTabs]);

  const FILTERS = [
    { id: 'all' as const, label: 'Todos' },
    { id: 'new' as const, label: 'Novos' },
    { id: 'preparing' as const, label: 'Preparando' },
    { id: 'ready' as const, label: 'Prontos' },
    { id: 'delivered' as const, label: 'Entregues' },
  ];

  return (
    <div className="space-y-5">
      <Panel title="Novo pedido" icon={ChefHat}>
        {tabs.length === 0 ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Nenhuma comanda aberta. Abra uma na aba Comandas primeiro.
          </p>
        ) : (
          <>
            <div className="mb-4">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-black/38">Para qual quarto / mesa?</p>
              <div className="flex flex-wrap gap-2">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTabId(tab.id)}
                    className={`rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${
                      selectedTabId === tab.id
                        ? 'border-[#3a6b4a] bg-[#3a6b4a] text-white'
                        : 'border-black/10 bg-white hover:border-[#9d7a4f]'
                    }`}
                  >
                    {tableLabel(tab)}
                  </button>
                ))}
              </div>
            </div>

            {activeProducts.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-black/38">Toque no item para adicionar</p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {activeProducts.map(p => {
                    const qty = cart[p.id] || 0;
                    return (
                      <div key={p.id} className={`flex items-center justify-between rounded-lg border p-3 transition ${qty > 0 ? 'border-[#3a6b4a]/40 bg-[#3a6b4a]/5' : 'border-black/8 bg-white'}`}>
                        <button className="flex-1 text-left" onClick={() => addToCart(p.id)}>
                          <p className="text-sm font-semibold leading-tight">{p.name}</p>
                          <p className="text-xs text-black/45">{cents(p.sale_price)}</p>
                        </button>
                        {qty > 0 ? (
                          <div className="ml-2 flex items-center gap-1">
                            <button onClick={() => adjustCart(p.id, -1)} className="flex h-7 w-7 items-center justify-center rounded-full bg-black/8 hover:bg-black/15"><Minus size={11} /></button>
                            <span className="w-6 text-center text-sm font-bold">{qty}</span>
                            <button onClick={() => adjustCart(p.id, 1)} className="flex h-7 w-7 items-center justify-center rounded-full bg-[#3a6b4a] text-white hover:bg-[#2f5a3d]"><Plus size={11} /></button>
                          </div>
                        ) : (
                          <button onClick={() => addToCart(p.id)} className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#efe4d4] text-[#735333] hover:bg-[#dfd4c4]">
                            <Plus size={14} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {cartEntries.length > 0 && (
              <div className="rounded-lg border border-[#3a6b4a]/20 bg-[#3a6b4a]/5 p-3">
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {cartEntries.map(([id, qty]) => {
                    const p = products.find(x => x.id === id);
                    return (
                      <span key={id} className="flex items-center gap-1.5 rounded-full border border-[#3a6b4a]/20 bg-white px-3 py-1 text-xs font-semibold">
                        {qty}x {p?.name}
                        <button onClick={() => adjustCart(id, -qty)} className="text-black/35 hover:text-red-600"><X size={11} /></button>
                      </span>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#3a6b4a]">Total: {cents(cartTotal)}</span>
                  <button
                    disabled={working || !selectedTabId}
                    onClick={handleLaunch}
                    className="flex h-10 items-center gap-2 rounded-lg bg-[#3a6b4a] px-5 text-xs font-bold uppercase tracking-[0.18em] text-white disabled:opacity-50"
                  >
                    <Check size={13} /> Lancar pedido
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Panel>

      <Panel title="Pedidos por quarto" icon={ReceiptText}>
        <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
          {FILTERS.map(({ id, label }) => {
            const count = id === 'all' ? orders.length : orders.filter(o => o.status === id).length;
            return (
              <button
                key={id}
                onClick={() => setFilter(id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition ${filter === id ? 'bg-[#20140d] text-white' : 'bg-black/5 text-black/55 hover:bg-black/10'}`}
              >
                {label}
                {count > 0 && (
                  <span className={`rounded-full px-1.5 text-[9px] font-bold ${filter === id ? 'bg-white/20 text-white' : 'bg-black/10 text-black/55'}`}>{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {ordersByRoom.length === 0 ? (
          <Empty text={filter === 'all' ? 'Nenhum pedido registrado.' : 'Nenhum pedido com esse status.'} />
        ) : (
          <div className="space-y-5">
            {ordersByRoom.map(({ label, orders: roomOrders }) => (
              <div key={label}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-black/40">{label}</span>
                  <span className="rounded-full bg-black/8 px-2 py-0.5 text-[10px] font-bold text-black/50">{roomOrders.length}</span>
                </div>
                <div className="space-y-2">
                  {roomOrders.map(order => (
                    <OrderCard key={order.id} order={order} working={working} onUpdateStatus={onUpdateStatus} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

// ---------- OrderCard ----------

function OrderCard({ order, working, onUpdateStatus }: {
  order: RestaurantOrder;
  working: boolean;
  onUpdateStatus: (orderId: string, status: RestaurantOrderStatus) => void;
}) {
  type SC = { badge: string; nextStatus?: RestaurantOrderStatus; actionLabel?: string; actionClass?: string };
  const CONFIG: Record<RestaurantOrderStatus, SC> = {
    new: { badge: 'border-amber-200 bg-amber-50 text-amber-800', nextStatus: 'preparing', actionLabel: 'Iniciar preparo', actionClass: 'bg-amber-500 text-white hover:bg-amber-600' },
    preparing: { badge: 'border-blue-200 bg-blue-50 text-blue-800', nextStatus: 'ready', actionLabel: 'Marcar pronto', actionClass: 'bg-blue-600 text-white hover:bg-blue-700' },
    ready: { badge: 'border-emerald-200 bg-emerald-50 text-emerald-800', nextStatus: 'delivered', actionLabel: 'Confirmar entrega', actionClass: 'bg-[#3a6b4a] text-white hover:bg-[#2f5a3d]' },
    delivered: { badge: 'border-gray-200 bg-gray-50 text-gray-500' },
    cancelled: { badge: 'border-red-200 bg-red-50 text-red-700' },
  };

  const cfg = CONFIG[order.status];
  const canCancel = !['delivered', 'cancelled'].includes(order.status);
  const elapsed = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000);

  return (
    <article className="rounded-lg border border-black/8 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{order.order_number}</p>
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${cfg.badge}`}>{statusLabel(order.status)}</span>
            {elapsed < 120 && <span className="text-xs text-black/40">ha {elapsed}min</span>}
          </div>
          <p className="mt-0.5 text-xs text-black/45">{cents(order.total)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {cfg.nextStatus && cfg.actionLabel && (
            <button
              disabled={working}
              onClick={() => onUpdateStatus(order.id, cfg.nextStatus!)}
              className={`flex h-9 items-center gap-1.5 rounded-lg px-4 text-xs font-bold transition disabled:opacity-50 ${cfg.actionClass}`}
            >
              <Check size={13} /> {cfg.actionLabel}
            </button>
          )}
          {canCancel && (
            <button
              disabled={working}
              onClick={() => onUpdateStatus(order.id, 'cancelled')}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-red-100 bg-red-50 px-3 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
            >
              <X size={13} /> Cancelar
            </button>
          )}
        </div>
      </div>
      {(order.restaurant_order_items || []).length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(order.restaurant_order_items || []).map(item => (
            <span key={item.id} className="rounded-full border border-black/8 bg-[#faf7f0] px-3 py-1 text-xs font-medium text-black/65">
              {Number(item.quantity)}x {item.name}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}

// ---------- TablesPanel ----------

function TablesPanel({ tabs, orders, working, onOpenTab, onCloseTab }: {
  tabs: RestaurantTab[];
  orders: RestaurantOrder[];
  working: boolean;
  onOpenTab: (tableCode: string, location: string) => void;
  onCloseTab: (tabId: string, paymentMethod: RestaurantPaymentMethod, discount: number) => void;
}) {
  const [tableCode, setTableCode] = useState('');
  const [location, setLocation] = useState('');
  const [tabPayments, setTabPayments] = useState<Record<string, RestaurantPaymentMethod>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const getTabOrders = (tabId: string) => orders.filter(o => o.tab_id === tabId);
  const toggleExpand = (tabId: string) => setExpanded(prev => ({ ...prev, [tabId]: !prev[tabId] }));
  const setPayment = (tabId: string, method: RestaurantPaymentMethod) => setTabPayments(prev => ({ ...prev, [tabId]: method }));

  const handleOpen = () => {
    if (!tableCode.trim()) return;
    onOpenTab(tableCode.trim().toUpperCase(), location.trim() || tableCode.trim());
    setTableCode(''); setLocation('');
  };

  return (
    <Panel title="Comandas" icon={ReceiptText}>
      <div className="mb-5 grid gap-3 rounded-lg border border-black/8 bg-[#faf7f0] p-4 md:grid-cols-[1fr_1fr_auto]">
        <Field label="Quarto / Mesa">
          <input value={tableCode} onChange={e => setTableCode(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleOpen()} placeholder="Q01, DECK-01..." />
        </Field>
        <Field label="Descricao (opcional)">
          <input value={location} onChange={e => setLocation(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleOpen()} placeholder="Quarto 01" />
        </Field>
        <button
          disabled={working || !tableCode.trim()}
          onClick={handleOpen}
          className="h-12 self-end rounded-lg bg-[#20140d] px-5 text-xs font-bold uppercase tracking-[0.18em] text-white disabled:opacity-50"
        >
          Abrir comanda
        </button>
      </div>

      <div className="space-y-3">
        {tabs.map(tab => {
          const isOpen = tab.status === 'open' || tab.status === 'pending_payment';
          const isExpanded = !!expanded[tab.id];
          const tabOrders = getTabOrders(tab.id);
          const payment = tabPayments[tab.id] || 'card';

          return (
            <article key={tab.id} className="overflow-hidden rounded-lg border border-black/8 bg-white">
              <div className="flex cursor-pointer items-center justify-between gap-3 p-4 transition hover:bg-[#faf7f0]" onClick={() => toggleExpand(tab.id)}>
                <div className="flex flex-wrap items-center gap-3">
                  <div>
                    <p className="font-semibold">{tableLabel(tab)}</p>
                    <p className="text-xs text-black/45">{tab.code}</p>
                  </div>
                  <span className={`rounded-full px-3 py-0.5 text-xs font-bold ${isOpen ? 'bg-[#efe4d4] text-[#735333]' : tab.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-500'}`}>
                    {statusLabel(tab.status)}
                  </span>
                  {tabOrders.length > 0 && (
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                      {tabOrders.length} pedido{tabOrders.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <strong>{cents(tab.total)}</strong>
                  {isExpanded ? <ChevronUp size={16} className="text-black/35" /> : <ChevronDown size={16} className="text-black/35" />}
                </div>
              </div>

              {isExpanded && (
                <div className="space-y-4 border-t border-black/6 p-4">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-[#faf7f0] px-3 py-2 text-xs"><p className="text-black/45">Subtotal</p><p className="mt-0.5 font-semibold">{cents(tab.subtotal)}</p></div>
                    <div className="rounded-lg bg-[#faf7f0] px-3 py-2 text-xs"><p className="text-black/45">Desconto</p><p className="mt-0.5 font-semibold">{cents(tab.discount || 0)}</p></div>
                    <div className="rounded-lg bg-[#efe4d4] px-3 py-2 text-xs"><p className="text-[#735333]/60">Total</p><p className="mt-0.5 font-serif text-base font-semibold text-[#735333]">{cents(tab.total)}</p></div>
                  </div>

                  {tabOrders.length > 0 && (
                    <div>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-black/35">Itens pedidos</p>
                      <div className="space-y-1.5">
                        {tabOrders.map(order => (
                          <div key={order.id} className="flex items-center justify-between rounded-lg bg-[#faf7f0] px-3 py-2 text-sm">
                            <div className="min-w-0">
                              <span className="font-semibold">{order.order_number}</span>
                              {(order.restaurant_order_items || []).length > 0 && (
                                <span className="ml-2 truncate text-xs text-black/45">
                                  {(order.restaurant_order_items || []).map(i => `${i.quantity}x ${i.name}`).join(', ')}
                                </span>
                              )}
                            </div>
                            <div className="ml-3 flex shrink-0 items-center gap-2">
                              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                                order.status === 'new' ? 'border-amber-200 bg-amber-50 text-amber-700' :
                                order.status === 'preparing' ? 'border-blue-200 bg-blue-50 text-blue-700' :
                                order.status === 'ready' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' :
                                order.status === 'delivered' ? 'border-gray-200 bg-gray-50 text-gray-600' :
                                'border-red-200 bg-red-50 text-red-700'
                              }`}>{statusLabel(order.status)}</span>
                              <span className="text-black/55">{cents(order.total)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {isOpen && (
                    <div className="flex items-end gap-3 rounded-lg border border-black/8 bg-[#faf7f0] p-3">
                      <div className="flex-1">
                        <Field label="Forma de pagamento">
                          <select value={payment} onChange={e => setPayment(tab.id, e.target.value as RestaurantPaymentMethod)}>
                            {(Object.entries(PAYMENT_LABELS) as [RestaurantPaymentMethod, string][]).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                          </select>
                        </Field>
                      </div>
                      <button
                        disabled={working || tab.total <= 0}
                        onClick={() => onCloseTab(tab.id, payment, 0)}
                        className="flex h-12 shrink-0 items-center gap-2 rounded-lg bg-[#3a6b4a] px-4 text-xs font-bold uppercase tracking-[0.16em] text-white disabled:opacity-45"
                      >
                        <Check size={14} /> Fechar · {cents(tab.total)}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}
        {tabs.length === 0 && <Empty text="Nenhuma comanda aberta." />}
      </div>
    </Panel>
  );
}

// ---------- StockPanel ----------

function StockPanel({ products, lowStockProducts, working, onSaveProduct, onAdjustStock }: {
  products: RestaurantProduct[];
  lowStockProducts: RestaurantProduct[];
  working: boolean;
  onSaveProduct: (input: RestaurantProductInput) => void;
  onAdjustStock: (productId: string, quantity: number, reason: string) => void;
}) {
  const [view, setView] = useState<'entry' | 'products'>('entry');
  const [entryProductId, setEntryProductId] = useState('');
  const [entryQty, setEntryQty] = useState(1);
  const [entryReason, setEntryReason] = useState('Compra recebida');
  const [name, setName] = useState('');
  const [categoryName, setCategoryName] = useState('Pratos');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [salePrice, setSalePrice] = useState(0);
  const [costPrice, setCostPrice] = useState(0);
  const [stockQuantity, setStockQuantity] = useState(0);
  const [minStock, setMinStock] = useState(0);
  const [showOnGuestMenu, setShowOnGuestMenu] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!entryProductId) {
      const first = lowStockProducts[0] || products[0];
      if (first) setEntryProductId(first.id);
    }
  }, [products, lowStockProducts, entryProductId]);

  const handleImageUpload = async (file: File) => {
    setImageUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('restaurant-images').upload(path, file, { upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from('restaurant-images').getPublicUrl(path);
      setImageUrl(data.publicUrl);
    } catch { /* silently fail */ } finally {
      setImageUploading(false);
    }
  };

  const fillFromLowStock = (product: RestaurantProduct) => {
    const needed = Math.max(1, Number(product.min_stock) - Number(product.stock_quantity));
    setEntryProductId(product.id);
    setEntryQty(needed);
    setEntryReason('Compra recebida');
  };

  const handleEntry = () => {
    if (!entryProductId || entryQty <= 0) return;
    onAdjustStock(entryProductId, entryQty, entryReason || 'Entrada de estoque');
    setEntryQty(1);
  };

  const handleSaveProduct = () => {
    onSaveProduct({
      categoryName, sku, name, description: description.trim() || undefined,
      unit: 'un', costPrice, salePrice, stockQuantity, minStock,
      showOnGuestMenu, imageUrl: imageUrl.trim() || null,
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-2 rounded-lg border border-black/8 bg-white p-2 shadow-sm">
        {([
          { id: 'entry' as const, label: 'Entrada de estoque', icon: Truck },
          { id: 'products' as const, label: 'Cadastrar produto', icon: Boxes },
        ]).map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setView(id)} className={`flex h-11 flex-1 items-center justify-center gap-2 rounded-md text-xs font-bold uppercase tracking-[0.16em] transition ${view === id ? 'bg-[#20140d] text-white' : 'text-black/48 hover:bg-black/5'}`}>
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      {view === 'entry' && (
        <Panel title="Entrada de estoque" icon={Truck}>
          <div className="mb-5 space-y-3 rounded-lg border border-black/8 bg-[#faf7f0] p-4">
            <div className="grid gap-3 md:grid-cols-[1fr_120px_1fr_auto]">
              <Field label="Produto">
                <select value={entryProductId} onChange={e => setEntryProductId(e.target.value)}>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} (estoque: {Number(p.stock_quantity)})</option>)}
                </select>
              </Field>
              <Field label="Quantidade">
                <input type="number" min={1} step={1} value={entryQty} onChange={e => setEntryQty(Number(e.target.value))} />
              </Field>
              <Field label="Motivo">
                <input value={entryReason} onChange={e => setEntryReason(e.target.value)} placeholder="Compra recebida" />
              </Field>
              <button
                disabled={working || !entryProductId || entryQty <= 0}
                onClick={handleEntry}
                className="h-12 self-end rounded-lg bg-[#3a6b4a] px-5 text-xs font-bold uppercase tracking-[0.18em] text-white disabled:opacity-50"
              >
                Registrar
              </button>
            </div>
          </div>

          {lowStockProducts.length > 0 && (
            <div className="mb-5">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-black/35">Itens abaixo do minimo</p>
              <div className="space-y-2">
                {lowStockProducts.map(product => {
                  const needed = Math.max(0, Number(product.min_stock) - Number(product.stock_quantity));
                  return (
                    <div key={product.id} className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-900">
                      <div>
                        <span className="font-semibold">{product.name}</span>
                        <span className="ml-3 text-xs text-red-700/60">Atual: {Number(product.stock_quantity)} · Mínimo: {Number(product.min_stock)}</span>
                      </div>
                      <button onClick={() => fillFromLowStock(product)} className="shrink-0 rounded-lg bg-red-700 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-800">
                        Preencher ({needed} un.)
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="overflow-hidden rounded-lg border border-black/8">
            <div className="border-b border-black/6 bg-[#faf7f0] px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/35">Todos os produtos</p>
            </div>
            {products.map(item => {
              const low = Number(item.stock_quantity) < Number(item.min_stock);
              return (
                <div key={item.id} className="grid gap-3 border-b border-black/6 bg-white px-4 py-3 text-sm last:border-b-0 md:grid-cols-[auto_1fr_140px_120px_100px] md:items-center">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="h-10 w-10 shrink-0 rounded-lg border border-black/8 object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-dashed border-black/10 bg-[#faf7f0]">
                      <UtensilsCrossed size={14} className="text-black/20" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{item.name}</p>
                      {item.show_on_guest_menu && <span className="rounded-full bg-[#3a6b4a]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#3a6b4a]">Cardapio</span>}
                    </div>
                    <p className="text-xs text-black/42">{categoryNameOf(item)} · {item.sku || 'sem SKU'}</p>
                  </div>
                  <span>{cents(item.sale_price)}</span>
                  <span className={low ? 'font-bold text-red-700' : 'text-emerald-700'}>{Number(item.stock_quantity)} em estoque</span>
                  <span className="text-black/45">min. {Number(item.min_stock)}</span>
                </div>
              );
            })}
            {products.length === 0 && <Empty text="Nenhum produto cadastrado." />}
          </div>
        </Panel>
      )}

      {view === 'products' && (
        <Panel title="Cadastrar produto" icon={Boxes}>
          <div className="space-y-4 rounded-lg border border-black/8 bg-[#faf7f0] p-4">
            <div className="grid gap-3 md:grid-cols-4">
              <Field label="Nome do produto"><input value={name} onChange={e => setName(e.target.value)} /></Field>
              <Field label="Categoria"><input value={categoryName} onChange={e => setCategoryName(e.target.value)} /></Field>
              <Field label="SKU"><input value={sku} onChange={e => setSku(e.target.value)} /></Field>
              <Field label="Preco venda (centavos)"><input type="number" min={0} value={salePrice} onChange={e => setSalePrice(Number(e.target.value))} /></Field>
              <Field label="Custo (centavos)"><input type="number" min={0} value={costPrice} onChange={e => setCostPrice(Number(e.target.value))} /></Field>
              <Field label="Estoque inicial"><input type="number" min={0} value={stockQuantity} onChange={e => setStockQuantity(Number(e.target.value))} /></Field>
              <Field label="Estoque minimo"><input type="number" min={0} value={minStock} onChange={e => setMinStock(Number(e.target.value))} /></Field>
            </div>

            <Field label="Descricao (cardapio do hospede)">
              <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Opcional — aparece abaixo do nome no cardapio" />
            </Field>

            <div>
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-black/38">Foto do produto</span>
              <div className="flex items-center gap-3">
                {imageUrl ? (
                  <img src={imageUrl} alt="preview" className="h-14 w-14 shrink-0 rounded-lg border border-black/8 object-cover" />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-dashed border-black/15 bg-white">
                    <ImagePlus size={20} className="text-black/25" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="URL da imagem" className="h-10 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-[#9d7a4f]" />
                  <div className="mt-1.5 flex gap-2">
                    <button type="button" onClick={() => fileRef.current?.click()} disabled={imageUploading} className="flex items-center gap-1.5 rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-black/60 transition hover:border-[#9d7a4f] disabled:opacity-50">
                      {imageUploading ? <Loader2 size={12} className="animate-spin" /> : <ImagePlus size={12} />}
                      {imageUploading ? 'Enviando...' : 'Upload'}
                    </button>
                    {imageUrl && (
                      <button type="button" onClick={() => setImageUrl('')} className="flex items-center gap-1 rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs text-red-600 transition hover:border-red-200">
                        <X size={12} /> Remover
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <input ref={fileRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.target.value = ''; }} />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-black/8 bg-white px-4 py-3">
              <div>
                <p className="text-sm font-semibold">Exibir no cardapio do hospede</p>
                <p className="text-xs text-black/45">Itens marcados aparecem no app do hospede.</p>
              </div>
              <button type="button" onClick={() => setShowOnGuestMenu(v => !v)} className={`flex h-8 w-14 items-center rounded-full border px-1 transition-colors ${showOnGuestMenu ? 'border-[#3a6b4a] bg-[#3a6b4a]' : 'border-black/15 bg-black/8'}`}>
                <span className={`h-6 w-6 rounded-full bg-white shadow transition-transform ${showOnGuestMenu ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {showOnGuestMenu ? <Eye size={13} className="text-[#3a6b4a]" /> : <EyeOff size={13} className="text-black/30" />}
                <span className="text-xs text-black/45">{showOnGuestMenu ? 'Visivel no cardapio do hospede' : 'Apenas uso interno'}</span>
              </div>
              <button
                disabled={working || imageUploading || name.trim().length < 2}
                onClick={handleSaveProduct}
                className="h-11 rounded-lg bg-[#20140d] px-6 text-xs font-bold uppercase tracking-[0.18em] text-white disabled:opacity-50"
              >
                Salvar produto
              </button>
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}

// ---------- FinancePanel ----------

function FinancePanel({ summary, working, onOpenCash, onCloseCash }: {
  summary: RestaurantSummary;
  working: boolean;
  onOpenCash: (openingAmount: number) => void;
  onCloseCash: (sessionId: string, closingAmount: number) => void;
}) {
  const [openingAmount, setOpeningAmount] = useState(0);
  const [closingAmount, setClosingAmount] = useState(0);

  const session = summary.cashSession;
  const receivables = summary.receivables ?? [];
  const payables = summary.payables ?? [];
  const paidSales = summary.sales.filter(s => s.status === 'paid');
  const totalReceived = paidSales.reduce((sum, s) => sum + s.total, 0);
  const cashSales = paidSales.filter(s => s.payment_method === 'cash').reduce((sum, s) => sum + s.total, 0);
  const expectedCash = Number(session?.opening_amount || 0) + cashSales;
  const totalReceivables = receivables.reduce((sum, r) => sum + Number(r.amount), 0);
  const totalPayables = payables.reduce((sum, p) => sum + Number(p.amount), 0);

  const paymentBreakdown = (['card', 'pix', 'cash', 'room', 'courtesy'] as RestaurantPaymentMethod[])
    .map(method => {
      const methodSales = paidSales.filter(s => s.payment_method === method);
      return { method, label: PAYMENT_LABELS[method], count: methodSales.length, total: methodSales.reduce((sum, s) => sum + s.total, 0) };
    })
    .filter(x => x.count > 0);

  return (
    <Panel title="Financeiro" icon={WalletCards}>
      <div className="mb-5 space-y-4 rounded-lg border border-black/8 bg-[#faf7f0] p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/35">Caixa</p>
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
          <FinStat label="Status" text={session?.status === 'open' ? 'Aberto' : 'Fechado'} tone={session?.status === 'open' ? 'ok' : 'neutral'} />
          <FinStat label="Abertura" value={session?.opening_amount || 0} />
          <FinStat label="Vendas dinheiro" value={cashSales} />
          <FinStat label="Esperado no caixa" value={expectedCash} />
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <Field label={session?.status === 'open' ? 'Valor de fechamento (R$)' : 'Valor de abertura (R$)'}>
            <input
              type="number" min={0} step={0.01}
              value={session?.status === 'open' ? closingAmount : openingAmount}
              onChange={e => session?.status === 'open' ? setClosingAmount(Number(e.target.value)) : setOpeningAmount(Number(e.target.value))}
            />
          </Field>
          {session?.status === 'open' ? (
            <button disabled={working} onClick={() => onCloseCash(session.id, closingAmount)} className="h-12 self-end rounded-lg bg-[#20140d] px-5 text-xs font-bold uppercase tracking-[0.18em] text-white disabled:opacity-50">Fechar caixa</button>
          ) : (
            <button disabled={working} onClick={() => onOpenCash(openingAmount)} className="h-12 self-end rounded-lg bg-[#3a6b4a] px-5 text-xs font-bold uppercase tracking-[0.18em] text-white disabled:opacity-50">Abrir caixa</button>
          )}
        </div>
      </div>

      <div className="mb-5 overflow-hidden rounded-lg border border-black/8">
        <div className="flex items-center justify-between border-b border-black/6 bg-[#faf7f0] px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/35">Vendas por forma de pagamento</p>
          <span className="text-xs text-black/45">{paidSales.length} venda{paidSales.length !== 1 ? 's' : ''} hoje</span>
        </div>
        {paymentBreakdown.length === 0 && <p className="px-4 py-3 text-sm text-black/45">Nenhuma venda hoje.</p>}
        {paymentBreakdown.map(row => (
          <div key={row.method} className="flex items-center justify-between border-b border-black/6 px-4 py-3 text-sm last:border-b-0">
            <span className="font-medium">{row.label}</span>
            <div className="flex items-center gap-8">
              <span className="text-black/45">{row.count} venda{row.count > 1 ? 's' : ''}</span>
              <strong className="w-28 text-right">{cents(row.total)}</strong>
            </div>
          </div>
        ))}
        {paymentBreakdown.length > 0 && (
          <div className="flex items-center justify-between bg-[#151d18] px-4 py-3 text-white">
            <span className="text-sm font-bold">Total recebido</span>
            <strong className="font-serif text-xl">{cents(totalReceived)}</strong>
          </div>
        )}
      </div>

      {receivables.length > 0 && (
        <div className="mb-5 overflow-hidden rounded-lg border border-black/8">
          <div className="flex items-center justify-between border-b border-black/6 bg-[#faf7f0] px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/35">Contas a receber</p>
            <strong className="text-sm text-emerald-700">{cents(totalReceivables)}</strong>
          </div>
          {receivables.map(r => (
            <div key={r.id} className="flex items-center justify-between border-b border-black/6 px-4 py-3 text-sm last:border-b-0">
              <span>{r.description}</span>
              <div className="flex items-center gap-4">
                <span className="text-xs text-black/45">vence {new Date(r.due_date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                <strong className="w-24 text-right">{cents(Number(r.amount))}</strong>
              </div>
            </div>
          ))}
        </div>
      )}

      {payables.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-black/8">
          <div className="flex items-center justify-between border-b border-black/6 bg-[#faf7f0] px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/35">Contas a pagar</p>
            <strong className="text-sm text-red-700">{cents(totalPayables)}</strong>
          </div>
          {payables.map(p => (
            <div key={p.id} className="flex items-center justify-between border-b border-black/6 px-4 py-3 text-sm last:border-b-0">
              <span>{p.description}</span>
              <div className="flex items-center gap-4">
                <span className="text-xs text-black/45">vence {new Date(p.due_date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                <strong className="w-24 text-right">{cents(Number(p.amount))}</strong>
              </div>
            </div>
          ))}
        </div>
      )}

      {receivables.length === 0 && payables.length === 0 && (
        <Empty text="Sem contas a receber ou a pagar em aberto." />
      )}
    </Panel>
  );
}

function FinStat({ label, value, text, tone }: { label: string; value?: number; text?: string; tone?: 'ok' | 'neutral' }) {
  return (
    <div className="rounded-lg border border-black/8 bg-white px-3 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/38">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${tone === 'ok' ? 'text-emerald-700' : 'text-[#20140d]'}`}>
        {text ?? (value !== undefined ? cents(value) : '—')}
      </p>
    </div>
  );
}

// ---------- ReportsPanel ----------

function ReportsPanel({ summary }: { summary: RestaurantSummary }) {
  const staff = summary.staff ?? [];
  const stockMovements = summary.stockMovements ?? [];
  const staffMap = Object.fromEntries(staff.map(s => [s.id, s.name]));
  const paidSales = summary.sales.filter(s => s.status === 'paid');
  const avgTicket = paidSales.length ? paidSales.reduce((sum, s) => sum + s.total, 0) / paidSales.length : 0;

  const channelLabel = (origin: string) => {
    if (origin === 'guest') return 'Hospede (app)';
    if (origin === 'garcom') return 'Garcom';
    return 'Restaurante';
  };

  const channelGroups = summary.orders.reduce<Record<string, { count: number; total: number }>>((acc, o) => {
    const key = channelLabel(o.origin);
    if (!acc[key]) acc[key] = { count: 0, total: 0 };
    acc[key].count += 1;
    acc[key].total += Number(o.total);
    return acc;
  }, {});

  const employeeGroups = paidSales.reduce<Record<string, { count: number; total: number }>>((acc, s) => {
    const key = s.sold_by ? (staffMap[s.sold_by] || 'Funcionario') : 'Nao identificado';
    if (!acc[key]) acc[key] = { count: 0, total: 0 };
    acc[key].count += 1;
    acc[key].total += Number(s.total);
    return acc;
  }, {});

  const stockIn = stockMovements.filter(m => m.movement_type === 'in');
  const stockOut = stockMovements.filter(m => ['out', 'waste'].includes(m.movement_type));

  const productName = (movement: { restaurant_products?: { name: string; unit: string } | { name: string; unit: string }[] | null }) => {
    const p = movement.restaurant_products;
    const val = Array.isArray(p) ? p[0] : p;
    return { name: val?.name || 'Produto', unit: val?.unit || 'un' };
  };

  return (
    <Panel title="Relatorios" icon={BarChart3}>
      <div className="mb-5 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        <ReportStat label="Vendas do dia" value={summary.metrics.dailyRevenue} />
        <ReportStat label="Ticket medio" value={avgTicket} />
        <ReportStat label="Total de pedidos" value={summary.orders.length} plain />
        <ReportStat label="A receber" value={summary.metrics.pendingRevenue} />
      </div>

      <div className="mb-5 overflow-hidden rounded-lg border border-black/8">
        <div className="border-b border-black/6 bg-[#faf7f0] px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/35">Pedidos por canal</p>
        </div>
        {Object.keys(channelGroups).length === 0 && <p className="px-4 py-3 text-sm text-black/45">Nenhum pedido registrado.</p>}
        {Object.entries(channelGroups).map(([channel, data]) => (
          <div key={channel} className="flex items-center justify-between border-b border-black/6 px-4 py-3 text-sm last:border-b-0">
            <span className="font-medium">{channel}</span>
            <div className="flex items-center gap-8">
              <span className="text-black/45">{data.count} pedido{data.count > 1 ? 's' : ''}</span>
              <strong className="w-28 text-right">{cents(data.total)}</strong>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-5 overflow-hidden rounded-lg border border-black/8">
        <div className="border-b border-black/6 bg-[#faf7f0] px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/35">Vendas por funcionario (hoje)</p>
        </div>
        {Object.keys(employeeGroups).length === 0 && <p className="px-4 py-3 text-sm text-black/45">Nenhuma venda fechada hoje.</p>}
        {Object.entries(employeeGroups).sort(([, a], [, b]) => b.total - a.total).map(([name, data]) => (
          <div key={name} className="flex items-center justify-between border-b border-black/6 px-4 py-3 text-sm last:border-b-0">
            <span className="font-medium">{name}</span>
            <div className="flex items-center gap-8">
              <span className="text-black/45">{data.count} venda{data.count > 1 ? 's' : ''}</span>
              <strong className="w-28 text-right">{cents(data.total)}</strong>
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-black/8">
        <div className="flex items-center justify-between border-b border-black/6 bg-[#faf7f0] px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/35">Movimentacao de estoque hoje</p>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="text-emerald-700">↑ {stockIn.length} entrada{stockIn.length !== 1 ? 's' : ''}</span>
            <span className="text-red-700">↓ {stockOut.length} saida{stockOut.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        {stockMovements.length === 0 && <p className="px-4 py-3 text-sm text-black/45">Nenhuma movimentacao registrada hoje.</p>}
        {stockMovements.map(m => {
          const { name, unit } = productName(m);
          const isIn = m.movement_type === 'in';
          return (
            <div key={m.id} className="flex items-center justify-between border-b border-black/6 px-4 py-3 text-sm last:border-b-0">
              <div className="flex items-center gap-3">
                <span className={`w-5 text-center text-base font-bold ${isIn ? 'text-emerald-600' : 'text-red-600'}`}>{isIn ? '↑' : '↓'}</span>
                <div>
                  <span className="font-medium">{name}</span>
                  {m.reason && <span className="ml-2 text-xs text-black/45">{m.reason}</span>}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-black/45">{new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                <span className={`font-semibold ${isIn ? 'text-emerald-700' : 'text-red-700'}`}>{isIn ? '+' : '-'}{m.quantity} {unit}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

// ---------- Shared ----------

function Panel({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-black/8 bg-white/80 p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#efe4d4] text-[#735333]"><Icon size={18} /></span>
        <h2 className="font-serif text-2xl">{title}</h2>
      </div>
      {children}
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

function Empty({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed border-black/12 bg-[#faf7f0] p-5 text-sm text-black/45">{text}</div>;
}

function Metric({ icon: Icon, label, value, tone }: { icon: LucideIcon; label: string; value: string; tone?: 'warn' | 'ok' }) {
  return (
    <div className="rounded-lg border border-black/8 bg-white p-5 shadow-sm">
      <Icon size={18} className={tone === 'warn' ? 'mb-4 text-red-700' : 'mb-4 text-[#9d7a4f]'} />
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-black/35">{label}</p>
      <p className="mt-2 font-serif text-3xl">{value}</p>
    </div>
  );
}

function ReportStat({ label, value, plain }: { label: string; value: number; plain?: boolean }) {
  return (
    <div className="rounded-lg border border-black/8 bg-[#151d18] p-4 text-white">
      <p className="text-xs text-white/45">{label}</p>
      <p className="mt-2 font-serif text-3xl">{plain ? Math.round(value) : cents(value)}</p>
    </div>
  );
}
