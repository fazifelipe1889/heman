-- Remove duplicate exercises from the exercises table
-- There were 2 "Hip Thrust con Banda" entries with slightly different movement_type

do $$
begin
  if exists (
    select from information_schema.tables
    where table_schema = 'public' and table_name = 'exercises'
  ) then
    delete from public.exercises
    where name = 'Hip Thrust con Banda'
      and movement_type = 'Extension de cadera'
      and id > (
        select id from public.exercises
        where name = 'Hip Thrust con Banda'
          and movement_type = 'Extension de cadera'
        order by created_at asc
        limit 1
      );
  end if;
end $$;
