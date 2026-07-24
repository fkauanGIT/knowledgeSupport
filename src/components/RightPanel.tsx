import type { Summary } from '../hooks/useSummary'
import type { CalledResponse } from '../api/types'

interface RightPanelProps {
  summary: Summary
  selected: CalledResponse | null
  onReload: () => void
}

const shortDate = (iso: string | null) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-US')
}

export default function RightPanel({
  summary,
  selected,
  onReload,
}: RightPanelProps) {
  const jira = summary.jira

  return (
    <>
      <div className="panel-block">
        <h3>Connection</h3>
        <div className="panel-row">
          <span>API</span>
          <span className={`tag ${summary.error ? 'tag-alert' : 'tag-ok'}`}>
            {summary.error ? 'error' : 'ok'}
          </span>
        </div>
        <div className="panel-row">
          <span>Jira token</span>
          <span className={`tag ${jira?.tokenConfigured ? 'tag-ok' : 'tag-alert'}`}>
            {jira?.tokenConfigured ? 'configured' : 'pending'}
          </span>
        </div>
        {jira?.baseUrl && (
          <div className="panel-row">
            <span>Site</span>
            <span title={jira.baseUrl}>{jira.baseUrl.replace(/^https?:\/\//, '')}</span>
          </div>
        )}
      </div>

      {selected ? (
        <div className="panel-block">
          <h3>Selected ticket</h3>
          <div className="panel-item">
            <strong>{selected.jiraKey}</strong>
            <small>{selected.titleCalled}</small>
          </div>
          <div className="panel-row">
            <span>Status</span>
            <span>{selected.status ?? '—'}</span>
          </div>
          <div className="panel-row">
            <span>Routine</span>
            <span>{selected.routineNumber ?? '—'}</span>
          </div>
          <div className="panel-row">
            <span>Type</span>
            <span>{selected.incidentType}</span>
          </div>
          <div className="panel-row">
            <span>Requester</span>
            <span>{selected.requesterName ?? '—'}</span>
          </div>
          <div className="panel-row">
            <span>Assignee</span>
            <span>{selected.assigneeName ?? '—'}</span>
          </div>
          <div className="panel-row">
            <span>Created at</span>
            <span>{shortDate(selected.createdAt)}</span>
          </div>
        </div>
      ) : (
        <div className="panel-block">
          <h3>Summary</h3>
          <div className="panel-row">
            <span>Open tickets</span>
            <span>{summary.calleds ?? '—'}</span>
          </div>
          <div className="panel-row">
            <span>Standards</span>
            <span>{summary.standards ?? '—'}</span>
          </div>
          <div className="panel-row">
            <span>Without a standard</span>
            <span>{summary.gap?.totalWithoutMatch ?? '—'}</span>
          </div>
        </div>
      )}

      {summary.gap && summary.gap.gapsByRoutine.length > 0 && (
        <div className="panel-block">
          <h3>Top gaps</h3>
          {summary.gap.gapsByRoutine.slice(0, 5).map((g, i) => (
            <div className="panel-row" key={i}>
              <span>Routine {g.routineNumber ?? '—'}</span>
              <span>{g.count}</span>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        className="btn-secondary dash-shortcut"
        onClick={onReload}
        disabled={summary.loading}
      >
        {summary.loading ? 'Refreshing...' : '↻ Refresh data'}
      </button>
    </>
  )
}
