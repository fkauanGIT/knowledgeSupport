import type { Resumo } from '../hooks/useResumo'
import type { CalledResponse } from '../api/types'

interface PainelDireitoProps {
  resumo: Resumo
  selecionado: CalledResponse | null
  onRecarregar: () => void
}

const dataCurta = (iso: string | null) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR')
}

export default function PainelDireito({
  resumo,
  selecionado,
  onRecarregar,
}: PainelDireitoProps) {
  const jira = resumo.jira

  return (
    <>
      <div className="painel-bloco">
        <h3>Conexão</h3>
        <div className="painel-linha">
          <span>API</span>
          <span className={`tag ${resumo.erro ? 'tag-alerta' : 'tag-ok'}`}>
            {resumo.erro ? 'erro' : 'ok'}
          </span>
        </div>
        <div className="painel-linha">
          <span>Token do Jira</span>
          <span className={`tag ${jira?.tokenConfigured ? 'tag-ok' : 'tag-alerta'}`}>
            {jira?.tokenConfigured ? 'configurado' : 'pendente'}
          </span>
        </div>
        {jira?.baseUrl && (
          <div className="painel-linha">
            <span>Site</span>
            <span title={jira.baseUrl}>{jira.baseUrl.replace(/^https?:\/\//, '')}</span>
          </div>
        )}
      </div>

      {selecionado ? (
        <div className="painel-bloco">
          <h3>Chamado selecionado</h3>
          <div className="painel-item">
            <strong>{selecionado.jiraKey}</strong>
            <small>{selecionado.titleCalled}</small>
          </div>
          <div className="painel-linha">
            <span>Status</span>
            <span>{selecionado.status ?? '—'}</span>
          </div>
          <div className="painel-linha">
            <span>Rotina</span>
            <span>{selecionado.routineNumber ?? '—'}</span>
          </div>
          <div className="painel-linha">
            <span>Tipo</span>
            <span>{selecionado.incidentType}</span>
          </div>
          <div className="painel-linha">
            <span>Solicitante</span>
            <span>{selecionado.requesterName ?? '—'}</span>
          </div>
          <div className="painel-linha">
            <span>Criado em</span>
            <span>{dataCurta(selecionado.createdAt)}</span>
          </div>
        </div>
      ) : (
        <div className="painel-bloco">
          <h3>Resumo</h3>
          <div className="painel-linha">
            <span>Chamados abertos</span>
            <span>{resumo.chamados ?? '—'}</span>
          </div>
          <div className="painel-linha">
            <span>Padrões</span>
            <span>{resumo.padroes ?? '—'}</span>
          </div>
          <div className="painel-linha">
            <span>Sem padrão</span>
            <span>{resumo.gap?.totalWithoutMatch ?? '—'}</span>
          </div>
        </div>
      )}

      {resumo.gap && resumo.gap.gapsByRoutine.length > 0 && (
        <div className="painel-bloco">
          <h3>Top lacunas</h3>
          {resumo.gap.gapsByRoutine.slice(0, 5).map((g, i) => (
            <div className="painel-linha" key={i}>
              <span>Rotina {g.routineNumber ?? '—'}</span>
              <span>{g.count}</span>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        className="btn-secundario dash-atalho"
        onClick={onRecarregar}
        disabled={resumo.carregando}
      >
        {resumo.carregando ? 'Atualizando...' : '↻ Atualizar dados'}
      </button>
    </>
  )
}
