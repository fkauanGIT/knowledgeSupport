import { useEffect, useState } from 'react'
import type { DocumentChunk, DocumentMeta, RelatedCalled } from '../api/types'
import { useToggleSet } from '../hooks/useToggleSet'

const iconByType: Record<DocumentMeta['type'], string> = {
  pdf: '📕',
  docx: '📘',
}

export default function DocumentationPanel() {
  const [documents, setDocuments] = useState<DocumentMeta[]>([])
  const [loading, setLoading] = useState(false)
  const [indexing, setIndexing] = useState(false)
  const [error, setError] = useState('')

  const [expanded, toggleExpanded] = useToggleSet()
  const [chunksByDoc, setChunksByDoc] = useState<Record<string, DocumentChunk[]>>({})
  const [loadingChunks, setLoadingChunks] = useState<string | null>(null)

  // Tickets related to each document — computed on registration (automatic)
  // and on demand for already-existing documents ("View resolved tickets").
  const [relatedByDoc, setRelatedByDoc] = useState<Record<string, RelatedCalled[]>>({})
  const [loadingRelated, setLoadingRelated] = useState<string | null>(null)
  const [expandedRelated, toggleExpandedRelated, setExpandedRelated] = useToggleSet()

  const load = async () => {
    setLoading(true)
    setError('')
    const r = await window.backendAPI.listDocuments()
    if (r.ok) setDocuments(r.data)
    else setError(r.error)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const computeRelated = async (docId: string) => {
    setLoadingRelated(docId)
    // The API already has direct Jira access, so it computes this on its own —
    // the frontend only passes the document id.
    const r = await window.backendAPI.relatedCalledsForDocument(docId)
    if (r.ok) setRelatedByDoc((current) => ({ ...current, [docId]: r.data }))
    else setError(r.error)
    setLoadingRelated(null)
  }

  const selectAndIndex = async () => {
    setError('')
    const selection = await window.backendAPI.selectDocFiles()
    if (!selection.ok) {
      setError(selection.error)
      return
    }
    if (selection.data.length === 0) return

    setIndexing(true)
    // Uploads are independent of each other — run in parallel instead of one waiting for another.
    const results = await Promise.all(
      selection.data.map((filePath) => window.backendAPI.uploadDocument(filePath)),
    )
    const newIds = results.filter((r) => r.ok).map((r) => r.data.id)
    const errors = results.filter((r) => !r.ok).map((r) => r.error)
    if (errors.length > 0) setError(errors.join(' · '))

    // On registration, already cross-references open tickets and shows upfront what this
    // document likely resolves, instead of discovering it one by one later.
    setExpandedRelated((current) => {
      const next = new Set(current)
      newIds.forEach((id) => next.add(id))
      return next
    })
    // Reloading the list and computing the related tickets don't depend on each other.
    await Promise.all([load(), ...newIds.map((id) => computeRelated(id))])
    setIndexing(false)
  }

  const remove = async (id: string) => {
    const r = await window.backendAPI.removeDocument(id)
    if (r.ok) setDocuments((docs) => docs.filter((d) => d.id !== id))
    else setError(r.error)
  }

  const toggleChunks = async (id: string) => {
    const wasOpen = expanded.has(id)
    toggleExpanded(id)
    if (!wasOpen && !chunksByDoc[id]) {
      setLoadingChunks(id)
      const r = await window.backendAPI.getDocumentChunks(id)
      if (r.ok) setChunksByDoc((t) => ({ ...t, [id]: r.data }))
      else setError(r.error)
      setLoadingChunks(null)
    }
  }

  const toggleRelated = async (id: string) => {
    const wasOpen = expandedRelated.has(id)
    toggleExpandedRelated(id)
    if (!wasOpen && !relatedByDoc[id]) {
      await computeRelated(id)
    }
  }

  return (
    <div className="documentation">
      <div className="panel-top">
        <p className="panel-intro">
          WinThor manuals and routines indexed in the API, shared with the team — used as a
          reference source when analyzing a ticket.
        </p>
        <button type="button" onClick={load} disabled={loading}>
          {loading ? '...' : '↻ Refresh'}
        </button>
      </div>

      {error && <p className="notice notice-error">{error}</p>}

      <div className="dropzone">
        <strong>Add documentation</strong>
        PDF or DOCX files become a keyword-search source when analyzing tickets
        <div style={{ marginTop: '0.55rem' }}>
          <button type="button" className="btn-secondary" onClick={selectAndIndex} disabled={indexing}>
            {indexing ? 'Indexing...' : 'Select files'}
          </button>
        </div>
      </div>

      {!loading && documents.length === 0 && (
        <p className="panel-empty">No documents indexed yet.</p>
      )}

      <div className="doc-list">
        {documents.map((d) => (
          <div key={d.id} className="doc-card">
            <div className="doc-card-row">
              <div className="doc-icon">{iconByType[d.type]}</div>
              <div className="doc-info">
                <div className="doc-name" title={d.name}>
                  {d.name}
                </div>
                <div className="doc-meta">
                  {d.status === 'indexed'
                    ? `${d.totalChunks} chunks indexed`
                    : (d.error ?? 'failed to index')}
                </div>
              </div>
              <span className={`tag ${d.status === 'indexed' ? 'tag-ok' : 'tag-error'}`}>
                {d.status === 'indexed' ? 'Indexed' : 'Failed'}
              </span>
              {d.status === 'indexed' && (
                <>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => toggleRelated(d.id)}
                  >
                    {expandedRelated.has(d.id) ? '▲ Hide tickets' : '▼ Resolved tickets'}
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => toggleChunks(d.id)}>
                    {expanded.has(d.id) ? '▲ Hide chunks' : '▼ View chunks'}
                  </button>
                </>
              )}
              <button type="button" className="btn-secondary" onClick={() => remove(d.id)}>
                Remove
              </button>
            </div>

            {expandedRelated.has(d.id) && (
              <div className="doc-chunks">
                {loadingRelated === d.id ? (
                  <p className="panel-empty">Cross-referencing with open tickets...</p>
                ) : (relatedByDoc[d.id]?.length ?? 0) === 0 ? (
                  <p className="panel-empty">
                    No open ticket today matches this document's content.
                  </p>
                ) : (
                  relatedByDoc[d.id].map((c) => (
                    <div className="doc-chunk" key={c.key}>
                      <div className="source-header">
                        <span className="source-name">{c.key}</span>
                        <span className="source-relevance">{c.relevance}% relevance</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {expanded.has(d.id) && (
              <div className="doc-chunks">
                {loadingChunks === d.id ? (
                  <p className="panel-empty">Loading chunks...</p>
                ) : (chunksByDoc[d.id]?.length ?? 0) === 0 ? (
                  <p className="panel-empty">
                    No text chunk was extracted — if the file is a scanned (image) PDF, it has
                    no real text to index.
                  </p>
                ) : (
                  chunksByDoc[d.id].map((t, i) => (
                    <div className="doc-chunk" key={i}>
                      {t.page != null && <span className="tag">page {t.page}</span>}
                      <p>{t.text}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
