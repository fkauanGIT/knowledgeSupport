import type { Resumo } from '../hooks/useResumo'
import type { Secao } from '../navegacao'

interface DashboardProps {
  resumo: Resumo
  onNavegar: (secao: Secao) => void
}

const numero = (valor: number | null) => (valor === null ? '—' : String(valor))

export default function Dashboard({ resumo, onNavegar }: DashboardProps) {
  const maiorLacuna = resumo.gap?.gapsByRoutine?.[0] ?? null

  return (
    <div>
      {resumo.erro && <p className="aviso aviso-erro">{resumo.erro}</p>}

      <div className="dash-grid">
        <div className="dash-card dash-destaque">
          <h2>Base de conhecimento do suporte</h2>
          <p>Chamados do Jira, padrões de solução e onde o conhecimento ainda falta.</p>
          <div className="dash-atalhos">
            <button type="button" className="dash-atalho" onClick={() => onNavegar('chamados')}>
              Ver chamados
            </button>
            <button type="button" className="dash-atalho" onClick={() => onNavegar('padroes')}>
              Novo padrão
            </button>
          </div>
        </div>

        <div className="dash-card">
          <div className="dash-card-topo">
            <h3>Chamados abertos</h3>
            <span className="tag">Jira</span>
          </div>
          <div className="dash-valor">{numero(resumo.chamados)}</div>
          <p className="dash-legenda">Vindos do Jira em tempo real</p>
        </div>

        <div className="dash-card">
          <div className="dash-card-topo">
            <h3>Padrões cadastrados</h3>
            <span className="tag">Base</span>
          </div>
          <div className="dash-valor">{numero(resumo.padroes)}</div>
          <p className="dash-legenda">Erros conhecidos com solução</p>
        </div>

        <div className="dash-card">
          <div className="dash-card-topo">
            <h3>Sem padrão</h3>
            <span className="tag tag-alerta">Lacunas</span>
          </div>
          <div className="dash-valor">{numero(resumo.gap?.totalWithoutMatch ?? null)}</div>
          <p className="dash-legenda">
            {resumo.gap
              ? `de ${resumo.gap.totalCalledsAnalyzed} analisados`
              : 'sem dados de análise'}
          </p>
        </div>

        <div className="dash-card">
          <div className="dash-card-topo">
            <h3>Maior lacuna</h3>
            <span className="tag">Rotina</span>
          </div>
          <div className="dash-valor">
            {maiorLacuna ? (maiorLacuna.routineNumber ?? '—') : '—'}
          </div>
          <p className="dash-legenda">
            {maiorLacuna
              ? `${maiorLacuna.count} chamados sem solução registrada`
              : 'nenhuma lacuna encontrada'}
          </p>
        </div>
      </div>

      <h2 className="secao-titulo">Atalhos</h2>
      <div className="dash-atalhos">
        <button type="button" className="dash-atalho" onClick={() => onNavegar('lacunas')}>
          Relatório de lacunas
        </button>
        <button type="button" className="dash-atalho" onClick={() => onNavegar('config')}>
          Configurações
        </button>
      </div>
    </div>
  )
}
