<p align="center">
  <img src="docs/assets/icon.svg" width="96" alt="knowledgeSupport" />
</p>

<h1 align="center">knowledgeSupport — Desktop</h1>

<p align="center">
  Desktop app (Electron + React + TypeScript) that works as a technical support knowledge
  base: a floating, screen-centered bubble for looking up tickets, registering solution
  standards, and talking to the <strong>knowledgeSupport-api</strong>.
</p>

## Overview

The app sits as a small floating black bubble with a headset icon — draggable to any corner of
the screen. Clicking it opens the main window: a navigation sidebar, a content area and a side
panel with connection status and the selected ticket's detail.

Tickets come from Jira in real time through the API; standards (known errors and their
solutions) are persisted in the backend; and the analysis cross-references one against the
other to suggest the most likely resolution.

![Architecture](docs/assets/architecture.svg)

## Features

- **Home** — dashboard with the summary (open tickets, registered standards, tickets without a
  standard, and the routine with the biggest gap) and created-vs-resolved ticket charts: one
  covering the whole period, another filterable by date and assignee (daily/weekly/monthly).
- **Tickets** — lists tickets coming from Jira (with an open/closed/all filter, search, and
  status/type/category filters), analyzes each one against the registered standards, and lets
  you record feedback (resolved or not).
- **Standards** — knowledge-base CRUD (error, solution, investigation steps) and an accuracy
  rate per standard, fed by real feedback.
- **Gaps** — report of where registering a new standard would cover the most tickets.
- **Settings** — API connection (URL + `X-API-KEY`) and the **Jira token**: renew the token
  through the interface when it expires, without editing the API's `.env` or restarting the
  server.

## Requirements

- Node.js 18+ and npm
- [knowledgeSupport-api](../demo) running (by default at `http://localhost:8080`)

## Running in development

```bash
npm install
npm run dev
```

Click the bubble to open the app. On first run, go to **Settings** and enter the API URL and
the `X-API-KEY`. Then, still in Settings, fill in the Jira details (base URL, email, token and
JQL).

## Build / packaging

```bash
npm run build
```

Generates the installer via `electron-builder` in `release/<version>/` (NSIS on Windows, DMG on
macOS, AppImage on Linux). The app icon lives in `build/icon.png`.

## Configuration

The app doesn't store secrets in code. There are two configuration layers:

1. **Desktop** — the API URL and the `X-API-KEY` live in `config.json` in the user's data
   directory (written by the `main` process; the renderer never sees the key).
2. **Jira** — base URL, email, token and JQL are managed by the API via
   `GET`/`PUT /api/settings/jira`. The token is never exposed back through the interface — the
   panel only shows whether one is configured.

## Architecture

Three process-isolated layers: the **renderer** (React) only knows `window.backendAPI`,
exposed by **preload** via `contextBridge`; **main** (Node) concentrates the HTTP and the API
key in `apiClient.ts` — no CORS and no secret leakage to the UI. Details in
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Versioning

[SemVer](https://semver.org/) via [Conventional Commits](https://www.conventionalcommits.org/),
automated by [Release Please](https://github.com/googleapis/release-please). History lives in
[`CHANGELOG.md`](CHANGELOG.md).
