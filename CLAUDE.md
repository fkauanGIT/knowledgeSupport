# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Vite dev server + Electron together (via `vite-plugin-electron`)
- `npm run build` — `tsc` (typecheck `src` + `electron`) → `vite build` (bundles renderer + main + preload) → `electron-builder` (packages installer to `release/<version>/`: NSIS on Windows, DMG on macOS, AppImage on Linux)
- `npm run lint` — `eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0`
- `npm run preview` — preview the built renderer

There is no test framework configured in this project (no jest/vitest/playwright, no test script).

The app requires the separate `knowledgeSupport-api` backend running (default `http://localhost:8080`) to do anything useful — configure its URL and `X-API-KEY` from the app's Configurações panel on first run (persisted to `config.json` in the Electron userData dir, not in source or env files).

## Architecture

Three isolated Electron processes, each with a distinct responsibility — this split is the most important thing to understand before touching API/IPC code:

- **Renderer** (`src/`) — the React UI. Never does HTTP directly and never sees the API key or Jira token. Only talks to the outside world through `window.backendAPI` / `window.bubbleAPI`, injected by preload.
- **Preload** (`electron/preload.ts`) — the sole contract between UI and main. Exposes `window.ipcRenderer` (generic passthrough), `window.bubbleAPI` (window-control: `expand/collapse/moveBy/quit`), and `window.backendAPI` (one method per backend route, mirroring `apiClient.ts` exactly).
- **Main** (`electron/`) — the Node process. `main.ts` owns the single `BrowserWindow` (a frameless, transparent, always-on-top "bubble" that resizes in place between a 64×64 launcher and the full 1100×700 app — see `BUBBLE_SIZE`/`APP_WIDTH`/`APP_HEIGHT`) and handles `bubble:*` IPC via `ipcMain.on`. `apiClient.ts` is the sole outbound HTTP adapter: it reads `{ apiUrl, apiKey }` from `config.json` (userData dir), calls `${apiUrl}${path}` with header `X-API-KEY`, and normalizes every response into `ApiResult<T> = { ok: true, data } | { ok: false, status, error }` via `ipcMain.handle` so exceptions never cross the IPC boundary raw. This design exists specifically to avoid CORS (HTTP runs in Node, not the browser context) and to keep the API key/Jira token out of the renderer entirely.

**Call flow example**: React component → `window.backendAPI.listCalleds()` (preload) → `ipcRenderer.invoke('api:calleds:list')` → `apiClient.ts` → `GET {apiUrl}/api/calleds` (header `X-API-KEY`) → `knowledgeSupport-api` → Jira → typed `ApiResult<CalledResponse[]>` flows back to the renderer.

The IPC type contract is split across two files: `electron/electron-env.d.ts` (window/bubble API) and `src/types/backend.d.ts` (backend API, derived from `src/api/types.ts`). `src/api/types.ts` mirrors the backend's DTOs (sourced from its `/v3/api-docs`) — update it first if the API contract changes, since `backend.d.ts` and every `window.backendAPI.*` call site depend on it.

### Renderer structure (`src/`)

No router library — navigation is a plain `useState<Secao>` in `App.tsx`, driven by `src/navegacao.ts` (`type Secao` + the `NAV` array), which is the single source of truth for sidebar sections consumed by `AppShell.tsx`. `App.tsx` also holds cross-panel state that would otherwise need prop-drilling through a store: `aberto` (bubble vs. expanded window) and `selecionado` (the currently selected chamado, shared between the chamados list panel and `PainelDireito.tsx`'s detail view).

`src/hooks/useResumo.ts` is the shared-data hook: it fetches calleds/standards/gap-report/Jira-settings in parallel and reduces them into one `Resumo` object, called once in `App.tsx` and threaded into `Dashboard.tsx` and `PainelDireito.tsx` so they don't each issue their own requests. Feature panels (`ChamadosApi.tsx`, `PadroesPanel.tsx`, `LacunasPanel.tsx`, `ConfigPanel.tsx`) call an `onMudou?.()` callback after mutations, wired to `useResumo`'s `recarregar`, to keep the summary in sync without a global store.

Despite its name, `src/components/ChamadosApi.tsx` is a feature panel (the "Chamados" section UI), not an API client — the actual client lives in `electron/apiClient.ts` (main process). All feature panels follow the same shape: local `useState` for list/loading/error/form, `useEffect` → load on mount, CRUD actions call `window.backendAPI.*` then reload and notify `onMudou`.

Styling is one global `src/index.css` (no Tailwind/CSS Modules) using CSS custom properties for a dark/emerald design-token layer and shared Portuguese BEM-ish class names (`.dash-card`, `.item-card`, `.painel-bloco`, etc.) across all panels. The window itself is frameless/transparent, matching `main.ts`'s `frame: false, transparent: true`; drag regions use `-webkit-app-region`.

### Repo layout note

The repo root also contains an unrelated Maven/Spring Boot scaffold (`pom.xml`, `mvnw`, `src/main/java/...`) — this is a stub for the separate `knowledgeSupport-api` backend that the Electron app talks to over HTTP. It's essentially just `DemoApplication.java` and is not part of the Electron/React build (separate toolchain, not wired into `npm run build`).

Versioning is automated via [Release Please](https://github.com/googleapis/release-please) on push to `main` (Conventional Commits → `CHANGELOG.md`); don't hand-edit the version in `package.json` or `CHANGELOG.md`.
