// Tipos da ponte com a knowledgeSupport-api (exposta pelo preload como window.backendAPI).

import type {
  ApiResult,
  AppConfig,
  CalledAnalysisResponse,
  CalledResponse,
  ChamadoRelacionado,
  ChatwootMessageResponse,
  DocumentoMeta,
  FeedbackResponse,
  GapReportResponse,
  JiraSettings,
  JiraSettingsInput,
  StandardAccuracyResponse,
  StandardRequest,
  StandardResponse,
  TrechoDocumento,
  TrechoEncontrado,
} from '../api/types'

declare global {
  interface Window {
    backendAPI: {
      getConfig: () => Promise<AppConfig>
      setConfig: (patch: Partial<AppConfig>) => Promise<AppConfig>

      getJiraSettings: () => Promise<ApiResult<JiraSettings>>
      setJiraSettings: (body: JiraSettingsInput) => Promise<ApiResult<JiraSettings>>

      listCalleds: () => Promise<ApiResult<CalledResponse[]>>
      analyzeCalled: (key: string) => Promise<ApiResult<CalledAnalysisResponse>>
      sendFeedback: (
        key: string,
        body: { standardId: string; resolved: boolean },
      ) => Promise<ApiResult<FeedbackResponse>>
      gapReport: () => Promise<ApiResult<GapReportResponse>>

      sendChatwootMessage: (
        conversationId: string,
        content: string,
      ) => Promise<ApiResult<ChatwootMessageResponse>>

      selecionarArquivosDoc: () => Promise<ApiResult<string[]>>
      uploadDocumento: (caminho: string) => Promise<ApiResult<DocumentoMeta>>
      listarDocumentos: () => Promise<ApiResult<DocumentoMeta[]>>
      removerDocumento: (id: string) => Promise<ApiResult<void>>
      obterTrechosDocumento: (docId: string) => Promise<ApiResult<TrechoDocumento[]>>
      chamadosRelacionadosDocumento: (docId: string) => Promise<ApiResult<ChamadoRelacionado[]>>
      buscarNaDocumentacao: (consulta: string) => Promise<ApiResult<TrechoEncontrado[]>>

      listStandards: () => Promise<ApiResult<StandardResponse[]>>
      getStandard: (id: string) => Promise<ApiResult<StandardResponse>>
      createStandard: (body: StandardRequest) => Promise<ApiResult<StandardResponse>>
      updateStandard: (id: string, body: StandardRequest) => Promise<ApiResult<StandardResponse>>
      deleteStandard: (id: string) => Promise<ApiResult<void>>
      standardAccuracy: (id: string) => Promise<ApiResult<StandardAccuracyResponse>>
    }
  }
}

export {}
