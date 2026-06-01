-- Remove duplicate exercises from the exercises table
-- There were 2 "Hip Thrust con Banda" entries with slightly different movement_type

delete from exercises
where name = 'Hip Thrust con Banda'
  and movement_type = 'Extension de cadera'
  and id > (
    select id from exercises
    where name = 'Hip Thrust con Banda'
      and movement_type = 'Extension de cadera'
    order by created_at asc
    limit 1
  );
