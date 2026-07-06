export type Dificuldade = 'BAIXA' | 'MEDIA' | 'ALTA'
export type SimNao = 'SIM' | 'NAO'
export type Documentacao = 'PRIVADO' | 'PUBLICO'
export type Status = 'ABERTO' | 'EM ANDAMENTO' | 'RESOLVIDO'

export interface Chamado {
  id: string
  nomeErro: string
  titulo: string
  descricao: string
  responsavelChamado: string
  filial: number
  categoria: string
  rotinas: number[]
  erroPodeSerAutomatizado: SimNao
  dificuldade: Dificuldade
  documentacao: Documentacao
  tempoResolucao: string
  status: Status
  dataCriacao: string
  dataLimite: string
  sintomas: string[]
  causa: string
  resolucao: string[]
  resultado: string
  tags: string[]
  observacoes: string
}

export type NovoChamado = Omit<Chamado, 'id'>
