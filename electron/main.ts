import { app, BrowserWindow, dialog, ipcMain, screen, shell } from 'electron'
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
const UPLOADS_DIR = path.join(process.env.APP_ROOT, 'data', 'uploads')
const PASSO_A_PASSO_DIR = 'C:\\Users\\fkauan\\Desktop\\Utilitários\\Passo-a-Passo'

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

interface RegistroChamado {
  id: string
  documentoNome?: string
  documentoLink?: string
  [chave: string]: unknown
}

ipcMain.handle(
  'chamados:updateDoc',
  async (_event, id: string, doc: { documentoNome?: string; documentoLink?: string }) => {
    const chamados: RegistroChamado[] = await readChamados()
    const indice = chamados.findIndex((c) => c.id === id)
    if (indice === -1) return null
    chamados[indice] = { ...chamados[indice], ...doc }
    await writeChamados(chamados)
    return chamados[indice]
  },
)

ipcMain.handle('chamados:escolherArquivo', async () => {
  if (!win) return null
  const resultado = await dialog.showOpenDialog(win, { properties: ['openFile'] })
  if (resultado.canceled || resultado.filePaths.length === 0) return null

  const origem = resultado.filePaths[0]
  await fs.mkdir(UPLOADS_DIR, { recursive: true })
  const nomeArquivo = `${Date.now()}-${path.basename(origem)}`
  await fs.copyFile(origem, path.join(UPLOADS_DIR, nomeArquivo))
  return nomeArquivo
})

ipcMain.handle('chamados:abrirArquivo', (_event, nomeArquivo: string) =>
  shell.openPath(path.join(UPLOADS_DIR, nomeArquivo)),
)

ipcMain.handle('chamados:abrirLink', (_event, link: string) => shell.openExternal(link))

const normalizarNome = (valor: string) =>
  valor
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[-_.]/g, ' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()

ipcMain.handle('passoAPasso:buscar', async (_event, consulta: string) => {
  const palavras = normalizarNome(consulta)
    .split(' ')
    .filter((palavra) => palavra.length >= 2)
  if (palavras.length === 0) return []

  let arquivos: string[]
  try {
    arquivos = await fs.readdir(PASSO_A_PASSO_DIR)
  } catch {
    return []
  }

  return arquivos.filter((arquivo) => {
    const nomeNormalizado = normalizarNome(path.parse(arquivo).name)
    return palavras.every((palavra) => nomeNormalizado.includes(palavra))
  })
})

ipcMain.handle('passoAPasso:abrir', (_event, nomeArquivo: string) =>
  shell.openPath(path.join(PASSO_A_PASSO_DIR, nomeArquivo)),
)

// Largura de referência de um Galaxy A56 (CSS px), altura de um card de formulário rolável
const BUBBLE_SIZE = 64
const BUBBLE_GAP = 12
const MENU_ITENS = 3 // bolinha principal + Criar chamado + Olho de Deus
const MENU_HEIGHT = BUBBLE_SIZE * MENU_ITENS + BUBBLE_GAP * (MENU_ITENS - 1)
const PHONE_WIDTH = 340
const PHONE_HEIGHT = 560

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

  width = Math.min(width, workArea.width)
  height = Math.min(height, workArea.height)

  let x = currentX + currentWidth - width
  let y = currentY + currentHeight - height
  x = Math.min(Math.max(x, workArea.x), workArea.x + workArea.width - width)
  y = Math.min(Math.max(y, workArea.y), workArea.y + workArea.height - height)

  win.setBounds({ x, y, width, height })
}

ipcMain.on('bubble:menu', () => resizeKeepingBottomRight(BUBBLE_SIZE, MENU_HEIGHT))
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
