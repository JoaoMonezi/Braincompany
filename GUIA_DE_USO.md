# 🧠 Brain Company — Guia Rápido de Uso & Acessos

Este documento explica como funciona a hierarquia de usuários, os links de acesso e como você, como dono do SaaS, garante que tem acesso de Administrador/Operador a tudo.

---

## 1. Perfis de Usuário (Roles)

O sistema possui duas permissões principais definidas na tabela `user_roles` do banco de dados:

1. **`operator` (Operador/Dono):** 
   - Acessa o `/dashboard`.
   - Pode criar, editar e excluir projetos.
   - Pode adicionar perfis para monitoramento influenciadores.
   - Pode apagar posts (Soft Delete).
   - Pode gerar link de convite para os clientes.

2. **`client` (Cliente do Projeto):**
   - Apenas visualiza (Read-only).
   - Não tem acesso ao `/dashboard`.
   - É redirecionado cegamente para a página do relatório do seu projeto (`/report/[nome-do-projeto]`).
   - Só cai nessa página se o Operador gerou um Magic Link de convite para ele através do painel.

---

## 2. Como se tornar o "Super Admin" (Operador)

Quando você faz login pela primeira vez usando o Google ou escreve lá o seu e-mail no Magic Link sem ser convidado antes, o banco de dados do Supabase cria a sua conta, **mas a plataforma por segurança não te dá acesso de Operador automaticamente.**

Por isso que, ao logar, o sistema diz que você não tem acesso a nenhuma página (se não te deram um projeto) ou tenta te jogar num lugar sem permissão.

**Para virar o Dono do SaaS e ter acesso a tudo, você precisa dar a si mesmo o cargo de `operator`:**

1. Abra a [Dashboard do Supabase](https://supabase.com/dashboard) e acesse o seu projeto (`Braincompany`).
2. No menu esquerdo, vá em **Table Editor** (Editor de Tabelas) e clique na tabela **`user_roles`**.
3. Encontre o seu ID de usuário na lista (o mesmo `UID` que aparece na aba Authentication). 
4. Dê um duplo-clique na coluna **`role`**.
5. Mude de `client` para: **`operator`**
6. Salve.
7. *Pronto!* Faça login novamente no aplicativo e você cairá na tela administrativa (Workspace de Projetos).

> **Dica Pro:** Para qualquer outro sócio seu da agência que precise administrar o SaaS, o processo é o mesmo: eles logam uma vez na plataforma, você vai no Supabase e muda o `role` deles para `operator`.

---

## 3. Fluxos de Login e Rotas

A plataforma foi arquitetada para ser simples. A nossa autenticação em `src/middleware.ts` (ou `proxy.ts`) obedece a essas regras de trânsito:

### 🏠 Acesso do Operador (Você)
- **Onde entrar:** Acesse `http://localhost:3000/` (ou site publico depois).
- **Como Logar:** Clique em _Continuar com o Google_ ou use o e-mail.
- **Para Onde Vai:** Como o seu `role` agora é `operator`, o sistema te joga automaticamente para `http://localhost:3000/dashboard`.
- **O que faz lá:** Você clica em "Novo Projeto", escolhe o nome e a cor do cliente (ex: Coca-Cola). Dentro do projeto, vai em "Configurações" e usa o botão **"Convidar Cliente"**.

### 💼 Acesso do Cliente
- **Onde entrar:** O cliente **NÃO** precisa acessar a homepage do SaaS.
- **Como Logar:** Você, no painel, digita o e-mail dele (`diretor@coca-cola.com`). O sistema vai gerar um **Magic Link**. Você copia esse link e manda pro cliente no WhatsApp.
- **Para Onde Vai:** Quando o cliente clica nesse link no celular dele, ele já entra **LOGADO** e cai direto na página:
  `http://localhost:3000/report/coca-cola`
- O cliente nunca vê o nome de outros clientes, nem consegue editar nada. O sistema entende que ele é um `client` e bloqueia acesso dele ao `/dashboard`.

---

## 4. Resumo das Rotas da Aplicação

- `/` → Página inicial (Landing page e Auth).
- `/dashboard` → Tela onde você vê os cards dos seus Projetos criados. *(Requer role='operator')*
- `/dashboard/projects/new` → Criação de novo projeto.
- `/dashboard/projects/[id]` → Detalhes do Projeto, gráficos internos, visão real.
- `/dashboard/projects/[id]/profiles` → Onde você cadastra os influenciadores e as hashtags daquele projeto.
- `/dashboard/projects/[id]/posts` → Onde os posts raspados da Apify caem e onde você exclui os que não gostar.
- `/dashboard/projects/[id]/settings` → Onde você gera os Magic Links para os clientes e pega o URL do relatório.
- `/report/[slug]` → **Dashboard do Cliente**. Só leitura. Com botão para exportar PDF.

---

## FAQ de Problemas Comuns

- **"Você não tem permissão para acessar esta página" mesmo após criar conta:** Você não mudou seu `role` para `operator` no painel do Supabase. Vá na tabela `user_roles` e mude seu papel. 
- **O post demorou a aparecer:** Lembre-se que o Supabase aciona a Apify, a Apify processa no tempo dela (pode demorar minutos dependo da fila deles) e devolve via Webhook. Atualize a página e o conteúdo aparecerá.
