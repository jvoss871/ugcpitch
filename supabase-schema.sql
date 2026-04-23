-- Run this in the Supabase SQL editor for both your dev and prod projects.

create table if not exists users (
  username text primary key,
  data     jsonb not null default '{}'
);

create table if not exists pitches (
  id   text primary key,
  data jsonb not null default '{}'
);

create table if not exists analytics (
  id          bigserial primary key,
  share_id    text        not null,
  type        text        not null,
  payload     jsonb       not null default '{}',
  recorded_at timestamptz not null default now()
);

create index if not exists analytics_share_id_idx on analytics (share_id);

-- Disable RLS (all access goes through the service role key on the server)
alter table users     disable row level security;
alter table pitches   disable row level security;
alter table analytics disable row level security;
