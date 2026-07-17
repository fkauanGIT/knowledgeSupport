import { useEffect, useState, FormEvent } from 'react'
import type {
  IncidentType,
  InvestigationStep,
  StandardAccuracyResponse,
  StandardResponse,
} from '../api/types'

const stepVazio: InvestigationStep = {
  hypothesis: '',
  query: '',
  verification: '',
  confirmed: false,
}

interface FormPadrao {
  standardName: string
  text: string
  result: string
  incidentType: IncidentType
  routineNumber: string
  investigationSteps: InvestigationStep[]
}

const formVazio: FormPadrao = {
  standardName: '',
  text: '',
  result: '',
  incidentType: 'ERROR',
  routineNumber: '',
  investigationSteps: [],
}

export default function PadroesPanel() {
  const [padroes, setPadroes] = useState<StandardResponse[]>([])
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [form, setForm] = useState<FormPadrao>(formVazio)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [acuracia, setAcuracia] = useState<Record<string, StandardAccuracyResponse>>({})

  const carregar = async () => {
    setCarregando(true)
    setErro('')
    const r = await window.backendAPI.listStandards()
    if (r.ok) setPadroes(r.data)
    else setErro(r.error)
    setCarregando(false)
  }

  useEffect(() => {
    carregar()
  }, [])

  const resetForm = () => {
    setForm(formVazio)
    setEditandoId(null)
  }

  const editar = (p: StandardResponse) => {
    setEditandoId(p.id)
    setForm({
      standardName: p.standardName,
      text: p.text,
      result: p.result,
      incidentType: p.incidentType,
      routineNumber: p.routineNumber != null ? String(p.routineNumber) : '',
      investigationSteps: p.investigationSteps ?? [],
    })
  }

  const salvar = async (e: FormEvent) => {
    e.preventDefault()
    setSalvando(true)
    setErro('')
    const body = {
      standardName: form.standardName,
      text: form.text,
      result: form.result,
      incidentType: form.incidentType,
      routineNumber: form.routineNumber.trim() ? Number(form.routineNumber) : null,
      investigationSteps: form.investigationSteps,
    }
    const r = editandoId
      ? await window.backendAPI.updateStandard(editandoId, body)
      : await window.backendAPI.createStandard(body)
    if (r.ok) {
      resetForm()
      await carregar()
    } else {
      setErro(r.error)
    }
    setSalvando(false)
  }

  const excluir = async (id: string) => {
    const r = await window.backendAPI.deleteStandard(id)
    if (r.ok) {
      if (editandoId === id) resetForm()
      await carregar()
    } else setErro(r.error)
  }

  const verAcuracia = async (id: string) => {
    const r = await window.backendAPI.standardAccuracy(id)
    if (r.ok) setAcuracia((a) => ({ ...a, [id]: r.data }))
    else setErro(r.error)
  }

  const setStep = (i: number, campo: keyof InvestigationStep, valor: string | boolean) => {
    setForm((f) => ({
      ...f,
      investigationSteps: f.investigationSteps.map((s, idx) =>
        idx === i ? { ...s, [campo]: valor } : s,
      ),
    }))
  }

  return (
    <div className="padroes">
      <form className="config-secao" onSubmit={salvar}>
        <h2>{editandoId ? 'Editar padrão' : 'Novo padrão'}</h2>
        <label>
          Nome *
          <input
            required
            value={form.standardName}
            onChange={(e) => setForm((f) => ({ ...f, standardName: e.target.value }))}
          />
        </label>
        <label>
          Erro/sintoma
          <textarea
            rows={2}
            value={form.text}
            onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
          />
        </label>
        <label>
          Solução
          <textarea
            rows={2}
            value={form.result}
            onChange={(e) => setForm((f) => ({ ...f, result: e.target.value }))}
          />
        </label>
        <div className="linha">
          <label>
            Tipo
            <select
              value={form.incidentType}
              onChange={(e) =>
                setForm((f) => ({ ...f, incidentType: e.target.value as IncidentType }))
              }
            >
              <option value="ERROR">ERROR</option>
              <option value="ALERT">ALERT</option>
            </select>
          </label>
          <label>
            Rotina
            <input
              type="number"
              value={form.routineNumber}
              onChange={(e) => setForm((f) => ({ ...f, routineNumber: e.target.value }))}
            />
          </label>
        </div>

        <div className="steps">
          <div className="steps-header">
            <strong>Passos de investigação</strong>
            <button
              type="button"
              className="btn-secundario"
              onClick={() =>
                setForm((f) => ({ ...f, investigationSteps: [...f.investigationSteps, { ...stepVazio }] }))
              }
            >
              + passo
            </button>
          </div>
          {form.investigationSteps.map((s, i) => (
            <div key={i} className="step-item">
              <input
                placeholder="Hipótese"
                value={s.hypothesis}
                onChange={(e) => setStep(i, 'hypothesis', e.target.value)}
              />
              <input
                placeholder="Consulta"
                value={s.query}
                onChange={(e) => setStep(i, 'query', e.target.value)}
              />
              <input
                placeholder="Verificação"
                value={s.verification}
                onChange={(e) => setStep(i, 'verification', e.target.value)}
              />
              <label className="step-check">
                <input
                  type="checkbox"
                  checked={s.confirmed}
                  onChange={(e) => setStep(i, 'confirmed', e.target.checked)}
                />
                confirmado
              </label>
              <button
                type="button"
                className="btn-secundario"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    investigationSteps: f.investigationSteps.filter((_, idx) => idx !== i),
                  }))
                }
              >
                remover
              </button>
            </div>
          ))}
        </div>

        <div className="form-acoes">
          <button type="submit" disabled={salvando}>
            {salvando ? 'Salvando...' : editandoId ? 'Salvar alterações' : 'Criar padrão'}
          </button>
          {editandoId && (
            <button type="button" className="btn-secundario" onClick={resetForm}>
              Cancelar
            </button>
          )}
        </div>
        {erro && <p className="aviso aviso-erro">{erro}</p>}
      </form>

      <div className="painel-topo">
        <h2>Padrões cadastrados</h2>
        <button type="button" onClick={carregar} disabled={carregando}>
          {carregando ? '...' : '↻'}
        </button>
      </div>

      {padroes.length === 0 && !carregando && (
        <p className="painel-vazio">Nenhum padrão cadastrado.</p>
      )}

      <div className="lista-cards">
        {padroes.map((p) => (
          <div key={p.id} className="item-card">
            <div className="item-card-header">
              <strong>{p.standardName}</strong>
              {p.routineNumber != null && <span className="tag">Rotina {p.routineNumber}</span>}
            </div>
            {p.result && <p className="item-card-titulo">{p.result}</p>}
            {acuracia[p.id] && (
              <p className="config-status">
                Acurácia: {(acuracia[p.id].accuracyRate * 100).toFixed(0)}% (
                {acuracia[p.id].resolvedCount}/{acuracia[p.id].totalFeedbacks})
              </p>
            )}
            <div className="item-card-acoes">
              <button type="button" onClick={() => editar(p)}>
                Editar
              </button>
              <button type="button" onClick={() => verAcuracia(p.id)}>
                Acurácia
              </button>
              <button type="button" className="btn-perigo" onClick={() => excluir(p.id)}>
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
