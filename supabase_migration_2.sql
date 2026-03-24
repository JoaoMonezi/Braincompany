-- Adiciona colunas para suportar agendamentos dinâmicos via Apify Schedules
alter table public.profiles
  add column if not exists schedule_time text not null default '08:00',
  add column if not exists apify_schedule_id text;
