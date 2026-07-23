import { ipcRenderer, contextBridge } from 'electron'
import type { AppConfig } from '../src/api/types'

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
})

// Ponte com a knowledgeSupport-api (o HTTP acontece no processo main;
// o renderer nunca vê a API key — só resultados { ok, data | error }).
contextBridge.exposeInMainWorld('backendAPI', {
  getConfig: () => ipcRenderer.invoke('config:get'),
  setConfig: (patch: Partial<AppConfig>) => ipcRenderer.invoke('config:set', patch),

  getJiraSettings: () => ipcRenderer.invoke('api:settings:jira:get'),
  setJiraSettings: (body: unknown) => ipcRenderer.invoke('api:settings:jira:set', body),

  listCalleds: () => ipcRenderer.invoke('api:calleds:list'),
  analyzeCalled: (key: string) => ipcRenderer.invoke('api:calleds:analysis', key),
  sendFeedback: (key: string, body: { standardId: string; resolved: boolean }) =>
    ipcRenderer.invoke('api:calleds:feedback', key, body),
  gapReport: () => ipcRenderer.invoke('api:calleds:gapReport'),

  sendChatwootMessage: (conversationId: string, content: string) =>
    ipcRenderer.invoke('chatwoot:sendMessage', conversationId, content),

  selecionarArquivosDoc: () => ipcRenderer.invoke('docs:selectFiles'),
  uploadDocumento: (caminho: string) => ipcRenderer.invoke('api:documentacao:upload', caminho),
  listarDocumentos: () => ipcRenderer.invoke('api:documentacao:list'),
  removerDocumento: (id: string) => ipcRenderer.invoke('api:documentacao:delete', id),
  obterTrechosDocumento: (docId: string) =>
    ipcRenderer.invoke('api:documentacao:trechos', docId),
  chamadosRelacionadosDocumento: (docId: string) =>
    ipcRenderer.invoke('api:documentacao:chamadosRelacionados', docId),
  buscarNaDocumentacao: (consulta: string) =>
    ipcRenderer.invoke('api:documentacao:buscar', consulta),

  listStandards: () => ipcRenderer.invoke('api:standards:list'),
  getStandard: (id: string) => ipcRenderer.invoke('api:standards:get', id),
  createStandard: (body: unknown) => ipcRenderer.invoke('api:standards:create', body),
  updateStandard: (id: string, body: unknown) =>
    ipcRenderer.invoke('api:standards:update', id, body),
  deleteStandard: (id: string) => ipcRenderer.invoke('api:standards:delete', id),
  standardAccuracy: (id: string) => ipcRenderer.invoke('api:standards:accuracy', id),
})
