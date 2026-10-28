-- Helix operator workspace: second brain, skills, governance, analytics
create table if not exists helix_profiles (
  user_id text primary key,
  initialized_at timestamptz,
  last_compact_at timestamptz,
  last_report_at timestamptz,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

create table if not exists helix_skills (
  id serial primary key,
  user_id text not null,
  slug text not null,
  name text not null,
  category text not null,
  summary text not null,
  protocol text not null,
  linux_script text,
  installed boolean not null default false,
  token_cost integer not null default 0,
  origin text not null default 'catalog',
  created_at timestamptz not null default now(),
  unique (user_id, slug)
);
create index if not exists helix_skills_user_idx on helix_skills (user_id);

create table if not exists helix_combos (
  id serial primary key,
  user_id text not null,
  name text not null,
  slugs text not null,
  protocol text not null,
  created_at timestamptz not null default now()
);

create table if not exists helix_memory (
  id serial primary key,
  user_id text not null,
  title text not null,
  body text not null,
  tags text not null default '',
  compacted boolean not null default false,
  token_estimate integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists helix_memory_user_idx on helix_memory (user_id);

create table if not exists helix_events (
  id serial primary key,
  user_id text not null,
  kind text not null,
  label text not null,
  detail text not null default '',
  severity text not null default 'info',
  created_at timestamptz not null default now()
);
create index if not exists helix_events_user_idx on helix_events (user_id, created_at desc);

create table if not exists helix_mistakes (
  id serial primary key,
  user_id text not null,
  pattern text not null,
  count integer not null default 1,
  flagged boolean not null default false,
  tutor_note text not null default '',
  last_seen timestamptz not null default now(),
  unique (user_id, pattern)
);

create table if not exists helix_policies (
  id serial primary key,
  user_id text not null,
  slug text not null,
  name text not null,
  domain text not null,
  rule text not null,
  enabled boolean not null default true,
  unique (user_id, slug)
);

create table if not exists helix_reports (
  id serial primary key,
  user_id text not null,
  report_date date not null,
  summary text not null,
  productivity integer not null default 0,
  tokens_saved integer not null default 0,
  tokens_spent integer not null default 0,
  mistakes_flagged integer not null default 0,
  actions integer not null default 0,
  unique (user_id, report_date)
);

create table if not exists helix_connectors (
  id serial primary key,
  user_id text not null,
  provider text not null,
  status text not null default 'idle',
  last_sync timestamptz,
  detail text not null default '',
  unique (user_id, provider)
);
