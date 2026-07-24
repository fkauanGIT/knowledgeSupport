import { useEffect, useState, FormEvent } from 'react'
import type {
  IncidentType,
  InvestigationStep,
  StandardAccuracyResponse,
  StandardResponse,
} from '../api/types'

const emptyStep: InvestigationStep = {
  hypothesis: '',
  query: '',
  verification: '',
  confirmed: false,
}

interface StandardForm {
  standardName: string
  text: string
  result: string
  incidentType: IncidentType
  routineNumber: string
  investigationSteps: InvestigationStep[]
}

const emptyForm: StandardForm = {
  standardName: '',
  text: '',
  result: '',
  incidentType: 'ERROR',
  routineNumber: '',
  investigationSteps: [],
}

interface StandardsPanelProps {
  /** Tells the app the base changed, to refresh the summary. */
  onChange?: () => void
}

export default function StandardsPanel({ onChange }: StandardsPanelProps = {}) {
  const [standards, setStandards] = useState<StandardResponse[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<StandardForm>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [accuracy, setAccuracy] = useState<Record<string, StandardAccuracyResponse>>({})

  const load = async () => {
    setLoading(true)
    setError('')
    const r = await window.backendAPI.listStandards()
    if (r.ok) setStandards(r.data)
    else setError(r.error)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
  }

  const edit = (p: StandardResponse) => {
    setEditingId(p.id)
    setForm({
      standardName: p.standardName,
      text: p.text,
      result: p.result,
      incidentType: p.incidentType,
      routineNumber: p.routineNumber != null ? String(p.routineNumber) : '',
      investigationSteps: p.investigationSteps ?? [],
    })
  }

  const save = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    const body = {
      standardName: form.standardName,
      text: form.text,
      result: form.result,
      incidentType: form.incidentType,
      routineNumber: form.routineNumber.trim() ? Number(form.routineNumber) : null,
      investigationSteps: form.investigationSteps,
    }
    const r = editingId
      ? await window.backendAPI.updateStandard(editingId, body)
      : await window.backendAPI.createStandard(body)
    if (r.ok) {
      resetForm()
      await load()
      onChange?.()
    } else {
      setError(r.error)
    }
    setSaving(false)
  }

  const remove = async (id: string) => {
    const r = await window.backendAPI.deleteStandard(id)
    if (r.ok) {
      if (editingId === id) resetForm()
      await load()
      onChange?.()
    } else setError(r.error)
  }

  const viewAccuracy = async (id: string) => {
    const r = await window.backendAPI.standardAccuracy(id)
    if (r.ok) setAccuracy((a) => ({ ...a, [id]: r.data }))
    else setError(r.error)
  }

  const setStep = (i: number, field: keyof InvestigationStep, value: string | boolean) => {
    setForm((f) => ({
      ...f,
      investigationSteps: f.investigationSteps.map((s, idx) =>
        idx === i ? { ...s, [field]: value } : s,
      ),
    }))
  }

  return (
    <div className="standards">
      <form className="config-section" onSubmit={save}>
        <h2>{editingId ? 'Edit standard' : 'New standard'}</h2>
        <label>
          Name *
          <input
            required
            value={form.standardName}
            onChange={(e) => setForm((f) => ({ ...f, standardName: e.target.value }))}
          />
        </label>
        <label>
          Error/symptom
          <textarea
            rows={2}
            value={form.text}
            onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
          />
        </label>
        <label>
          Solution
          <textarea
            rows={2}
            value={form.result}
            onChange={(e) => setForm((f) => ({ ...f, result: e.target.value }))}
          />
        </label>
        <div className="row">
          <label>
            Type
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
            Routine
            <input
              type="number"
              value={form.routineNumber}
              onChange={(e) => setForm((f) => ({ ...f, routineNumber: e.target.value }))}
            />
          </label>
        </div>

        <div className="steps">
          <div className="steps-header">
            <strong>Investigation steps</strong>
            <button
              type="button"
              className="btn-secondary"
              onClick={() =>
                setForm((f) => ({ ...f, investigationSteps: [...f.investigationSteps, { ...emptyStep }] }))
              }
            >
              + step
            </button>
          </div>
          {form.investigationSteps.map((s, i) => (
            <div key={i} className="step-item">
              <input
                placeholder="Hypothesis"
                value={s.hypothesis}
                onChange={(e) => setStep(i, 'hypothesis', e.target.value)}
              />
              <input
                placeholder="Query"
                value={s.query}
                onChange={(e) => setStep(i, 'query', e.target.value)}
              />
              <input
                placeholder="Verification"
                value={s.verification}
                onChange={(e) => setStep(i, 'verification', e.target.value)}
              />
              <label className="step-check">
                <input
                  type="checkbox"
                  checked={s.confirmed}
                  onChange={(e) => setStep(i, 'confirmed', e.target.checked)}
                />
                confirmed
              </label>
              <button
                type="button"
                className="btn-secondary"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    investigationSteps: f.investigationSteps.filter((_, idx) => idx !== i),
                  }))
                }
              >
                remove
              </button>
            </div>
          ))}
        </div>

        <div className="form-actions">
          <button type="submit" disabled={saving}>
            {saving ? 'Saving...' : editingId ? 'Save changes' : 'Create standard'}
          </button>
          {editingId && (
            <button type="button" className="btn-secondary" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
        {error && <p className="notice notice-error">{error}</p>}
      </form>

      <div className="panel-top">
        <h2>Registered standards</h2>
        <button type="button" onClick={load} disabled={loading}>
          {loading ? '...' : '↻'}
        </button>
      </div>

      {standards.length === 0 && !loading && (
        <p className="panel-empty">No standard registered.</p>
      )}

      <div className="card-list">
        {standards.map((p) => (
          <div key={p.id} className="item-card">
            <div className="item-card-header">
              <strong>{p.standardName}</strong>
              {p.routineNumber != null && <span className="tag">Routine {p.routineNumber}</span>}
            </div>
            {p.result && <p className="item-card-title">{p.result}</p>}
            {accuracy[p.id] && (
              <p className="config-status">
                Accuracy: {(accuracy[p.id].accuracyRate * 100).toFixed(0)}% (
                {accuracy[p.id].resolvedCount}/{accuracy[p.id].totalFeedbacks})
              </p>
            )}
            <div className="item-card-actions">
              <button type="button" onClick={() => edit(p)}>
                Edit
              </button>
              <button type="button" onClick={() => viewAccuracy(p.id)}>
                Accuracy
              </button>
              <button type="button" className="btn-danger" onClick={() => remove(p.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
