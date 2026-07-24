// Chatwoot client — a separate integration from knowledgeSupport-api, with its own
// URL/account/token. Chatwoot has no generic "inbound webhook"; sending a message
// goes through its API too (account_id + conversation_id), so conversation_id still
// has to be entered manually until a ticket<->conversation mapping exists.

import { ipcMain } from 'electron'
import { extractErrorMessage, readConfig, type ApiResult } from './apiClient'

async function sendChatwootMessage(
  conversationId: string,
  content: string,
): Promise<ApiResult<unknown>> {
  const config = await readConfig()
  if (!config.chatwootUrl || !config.chatwootAccountId || !config.chatwootToken) {
    return {
      ok: false,
      status: 0,
      error: 'Chatwoot not configured — fill in URL, account ID and token in Settings.',
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
      return { ok: false, status: response.status, error: await extractErrorMessage(response) }
    }
    return { ok: true, data: await response.json() }
  } catch (e) {
    return {
      ok: false,
      status: 0,
      error: `Could not reach Chatwoot at ${config.chatwootUrl} (${e instanceof Error ? e.message : e})`,
    }
  }
}

/** Registers the Chatwoot IPC channels. Call once at boot. */
export function registerChatwootHandlers() {
  // Manual message send — conversation_id is still entered at send time
  ipcMain.handle('chatwoot:sendMessage', (_e, conversationId: string, content: string) =>
    sendChatwootMessage(conversationId, content))
}
