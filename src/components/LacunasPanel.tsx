import { useEffect, useState } from 'react'
import type { GapReportResponse } from '../api/types'

export default function LacunasPanel() {
  const [relatorio, setRelatorio] = useState<GapReportResponse | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  const carregar = async () => {
    setCarregando(true)
    setErro('')
    const r = await window.backendAPI.gapReport()
    if (r.ok) setRelatorio(r.data)
    else setErro(r.error)
    setCarregando(false)
  }

  useEffect(() => {
    carregar()
  }, [])

  return (
    <div className="lacunas">
      <div className="painel-topo">
        <p className="painel-intro">Onde cadastrar um novo padrão cobre mais chamados.</p>
        <button type="button" onClick={carregar} disabled={carregando}>
          {carregando ? '...' : '↻ Atualizar'}
        </button>
      </div>

      {erro && <p className="aviso aviso-erro">{erro}</p>}

      {relatorio && (
        <>
          <div className="lacunas-resumo">
            <div>
              <strong>{relatorio.totalCalledsAnalyzed}</strong>
              <span>analisados</span>
            </div>
            <div>
              <strong>{relatorio.totalWithoutMatch}</strong>
              <span>sem padrão</span>
            </div>
          </div>

          {relatorio.gapsByRoutine.length === 0 ? (
            <p className="painel-vazio">Sem lacunas — todos os chamados casaram com algum padrão.</p>
          ) : (
            <table className="chamado-list">
              <thead>
                <tr>
                  <th>Rotina</th>
                  <th>Chamados sem padrão</th>
                </tr>
              </thead>
              <tbody>
                {relatorio.gapsByRoutine.map((g, i) => (
                  <tr key={i}>
                    <td>{g.routineNumber ?? '—'}</td>
                    <td>{g.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  )
}
