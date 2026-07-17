import { useEffect, useState, type PointerEvent as ReactPointerEvent } from 'react'
import ChamadoForm from './components/ChamadoForm'
import ChamadoList from './components/ChamadoList'
import OlhoDeDeus from './components/OlhoDeDeus'
import ChamadosApi from './components/ChamadosApi'
import PadroesPanel from './components/PadroesPanel'
import LacunasPanel from './components/LacunasPanel'
import ConfigPanel from './components/ConfigPanel'
import type { Chamado } from './types/chamado'

type Estado =
  | 'colapsado'
  | 'menu'
  | 'novo'
  | 'olho'
  | 'chamados'
  | 'padroes'
  | 'lacunas'
  | 'config'

const TITULOS: Record<Exclude<Estado, 'colapsado' | 'menu'>, string> = {
  novo: 'Criar chamado',
  olho: 'Olho de Deus',
  chamados: 'Chamados (Jira)',
  padroes: 'Padrões',
  lacunas: 'Lacunas',
  config: 'Configurações',
}

function App() {
  const [estado, setEstado] = useState<Estado>('colapsado')
  const [chamados, setChamados] = useState<Chamado[]>([])

  useEffect(() => {
    if (estado === 'novo' || estado === 'olho') {
      window.chamadosAPI.getAll().then(setChamados)
    }
  }, [estado])

  const abrir = (proximo: Exclude<Estado, 'colapsado' | 'menu'>) => {
    setEstado(proximo)
    window.bubbleAPI.expand()
  }

  const abrirMenu = () => {
    setEstado('menu')
    window.bubbleAPI.menu()
  }

  // Arrasto da bolinha: clique curto abre o menu; se mover além do limiar, vira arrasto.
  const iniciarArrasto = (e: ReactPointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    const inicio = { x: e.screenX, y: e.screenY }
    const ultimo = { ...inicio }
    let arrastando = false

    const mover = (ev: PointerEvent) => {
      const dx = ev.screenX - ultimo.x
      const dy = ev.screenY - ultimo.y
      if (!arrastando) {
        const total = Math.abs(ev.screenX - inicio.x) + Math.abs(ev.screenY - inicio.y)
        if (total <= 4) return
        arrastando = true
      }
      window.bubbleAPI.moveBy(dx, dy)
      ultimo.x = ev.screenX
      ultimo.y = ev.screenY
    }

    const soltar = () => {
      window.removeEventListener('pointermove', mover)
      window.removeEventListener('pointerup', soltar)
      if (!arrastando) abrirMenu()
    }

    window.addEventListener('pointermove', mover)
    window.addEventListener('pointerup', soltar)
  }

  if (estado === 'colapsado') {
    return (
      <button
        className="bolinha"
        onPointerDown={iniciarArrasto}
        title="Arraste para mover • clique para abrir"
      >
        🎧
      </button>
    )
  }

  if (estado === 'menu') {
    return (
      <div className="bolha-menu">
        <button className="bolha-menu-item" onClick={() => abrir('olho')} title="Olho de Deus">
          👁️
        </button>
        <button className="bolha-menu-item" onClick={() => abrir('novo')} title="Criar chamado">
          ➕
        </button>
        <button
          className="bolha-menu-item"
          onClick={() => abrir('chamados')}
          title="Chamados (Jira)"
        >
          🎫
        </button>
        <button className="bolha-menu-item" onClick={() => abrir('padroes')} title="Padrões">
          📚
        </button>
        <button className="bolha-menu-item" onClick={() => abrir('lacunas')} title="Lacunas">
          📊
        </button>
        <button className="bolha-menu-item" onClick={() => abrir('config')} title="Configurações">
          ⚙️
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
        <span>{TITULOS[estado]}</span>
        <div className="card-header-botoes">
          <button
            onClick={() => {
              setEstado('menu')
              window.bubbleAPI.menu()
            }}
            title="Voltar ao menu"
          >
            ‹
          </button>
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
        {estado === 'novo' && (
          <>
            <ChamadoForm onSalvo={(chamado) => setChamados((atual) => [...atual, chamado])} />
            <h2>Chamados cadastrados</h2>
            <ChamadoList chamados={chamados} />
          </>
        )}
        {estado === 'olho' && (
          <OlhoDeDeus
            chamados={chamados}
            onAtualizarChamado={(chamado) =>
              setChamados((atual) => atual.map((c) => (c.id === chamado.id ? chamado : c)))
            }
          />
        )}
        {estado === 'chamados' && <ChamadosApi />}
        {estado === 'padroes' && <PadroesPanel />}
        {estado === 'lacunas' && <LacunasPanel />}
        {estado === 'config' && <ConfigPanel />}
      </div>
    </div>
  )
}

export default App
