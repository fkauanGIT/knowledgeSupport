import { useEffect, useState, FormEvent } from 'react'
import type { JiraSettings } from '../api/types'

type Notice = { type: 'ok' | 'error'; text: string } | null

export default function ConfigPanel() {
  // --- Desktop config (API URL + X-API-KEY) ---
  const [apiUrl, setApiUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [desktopNotice, setDesktopNotice] = useState<Notice>(null)
  const [savingDesktop, setSavingDesktop] = useState(false)

  // --- Jira config (via API) ---
  const [jira, setJira] = useState<JiraSettings | null>(null)
  const [baseUrl, setBaseUrl] = useState('')
  const [email, setEmail] = useState('')
  const [jql, setJql] = useState('')
  const [apiToken, setApiToken] = useState('')
  const [jiraNotice, setJiraNotice] = useState<Notice>(null)
  const [savingJira, setSavingJira] = useState(false)

  // --- Chatwoot config (message sending) ---
  const [chatwootUrl, setChatwootUrl] = useState('')
  const [chatwootAccountId, setChatwootAccountId] = useState('')
  const [chatwootToken, setChatwootToken] = useState('')
  const [chatwootNotice, setChatwootNotice] = useState<Notice>(null)
  const [savingChatwoot, setSavingChatwoot] = useState(false)

  useEffect(() => {
    window.backendAPI.getConfig().then((cfg) => {
      setApiUrl(cfg.apiUrl)
      setApiKey(cfg.apiKey)
      setChatwootUrl(cfg.chatwootUrl)
      setChatwootAccountId(cfg.chatwootAccountId)
      setChatwootToken(cfg.chatwootToken)
    })
    loadJira()
  }, [])

  const loadJira = async () => {
    const r = await window.backendAPI.getJiraSettings()
    if (r.ok) {
      setJira(r.data)
      setBaseUrl(r.data.baseUrl)
      setEmail(r.data.email)
      setJql(r.data.jql)
      setJiraNotice(null)
    } else {
      setJira(null)
      setJiraNotice({ type: 'error', text: r.error })
    }
  }

  const saveDesktop = async (e: FormEvent) => {
    e.preventDefault()
    setSavingDesktop(true)
    try {
      await window.backendAPI.setConfig({ apiUrl: apiUrl.trim(), apiKey: apiKey.trim() })
      setDesktopNotice({ type: 'ok', text: 'Configuration saved.' })
      await loadJira()
    } finally {
      setSavingDesktop(false)
    }
  }

  const saveChatwoot = async (e: FormEvent) => {
    e.preventDefault()
    setSavingChatwoot(true)
    try {
      await window.backendAPI.setConfig({
        chatwootUrl: chatwootUrl.trim(),
        chatwootAccountId: chatwootAccountId.trim(),
        chatwootToken: chatwootToken.trim(),
      })
      setChatwootNotice({ type: 'ok', text: 'Chatwoot configuration saved.' })
    } finally {
      setSavingChatwoot(false)
    }
  }

  const saveJira = async (e: FormEvent) => {
    e.preventDefault()
    setSavingJira(true)
    setJiraNotice(null)
    try {
      const r = await window.backendAPI.setJiraSettings({
        baseUrl: baseUrl.trim(),
        email: email.trim(),
        jql: jql.trim(),
        apiToken: apiToken.trim() || undefined,
      })
      if (r.ok) {
        setJira(r.data)
        setApiToken('')
        setJiraNotice({ type: 'ok', text: 'Jira config updated.' })
      } else {
        setJiraNotice({ type: 'error', text: r.error })
      }
    } finally {
      setSavingJira(false)
    }
  }

  return (
    <div className="config">
      <form className="config-section" onSubmit={saveDesktop}>
        <h2>API connection</h2>
        <label>
          API URL
          <input
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="http://localhost:8080"
          />
        </label>
        <label>
          Access key (X-API-KEY)
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="your API key"
          />
        </label>
        <button type="submit" disabled={savingDesktop}>
          {savingDesktop ? 'Saving...' : 'Save connection'}
        </button>
        {desktopNotice && <p className={`notice notice-${desktopNotice.type}`}>{desktopNotice.text}</p>}
      </form>

      <form className="config-section" onSubmit={saveJira}>
        <h2>Jira token</h2>
        <p className="config-tip">
          Renew the token here when it expires — no need to edit .env or restart the API.
        </p>
        <label>
          Jira base URL
          <input
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://your-company.atlassian.net"
          />
        </label>
        <label>
          Account email
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
          />
        </label>
        <label>
          Atlassian API token
          <input
            type="password"
            value={apiToken}
            onChange={(e) => setApiToken(e.target.value)}
            placeholder={
              jira?.tokenConfigured ? '•••••• (leave blank to keep it)' : 'paste the new token'
            }
          />
        </label>
        <label>
          JQL (ticket filter)
          <input
            value={jql}
            onChange={(e) => setJql(e.target.value)}
            placeholder="created >= -30d ORDER BY created DESC"
          />
        </label>
        {jira && (
          <p className="config-status">
            Current token: {jira.tokenConfigured ? '✅ configured' : '⚠️ not configured'}
          </p>
        )}
        <button type="submit" disabled={savingJira}>
          {savingJira ? 'Saving...' : 'Save Jira'}
        </button>
        {jiraNotice && <p className={`notice notice-${jiraNotice.type}`}>{jiraNotice.text}</p>}
      </form>

      <form className="config-section" onSubmit={saveChatwoot}>
        <h2>Chatwoot</h2>
        <p className="config-tip">
          Used to send the message generated by the analysis to a Chatwoot conversation. The
          conversation_id is still entered manually at send time — there's no (yet) automatic
          mapping between a Jira ticket and a Chatwoot conversation.
        </p>
        <label>
          Chatwoot URL
          <input
            value={chatwootUrl}
            onChange={(e) => setChatwootUrl(e.target.value)}
            placeholder="https://app.chatwoot.com"
          />
        </label>
        <label>
          Account ID
          <input
            value={chatwootAccountId}
            onChange={(e) => setChatwootAccountId(e.target.value)}
            placeholder="1"
          />
        </label>
        <label>
          Access token (api_access_token)
          <input
            type="password"
            value={chatwootToken}
            onChange={(e) => setChatwootToken(e.target.value)}
            placeholder="paste the agent/bot token"
          />
        </label>
        <button type="submit" disabled={savingChatwoot}>
          {savingChatwoot ? 'Saving...' : 'Save Chatwoot'}
        </button>
        {chatwootNotice && <p className={`notice notice-${chatwootNotice.type}`}>{chatwootNotice.text}</p>}
      </form>
    </div>
  )
}
