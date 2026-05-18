-- =============================================================
-- Cardapio completo do Casarao dos Pinheiros
-- 37 produtos organizados em categorias
-- Precos em centavos · show_on_guest_menu = true para todos
-- =============================================================

-- Novas categorias (existentes nao sao afetadas)
insert into public.restaurant_categories (name, active)
values
  ('Cervejas',   true),
  ('Drinks',     true),
  ('Refeicoes',  true),
  ('Hospedagem', true)
on conflict (name) do nothing;

-- Produtos
-- Colunas: category_name, sku, name, sale_price (centavos), stock_quantity, min_stock
insert into public.restaurant_products
  (category_id, sku, name, unit, cost_price, sale_price, stock_quantity, min_stock, active, show_on_guest_menu)
select
  cat.id,
  p.sku,
  p.name,
  'un',
  0,
  p.sale_price,
  p.stock_quantity,
  p.min_stock,
  true,
  true
from (
  values
    -- Bebidas nao alcoolicas
    ('Bebidas',    '27',  'Agua de Coco 300ml',                1290, 30, 10),
    ('Bebidas',    '6',   'Agua Mineral com Gas',               690, 30, 10),
    ('Bebidas',    '5',   'Agua Mineral sem Gas',               690, 30, 10),
    ('Bebidas',    '17',  'Agua Tonica',                        890, 30, 10),
    -- Cervejas
    ('Cervejas',   '610', 'Antartica Original 600ml',          1990, 24, 12),
    ('Cervejas',   '624', 'Cerveja Heineken 600ml',            1990, 24, 12),
    ('Cervejas',   '8',   'Cerveja Long Neck Corona',          1490, 24, 12),
    ('Cervejas',   '15',  'Cerveja Long Neck Corona Zero',     1490, 24, 12),
    ('Cervejas',   '9',   'Cerveja Long Neck Heineken',        1490, 24, 12),
    ('Cervejas',   '10',  'Cerveja Long Neck Michelob',        1490, 24, 12),
    ('Cervejas',   '609', 'Cerveja Long Neck Stella Artois',   1490, 24, 12),
    ('Cervejas',   '623', 'Cerveja Original 600ml',            1990, 24, 12),
    -- Drinks e Coqueteis
    ('Drinks',     '595', 'Abacaxi com Raspas de Limao',       3990, 50,  0),
    ('Drinks',     '590', 'Cachaca Capoeira',                  2990, 30,  5),
    ('Drinks',     '631', 'Caipirinha com Leite Condensado',   2590, 50,  0),
    ('Drinks',     '43',  'Caipirinha de Limao',               2190, 50,  0),
    ('Drinks',     '42',  'Caipiroska de Limao',               2990, 50,  0),
    ('Drinks',     '41',  'Caipiroska de Maracuja',            2990, 50,  0),
    ('Drinks',     '40',  'Caipiroska de Morango',             2990, 50,  0),
    ('Drinks',     '44',  'Cajalemon',                         3490, 50,  0),
    ('Drinks',     '565', 'Campari 100ml',                     1990, 30,  5),
    ('Drinks',     '604', 'Creme de Maracuja',                 2990, 30,  0),
    ('Drinks',     '584', 'Creme de Morango',                  2990, 30,  0),
    -- Snacks
    ('Snacks',     '105', 'Biscoito Oreo',                      490, 20,  5),
    ('Snacks',     '102', 'Chocolate Kitkat',                  1590, 20,  5),
    ('Snacks',     '101', 'Chocolate Talento',                  690, 20,  5),
    ('Snacks',     '104', 'Capsula 3 Coracoes',                 590, 30, 10),
    -- Pratos e Petiscos
    ('Pratos',     '556', 'Batata Frita',                      4290, 30,  0),
    ('Pratos',     '555', 'Bolinho de Arroz',                  4990, 20,  0),
    ('Pratos',     '559', 'Bolinho de Mandioca com Carne Seca',4990, 20,  0),
    ('Pratos',     '566', 'Bolo de Chocolate',                  990, 10,  0),
    ('Pratos',     '628', 'Caldos Diversos',                   3290, 20,  0),
    ('Pratos',     '546', 'Camafeu de Camarao',                8690, 10,  0),
    ('Pratos',     '607', 'Chorizo na Tabua 500g',            13990, 10,  0),
    -- Refeicoes
    ('Refeicoes',  '50',  'Cafe da Manha',                     4590, 20,  0),
    ('Refeicoes',  '625', 'Almoco e Jantar Extra',             6000, 20,  0),
    -- Hospedagem / Servicos
    ('Hospedagem', '532', 'Adicional Hospede Diaria Suite',    5000, 10,  0)
) as p(category_name, sku, name, sale_price, stock_quantity, min_stock)
join public.restaurant_categories cat on cat.name = p.category_name
on conflict (sku) do nothing;
