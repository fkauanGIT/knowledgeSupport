// Cliente da knowledgeSupport-api — roda no processo MAIN do Electron.
// Por que aqui e não no renderer? Dois motivos:
// 1. Sem CORS: o main é Node puro, não navegador.
// 2. A API key nunca entra no renderer — fica no config do app, lida só aqui.
// É o "adapter de saída" do desktop: o único lugar que conhece HTTP e a chave.
//
// Cliente central — só a knowledgeSupport-api (config, Jira, calleds, padrões).
// Chatwoot e Documentação são integrações à parte, cada uma no seu próprio módulo
// (chatwootClient.ts / documentacaoClient.ts), reaproveitando o `request` daqui.

import { app, ipcMain } from 'electron'
import path from 'node:path'
import fs from 'node:fs/promises'

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

/** Mescla só os campos enviados por cima do config atual — cada tela salva sua própria seção. */
export async function writeConfig(patch: Partial<AppConfig>): Promise<AppConfig> {
  const atual = await readConfig()
  const proximo = { ...atual, ...patch }
  await fs.mkdir(app.getPath('userData'), { recursive: true })
  await fs.writeFile(configPath(), JSON.stringify(proximo, null, 2), 'utf-8')
  return proximo
}

// Resultado estruturado: o renderer sempre recebe { ok, data | error },
// nunca uma exceção crua atravessando o IPC.
export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string }

/** Extrai a mensagem de erro do corpo da resposta (se vier JSON), com fallback pro status. */
export async function extrairErro(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string; error?: string }
    return body.message ?? body.error ?? `Erro ${response.status}`
  } catch {
    return `Erro ${response.status}`
  }
}

/**
 * Chamada HTTP genérica pra knowledgeSupport-api. Aceita corpo JSON (padrão) ou um
 * `FormData` pronto (upload multipart) — nesse caso não força o Content-Type, o
 * fetch já monta o boundary correto sozinho.
 */
export async function request<T>(path_: string, init?: RequestInit): Promise<ApiResult<T>> {
  const config = await readConfig()
  if (!config.apiKey) {
    return { ok: false, status: 0, error: 'API key não configurada — abra Configurações.' }
  }
  try {
    // Remove barra(s) no fim da URL base para não gerar "//api/..." (causa comum de 404/405).
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
          ? 'Não autorizado — confira a API key em Configurações.'
          : await extrairErro(response)
      return { ok: false, status: response.status, error: message }
    }
    if (response.status === 204) return { ok: true, data: undefined as T }
    return { ok: true, data: (await response.json()) as T }
  } catch (e) {
    return {
      ok: false,
      status: 0,
      error: `Não foi possível falar com a API em ${config.apiUrl} — ela está rodando? (${e instanceof Error ? e.message : e})`,
    }
  }
}

export const get = (p: string) => request(p)
export const post = (p: string, body: unknown) =>
  request(p, { method: 'POST', body: JSON.stringify(body) })
export const put = (p: string, body: unknown) =>
  request(p, { method: 'PUT', body: JSON.stringify(body) })
export const del = (p: string) => request(p, { method: 'DELETE' })

/** Registra os canais IPC da knowledgeSupport-api (config, Jira, calleds, padrões). */
export function registerApiHandlers() {
  // Configuração do desktop (URL da API + X-API-KEY + demais integrações)
  ipcMain.handle('config:get', () => readConfig())
  ipcMain.handle('config:set', (_e, patch: Partial<AppConfig>) => writeConfig(patch))

  // Configuração do Jira (rotação de token em runtime, sem editar .env da API)
  ipcMain.handle('api:settings:jira:get', () => get('/api/settings/jira'))
  ipcMain.handle('api:settings:jira:set', (_e, body: unknown) => put('/api/settings/jira', body))

  // Chamados (Jira via API)
  ipcMain.handle('api:calleds:list', () => get('/api/calleds'))
  ipcMain.handle('api:calleds:analysis', (_e, key: string) =>
    get(`/api/calleds/${encodeURIComponent(key)}/analysis`))
  ipcMain.handle('api:calleds:feedback', (_e, key: string, body: unknown) =>
    post(`/api/calleds/${encodeURIComponent(key)}/feedback`, body))
  ipcMain.handle('api:calleds:gapReport', () => get('/api/calleds/gap-report'))

  // Padrões (base de conhecimento)
  ipcMain.handle('api:standards:list', () => get('/api/standards'))
  ipcMain.handle('api:standards:get', (_e, id: string) => get(`/api/standards/${id}`))
  ipcMain.handle('api:standards:create', (_e, body: unknown) => post('/api/standards', body))
  ipcMain.handle('api:standards:update', (_e, id: string, body: unknown) =>
    put(`/api/standards/${id}`, body))
  ipcMain.handle('api:standards:delete', (_e, id: string) => del(`/api/standards/${id}`))
  ipcMain.handle('api:standards:accuracy', (_e, id: string) =>
    get(`/api/standards/${id}/accuracy`))
}
