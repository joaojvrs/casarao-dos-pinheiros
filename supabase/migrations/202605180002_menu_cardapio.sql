-- Add guest menu visibility and image fields to restaurant_products
alter table public.restaurant_products
  add column if not exists show_on_guest_menu boolean not null default false,
  add column if not exists image_url text;

create index if not exists restaurant_products_guest_menu_idx
  on public.restaurant_products(show_on_guest_menu, active)
  where show_on_guest_menu = true and active = true;

-- Allow any authenticated user to read items visible on the guest menu
drop policy if exists "Guests can read guest menu items" on public.restaurant_products;
create policy "Guests can read guest menu items"
  on public.restaurant_products for select
  using (show_on_guest_menu = true and active = true);

-- Supabase Storage bucket for restaurant product images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'restaurant-images',
  'restaurant-images',
  true,
  5242880,
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Authenticated team members can upload images
drop policy if exists "Team can upload restaurant images" on storage.objects;
create policy "Team can upload restaurant images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'restaurant-images');

-- Authenticated team members can update/replace images
drop policy if exists "Team can update restaurant images" on storage.objects;
create policy "Team can update restaurant images"
  on storage.objects for update to authenticated
  using (bucket_id = 'restaurant-images');

-- Anyone can view restaurant images (public bucket)
drop policy if exists "Public can view restaurant images" on storage.objects;
create policy "Public can view restaurant images"
  on storage.objects for select
  using (bucket_id = 'restaurant-images');

-- Seed existing hardcoded items as show_on_guest_menu = true so guests see them immediately
update public.restaurant_products
set show_on_guest_menu = true
where name in ('Agua Mineral 500ml', 'Vinho Tinto Mini', 'Mix de Castanhas', 'Chocolate Amargo', 'Risoto de Cogumelos', 'Tabua Vale do Eden');
