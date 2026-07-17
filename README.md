<p align="center">
  <img src="docs/assets/icon.svg" width="96" alt="knowledgeSupport" />
</p>

<h1 align="center">knowledgeSupport — Desktop</h1>

<p align="center">
  App de desktop (Electron + React + TypeScript) que funciona como base de conhecimento
  de suporte técnico: uma bolha flutuante, centralizada na tela, para consultar chamados,
  registrar padrões de solução e falar com a <strong>knowledgeSupport-api</strong>.
</p>

## Visão geral

O app abre como uma pequena bolha preta com um ícone de headset. Ao clicar, ela expande em
um menu radial com sete ações e, a partir dele, em painéis que cobrem toda a jornada de
suporte: da base local de chamados à integração completa com a API (Jira + base de padrões).

Os chamados vêm do Jira em tempo real através da API; os padrões (erros conhecidos e suas
soluções) são persistidos no backend; e a análise cruza um com o outro para sugerir a
resolução mais provável.

![Arquitetura](docs/assets/architecture.svg)

## Funcionalidades

- **Olho de Deus** — busca rápida na base local de chamados por erro/rotina, com mensagem
  pronta para copiar e anexos de passo a passo.
- **Criar chamado** — cadastro completo de chamados na base local (JSON).
- **Chamados (Jira)** — lista os chamados abertos vindos do Jira, analisa cada um contra os
  padrões cadastrados e permite registrar feedback (resolveu ou não).
- **Padrões** — CRUD da base de conhecimento (erro, solução, passos de investigação) e taxa
  de acurácia por padrão, alimentada pelo feedback real.
- **Lacunas** — relatório de onde cadastrar um novo padrão cobriria mais chamados.
- **Configurações** — conexão com a API (URL + `X-API-KEY`) e o **token do Jira**: renove o
  token pela interface quando ele expirar, sem editar o `.env` da API nem reiniciar o servidor.

## Pré-requisitos

- Node.js 18+ e npm
- A [knowledgeSupport-api](../demo) rodando (por padrão em `http://localhost:8080`)

## Rodando em desenvolvimento

```bash
npm install
npm run dev
```

A janela nasce centralizada na tela. Na primeira execução, abra **Configurações** (⚙️) e
informe a URL da API e a `X-API-KEY`. Em seguida, ainda em Configurações, preencha os dados
do Jira (URL base, e-mail, token e JQL).

## Build / empacotamento

```bash
npm run build
```

Gera o executável via `electron-builder` em `release/<versão>/` (NSIS no Windows, DMG no
macOS, AppImage no Linux). O ícone do app fica em `build/icon.png`.

## Configuração

O app não guarda segredos no código. Há duas camadas de configuração:

1. **Desktop** — a URL da API e a `X-API-KEY` ficam em `config.json` no diretório de dados do
   usuário (gravado pelo processo `main`; o renderer nunca vê a chave).
2. **Jira** — URL base, e-mail, token e JQL são gerenciados pela API via
   `GET`/`PUT /api/settings/jira`. O token nunca é exposto de volta pela interface — o painel
   mostra apenas se há um token configurado.

## Arquitetura

Três camadas isoladas por processo: o **renderer** (React) só conhece `window.backendAPI`,
exposto pelo **preload** via `contextBridge`; o **main** (Node) concentra o HTTP e a chave da
API em `apiClient.ts` — sem CORS e sem vazar segredos para a UI. Detalhes em
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Versionamento

[SemVer](https://semver.org/lang/pt-BR/) via [Conventional Commits](https://www.conventionalcommits.org/),
automatizado pelo [Release Please](https://github.com/googleapis/release-please). O histórico
fica em [`CHANGELOG.md`](CHANGELOG.md).
