import { useEffect, useMemo, useState } from 'react'
import type { Chamado } from '../types/chamado'

interface OlhoDeDeusProps {
  chamados: Chamado[]
  onAtualizarChamado: (chamado: Chamado) => void
}

const normalizar = (valor: string) =>
  valor
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()

const formatarMensagem = (chamado: Chamado) => {
  const linhas = [
    'Olá! Esse erro já aconteceu antes e já tem solução registrada 🙂',
    '',
    `Erro: ${chamado.nomeErro || chamado.titulo}`,
    chamado.causa ? `Causa: ${chamado.causa}` : null,
    chamado.resolucao.length > 0
      ? `Como resolver:\n${chamado.resolucao.map((passo, i) => `${i + 1}. ${passo}`).join('\n')}`
      : null,
    chamado.resultado ? `Resultado esperado: ${chamado.resultado}` : null,
    chamado.documentoLink ? `📎 Documentação: ${chamado.documentoLink}` : null,
  ].filter(Boolean)

  return linhas.join('\n')
}

export default function OlhoDeDeus({ chamados, onAtualizarChamado }: OlhoDeDeusProps) {
  const [erro, setErro] = useState('')
  const [rotina, setRotina] = useState('')
  const [copiadoId, setCopiadoId] = useState<string | null>(null)
  const [linkRascunho, setLinkRascunho] = useState<Record<string, string>>({})
  const [arquivosPasso, setArquivosPasso] = useState<string[]>([])

  const erroBusca = normalizar(erro)
  const rotinaBusca = rotina.trim() ? Number(rotina.trim()) : null

  const buscou = erroBusca.length > 0 || rotinaBusca !== null

  useEffect(() => {
    const consulta = [erro, rotina].filter((valor) => valor.trim()).join(' ')
    if (!consulta.trim()) {
      setArquivosPasso([])
      return
    }
    let ativo = true
    window.passoAPassoAPI.buscar(consulta).then((arquivos) => {
      if (ativo) setArquivosPasso(arquivos)
    })
    return () => {
      ativo = false
    }
  }, [erro, rotina])

  const resultados = useMemo(() => {
    if (!buscou) return []
    return chamados.filter((chamado) => {
      if (chamado.documentacao !== 'PUBLICO') return false

      const bateErro =
        erroBusca.length === 0 ||
        normalizar(chamado.nomeErro).includes(erroBusca) ||
        normalizar(chamado.titulo).includes(erroBusca)

      const bateRotina =
        rotinaBusca === null ||
        (!Number.isNaN(rotinaBusca) && chamado.rotinas.includes(rotinaBusca))

      return bateErro && bateRotina
    })
  }, [chamados, erroBusca, rotinaBusca, buscou])

  const copiarMensagem = async (chamado: Chamado) => {
    await navigator.clipboard.writeText(formatarMensagem(chamado))
    setCopiadoId(chamado.id)
    setTimeout(() => setCopiadoId((atual) => (atual === chamado.id ? null : atual)), 1500)
  }

  const anexarArquivo = async (chamado: Chamado) => {
    const nomeArquivo = await window.chamadosAPI.escolherArquivo()
    if (!nomeArquivo) return
    const atualizado = await window.chamadosAPI.updateDoc(chamado.id, { documentoNome: nomeArquivo })
    if (atualizado) onAtualizarChamado(atualizado)
  }

  const salvarLink = async (chamado: Chamado) => {
    const link = (linkRascunho[chamado.id] ?? '').trim()
    if (!link) return
    const atualizado = await window.chamadosAPI.updateDoc(chamado.id, { documentoLink: link })
    if (atualizado) {
      onAtualizarChamado(atualizado)
      setLinkRascunho((atual) => ({ ...atual, [chamado.id]: '' }))
    }
  }

  return (
    <div className="olho-de-deus">
      <p className="olho-de-deus-intro">
        Informe o erro e/ou a rotina para encontrar a resolução já registrada.
      </p>

      <div className="linha">
        <label>
          Erro
          <input
            value={erro}
            onChange={(e) => setErro(e.target.value)}
            placeholder="Nome ou parte do erro"
          />
        </label>

        <label>
          Rotina
          <input
            value={rotina}
            onChange={(e) => setRotina(e.target.value)}
            placeholder="530"
          />
        </label>
      </div>

      {arquivosPasso.length > 0 && (
        <div className="olho-de-deus-passo-a-passo">
          <strong>📁 Passo a passo encontrado</strong>
          <ul>
            {arquivosPasso.map((arquivo) => (
              <li key={arquivo}>
                <span>{arquivo}</span>
                <button type="button" onClick={() => window.passoAPassoAPI.abrir(arquivo)}>
                  Abrir
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {buscou && (
        resultados.length === 0 ? (
          <p className="olho-de-deus-vazio">Nenhum chamado encontrado para esses dados.</p>
        ) : (
          <div className="olho-de-deus-resultados">
            {resultados.length > 1 && (
              <p className="olho-de-deus-recorrencia">
                🔁 Esse erro já se repetiu {resultados.length}x
              </p>
            )}

            {resultados.map((chamado) => (
              <div key={chamado.id} className="olho-de-deus-card">
                <div className="olho-de-deus-card-header">
                  <strong>{chamado.nomeErro || chamado.titulo}</strong>
                  <button type="button" onClick={() => copiarMensagem(chamado)}>
                    {copiadoId === chamado.id ? 'Copiado!' : 'Copiar mensagem'}
                  </button>
                </div>

                <pre className="olho-de-deus-resposta">{formatarMensagem(chamado)}</pre>

                <div className="olho-de-deus-doc">
                  {chamado.documentoLink && (
                    <button
                      type="button"
                      onClick={() => window.chamadosAPI.abrirLink(chamado.documentoLink!)}
                    >
                      🔗 Abrir link
                    </button>
                  )}

                  {chamado.documentoNome && (
                    <button
                      type="button"
                      onClick={() => window.chamadosAPI.abrirArquivo(chamado.documentoNome!)}
                    >
                      📎 Abrir arquivo
                    </button>
                  )}

                  <button type="button" onClick={() => anexarArquivo(chamado)}>
                    📎 Anexar base de conhecimento
                  </button>

                  <div className="olho-de-deus-link-form">
                    <input
                      placeholder="Colar link do passo a passo"
                      value={linkRascunho[chamado.id] ?? ''}
                      onChange={(e) =>
                        setLinkRascunho((atual) => ({ ...atual, [chamado.id]: e.target.value }))
                      }
                    />
                    <button type="button" onClick={() => salvarLink(chamado)}>
                      Salvar link
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
