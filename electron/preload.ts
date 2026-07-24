import { ipcRenderer, contextBridge } from 'electron'
import type { AppConfig, CalledFilter } from '../src/api/types'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },

  // You can expose other APTs you need here.
  // ...
})

contextBridge.exposeInMainWorld('bubbleAPI', {
  expand: () => ipcRenderer.send('bubble:expand'),
  collapse: () => ipcRenderer.send('bubble:collapse'),
  moveBy: (dx: number, dy: number) => ipcRenderer.send('bubble:moveBy', dx, dy),
  quit: () => ipcRenderer.send('bubble:quit'),
  fullscreen: () => ipcRenderer.send('bubble:fullscreen'),
  restore: () => ipcRenderer.send('bubble:restore'),
  getVersion: () => ipcRenderer.invoke('bubble:getVersion') as Promise<string>,
})

// Bridge to knowledgeSupport-api (HTTP happens in the main process;
// the renderer never sees the API key — only { ok, data | error } results).
contextBridge.exposeInMainWorld('backendAPI', {
  getConfig: () => ipcRenderer.invoke('config:get'),
  setConfig: (patch: Partial<AppConfig>) => ipcRenderer.invoke('config:set', patch),

  getJiraSettings: () => ipcRenderer.invoke('api:settings:jira:get'),
  setJiraSettings: (body: unknown) => ipcRenderer.invoke('api:settings:jira:set', body),

  listCalleds: (filter?: CalledFilter) => ipcRenderer.invoke('api:calleds:list', filter),
  analyzeCalled: (key: string) => ipcRenderer.invoke('api:calleds:analysis', key),
  sendFeedback: (key: string, body: { standardId: string; resolved: boolean }) =>
    ipcRenderer.invoke('api:calleds:feedback', key, body),
  gapReport: () => ipcRenderer.invoke('api:calleds:gapReport'),

  sendChatwootMessage: (conversationId: string, content: string) =>
    ipcRenderer.invoke('chatwoot:sendMessage', conversationId, content),

  selectDocFiles: () => ipcRenderer.invoke('docs:selectFiles'),
  uploadDocument: (filePath: string) => ipcRenderer.invoke('api:documents:upload', filePath),
  listDocuments: () => ipcRenderer.invoke('api:documents:list'),
  removeDocument: (id: string) => ipcRenderer.invoke('api:documents:delete', id),
  getDocumentChunks: (docId: string) => ipcRenderer.invoke('api:documents:chunks', docId),
  relatedCalledsForDocument: (docId: string) =>
    ipcRenderer.invoke('api:documents:relatedCalleds', docId),
  searchDocumentation: (query: string) => ipcRenderer.invoke('api:documents:search', query),

  listStandards: () => ipcRenderer.invoke('api:standards:list'),
  getStandard: (id: string) => ipcRenderer.invoke('api:standards:get', id),
  createStandard: (body: unknown) => ipcRenderer.invoke('api:standards:create', body),
  updateStandard: (id: string, body: unknown) =>
    ipcRenderer.invoke('api:standards:update', id, body),
  deleteStandard: (id: string) => ipcRenderer.invoke('api:standards:delete', id),
  standardAccuracy: (id: string) => ipcRenderer.invoke('api:standards:accuracy', id),
})
