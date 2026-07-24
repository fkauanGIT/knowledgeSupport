// knowledgeSupport-api client — runs in the Electron MAIN process.
// Why here and not in the renderer? Two reasons:
// 1. No CORS: main is plain Node, not a browser.
// 2. The API key never enters the renderer — it stays in the app config, read only here.
// It's the desktop's "outbound adapter": the only place that knows HTTP and the key.
//
// Central client — only knowledgeSupport-api (config, Jira, calleds, standards).
// Chatwoot and Documentation are separate integrations, each in its own module
// (chatwootClient.ts / documentClient.ts), reusing the `request` function from here.

import { app, ipcMain } from 'electron'
import path from 'node:path'
import fs from 'node:fs/promises'
import type { CalledFilter } from '../src/api/types'

export interface AppConfig {
  apiUrl: string
  apiKey: string
  chatwootUrl: string
  chatwootAccountId: string
  chatwootToken: string
}

const defaultConfig: AppConfig = {
  apiUrl: 'http://localhost:8080',
  apiKey: '',
  chatwootUrl: '',
  chatwootAccountId: '',
  chatwootToken: '',
}

function configPath() {
  return path.join(app.getPath('userData'), 'config.json')
}

export async function readConfig(): Promise<AppConfig> {
  try {
    const raw = await fs.readFile(configPath(), 'utf-8')
    return { ...defaultConfig, ...JSON.parse(raw) }
  } catch {
    return { ...defaultConfig }
  }
}

/** Merges only the fields sent on top of the current config — each screen saves its own section. */
export async function writeConfig(patch: Partial<AppConfig>): Promise<AppConfig> {
  const current = await readConfig()
  const next = { ...current, ...patch }
  await fs.mkdir(app.getPath('userData'), { recursive: true })
  await fs.writeFile(configPath(), JSON.stringify(next, null, 2), 'utf-8')
  return next
}

// Structured result: the renderer always gets { ok, data | error },
// never a raw exception crossing the IPC boundary.
export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string }

/** Extracts the error message from the response body (if it's JSON), falling back to the status. */
export async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string; error?: string }
    return body.message ?? body.error ?? `Error ${response.status}`
  } catch {
    return `Error ${response.status}`
  }
}

/**
 * Generic HTTP call to knowledgeSupport-api. Accepts a JSON body (default) or a ready-made
 * `FormData` (multipart upload) — in that case it doesn't force Content-Type, fetch already
 * builds the correct boundary on its own.
 */
export async function request<T>(path_: string, init?: RequestInit): Promise<ApiResult<T>> {
  const config = await readConfig()
  if (!config.apiKey) {
    return { ok: false, status: 0, error: 'API key not configured — open Settings.' }
  }
  try {
    // Strips trailing slash(es) from the base URL so it doesn't produce "//api/..." (a common 404/405 cause).
    const baseUrl = config.apiUrl.replace(/\/+$/, '')
    const isFormData = init?.body instanceof FormData
    const response = await fetch(`${baseUrl}${path_}`, {
      ...init,
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        'X-API-KEY': config.apiKey,
        ...init?.headers,
      },
    })
    if (!response.ok) {
      const message =
        response.status === 401 || response.status === 403
          ? 'Unauthorized — check the API key in Settings.'
          : await extractErrorMessage(response)
      return { ok: false, status: response.status, error: message }
    }
    if (response.status === 204) return { ok: true, data: undefined as T }
    return { ok: true, data: (await response.json()) as T }
  } catch (e) {
    return {
      ok: false,
      status: 0,
      error: `Could not reach the API at ${config.apiUrl} — is it running? (${e instanceof Error ? e.message : e})`,
    }
  }
}

/** Builds a filter's query string, skipping empty/undefined fields. */
function queryString(params?: object): string {
  if (!params) return ''
  const usp = new URLSearchParams()
  for (const [key, value] of Object.entries(params) as [string, string | number | boolean | undefined][]) {
    if (value !== undefined && value !== null && value !== '') usp.set(key, String(value))
  }
  const qs = usp.toString()
  return qs ? `?${qs}` : ''
}

export const get = (p: string) => request(p)
export const post = (p: string, body: unknown) =>
  request(p, { method: 'POST', body: JSON.stringify(body) })
export const put = (p: string, body: unknown) =>
  request(p, { method: 'PUT', body: JSON.stringify(body) })
export const del = (p: string) => request(p, { method: 'DELETE' })

/** Registers the knowledgeSupport-api IPC channels (config, Jira, calleds, standards). */
export function registerApiHandlers() {
  // Desktop config (API URL + X-API-KEY + other integrations)
  ipcMain.handle('config:get', () => readConfig())
  ipcMain.handle('config:set', (_e, patch: Partial<AppConfig>) => writeConfig(patch))

  // Jira config (runtime token rotation, without editing the API's .env)
  ipcMain.handle('api:settings:jira:get', () => get('/api/settings/jira'))
  ipcMain.handle('api:settings:jira:set', (_e, body: unknown) => put('/api/settings/jira', body))

  // Calleds (Jira via API)
  ipcMain.handle('api:calleds:list', (_e, filter?: CalledFilter) =>
    get(`/api/calleds${queryString(filter)}`))
  ipcMain.handle('api:calleds:analysis', (_e, key: string) =>
    get(`/api/calleds/${encodeURIComponent(key)}/analysis`))
  ipcMain.handle('api:calleds:feedback', (_e, key: string, body: unknown) =>
    post(`/api/calleds/${encodeURIComponent(key)}/feedback`, body))
  ipcMain.handle('api:calleds:gapReport', () => get('/api/calleds/gap-report'))

  // Standards (knowledge base)
  ipcMain.handle('api:standards:list', () => get('/api/standards'))
  ipcMain.handle('api:standards:get', (_e, id: string) => get(`/api/standards/${id}`))
  ipcMain.handle('api:standards:create', (_e, body: unknown) => post('/api/standards', body))
  ipcMain.handle('api:standards:update', (_e, id: string, body: unknown) =>
    put(`/api/standards/${id}`, body))
  ipcMain.handle('api:standards:delete', (_e, id: string) => del(`/api/standards/${id}`))
  ipcMain.handle('api:standards:accuracy', (_e, id: string) =>
    get(`/api/standards/${id}/accuracy`))
}
