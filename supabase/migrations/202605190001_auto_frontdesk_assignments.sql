create table if not exists public.accommodation_room_map (
  accommodation_id text not null references public.accommodations(id) on delete cascade,
  room_id uuid not null references public.hk_rooms(id) on delete cascade,
  priority integer not null default 1,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (accommodation_id, room_id)
);

create index if not exists accommodation_room_map_active_idx
  on public.accommodation_room_map(accommodation_id, active, priority);

insert into public.accommodation_room_map (accommodation_id, room_id, priority, active)
select mapping.accommodation_id, room.id, mapping.priority, true
from (
  values
    ('suica', '101', 1),
    ('casarao', '102', 1),
    ('mata', '104', 1)
) as mapping(accommodation_id, room_number, priority)
join public.hk_rooms room on room.numero = mapping.room_number
on conflict (accommodation_id, room_id) do update set
  priority = excluded.priority,
  active = true;

insert into public.fd_room_assignments (
  booking_id,
  room_id,
  quarto_numero,
  checkin_previsto,
  checkout_previsto,
  status,
  adultos,
  criancas,
  observacao
)
select
  booking.id,
  room.id,
  room.numero,
  booking.check_in,
  booking.check_out,
  'reservado',
  booking.guests_count,
  0,
  'Atribuicao automatica criada a partir da hospedagem confirmada.'
from public.bookings booking
join public.accommodation_room_map map
  on map.accommodation_id = booking.accommodation_id
  and map.active = true
join public.hk_rooms room
  on room.id = map.room_id
where booking.status = 'confirmed'
  and booking.check_out >= current_date
  and not exists (
    select 1
    from public.fd_room_assignments existing
    where existing.booking_id = booking.id
      and existing.status in ('reservado', 'checked_in')
  )
  and not exists (
    select 1
    from public.fd_room_assignments occupied
    where occupied.room_id = room.id
      and occupied.status in ('reservado', 'checked_in')
      and occupied.checkin_previsto < booking.check_out
      and occupied.checkout_previsto > booking.check_in
  )
order by booking.created_at, map.priority;
