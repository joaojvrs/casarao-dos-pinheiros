create unique index if not exists restaurant_suppliers_name_key
  on public.restaurant_suppliers (name);

create or replace function public.can_access_restaurant()
returns boolean
language sql
stable
as $$
  select
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'visitor') in ('master', 'admin', 'manager', 'kitchen')
    or coalesce((auth.jwt() -> 'app_metadata' -> 'permissions' ->> 'kitchen')::boolean, false)
    or coalesce((auth.jwt() -> 'app_metadata' -> 'permissions' ->> 'roomService')::boolean, false)
    or coalesce((auth.jwt() -> 'app_metadata' -> 'permissions' ->> 'payments')::boolean, false)
$$;

insert into public.restaurant_tables (code, location)
values
  ('DECK-01', 'Deck 01'),
  ('DECK-02', 'Deck 02'),
  ('PISCINA', 'Piscina'),
  ('CHAL_PIN', 'Chale Pinheiros')
on conflict (code) do nothing;

insert into public.restaurant_products (category_id, sku, name, description, unit, cost_price, sale_price, stock_quantity, min_stock)
select category.id, seed.sku, seed.name, seed.description, seed.unit, seed.cost_price, seed.sale_price, seed.stock_quantity, seed.min_stock
from (
  values
    ('Bebidas', 'AGUA-500', 'Agua Mineral 500ml', 'Agua mineral sem gas.', 'un', 250, 0, 44, 24),
    ('Bebidas', 'VINHO-MINI', 'Vinho Tinto Mini', 'Garrafa individual selecionada pela casa.', 'un', 1800, 3500, 12, 8),
    ('Snacks', 'CASTANHAS', 'Mix de Castanhas', 'Castanhas selecionadas para consumo no quarto.', 'un', 1100, 2200, 5, 10),
    ('Snacks', 'CHOC-AMARGO', 'Chocolate Amargo', 'Chocolate 70% cacau.', 'un', 700, 1500, 9, 12),
    ('Pratos', 'RISOTO-COG', 'Risoto de Cogumelos', 'Risoto cremoso com cogumelos frescos.', 'un', 3800, 8600, 18, 6),
    ('Pratos', 'TABUA-FRIA', 'Tabua Vale do Eden', 'Queijos, castanhas, geleias e paes rusticos.', 'un', 7600, 18600, 10, 4)
) as seed(category_name, sku, name, description, unit, cost_price, sale_price, stock_quantity, min_stock)
join public.restaurant_categories category on category.name = seed.category_name
on conflict (sku) do nothing;
