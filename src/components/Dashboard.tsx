import type { Summary } from '../hooks/useSummary'
import type { Section } from '../navigation'
import TicketsChart from './TicketsChart'

interface DashboardProps {
  summary: Summary
  onNavigate: (section: Section) => void
}

const number = (value: number | null) => (value === null ? '—' : String(value))

export default function Dashboard({ summary, onNavigate }: DashboardProps) {
  const biggestGap = summary.gap?.gapsByRoutine?.[0] ?? null

  return (
    <div>
      {summary.error && <p className="notice notice-error">{summary.error}</p>}

      <div className="dash-grid">
        <div className="dash-card dash-highlight">
          <h2>Support knowledge base</h2>
          <p>Jira tickets, solution standards, and where the knowledge still falls short.</p>
          <div className="dash-shortcuts">
            <button type="button" className="dash-shortcut" onClick={() => onNavigate('tickets')}>
              View tickets
            </button>
            <button type="button" className="dash-shortcut" onClick={() => onNavigate('standards')}>
              New standard
            </button>
          </div>
        </div>

        <div className="dash-card">
          <div className="dash-card-top">
            <h3>Open tickets</h3>
            <span className="tag">Jira</span>
          </div>
          <div className="dash-value">{number(summary.calleds)}</div>
          <p className="dash-caption">Live from Jira</p>
        </div>

        <div className="dash-card">
          <div className="dash-card-top">
            <h3>Registered standards</h3>
            <span className="tag">Base</span>
          </div>
          <div className="dash-value">{number(summary.standards)}</div>
          <p className="dash-caption">Known errors with a solution</p>
        </div>

        <div className="dash-card">
          <div className="dash-card-top">
            <h3>Without a standard</h3>
            <span className="tag tag-alert">Gaps</span>
          </div>
          <div className="dash-value">{number(summary.gap?.totalWithoutMatch ?? null)}</div>
          <p className="dash-caption">
            {summary.gap
              ? `of ${summary.gap.totalCalledsAnalyzed} analyzed`
              : 'no analysis data'}
          </p>
        </div>

        <div className="dash-card">
          <div className="dash-card-top">
            <h3>Biggest gap</h3>
            <span className="tag">Routine</span>
          </div>
          <div className="dash-value">
            {biggestGap ? (biggestGap.routineNumber ?? '—') : '—'}
          </div>
          <p className="dash-caption">
            {biggestGap
              ? `${biggestGap.count} tickets with no solution registered`
              : 'no gap found'}
          </p>
        </div>

        <TicketsChart title="Tickets — whole period" />
        <TicketsChart title="Tickets by period and responsible" filterable />
      </div>

      <h2 className="section-title">Shortcuts</h2>
      <div className="dash-shortcuts">
        <button type="button" className="dash-shortcut" onClick={() => onNavigate('gaps')}>
          Gap report
        </button>
        <button type="button" className="dash-shortcut" onClick={() => onNavigate('config')}>
          Settings
        </button>
      </div>
    </div>
  )
}
