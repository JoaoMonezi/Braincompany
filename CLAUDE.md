# CLAUDE.md — Brain Company · Social Data SaaS

> Leia este arquivo inteiro antes de escrever qualquer linha de código.
> Ele é a fonte de verdade do projeto. Em caso de conflito, este arquivo vence.

---

## 🧭 Visão Geral do Produto

**O que é:** Plataforma SaaS multi-tenant de analytics de redes sociais.
**Para quem:** Agências (operador) e seus clientes finais.
**Core loop:**
1. Operador cadastra um projeto (tenant) e adiciona contas sociais
2. Sistema agenda scraping automático via camada de scraping plugável
3. Dados chegam, são normalizados e salvos no banco
4. Operador analisa no painel técnico; cliente acessa relatório limpo
5. Operador exporta PDF white-label com logo/cores do cliente

---

## 🏗️ Stack Definitiva

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 14 (App Router) |
| Linguagem | TypeScript strict |
| Banco | Supabase (Postgres + Auth + Storage) |
| Styling | Tailwind CSS + shadcn/ui |
| Validação | Zod |
| Estado | Zustand (client-side leve) |
| PDF Export | React-pdf ou Puppeteer via API Route |
| Deploy | Vercel (serverless) |
| Scraping (atual) | Apify (via adapter) |
| Scraping (futuro) | Qualquer provider via interface `ScrapingAdapter` |

---

## 👥 Roles & Multi-tenancy

```
super_admin  →  Acesso total (você, o dev/operador)
operator     →  Gerencia projetos, contas, clientes
client       →  Leitura somente — vê relatório do seu projeto
```

### Modelo de dados de acesso:
- Cada `project` pertence a um `operator`
- Cada `project` pode ter múltiplos `client_users`
- `client_users` só enxergam dados do seu projeto
- RLS (Row Level Security) do Supabase garante isolamento

---

## 🗄️ Schema do Banco (Supabase/Postgres)

```sql
-- Projetos (tenants)
create table projects (
  id           uuid primary key default gen_random_uuid(),
  operator_id  uuid references auth.users not null,
  name         text not null,
  slug         text unique not null,
  logo_url     text,
  brand_color  text default '#000000',
  created_at   timestamptz default now()
);

-- Perfis monitorados (contas sociais)
create table profiles (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid references projects on delete cascade not null,
  platform     text check (platform in ('instagram','tiktok','youtube')) not null,
  handle       text not null,  -- o @ ou username
  display_name text,
  avatar_url   text,
  status       text check (status in ('active','paused','error')) default 'active',
  rules        jsonb default '{}', -- filtros: hashtags, palavras na descrição
  created_at   timestamptz default now(),
  unique(project_id, platform, handle)
);

-- Posts e suas métricas (upsert por external_id)
create table post_metrics (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid references profiles on delete cascade not null,
  external_id  text not null,  -- ID na rede social
  content_url  text,
  thumbnail_url text,
  caption      text,
  post_type    text,  -- video, reel, image, short, etc
  metrics      jsonb not null default '{}',
  -- metrics: { likes, views, comments, shares, saves, reach, ... }
  collected_at timestamptz default now(),
  deleted_at   timestamptz,  -- soft delete — nunca mais puxa se preenchido
  unique(profile_id, external_id)
);

-- Respostas brutas do scraper (para reprocessamento sem gastar créditos)
create table raw_responses (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid references profiles,
  source       text not null,  -- 'apify', 'custom', etc
  payload      jsonb not null,
  processed    boolean default false,
  created_at   timestamptz default now()
);

-- Clientes finais (acesso read-only ao projeto)
create table client_users (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid references projects on delete cascade not null,
  user_id      uuid references auth.users not null,
  created_at   timestamptz default now(),
  unique(project_id, user_id)
);

-- Jobs de scraping agendados
create table scraping_jobs (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid references profiles on delete cascade not null,
  provider     text not null default 'apify',  -- plugável
  provider_job_id text,  -- ID externo (ex: Apify run ID)
  status       text check (status in ('scheduled','running','done','failed')) default 'scheduled',
  scheduled_for timestamptz,
  finished_at  timestamptz,
  error_msg    text,
  created_at   timestamptz default now()
);
```

---

## 🔌 Camada de Scraping Plugável

**Princípio:** O resto do app nunca fala diretamente com o Apify.
Ele fala sempre com a interface `ScrapingAdapter`.

```typescript
// lib/scraping/types.ts
export interface ScrapingAdapter {
  scheduleRun(profileId: string, platform: string, handle: string, rules: object): Promise<string>
  cancelRun(providerJobId: string): Promise<void>
  getRunStatus(providerJobId: string): Promise<'running' | 'done' | 'failed'>
}

// lib/scraping/apify-adapter.ts  ← implementação atual
// lib/scraping/custom-adapter.ts ← futura implementação

// lib/scraping/index.ts
export const scraper: ScrapingAdapter = new ApifyAdapter()
// Para trocar: basta mudar essa linha ☝️
```

### Fluxo de agendamento:
1. Operador cadastra perfil → `POST /api/profiles`
2. API chama `scraper.scheduleRun(...)` → registra job na tabela `scraping_jobs`
3. Apify termina → bate no webhook `POST /api/ingest`
4. Ingest valida, normaliza, faz upsert em `post_metrics`, salva raw em `raw_responses`

---

## 🛣️ Rotas da Aplicação

### Públicas
```
/login                   — Auth compartilhada (detecta role e redireciona)
/invite/[token]          — Aceitar convite de cliente
```

### Operador (`/dashboard/*`)
```
/dashboard               — Overview de todos os projetos
/dashboard/projects/new  — Criar novo projeto
/dashboard/[projectSlug]           — Visão geral do projeto
/dashboard/[projectSlug]/accounts  — Gerenciar contas (+ regras de negócio)
/dashboard/[projectSlug]/posts     — Todos os posts com filtros
/dashboard/[projectSlug]/report    — Preview do relatório
/dashboard/[projectSlug]/settings  — Config do projeto (logo, cor, clientes)
```

### Cliente (`/c/[projectSlug]/*`)
```
/c/[projectSlug]         — Dashboard read-only
/c/[projectSlug]/posts   — Posts com filtros
/c/[projectSlug]/report  — Relatório exportável em PDF
```

### API Routes
```
POST /api/ingest                    — Webhook do scraper
POST /api/profiles                  — Criar perfil + agendar scraping
PATCH /api/profiles/[id]            — Editar regras / pausar
DELETE /api/profiles/[id]           — Remove perfil
POST /api/posts/[id]/delete         — Soft delete de post (para de puxar)
GET  /api/report/[projectSlug]/pdf  — Gera e retorna PDF
```

---

## 📋 Regras de Negócio

### Filtros de coleta (campo `rules` no profile):
```json
{
  "include_hashtags": ["#produto", "#marca"],
  "exclude_hashtags": ["#parceiro"],
  "caption_contains": ["promoção"],
  "min_views": 1000
}
```
- Se `include_hashtags` definido → só coleta posts que contenham ao menos uma
- Se `exclude_hashtags` definido → ignora posts com qualquer uma dessas
- Aplicados no momento do ingest, não no scraper

### Soft delete de posts:
- `DELETE /api/posts/[id]` apenas preenche `deleted_at`
- No próximo ingest, posts com `deleted_at` não são re-inseridos (checa `external_id`)
- Na UI nunca aparecem posts com `deleted_at` preenchido

### PDF White-label:
- Usa `logo_url` e `brand_color` do projeto
- Template fixo, bonito — personalização é só logo + cor primária
- Gerado server-side via API Route, retorna blob para download

---

## 🎨 Design System

### Paleta de Cores (CSS Variables — globals.css)

```css
:root {
  /* Backgrounds */
  --bg-page:        #09090f;   /* fundo da página */
  --bg-surface:     #0f0f1a;   /* cards, sidebar */
  --bg-surface2:    #16162a;   /* inputs, hover states */
  --bg-overlay:     #1e1e35;   /* tooltips, dropdowns */

  /* Bordas */
  --border:         #1e1e35;
  --border-strong:  #2a2a45;

  /* Azul — cor de ação principal */
  --blue:           #2563eb;
  --blue-hover:     #3b82f6;
  --blue-dim:       #1e3a8a;   /* backgrounds de badges azuis */
  --blue-text:      #93c5fd;   /* texto sobre --blue-dim */

  /* Texto */
  --text-primary:   #f8fafc;
  --text-secondary: #94a3b8;
  --text-muted:     #475569;

  /* Plataformas — nunca alterar */
  --tt:             #010101;   /* TikTok */
  --ig-from:        #f09433;   /* Instagram gradient start */
  --ig-to:          #bc1888;   /* Instagram gradient end */
  --yt:             #ff0000;   /* YouTube */

  /* Semânticas */
  --success:        #22c55e;
  --error:          #ef4444;
  --warning:        #f59e0b;
}
```

### Tokens de Layout

```
Border radius:  8px (elementos),  12px (cards),  999px (pills/badges)
Border width:   0.5px padrão,  1px para foco/destaque
Spacing scale:  4 / 8 / 12 / 16 / 20 / 24 / 32 / 48px
Font sizes:     11 / 12 / 13 / 14 / 16 / 18 / 22px
Font weights:   400 (body),  500 (destaque),  600 (headings)
```

### Tipografia

```
Font family:   Geist Sans (display + body)
               Geist Mono (valores numéricos, handles, IDs)
```

Instalar: `npm install geist`

```typescript
// app/layout.tsx
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
```

### Componentes Base (Tailwind classes customizadas)

```css
/* tailwind.config.ts → theme.extend */
.card          → bg-surface border border-[#1e1e35] rounded-xl p-4
.card-sm       → bg-surface border border-[#1e1e35] rounded-lg p-3
.kpi-card      → bg-surface2 rounded-lg p-4
.badge-blue    → bg-blue-dim text-blue-text text-[11px] px-2 py-0.5 rounded-full
.badge-success → bg-green-950 text-green-400 text-[11px] px-2 py-0.5 rounded-full
.badge-error   → bg-red-950 text-red-400 text-[11px] px-2 py-0.5 rounded-full
.btn-primary   → bg-blue hover:bg-blue-hover text-white rounded-lg px-4 py-2 text-sm font-medium
.btn-ghost     → border border-[#1e1e35] hover:bg-surface2 text-text-secondary rounded-lg px-4 py-2 text-sm
```

### Badges de Plataforma

```tsx
// components/ui/PlatformBadge.tsx
// TikTok  → bg:#010101  texto: branco
// Instagram → bg: purple-700  texto: branco  (simplificado do gradient)
// YouTube → bg:#ff0000  texto: branco
// Sempre: 26x26px, border-radius 6px, fonte 10px bold
```

### Densidade por Contexto

| Área | Estilo |
|---|---|
| Dashboard operador | Denso, tabelas, muita info, fonte 12-13px |
| Página de posts | Grid de thumbnails 9:16 |
| Relatório cliente | Espaçoso, clean, fonte 14-16px, muito whitespace |
| PDF export | A4, margens 40px, sem dark mode |

### Regras de Design

1. Nunca usar gradientes no fundo de cards — apenas em badges de plataforma
2. Ícones: `lucide-react` exclusivamente, tamanho 16px nos menus, 20px nos títulos
3. Números grandes (KPIs): sempre `font-mono` — `GeistMono`
4. Handles de redes sociais: sempre `font-mono` com `@` prefixado
5. Status "ativo": `●` verde (`#22c55e`) + texto "ativo" — nunca só cor
6. Toda tabela tem `hover:bg-surface2` na linha, cursor pointer se clicável

---

## ⚙️ Variáveis de Ambiente

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Apify
APIFY_API_TOKEN=
APIFY_INSTAGRAM_ACTOR_ID=
APIFY_TIKTOK_ACTOR_ID=
APIFY_YOUTUBE_ACTOR_ID=

# App
NEXT_PUBLIC_APP_URL=
INGEST_WEBHOOK_SECRET=   # valida que o webhook veio mesmo do Apify
```

---

## 📏 Convenções de Código

1. **TypeScript strict** — sem `any`, sem `as unknown`
2. **Um componente por arquivo** — em `components/[domínio]/NomeComponente.tsx`
3. **Server Components por padrão** — `'use client'` só quando necessário
4. **Zod em toda entrada externa** — API routes, webhooks, formulários
5. **Queries Supabase** — sempre em `lib/db/[entidade].ts`, nunca direto no componente
6. **Error handling** — sempre try/catch com mensagem descritiva no log
7. **Commits atômicos** — um commit por feature funcionando

---

## 🚀 Fases de Execução (MVP)

### Fase 1 — Fundação (Banco + Auth)
- [ ] Setup Supabase: rodar SQL do schema
- [ ] Configurar RLS policies
- [ ] Setup Next.js + Tailwind + shadcn/ui na Vercel
- [ ] Auth flow: login, detect role, redirect

### Fase 2 — Ingest Pipeline
- [ ] Criar `ScrapingAdapter` interface
- [ ] Implementar `ApifyAdapter`
- [ ] `POST /api/ingest` com validação Zod + upsert
- [ ] Aplicar filtros de `rules` no ingest
- [ ] Soft delete respeitado no ingest

### Fase 3 — Dashboard Operador
- [ ] Overview de projetos
- [ ] CRUD de projetos
- [ ] CRUD de contas (+ regras de negócio)
- [ ] Página de posts com filtros (plataforma, data, métricas)
- [ ] Soft delete de posts na UI

### Fase 4 — Dashboard Cliente
- [ ] Auth de cliente via convite
- [ ] Relatório read-only limpo
- [ ] Filtros básicos
- [ ] Export PDF white-label

### Fase 5 — Polish
- [ ] Agendamento automático diário
- [ ] Notificações de erro de scraping
- [ ] Suporte a múltiplos clientes por projeto