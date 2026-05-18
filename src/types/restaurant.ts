export type RestaurantOrderStatus = 'new' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
export type RestaurantTabStatus = 'open' | 'pending_payment' | 'paid' | 'cancelled';
export type RestaurantPaymentMethod = 'cash' | 'card' | 'pix' | 'room' | 'courtesy';

export interface RestaurantProduct {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  unit: string;
  cost_price: number;
  sale_price: number;
  stock_quantity: number;
  min_stock: number;
  active: boolean;
  show_on_guest_menu: boolean;
  image_url: string | null;
  restaurant_categories?: { name: string } | { name: string }[] | null;
}

export interface MenuProduct {
  id: string;
  name: string;
  description: string | null;
  sale_price: number;
  image_url: string | null;
  restaurant_categories?: { name: string } | null;
}

export interface GarconMenu {
  products: RestaurantProduct[];
  tabs: RestaurantTab[];
}

export interface RestaurantOrderItem {
  id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total: number;
  status: RestaurantOrderStatus;
  notes: string | null;
}

export interface RestaurantOrder {
  id: string;
  tab_id?: string;
  created_by?: string | null;
  order_number: string;
  origin: string;
  status: RestaurantOrderStatus;
  notes: string | null;
  total: number;
  created_at: string;
  restaurant_order_items?: RestaurantOrderItem[];
}

export interface RestaurantTab {
  id: string;
  code: string;
  status: RestaurantTabStatus;
  subtotal: number;
  discount: number;
  service_fee: number;
  total: number;
  opened_at: string;
  closed_at: string | null;
  restaurant_tables?: { code: string; location: string | null } | { code: string; location: string | null }[] | null;
}

export interface RestaurantSale {
  id: string;
  sale_number: string;
  status: 'pending' | 'paid' | 'cancelled' | 'refunded';
  subtotal: number;
  discount: number;
  total: number;
  payment_method: RestaurantPaymentMethod;
  sold_by: string | null;
  sold_at: string;
}

export interface RestaurantCashSession {
  id: string;
  status: 'open' | 'closed';
  opening_amount: number;
  closing_amount: number | null;
  opened_at: string;
  closed_at: string | null;
}

export interface RestaurantCategory {
  id: string;
  name: string;
  active: boolean;
}

export interface RestaurantStockMovement {
  id: string;
  movement_type: 'in' | 'out' | 'adjustment' | 'waste';
  quantity: number;
  reason: string | null;
  created_at: string;
  reference_type: string | null;
  restaurant_products?: { name: string; unit: string } | { name: string; unit: string }[] | null;
}

export interface RestaurantReceivable {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  status: 'open' | 'received' | 'cancelled';
}

export interface RestaurantPayable {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  status: 'open' | 'paid' | 'cancelled';
}

export interface RestaurantStaffProfile {
  id: string;
  name: string;
}

export interface RestaurantSummary {
  products: RestaurantProduct[];
  categories: RestaurantCategory[];
  orders: RestaurantOrder[];
  tabs: RestaurantTab[];
  sales: RestaurantSale[];
  cashSession: RestaurantCashSession | null;
  stockMovements: RestaurantStockMovement[];
  receivables: RestaurantReceivable[];
  payables: RestaurantPayable[];
  staff: RestaurantStaffProfile[];
  metrics: {
    activeOrders: number;
    openTabs: number;
    lowStock: number;
    dailyRevenue: number;
    pendingRevenue: number;
  };
}

export interface RestaurantProductInput {
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
