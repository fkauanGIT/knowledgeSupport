// Documentation client — indexing and search live in knowledgeSupport-api (see the repo
// root's back.md for the full endpoint contract). Only the file picker is local: it's the
// only piece that needs the OS's native dialog, so it stays outside the API's `request`.

import { dialog, ipcMain } from 'electron'
import path from 'node:path'
import fs from 'node:fs/promises'
import { del, get, post, request, type ApiResult } from './apiClient'

/** Multipart upload of a file (PDF/DOCX) — extraction/indexing happens in the API. */
async function uploadDocument(filePath: string): Promise<ApiResult<unknown>> {
  const buffer = await fs.readFile(filePath)
  const form = new FormData()
  form.append('file', new Blob([buffer]), path.basename(filePath))
  return request('/api/documents', { method: 'POST', body: form })
}

/** Registers the Documentation IPC channels. Call once at boot. */
export function registerDocumentHandlers() {
  ipcMain.handle('docs:selectFiles', async (): Promise<ApiResult<string[]>> => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openFile', 'multiSelections'],
        filters: [{ name: 'Documents', extensions: ['pdf', 'docx'] }],
      })
      return { ok: true, data: result.canceled ? [] : result.filePaths }
    } catch (e) {
      return { ok: false, status: 0, error: e instanceof Error ? e.message : String(e) }
    }
  })

  ipcMain.handle('api:documents:upload', (_e, filePath: string) => uploadDocument(filePath))
  ipcMain.handle('api:documents:list', () => get('/api/documents'))
  ipcMain.handle('api:documents:delete', (_e, id: string) =>
    del(`/api/documents/${encodeURIComponent(id)}`))
  ipcMain.handle('api:documents:chunks', (_e, id: string) =>
    get(`/api/documents/${encodeURIComponent(id)}/chunks`))
  ipcMain.handle('api:documents:relatedCalleds', (_e, id: string) =>
    get(`/api/documents/${encodeURIComponent(id)}/related-calleds`))
  ipcMain.handle('api:documents:search', (_e, query: string) =>
    post('/api/documents/search', { query }))
}
