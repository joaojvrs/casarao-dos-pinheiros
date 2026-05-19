insert into public.accommodation_room_map (accommodation_id, room_id, priority, active)
select mapping.accommodation_id, room.id, mapping.priority, true
from (
  values
    ('casarao', '202', 2),
    ('casarao', '103', 3),
    ('suica', '101', 1),
    ('mata', '104', 1)
) as mapping(accommodation_id, room_number, priority)
join public.hk_rooms room on room.numero = mapping.room_number
on conflict (accommodation_id, room_id) do update set
  priority = excluded.priority,
  active = true;

with candidates as (
  select distinct on (assignment.id)
    assignment.id as assignment_id,
    clean_room.id as room_id,
    clean_room.numero as quarto_numero
  from public.fd_room_assignments assignment
  join public.bookings booking on booking.id = assignment.booking_id
  join public.hk_rooms current_room on current_room.id = assignment.room_id
  join public.accommodation_room_map map
    on map.accommodation_id = booking.accommodation_id
    and map.active = true
  join public.hk_rooms clean_room
    on clean_room.id = map.room_id
    and clean_room.status = 'limpo'
  where assignment.status = 'reservado'
    and current_room.status <> 'limpo'
    and not exists (
      select 1
      from public.fd_room_assignments occupied
      where occupied.room_id = clean_room.id
        and occupied.id <> assignment.id
        and occupied.status in ('reservado', 'checked_in')
        and occupied.checkin_previsto < assignment.checkout_previsto
        and occupied.checkout_previsto > assignment.checkin_previsto
    )
  order by assignment.id, map.priority
)
update public.fd_room_assignments assignment
set
  room_id = candidates.room_id,
  quarto_numero = candidates.quarto_numero,
  observacao = concat_ws(' ', assignment.observacao, 'Reatribuido automaticamente para quarto limpo.'),
  updated_at = now()
from candidates
where assignment.id = candidates.assignment_id;
