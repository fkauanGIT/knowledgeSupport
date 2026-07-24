import { useCallback, useEffect, useState } from 'react'
import type { GapReportResponse, JiraSettings } from '../api/types'

/**
 * Consolidates into a single call the numbers the Home and the right panel show.
 * Lives in a hook because both need the same data — avoids each one fetching on its own.
 */
export interface Summary {
  calleds: number | null
  standards: number | null
  gap: GapReportResponse | null
  jira: JiraSettings | null
  error: string
  loading: boolean
}

const initial: Summary = {
  calleds: null,
  standards: null,
  gap: null,
  jira: null,
  error: '',
  loading: true,
}

export function useSummary() {
  const [summary, setSummary] = useState<Summary>(initial)

  const load = useCallback(async () => {
    setSummary((s) => ({ ...s, loading: true, error: '' }))

    const [calleds, standards, gap, jira] = await Promise.all([
      window.backendAPI.listCalleds({ onlyOpen: true }),
      window.backendAPI.listStandards(),
      window.backendAPI.gapReport(),
      window.backendAPI.getJiraSettings(),
    ])

    const failure = [calleds, standards, gap, jira].find((r) => !r.ok)

    setSummary({
      calleds: calleds.ok ? calleds.data.length : null,
      standards: standards.ok ? standards.data.length : null,
      gap: gap.ok ? gap.data : null,
      jira: jira.ok ? jira.data : null,
      error: failure && !failure.ok ? failure.error : '',
      loading: false,
    })
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { summary, reload: load }
}
