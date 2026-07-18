import { useCallback, useEffect, useState } from 'react'
import type { GapReportResponse, JiraSettings } from '../api/types'

/**
 * Consolida numa chamada só os números que a Home e o painel direito mostram.
 * Fica num hook porque os dois precisam do mesmo dado — evita cada um buscar por conta.
 */
export interface Resumo {
  chamados: number | null
  padroes: number | null
  gap: GapReportResponse | null
  jira: JiraSettings | null
  erro: string
  carregando: boolean
}

const inicial: Resumo = {
  chamados: null,
  padroes: null,
  gap: null,
  jira: null,
  erro: '',
  carregando: true,
}

export function useResumo() {
  const [resumo, setResumo] = useState<Resumo>(inicial)

  const carregar = useCallback(async () => {
    setResumo((r) => ({ ...r, carregando: true, erro: '' }))

    const [chamados, padroes, gap, jira] = await Promise.all([
      window.backendAPI.listCalleds(),
      window.backendAPI.listStandards(),
      window.backendAPI.gapReport(),
      window.backendAPI.getJiraSettings(),
    ])

    const falha = [chamados, padroes, gap, jira].find((r) => !r.ok)

    setResumo({
      chamados: chamados.ok ? chamados.data.length : null,
      padroes: padroes.ok ? padroes.data.length : null,
      gap: gap.ok ? gap.data : null,
      jira: jira.ok ? jira.data : null,
      erro: falha && !falha.ok ? falha.error : '',
      carregando: false,
    })
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  return { resumo, recarregar: carregar }
}
