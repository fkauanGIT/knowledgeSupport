# Architecture — knowledgeSupport Desktop

This document describes how the desktop app is organized and why. The focus is the separation
between Electron's processes and the data flow to knowledgeSupport-api.

![Architecture](assets/architecture.svg)

## The three processes

Electron splits the app into processes with distinct responsibilities. Here they map to a
clear security boundary.

### Renderer (`src/`)

The React interface. The only place with JSX and UI state. It **doesn't** make direct HTTP
calls or know the `X-API-KEY` or Jira token — everything goes through `window.backendAPI` and
`window.bubbleAPI`, injected by preload.

Main components:

- `App.tsx` — switches between the bubble (draggable launcher) and the app window; holds the
  active section and the selected ticket.
- `components/AppShell.tsx` — the layout: top bar, navigation sidebar, content and right-side panel.
- `components/Dashboard.tsx` — the Home, with the summary cards and the ticket charts
  (`TicketsChart.tsx`, Recharts): one covering the whole period, another filterable by date and
  assignee.
- `components/TicketsApi.tsx` — Jira tickets (list, analyze, feedback), with an open-state
  filter (open/closed/all, resolved server-side via `onlyOpen`).
- `components/StandardsPanel.tsx` — knowledge-base CRUD + accuracy.
- `components/GapsPanel.tsx` — gap report.
- `components/ConfigPanel.tsx` — API connection and Jira token.
- `components/RightPanel.tsx` — connection status and detail of the selected ticket.
- `hooks/useSummary.ts` — consolidates the numbers the Home and the right panel share.
- `navigation.ts` — single source of truth for the sections (sidebar + header).

### Preload (`electron/preload.ts`)

The bridge. Uses `contextBridge` to expose a small, explicit set of functions to the renderer,
each one just forwarding an `ipcRenderer.invoke`/`send` to a named channel. It's the contract
between UI and main — nothing beyond what's here crosses the boundary.

### Main (`electron/`)

The Node process. Concentrates everything "system": windows, files and HTTP.

- `main.ts` — creates the window (born centered) and handles the bubble channels (`bubble:*`):
  open, minimize, move (drag) and quit. When resizing, it anchors on the current center instead
  of recentering, and keeps the window inside the screen's work area.
- `apiClient.ts` — the **outbound adapter**: the only place that knows HTTP and the
  `X-API-KEY`. Every call comes back as `{ ok, data }` or `{ ok, error }`, so an exception never
  crosses the IPC boundary raw. `listCalleds` accepts an optional filter
  (`createdFrom`/`createdTo`/`onlyOpen`/`assignee`) that becomes a query string — same shape as
  the API's `CalledFilter`.
- also exposes `bubble:getVersion` (via Electron's `app.getVersion()`), so the version shown in
  the UI never goes stale/hardcoded.

## Flow of an API call

```
React component
  → window.backendAPI.listCalleds()          (preload)
    → ipcRenderer.invoke('api:calleds:list')
      → apiClient: GET {apiUrl}/api/calleds   (header X-API-KEY)
        → knowledgeSupport-api → Jira
      ← ApiResult<CalledResponse[]>
```

Why does HTTP live in main and not in the renderer? Two reasons: **no CORS** (main is Node, not
a browser) and **no secret leakage** (the `X-API-KEY` stays in the app's `config.json`, read
only by `apiClient`; the renderer only ever sees results).

## Jira token at runtime

The Atlassian token expires. Before, changing it meant editing the API's `.env` and
restarting. Now the **Settings** panel calls `GET`/`PUT /api/settings/jira`, and the API swaps
the credentials in memory (with the override persisted to disk). The token never comes back
through the interface — the `GET` only returns `tokenConfigured: true/false`. On the desktop
side, that's just two more IPC channels (`api:settings:jira:get` / `:set`) in `apiClient.ts`.

## Panels stay mounted across navigation

`App.tsx` renders every panel at once (visibility via CSS `display:none`), instead of
mounting/unmounting on every section switch. Before, leaving "Tickets" and coming back
discarded the component's state — refetching and losing the filters the user had set. The
trade-off is that the first time the full window opens, the panels fetch their data in
parallel instead of one at a time as the user navigates — more simultaneous calls at that
moment, considerably fewer over the session.

## Where the data lives

- **Desktop config** — `config.json` in `userData` (API URL + `X-API-KEY`).
- **Jira tickets, standards, feedback, gaps** — in knowledgeSupport-api (Jira + PostgreSQL).

The app no longer has a local database: Jira is the source of truth for tickets, and the
backend is for standards.

## Types as a contract

`src/api/types.ts` mirrors the API's DTOs (source: `/v3/api-docs`). If the API changes a
contract, this is the only types file to update. `src/types/backend.d.ts` declares the surface
of `window.backendAPI` from these types.
