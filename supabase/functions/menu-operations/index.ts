import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Action = 'guest_menu' | 'place_guest_order';

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

function code(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

async function getAdmin() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) throw new Error('Backend sem configuracao do Supabase.');
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function getRequestUser(req: Request, supabase: ReturnType<typeof createClient>) {
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

async function guestMenu(supabase: ReturnType<typeof createClient>) {
  const { data, error } = await supabase
    .from('restaurant_products')
    .select('id, name, description, sale_price, image_url, restaurant_categories(name)')
    .eq('show_on_guest_menu', true)
    .eq('active', true)
    .order('name');

  if (error) throw error;
  return data || [];
}

async function placeGuestOrder(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  payload: Record<string, unknown>,
) {
  const items = (payload.items || []) as OrderItemInput[];
  const notes = String(payload.notes || '').trim() || null;
  const roomName = String(payload.roomName || 'Hospede').trim();

  if (!Array.isArray(items) || items.length === 0) throw new Error('Inclua pelo menos um item no pedido.');

  // Resolve or create the guest's table
  const tableCode = `GUEST-${userId.slice(0, 8).toUpperCase()}`;
  const { data: table, error: tableError } = await supabase
    .from('restaurant_tables')
    .upsert({ code: tableCode, location: roomName, active: true }, { onConflict: 'code' })
    .select('id')
    .single();
  if (tableError) throw tableError;

  // Find open tab or create one
  const { data: existingTab } = await supabase
    .from('restaurant_tabs')
    .select('id, code, subtotal')
    .eq('table_id', table.id)
    .in('status', ['open', 'pending_payment'])
    .maybeSingle();

  let tab = existingTab;
  if (!tab) {
    const { data: newTab, error: tabError } = await supabase
      .from('restaurant_tabs')
      .insert({ code: code('CMD'), table_id: table.id, status: 'open', opened_by: userId })
      .select('id, code, subtotal')
      .single();
    if (tabError) throw tabError;
    tab = newTab;
  }

  // Validate products
  const productIds = items.map(item => item.productId).filter(Boolean);
  const { data: products, error: productError } = await supabase
    .from('restaurant_products')
    .select('id, name, sale_price, stock_quantity, active, show_on_guest_menu')
    .in('id', productIds);
  if (productError) throw productError;

  const productMap = new Map((products || []).map(p => [p.id, p]));
  let orderTotal = 0;

  const orderItems = items.map(item => {
    const product = productMap.get(item.productId);
    if (!product || !product.active || !product.show_on_guest_menu) {
      throw new Error('Produto indisponivel no cardapio.');
    }
    const qty = Number(item.quantity);
    if (qty <= 0) throw new Error('Quantidade invalida.');
    if (Number(product.stock_quantity) < qty) throw new Error(`Estoque insuficiente para ${product.name}.`);
    const itemTotal = Math.round(qty * Number(product.sale_price));
    orderTotal += itemTotal;
    return { product, quantity: qty, notes: String(item.notes || '').trim() || null, total: itemTotal };
  });

  // Create order
  const { data: order, error: orderError } = await supabase
    .from('restaurant_orders')
    .insert({
      tab_id: tab.id,
      order_number: code('PED'),
      origin: 'guest',
      status: 'new',
      notes,
      total: orderTotal,
      created_by: userId,
    })
    .select('id, order_number')
    .single();
  if (orderError) throw orderError;

  // Create order items
  const { error: itemError } = await supabase.from('restaurant_order_items').insert(
    orderItems.map(item => ({
      order_id: order.id,
      product_id: item.product.id,
      name: item.product.name,
      quantity: item.quantity,
      unit_price: item.product.sale_price,
      status: 'new',
      notes: item.notes,
    })),
  );
  if (itemError) throw itemError;

  // Deduct stock
  for (const item of orderItems) {
    await supabase
      .from('restaurant_products')
      .update({ stock_quantity: Number(item.product.stock_quantity) - item.quantity, updated_at: new Date().toISOString() })
      .eq('id', item.product.id);
    await supabase.from('restaurant_stock_movements').insert({
      product_id: item.product.id,
      movement_type: 'out',
      quantity: item.quantity,
      unit_cost: 0,
      reason: `Pedido hospede ${order.order_number}`,
      reference_type: 'restaurant_order',
      reference_id: order.id,
      created_by: userId,
    });
  }

  // Update tab total
  const newSubtotal = Number(tab.subtotal || 0) + orderTotal;
  await supabase
    .from('restaurant_tabs')
    .update({ subtotal: newSubtotal, total: newSubtotal, updated_at: new Date().toISOString() })
    .eq('id', tab.id);

  return { orderId: order.id, orderNumber: order.order_number };
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Metodo nao permitido.' }, 405);

  try {
    const body = await req.json() as { action?: Action; payload?: Record<string, unknown> };
    const action = body.action;
    const payload = body.payload || {};
    const supabase = await getAdmin();

    if (action === 'guest_menu') {
      return json({ data: await guestMenu(supabase) });
    }

    if (action === 'place_guest_order') {
      const user = await getRequestUser(req, supabase);
      if (!user) return json({ error: 'Sessao invalida. Faca login para fazer pedidos.' }, 401);
      return json({ data: await placeGuestOrder(supabase, user.id, payload) }, 201);
    }

    return json({ error: 'Acao invalida.' }, 400);
  } catch (error) {
    const status = typeof (error as { status?: unknown }).status === 'number'
      ? (error as { status: number }).status
      : 500;
    const message = error instanceof Error ? error.message : 'Erro inesperado.';
    return json({ error: message }, status);
  }
});
