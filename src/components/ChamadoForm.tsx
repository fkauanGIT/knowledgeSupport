import { useState, FormEvent } from 'react'
import type { Chamado, Dificuldade, Documentacao, SimNao, Status } from '../types/chamado'

interface FormState {
  nomeErro: string
  titulo: string
  descricao: string
  responsavelChamado: string
  filial: string
  categoria: string
  rotinas: string
  erroPodeSerAutomatizado: SimNao
  dificuldade: Dificuldade
  documentacao: Documentacao
  tempoResolucao: string
  status: Status
  dataCriacao: string
  dataLimite: string
  sintomas: string
  causa: string
  resolucao: string
  resultado: string
  tags: string
  observacoes: string
}

const estadoInicial: FormState = {
  nomeErro: '',
  titulo: '',
  descricao: '',
  responsavelChamado: '',
  filial: '',
  categoria: '',
  rotinas: '',
  erroPodeSerAutomatizado: 'NAO',
  dificuldade: 'BAIXA',
  documentacao: 'PRIVADO',
  tempoResolucao: '< 10 MIN',
  status: 'RESOLVIDO',
  dataCriacao: '',
  dataLimite: '',
  sintomas: '',
  causa: '',
  resolucao: '',
  resultado: '',
  tags: '',
  observacoes: '',
}

const linhasParaLista = (valor: string) =>
  valor.split('\n').map((linha) => linha.trim()).filter(Boolean)

const numerosParaLista = (valor: string) =>
  valor.split(',').map((n) => Number(n.trim())).filter((n) => !Number.isNaN(n))

interface ChamadoFormProps {
  onSalvo: (chamado: Chamado) => void
}

export default function ChamadoForm({ onSalvo }: ChamadoFormProps) {
  const [form, setForm] = useState<FormState>(estadoInicial)
  const [salvando, setSalvando] = useState(false)

  const atualizarCampo = <K extends keyof FormState>(campo: K, valor: FormState[K]) => {
    setForm((atual) => ({ ...atual, [campo]: valor }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSalvando(true)
    try {
      const chamado = await window.chamadosAPI.add({
        nomeErro: form.nomeErro,
        titulo: form.titulo,
        descricao: form.descricao,
        responsavelChamado: form.responsavelChamado,
        filial: Number(form.filial) || 0,
        categoria: form.categoria,
        rotinas: numerosParaLista(form.rotinas),
        erroPodeSerAutomatizado: form.erroPodeSerAutomatizado,
        dificuldade: form.dificuldade,
        documentacao: form.documentacao,
        tempoResolucao: form.tempoResolucao,
        status: form.status,
        dataCriacao: form.dataCriacao,
        dataLimite: form.dataLimite,
        sintomas: linhasParaLista(form.sintomas),
        causa: form.causa,
        resolucao: linhasParaLista(form.resolucao),
        resultado: form.resultado,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        observacoes: form.observacoes,
      })
      onSalvo(chamado)
      setForm(estadoInicial)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form className="chamado-form" onSubmit={handleSubmit}>
      <h2>Novo chamado</h2>

      <label>
        Título *
        <input
          required
          value={form.titulo}
          onChange={(e) => atualizarCampo('titulo', e.target.value)}
        />
      </label>

      <label>
        Descrição
        <textarea
          rows={2}
          value={form.descricao}
          onChange={(e) => atualizarCampo('descricao', e.target.value)}
        />
      </label>

      <div className="linha">
        <label>
          Responsável pelo chamado
          <input
            value={form.responsavelChamado}
            onChange={(e) => atualizarCampo('responsavelChamado', e.target.value)}
          />
        </label>

        <label>
          Filial
          <input
            type="number"
            value={form.filial}
            onChange={(e) => atualizarCampo('filial', e.target.value)}
          />
        </label>
      </div>

      <div className="linha">
        <label>
          Categoria
          <input
            list="categorias"
            value={form.categoria}
            onChange={(e) => atualizarCampo('categoria', e.target.value)}
          />
          <datalist id="categorias">
            <option value="Permissões" />
            <option value="Caixa" />
          </datalist>
        </label>

        <label>
          Rotinas (separadas por vírgula)
          <input
            placeholder="530, 4136"
            value={form.rotinas}
            onChange={(e) => atualizarCampo('rotinas', e.target.value)}
          />
        </label>
      </div>

      <label>
        Nome do erro
        <input
          value={form.nomeErro}
          onChange={(e) => atualizarCampo('nomeErro', e.target.value)}
        />
      </label>

      <div className="linha">
        <label>
          Pode ser automatizado?
          <select
            value={form.erroPodeSerAutomatizado}
            onChange={(e) => atualizarCampo('erroPodeSerAutomatizado', e.target.value as SimNao)}
          >
            <option value="NAO">NÃO</option>
            <option value="SIM">SIM</option>
          </select>
        </label>

        <label>
          Dificuldade
          <select
            value={form.dificuldade}
            onChange={(e) => atualizarCampo('dificuldade', e.target.value as Dificuldade)}
          >
            <option value="BAIXA">BAIXA</option>
            <option value="MEDIA">MÉDIA</option>
            <option value="ALTA">ALTA</option>
          </select>
        </label>

        <label>
          Documentação
          <select
            value={form.documentacao}
            onChange={(e) => atualizarCampo('documentacao', e.target.value as Documentacao)}
          >
            <option value="PRIVADO">PRIVADO</option>
            <option value="PUBLICO">PÚBLICO</option>
          </select>
        </label>
      </div>

      <div className="linha">
        <label>
          Tempo de resolução
          <input
            list="tempos"
            value={form.tempoResolucao}
            onChange={(e) => atualizarCampo('tempoResolucao', e.target.value)}
          />
          <datalist id="tempos">
            <option value="< 10 MIN" />
            <option value="10-30 MIN" />
            <option value="30-60 MIN" />
            <option value="> 1 HORA" />
          </datalist>
        </label>

        <label>
          Status
          <select
            value={form.status}
            onChange={(e) => atualizarCampo('status', e.target.value as Status)}
          >
            <option value="ABERTO">ABERTO</option>
            <option value="EM ANDAMENTO">EM ANDAMENTO</option>
            <option value="RESOLVIDO">RESOLVIDO</option>
          </select>
        </label>
      </div>

      <div className="linha">
        <label>
          Data de criação
          <input
            type="datetime-local"
            value={form.dataCriacao}
            onChange={(e) => atualizarCampo('dataCriacao', e.target.value)}
          />
        </label>

        <label>
          Data limite
          <input
            type="datetime-local"
            value={form.dataLimite}
            onChange={(e) => atualizarCampo('dataLimite', e.target.value)}
          />
        </label>
      </div>

      <label>
        Sintomas (um por linha)
        <textarea
          rows={2}
          value={form.sintomas}
          onChange={(e) => atualizarCampo('sintomas', e.target.value)}
        />
      </label>

      <label>
        Causa
        <textarea
          rows={2}
          value={form.causa}
          onChange={(e) => atualizarCampo('causa', e.target.value)}
        />
      </label>

      <label>
        Resolução (um passo por linha)
        <textarea
          rows={3}
          value={form.resolucao}
          onChange={(e) => atualizarCampo('resolucao', e.target.value)}
        />
      </label>

      <label>
        Resultado
        <textarea
          rows={2}
          value={form.resultado}
          onChange={(e) => atualizarCampo('resultado', e.target.value)}
        />
      </label>

      <label>
        Tags (separadas por vírgula)
        <input
          value={form.tags}
          onChange={(e) => atualizarCampo('tags', e.target.value)}
        />
      </label>

      <label>
        Observações
        <textarea
          rows={2}
          value={form.observacoes}
          onChange={(e) => atualizarCampo('observacoes', e.target.value)}
        />
      </label>

      <button type="submit" disabled={salvando}>
        {salvando ? 'Salvando...' : 'Salvar chamado'}
      </button>
    </form>
  )
}
