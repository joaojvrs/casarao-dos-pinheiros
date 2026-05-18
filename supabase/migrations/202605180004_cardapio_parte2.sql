-- =============================================================
-- Cardapio completo - parte 2
-- 37 produtos adicionais
-- Precos em centavos
-- =============================================================

-- Nova categoria para espumantes
insert into public.restaurant_categories (name, active)
values ('Espumantes', true)
on conflict (name) do nothing;

-- Produtos consumiveis (show_on_guest_menu = true)
insert into public.restaurant_products
  (category_id, sku, name, unit, cost_price, sale_price, stock_quantity, min_stock, active, show_on_guest_menu)
select
  cat.id, p.sku, p.name, 'un', 0, p.sale_price, p.stock_quantity, p.min_stock, true, true
from (
  values
    -- Bebidas
    ('Bebidas',     '21',  'Energetico Red Bull',                    1990, 20,  5),
    -- Espumantes
    ('Espumantes',  '643', 'Espumante Aurora Moscatel',              9590,  6,  2),
    ('Espumantes',  '568', 'Espumante Chandon Brut',                19990,  6,  2),
    ('Espumantes',  '569', 'Espumante Chandon Rose',                19990,  6,  2),
    ('Espumantes',  '564', 'Espumante Mumm Brut',                   11990,  6,  2),
    ('Espumantes',  '567', 'Espumante Mumm Rose',                   11990,  6,  2),
    -- Drinks, Doses e Coqueteis
    ('Drinks',      '582', 'Dose de Vodka',                          1990, 30,  0),
    ('Drinks',      '640', 'Dose de Whisky 12 Anos',                 3990, 20,  5),
    ('Drinks',      '638', 'Dose Licor 43',                          3490, 20,  5),
    ('Drinks',      '633', 'Drink Diverso',                          2990, 50,  0),
    ('Drinks',      '49',  'Enzoni',                                  3490, 50,  0),
    ('Drinks',      '48',  'Fitzgerald',                              3490, 50,  0),
    ('Drinks',      '45',  'Gin Tonica',                              3290, 50,  0),
    ('Drinks',      '46',  'Gin com Laranja e Hortela',               3490, 50,  0),
    ('Drinks',      '47',  'Gin Tonica com Frutas Vermelhas',         3490, 50,  0),
    -- Pratos e Petiscos
    ('Pratos',      '547', 'Dadinho de Tapioca',                     4890, 20,  0),
    ('Pratos',      '635', 'Disquinho de Costela com Queijo',         8990, 10,  0),
    ('Pratos',      '554', 'Disquinhos de Carne com Queijo',          4890, 20,  0),
    ('Pratos',      '613', 'Empadao Goiano',                          4990, 15,  0),
    ('Pratos',      '585', 'Escondidinho de Camarao',                 8990, 10,  0),
    ('Pratos',      '583', 'Escondidinho de Carne Seca',              8490, 10,  0),
    ('Pratos',      '636', 'File a Parmegiana',                       8990, 15,  0),
    ('Pratos',      '535', 'File de Frango Grelhado',                 7990, 15,  0),
    ('Pratos',      '596', 'File de Tilapia',                         8590, 10,  0),
    ('Pratos',      '552', 'File de Tilapia Empanada',                6990, 10,  0),
    ('Pratos',      '518', 'File Mignon com Fritas',                  9490, 10,  0),
    ('Pratos',      '608', 'Fraldinha na Tabua 500g',                17990,  8,  0),
    ('Pratos',      '548', 'Isca de Frango Empanada',                 5290, 20,  0),
    ('Pratos',      '549', 'Kibe Recheado',                           4990, 20,  0),
    ('Pratos',      '597', 'Macarrao ao Molho Branco com File Mignon',8990, 10,  0),
    ('Pratos',      '539', 'Macarrao a Bolonhesa Espaguete',          6990, 15,  0)
) as p(category_name, sku, name, sale_price, stock_quantity, min_stock)
join public.restaurant_categories cat on cat.name = p.category_name
on conflict (sku) do nothing;

-- Diarias de hospedagem (show_on_guest_menu = false — valores internos de PDV)
insert into public.restaurant_products
  (category_id, sku, name, unit, cost_price, sale_price, stock_quantity, min_stock, active, show_on_guest_menu)
select
  cat.id, p.sku, p.name, 'un', 0, p.sale_price, 5, 0, true, false
from (
  values
    ('Hospedagem', '1',   'Diaria Cabana 1 Quarto Meio Semana',           125000),
    ('Hospedagem', '2',   'Diaria Cabana 1 Quarto Final de Semana',       175000),
    ('Hospedagem', '3',   'Diaria Cabana 2 Quartos Meio Semana',          175000),
    ('Hospedagem', '66',  'Diaria Cabana 2 Quartos Final de Semana',      215000),
    ('Hospedagem', '531', 'Diaria Suite Casarao',                          75000),
    ('Hospedagem', '641', 'Diaria Quarto Familia',                        150000)
) as p(category_name, sku, name, sale_price)
join public.restaurant_categories cat on cat.name = p.category_name
on conflict (sku) do nothing;
