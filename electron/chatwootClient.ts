// Cliente do Chatwoot — integração à parte da knowledgeSupport-api, com sua própria
// URL/conta/token. Chatwoot não tem "webhook de entrada" genérico; envio de mensagem
// é via API mesmo (account_id + conversation_id), então o conversation_id ainda
// precisa ser informado manualmente até existir um mapeamento chamado↔conversa.

import { ipcMain } from 'electron'
import { extrairErro, readConfig, type ApiResult } from './apiClient'

async function sendChatwootMessage(
  conversationId: string,
  content: string,
): Promise<ApiResult<unknown>> {
  const config = await readConfig()
  if (!config.chatwootUrl || !config.chatwootAccountId || !config.chatwootToken) {
    return {
      ok: false,
      status: 0,
      error: 'Chatwoot não configurado — preencha URL, account ID e token em Configurações.',
    }
  }
  try {
    const baseUrl = config.chatwootUrl.replace(/\/+$/, '')
    const response = await fetch(
      `${baseUrl}/api/v1/accounts/${encodeURIComponent(config.chatwootAccountId)}/conversations/${encodeURIComponent(conversationId)}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          api_access_token: config.chatwootToken,
        },
        body: JSON.stringify({ content, message_type: 'outgoing' }),
      },
    )
    if (!response.ok) {
      return { ok: false, status: response.status, error: await extrairErro(response) }
    }
    return { ok: true, data: await response.json() }
  } catch (e) {
    return {
      ok: false,
      status: 0,
      error: `Não foi possível falar com o Chatwoot em ${config.chatwootUrl} (${e instanceof Error ? e.message : e})`,
    }
  }
}

/** Registra os canais IPC do Chatwoot. Chamar uma vez no boot. */
export function registerChatwootHandlers() {
  // Envio manual de mensagem — conversation_id ainda é informado na hora
  ipcMain.handle('chatwoot:sendMessage', (_e, conversationId: string, content: string) =>
    sendChatwootMessage(conversationId, content))
}
