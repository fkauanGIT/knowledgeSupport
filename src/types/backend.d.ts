// Types for the bridge to knowledgeSupport-api (exposed by preload as window.backendAPI).

import type {
  ApiResult,
  AppConfig,
  CalledAnalysisResponse,
  CalledFilter,
  CalledResponse,
  ChatwootMessageResponse,
  DocumentChunk,
  DocumentMeta,
  FeedbackResponse,
  FoundChunk,
  GapReportResponse,
  JiraSettings,
  JiraSettingsInput,
  RelatedCalled,
  StandardAccuracyResponse,
  StandardRequest,
  StandardResponse,
} from '../api/types'

declare global {
  interface Window {
    backendAPI: {
      getConfig: () => Promise<AppConfig>
      setConfig: (patch: Partial<AppConfig>) => Promise<AppConfig>

      getJiraSettings: () => Promise<ApiResult<JiraSettings>>
      setJiraSettings: (body: JiraSettingsInput) => Promise<ApiResult<JiraSettings>>

      listCalleds: (filter?: CalledFilter) => Promise<ApiResult<CalledResponse[]>>
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

      selectDocFiles: () => Promise<ApiResult<string[]>>
      uploadDocument: (filePath: string) => Promise<ApiResult<DocumentMeta>>
      listDocuments: () => Promise<ApiResult<DocumentMeta[]>>
      removeDocument: (id: string) => Promise<ApiResult<void>>
      getDocumentChunks: (docId: string) => Promise<ApiResult<DocumentChunk[]>>
      relatedCalledsForDocument: (docId: string) => Promise<ApiResult<RelatedCalled[]>>
      searchDocumentation: (query: string) => Promise<ApiResult<FoundChunk[]>>

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
