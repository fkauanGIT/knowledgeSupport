import type { ReactNode } from 'react'
import { NAV, type Secao } from '../navegacao'

interface AppShellProps {
  secao: Secao
  onNavegar: (secao: Secao) => void
  onMinimizar: () => void
  onFechar: () => void
  telaCheia: boolean
  onAlternarTelaCheia: () => void
  painel: ReactNode
  children: ReactNode
}

export default function AppShell({
  secao,
  onNavegar,
  onMinimizar,
  onFechar,
  telaCheia,
  onAlternarTelaCheia,
  painel,
  children,
}: AppShellProps) {
  const atual = NAV.find((item) => item.id === secao) ?? NAV[0]

  return (
    <div className="app">
      <header className="app-topbar">
        <div className="app-marca">
          <span className="app-marca-icone">🎧</span>
          knowledgeSupport
        </div>

        <div className="app-janela-botoes">
          <button type="button" onClick={onMinimizar} title="Minimizar para a bolha">
            –
          </button>
          <button
            type="button"
            onClick={onAlternarTelaCheia}
            title={telaCheia ? 'Sair da tela cheia' : 'Tela cheia'}
          >
            {telaCheia ? '🗗' : '⛶'}
          </button>
          <button type="button" className="btn-fechar" onClick={onFechar} title="Fechar aplicativo">
            ×
          </button>
        </div>
      </header>

      <div className="app-corpo">
        <aside className="app-sidebar">
          <div className="sidebar-titulo">Menu</div>
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`sidebar-item ${item.id === secao ? 'ativo' : ''}`}
              onClick={() => onNavegar(item.id)}
            >
              {item.titulo}
            </button>
          ))}
          <div className="sidebar-rodape">knowledgeSupport · v1.0.0</div>
        </aside>

        <main className="app-main">
          <div className="main-cabecalho">
            <h1>{atual.titulo}</h1>
            <p>{atual.subtitulo}</p>
          </div>
          <div className="main-conteudo">{children}</div>
        </main>

        <aside className="app-painel">{painel}</aside>
      </div>
    </div>
  )
}
