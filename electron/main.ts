import { app, BrowserWindow, ipcMain, screen } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs/promises'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

const DB_PATH = path.join(process.env.APP_ROOT, 'data', 'chamados.json')

async function readChamados() {
  const raw = await fs.readFile(DB_PATH, 'utf-8')
  return JSON.parse(raw)
}

async function writeChamados(chamados: unknown[]) {
  await fs.writeFile(DB_PATH, JSON.stringify(chamados, null, 2), 'utf-8')
}

ipcMain.handle('chamados:getAll', () => readChamados())

ipcMain.handle('chamados:add', async (_event, novoChamado: Record<string, unknown>) => {
  const chamados = await readChamados()
  const proximoNumero = chamados.length + 1
  const id = `CH${String(proximoNumero).padStart(4, '0')}`
  const chamado = { id, ...novoChamado }
  chamados.push(chamado)
  await writeChamados(chamados)
  return chamado
})

// Largura de referência de um Galaxy A56 (CSS px), altura de um card de formulário rolável
const BUBBLE_SIZE = 64
const PHONE_WIDTH = 390
const PHONE_HEIGHT = 780

let win: BrowserWindow | null

function createWindow() {
  const { workArea } = screen.getPrimaryDisplay()
  const x = workArea.x + workArea.width - BUBBLE_SIZE - 24
  const y = workArea.y + workArea.height - BUBBLE_SIZE - 24

  win = new BrowserWindow({
    x,
    y,
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
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
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

function resizeKeepingBottomRight(width: number, height: number) {
  if (!win) return
  const [currentX, currentY] = win.getPosition()
  const [currentWidth, currentHeight] = win.getSize()
  const { workArea } = screen.getPrimaryDisplay()

  let x = currentX + currentWidth - width
  let y = currentY + currentHeight - height
  x = Math.min(Math.max(x, workArea.x), workArea.x + workArea.width - width)
  y = Math.min(Math.max(y, workArea.y), workArea.y + workArea.height - height)

  win.setBounds({ x, y, width, height })
}

ipcMain.on('bubble:expand', () => resizeKeepingBottomRight(PHONE_WIDTH, PHONE_HEIGHT))
ipcMain.on('bubble:collapse', () => resizeKeepingBottomRight(BUBBLE_SIZE, BUBBLE_SIZE))
ipcMain.on('bubble:quit', () => app.quit())

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)
