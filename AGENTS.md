# Repository Guidelines

## Project Structure & Module Organization
- `app/` is the Next.js App Router entry (i18n lives under `app/[lang]/` with locale layouts/pages; API routes sit in `app/api/`). `app/globals.css` contains Tailwind 4 global tokens.
- `components/` holds UI building blocks (Radix/Tailwind powered) and is the place for new shared widgets.
- `lib/` contains cross-cutting logic: API client (`lib/api-client.ts` uses `NEXT_PUBLIC_API_BASE_URL` with a Cloudflare fallback), Directus/blog helpers, SEO utilities, and state stores.
- `public/` stores static assets; `docs/` is the documentation hub; `scripts/` and `test-api.sh` support production checks and API smoke tests; `open-next.config.ts` & `wrangler.*` drive the Cloudflare Worker build.

## Build, Test, and Development Commands
- Install deps: `npm install --legacy-peer-deps`.
- Local dev: `npm run dev` (port 3000). Use `npm run lint` early to avoid CI friction.
- Production build: `npm run build`; run locally with `npm run start`.
- Worker-like preview: `npm run preview` (OpenNext, port 8787). Deploy to Cloudflare with `npm run deploy`; upload-only with `npm run upload`; update CF env typings via `npm run cf-typegen`.
- API smoke test: `API_URL=http://localhost:3000 bash test-api.sh` (creates temp SVG, uploads, polls status).

## Coding Style & Naming Conventions
- TypeScript + React 19 + Next 16; follow the repo’s ESLint config (`eslint.config.mjs`). Two-space indentation, single quotes, and the existing semicolon-less style.
- Components/contexts/hooks in PascalCase (`UploadButton`, `useUploadStore`); helpers/utilities in camelCase. Keep client-safe env vars prefixed with `NEXT_PUBLIC_`.
- Keep i18n-ready text in locale dictionaries and route content under `app/[lang]/`; avoid hardcoding copy in components.
- Favor functional components, narrow props, and colocated styles with Tailwind utility classes; prefer `lib/utils.ts` helpers for class merging.

## Testing Guidelines
- Automated unit tests are minimal; rely on lint plus targeted API checks. When touching API flows, rerun `test-api.sh` or the curl workflow in `docs/testing/TEST_REPORT.md`.
- Add UI/logic tests when introducing new behavior; mirror the naming used elsewhere (`*.test.ts[x]`) under a colocated `__tests__` or `test/` if applicable.
- Document manual QA steps in PRs (browsers/locales touched, file types converted).

## Commit & Pull Request Guidelines
- Follow the existing short prefixes seen in git history: `feat: …`, `fix: …`, `chore: …` (English or concise Chinese is fine). Use imperative, scope-aware subjects.
- PRs should include: what changed and why, linked issue/task, screenshots for UI shifts (desktop + mobile), and notes on i18n impact and testing performed.
- Keep diffs focused; update docs under `docs/` when user-facing behavior or deployment steps change. Confirm Cloudflare-related env keys in PR descriptions if they’re required for reviewers.

## Security & Configuration Tips
- Store secrets in `.env.local` / Cloudflare project vars; never commit keys. The API client will fall back to the public Worker URL if `NEXT_PUBLIC_API_BASE_URL` is missing—override it locally to avoid hitting production unintentionally.
- Disable noisy logs or feature flags before deploying; ensure `npm run build` and `npm run preview` pass to validate the OpenNext/Worker pipeline.
