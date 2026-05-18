import React, { useEffect, useRef, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Banknote,
  BarChart3,
  Boxes,
  ChefHat,
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Eye,
  EyeOff,
  ImagePlus,
  Loader2,
  PackagePlus,
  Plus,
  ReceiptText,
  Settings,
  ShoppingCart,
  Trash2,
  Truck,
  UtensilsCrossed,
  WalletCards,
  X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { RestaurantProductInput } from '../types/restaurant';
import type { LucideIcon } from 'lucide-react';
import {
  adjustRestaurantStock,
  closeRestaurantCash,
  closeRestaurantTab,
  createRestaurantOrder,
  getRestaurantSummary,
  openRestaurantCash,
  openRestaurantTab,
  saveRestaurantProduct,
  updateRestaurantOrderStatus,
} from '../services/restaurant';
import type {
  RestaurantOrder,
  RestaurantOrderStatus,
  RestaurantPaymentMethod,
  RestaurantProduct,
  RestaurantSummary,
  RestaurantTab,
} from '../types/restaurant';

type KitchenTab = 'orders' | 'tables' | 'products' | 'purchases' | 'finance' | 'reports' | 'tools';

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const EMPTY_SUMMARY: RestaurantSummary = {
  products: [],
  categories: [],
  orders: [],
  tabs: [],
  sales: [],
  cashSession: null,
  stockMovements: [],
  receivables: [],
  payables: [],
  staff: [],
  metrics: { activeOrders: 0, openTabs: 0, lowStock: 0, dailyRevenue: 0, pendingRevenue: 0 },
};

const TABS: { id: KitchenTab; label: string; icon: LucideIcon }[] = [
  { id: 'orders', label: 'Pedidos', icon: ChefHat },
  { id: 'tables', label: 'Comandas', icon: ReceiptText },
  { id: 'products', label: 'Produtos & Estoque', icon: Boxes },
  { id: 'purchases', label: 'Compras', icon: Truck },
  { id: 'finance', label: 'Financeiro', icon: WalletCards },
  { id: 'reports', label: 'Relatorios', icon: BarChart3 },
  { id: 'tools', label: 'Ferramentas', icon: Settings },
];

const QUICK_ACTIONS = [
  { label: 'Novo pedido', icon: PackagePlus, tab: 'orders' as KitchenTab },
  { label: 'Comandas', icon: ReceiptText, tab: 'tables' as KitchenTab },
  { label: 'Produtos', icon: Boxes, tab: 'products' as KitchenTab },
  { label: 'Caixa', icon: Banknote, tab: 'finance' as KitchenTab },
  { label: 'Compras', icon: ShoppingCart, tab: 'purchases' as KitchenTab },
  { label: 'Estoque', icon: Truck, tab: 'purchases' as KitchenTab },
  { label: 'Relatorios', icon: BarChart3, tab: 'reports' as KitchenTab },
  { label: 'Ferramentas', icon: Settings, tab: 'tools' as KitchenTab },
];

function cents(value: number) {
  return BRL.format(Number(value || 0) / 100);
}

function categoryNameOf(product: RestaurantProduct) {
  const category = product.restaurant_categories;
  if (Array.isArray(category)) return category[0]?.name || 'Sem categoria';
  return category?.name || 'Sem categoria';
}

function tableLabel(tab: RestaurantTab) {
  const table = tab.restaurant_tables;
  const value = Array.isArray(table) ? table[0] : table;
  return value?.location || value?.code || 'Restaurante';
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    new: 'Novo',
    preparing: 'Preparando',
    ready: 'Pronto',
    delivered: 'Entregue',
    cancelled: 'Cancelado',
    open: 'Aberta',
    pending_payment: 'Aguard. pagamento',
    paid: 'Paga',
  };
  return labels[status] || status;
}

export function KitchenPortal({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<KitchenTab>('orders');
  const [summary, setSummary] = useState<RestaurantSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const openTabs = useMemo(
    () => summary.tabs.filter(t => t.status === 'open' || t.status === 'pending_payment'),
    [summary.tabs],
  );
  const lowStockProducts = useMemo(
    () => summary.products.filter(item => Number(item.stock_quantity) < Number(item.min_stock)),
    [summary.products],
  );

  const run = async (message: string, operation: () => Promise<unknown>) => {
    setWorking(true);
    setError('');
    setNotice('');
    try {
      await operation();
      const data = await getRestaurantSummary();
      setSummary(data);
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
    getRestaurantSummary()
      .then(data => { if (mounted) setSummary(data); })
      .catch(err => { if (mounted) setError(err instanceof Error ? err.message : 'Nao foi possivel carregar o restaurante.'); })
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
          <Metric icon={UtensilsCrossed} label="Pedidos ativos" value={loading ? '...' : String(summary.metrics.activeOrders)} />
          <Metric icon={ReceiptText} label="Comandas abertas" value={loading ? '...' : String(summary.metrics.openTabs)} />
          <Metric icon={Boxes} label="Alertas estoque" value={loading ? '...' : String(summary.metrics.lowStock)} tone={summary.metrics.lowStock ? 'warn' : 'ok'} />
          <Metric icon={WalletCards} label="Vendas do dia" value={loading ? '...' : cents(summary.metrics.dailyRevenue)} />
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
          <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <section className="space-y-6">
              <QuickActions setActiveTab={setActiveTab} />

              {activeTab === 'orders' && (
                <OrdersPanel
                  orders={summary.orders}
                  products={summary.products}
                  tabs={openTabs}
                  working={working}
                  onCreateOrder={(input) => run('Pedido lancado e estoque baixado.', () => createRestaurantOrder(input))}
                  onUpdateStatus={(orderId, status) => run('Status do pedido atualizado.', () => updateRestaurantOrderStatus(orderId, status))}
                />
              )}
              {activeTab === 'tables' && (
                <TablesPanel
                  tabs={summary.tabs}
                  orders={summary.orders}
                  working={working}
                  onOpenTab={(tableCode, location) => run('Comanda aberta.', () => openRestaurantTab({ tableCode, location }))}
                  onCloseTab={(tabId, paymentMethod, discount) => run('Comanda fechada e venda emitida.', () => closeRestaurantTab({ tabId, paymentMethod, discount }))}
                />
              )}
              {activeTab === 'products' && (
                <ProductsPanel
                  products={summary.products}
                  working={working}
                  onSaveProduct={(input) => run('Produto salvo no cardapio.', () => saveRestaurantProduct(input))}
                />
              )}
              {activeTab === 'purchases' && (
                <PurchasesPanel
                  products={lowStockProducts}
                  allProducts={summary.products}
                  working={working}
                  onAdjustStock={(productId, qty, reason) => run('Entrada de estoque registrada.', () => adjustRestaurantStock({ productId, quantity: qty, reason }))}
                />
              )}
              {activeTab === 'finance' && (
                <FinancePanel
                  summary={summary}
                  working={working}
                  onOpenCash={(openingAmount) => run('Caixa aberto.', () => openRestaurantCash({ openingAmount }))}
                  onCloseCash={(sessionId, closingAmount) => run('Caixa fechado.', () => closeRestaurantCash({ sessionId, closingAmount }))}
                />
              )}
              {activeTab === 'reports' && <ReportsPanel summary={summary} />}
              {activeTab === 'tools' && <ToolsPanel />}
            </section>

            <aside className="space-y-4">
              <section className="rounded-lg border border-black/8 bg-[#151d18] p-5 text-white shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#d7b98d]">Fila da cozinha</p>
                <div className="mt-4 space-y-3">
                  {summary.orders
                    .filter(order => ['new', 'preparing', 'ready'].includes(order.status))
                    .slice(0, 6)
                    .map(order => (
                      <div key={order.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <strong className="text-sm">{order.order_number}</strong>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            order.status === 'new' ? 'bg-amber-500/20 text-amber-300' :
                            order.status === 'preparing' ? 'bg-blue-500/20 text-blue-300' :
                            'bg-emerald-500/20 text-emerald-300'
                          }`}>{statusLabel(order.status)}</span>
                        </div>
                        <p className="mt-1 text-xs text-white/55">{order.origin} · {cents(order.total)}</p>
                      </div>
                    ))}
                  {summary.orders.filter(o => ['new', 'preparing', 'ready'].includes(o.status)).length === 0 && (
                    <p className="text-sm text-white/45">Nenhum pedido ativo.</p>
                  )}
                </div>
              </section>

              <section className="rounded-lg border border-black/8 bg-white p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-black/35">Estoque critico</p>
                <div className="mt-4 space-y-3">
                  {lowStockProducts.map(item => (
                    <div key={item.id} className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2 text-sm text-red-900">
                      <span>{item.name}</span>
                      <strong>{Number(item.stock_quantity)}/{Number(item.min_stock)}</strong>
                    </div>
                  ))}
                  {lowStockProducts.length === 0 && <p className="text-sm text-black/45">Sem alertas de estoque.</p>}
                </div>
              </section>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}

// ---------- QuickActions ----------

function QuickActions({ setActiveTab }: { setActiveTab: (tab: KitchenTab) => void }) {
  return (
    <section className="rounded-lg border border-black/8 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-black/35">Menu rapido</p>
          <h2 className="font-serif text-2xl">Acoes do restaurante</h2>
        </div>
        <ChefHat className="text-[#9d7a4f]" size={24} />
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK_ACTIONS.map(({ label, icon: Icon, tab }) => (
          <button key={label} onClick={() => setActiveTab(tab)} className="flex min-h-20 items-start gap-3 rounded-lg border border-black/8 bg-[#faf7f0] p-3 text-left transition hover:border-[#c3a37a]/70 hover:bg-white">
            <Icon size={17} className="mt-0.5 text-[#9d7a4f]" />
            <span className="text-sm font-semibold">{label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

// ---------- OrdersPanel ----------

type CartItem = { productId: string; quantity: number };

function OrdersPanel({ orders, products, tabs, working, onCreateOrder, onUpdateStatus }: {
  orders: RestaurantOrder[];
  products: RestaurantProduct[];
  tabs: RestaurantTab[];
  working: boolean;
  onCreateOrder: (input: { tabId: string; origin: string; items: Array<{ productId: string; quantity: number }> }) => void;
  onUpdateStatus: (orderId: string, status: RestaurantOrderStatus) => void;
}) {
  const [tabId, setTabId] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([{ productId: '', quantity: 1 }]);
  const [statusFilter, setStatusFilter] = useState<RestaurantOrderStatus | 'all'>('all');

  const activeProducts = products.filter(p => p.active);

  useEffect(() => {
    if (!tabId && tabs[0]) setTabId(tabs[0].id);
  }, [tabs, tabId]);

  useEffect(() => {
    if (cartItems[0] && !cartItems[0].productId && activeProducts[0]) {
      setCartItems(prev => prev.map((item, i) => i === 0 ? { ...item, productId: activeProducts[0].id } : item));
    }
  }, [activeProducts]); // eslint-disable-line react-hooks/exhaustive-deps

  const addItem = () => setCartItems(prev => [...prev, { productId: activeProducts[0]?.id || '', quantity: 1 }]);
  const removeItem = (i: number) => setCartItems(prev => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: 'productId' | 'quantity', value: string | number) =>
    setCartItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  const cartTotal = cartItems.reduce((sum, item) => {
    const p = products.find(x => x.id === item.productId);
    return sum + (p ? Number(p.sale_price) * Number(item.quantity) : 0);
  }, 0);

  const handleLaunch = () => {
    const validItems = cartItems.filter(item => item.productId && item.quantity > 0);
    if (!tabId || validItems.length === 0) return;
    const tab = tabs.find(t => t.id === tabId);
    onCreateOrder({ tabId, origin: tab?.code || 'Restaurante', items: validItems });
    setCartItems([{ productId: activeProducts[0]?.id || '', quantity: 1 }]);
  };

  const STATUS_FILTERS: Array<{ id: RestaurantOrderStatus | 'all'; label: string }> = [
    { id: 'all', label: 'Todos' },
    { id: 'new', label: 'Novos' },
    { id: 'preparing', label: 'Preparando' },
    { id: 'ready', label: 'Prontos' },
    { id: 'delivered', label: 'Entregues' },
  ];

  const filteredOrders = statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter);

  return (
    <Panel title="Pedidos em preparo" icon={ClipboardList}>
      {/* New order form */}
      <div className="mb-6 space-y-3 rounded-lg border border-black/8 bg-[#faf7f0] p-4">
        <div>
          <Field label="Comanda">
            <select value={tabId} onChange={e => setTabId(e.target.value)}>
              <option value="" disabled>Selecione uma comanda...</option>
              {tabs.map(tab => <option key={tab.id} value={tab.id}>{tab.code} · {tableLabel(tab)}</option>)}
            </select>
          </Field>
          {tabs.length === 0 && (
            <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Nenhuma comanda aberta. Acesse a aba Comandas para abrir uma.
            </p>
          )}
        </div>

        <div className="space-y-2">
          {cartItems.map((item, i) => (
            <div key={i} className="flex items-end gap-2">
              <div className="flex-1">
                {i === 0 && <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-black/38">Produto</span>}
                <select
                  value={item.productId}
                  onChange={e => updateItem(i, 'productId', e.target.value)}
                  className="h-12 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-[#9d7a4f]"
                >
                  {activeProducts.map(p => (
                    <option key={p.id} value={p.id}>{p.name} · {cents(p.sale_price)}</option>
                  ))}
                </select>
              </div>
              <div className="w-24 shrink-0">
                {i === 0 && <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-black/38">Qtd.</span>}
                <input
                  type="number" min={1} step={1} value={item.quantity}
                  onChange={e => updateItem(i, 'quantity', Number(e.target.value))}
                  className="h-12 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-[#9d7a4f]"
                />
              </div>
              {cartItems.length > 1 && (
                <button onClick={() => removeItem(i)} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100">
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-1">
          <button onClick={addItem} className="flex items-center gap-1.5 text-sm font-semibold text-[#9d7a4f] transition hover:text-[#735333]">
            <Plus size={14} /> Adicionar item
          </button>
          <div className="flex items-center gap-3">
            {cartTotal > 0 && <span className="text-sm font-semibold text-black/55">{cents(cartTotal)}</span>}
            <button
              disabled={working || !tabId || cartItems.every(item => !item.productId)}
              onClick={handleLaunch}
              className="h-11 rounded-lg bg-[#3a6b4a] px-6 text-xs font-bold uppercase tracking-[0.18em] text-white disabled:opacity-50"
            >
              Lancar pedido
            </button>
          </div>
        </div>
      </div>

      {/* Status filter */}
      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
        {STATUS_FILTERS.map(({ id, label }) => {
          const count = id === 'all' ? orders.length : orders.filter(o => o.status === id).length;
          return (
            <button
              key={id}
              onClick={() => setStatusFilter(id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition ${
                statusFilter === id ? 'bg-[#20140d] text-white' : 'bg-black/5 text-black/55 hover:bg-black/10'
              }`}
            >
              {label}
              {count > 0 && (
                <span className={`rounded-full px-1.5 text-[9px] font-bold ${
                  statusFilter === id ? 'bg-white/20 text-white' : 'bg-black/10 text-black/55'
                }`}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Orders list */}
      <div className="space-y-3">
        {filteredOrders.map(order => (
          <OrderCard key={order.id} order={order} working={working} onUpdateStatus={onUpdateStatus} />
        ))}
        {filteredOrders.length === 0 && (
          <Empty text={statusFilter === 'all' ? 'Nenhum pedido lancado ainda.' : 'Nenhum pedido com esse status.'} />
        )}
      </div>
    </Panel>
  );
}

function OrderCard({ order, working, onUpdateStatus }: {
  order: RestaurantOrder;
  working: boolean;
  onUpdateStatus: (orderId: string, status: RestaurantOrderStatus) => void;
}) {
  type StatusConfig = {
    badge: string;
    nextStatus?: RestaurantOrderStatus;
    actionLabel?: string;
    actionClass?: string;
  };

  const STATUS_CONFIG: Record<RestaurantOrderStatus, StatusConfig> = {
    new: {
      badge: 'border-amber-200 bg-amber-50 text-amber-800',
      nextStatus: 'preparing',
      actionLabel: 'Iniciar preparo',
      actionClass: 'bg-amber-500 hover:bg-amber-600 text-white',
    },
    preparing: {
      badge: 'border-blue-200 bg-blue-50 text-blue-800',
      nextStatus: 'ready',
      actionLabel: 'Marcar como pronto',
      actionClass: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
    ready: {
      badge: 'border-emerald-200 bg-emerald-50 text-emerald-800',
      nextStatus: 'delivered',
      actionLabel: 'Confirmar entrega',
      actionClass: 'bg-[#3a6b4a] hover:bg-[#2f5a3d] text-white',
    },
    delivered: { badge: 'border-gray-200 bg-gray-50 text-gray-500' },
    cancelled: { badge: 'border-red-200 bg-red-50 text-red-700' },
  };

  const config = STATUS_CONFIG[order.status];
  const canCancel = !['delivered', 'cancelled'].includes(order.status);
  const elapsed = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000);

  return (
    <article className="rounded-lg border border-black/8 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{order.order_number}</p>
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${config.badge}`}>
              {statusLabel(order.status)}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-black/45">
            {order.origin}
            {' · '}{new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            {elapsed < 120 && ` · há ${elapsed}min`}
            {' · '}{cents(order.total)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {config.nextStatus && config.actionLabel && (
            <button
              disabled={working}
              onClick={() => onUpdateStatus(order.id, config.nextStatus!)}
              className={`flex h-9 items-center gap-1.5 rounded-lg px-4 text-xs font-bold transition disabled:opacity-50 ${config.actionClass}`}
            >
              <Check size={13} /> {config.actionLabel}
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

  const setPayment = (tabId: string, method: RestaurantPaymentMethod) =>
    setTabPayments(prev => ({ ...prev, [tabId]: method }));

  const toggleExpand = (tabId: string) =>
    setExpanded(prev => ({ ...prev, [tabId]: !prev[tabId] }));

  const getTabOrders = (tabId: string) => orders.filter(o => o.tab_id === tabId);

  const handleOpen = () => {
    if (!tableCode.trim()) return;
    onOpenTab(tableCode.trim().toUpperCase(), location.trim() || tableCode.trim());
    setTableCode('');
    setLocation('');
  };

  return (
    <Panel title="Comandas" icon={ReceiptText}>
      {/* Open new tab */}
      <div className="mb-5 grid gap-3 rounded-lg border border-black/8 bg-[#faf7f0] p-4 md:grid-cols-[1fr_1fr_auto]">
        <Field label="Codigo da mesa">
          <input
            value={tableCode}
            onChange={e => setTableCode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleOpen()}
            placeholder="DECK-01"
          />
        </Field>
        <Field label="Descricao">
          <input
            value={location}
            onChange={e => setLocation(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleOpen()}
            placeholder="Deck 01"
          />
        </Field>
        <button
          disabled={working || !tableCode.trim()}
          onClick={handleOpen}
          className="h-12 self-end rounded-lg bg-[#20140d] px-5 text-xs font-bold uppercase tracking-[0.18em] text-white disabled:opacity-50"
        >
          Abrir comanda
        </button>
      </div>

      {/* Tabs list */}
      <div className="space-y-3">
        {tabs.map(tab => {
          const isOpen = tab.status === 'open' || tab.status === 'pending_payment';
          const isExpanded = !!expanded[tab.id];
          const tabOrdersList = getTabOrders(tab.id);
          const payment = tabPayments[tab.id] || 'card';

          return (
            <article key={tab.id} className="overflow-hidden rounded-lg border border-black/8 bg-white">
              <div
                className="flex cursor-pointer items-center justify-between gap-3 p-4 transition hover:bg-[#faf7f0]"
                onClick={() => toggleExpand(tab.id)}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <div>
                    <p className="font-semibold">{tab.code}</p>
                    <p className="text-xs text-black/45">{tableLabel(tab)}</p>
                  </div>
                  <span className={`rounded-full px-3 py-0.5 text-xs font-bold ${
                    isOpen ? 'bg-[#efe4d4] text-[#735333]' :
                    tab.status === 'paid' ? 'bg-emerald-50 text-emerald-700' :
                    'bg-gray-50 text-gray-500'
                  }`}>
                    {statusLabel(tab.status)}
                  </span>
                  {tabOrdersList.length > 0 && (
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                      {tabOrdersList.length} pedido{tabOrdersList.length > 1 ? 's' : ''}
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
                  {/* Financial summary */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-[#faf7f0] px-3 py-2 text-xs">
                      <p className="text-black/45">Subtotal</p>
                      <p className="mt-0.5 font-semibold">{cents(tab.subtotal)}</p>
                    </div>
                    <div className="rounded-lg bg-[#faf7f0] px-3 py-2 text-xs">
                      <p className="text-black/45">Desconto</p>
                      <p className="mt-0.5 font-semibold">{cents(tab.discount || 0)}</p>
                    </div>
                    <div className="rounded-lg bg-[#efe4d4] px-3 py-2 text-xs">
                      <p className="text-[#735333]/60">Total</p>
                      <p className="mt-0.5 font-serif text-base font-semibold text-[#735333]">{cents(tab.total)}</p>
                    </div>
                  </div>

                  {/* Orders in this tab */}
                  {tabOrdersList.length > 0 && (
                    <div>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-black/35">Pedidos</p>
                      <div className="space-y-1.5">
                        {tabOrdersList.map(order => (
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

                  {/* Close tab */}
                  {isOpen && (
                    <div className="flex items-end gap-3 rounded-lg border border-black/8 bg-[#faf7f0] p-3">
                      <div className="flex-1">
                        <Field label="Forma de pagamento">
                          <select value={payment} onChange={e => setPayment(tab.id, e.target.value as RestaurantPaymentMethod)}>
                            <option value="card">Cartao</option>
                            <option value="pix">Pix</option>
                            <option value="cash">Dinheiro</option>
                            <option value="room">Conta do quarto</option>
                            <option value="courtesy">Cortesia</option>
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
        {tabs.length === 0 && <Empty text="Nenhuma comanda criada ainda." />}
      </div>
    </Panel>
  );
}

// ---------- PurchasesPanel ----------

function PurchasesPanel({ products, allProducts, working, onAdjustStock }: {
  products: RestaurantProduct[];
  allProducts: RestaurantProduct[];
  working: boolean;
  onAdjustStock: (productId: string, quantity: number, reason: string) => void;
}) {
  const [productId, setProductId] = useState('');
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState('Compra recebida');

  useEffect(() => {
    if (!productId) {
      const first = products[0] || allProducts[0];
      if (first) setProductId(first.id);
    }
  }, [products, allProducts, productId]);

  const handleRegister = () => {
    if (!productId || qty <= 0) return;
    onAdjustStock(productId, qty, reason || 'Entrada de estoque');
    setQty(1);
  };

  const fillFrom = (product: RestaurantProduct) => {
    const needed = Math.max(1, Number(product.min_stock) - Number(product.stock_quantity));
    setProductId(product.id);
    setQty(needed);
    setReason('Compra recebida');
  };

  return (
    <Panel title="Compras e entradas de estoque" icon={Truck}>
      <div className="mb-5 space-y-3 rounded-lg border border-black/8 bg-[#faf7f0] p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/35">Registrar entrada</p>
        <div className="grid gap-3 md:grid-cols-[1fr_120px_1fr_auto]">
          <Field label="Produto">
            <select value={productId} onChange={e => setProductId(e.target.value)}>
              {allProducts.map(p => (
                <option key={p.id} value={p.id}>{p.name} (estoque: {Number(p.stock_quantity)})</option>
              ))}
            </select>
          </Field>
          <Field label="Qtd. recebida">
            <input type="number" min={1} step={1} value={qty} onChange={e => setQty(Number(e.target.value))} />
          </Field>
          <Field label="Motivo / nota">
            <input value={reason} onChange={e => setReason(e.target.value)} placeholder="Compra recebida" />
          </Field>
          <button
            disabled={working || !productId || qty <= 0}
            onClick={handleRegister}
            className="h-12 self-end rounded-lg bg-[#3a6b4a] px-5 text-xs font-bold uppercase tracking-[0.18em] text-white disabled:opacity-50"
          >
            Registrar
          </button>
        </div>
      </div>

      {products.length > 0 && (
        <div>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-black/35">Itens abaixo do minimo</p>
          <div className="space-y-2">
            {products.map(product => {
              const needed = Math.max(0, Number(product.min_stock) - Number(product.stock_quantity));
              return (
                <div key={product.id} className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-900">
                  <div>
                    <span className="font-semibold">{product.name}</span>
                    <span className="ml-3 text-xs text-red-700/60">
                      Atual: {Number(product.stock_quantity)} · Mínimo: {Number(product.min_stock)}
                    </span>
                  </div>
                  <button
                    onClick={() => fillFrom(product)}
                    className="shrink-0 rounded-lg bg-red-700 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-800"
                  >
                    Preencher ({needed} un.)
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {products.length === 0 && <Empty text="Nenhum item abaixo do estoque minimo." />}
    </Panel>
  );
}

// ---------- ProductsPanel ----------

function ProductsPanel({ products, working, onSaveProduct }: {
  products: RestaurantProduct[];
  working: boolean;
  onSaveProduct: (input: RestaurantProductInput) => void;
}) {
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

  const handleImageUpload = async (file: File) => {
    setImageUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('restaurant-images').upload(path, file, { upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from('restaurant-images').getPublicUrl(path);
      setImageUrl(data.publicUrl);
    } catch {
      // silently fail — user can enter URL manually
    } finally {
      setImageUploading(false);
    }
  };

  const handleSave = () => {
    onSaveProduct({
      categoryName, sku, name, description: description.trim() || undefined,
      unit: 'un', costPrice, salePrice, stockQuantity, minStock,
      showOnGuestMenu, imageUrl: imageUrl.trim() || null,
    });
  };

  return (
    <Panel title="Produtos e estoque" icon={Boxes}>
      <div className="mb-5 space-y-4 rounded-lg border border-black/8 bg-[#faf7f0] p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <Field label="Produto"><input value={name} onChange={e => setName(e.target.value)} /></Field>
          <Field label="Categoria"><input value={categoryName} onChange={e => setCategoryName(e.target.value)} /></Field>
          <Field label="SKU"><input value={sku} onChange={e => setSku(e.target.value)} /></Field>
          <Field label="Preco venda (centavos)"><input type="number" min={0} value={salePrice} onChange={e => setSalePrice(Number(e.target.value))} /></Field>
          <Field label="Custo (centavos)"><input type="number" min={0} value={costPrice} onChange={e => setCostPrice(Number(e.target.value))} /></Field>
          <Field label="Estoque"><input type="number" min={0} value={stockQuantity} onChange={e => setStockQuantity(Number(e.target.value))} /></Field>
          <Field label="Minimo"><input type="number" min={0} value={minStock} onChange={e => setMinStock(Number(e.target.value))} /></Field>
        </div>

        <Field label="Descricao (exibida no cardapio do hospede)">
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
              <input
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                placeholder="URL da imagem ou use o upload abaixo"
                className="h-10 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-[#9d7a4f]"
              />
              <div className="mt-1.5 flex gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={imageUploading}
                  className="flex items-center gap-1.5 rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-black/60 transition hover:border-[#9d7a4f] disabled:opacity-50"
                >
                  {imageUploading ? <Loader2 size={12} className="animate-spin" /> : <ImagePlus size={12} />}
                  {imageUploading ? 'Enviando...' : 'Fazer upload'}
                </button>
                {imageUrl && (
                  <button type="button" onClick={() => setImageUrl('')} className="flex items-center gap-1 rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs text-red-600 transition hover:border-red-200">
                    <X size={12} /> Remover
                  </button>
                )}
              </div>
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.target.value = ''; }}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-black/8 bg-white px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Exibir no cardapio do hospede</p>
            <p className="text-xs text-black/45">Itens marcados aparecem no app do hospede.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowOnGuestMenu(v => !v)}
            className={`flex h-8 w-14 items-center rounded-full border px-1 transition-colors ${showOnGuestMenu ? 'border-[#3a6b4a] bg-[#3a6b4a]' : 'border-black/15 bg-black/8'}`}
          >
            <span className={`h-6 w-6 rounded-full bg-white shadow transition-transform ${showOnGuestMenu ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>

        <div className="flex items-center gap-2 pt-1">
          {showOnGuestMenu ? <Eye size={13} className="text-[#3a6b4a]" /> : <EyeOff size={13} className="text-black/30" />}
          <span className="text-xs text-black/45">{showOnGuestMenu ? 'Visivel no cardapio do hospede' : 'Apenas uso interno da equipe'}</span>
          <button
            disabled={working || imageUploading || name.trim().length < 2}
            onClick={handleSave}
            className="ml-auto h-11 rounded-lg bg-[#20140d] px-6 text-xs font-bold uppercase tracking-[0.18em] text-white disabled:opacity-50"
          >
            Salvar produto
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-black/8">
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
        {products.length === 0 && <Empty text="Nenhum produto cadastrado ainda." />}
      </div>
    </Panel>
  );
}

// ---------- FinancePanel ----------

const PAYMENT_LABELS: Record<RestaurantPaymentMethod, string> = {
  card: 'Cartao',
  pix: 'Pix',
  cash: 'Dinheiro',
  room: 'Conta do quarto',
  courtesy: 'Cortesia',
};

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
      {/* Caixa */}
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

      {/* Breakdown por forma de pagamento */}
      <div className="mb-5 overflow-hidden rounded-lg border border-black/8">
        <div className="flex items-center justify-between border-b border-black/6 bg-[#faf7f0] px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/35">Vendas por forma de pagamento</p>
          <span className="text-xs text-black/45">{paidSales.length} venda{paidSales.length !== 1 ? 's' : ''} hoje</span>
        </div>
        {paymentBreakdown.length === 0 && (
          <p className="px-4 py-3 text-sm text-black/45">Nenhuma venda registrada hoje.</p>
        )}
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

      {/* Contas a receber */}
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

      {/* Contas a pagar */}
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
      {/* Day summary */}
      <div className="mb-5 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        <Finance label="Vendas do dia" value={summary.metrics.dailyRevenue} />
        <Finance label="Ticket medio" value={avgTicket} />
        <Finance label="Total de pedidos" value={summary.orders.length} plain />
        <Finance label="A receber" value={summary.metrics.pendingRevenue} />
      </div>

      {/* By channel */}
      <div className="mb-5 overflow-hidden rounded-lg border border-black/8">
        <div className="border-b border-black/6 bg-[#faf7f0] px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/35">Pedidos por canal de origem</p>
        </div>
        {Object.keys(channelGroups).length === 0 && (
          <p className="px-4 py-3 text-sm text-black/45">Nenhum pedido registrado.</p>
        )}
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

      {/* By employee */}
      <div className="mb-5 overflow-hidden rounded-lg border border-black/8">
        <div className="border-b border-black/6 bg-[#faf7f0] px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/35">Vendas por funcionario (hoje)</p>
        </div>
        {Object.keys(employeeGroups).length === 0 && (
          <p className="px-4 py-3 text-sm text-black/45">Nenhuma venda fechada hoje.</p>
        )}
        {Object.entries(employeeGroups)
          .sort(([, a], [, b]) => b.total - a.total)
          .map(([name, data]) => (
            <div key={name} className="flex items-center justify-between border-b border-black/6 px-4 py-3 text-sm last:border-b-0">
              <span className="font-medium">{name}</span>
              <div className="flex items-center gap-8">
                <span className="text-black/45">{data.count} venda{data.count > 1 ? 's' : ''}</span>
                <strong className="w-28 text-right">{cents(data.total)}</strong>
              </div>
            </div>
          ))}
      </div>

      {/* Stock movements */}
      <div className="overflow-hidden rounded-lg border border-black/8">
        <div className="flex items-center justify-between border-b border-black/6 bg-[#faf7f0] px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/35">Movimentacao de estoque hoje</p>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="text-emerald-700">↑ {stockIn.length} entrada{stockIn.length !== 1 ? 's' : ''}</span>
            <span className="text-red-700">↓ {stockOut.length} saida{stockOut.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        {stockMovements.length === 0 && (
          <p className="px-4 py-3 text-sm text-black/45">Nenhuma movimentacao registrada hoje.</p>
        )}
        {stockMovements.map(m => {
          const { name, unit } = productName(m);
          const isIn = m.movement_type === 'in';
          return (
            <div key={m.id} className="flex items-center justify-between border-b border-black/6 px-4 py-3 text-sm last:border-b-0">
              <div className="flex items-center gap-3">
                <span className={`w-5 text-center text-base font-bold ${isIn ? 'text-emerald-600' : 'text-red-600'}`}>
                  {isIn ? '↑' : '↓'}
                </span>
                <div>
                  <span className="font-medium">{name}</span>
                  {m.reason && <span className="ml-2 text-xs text-black/45">{m.reason}</span>}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-black/45">
                  {new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className={`font-semibold ${isIn ? 'text-emerald-700' : 'text-red-700'}`}>
                  {isIn ? '+' : '-'}{m.quantity} {unit}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

// ---------- ToolsPanel ----------

function ToolsPanel() {
  return (
    <Panel title="Ferramentas" icon={Settings}>
      <div className="rounded-lg border border-dashed border-black/12 bg-[#faf7f0] p-5">
        <p className="max-w-2xl text-sm leading-6 text-black/56">Base pronta para configurar impressora de comandas, mesas, categorias, taxas e parametros operacionais do restaurante.</p>
      </div>
    </Panel>
  );
}

// ---------- Shared components ----------

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

function Finance({ label, value, plain }: { label: string; value: number; plain?: boolean }) {
  return (
    <div className="rounded-lg border border-black/8 bg-[#151d18] p-4 text-white">
      <p className="text-xs text-white/45">{label}</p>
      <p className="mt-2 font-serif text-3xl">{plain ? Math.round(value) : cents(value)}</p>
    </div>
  );
}
