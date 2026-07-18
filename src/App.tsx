import { useState, type PointerEvent as ReactPointerEvent } from 'react'
import AppShell from './components/AppShell'
import Dashboard from './components/Dashboard'
import PainelDireito from './components/PainelDireito'
import ChamadosApi from './components/ChamadosApi'
import PadroesPanel from './components/PadroesPanel'
import LacunasPanel from './components/LacunasPanel'
import ConfigPanel from './components/ConfigPanel'
import { useResumo } from './hooks/useResumo'
import type { Secao } from './navegacao'
import type { CalledResponse } from './api/types'

function App() {
  const [aberto, setAberto] = useState(false)
  const [secao, setSecao] = useState<Secao>('home')
  const [selecionado, setSelecionado] = useState<CalledResponse | null>(null)

  const { resumo, recarregar } = useResumo()

  // Arrasto da bolinha: clique curto abre o app; se mover além do limiar, vira arrasto.
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
      if (!arrastando) {
        setAberto(true)
        window.bubbleAPI.expand()
      }
    }

    window.addEventListener('pointermove', mover)
    window.addEventListener('pointerup', soltar)
  }

  const minimizar = () => {
    setAberto(false)
    window.bubbleAPI.collapse()
  }

  const navegar = (proxima: Secao) => {
    setSecao(proxima)
    if (proxima !== 'chamados') setSelecionado(null)
  }

  if (!aberto) {
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

  return (
    <AppShell
      secao={secao}
      onNavegar={navegar}
      onMinimizar={minimizar}
      onFechar={() => window.bubbleAPI.quit()}
      painel={
        <PainelDireito resumo={resumo} selecionado={selecionado} onRecarregar={recarregar} />
      }
    >
      {secao === 'home' && <Dashboard resumo={resumo} onNavegar={navegar} />}

      {secao === 'chamados' && (
        <ChamadosApi
          selecionado={selecionado}
          onSelecionar={setSelecionado}
          onMudou={recarregar}
        />
      )}

      {secao === 'padroes' && <PadroesPanel onMudou={recarregar} />}

      {secao === 'lacunas' && <LacunasPanel />}

      {secao === 'config' && <ConfigPanel />}
    </AppShell>
  )
}

export default App
