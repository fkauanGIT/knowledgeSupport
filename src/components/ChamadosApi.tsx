import { useEffect, useMemo, useState } from 'react'
import type { CalledAnalysisResponse, CalledResponse, FilterCategory, IncidentType } from '../api/types'
import { useConjuntoAlternavel } from '../hooks/useConjuntoAlternavel'

const TODOS = 'TODOS'

interface ChamadosApiProps {
  selecionado?: CalledResponse | null
  onSelecionar?: (chamado: CalledResponse | null) => void
  /** Avisa o app que algo mudou (feedback enviado), para atualizar o resumo. */
  onMudou?: () => void
}

export default function ChamadosApi({
  selecionado,
  onSelecionar,
  onMudou,
}: ChamadosApiProps = {}) {
  const [calleds, setCalleds] = useState<CalledResponse[]>([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [analises, setAnalises] = useState<Record<string, CalledAnalysisResponse>>({})
  const [analisando, setAnalisando] = useState<string | null>(null)
  const [feedbackDado, setFeedbackDado] = useState<Record<string, boolean>>({})

  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState(TODOS)
  const [filtroTipo, setFiltroTipo] = useState<IncidentType | typeof TODOS>(TODOS)
  const [filtroCategoria, setFiltroCategoria] = useState<FilterCategory | typeof TODOS>(TODOS)

  // Mensagem gerada pela análise, editável antes de enviar ao Chatwoot.
  const [mensagens, setMensagens] = useState<Record<string, string>>({})
  const [editando, alternarEdicao] = useConjuntoAlternavel()

  // Envio ao Chatwoot ainda depende do conversation_id ser informado na hora —
  // não há (ainda) mapeamento automático chamado do Jira ↔ conversa do Chatwoot.
  const [mostrandoEnvio, alternarEnvio, setMostrandoEnvio] = useConjuntoAlternavel()
  const [conversationIds, setConversationIds] = useState<Record<string, string>>({})
  const [enviando, setEnviando] = useState<Record<string, boolean>>({})
  const [enviados, setEnviados] = useState<Record<string, boolean>>({})
  const [erroEnvio, setErroEnvio] = useState<Record<string, string>>({})

  // Status vêm do Jira em texto livre (workflow customizado por projeto) — não há
  // enum fixo possível, então as opções do filtro são derivadas do que já carregou.
  const statusDisponiveis = useMemo(
    () => Array.from(new Set(calleds.map((c) => c.status).filter((s): s is string => !!s))).sort(),
    [calleds],
  )

  const calledsFiltrados = useMemo(
    () =>
      calleds.filter((c) => {
        if (filtroStatus !== TODOS && c.status !== filtroStatus) return false
        if (filtroTipo !== TODOS && c.incidentType !== filtroTipo) return false
        if (filtroCategoria !== TODOS && c.filterCategory !== filtroCategoria) return false
        if (busca.trim()) {
          const alvo = busca.trim().toLowerCase()
          const combina =
            c.jiraKey.toLowerCase().includes(alvo) || c.titleCalled.toLowerCase().includes(alvo)
          if (!combina) return false
        }
        return true
      }),
    [calleds, filtroStatus, filtroTipo, filtroCategoria, busca],
  )

  const carregar = async () => {
    setCarregando(true)
    setErro('')
    const r = await window.backendAPI.listCalleds()
    if (r.ok) setCalleds(r.data)
    else setErro(r.error)
    setCarregando(false)
  }

  useEffect(() => {
    carregar()
  }, [])

  const analisar = async (key: string) => {
    setAnalisando(key)
    const r = await window.backendAPI.analyzeCalled(key)
    if (r.ok) {
      setAnalises((a) => ({ ...a, [key]: r.data }))
      setMensagens((m) => ({ ...m, [key]: r.data.solution ?? '' }))
      setEnviados((e) => ({ ...e, [key]: false }))
      setErroEnvio((e) => ({ ...e, [key]: '' }))
    } else setErro(r.error)
    setAnalisando(null)
  }

  const enviarFeedback = async (key: string, standardId: string, resolved: boolean) => {
    const r = await window.backendAPI.sendFeedback(key, { standardId, resolved })
    if (r.ok) {
      setFeedbackDado((f) => ({ ...f, [key]: true }))
      onMudou?.()
    } else setErro(r.error)
  }

  const descartar = (key: string) => {
    setAnalises((a) => {
      const proximo = { ...a }
      delete proximo[key]
      return proximo
    })
    setMostrandoEnvio((s) => {
      const n = new Set(s)
      n.delete(key)
      return n
    })
  }

  const confirmarEnvio = async (key: string) => {
    const conversationId = (conversationIds[key] ?? '').trim()
    if (!conversationId) return
    setEnviando((e) => ({ ...e, [key]: true }))
    setErroEnvio((e) => ({ ...e, [key]: '' }))
    const r = await window.backendAPI.sendChatwootMessage(conversationId, mensagens[key] ?? '')
    if (r.ok) {
      setEnviados((e) => ({ ...e, [key]: true }))
      setMostrandoEnvio((s) => {
        const n = new Set(s)
        n.delete(key)
        return n
      })
    } else {
      setErroEnvio((e) => ({ ...e, [key]: r.error }))
    }
    setEnviando((e) => ({ ...e, [key]: false }))
  }

  return (
    <div className="chamados-api">
      <div className="painel-topo">
        <p className="painel-intro">Chamados vindos do Jira em tempo real.</p>
        <button type="button" onClick={carregar} disabled={carregando}>
          {carregando ? '...' : '↻ Atualizar'}
        </button>
      </div>

      {erro && <p className="aviso aviso-erro">{erro}</p>}

      {calleds.length > 0 && (
        <div className="chamados-filtros">
          <input
            type="text"
            placeholder="Buscar por chave ou título..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />

          <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
            <option value={TODOS}>Status: todos</option>
            {statusDisponiveis.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value as IncidentType | typeof TODOS)}
          >
            <option value={TODOS}>Tipo: todos</option>
            <option value="ALERT">ALERT</option>
            <option value="ERROR">ERROR</option>
          </select>

          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value as FilterCategory | typeof TODOS)}
          >
            <option value={TODOS}>Categoria: todas</option>
            <option value="SUPPORT">SUPPORT</option>
            <option value="INFRASTRUCTURE">INFRASTRUCTURE</option>
            <option value="DEVELOPMENT">DEVELOPMENT</option>
            <option value="PENDING">PENDING</option>
          </select>
        </div>
      )}

      {!carregando && calleds.length === 0 && !erro && (
        <p className="painel-vazio">Nenhum chamado aberto encontrado.</p>
      )}

      {!carregando && calleds.length > 0 && calledsFiltrados.length === 0 && (
        <p className="painel-vazio">Nenhum chamado corresponde aos filtros.</p>
      )}

      <div className="lista-cards">
        {calledsFiltrados.map((c) => {
          const analise = analises[c.jiraKey]
          const colapsado = !!analise

          return (
            <div
              key={c.jiraKey}
              className={`item-card ${selecionado?.jiraKey === c.jiraKey ? 'selecionado' : ''}`}
              onClick={() =>
                onSelecionar?.(selecionado?.jiraKey === c.jiraKey ? null : c)
              }
            >
              <div className="item-card-header">
                <strong>{c.jiraKey}</strong>
                {c.status && <span className="tag">{c.status}</span>}
              </div>

              <p className="item-card-titulo">{c.titleCalled}</p>
              <div className="item-card-meta">
                {c.routineNumber != null && <span>Rotina {c.routineNumber}</span>}
                <span>{c.incidentType}</span>
                <span>{c.filterCategory}</span>
              </div>

              {!colapsado ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    analisar(c.jiraKey)
                  }}
                  disabled={analisando === c.jiraKey}
                >
                  {analisando === c.jiraKey ? 'Analisando...' : '🔎 Analisar'}
                </button>
              ) : (
                <div className="chamado-resultado" onClick={(e) => e.stopPropagation()}>
                  <p className="chamado-resultado-meta">
                    {analise.method} · score {analise.score.toFixed(2)} · {analise.confidence}
                  </p>

                  {editando.has(c.jiraKey) ? (
                    <textarea
                      className="chamado-mensagem-edicao"
                      value={mensagens[c.jiraKey] ?? ''}
                      onChange={(e) =>
                        setMensagens((m) => ({ ...m, [c.jiraKey]: e.target.value }))
                      }
                      rows={4}
                    />
                  ) : (mensagens[c.jiraKey] ?? '').trim() ? (
                    <p className="chamado-mensagem">{mensagens[c.jiraKey]}</p>
                  ) : (
                    <p className="painel-vazio">Nenhuma solução sugerida.</p>
                  )}

                  {analise.confidence !== 'NONE' && (
                    <>
                      <div className="fontes-eyebrow">Fontes</div>
                      <div className="fonte">
                        <div className="fonte-cab">
                          <span className="fonte-nome">🟢 Padrão verificado</span>
                          <span className="tag tag-ok">{analise.confidence}</span>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="chamado-acoes">
                    <button type="button" onClick={() => alternarEnvio(c.jiraKey)}>
                      📤 Enviar Webhook ao Chatwoot
                    </button>
                    <button
                      type="button"
                      className="btn-secundario"
                      onClick={() => alternarEdicao(c.jiraKey)}
                    >
                      {editando.has(c.jiraKey) ? '✓ Concluir edição' : '✎ Editar mensagem de texto'}
                    </button>
                    <button
                      type="button"
                      className="btn-secundario"
                      onClick={() => descartar(c.jiraKey)}
                    >
                      ✕ Descartar
                    </button>
                  </div>

                  {mostrandoEnvio.has(c.jiraKey) && (
                    <div className="chamado-envio-form">
                      <input
                        type="text"
                        placeholder="conversation_id do Chatwoot"
                        value={conversationIds[c.jiraKey] ?? ''}
                        onChange={(e) =>
                          setConversationIds((ids) => ({ ...ids, [c.jiraKey]: e.target.value }))
                        }
                      />
                      <button
                        type="button"
                        onClick={() => confirmarEnvio(c.jiraKey)}
                        disabled={
                          enviando[c.jiraKey] || !(conversationIds[c.jiraKey] ?? '').trim()
                        }
                      >
                        {enviando[c.jiraKey] ? 'Enviando...' : 'Confirmar envio'}
                      </button>
                      <button
                        type="button"
                        className="btn-secundario"
                        onClick={() => alternarEnvio(c.jiraKey)}
                      >
                        Cancelar
                      </button>
                    </div>
                  )}

                  {enviados[c.jiraKey] && (
                    <p className="aviso aviso-ok">Mensagem enviada ao Chatwoot.</p>
                  )}
                  {erroEnvio[c.jiraKey] && (
                    <p className="aviso aviso-erro">{erroEnvio[c.jiraKey]}</p>
                  )}

                  {analise.standardId &&
                    (feedbackDado[c.jiraKey] ? (
                      <p className="aviso aviso-ok">Feedback registrado. Obrigado!</p>
                    ) : (
                      <div className="feedback-botoes">
                        <span>Resolveu?</span>
                        <button
                          type="button"
                          onClick={() => enviarFeedback(c.jiraKey, analise.standardId!, true)}
                        >
                          👍 Sim
                        </button>
                        <button
                          type="button"
                          className="btn-secundario"
                          onClick={() => enviarFeedback(c.jiraKey, analise.standardId!, false)}
                        >
                          👎 Não
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
