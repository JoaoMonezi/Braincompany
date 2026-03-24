# DECISIONS.md — Brain Company

> Decisões técnicas, desvios do plano e contexto para futuras sessões.

---

## MCPs: .mcp.json é para o seu editor, não para a IA

**Decisão:** O arquivo `.mcp.json` configura os MCPs do Supabase e Apify para uso no **seu editor** (Cursor/VS Code), onde você ou a IA do editor podem interagir com eles. Antigravity (a IA que gera o código) **não tem acesso** a esses MCPs como ferramentas nativas.

**Consequência:** Para operações que exigem o Supabase MCP (rodar SQL, gerenciar tabelas, etc.), a IA usa o **browser agent** para navegar ao dashboard do Supabase e executar as ações.

**Alternativa futura:** Se quiser que Antigravity acesse o Supabase MCP diretamente, é necessário configurá-lo nas settings do Antigravity (não no `.mcp.json` do projeto).

---

## Migration SQL

O arquivo `supabase_migration.sql` contém o schema completo (488 linhas):
- 8 tabelas: `user_roles`, `projects`, `client_users`, `invites`, `profiles`, `post_metrics`, `raw_responses`, `scraping_jobs`
- Funções auxiliares: `get_my_role()`, `is_project_operator()`, `has_project_access()`
- Triggers: `updated_at` automático em `projects` e `profiles`
- RLS em todas as tabelas
- 2 views: `active_posts`, `profile_summary`

**Aplicado via:** Supabase Dashboard SQL Editor (pelo browser agent).

---

## Next.js 16: middleware.ts → proxy.ts

**Decisão:** Next.js 16 deprecou o arquivo `middleware.ts`. A convenção agora é `proxy.ts` com a função `proxy()` (em vez de `middleware()`).

**Implementado em:** `src/proxy.ts`

---

## Auth: Magic Link (OTP por email)

**Decisão:** Login via magic link (OTP por email), não senha. Supabase envia um link que redireciona para `/auth/callback`, que troca o code por sessão.

**Motivo:** Mais seguro e simples para o fluxo de operador + cliente sem fricção de senha.

**Para ativar:** No Supabase Dashboard → Authentication → Providers → Email → habilitar "Magic Link".

---

## Seed de Dados

O `supabase_migration.sql` contém um seed comentado na seção 11. Para ativar:
1. Criar o primeiro usuário via magic link
2. Copiar o `user_id` do usuário criado em `auth.users`
3. Descomentar e ajustar os INSERTs no SQL Editor do Supabase
