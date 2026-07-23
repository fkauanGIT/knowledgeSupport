import { useEffect, useState } from 'react'
import type { ChamadoRelacionado, DocumentoMeta, TrechoDocumento } from '../api/types'
import { useConjuntoAlternavel } from '../hooks/useConjuntoAlternavel'

const iconePorTipo: Record<DocumentoMeta['tipo'], string> = {
  pdf: '📕',
  docx: '📘',
}

export default function DocumentacaoPanel() {
  const [documentos, setDocumentos] = useState<DocumentoMeta[]>([])
  const [carregando, setCarregando] = useState(false)
  const [indexando, setIndexando] = useState(false)
  const [erro, setErro] = useState('')

  const [expandidos, alternarExpandido] = useConjuntoAlternavel()
  const [trechosPorDoc, setTrechosPorDoc] = useState<Record<string, TrechoDocumento[]>>({})
  const [carregandoTrechos, setCarregandoTrechos] = useState<string | null>(null)

  // Chamados relacionados a cada documento — calculado ao cadastrar (automático)
  // e sob demanda pra documentos já existentes ("Ver chamados atendidos").
  const [relacionadosPorDoc, setRelacionadosPorDoc] = useState<Record<string, ChamadoRelacionado[]>>({})
  const [carregandoRelacionados, setCarregandoRelacionados] = useState<string | null>(null)
  const [expandidosRelacionados, alternarExpandidoRelacionados, setExpandidosRelacionados] =
    useConjuntoAlternavel()

  const carregar = async () => {
    setCarregando(true)
    setErro('')
    const r = await window.backendAPI.listarDocumentos()
    if (r.ok) setDocumentos(r.data)
    else setErro(r.error)
    setCarregando(false)
  }

  useEffect(() => {
    carregar()
  }, [])

  const calcularRelacionados = async (docId: string) => {
    setCarregandoRelacionados(docId)
    // A API já tem acesso direto ao Jira, então calcula isso sozinha —
    // o front só passa o id do documento.
    const r = await window.backendAPI.chamadosRelacionadosDocumento(docId)
    if (r.ok) setRelacionadosPorDoc((atual) => ({ ...atual, [docId]: r.data }))
    else setErro(r.error)
    setCarregandoRelacionados(null)
  }

  const selecionarEIndexar = async () => {
    setErro('')
    const selecao = await window.backendAPI.selecionarArquivosDoc()
    if (!selecao.ok) {
      setErro(selecao.error)
      return
    }
    if (selecao.data.length === 0) return

    setIndexando(true)
    // Uploads são independentes entre si — rodam em paralelo em vez de um esperar o outro.
    const resultados = await Promise.all(
      selecao.data.map((caminho) => window.backendAPI.uploadDocumento(caminho)),
    )
    const idsNovos = resultados.filter((r) => r.ok).map((r) => r.data.id)
    const erros = resultados.filter((r) => !r.ok).map((r) => r.error)
    if (erros.length > 0) setErro(erros.join(' · '))

    // Ao cadastrar, já cruza com os chamados abertos e mostra de cara o que esse
    // documento provavelmente atende, em vez de descobrir isso um por um depois.
    setExpandidosRelacionados((atual) => {
      const proximo = new Set(atual)
      idsNovos.forEach((id) => proximo.add(id))
      return proximo
    })
    // Recarregar a lista e calcular os relacionados não dependem um do outro.
    await Promise.all([carregar(), ...idsNovos.map((id) => calcularRelacionados(id))])
    setIndexando(false)
  }

  const remover = async (id: string) => {
    const r = await window.backendAPI.removerDocumento(id)
    if (r.ok) setDocumentos((docs) => docs.filter((d) => d.id !== id))
    else setErro(r.error)
  }

  const alternarTrechos = async (id: string) => {
    const jaAberto = expandidos.has(id)
    alternarExpandido(id)
    if (!jaAberto && !trechosPorDoc[id]) {
      setCarregandoTrechos(id)
      const r = await window.backendAPI.obterTrechosDocumento(id)
      if (r.ok) setTrechosPorDoc((t) => ({ ...t, [id]: r.data }))
      else setErro(r.error)
      setCarregandoTrechos(null)
    }
  }

  const alternarRelacionados = async (id: string) => {
    const jaAberto = expandidosRelacionados.has(id)
    alternarExpandidoRelacionados(id)
    if (!jaAberto && !relacionadosPorDoc[id]) {
      await calcularRelacionados(id)
    }
  }

  return (
    <div className="documentacao">
      <div className="painel-topo">
        <p className="painel-intro">
          Manuais e rotinas do WinThor indexados na API, compartilhados com o time — usados como
          fonte de apoio ao analisar um chamado.
        </p>
        <button type="button" onClick={carregar} disabled={carregando}>
          {carregando ? '...' : '↻ Atualizar'}
        </button>
      </div>

      {erro && <p className="aviso aviso-erro">{erro}</p>}

      <div className="dropzone">
        <strong>Adicionar documentação</strong>
        arquivos PDF ou DOCX viram fonte de busca por palavra-chave na análise de chamados
        <div style={{ marginTop: '0.55rem' }}>
          <button type="button" className="btn-secundario" onClick={selecionarEIndexar} disabled={indexando}>
            {indexando ? 'Indexando...' : 'Selecionar arquivos'}
          </button>
        </div>
      </div>

      {!carregando && documentos.length === 0 && (
        <p className="painel-vazio">Nenhum documento indexado ainda.</p>
      )}

      <div className="doc-lista">
        {documentos.map((d) => (
          <div key={d.id} className="doc-card">
            <div className="doc-card-linha">
              <div className="doc-icone">{iconePorTipo[d.tipo]}</div>
              <div className="doc-info">
                <div className="doc-nome" title={d.nome}>
                  {d.nome}
                </div>
                <div className="doc-meta">
                  {d.status === 'indexado'
                    ? `${d.totalTrechos} trechos indexados`
                    : (d.erro ?? 'falha ao indexar')}
                </div>
              </div>
              <span className={`tag ${d.status === 'indexado' ? 'tag-ok' : 'tag-erro'}`}>
                {d.status === 'indexado' ? 'Indexado' : 'Falhou'}
              </span>
              {d.status === 'indexado' && (
                <>
                  <button
                    type="button"
                    className="btn-secundario"
                    onClick={() => alternarRelacionados(d.id)}
                  >
                    {expandidosRelacionados.has(d.id) ? '▲ Ocultar chamados' : '▼ Chamados atendidos'}
                  </button>
                  <button type="button" className="btn-secundario" onClick={() => alternarTrechos(d.id)}>
                    {expandidos.has(d.id) ? '▲ Ocultar trechos' : '▼ Ver trechos'}
                  </button>
                </>
              )}
              <button type="button" className="btn-secundario" onClick={() => remover(d.id)}>
                Remover
              </button>
            </div>

            {expandidosRelacionados.has(d.id) && (
              <div className="doc-trechos">
                {carregandoRelacionados === d.id ? (
                  <p className="painel-vazio">Cruzando com os chamados abertos...</p>
                ) : (relacionadosPorDoc[d.id]?.length ?? 0) === 0 ? (
                  <p className="painel-vazio">
                    Nenhum chamado aberto hoje bate com o conteúdo deste documento.
                  </p>
                ) : (
                  relacionadosPorDoc[d.id].map((c) => (
                    <div className="doc-trecho" key={c.chave}>
                      <div className="fonte-cab">
                        <span className="fonte-nome">{c.chave}</span>
                        <span className="fonte-rel">{c.relevancia}% relevância</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {expandidos.has(d.id) && (
              <div className="doc-trechos">
                {carregandoTrechos === d.id ? (
                  <p className="painel-vazio">Carregando trechos...</p>
                ) : (trechosPorDoc[d.id]?.length ?? 0) === 0 ? (
                  <p className="painel-vazio">
                    Nenhum trecho de texto foi extraído — se o arquivo é um PDF escaneado (imagem),
                    ele não tem texto real para indexar.
                  </p>
                ) : (
                  trechosPorDoc[d.id].map((t, i) => (
                    <div className="doc-trecho" key={i}>
                      {t.pagina != null && <span className="tag">pág. {t.pagina}</span>}
                      <p>{t.texto}</p>
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
