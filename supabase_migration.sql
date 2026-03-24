-- ============================================================
-- Brain Company · Social Data SaaS
-- Supabase Migration — rodar no SQL Editor do Supabase
-- Ordem: execute tudo de uma vez, de cima pra baixo
-- ============================================================


-- ------------------------------------------------------------
-- 0. EXTENSÕES
-- ------------------------------------------------------------
create extension if not exists "uuid-ossp";


-- ------------------------------------------------------------
-- 1. TABELA: user_roles
-- Guarda o role de cada usuário (operator ou client)
-- super_admin é definido via is_super_admin flag
-- ------------------------------------------------------------
create table public.user_roles (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users on delete cascade not null unique,
  role         text check (role in ('operator', 'client')) not null default 'client',
  is_super_admin boolean default false,
  created_at   timestamptz default now()
);

comment on table public.user_roles is
  'Role de cada usuário. Operators gerenciam projetos; clients têm acesso read-only.';


-- ------------------------------------------------------------
-- 2. TABELA: projects
-- Cada projeto é um tenant — tem suas contas, posts e clientes
-- ------------------------------------------------------------
create table public.projects (
  id           uuid primary key default gen_random_uuid(),
  operator_id  uuid references auth.users on delete cascade not null,
  name         text not null,
  slug         text unique not null,  -- usado nas URLs /dashboard/[slug]
  logo_url     text,                  -- guardado no Supabase Storage
  brand_color  text not null default '#2563eb',  -- hex, usado no PDF white-label
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

comment on table public.projects is
  'Projetos (tenants). Cada operador pode ter vários projetos.';

-- Índice para busca por operador
create index idx_projects_operator on public.projects(operator_id);


-- ------------------------------------------------------------
-- 3. TABELA: client_users
-- Relaciona usuários com acesso de cliente a um projeto
-- ------------------------------------------------------------
create table public.client_users (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid references public.projects on delete cascade not null,
  user_id      uuid references auth.users on delete cascade not null,
  created_at   timestamptz default now(),
  unique(project_id, user_id)
);

comment on table public.client_users is
  'Clientes com acesso read-only a um projeto específico.';

create index idx_client_users_project on public.client_users(project_id);
create index idx_client_users_user    on public.client_users(user_id);


-- ------------------------------------------------------------
-- 4. TABELA: invites
-- Tokens de convite para novos clientes
-- ------------------------------------------------------------
create table public.invites (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid references public.projects on delete cascade not null,
  email        text not null,
  token        text unique not null default encode(gen_random_bytes(32), 'hex'),
  accepted_at  timestamptz,
  expires_at   timestamptz default (now() + interval '7 days'),
  created_by   uuid references auth.users not null,
  created_at   timestamptz default now()
);

comment on table public.invites is
  'Convites enviados pelo operador para adicionar clientes a um projeto.';


-- ------------------------------------------------------------
-- 5. TABELA: profiles
-- Contas de redes sociais monitoradas
-- ------------------------------------------------------------
create table public.profiles (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid references public.projects on delete cascade not null,
  platform     text check (platform in ('instagram', 'tiktok', 'youtube')) not null,
  handle       text not null,       -- username sem @
  display_name text,
  avatar_url   text,
  status       text check (status in ('active', 'paused', 'error')) not null default 'active',
  error_msg    text,                -- último erro de scraping, se status='error'

  -- Regras de negócio aplicadas no ingest (não no scraper)
  rules jsonb not null default '{
    "include_hashtags": [],
    "exclude_hashtags": [],
    "caption_contains": [],
    "caption_excludes": [],
    "min_views": 0
  }',

  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  unique(project_id, platform, handle)
);

comment on table public.profiles is
  'Contas de redes sociais monitoradas. Rules define filtros aplicados no ingest.';

comment on column public.profiles.rules is
  'Filtros de coleta:
   include_hashtags: só coleta se caption tiver ao menos uma
   exclude_hashtags: ignora posts com qualquer uma dessas
   caption_contains: só coleta se caption tiver o termo
   caption_excludes: ignora posts com o termo
   min_views: threshold mínimo de views para salvar';

create index idx_profiles_project  on public.profiles(project_id);
create index idx_profiles_platform on public.profiles(platform);
create index idx_profiles_status   on public.profiles(status);


-- ------------------------------------------------------------
-- 6. TABELA: post_metrics
-- Posts coletados e suas métricas (upsert por external_id)
-- ------------------------------------------------------------
create table public.post_metrics (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid references public.profiles on delete cascade not null,
  external_id   text not null,        -- ID do post na rede social
  content_url   text,                 -- URL do post
  thumbnail_url text,                 -- thumbnail para preview
  caption       text,                 -- legenda/descrição
  post_type     text,                 -- 'video','reel','image','short','carousel'
  published_at  timestamptz,          -- quando foi publicado na rede social

  -- Métricas normalizadas — campos variam por plataforma
  metrics jsonb not null default '{}',
  -- Estrutura esperada:
  -- {
  --   "views":    number,
  --   "likes":    number,
  --   "comments": number,
  --   "shares":   number,
  --   "saves":    number,    (IG)
  --   "reach":    number,    (IG)
  --   "duration": number     (segundos, para vídeos)
  -- }

  collected_at  timestamptz not null default now(),
  deleted_at    timestamptz,          -- soft delete: preenchido = nunca mais ingesta

  unique(profile_id, external_id)
);

comment on table public.post_metrics is
  'Posts e métricas. deleted_at = soft delete: post some da UI e não é mais coletado.';

create index idx_post_metrics_profile     on public.post_metrics(profile_id);
create index idx_post_metrics_collected   on public.post_metrics(collected_at desc);
create index idx_post_metrics_published   on public.post_metrics(published_at desc);
create index idx_post_metrics_deleted     on public.post_metrics(deleted_at) where deleted_at is null;
create index idx_post_metrics_views       on public.post_metrics((metrics->>'views')::bigint desc);

-- Índice GIN para busca full-text no caption
create index idx_post_metrics_caption_gin on public.post_metrics using gin(to_tsvector('portuguese', coalesce(caption, '')));


-- ------------------------------------------------------------
-- 7. TABELA: raw_responses
-- Payload bruto do scraper — para reprocessamento sem gastar créditos
-- ------------------------------------------------------------
create table public.raw_responses (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid references public.profiles on delete set null,
  source       text not null default 'apify',  -- 'apify' | 'custom' | etc
  payload      jsonb not null,
  processed    boolean not null default false,
  error_msg    text,
  created_at   timestamptz default now()
);

comment on table public.raw_responses is
  'Respostas brutas do scraper. processed=false = ainda não foi para post_metrics.';

create index idx_raw_responses_profile   on public.raw_responses(profile_id);
create index idx_raw_responses_processed on public.raw_responses(processed) where processed = false;


-- ------------------------------------------------------------
-- 8. TABELA: scraping_jobs
-- Rastrea cada execução de scraping (plugável por provider)
-- ------------------------------------------------------------
create table public.scraping_jobs (
  id              uuid primary key default gen_random_uuid(),
  profile_id      uuid references public.profiles on delete cascade not null,
  provider        text not null default 'apify',  -- plugável: 'apify' | 'custom'
  provider_job_id text,             -- ID externo (Apify Run ID, etc)
  status          text check (status in ('scheduled','running','done','failed'))
                  not null default 'scheduled',
  scheduled_for   timestamptz,
  started_at      timestamptz,
  finished_at     timestamptz,
  posts_collected integer default 0,
  error_msg       text,
  created_at      timestamptz default now()
);

comment on table public.scraping_jobs is
  'Jobs de scraping. provider é plugável — trocar de Apify não quebra o histórico.';

create index idx_scraping_jobs_profile on public.scraping_jobs(profile_id);
create index idx_scraping_jobs_status  on public.scraping_jobs(status);


-- ------------------------------------------------------------
-- 9. FUNÇÕES AUXILIARES
-- ------------------------------------------------------------

-- Retorna o role do usuário logado
create or replace function public.get_my_role()
returns text
language sql stable security definer
as $$
  select role from public.user_roles where user_id = auth.uid();
$$;

-- Verifica se o usuário logado é operator do projeto
create or replace function public.is_project_operator(p_project_id uuid)
returns boolean
language sql stable security definer
as $$
  select exists (
    select 1 from public.projects
    where id = p_project_id and operator_id = auth.uid()
  );
$$;

-- Verifica se o usuário logado tem acesso (operator ou client) ao projeto
create or replace function public.has_project_access(p_project_id uuid)
returns boolean
language sql stable security definer
as $$
  select exists (
    select 1 from public.projects where id = p_project_id and operator_id = auth.uid()
    union
    select 1 from public.client_users where project_id = p_project_id and user_id = auth.uid()
  );
$$;

-- Trigger: atualiza updated_at automaticamente
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();


-- ------------------------------------------------------------
-- 10. ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------

-- Habilitar RLS em todas as tabelas
alter table public.user_roles    enable row level security;
alter table public.projects      enable row level security;
alter table public.client_users  enable row level security;
alter table public.invites       enable row level security;
alter table public.profiles      enable row level security;
alter table public.post_metrics  enable row level security;
alter table public.raw_responses enable row level security;
alter table public.scraping_jobs enable row level security;


-- ── user_roles ──────────────────────────────────────────────
-- Usuário vê e edita apenas seu próprio role
create policy "user_roles: leitura própria"
  on public.user_roles for select
  using (user_id = auth.uid());

create policy "user_roles: inserção própria"
  on public.user_roles for insert
  with check (user_id = auth.uid());


-- ── projects ────────────────────────────────────────────────
-- Operator vê seus projetos; client vê projetos que tem acesso
create policy "projects: operator lê os seus"
  on public.projects for select
  using (
    operator_id = auth.uid()
    or exists (
      select 1 from public.client_users
      where project_id = projects.id and user_id = auth.uid()
    )
  );

create policy "projects: operator cria"
  on public.projects for insert
  with check (operator_id = auth.uid());

create policy "projects: operator edita os seus"
  on public.projects for update
  using (operator_id = auth.uid());

create policy "projects: operator deleta os seus"
  on public.projects for delete
  using (operator_id = auth.uid());


-- ── client_users ────────────────────────────────────────────
create policy "client_users: operator do projeto gerencia"
  on public.client_users for all
  using (public.is_project_operator(project_id))
  with check (public.is_project_operator(project_id));

create policy "client_users: client vê seu próprio acesso"
  on public.client_users for select
  using (user_id = auth.uid());


-- ── invites ─────────────────────────────────────────────────
create policy "invites: operator do projeto gerencia"
  on public.invites for all
  using (public.is_project_operator(project_id))
  with check (public.is_project_operator(project_id));

-- Qualquer autenticado pode ler convite pelo token (para aceitar)
create policy "invites: leitura por token"
  on public.invites for select
  using (auth.uid() is not null);


-- ── profiles ────────────────────────────────────────────────
create policy "profiles: acesso por projeto"
  on public.profiles for select
  using (public.has_project_access(project_id));

create policy "profiles: operator cria e edita"
  on public.profiles for insert
  with check (public.is_project_operator(project_id));

create policy "profiles: operator atualiza"
  on public.profiles for update
  using (public.is_project_operator(project_id));

create policy "profiles: operator deleta"
  on public.profiles for delete
  using (public.is_project_operator(project_id));


-- ── post_metrics ────────────────────────────────────────────
-- Acesso via profiles → projects
create policy "post_metrics: acesso por projeto"
  on public.post_metrics for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = post_metrics.profile_id
      and public.has_project_access(p.project_id)
    )
    and deleted_at is null   -- soft deleted nunca aparecem
  );

-- Apenas service_role insere/atualiza (via API route com SUPABASE_SERVICE_ROLE_KEY)
-- Clients e operators não escrevem diretamente em post_metrics


-- ── raw_responses ───────────────────────────────────────────
-- Apenas service_role acessa (dados brutos internos)
-- Sem policies públicas — acesso via SUPABASE_SERVICE_ROLE_KEY nas API routes


-- ── scraping_jobs ───────────────────────────────────────────
create policy "scraping_jobs: operator vê do seu projeto"
  on public.scraping_jobs for select
  using (
    exists (
      select 1 from public.profiles p
      join public.projects pr on pr.id = p.project_id
      where p.id = scraping_jobs.profile_id
      and pr.operator_id = auth.uid()
    )
  );


-- ------------------------------------------------------------
-- 11. DADOS INICIAIS (seed para desenvolvimento)
-- ------------------------------------------------------------

-- Projeto inicial: Omelfi Visionário
-- Descomente e ajuste o operator_id após criar o primeiro usuário

/*
insert into public.user_roles (user_id, role) values
  ('<SEU_USER_ID_AQUI>', 'operator');

insert into public.projects (operator_id, name, slug, brand_color) values
  ('<SEU_USER_ID_AQUI>', 'Omelfi Visionário', 'omelfi-visionario', '#2563eb');

-- Após inserir o projeto, copie o ID gerado e use abaixo:
insert into public.profiles (project_id, platform, handle, display_name) values
  ('<PROJECT_ID>', 'tiktok',    'omelfivisionario', 'Omelfi Visionário - TikTok'),
  ('<PROJECT_ID>', 'tiktok',    'avidadetrader',    'A Vida de Trader - TikTok'),
  ('<PROJECT_ID>', 'instagram', 'goat_magnata',     'Goat Magnata - Instagram'),
  ('<PROJECT_ID>', 'youtube',   'omelfivisionario', 'Omelfi Visionário - YouTube');

-- Projeto: Gean (melfizin)
insert into public.projects (operator_id, name, slug, brand_color) values
  ('<SEU_USER_ID_AQUI>', 'Melfizin', 'melfizin', '#2563eb');

insert into public.profiles (project_id, platform, handle, display_name) values
  ('<PROJECT_ID_MELFIZIN>', 'instagram', 'melfizin', 'Melfizin - Instagram'),
  ('<PROJECT_ID_MELFIZIN>', 'tiktok',    'melfizin', 'Melfizin - TikTok'),
  ('<PROJECT_ID_MELFIZIN>', 'youtube',   'melfizin', 'Melfizin - YouTube');
*/


-- ------------------------------------------------------------
-- 12. VIEWS ÚTEIS (opcional, facilita queries no front)
-- ------------------------------------------------------------

-- View: posts ativos com info do perfil e projeto
create or replace view public.active_posts as
  select
    pm.*,
    p.platform,
    p.handle,
    p.project_id,
    pr.name  as project_name,
    pr.slug  as project_slug
  from public.post_metrics pm
  join public.profiles p  on p.id  = pm.profile_id
  join public.projects pr on pr.id = p.project_id
  where pm.deleted_at is null;

comment on view public.active_posts is
  'Posts não deletados com contexto de perfil e projeto. Use esta view nas queries do front.';

-- View: resumo de métricas por perfil
create or replace view public.profile_summary as
  select
    p.id               as profile_id,
    p.project_id,
    p.platform,
    p.handle,
    p.status,
    count(pm.id)                              as total_posts,
    sum((pm.metrics->>'views')::bigint)       as total_views,
    sum((pm.metrics->>'likes')::bigint)       as total_likes,
    sum((pm.metrics->>'comments')::bigint)    as total_comments,
    max(pm.collected_at)                      as last_collected_at
  from public.profiles p
  left join public.post_metrics pm
    on pm.profile_id = p.id and pm.deleted_at is null
  group by p.id, p.project_id, p.platform, p.handle, p.status;

comment on view public.profile_summary is
  'Agregação de métricas por perfil. Usa nas KPI cards do dashboard.';


-- ------------------------------------------------------------
-- FIM DA MIGRATION
-- Após rodar: vá em Authentication > Providers e habilite Email
-- Em Storage, crie um bucket "logos" (public) para logos dos projetos
-- ------------------------------------------------------------
