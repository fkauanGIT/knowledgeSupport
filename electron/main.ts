import { app, BrowserWindow, ipcMain, screen } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { registerApiHandlers } from './apiClient'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

// Integração com a knowledgeSupport-api (config persistida + todas as rotas)
registerApiHandlers()

// Dimensões da bolha (lançador) e da janela do app
const BUBBLE_SIZE = 64
const APP_WIDTH = 1100
const APP_HEIGHT = 700

let win: BrowserWindow | null
let boundsBeforeFullscreen: Electron.Rectangle | null = null

/** Mantém uma janela (x, y, width, height) inteiramente dentro da área útil da tela. */
function clampToWorkArea(x: number, y: number, width: number, height: number) {
  const { workArea } = screen.getPrimaryDisplay()
  width = Math.min(width, workArea.width)
  height = Math.min(height, workArea.height)
  const clampedX = Math.max(workArea.x, Math.min(x, workArea.x + workArea.width - width))
  const clampedY = Math.max(workArea.y, Math.min(y, workArea.y + workArea.height - height))
  return { x: clampedX, y: clampedY, width, height }
}

/** Bounds que deixam uma janela de (width × height) centralizada na tela. */
function centeredBounds(width: number, height: number) {
  const { workArea } = screen.getPrimaryDisplay()
  width = Math.min(width, workArea.width)
  height = Math.min(height, workArea.height)
  const x = workArea.x + Math.round((workArea.width - width) / 2)
  const y = workArea.y + Math.round((workArea.height - height) / 2)
  return { x, y, width, height }
}

function createWindow() {
  // Janela nasce CENTRALIZADA na tela (antes: canto inferior direito)
  const bounds = centeredBounds(BUBBLE_SIZE, BUBBLE_SIZE)

  win = new BrowserWindow({
    ...bounds,
    frame: false,
    transparent: true,
    hasShadow: false,
    resizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  win.setAlwaysOnTop(true, 'screen-saver')

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

/** Redimensiona mantendo a janela ancorada no seu centro atual, sem sair da tela. */
function resizeAnchored(width: number, height: number) {
  if (!win) return
  const b = win.getBounds()
  const centerX = b.x + b.width / 2
  const centerY = b.y + b.height / 2
  const bounds = clampToWorkArea(
    Math.round(centerX - width / 2),
    Math.round(centerY - height / 2),
    width,
    height,
  )
  win.setBounds(bounds)
}

ipcMain.on('bubble:expand', () => resizeAnchored(APP_WIDTH, APP_HEIGHT))
ipcMain.on('bubble:collapse', () => resizeAnchored(BUBBLE_SIZE, BUBBLE_SIZE))

/** Expande a janela para ocupar toda a área útil da tela onde ela está. */
ipcMain.on('bubble:fullscreen', () => {
  if (!win) return
  boundsBeforeFullscreen = win.getBounds()
  const { workArea } = screen.getDisplayMatching(win.getBounds())
  win.setBounds(workArea)
})

/** Volta do modo tela cheia para o tamanho/posição anterior (ou o padrão do app). */
ipcMain.on('bubble:restore', () => {
  if (!win) return
  if (boundsBeforeFullscreen) {
    const b = boundsBeforeFullscreen
    boundsBeforeFullscreen = null
    win.setBounds(clampToWorkArea(b.x, b.y, b.width, b.height))
  } else {
    resizeAnchored(APP_WIDTH, APP_HEIGHT)
  }
})

// Arrasto da bolinha: o renderer manda o delta do mouse, o main move a janela (com clamp).
ipcMain.on('bubble:moveBy', (_event, dx: number, dy: number) => {
  if (!win) return
  const b = win.getBounds()
  const bounds = clampToWorkArea(b.x + Math.round(dx), b.y + Math.round(dy), b.width, b.height)
  win.setPosition(bounds.x, bounds.y)
})

ipcMain.on('bubble:quit', () => app.quit())

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)
