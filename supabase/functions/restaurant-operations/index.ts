import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Action =
  | 'summary'
  | 'garcon_menu'
  | 'save_product'
  | 'open_tab'
  | 'create_order'
  | 'update_order_status'
  | 'close_tab'
  | 'open_cash'
  | 'close_cash'
  | 'adjust_stock';

interface ProductInput {
  id?: string;
  categoryName: string;
  supplierName?: string;
  sku?: string;
  name: string;
  description?: string;
  unit?: string;
  costPrice: number;
  salePrice: number;
  stockQuantity: number;
  minStock: number;
  active?: boolean;
  showOnGuestMenu?: boolean;
  imageUrl?: string | null;
}

interface OrderItemInput {
  productId: string;
  quantity: number;
  notes?: string;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function money(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) throw new Error('Valor financeiro invalido.');
  return Math.round(number * 100);
}

function quantity(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) throw new Error('Quantidade invalida.');
  return number;
}

function code(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

async function getContext(req: Request) {
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.replace('Bearer ', '');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) throw new Error('Backend sem configuracao do Supabase.');

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: requester, error } = await supabase.auth.getUser(token);
  if (error || !requester.user) return { supabase, userId: null, role: 'visitor', permissions: {} as Record<string, boolean> };

  const role = String(requester.user.app_metadata?.role || 'visitor');
  const permissions = (requester.user.app_metadata?.permissions || {}) as Record<string, boolean>;
  return { supabase, userId: requester.user.id, role, permissions };
}

function assertRestaurantAccess(role: string, permissions: Record<string, boolean>) {
  if (['master', 'admin', 'manager', 'kitchen'].includes(role)) return;
  if (permissions.kitchen || permissions.roomService || permissions.payments) return;
  throw Object.assign(new Error('Acesso restrito a equipe do restaurante.'), { status: 403 });
}

function assertManagerAccess(role: string, permissions: Record<string, boolean>) {
  if (['master', 'admin', 'manager'].includes(role) || permissions.settings || permissions.payments) return;
  throw Object.assign(new Error('Acesso restrito a gestores do restaurante.'), { status: 403 });
}

async function getCategoryId(supabase: ReturnType<typeof createClient>, name: string) {
  const cleanName = String(name || '').trim();
  if (cleanName.length < 2) throw new Error('Informe a categoria do produto.');

  const { data, error } = await supabase
    .from('restaurant_categories')
    .upsert({ name: cleanName, active: true }, { onConflict: 'name' })
    .select('id')
    .single();

  if (error) throw error;
  return data.id as string;
}

async function getSupplierId(supabase: ReturnType<typeof createClient>, name?: string) {
  const cleanName = String(name || '').trim();
  if (!cleanName) return null;

  const { data, error } = await supabase
    .from('restaurant_suppliers')
    .upsert({ name: cleanName, active: true, updated_at: new Date().toISOString() }, { onConflict: 'name' })
    .select('id')
    .single();

  if (error) throw error;
  return data.id as string;
}

async function summary(supabase: ReturnType<typeof createClient>) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    productsResult, ordersResult, tabsResult, salesResult, cashResult, categoriesResult,
    movementsResult, receivablesResult, payablesResult, staffResult,
  ] = await Promise.all([
    supabase.from('restaurant_products').select('id, name, category_id, sku, unit, cost_price, sale_price, stock_quantity, min_stock, active, show_on_guest_menu, image_url, restaurant_categories(name)').order('name'),
    supabase.from('restaurant_orders').select('id, order_number, tab_id, created_by, origin, status, notes, total, created_at, restaurant_order_items(id, name, quantity, unit_price, total, status, notes)').order('created_at', { ascending: false }).limit(30),
    supabase.from('restaurant_tabs').select('id, code, status, subtotal, discount, service_fee, total, opened_at, closed_at, restaurant_tables(code, location)').order('opened_at', { ascending: false }).limit(30),
    supabase.from('restaurant_sales').select('id, sale_number, status, subtotal, discount, total, payment_method, sold_by, sold_at').gte('sold_at', todayStart.toISOString()).order('sold_at', { ascending: false }),
    supabase.from('restaurant_cash_sessions').select('id, status, opening_amount, closing_amount, opened_at, closed_at').order('opened_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('restaurant_categories').select('id, name, active').eq('active', true).order('name'),
    supabase.from('restaurant_stock_movements').select('id, movement_type, quantity, reason, created_at, reference_type, restaurant_products(name, unit)').gte('created_at', todayStart.toISOString()).order('created_at', { ascending: false }).limit(100),
    supabase.from('restaurant_receivables').select('id, description, amount, due_date, status').eq('status', 'open').order('due_date'),
    supabase.from('restaurant_payables').select('id, description, amount, due_date, status').eq('status', 'open').order('due_date'),
    supabase.from('profiles').select('id, name').order('name'),
  ]);

  // Only throw for the tables that must exist; others fall back to empty
  if (productsResult.error) throw productsResult.error;
  if (ordersResult.error) throw ordersResult.error;
  if (tabsResult.error) throw tabsResult.error;

  const products = productsResult.data || [];
  const orders = ordersResult.data || [];
  const tabs = tabsResult.data || [];
  const sales = salesResult.data || [];
  const openTabs = tabs.filter(tab => ['open', 'pending_payment'].includes(tab.status));
  const activeOrders = orders.filter(order => ['new', 'preparing', 'ready'].includes(order.status));
  const dailyRevenue = sales.filter(sale => sale.status === 'paid').reduce((sum, sale) => sum + Number(sale.total || 0), 0);

  return {
    products,
    categories: categoriesResult.data || [],
    orders,
    tabs,
    sales,
    cashSession: cashResult.data ?? null,
    stockMovements: movementsResult.data || [],
    receivables: receivablesResult.data || [],
    payables: payablesResult.data || [],
    staff: staffResult.data || [],
    metrics: {
      activeOrders: activeOrders.length,
      openTabs: openTabs.length,
      lowStock: products.filter(product => Number(product.stock_quantity) < Number(product.min_stock)).length,
      dailyRevenue,
      pendingRevenue: tabs.filter(tab => tab.status === 'pending_payment').reduce((sum, tab) => sum + Number(tab.total || 0), 0),
    },
  };
}

async function garconMenu(supabase: ReturnType<typeof createClient>) {
  const [productsResult, tabsResult, roomsResult] = await Promise.all([
    supabase
      .from('restaurant_products')
      .select('id, name, description, sale_price, stock_quantity, active, show_on_guest_menu, image_url, restaurant_categories(name)')
      .eq('active', true)
      .order('name'),
    supabase
      .from('restaurant_tabs')
      .select('id, code, booking_id, status, subtotal, total, restaurant_tables(code, location)')
      .in('status', ['open', 'pending_payment'])
      .order('opened_at', { ascending: false }),
    supabase
      .from('fd_room_assignments')
      .select('id, booking_id, quarto_numero, checkin_real, checkout_previsto, adultos, criancas, bookings(confirmation_code, guests(name, phone))')
      .eq('status', 'checked_in')
      .order('quarto_numero'),
  ]);
  if (productsResult.error) throw productsResult.error;
  if (tabsResult.error) throw tabsResult.error;
  if (roomsResult.error) throw roomsResult.error;
  const activeRooms = (roomsResult.data || []).map((item: Record<string, unknown>) => {
    const booking = Array.isArray(item.bookings) ? item.bookings[0] : item.bookings as Record<string, unknown> | null;
    const guest = booking ? (Array.isArray(booking.guests) ? booking.guests[0] : booking.guests as Record<string, unknown> | null) : null;
    return {
      assignment_id: item.id,
      booking_id: item.booking_id,
      room_number: item.quarto_numero,
      guest_name: guest?.name || 'Hospede',
      guest_phone: guest?.phone || null,
      checkin_real: item.checkin_real || null,
      checkout_previsto: item.checkout_previsto,
      adults: Number(item.adultos || 0),
      children: Number(item.criancas || 0),
    };
  });
  return { products: productsResult.data || [], tabs: tabsResult.data || [], activeRooms };
}

async function saveProduct(supabase: ReturnType<typeof createClient>, input: ProductInput) {
  const name = String(input.name || '').trim();
  if (name.length < 2) throw new Error('Informe o nome do produto.');

  const categoryId = await getCategoryId(supabase, input.categoryName);
  const supplierId = await getSupplierId(supabase, input.supplierName);

  const product = {
    category_id: categoryId,
    supplier_id: supplierId,
    sku: input.sku?.trim() || null,
    name,
    description: input.description?.trim() || null,
    unit: input.unit?.trim() || 'un',
    cost_price: money(input.costPrice),
    sale_price: money(input.salePrice),
    stock_quantity: Number(input.stockQuantity || 0),
    min_stock: Number(input.minStock || 0),
    active: input.active ?? true,
    show_on_guest_menu: input.showOnGuestMenu ?? false,
    image_url: input.imageUrl?.trim() || null,
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { data, error } = await supabase.from('restaurant_products').update(product).eq('id', input.id).select('id').single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase.from('restaurant_products').insert(product).select('id').single();
  if (error) throw error;
  return data;
}

async function openTab(supabase: ReturnType<typeof createClient>, userId: string, payload: Record<string, unknown>) {
  const location = String(payload.location || '').trim() || 'Restaurante';
  const tableCode = String(payload.tableCode || location).trim().toUpperCase();

  const { data: table, error: tableError } = await supabase
    .from('restaurant_tables')
    .upsert({ code: tableCode, location, active: true }, { onConflict: 'code' })
    .select('id')
    .single();
  if (tableError) throw tableError;

  const { data: existing, error: existingError } = await supabase
    .from('restaurant_tabs')
    .select('id, code')
    .eq('table_id', table.id)
    .in('status', ['open', 'pending_payment'])
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing) return existing;

  const { data, error } = await supabase
    .from('restaurant_tabs')
    .insert({
      code: code('CMD'),
      table_id: table.id,
      booking_id: payload.bookingId || null,
      status: 'open',
      opened_by: userId,
    })
    .select('id, code')
    .single();

  if (error) throw error;
  return data;
}

async function createOrder(supabase: ReturnType<typeof createClient>, userId: string, payload: Record<string, unknown>) {
  const tabId = String(payload.tabId || '');
  const items = (payload.items || []) as OrderItemInput[];
  if (!tabId) throw new Error('Selecione uma comanda.');
  if (!Array.isArray(items) || items.length === 0) throw new Error('Inclua pelo menos um item no pedido.');

  const productIds = items.map(item => item.productId).filter(Boolean);
  const { data: products, error: productError } = await supabase
    .from('restaurant_products')
    .select('id, name, sale_price, stock_quantity, active')
    .in('id', productIds);
  if (productError) throw productError;

  const productMap = new Map((products || []).map(product => [product.id, product]));
  const orderItems = items.map(item => {
    const product = productMap.get(item.productId);
    if (!product || !product.active) throw new Error('Produto indisponivel no cardapio.');
    const qty = quantity(item.quantity);
    const stockQty = product.stock_quantity;
    if (stockQty !== null && Number(stockQty) > 0 && Number(stockQty) < qty) {
      throw new Error(`Estoque insuficiente para ${product.name}.`);
    }
    return {
      product,
      quantity: qty,
      notes: item.notes?.trim() || null,
      total: Math.round(qty * Number(product.sale_price)),
    };
  });

  const total = orderItems.reduce((sum, item) => sum + item.total, 0);

  const { data: order, error: orderError } = await supabase
    .from('restaurant_orders')
    .insert({
      tab_id: tabId,
      booking_id: payload.bookingId || null,
      order_number: code('PED'),
      origin: String(payload.origin || 'restaurant'),
      status: 'new',
      notes: String(payload.notes || '').trim() || null,
      total,
      created_by: userId,
    })
    .select('id, order_number')
    .single();
  if (orderError) throw orderError;

  const { error: itemError } = await supabase.from('restaurant_order_items').insert(orderItems.map(item => ({
    order_id: order.id,
    product_id: item.product.id,
    name: item.product.name,
    quantity: item.quantity,
    unit_price: item.product.sale_price,
    status: 'new',
    notes: item.notes,
  })));
  if (itemError) throw itemError;

  for (const item of orderItems) {
    const currentStock = Number(item.product.stock_quantity ?? 0);
    if (currentStock > 0) {
      const { error: stockError } = await supabase
        .from('restaurant_products')
        .update({ stock_quantity: Math.max(0, currentStock - item.quantity), updated_at: new Date().toISOString() })
        .eq('id', item.product.id);
      if (stockError) throw stockError;

      const { error: movementError } = await supabase.from('restaurant_stock_movements').insert({
        product_id: item.product.id,
        movement_type: 'out',
        quantity: item.quantity,
        unit_cost: 0,
        reason: `Pedido ${order.order_number}`,
        reference_type: 'restaurant_order',
        reference_id: order.id,
        created_by: userId,
      });
      if (movementError) throw movementError;
    }
  }

  const { data: tab, error: tabError } = await supabase.from('restaurant_tabs').select('subtotal, total').eq('id', tabId).single();
  if (tabError) throw tabError;

  const subtotal = Number(tab.subtotal || 0) + total;
  const { error: updateTabError } = await supabase
    .from('restaurant_tabs')
    .update({ subtotal, total: subtotal, updated_at: new Date().toISOString() })
    .eq('id', tabId);
  if (updateTabError) throw updateTabError;

  return order;
}

async function updateOrderStatus(supabase: ReturnType<typeof createClient>, payload: Record<string, unknown>) {
  const id = String(payload.orderId || '');
  const status = String(payload.status || '');
  if (!id) throw new Error('Pedido nao informado.');
  if (!['new', 'preparing', 'ready', 'delivered', 'cancelled'].includes(status)) throw new Error('Status de pedido invalido.');

  const { data, error } = await supabase
    .from('restaurant_orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id')
    .single();
  if (error) throw error;

  await supabase.from('restaurant_order_items').update({ status }).eq('order_id', id).neq('status', 'cancelled');
  return data;
}

async function closeTab(supabase: ReturnType<typeof createClient>, userId: string, payload: Record<string, unknown>) {
  const tabId = String(payload.tabId || '');
  const paymentMethod = String(payload.paymentMethod || 'room');
  const discount = money(payload.discount || 0);
  if (!tabId) throw new Error('Comanda nao informada.');
  if (!['cash', 'card', 'pix', 'room', 'courtesy'].includes(paymentMethod)) throw new Error('Forma de pagamento invalida.');

  const { data: tab, error: tabError } = await supabase.from('restaurant_tabs').select('id, booking_id, subtotal, service_fee').eq('id', tabId).single();
  if (tabError) throw tabError;

  const subtotal = Number(tab.subtotal || 0);
  const serviceFee = Number(tab.service_fee || 0);
  const total = Math.max(0, subtotal + serviceFee - discount);

  const { data: sale, error: saleError } = await supabase
    .from('restaurant_sales')
    .insert({
      tab_id: tabId,
      booking_id: tab.booking_id,
      sale_number: code('VEN'),
      status: 'paid',
      subtotal,
      discount,
      total,
      payment_method: paymentMethod,
      sold_by: userId,
    })
    .select('id, sale_number, total')
    .single();
  if (saleError) throw saleError;

  const { error: closeError } = await supabase
    .from('restaurant_tabs')
    .update({ status: 'paid', discount, total, closed_by: userId, closed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', tabId);
  if (closeError) throw closeError;

  if (paymentMethod === 'room') {
    const dueDate = new Date().toISOString().slice(0, 10);
    const { error: receivableError } = await supabase.from('restaurant_receivables').insert({
      sale_id: sale.id,
      description: `Consumo restaurante ${sale.sale_number}`,
      amount: total,
      due_date: dueDate,
      status: 'open',
    });
    if (receivableError) throw receivableError;
  }

  return sale;
}

async function adjustStock(supabase: ReturnType<typeof createClient>, userId: string, payload: Record<string, unknown>) {
  const productId = String(payload.productId || '');
  const qty = quantity(payload.quantity);
  const reason = String(payload.reason || 'Entrada de estoque').trim();
  if (!productId) throw new Error('Produto nao informado.');

  const { data: product, error: productError } = await supabase
    .from('restaurant_products')
    .select('id, stock_quantity')
    .eq('id', productId)
    .single();
  if (productError) throw productError;

  const newQty = Number(product.stock_quantity) + qty;
  const { error: updateError } = await supabase
    .from('restaurant_products')
    .update({ stock_quantity: newQty, updated_at: new Date().toISOString() })
    .eq('id', productId);
  if (updateError) throw updateError;

  const { error: movementError } = await supabase.from('restaurant_stock_movements').insert({
    product_id: productId,
    movement_type: 'in',
    quantity: qty,
    unit_cost: 0,
    reason,
    reference_type: 'purchase',
    created_by: userId,
  });
  if (movementError) throw movementError;

  return { id: productId, new_quantity: newQty };
}

async function openCash(supabase: ReturnType<typeof createClient>, userId: string, payload: Record<string, unknown>) {
  const { data: current, error: currentError } = await supabase.from('restaurant_cash_sessions').select('id').eq('status', 'open').maybeSingle();
  if (currentError) throw currentError;
  if (current) return current;

  const { data, error } = await supabase
    .from('restaurant_cash_sessions')
    .insert({ opened_by: userId, opening_amount: money(payload.openingAmount || 0), notes: String(payload.notes || '').trim() || null })
    .select('id')
    .single();
  if (error) throw error;
  return data;
}

async function closeCash(supabase: ReturnType<typeof createClient>, userId: string, payload: Record<string, unknown>) {
  const sessionId = String(payload.sessionId || '');
  if (!sessionId) throw new Error('Caixa nao informado.');

  const { data, error } = await supabase
    .from('restaurant_cash_sessions')
    .update({ status: 'closed', closed_by: userId, closing_amount: money(payload.closingAmount || 0), closed_at: new Date().toISOString(), notes: String(payload.notes || '').trim() || null })
    .eq('id', sessionId)
    .eq('status', 'open')
    .select('id')
    .single();
  if (error) throw error;
  return data;
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Metodo nao permitido.' }, 405);

  try {
    const body = await req.json() as { action?: Action; payload?: Record<string, unknown> };
    const action = body.action;
    const payload = body.payload || {};
    const { supabase, userId, role, permissions } = await getContext(req);
    assertRestaurantAccess(role, permissions);
    if (!userId) return json({ error: 'Sessao invalida.' }, 401);

    if (action === 'summary') return json({ data: await summary(supabase) });
    if (action === 'garcon_menu') return json({ data: await garconMenu(supabase) });
    if (action === 'save_product') {
      assertManagerAccess(role, permissions);
      return json({ data: await saveProduct(supabase, payload as unknown as ProductInput) }, 201);
    }
    if (action === 'open_tab') return json({ data: await openTab(supabase, userId, payload) }, 201);
    if (action === 'create_order') return json({ data: await createOrder(supabase, userId, payload) }, 201);
    if (action === 'update_order_status') return json({ data: await updateOrderStatus(supabase, payload) });
    if (action === 'close_tab') return json({ data: await closeTab(supabase, userId, payload) }, 201);
    if (action === 'open_cash') return json({ data: await openCash(supabase, userId, payload) }, 201);
    if (action === 'close_cash') return json({ data: await closeCash(supabase, userId, payload) });
    if (action === 'adjust_stock') return json({ data: await adjustStock(supabase, userId, payload) });

    return json({ error: 'Acao invalida.' }, 400);
  } catch (error) {
    const status = typeof (error as { status?: unknown }).status === 'number' ? (error as { status: number }).status : 500;
    const message = error instanceof Error
      ? error.message
      : (error as { message?: string }).message || 'Erro inesperado no restaurante.';
    return json({ error: message }, status);
  }
});
