# Sermontiny Montagens Industriais e Locações

Aplicação web de produção com site institucional e painel administrativo para clientes, equipamentos, orçamentos, contratos, PDFs e WhatsApp.

O código vive neste diretório (`sermontiny-app`) por restrição de nome npm. Use esta pasta como raiz do projeto.

## Stack

- Next.js 16 (App Router) + TypeScript strict
- Tailwind CSS + shadcn/ui + Lucide
- Supabase (PostgreSQL, Auth, Storage, RLS)
- React Hook Form + Zod
- TanStack Table + Recharts
- `@react-pdf/renderer` no servidor
- Vitest, ESLint e Prettier

## Arquitetura de pastas

```text
app/(public)             Site institucional
app/admin                Login e painel protegido
app/actions              Server Actions com permissão no backend
app/api                  PDF e integrações
app/d/[token]            Link temporário assinado para documentos
components/public        Header, rodapé, formulários públicos
components/admin         Shell, tabelas e formulários do painel
lib/money.ts             Cálculos em centavos
lib/extenso.ts           Valor por extenso em pt-BR
lib/whatsapp             wa.me e Cloud API
lib/pdf                  Geração de PDF
supabase/migrations      Schema, RLS, numeração e storage
supabase/seed.sql        Empresa, equipamentos, cláusulas e perfis
```

## Desenvolvimento local

```bash
cd sermontiny-app
cp .env.example .env.local
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). O site público funciona sem banco; catálogo, formulário de contato e painel exigem Supabase.

Scripts:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Configurar Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Em **Project Settings > API**, copie:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (somente servidor)
3. No SQL Editor, execute nesta ordem:
   - `supabase/migrations/0001_init.sql`
   - `supabase/seed.sql`
4. Authentication:
   - Desative cadastro público.
   - Crie o primeiro usuário (e-mail e senha) manualmente.
   - Ajuste o e-mail em `supabase/seed_admin.sql` e execute o script.
5. Storage: a migration cria os buckets `logos`, `equipment`, `certificates` e `documents`.
6. Auth URL: adicione `http://localhost:3000/auth/callback` e a URL de produção.

Administrador documentado:

- E-mail sugerido: `admin@sermontinymontagens.com.br`
- Senha: definida por você no painel Auth do Supabase
- O usuário só entra no `/admin` depois de `is_active = true` e perfil `administrator`

Não existe cadastro público de administradores.

## WhatsApp

### Modo simples (`wa_me`)

Gera o PDF, grava no Storage, cria link temporário em `/d/{token}` e monta `https://wa.me/{numero}?text=...`. O WhatsApp Web **não anexa** o PDF automaticamente.

### Modo API oficial (`cloud_api`)

Configure somente no servidor:

- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_BUSINESS_ACCOUNT_ID` (opcional)

A escolha do provedor fica em **Admin > Configurações**. Tokens nunca são enviados ao navegador.

## Publicar na Vercel

1. Importe este repositório na Vercel, com root directory `sermontiny-app` se o git estiver na pasta pai.
2. Defina as variáveis de `.env.example`.
3. `NEXT_PUBLIC_SITE_URL` deve ser a URL pública, por exemplo `https://www.sermontinymontagens.com.br`.
4. No Supabase, libere a URL de produção em Auth e CORS.
5. Faça o deploy. O comando de build é `npm run build`.

## Regras financeiras

Valores monetários usam `bigint` em centavos no banco e inteiros no servidor. Alterar o preço atual de um equipamento cria histórico e **não** reescreve orçamentos antigos: cada item grava o unitário da época.

O valor por extenso é testado em `tests/extenso.test.ts`.

## Segurança

- Middleware protege `/admin`
- Permissões reais no banco (`has_permission`) e nas Server Actions
- RLS em todas as tabelas
- Exclusão lógica em dados operacionais
- URLs de documento com token e expiração
- Rate limit no login e no formulário público
- Mensagens de erro genéricas ao cliente

## Logo oficial

O monograma `SM` é um marcador. Envie o logo oficial em **Admin > Configurações**. O arquivo vai para o bucket `logos`.
