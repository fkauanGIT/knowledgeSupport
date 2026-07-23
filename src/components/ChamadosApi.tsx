import { useEffect, useMemo, useState } from 'react'
import type { CalledAnalysisResponse, CalledResponse, FilterCategory, IncidentType } from '../api/types'

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
  const [abertos, setAbertos] = useState<Set<string>>(new Set())
  const [analisando, setAnalisando] = useState<string | null>(null)
  const [feedbackDado, setFeedbackDado] = useState<Record<string, boolean>>({})

  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState(TODOS)
  const [filtroTipo, setFiltroTipo] = useState<IncidentType | typeof TODOS>(TODOS)
  const [filtroCategoria, setFiltroCategoria] = useState<FilterCategory | typeof TODOS>(TODOS)

  // Status vêm do Jira em texto livre (workflow customizado por projeto) — não há
  // enum fixo possível, então as opções do filtro são derivadas do que já carregou.
  const statusDisponiveis = useMemo(
    () => Array.from(new Set(calleds.map((c) => c.status).filter((s): s is string => !!s))).sort(),
    [calleds],
  )

  const calledsFiltrados = calleds.filter((c) => {
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
  })

  const alternarAberto = (key: string, aberto?: boolean) =>
    setAbertos((atual) => {
      const proximo = new Set(atual)
      const mostrar = aberto ?? !proximo.has(key)
      if (mostrar) proximo.add(key)
      else proximo.delete(key)
      return proximo
    })

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
      alternarAberto(key, true)
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

              {!analise ? (
                <button
                  type="button"
                  onClick={() => analisar(c.jiraKey)}
                  disabled={analisando === c.jiraKey}
                >
                  {analisando === c.jiraKey ? 'Analisando...' : '🔎 Analisar'}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-secundario"
                  onClick={() => alternarAberto(c.jiraKey)}
                >
                  {abertos.has(c.jiraKey) ? '▲ Ocultar análise' : '▼ Ver análise'}
                </button>
              )}

              {analise && abertos.has(c.jiraKey) && (
                <div className="analise">
                  <p>
                    <strong>{analise.method}</strong> · score {analise.score.toFixed(2)} ·{' '}
                    {analise.confidence}
                  </p>
                  {analise.solution ? (
                    <p className="analise-solucao">{analise.solution}</p>
                  ) : (
                    <p className="painel-vazio">Nenhuma solução sugerida.</p>
                  )}

                  {analise.standardId ? (
                    feedbackDado[c.jiraKey] ? (
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
                    )
                  ) : (
                    <p className="config-dica">
                      Feedback indisponível: a análise não retornou o id do padrão.
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
