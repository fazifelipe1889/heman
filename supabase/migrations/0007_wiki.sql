-- Wiki Gym: biblioteca de artículos educativos.
-- Los artículos son globales (no tienen user_id). Solo lectura para todos los autenticados.
-- En fases futuras se puede añadir una tabla wiki_favorites o wiki_progress.

create type wiki_category as enum (
  'ejercicios',
  'nutricion',
  'tecnica',
  'suplementacion',
  'recuperacion',
  'conceptos'
);

create table wiki_articles (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  title         text not null,
  summary       text not null,
  content       text not null default '',
  category      wiki_category not null,
  tags          text[] not null default '{}',
  cover_url     text,
  read_time_min int not null default 3,
  is_published  boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Solo lectura para usuarios autenticados
alter table wiki_articles enable row level security;

create policy "Authenticated users can read published articles"
  on wiki_articles for select
  to authenticated
  using (is_published = true);

-- Índice para búsqueda por texto
create index wiki_articles_search_idx
  on wiki_articles using gin(to_tsvector('spanish', title || ' ' || summary || ' ' || content));

create index wiki_articles_category_idx on wiki_articles(category);
create index wiki_articles_published_idx on wiki_articles(is_published, created_at desc);
