-- Supabase Storage bucket for housekeeping attachments
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'housekeeping-attachments',
  'housekeeping-attachments',
  true,
  5242880,
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do nothing;

drop policy if exists "Housekeeping can upload attachments" on storage.objects;
create policy "Housekeeping can upload attachments"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'housekeeping-attachments'
    and (public.can_manage_housekeeping() or public.is_housekeeping_staff())
  );

drop policy if exists "Housekeeping can update attachments" on storage.objects;
create policy "Housekeeping can update attachments"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'housekeeping-attachments'
    and (public.can_manage_housekeeping() or public.is_housekeeping_staff())
  );

drop policy if exists "Housekeeping can view attachments" on storage.objects;
create policy "Housekeeping can view attachments"
  on storage.objects for select
  using (bucket_id = 'housekeeping-attachments');
