// Cliente da Documentação — indexação e busca ficam na knowledgeSupport-api (ver back.md
// na raiz do repo pro contrato completo dos endpoints). Só a escolha do arquivo é local:
// é o único pedaço que precisa do diálogo nativo do SO, então fica fora do `request` da API.

import { dialog, ipcMain } from 'electron'
import path from 'node:path'
import fs from 'node:fs/promises'
import { del, get, post, request, type ApiResult } from './apiClient'

/** Upload multipart de um arquivo (PDF/DOCX) — a extração/indexação acontece na API. */
async function uploadDocumento(caminho: string): Promise<ApiResult<unknown>> {
  const buffer = await fs.readFile(caminho)
  const form = new FormData()
  form.append('arquivo', new Blob([buffer]), path.basename(caminho))
  return request('/api/documentacao', { method: 'POST', body: form })
}

/** Registra os canais IPC da Documentação. Chamar uma vez no boot. */
export function registerDocumentacaoHandlers() {
  ipcMain.handle('docs:selectFiles', async (): Promise<ApiResult<string[]>> => {
    try {
      const resultado = await dialog.showOpenDialog({
        properties: ['openFile', 'multiSelections'],
        filters: [{ name: 'Documentos', extensions: ['pdf', 'docx'] }],
      })
      return { ok: true, data: resultado.canceled ? [] : resultado.filePaths }
    } catch (e) {
      return { ok: false, status: 0, error: e instanceof Error ? e.message : String(e) }
    }
  })

  ipcMain.handle('api:documentacao:upload', (_e, caminho: string) => uploadDocumento(caminho))
  ipcMain.handle('api:documentacao:list', () => get('/api/documentacao'))
  ipcMain.handle('api:documentacao:delete', (_e, id: string) =>
    del(`/api/documentacao/${encodeURIComponent(id)}`))
  ipcMain.handle('api:documentacao:trechos', (_e, id: string) =>
    get(`/api/documentacao/${encodeURIComponent(id)}/trechos`))
  ipcMain.handle('api:documentacao:chamadosRelacionados', (_e, id: string) =>
    get(`/api/documentacao/${encodeURIComponent(id)}/chamados-relacionados`))
  ipcMain.handle('api:documentacao:buscar', (_e, consulta: string) =>
    post('/api/documentacao/buscar', { consulta }))
}
