# Changelog

Todas as mudanças relevantes deste projeto são documentadas aqui. O formato segue
[Conventional Commits](https://www.conventionalcommits.org/) e o versionamento é
[SemVer](https://semver.org/lang/pt-BR/), gerenciado automaticamente pelo
[Release Please](https://github.com/googleapis/release-please).

## 1.0.0 (2026-07-17)

### Features

* app desktop Electron com bolha flutuante centralizada na tela
* menu radial com 7 ações (Olho de Deus, Criar chamado, Chamados do Jira, Padrões, Lacunas, Configurações, Fechar)
* base de chamados local com busca "Olho de Deus", anexos e links de passo a passo
* integração completa com a knowledgeSupport-api: listagem de chamados do Jira, análise, feedback e relatório de lacunas
* CRUD de padrões (base de conhecimento) com passos de investigação e taxa de acurácia
* tela de Configurações para a conexão com a API (URL + X-API-KEY) e para o **token do Jira**, permitindo renovar o token pela interface sem editar o `.env` nem reiniciar a API

### Estilo

* ícone/bolha em preto e branco (antes azul)
