# Changelog

Todas as mudanças relevantes deste projeto são documentadas aqui. O formato segue
[Conventional Commits](https://www.conventionalcommits.org/) e o versionamento é
[SemVer](https://semver.org/lang/pt-BR/), gerenciado automaticamente pelo
[Release Please](https://github.com/googleapis/release-please).

## [1.2.0](https://github.com/fkauanGIT/knowledgeSupport/compare/v1.1.0...v1.2.0) (2026-07-24)


### Features

* add a fullscreen toggle to the app window ([f7cf3f5](https://github.com/fkauanGIT/knowledgeSupport/commit/f7cf3f5e3042f1a600519b9246f603e1b7c23043))
* add Home dashboard charts for tickets created vs resolved ([fb91f84](https://github.com/fkauanGIT/knowledgeSupport/commit/fb91f8437a7f94ed0fa54f00be820759c20f2290))
* add search and status/type/category filters to the Chamados list ([aca0b07](https://github.com/fkauanGIT/knowledgeSupport/commit/aca0b07f394396dc23c4eec263e3a92136d73b13))
* filter tickets by period, status, and assignee via the API ([c716c1a](https://github.com/fkauanGIT/knowledgeSupport/commit/c716c1a3a11f78f0269ebeb2320ff5563130bef5))
* index support documentation and surface it during ticket analysis ([d92e326](https://github.com/fkauanGIT/knowledgeSupport/commit/d92e326bc4e745fa3622b2c232b1ed7e63bce62f))
* send analyzed ticket messages to Chatwoot ([6eda9bd](https://github.com/fkauanGIT/knowledgeSupport/commit/6eda9bd97f1cf6add6ccb30ccf5f4520ed5940fe))

## [1.1.0](https://github.com/fkauanGIT/knowledgeSupport/compare/v1.0.0...v1.1.0) (2026-07-17)


### Features

* integrate all knowledgeSupport-api routes (calleds, standards, gaps, config) ([be5a243](https://github.com/fkauanGIT/knowledgeSupport/commit/be5a24309a3e451caa3b28865c67f8ddfe3babd2))

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
