/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * The built directory structure
     *
     * ```tree
     * ├─┬─┬ dist
     * │ │ └── index.html
     * │ │
     * │ ├─┬ dist-electron
     * │ │ ├── main.js
     * │ │ └── preload.js
     * │
     * ```
     */
    APP_ROOT: string
    /** /dist/ or /public/ */
    VITE_PUBLIC: string
  }
}

// Used in Renderer process, expose in `preload.ts`
interface Window {
  ipcRenderer: import('electron').IpcRenderer
  chamadosAPI: {
    getAll: () => Promise<import('../src/types/chamado').Chamado[]>
    add: (chamado: import('../src/types/chamado').NovoChamado) => Promise<import('../src/types/chamado').Chamado>
    updateDoc: (
      id: string,
      doc: { documentoNome?: string; documentoLink?: string },
    ) => Promise<import('../src/types/chamado').Chamado | null>
    escolherArquivo: () => Promise<string | null>
    abrirArquivo: (nomeArquivo: string) => Promise<void>
    abrirLink: (link: string) => Promise<void>
  }
  passoAPassoAPI: {
    buscar: (consulta: string) => Promise<string[]>
    abrir: (nomeArquivo: string) => Promise<void>
  }
  bubbleAPI: {
    menu: () => void
    expand: () => void
    collapse: () => void
    moveBy: (dx: number, dy: number) => void
    quit: () => void
  }
}
