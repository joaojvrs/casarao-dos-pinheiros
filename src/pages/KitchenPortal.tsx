import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Banknote,
  BarChart3,
  Boxes,
  ChefHat,
  Check,
  ClipboardList,
  CreditCard,
  Loader2,
  PackagePlus,
  ReceiptText,
  Search,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Timer,
  Truck,
  UtensilsCrossed,
  WalletCards,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
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

type KitchenTab = 'orders' | 'tables' | 'products' | 'pos' | 'purchases' | 'finance' | 'reports' | 'tools';

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const EMPTY_SUMMARY: RestaurantSummary = {
  products: [],
  categories: [],
  orders: [],
  tabs: [],
  sales: [],
  cashSession: null,
  metrics: { activeOrders: 0, openTabs: 0, lowStock: 0, dailyRevenue: 0, pendingRevenue: 0 },
};

const TABS: { id: KitchenTab; label: string; icon: LucideIcon }[] = [
  { id: 'orders', label: 'Pedidos', icon: ChefHat },
  { id: 'tables', label: 'Comandas', icon: ReceiptText },
  { id: 'products', label: 'Produtos & Estoque', icon: Boxes },
  { id: 'pos', label: 'PDV', icon: ShoppingBag },
  { id: 'purchases', label: 'Compras', icon: Truck },
  { id: 'finance', label: 'Financeiro', icon: WalletCards },
  { id: 'reports', label: 'Relatorios', icon: BarChart3 },
  { id: 'tools', label: 'Ferramentas', icon: Settings },
];

const QUICK_ACTIONS = [
  { label: 'Novo pedido', icon: PackagePlus, tab: 'orders' as KitchenTab },
  { label: 'Consultar comanda', icon: Search, tab: 'tables' as KitchenTab },
  { label: 'Emitir venda', icon: CreditCard, tab: 'pos' as KitchenTab },
  { label: 'Movimento caixa', icon: Banknote, tab: 'finance' as KitchenTab },
  { label: 'Produtos', icon: Boxes, tab: 'products' as KitchenTab },
  { label: 'Pedido compras', icon: ShoppingCart, tab: 'purchases' as KitchenTab },
  { label: 'Relatorio vendas', icon: BarChart3, tab: 'reports' as KitchenTab },
  { label: 'Venda pendente', icon: Timer, tab: 'pos' as KitchenTab },
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

function nextStatus(status: RestaurantOrderStatus): RestaurantOrderStatus | null {
  if (status === 'new') return 'preparing';
  if (status === 'preparing') return 'ready';
  if (status === 'ready') return 'delivered';
  return null;
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    new: 'Novo',
    preparing: 'Preparando',
    ready: 'Pronto',
    delivered: 'Entregue',
    cancelled: 'Cancelado',
    open: 'Aberta',
    pending_payment: 'Pagamento',
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

  const openTabs = useMemo(() => summary.tabs.filter(tab => tab.status === 'open' || tab.status === 'pending_payment'), [summary.tabs]);
  const lowStockProducts = useMemo(() => summary.products.filter(item => Number(item.stock_quantity) < Number(item.min_stock)), [summary.products]);

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

  const loadSummary = async () => {
    const data = await getRestaurantSummary();
    setSummary(data);
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
                  onOpenTab={(tableCode, location) => run('Comanda aberta.', () => openRestaurantTab({ tableCode, location }))}
                  onCreateOrder={(input) => run('Pedido lancado e estoque baixado.', () => createRestaurantOrder(input))}
                  onUpdateStatus={(orderId, status) => run('Status do pedido atualizado.', () => updateRestaurantOrderStatus(orderId, status))}
                />
              )}
              {activeTab === 'tables' && (
                <TablesPanel
                  tabs={summary.tabs}
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
              {activeTab === 'pos' && (
                <TablesPanel
                  tabs={summary.tabs}
                  working={working}
                  onOpenTab={(tableCode, location) => run('Comanda aberta.', () => openRestaurantTab({ tableCode, location }))}
                  onCloseTab={(tabId, paymentMethod, discount) => run('Venda emitida no PDV.', () => closeRestaurantTab({ tabId, paymentMethod, discount }))}
                />
              )}
              {activeTab === 'purchases' && <PurchasesPanel products={lowStockProducts} />}
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
                  {summary.orders.filter(order => ['new', 'preparing', 'ready'].includes(order.status)).slice(0, 6).map(order => (
                    <div key={order.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <strong>{order.order_number}</strong>
                        <span className="text-xs text-[#d7b98d]">{statusLabel(order.status)}</span>
                      </div>
                      <p className="mt-1 text-sm text-white/55">{order.origin} · {cents(order.total)}</p>
                    </div>
                  ))}
                  {summary.orders.length === 0 && <p className="text-sm text-white/45">Nenhum pedido lancado ainda.</p>}
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

function OrdersPanel({ orders, products, tabs, working, onOpenTab, onCreateOrder, onUpdateStatus }: {
  orders: RestaurantOrder[];
  products: RestaurantProduct[];
  tabs: RestaurantTab[];
  working: boolean;
  onOpenTab: (tableCode: string, location: string) => void;
  onCreateOrder: (input: { tabId: string; origin: string; notes?: string; items: Array<{ productId: string; quantity: number }> }) => void;
  onUpdateStatus: (orderId: string, status: RestaurantOrderStatus) => void;
}) {
  const [tableCode, setTableCode] = useState('DECK-01');
  const [location, setLocation] = useState('Deck 01');
  const [tabId, setTabId] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!tabId && tabs[0]) setTabId(tabs[0].id);
    if (!productId && products[0]) setProductId(products[0].id);
  }, [productId, products, tabId, tabs]);

  return (
    <Panel title="Pedidos em preparo" icon={ClipboardList}>
      <div className="mb-5 grid gap-3 rounded-lg border border-black/8 bg-[#faf7f0] p-4 md:grid-cols-[1fr_1fr_auto]">
        <Field label="Codigo/local">
          <input value={tableCode} onChange={e => setTableCode(e.target.value)} placeholder="DECK-01" />
        </Field>
        <Field label="Descricao">
          <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Deck 01" />
        </Field>
        <button disabled={working} onClick={() => onOpenTab(tableCode, location)} className="h-12 self-end rounded-lg bg-[#20140d] px-5 text-xs font-bold uppercase tracking-[0.18em] text-white disabled:opacity-50">
          Abrir comanda
        </button>
      </div>

      <div className="mb-5 grid gap-3 rounded-lg border border-black/8 bg-white p-4 md:grid-cols-[1fr_1fr_100px_auto]">
        <Field label="Comanda">
          <select value={tabId} onChange={e => setTabId(e.target.value)}>
            {tabs.map(tab => <option key={tab.id} value={tab.id}>{tab.code} · {tableLabel(tab)}</option>)}
          </select>
        </Field>
        <Field label="Produto">
          <select value={productId} onChange={e => setProductId(e.target.value)}>
            {products.filter(product => product.active).map(product => <option key={product.id} value={product.id}>{product.name} · {cents(product.sale_price)}</option>)}
          </select>
        </Field>
        <Field label="Qtd.">
          <input type="number" min={1} step={1} value={quantity} onChange={e => setQuantity(Number(e.target.value))} />
        </Field>
        <button disabled={working || !tabId || !productId} onClick={() => onCreateOrder({ tabId, origin: tabs.find(tab => tab.id === tabId)?.code || 'Restaurante', items: [{ productId, quantity }] })} className="h-12 self-end rounded-lg bg-[#3a6b4a] px-5 text-xs font-bold uppercase tracking-[0.18em] text-white disabled:opacity-50">
          Lancar
        </button>
      </div>

      <div className="space-y-3">
        {orders.map(order => {
          const next = nextStatus(order.status);
          return (
            <article key={order.id} className="rounded-lg border border-black/8 bg-white p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-semibold">{order.order_number} · {order.origin}</p>
                  <p className="mt-1 text-sm text-black/45">{new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · {cents(order.total)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-fit rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">{statusLabel(order.status)}</span>
                  {next && <button disabled={working} onClick={() => onUpdateStatus(order.id, next)} className="rounded-full bg-[#20140d] px-3 py-1 text-xs font-bold text-white disabled:opacity-50">Avancar</button>}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(order.restaurant_order_items || []).map(item => <span key={item.id} className="rounded-full border border-black/8 px-3 py-1 text-xs text-black/55">{Number(item.quantity)}x {item.name}</span>)}
              </div>
            </article>
          );
        })}
        {orders.length === 0 && <Empty text="Nenhum pedido lançado ainda." />}
      </div>
    </Panel>
  );
}

function TablesPanel({ tabs, working, onOpenTab, onCloseTab }: {
  tabs: RestaurantTab[];
  working: boolean;
  onOpenTab: (tableCode: string, location: string) => void;
  onCloseTab: (tabId: string, paymentMethod: RestaurantPaymentMethod, discount: number) => void;
}) {
  const [tableCode, setTableCode] = useState('PISCINA');
  const [location, setLocation] = useState('Piscina');
  const [paymentMethod, setPaymentMethod] = useState<RestaurantPaymentMethod>('card');

  return (
    <Panel title="Comandas e PDV" icon={ReceiptText}>
      <div className="mb-5 grid gap-3 rounded-lg border border-black/8 bg-[#faf7f0] p-4 md:grid-cols-[1fr_1fr_auto]">
        <Field label="Codigo">
          <input value={tableCode} onChange={e => setTableCode(e.target.value)} />
        </Field>
        <Field label="Local">
          <input value={location} onChange={e => setLocation(e.target.value)} />
        </Field>
        <button disabled={working} onClick={() => onOpenTab(tableCode, location)} className="h-12 self-end rounded-lg bg-[#20140d] px-5 text-xs font-bold uppercase tracking-[0.18em] text-white disabled:opacity-50">
          Nova comanda
        </button>
      </div>

      <div className="mb-4 max-w-xs">
        <Field label="Forma de pagamento para fechamento">
          <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as RestaurantPaymentMethod)}>
            <option value="card">Cartao</option>
            <option value="pix">Pix</option>
            <option value="cash">Dinheiro</option>
            <option value="room">Conta do quarto</option>
            <option value="courtesy">Cortesia</option>
          </select>
        </Field>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {tabs.map(tab => (
          <article key={tab.id} className="rounded-lg border border-black/8 bg-white p-4">
            <p className="font-semibold">{tab.code}</p>
            <p className="mt-1 text-sm text-black/45">{tableLabel(tab)}</p>
            <div className="mt-4 flex items-end justify-between gap-3">
              <span className="rounded-full bg-[#efe4d4] px-3 py-1 text-xs font-bold text-[#735333]">{statusLabel(tab.status)}</span>
              <strong>{cents(tab.total)}</strong>
            </div>
            {(tab.status === 'open' || tab.status === 'pending_payment') && (
              <button disabled={working || tab.total <= 0} onClick={() => onCloseTab(tab.id, paymentMethod, 0)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#3a6b4a] py-2 text-xs font-bold uppercase tracking-[0.16em] text-white disabled:opacity-45">
                <Check size={14} /> Fechar
              </button>
            )}
          </article>
        ))}
        {tabs.length === 0 && <Empty text="Nenhuma comanda criada ainda." />}
      </div>
    </Panel>
  );
}

function ProductsPanel({ products, working, onSaveProduct }: {
  products: RestaurantProduct[];
  working: boolean;
  onSaveProduct: (input: {
    categoryName: string;
    sku: string;
    name: string;
    unit: string;
    costPrice: number;
    salePrice: number;
    stockQuantity: number;
    minStock: number;
  }) => void;
}) {
  const [name, setName] = useState('');
  const [categoryName, setCategoryName] = useState('Pratos');
  const [sku, setSku] = useState('');
  const [salePrice, setSalePrice] = useState(0);
  const [costPrice, setCostPrice] = useState(0);
  const [stockQuantity, setStockQuantity] = useState(0);
  const [minStock, setMinStock] = useState(0);

  return (
    <Panel title="Produtos e estoque" icon={Boxes}>
      <div className="mb-5 grid gap-3 rounded-lg border border-black/8 bg-[#faf7f0] p-4 md:grid-cols-4">
        <Field label="Produto"><input value={name} onChange={e => setName(e.target.value)} /></Field>
        <Field label="Categoria"><input value={categoryName} onChange={e => setCategoryName(e.target.value)} /></Field>
        <Field label="SKU"><input value={sku} onChange={e => setSku(e.target.value)} /></Field>
        <Field label="Preco venda"><input type="number" min={0} value={salePrice} onChange={e => setSalePrice(Number(e.target.value))} /></Field>
        <Field label="Custo"><input type="number" min={0} value={costPrice} onChange={e => setCostPrice(Number(e.target.value))} /></Field>
        <Field label="Estoque"><input type="number" min={0} value={stockQuantity} onChange={e => setStockQuantity(Number(e.target.value))} /></Field>
        <Field label="Minimo"><input type="number" min={0} value={minStock} onChange={e => setMinStock(Number(e.target.value))} /></Field>
        <button disabled={working || name.trim().length < 2} onClick={() => onSaveProduct({ categoryName, sku, name, unit: 'un', costPrice, salePrice, stockQuantity, minStock })} className="h-12 self-end rounded-lg bg-[#20140d] px-5 text-xs font-bold uppercase tracking-[0.18em] text-white disabled:opacity-50">
          Salvar
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-black/8">
        {products.map(item => {
          const low = Number(item.stock_quantity) < Number(item.min_stock);
          return (
            <div key={item.id} className="grid gap-3 border-b border-black/6 bg-white px-4 py-3 text-sm last:border-b-0 md:grid-cols-[1fr_140px_120px_120px] md:items-center">
              <div>
                <p className="font-semibold">{item.name}</p>
                <p className="text-xs text-black/42">{categoryNameOf(item)} · {item.sku || 'sem SKU'}</p>
              </div>
              <span>{cents(item.sale_price)}</span>
              <span className={low ? 'font-bold text-red-700' : 'text-emerald-700'}>{Number(item.stock_quantity)} em estoque</span>
              <span className="text-black/45">min. {Number(item.min_stock)}</span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function PurchasesPanel({ products }: { products: RestaurantProduct[] }) {
  return (
    <Panel title="Pedido de compras" icon={ShoppingCart}>
      <div className="space-y-3">
        {products.map(product => (
          <div key={product.id} className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-900">
            <span>{product.name}</span>
            <strong>Comprar {Math.max(0, Number(product.min_stock) - Number(product.stock_quantity))} un.</strong>
          </div>
        ))}
        {products.length === 0 && <Empty text="Nenhum item abaixo do estoque minimo." />}
      </div>
    </Panel>
  );
}

function FinancePanel({ summary, working, onOpenCash, onCloseCash }: {
  summary: RestaurantSummary;
  working: boolean;
  onOpenCash: (openingAmount: number) => void;
  onCloseCash: (sessionId: string, closingAmount: number) => void;
}) {
  const [openingAmount, setOpeningAmount] = useState(0);
  const [closingAmount, setClosingAmount] = useState(0);
  const received = summary.sales.filter(sale => sale.status === 'paid').reduce((sum, sale) => sum + sale.total, 0);

  return (
    <Panel title="Financeiro" icon={WalletCards}>
      <div className="grid gap-3 md:grid-cols-3">
        <Finance label="Recebido hoje" value={received} />
        <Finance label="A receber" value={summary.metrics.pendingRevenue} />
        <Finance label="Vendas emitidas" value={summary.sales.length} plain />
      </div>
      <div className="mt-5 rounded-lg border border-black/8 bg-[#faf7f0] p-4">
        <p className="text-sm font-semibold">Caixa: {summary.cashSession?.status === 'open' ? 'aberto' : 'fechado'}</p>
        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
          <Field label={summary.cashSession?.status === 'open' ? 'Valor de fechamento' : 'Valor de abertura'}>
            <input type="number" min={0} value={summary.cashSession?.status === 'open' ? closingAmount : openingAmount} onChange={e => summary.cashSession?.status === 'open' ? setClosingAmount(Number(e.target.value)) : setOpeningAmount(Number(e.target.value))} />
          </Field>
          {summary.cashSession?.status === 'open' ? (
            <button disabled={working} onClick={() => onCloseCash(summary.cashSession!.id, closingAmount)} className="h-12 self-end rounded-lg bg-[#20140d] px-5 text-xs font-bold uppercase tracking-[0.18em] text-white disabled:opacity-50">Fechar caixa</button>
          ) : (
            <button disabled={working} onClick={() => onOpenCash(openingAmount)} className="h-12 self-end rounded-lg bg-[#3a6b4a] px-5 text-xs font-bold uppercase tracking-[0.18em] text-white disabled:opacity-50">Abrir caixa</button>
          )}
        </div>
      </div>
    </Panel>
  );
}

function ReportsPanel({ summary }: { summary: RestaurantSummary }) {
  const averageTicket = summary.sales.length ? summary.metrics.dailyRevenue / summary.sales.length : 0;
  return (
    <Panel title="Relatorios" icon={BarChart3}>
      <div className="grid gap-3 md:grid-cols-3">
        <Finance label="Vendas do dia" value={summary.metrics.dailyRevenue} />
        <Finance label="Ticket medio" value={averageTicket} />
        <Finance label="Pedidos ativos" value={summary.metrics.activeOrders} plain />
      </div>
    </Panel>
  );
}

function ToolsPanel() {
  return (
    <Panel title="Ferramentas" icon={Settings}>
      <div className="rounded-lg border border-dashed border-black/12 bg-[#faf7f0] p-5">
        <p className="max-w-2xl text-sm leading-6 text-black/56">Base pronta para configurar impressora de comandas, mesas, categorias, taxas e parametros operacionais do restaurante.</p>
      </div>
    </Panel>
  );
}

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
