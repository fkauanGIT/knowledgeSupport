import { useEffect, useState, type ReactNode } from 'react'
import { NAV, type Section } from '../navigation'

interface AppShellProps {
  section: Section
  onNavigate: (section: Section) => void
  onMinimize: () => void
  onClose: () => void
  fullscreen: boolean
  onToggleFullscreen: () => void
  panel: ReactNode
  children: ReactNode
}

export default function AppShell({
  section,
  onNavigate,
  onMinimize,
  onClose,
  fullscreen,
  onToggleFullscreen,
  panel,
  children,
}: AppShellProps) {
  const current = NAV.find((item) => item.id === section) ?? NAV[0]

  const [version, setVersion] = useState('')
  useEffect(() => {
    window.bubbleAPI.getVersion().then(setVersion)
  }, [])

  return (
    <div className="app">
      <header className="app-topbar">
        <div className="app-brand">
          <span className="app-brand-icon">🎧</span>
          knowledgeSupport
        </div>

        <div className="app-window-buttons">
          <button type="button" onClick={onMinimize} title="Minimize to the bubble">
            –
          </button>
          <button
            type="button"
            onClick={onToggleFullscreen}
            title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {fullscreen ? '🗗' : '⛶'}
          </button>
          <button type="button" className="btn-close" onClick={onClose} title="Close app">
            ×
          </button>
        </div>
      </header>

      <div className="app-body">
        <aside className="app-sidebar">
          <div className="sidebar-title">Menu</div>
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`sidebar-item ${item.id === section ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              {item.title}
            </button>
          ))}
          <div className="sidebar-footer">knowledgeSupport{version ? ` · v${version}` : ''}</div>
        </aside>

        <main className="app-main">
          <div className="main-header">
            <h1>{current.title}</h1>
            <p>{current.subtitle}</p>
          </div>
          <div className="main-content">{children}</div>
        </main>

        <aside className="app-panel">{panel}</aside>
      </div>
    </div>
  )
}
