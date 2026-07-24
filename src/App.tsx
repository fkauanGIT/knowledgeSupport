import { useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import AppShell from './components/AppShell'
import Dashboard from './components/Dashboard'
import RightPanel from './components/RightPanel'
import TicketsApi from './components/TicketsApi'
import StandardsPanel from './components/StandardsPanel'
import DocumentationPanel from './components/DocumentationPanel'
import GapsPanel from './components/GapsPanel'
import ConfigPanel from './components/ConfigPanel'
import { useSummary } from './hooks/useSummary'
import type { Section } from './navigation'
import type { CalledResponse } from './api/types'

function App() {
  const [open, setOpen] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [section, setSection] = useState<Section>('home')
  const [selected, setSelected] = useState<CalledResponse | null>(null)

  const { summary, reload } = useSummary()

  // Bubble drag: a short click opens the app; moving past the threshold turns it into a drag.
  const startDrag = (e: ReactPointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    const start = { x: e.screenX, y: e.screenY }
    const last = { ...start }
    let dragging = false

    const move = (ev: PointerEvent) => {
      const dx = ev.screenX - last.x
      const dy = ev.screenY - last.y
      if (!dragging) {
        const total = Math.abs(ev.screenX - start.x) + Math.abs(ev.screenY - start.y)
        if (total <= 4) return
        dragging = true
      }
      window.bubbleAPI.moveBy(dx, dy)
      last.x = ev.screenX
      last.y = ev.screenY
    }

    const release = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', release)
      if (!dragging) {
        setOpen(true)
        window.bubbleAPI.expand()
      }
    }

    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', release)
  }

  const minimize = () => {
    setOpen(false)
    setFullscreen(false)
    window.bubbleAPI.collapse()
  }

  const toggleFullscreen = () => {
    if (fullscreen) {
      window.bubbleAPI.restore()
    } else {
      window.bubbleAPI.fullscreen()
    }
    setFullscreen(!fullscreen)
  }

  // Panels stay mounted at all times (visibility via CSS) instead of entering/leaving the DOM on
  // every navigation — avoids refetching each screen and losing local filters (e.g. Tickets)
  // every time the user switches tabs and comes back.
  const sectionStyle = (s: Section): CSSProperties => ({ display: section === s ? undefined : 'none' })

  const navigate = (next: Section) => {
    setSection(next)
    if (next !== 'tickets') setSelected(null)
  }

  if (!open) {
    return (
      <button
        className="bubble"
        onPointerDown={startDrag}
        title="Drag to move • click to open"
      >
        🎧
      </button>
    )
  }

  return (
    <AppShell
      section={section}
      onNavigate={navigate}
      onMinimize={minimize}
      onClose={() => window.bubbleAPI.quit()}
      fullscreen={fullscreen}
      onToggleFullscreen={toggleFullscreen}
      panel={
        <RightPanel summary={summary} selected={selected} onReload={reload} />
      }
    >
      <div style={sectionStyle('home')}>
        <Dashboard summary={summary} onNavigate={navigate} />
      </div>

      <div style={sectionStyle('tickets')}>
        <TicketsApi
          selected={selected}
          onSelect={setSelected}
          onChange={reload}
        />
      </div>

      <div style={sectionStyle('standards')}>
        <StandardsPanel onChange={reload} />
      </div>

      <div style={sectionStyle('documentation')}>
        <DocumentationPanel />
      </div>

      <div style={sectionStyle('gaps')}>
        <GapsPanel />
      </div>

      <div style={sectionStyle('config')}>
        <ConfigPanel />
      </div>
    </AppShell>
  )
}

export default App
