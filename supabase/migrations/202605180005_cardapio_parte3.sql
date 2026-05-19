-- =============================================================
-- Cardapio completo - parte 3
-- 83 produtos adicionais
-- Precos em centavos
-- =============================================================

-- Novas categorias
insert into public.restaurant_categories (name, active)
values
  ('Vinhos',   true),
  ('Servicos', true)
on conflict (name) do nothing;

-- Produtos e servicos visiveis ao hospede (show_on_guest_menu = true)
insert into public.restaurant_products
  (category_id, sku, name, unit, cost_price, sale_price, stock_quantity, min_stock, active, show_on_guest_menu)
select
  cat.id, p.sku, p.name, 'un', 0, p.sale_price, p.stock_quantity, p.min_stock, true, true
from (
  values
    -- Bebidas nao alcoolicas
    ('Bebidas',   '7',   'Toddynho',                                        690,  24, 10),
    ('Bebidas',   '11',  'Refrigerante Guarana Lata',                       890,  24, 12),
    ('Bebidas',   '12',  'Refrigerante Guarana Zero Lata',                  890,  24, 12),
    ('Bebidas',   '13',  'Refrigerante Coca-Cola Lata',                     890,  24, 12),
    ('Bebidas',   '14',  'Refrigerante Coca-Cola Zero Lata',                890,  24, 12),
    ('Bebidas',   '18',  'Agua Tonica Zero',                                890,  24, 12),
    ('Bebidas',   '19',  'Agua Tonica Pink Lemonade',                      1200,  24, 12),
    ('Bebidas',   '20',  'Schweppes Citrus',                                890,  24, 12),
    ('Bebidas',   '25',  'Suco Campo Largo Uva 250ml',                     1490,  24, 10),
    ('Bebidas',   '510', 'Suco Del Valle Lata',                             990,  24, 10),
    ('Bebidas',   '533', 'Suco Natural de Frutas 500ml',                   2590,  20,  5),
    ('Bebidas',   '611', 'Soda Italiana',                                  1290,  24, 12),
    ('Bebidas',   '621', 'St. Pierre',                                     1890,  24, 12),
    ('Bebidas',   '627', 'Refrigerante Sprite Lata',                        890,  24, 12),
    -- Drinks e destilados
    ('Drinks',    '26',  'Smirnoff Ice 275ml',                             1490,  24, 12),
    ('Drinks',    '28',  'Whisky Old Parr 12 Anos',                       19990,   4,  1),
    ('Drinks',    '29',  'Whisky Black Label 12 Anos',                    21990,   4,  1),
    ('Drinks',    '30',  'Whisky Gold Label 18 Anos',                     42990,   4,  1),
    ('Drinks',    '32',  'Vodka Absolut',                                 17990,   6,  2),
    ('Drinks',    '33',  'Vodka Grey Goose',                              38990,   4,  1),
    -- Snacks
    ('Snacks',    '504', 'Nutella B-Ready',                                 990,  20,  5),
    ('Snacks',    '620', 'Picole',                                         1590,  20,  5),
    ('Snacks',    '629', 'Sorvete Cone',                                   1890,  20,  5),
    -- Pratos e petiscos
    ('Pratos',    '522', 'Torta de Maracuja com Chocolate Branco',         3490,  10,  0),
    ('Pratos',    '524', 'Panna Cota com Calda de Frutas Vermelhas',       5990,  10,  0),
    ('Pratos',    '537', 'Strogonoff de File',                             8990,  15,  0),
    ('Pratos',    '538', 'Strogonoff de Frango',                           7990,  15,  0),
    ('Pratos',    '540', 'Macarrao Cremoso com Frango e Bacon Talharim',   7490,  15,  0),
    ('Pratos',    '542', 'Petit Gateau',                                   4990,  15,  0),
    ('Pratos',    '550', 'Pastelzinho de Carne e Queijo',                  4990,  20,  0),
    ('Pratos',    '551', 'Pastelzinho de Camarao',                         5890,  20,  0),
    ('Pratos',    '562', 'Torresminho a Pururuca',                         2990,  15,  0),
    ('Pratos',    '587', 'Rabada Mineira',                                 8690,  10,  0),
    ('Pratos',    '593', 'Panelinha do Sertao',                            8990,  10,  0),
    ('Pratos',    '594', 'Panelinha Mista',                                8990,  10,  0),
    ('Pratos',    '598', 'Tabua de Frios',                                16990,   8,  0),
    ('Pratos',    '599', 'Salada Caesar',                                  8990,  10,  0),
    ('Pratos',    '600', 'Salada Caprese',                                 9790,  10,  0),
    ('Pratos',    '603', 'Sorvete de Creme com Banana Caramelizada',       4990,  15,  0),
    ('Pratos',    '605', 'Sanduiche de Mignon com Fritas',                 4990,  15,  0),
    ('Pratos',    '606', 'Picanha na Tabua (500g)',                       21990,   8,  0),
    ('Pratos',    '614', 'Porcao de Mini Hamburguer',                      9990,  10,  0),
    ('Pratos',    '615', 'Porcao de Arroz',                                2990,  20,  0),
    ('Pratos',    '616', 'Tilapia ao Molho de Mostarda',                  14990,  10,  0),
    ('Pratos',    '617', 'Salmao Assado com Salada',                      16990,   8,  0),
    ('Pratos',    '619', 'Pastelzinho de Queijo',                          4990,  20,  0),
    ('Pratos',    '622', 'Macarrao ao Molho Branco com File',              8990,  15,  0),
    ('Pratos',    '630', 'Porcao de Tomate Palmito e Outros',              3990,  20,  0),
    ('Pratos',    '632', 'Misto Quente',                                   2590,  20,  0),
    ('Pratos',    '634', 'Salada de Frango',                               7990,  10,  0),
    ('Pratos',    '639', 'Picanha na Chapa (850g)',                       41990,   6,  0),
    ('Pratos',    '642', 'Pizza',                                          9990,  10,  0),
    ('Pratos',    '644', 'Salada de Tomate e Palmito',                     7990,  10,  0),
    ('Pratos',    '645', 'Pastelzinho de Carne',                           4990,  20,  0),
    ('Pratos',    '588', 'Tilapia Grelhada com Pure e Salada',             7990,  10,  0),
    -- Vinhos
    ('Vinhos',    '34',  'Vinho Rose Vik A 2021',                         26990,   4,  1),
    ('Vinhos',    '35',  'Vinho Branco Casal Garcia',                      9990,   6,  2),
    ('Vinhos',    '36',  'Vinho Branco Monte de Pinheiros Cartuxa',        9990,   6,  2),
    ('Vinhos',    '37',  'Vinho Branco This is Not Another',              21990,   4,  1),
    ('Vinhos',    '563', 'Vinho EA Cartuxa',                              12990,   6,  2),
    ('Vinhos',    '570', 'Vinho This is Not Another',                     21990,   4,  1),
    ('Vinhos',    '571', 'Vinho Perez Cruz',                              13990,   6,  2),
    ('Vinhos',    '572', 'Vinho Benjamin Nieto Senetiner',                 8990,   6,  2),
    ('Vinhos',    '573', 'Vinho Cabernet Malbec DV Catena',               28990,   4,  1),
    ('Vinhos',    '574', 'Vinho Angelica Zapata Cabernet',                49990,   4,  1),
    ('Vinhos',    '575', 'Vinho Rendez Vous Premier Merlot',              18990,   4,  1),
    ('Vinhos',    '576', 'Vinho Cordero con Piel de Lobo',                 9990,   6,  2),
    ('Vinhos',    '577', 'Vinho Cabernet Sauvignon e Syrah JP Chenet',    14990,   6,  2),
    ('Vinhos',    '578', 'Vinho Vik A Cabernet Sauvignon',                26990,   4,  1),
    ('Vinhos',    '591', 'Vinho Reservado Merlot',                         7990,   6,  2),
    ('Vinhos',    '601', 'Vinho Casal Garcia',                             9990,   6,  2),
    ('Vinhos',    '602', 'Vinho Monte de Pinheiros Cartuxa',              11990,   6,  2),
    -- Servicos visiveis ao hospede
    ('Servicos',  '62',  'Passeio de Quadriciclo',                        35000, 999,  0),
    ('Servicos',  '612', 'Massagem Relaxante',                            18000, 999,  0),
    ('Servicos',  '626', 'Vara de Pesca (por Dia)',                        5000, 999,  0)
) as p(category_name, sku, name, sale_price, stock_quantity, min_stock)
join public.restaurant_categories cat on cat.name = p.category_name
on conflict (sku) do nothing;

-- Itens internos / cobranças administrativas (show_on_guest_menu = false)
insert into public.restaurant_products
  (category_id, sku, name, unit, cost_price, sale_price, stock_quantity, min_stock, active, show_on_guest_menu)
select
  cat.id, p.sku, p.name, 'un', 0, p.sale_price, 999, 0, true, false
from (
  values
    -- Servicos de quarto (hospedagem)
    ('Hospedagem', '4',   'Taxa de Servico / Limpeza',         15000),
    ('Hospedagem', '618', 'Servico Extra de Quarto',           15000),
    -- Cobranças internas
    ('Servicos',   '200', 'Quebra de Taca',                     5000),
    ('Servicos',   '201', 'Quebra de Prato',                    5000),
    ('Servicos',   '202', 'Quebra de Chicara e/ou Pires',       5000),
    ('Servicos',   '203', 'Taxa de Limpeza Extrema',               0),
    ('Servicos',   '525', 'Preparo de Cozumel',                  500),
    ('Servicos',   '637', 'Rolha',                              5000)
) as p(category_name, sku, name, sale_price)
join public.restaurant_categories cat on cat.name = p.category_name
on conflict (sku) do nothing;
