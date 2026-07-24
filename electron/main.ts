import { app, BrowserWindow, ipcMain, screen } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { registerApiHandlers } from './apiClient'
import { registerChatwootHandlers } from './chatwootClient'
import { registerDocumentHandlers } from './documentClient'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

// Integration with knowledgeSupport-api (persisted config + all routes)
registerApiHandlers()
registerChatwootHandlers()
registerDocumentHandlers()

// Bubble (launcher) and app window dimensions
const BUBBLE_SIZE = 64
const APP_WIDTH = 1100
const APP_HEIGHT = 700

let win: BrowserWindow | null
let boundsBeforeFullscreen: Electron.Rectangle | null = null

/** Keeps a window (x, y, width, height) entirely inside the screen's work area. */
function clampToWorkArea(x: number, y: number, width: number, height: number) {
  const { workArea } = screen.getPrimaryDisplay()
  width = Math.min(width, workArea.width)
  height = Math.min(height, workArea.height)
  const clampedX = Math.max(workArea.x, Math.min(x, workArea.x + workArea.width - width))
  const clampedY = Math.max(workArea.y, Math.min(y, workArea.y + workArea.height - height))
  return { x: clampedX, y: clampedY, width, height }
}

/** Bounds that leave a (width × height) window centered on screen. */
function centeredBounds(width: number, height: number) {
  const { workArea } = screen.getPrimaryDisplay()
  width = Math.min(width, workArea.width)
  height = Math.min(height, workArea.height)
  const x = workArea.x + Math.round((workArea.width - width) / 2)
  const y = workArea.y + Math.round((workArea.height - height) / 2)
  return { x, y, width, height }
}

function createWindow() {
  // The window is born CENTERED on screen (before: bottom-right corner)
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

/** Resizes while keeping the window anchored on its current center, without leaving the screen. */
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

/** Expands the window to fill the whole work area of the screen it's on. */
ipcMain.on('bubble:fullscreen', () => {
  if (!win) return
  boundsBeforeFullscreen = win.getBounds()
  const { workArea } = screen.getDisplayMatching(win.getBounds())
  win.setBounds(workArea)
})

/** Returns from fullscreen mode to the previous size/position (or the app's default). */
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

// Bubble drag: the renderer sends the mouse delta, main moves the window (with clamp).
ipcMain.on('bubble:moveBy', (_event, dx: number, dy: number) => {
  if (!win) return
  const b = win.getBounds()
  const bounds = clampToWorkArea(b.x + Math.round(dx), b.y + Math.round(dy), b.width, b.height)
  win.setPosition(bounds.x, bounds.y)
})

ipcMain.on('bubble:quit', () => app.quit())

// App version (package.json via Electron) — avoids hardcoding it in the renderer, which
// used to go stale on every automated release (Release Please).
ipcMain.handle('bubble:getVersion', () => app.getVersion())

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
