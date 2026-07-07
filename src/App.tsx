import { useEffect, useState } from 'react'
import ChamadoForm from './components/ChamadoForm'
import ChamadoList from './components/ChamadoList'
import OlhoDeDeus from './components/OlhoDeDeus'
import type { Chamado } from './types/chamado'

type Estado = 'colapsado' | 'menu' | 'novo' | 'olho'

function App() {
  const [estado, setEstado] = useState<Estado>('colapsado')
  const [chamados, setChamados] = useState<Chamado[]>([])

  useEffect(() => {
    if (estado === 'novo' || estado === 'olho') {
      window.chamadosAPI.getAll().then(setChamados)
    }
  }, [estado])

  if (estado === 'colapsado') {
    return (
      <button
        className="bolinha"
        onClick={() => {
          setEstado('menu')
          window.bubbleAPI.menu()
        }}
        title="Abrir base de chamados"
      >
        🎧
      </button>
    )
  }

  if (estado === 'menu') {
    return (
      <div className="bolha-menu">
        <button
          className="bolha-menu-item"
          onClick={() => {
            setEstado('olho')
            window.bubbleAPI.expand()
          }}
          title="Olho de Deus"
        >
          👁️
        </button>
        <button
          className="bolha-menu-item"
          onClick={() => {
            setEstado('novo')
            window.bubbleAPI.expand()
          }}
          title="Criar chamado"
        >
          ➕
        </button>
        <button
          className="bolha-menu-item bolha-fechar"
          onClick={() => {
            setEstado('colapsado')
            window.bubbleAPI.collapse()
          }}
          title="Fechar menu"
        >
          ×
        </button>
      </div>
    )
  }

  return (
    <div className="card">
      <header className="card-header">
        <span>{estado === 'olho' ? 'Olho de Deus' : 'Criar chamado'}</span>
        <div className="card-header-botoes">
          <button
            onClick={() => {
              setEstado('colapsado')
              window.bubbleAPI.collapse()
            }}
            title="Minimizar"
          >
            –
          </button>
          <button onClick={() => window.bubbleAPI.quit()} title="Fechar">
            ×
          </button>
        </div>
      </header>

      <div className="card-conteudo">
        {estado === 'novo' ? (
          <>
            <ChamadoForm onSalvo={(chamado) => setChamados((atual) => [...atual, chamado])} />
            <h2>Chamados cadastrados</h2>
            <ChamadoList chamados={chamados} />
          </>
        ) : (
          <OlhoDeDeus
            chamados={chamados}
            onAtualizarChamado={(chamado) =>
              setChamados((atual) => atual.map((c) => (c.id === chamado.id ? chamado : c)))
            }
          />
        )}
      </div>
    </div>
  )
}

export default App
