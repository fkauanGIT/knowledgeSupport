import { useEffect, useState, FormEvent } from 'react'
import type { JiraSettings } from '../api/types'

type Aviso = { tipo: 'ok' | 'erro'; texto: string } | null

export default function ConfigPanel() {
  // --- Config do desktop (URL da API + X-API-KEY) ---
  const [apiUrl, setApiUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [avisoDesktop, setAvisoDesktop] = useState<Aviso>(null)
  const [salvandoDesktop, setSalvandoDesktop] = useState(false)

  // --- Config do Jira (via API) ---
  const [jira, setJira] = useState<JiraSettings | null>(null)
  const [baseUrl, setBaseUrl] = useState('')
  const [email, setEmail] = useState('')
  const [jql, setJql] = useState('')
  const [apiToken, setApiToken] = useState('')
  const [avisoJira, setAvisoJira] = useState<Aviso>(null)
  const [salvandoJira, setSalvandoJira] = useState(false)

  // --- Config do Chatwoot (envio de mensagens) ---
  const [chatwootUrl, setChatwootUrl] = useState('')
  const [chatwootAccountId, setChatwootAccountId] = useState('')
  const [chatwootToken, setChatwootToken] = useState('')
  const [avisoChatwoot, setAvisoChatwoot] = useState<Aviso>(null)
  const [salvandoChatwoot, setSalvandoChatwoot] = useState(false)

  useEffect(() => {
    window.backendAPI.getConfig().then((cfg) => {
      setApiUrl(cfg.apiUrl)
      setApiKey(cfg.apiKey)
      setChatwootUrl(cfg.chatwootUrl)
      setChatwootAccountId(cfg.chatwootAccountId)
      setChatwootToken(cfg.chatwootToken)
    })
    carregarJira()
  }, [])

  const carregarJira = async () => {
    const r = await window.backendAPI.getJiraSettings()
    if (r.ok) {
      setJira(r.data)
      setBaseUrl(r.data.baseUrl)
      setEmail(r.data.email)
      setJql(r.data.jql)
      setAvisoJira(null)
    } else {
      setJira(null)
      setAvisoJira({ tipo: 'erro', texto: r.error })
    }
  }

  const salvarDesktop = async (e: FormEvent) => {
    e.preventDefault()
    setSalvandoDesktop(true)
    try {
      await window.backendAPI.setConfig({ apiUrl: apiUrl.trim(), apiKey: apiKey.trim() })
      setAvisoDesktop({ tipo: 'ok', texto: 'Configuração salva.' })
      await carregarJira()
    } finally {
      setSalvandoDesktop(false)
    }
  }

  const salvarChatwoot = async (e: FormEvent) => {
    e.preventDefault()
    setSalvandoChatwoot(true)
    try {
      await window.backendAPI.setConfig({
        chatwootUrl: chatwootUrl.trim(),
        chatwootAccountId: chatwootAccountId.trim(),
        chatwootToken: chatwootToken.trim(),
      })
      setAvisoChatwoot({ tipo: 'ok', texto: 'Configuração do Chatwoot salva.' })
    } finally {
      setSalvandoChatwoot(false)
    }
  }

  const salvarJira = async (e: FormEvent) => {
    e.preventDefault()
    setSalvandoJira(true)
    setAvisoJira(null)
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
        setAvisoJira({ tipo: 'ok', texto: 'Config do Jira atualizada.' })
      } else {
        setAvisoJira({ tipo: 'erro', texto: r.error })
      }
    } finally {
      setSalvandoJira(false)
    }
  }

  return (
    <div className="config">
      <form className="config-secao" onSubmit={salvarDesktop}>
        <h2>Conexão com a API</h2>
        <label>
          URL da API
          <input
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="http://localhost:8080"
          />
        </label>
        <label>
          Chave de acesso (X-API-KEY)
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sua chave da API"
          />
        </label>
        <button type="submit" disabled={salvandoDesktop}>
          {salvandoDesktop ? 'Salvando...' : 'Salvar conexão'}
        </button>
        {avisoDesktop && <p className={`aviso aviso-${avisoDesktop.tipo}`}>{avisoDesktop.texto}</p>}
      </form>

      <form className="config-secao" onSubmit={salvarJira}>
        <h2>Token do Jira</h2>
        <p className="config-dica">
          Renove o token aqui quando expirar — sem editar o .env nem reiniciar a API.
        </p>
        <label>
          URL base do Jira
          <input
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://sua-empresa.atlassian.net"
          />
        </label>
        <label>
          E-mail da conta
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@empresa.com"
          />
        </label>
        <label>
          Token da API do Atlassian
          <input
            type="password"
            value={apiToken}
            onChange={(e) => setApiToken(e.target.value)}
            placeholder={
              jira?.tokenConfigured ? '•••••• (deixe em branco p/ manter)' : 'cole o novo token'
            }
          />
        </label>
        <label>
          JQL (filtro dos chamados)
          <input
            value={jql}
            onChange={(e) => setJql(e.target.value)}
            placeholder="created >= -30d ORDER BY created DESC"
          />
        </label>
        {jira && (
          <p className="config-status">
            Token atual: {jira.tokenConfigured ? '✅ configurado' : '⚠️ não configurado'}
          </p>
        )}
        <button type="submit" disabled={salvandoJira}>
          {salvandoJira ? 'Salvando...' : 'Salvar Jira'}
        </button>
        {avisoJira && <p className={`aviso aviso-${avisoJira.tipo}`}>{avisoJira.texto}</p>}
      </form>

      <form className="config-secao" onSubmit={salvarChatwoot}>
        <h2>Chatwoot</h2>
        <p className="config-dica">
          Usado para enviar a mensagem gerada pela análise a uma conversa do Chatwoot. O
          conversation_id ainda é informado manualmente na hora do envio — não há (ainda) um
          mapeamento automático entre chamado do Jira e conversa do Chatwoot.
        </p>
        <label>
          URL do Chatwoot
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
          Token de acesso (api_access_token)
          <input
            type="password"
            value={chatwootToken}
            onChange={(e) => setChatwootToken(e.target.value)}
            placeholder="cole o token do agente/bot"
          />
        </label>
        <button type="submit" disabled={salvandoChatwoot}>
          {salvandoChatwoot ? 'Salvando...' : 'Salvar Chatwoot'}
        </button>
        {avisoChatwoot && <p className={`aviso aviso-${avisoChatwoot.tipo}`}>{avisoChatwoot.texto}</p>}
      </form>
    </div>
  )
}
