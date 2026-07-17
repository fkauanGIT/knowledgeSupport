import { app, BrowserWindow, dialog, ipcMain, screen, shell } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs/promises'
import { registerApiHandlers } from './apiClient'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')

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

// Integração com a knowledgeSupport-api (config persistida + todas as rotas)
registerApiHandlers()

// Dimensões da bolha, do menu e do painel
const BUBBLE_SIZE = 64
const BUBBLE_GAP = 12
// Olho de Deus + Criar chamado + Chamados API + Padrões + Lacunas + Config + fechar
const MENU_ITENS = 7
const MENU_HEIGHT = BUBBLE_SIZE * MENU_ITENS + BUBBLE_GAP * (MENU_ITENS - 1)
const PHONE_WIDTH = 340
const PHONE_HEIGHT = 560

let win: BrowserWindow | null

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

ipcMain.on('bubble:menu', () => resizeAnchored(BUBBLE_SIZE, MENU_HEIGHT))
ipcMain.on('bubble:expand', () => resizeAnchored(PHONE_WIDTH, PHONE_HEIGHT))
ipcMain.on('bubble:collapse', () => resizeAnchored(BUBBLE_SIZE, BUBBLE_SIZE))

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
