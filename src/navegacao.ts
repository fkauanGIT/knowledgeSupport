/** Seções da aplicação. Fonte única para a sidebar e o cabeçalho. */
export type Secao = 'home' | 'chamados' | 'padroes' | 'lacunas' | 'config'

export interface ItemNav {
  id: Secao
  titulo: string
  subtitulo: string
}

export const NAV: ItemNav[] = [
  { id: 'home', titulo: 'Home', subtitulo: 'Visão geral da base de conhecimento' },
  { id: 'chamados', titulo: 'Chamados', subtitulo: 'Chamados do Jira, análise e feedback' },
  { id: 'padroes', titulo: 'Padrões', subtitulo: 'Erros conhecidos e suas soluções' },
  { id: 'lacunas', titulo: 'Lacunas', subtitulo: 'Onde falta padrão cadastrado' },
  { id: 'config', titulo: 'Configurações', subtitulo: 'Conexão com a API e token do Jira' },
]
