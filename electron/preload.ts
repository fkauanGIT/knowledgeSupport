import { ipcRenderer, contextBridge } from 'electron'

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
})

// Ponte com a knowledgeSupport-api (o HTTP acontece no processo main;
// o renderer nunca vê a API key — só resultados { ok, data | error }).
contextBridge.exposeInMainWorld('backendAPI', {
  getConfig: () => ipcRenderer.invoke('config:get'),
  setConfig: (config: { apiUrl: string; apiKey: string }) =>
    ipcRenderer.invoke('config:set', config),

  getJiraSettings: () => ipcRenderer.invoke('api:settings:jira:get'),
  setJiraSettings: (body: unknown) => ipcRenderer.invoke('api:settings:jira:set', body),

  listCalleds: () => ipcRenderer.invoke('api:calleds:list'),
  analyzeCalled: (key: string) => ipcRenderer.invoke('api:calleds:analysis', key),
  sendFeedback: (key: string, body: { standardId: string; resolved: boolean }) =>
    ipcRenderer.invoke('api:calleds:feedback', key, body),
  gapReport: () => ipcRenderer.invoke('api:calleds:gapReport'),

  listStandards: () => ipcRenderer.invoke('api:standards:list'),
  getStandard: (id: string) => ipcRenderer.invoke('api:standards:get', id),
  createStandard: (body: unknown) => ipcRenderer.invoke('api:standards:create', body),
  updateStandard: (id: string, body: unknown) =>
    ipcRenderer.invoke('api:standards:update', id, body),
  deleteStandard: (id: string) => ipcRenderer.invoke('api:standards:delete', id),
  standardAccuracy: (id: string) => ipcRenderer.invoke('api:standards:accuracy', id),
})
