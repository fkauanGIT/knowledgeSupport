import { useEffect, useState } from 'react'
import ChamadoForm from './components/ChamadoForm'
import ChamadoList from './components/ChamadoList'
import type { Chamado } from './types/chamado'

function App() {
  const [expandido, setExpandido] = useState(false)
  const [chamados, setChamados] = useState<Chamado[]>([])

  useEffect(() => {
    if (expandido) {
      window.chamadosAPI.getAll().then(setChamados)
    }
  }, [expandido])

  if (!expandido) {
    return (
      <button
        className="bolinha"
        onClick={() => {
          setExpandido(true)
          window.bubbleAPI.expand()
        }}
        title="Abrir base de chamados"
      >
        🎧
      </button>
    )
  }

  return (
    <div className="card">
      <header className="card-header">
        <span>Base de Chamados</span>
        <div className="card-header-botoes">
          <button
            onClick={() => {
              setExpandido(false)
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
        <ChamadoForm onSalvo={(chamado) => setChamados((atual) => [...atual, chamado])} />
        <h2>Chamados cadastrados</h2>
        <ChamadoList chamados={chamados} />
      </div>
    </div>
  )
}

export default App
