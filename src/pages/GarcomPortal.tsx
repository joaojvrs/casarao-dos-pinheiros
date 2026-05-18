import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Loader2,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import {
  createRestaurantOrder,
  getGarconMenu,
  openRestaurantTab,
} from '../services/restaurant';
import type { GarconMenu, RestaurantProduct, RestaurantTab } from '../types/restaurant';

type Cart = Record<string, number>;

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function cents(v: number) { return BRL.format(v / 100); }

function categoryOf(p: RestaurantProduct): string {
  const cat = Array.isArray(p.restaurant_categories) ? p.restaurant_categories[0] : p.restaurant_categories;
  return cat?.name || 'Outros';
}

function tableLabel(tab: RestaurantTab): string {
  const table = Array.isArray(tab.restaurant_tables) ? tab.restaurant_tables[0] : tab.restaurant_tables;
  return table ? `${table.code} — ${table.location || ''}` : tab.code;
}

export function GarcomPortal({ onBack }: { onBack: () => void }) {
  const [menu, setMenu] = useState<GarconMenu | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cart, setCart] = useState<Cart>({});
  const [selectedTabId, setSelectedTabId] = useState('');
  const [newTableCode, setNewTableCode] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [orderModal, setOrderModal] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');
  const [working, setWorking] = useState(false);
  const [confirmed, setConfirmed] = useState('');
  const [tabPickerOpen, setTabPickerOpen] = useState(false);
  const [creatingTab, setCreatingTab] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getGarconMenu();
      setMenu(data);
      if (data.tabs.length > 0) setSelectedTabId(data.tabs[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar cardapio.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const products = menu?.products || [];
  const tabs = menu?.tabs || [];

  const categories = useMemo(
    () => [...new Set(products.map(categoryOf))].sort(),
    [products],
  );

  const filtered = useMemo(() => {
    return products.filter(p => {
      if (categoryFilter && categoryOf(p) !== categoryFilter) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [products, search, categoryFilter]);

  const grouped = useMemo(() => {
    const map: Record<string, RestaurantProduct[]> = {};
    for (const p of filtered) {
      const cat = categoryOf(p);
      if (!map[cat]) map[cat] = [];
      map[cat].push(p);
    }
    return map;
  }, [filtered]);

  const cartItems = useMemo(
    () => products.filter(p => (cart[p.id] || 0) > 0),
    [products, cart],
  );

  const cartTotal = useMemo(
    () => cartItems.reduce((sum, p) => sum + (cart[p.id] || 0) * p.sale_price, 0),
    [cartItems, cart],
  );

  const cartCount = useMemo(
    () => Object.values(cart).reduce((s, v) => s + v, 0),
    [cart],
  );

  const changeCart = (id: string, delta: number) =>
    setCart(c => ({ ...c, [id]: Math.max(0, (c[id] || 0) + delta) }));

  const selectedTab = tabs.find(t => t.id === selectedTabId);

  const handleOpenNewTab = async () => {
    if (!newTableCode.trim()) return;
    setCreatingTab(true);
    try {
      const result = await openRestaurantTab({ tableCode: newTableCode.trim().toUpperCase(), location: newLocation.trim() || newTableCode.trim().toUpperCase() });
      await load();
      setSelectedTabId(result.id);
      setNewTableCode('');
      setNewLocation('');
      setTabPickerOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao abrir comanda.');
    } finally {
      setCreatingTab(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedTabId || cartCount === 0) return;
    setWorking(true);
    setError('');
    try {
      const items = cartItems.map(p => ({ productId: p.id, quantity: cart[p.id] }));
      const result = await createRestaurantOrder({ tabId: selectedTabId, origin: 'garcom', notes: orderNotes, items });
      setCart({});
      setOrderNotes('');
      setOrderModal(false);
      setConfirmed(`Pedido ${result.order_number} lançado com sucesso.`);
      setTimeout(() => setConfirmed(''), 4000);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao lançar pedido.');
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3eee5] text-[#1a0f0a] pb-28">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#1a0f0a] px-4 py-3 shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <button onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white">
            <ArrowLeft size={16} />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-[#c3a37a]">Cardápio</span>
            <span className="text-sm font-semibold text-white">Lançamento de Pedidos</span>
          </div>
          <div className="w-9" />
        </div>

        {/* Tab selector */}
        <div className="mt-3 relative">
          <button
            onClick={() => setTabPickerOpen(o => !o)}
            className="flex w-full items-center justify-between gap-2 rounded-xl border border-white/15 bg-white/8 px-3 py-2.5 text-left text-sm text-white"
          >
            <div className="flex items-center gap-2 min-w-0">
              <UtensilsCrossed size={14} className="text-[#c3a37a] shrink-0" />
              <span className="truncate">
                {selectedTab ? tableLabel(selectedTab) : 'Selecionar comanda / mesa'}
              </span>
            </div>
            <ChevronDown size={14} className={`shrink-0 transition-transform ${tabPickerOpen ? 'rotate-180' : ''}`} />
          </button>

          {tabPickerOpen && (
            <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border border-black/10 bg-white shadow-xl overflow-hidden">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => { setSelectedTabId(tab.id); setTabPickerOpen(false); }}
                  className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm border-b border-black/6 last:border-b-0 hover:bg-[#f4efe6] transition ${selectedTabId === tab.id ? 'bg-[#f4efe6] font-semibold' : ''}`}>
                  <span>{tableLabel(tab)}</span>
                  <span className="text-xs text-black/40">{cents(tab.total)}</span>
                </button>
              ))}
              <div className="border-t border-black/8 p-3 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-black/35">Nova comanda</p>
                <div className="flex gap-2">
                  <input value={newTableCode} onChange={e => setNewTableCode(e.target.value)} placeholder="Código (ex: DECK-03)"
                    className="h-9 flex-1 rounded-lg border border-black/10 px-2 text-xs outline-none focus:border-[#c3a37a]" />
                  <input value={newLocation} onChange={e => setNewLocation(e.target.value)} placeholder="Local (opcional)"
                    className="h-9 flex-1 rounded-lg border border-black/10 px-2 text-xs outline-none focus:border-[#c3a37a]" />
                  <button onClick={handleOpenNewTab} disabled={creatingTab || !newTableCode.trim()}
                    className="h-9 rounded-lg bg-[#1a0f0a] px-3 text-xs font-bold text-white disabled:opacity-40">
                    {creatingTab ? '...' : 'Abrir'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="px-4 pt-4 space-y-4">
        {/* Alerts */}
        {error && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <span>{error}</span>
            <button onClick={() => setError('')}><X size={14} /></button>
          </div>
        )}
        {confirmed && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <Check size={16} className="shrink-0" />
            <span>{confirmed}</span>
          </div>
        )}

        {/* Search + category filter */}
        <div className="space-y-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-3.5 text-black/35" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar produto..."
              className="h-11 w-full rounded-xl border border-black/10 bg-white pl-9 pr-3 text-sm outline-none focus:border-[#c3a37a] shadow-sm" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button onClick={() => setCategoryFilter('')}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${!categoryFilter ? 'bg-[#1a0f0a] text-white' : 'bg-white border border-black/10 text-black/60'}`}>
              Todos
            </button>
            {categories.map(cat => (
              <button key={cat} onClick={() => setCategoryFilter(cat === categoryFilter ? '' : cat)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${categoryFilter === cat ? 'bg-[#c3a37a] text-[#1a0f0a]' : 'bg-white border border-black/10 text-black/60'}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product list */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="animate-pulse flex gap-3 rounded-xl bg-white p-4 shadow-sm">
                <div className="h-14 w-14 shrink-0 rounded-lg bg-black/8" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-2/3 rounded bg-black/8" />
                  <div className="h-3 w-1/3 rounded bg-black/8" />
                </div>
                <div className="h-8 w-20 shrink-0 rounded-lg bg-black/8" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat}>
                <p className="mb-2 font-serif text-xl italic text-[#1a0f0a]">{cat}</p>
                <div className="space-y-2">
                  {items.map(product => {
                    const qty = cart[product.id] || 0;
                    const outOfStock = Number(product.stock_quantity) <= 0;
                    return (
                      <div key={product.id} className={`flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm transition ${outOfStock ? 'opacity-50' : ''}`}>
                        {product.image_url ? (
                          <img src={product.image_url} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                        ) : (
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-[#f4efe6] text-[#c3a37a]">
                            <UtensilsCrossed size={20} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold leading-tight truncate">{product.name}</p>
                          <p className="text-xs font-bold text-[#c3a37a]">{cents(product.sale_price)}</p>
                          {outOfStock && <span className="text-[10px] font-semibold text-red-600">Sem estoque</span>}
                          {!outOfStock && product.show_on_guest_menu && (
                            <span className="text-[9px] font-bold uppercase tracking-wide text-emerald-600">Cardápio público</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {qty > 0 && (
                            <>
                              <button onClick={() => changeCart(product.id, -1)}
                                className="flex h-7 w-7 items-center justify-center rounded-full border border-black/15 text-black/60 hover:border-black/40 transition">
                                <Minus size={11} />
                              </button>
                              <span className="w-5 text-center text-sm font-bold">{qty}</span>
                            </>
                          )}
                          <button onClick={() => !outOfStock && changeCart(product.id, 1)} disabled={outOfStock}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1a0f0a] text-white hover:bg-[#c3a37a] hover:text-[#1a0f0a] transition disabled:opacity-40">
                            <Plus size={11} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {Object.keys(grouped).length === 0 && (
              <div className="rounded-xl border border-dashed border-black/15 bg-white p-8 text-center text-sm text-black/40">
                Nenhum produto encontrado.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating cart bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-black/8 bg-[#1a0f0a] px-4 py-3 shadow-2xl">
          <button
            onClick={() => setOrderModal(true)}
            disabled={!selectedTabId}
            className="flex w-full items-center justify-between rounded-2xl bg-[#c3a37a] px-5 py-3.5 text-[#1a0f0a] disabled:opacity-40 hover:bg-amber-300 transition"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart size={16} />
              <span className="text-xs font-bold uppercase tracking-widest">{cartCount} {cartCount === 1 ? 'item' : 'itens'}</span>
            </div>
            <span className="font-bold">{cents(cartTotal)}</span>
            <span className="text-xs font-bold uppercase tracking-widest">Lançar →</span>
          </button>
          {!selectedTabId && (
            <p className="mt-1.5 text-center text-[10px] text-white/50">Selecione uma comanda primeiro</p>
          )}
        </div>
      )}

      {/* Order confirmation modal */}
      {orderModal && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => !working && setOrderModal(false)} />
          <div className="relative w-full rounded-t-3xl bg-white p-5 pb-8 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-2xl">Confirmar pedido</h2>
              <button onClick={() => setOrderModal(false)} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/5">
                <X size={16} />
              </button>
            </div>

            {selectedTab && (
              <div className="mb-4 rounded-xl bg-[#f4efe6] px-4 py-2.5 text-sm">
                <span className="text-black/50">Comanda: </span>
                <span className="font-semibold">{tableLabel(selectedTab)}</span>
              </div>
            )}

            <div className="mb-4 space-y-2 max-h-48 overflow-y-auto">
              {cartItems.map(p => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <span>{cart[p.id]}× {p.name}</span>
                  <span className="font-semibold text-[#c3a37a]">{cents(cart[p.id] * p.sale_price)}</span>
                </div>
              ))}
            </div>

            <div className="mb-4 flex items-center justify-between border-t border-black/8 pt-3 text-sm font-bold">
              <span>Total do pedido</span>
              <span className="text-base">{cents(cartTotal)}</span>
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-black/40">Observações (opcional)</label>
              <textarea value={orderNotes} onChange={e => setOrderNotes(e.target.value)}
                placeholder="Ex: sem cebola, alergia a camarão..."
                className="h-16 w-full resize-none rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-[#c3a37a]" />
            </div>

            <button onClick={handlePlaceOrder} disabled={working}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1a0f0a] py-4 text-xs font-bold uppercase tracking-[0.2em] text-white disabled:opacity-50 hover:bg-[#c3a37a] hover:text-[#1a0f0a] transition">
              {working ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              {working ? 'Lançando...' : 'Confirmar pedido'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
