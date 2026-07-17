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

  useEffect(() => {
    window.backendAPI.getConfig().then((cfg) => {
      setApiUrl(cfg.apiUrl)
      setApiKey(cfg.apiKey)
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
    </div>
  )
}
