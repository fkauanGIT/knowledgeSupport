import { useEffect, useState } from 'react'
import type { GapReportResponse } from '../api/types'

export default function GapsPanel() {
  const [report, setReport] = useState<GapReportResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    const r = await window.backendAPI.gapReport()
    if (r.ok) setReport(r.data)
    else setError(r.error)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="gaps">
      <div className="panel-top">
        <p className="panel-intro">Where registering a new standard covers the most tickets.</p>
        <button type="button" onClick={load} disabled={loading}>
          {loading ? '...' : '↻ Refresh'}
        </button>
      </div>

      {error && <p className="notice notice-error">{error}</p>}

      {report && (
        <>
          <div className="gaps-summary">
            <div>
              <strong>{report.totalCalledsAnalyzed}</strong>
              <span>analyzed</span>
            </div>
            <div>
              <strong>{report.totalWithoutMatch}</strong>
              <span>without a standard</span>
            </div>
          </div>

          {report.gapsByRoutine.length === 0 ? (
            <p className="panel-empty">No gaps — every ticket matched a standard.</p>
          ) : (
            <table className="ticket-list">
              <thead>
                <tr>
                  <th>Routine</th>
                  <th>Tickets without a standard</th>
                </tr>
              </thead>
              <tbody>
                {report.gapsByRoutine.map((g, i) => (
                  <tr key={i}>
                    <td>{g.routineNumber ?? '—'}</td>
                    <td>{g.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  )
}
