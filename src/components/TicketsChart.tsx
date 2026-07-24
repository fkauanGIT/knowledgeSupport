import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { CalledResponse } from '../api/types'

type Granularity = 'DAY' | 'WEEK' | 'MONTH'

const ALL = 'ALL'

// Default window for the period+responsible filter — without this, the responsible dropdown
// would need to fetch the ENTIRE history just to populate itself (the same slowness problem the Home had).
const DEFAULT_WINDOW_DAYS = 90

function toISO(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function bucketKey(date: Date, granularity: Granularity): string {
  const y = date.getFullYear()
  const m = date.getMonth()
  const d = date.getDate()
  if (granularity === 'MONTH') {
    return `${y}-${String(m + 1).padStart(2, '0')}`
  }
  if (granularity === 'WEEK') {
    const start = new Date(y, m, d)
    const weekday = (start.getDay() + 6) % 7 // 0 = Monday
    start.setDate(start.getDate() - weekday)
    return toISO(start)
  }
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function bucketLabel(key: string, granularity: Granularity): string {
  if (granularity === 'MONTH') {
    const [y, m] = key.split('-')
    return `${m}/${y.slice(2)}`
  }
  const d = new Date(`${key}T00:00:00`)
  const label = d.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit' })
  return granularity === 'WEEK' ? `wk. ${label}` : label
}

interface TicketsChartProps {
  title: string
  /** Shows the period/responsible controls. Without it, the chart covers the whole history. */
  filterable?: boolean
}

export default function TicketsChart({ title, filterable = false }: TicketsChartProps) {
  const [calleds, setCalleds] = useState<CalledResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [granularity, setGranularity] = useState<Granularity>('MONTH')

  const [from, setFrom] = useState(() =>
    filterable ? toISO(new Date(Date.now() - DEFAULT_WINDOW_DAYS * 24 * 60 * 60 * 1000)) : '',
  )
  const [to, setTo] = useState(() => (filterable ? toISO(new Date()) : ''))
  const [assignee, setAssignee] = useState(ALL)

  const availableAssignees = useMemo(
    () =>
      Array.from(new Set(calleds.map((c) => c.assigneeName).filter((s): s is string => !!s))).sort(),
    [calleds],
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const r = await window.backendAPI.listCalleds({
      createdFrom: from || undefined,
      createdTo: to || undefined,
      assignee: assignee === ALL ? undefined : assignee,
    })
    if (r.ok) setCalleds(r.data)
    else setError(r.error)
    setLoading(false)
  }, [from, to, assignee])

  useEffect(() => {
    load()
  }, [load])

  // "Created" counts by creation date; "Resolved" by resolution date (Jira's resolutiondate) —
  // both come from the same already-fetched batch, no extra API call.
  const data = useMemo(() => {
    const buckets = new Map<string, { Created: number; Resolved: number }>()
    const add = (key: string, field: 'Created' | 'Resolved') => {
      const current = buckets.get(key) ?? { Created: 0, Resolved: 0 }
      current[field] += 1
      buckets.set(key, current)
    }
    for (const c of calleds) {
      add(bucketKey(new Date(c.createdAt), granularity), 'Created')
      if (c.resolvedAt) {
        add(bucketKey(new Date(c.resolvedAt), granularity), 'Resolved')
      }
    }
    return Array.from(buckets.entries())
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([key, values]) => ({ period: bucketLabel(key, granularity), ...values }))
  }, [calleds, granularity])

  return (
    <div className="dash-card dash-chart">
      <div className="dash-card-top">
        <h3>{title}</h3>
        <select
          value={granularity}
          onChange={(e) => setGranularity(e.target.value as Granularity)}
          aria-label="Granularity"
        >
          <option value="DAY">Daily</option>
          <option value="WEEK">Weekly</option>
          <option value="MONTH">Monthly</option>
        </select>
      </div>

      {filterable && (
        <div className="chart-filters">
          <label>
            From
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label>
            To
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
          <select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
            <option value={ALL}>Assignee: all</option>
            {availableAssignees.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && <p className="notice notice-error">{error}</p>}

      {!loading && !error && data.length === 0 && (
        <p className="panel-empty">No ticket found for this period.</p>
      )}

      {data.length > 0 && (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} barGap={4} barCategoryGap="20%">
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="period"
              stroke="var(--border-strong)"
              tick={{ fill: 'var(--txt-3)', fontSize: 12 }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              stroke="var(--border-strong)"
              tick={{ fill: 'var(--txt-3)', fontSize: 12 }}
              tickLine={false}
              width={32}
            />
            <Tooltip
              cursor={{ fill: 'var(--bg-hover)' }}
              contentStyle={{
                background: 'var(--bg-2)',
                border: '1px solid var(--border-strong)',
                borderRadius: 'var(--r-sm)',
                color: 'var(--txt)',
              }}
              labelStyle={{ color: 'var(--txt-2)' }}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: 'var(--txt-2)' }} />
            <Bar dataKey="Created" fill="var(--series-created)" radius={[4, 4, 0, 0]} maxBarSize={28} />
            <Bar dataKey="Resolved" fill="var(--series-resolved)" radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
