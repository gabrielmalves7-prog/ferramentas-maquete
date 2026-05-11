# xTool Suite

Aplicação [Next.js](https://nextjs.org) (App Router) com duas ferramentas: **conversor de escala/proporção** e **planejador de peças** para o xTool Studio, com dados na nuvem via [Supabase](https://supabase.com).

## Requisitos

- Node.js 20+
- Conta Supabase (URL + chave anon/publicável)

## Começar

```bash
npm install
cp .env.example .env.local
# Edite .env.local com NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) (redireciona para `/escala`).

## Scripts

| Comando | Descrição |
|--------|-----------|
| `npm run dev` | Servidor de desenvolvimento (Turbopack) |
| `npm run build` | Build de produção |
| `npm run start` | Servidor após `build` |
| `npm run lint` | ESLint |

## Supabase

1. No projeto Supabase: **SQL Editor** → executa o ficheiro `supabase/migrations/20260511000000_xtool_suite.sql`.
2. Copia **Project URL** e **anon/public** key para `.env.local` (ver `.env.example`).

## Deploy (Vercel + GitHub)

1. Push deste repositório para o GitHub.
2. Na Vercel: **New Project** → importa o repo.
3. Confirma que **Root Directory** é a pasta onde está este `package.json` (a raiz do repo, salvo monorepo).
4. Em **Settings → Environment Variables**, define as mesmas variáveis `NEXT_PUBLIC_SUPABASE_*` para Production e Preview.
5. **Redeploy** após alterar variáveis.

A raiz `/` redireciona para `/escala` via `next.config.ts` (`redirects`), mesmo que `app/page.tsx` no deploy ainda seja o template padrão do Next.

## Estrutura do projeto

```
app/
  escala/page.tsx      # Ferramenta de escala
  xtool/page.tsx       # Planejador xTool
  globals.css
  layout.tsx
  page.tsx             # Redireciona para /escala
  loading.tsx          # Estado de carregamento (App Router)
  error.tsx            # Limite de erros (client)
  not-found.tsx        # 404
  icon.svg             # Favicon
components/
  HeaderNav.tsx
  SiteChrome.tsx
  ToolEscala.tsx
  ToolXtoolPlanner.tsx
lib/
  scale-math.ts
  types.ts
  supabase/client.ts
public/
  robots.txt
supabase/migrations/
  20260511000000_xtool_suite.sql
```

## Licença

Uso pessoal / o que preferires no teu repositório.
