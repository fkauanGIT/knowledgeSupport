import { useEffect, useState } from 'react'
import type { CalledAnalysisResponse, CalledResponse } from '../api/types'

export default function ChamadosApi() {
  const [calleds, setCalleds] = useState<CalledResponse[]>([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [analises, setAnalises] = useState<Record<string, CalledAnalysisResponse>>({})
  const [abertos, setAbertos] = useState<Set<string>>(new Set())
  const [analisando, setAnalisando] = useState<string | null>(null)
  const [feedbackDado, setFeedbackDado] = useState<Record<string, boolean>>({})

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
    if (r.ok) setFeedbackDado((f) => ({ ...f, [key]: true }))
    else setErro(r.error)
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

      {!carregando && calleds.length === 0 && !erro && (
        <p className="painel-vazio">Nenhum chamado aberto encontrado.</p>
      )}

      <div className="lista-cards">
        {calleds.map((c) => {
          const analise = analises[c.jiraKey]
          return (
            <div key={c.jiraKey} className="item-card">
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
