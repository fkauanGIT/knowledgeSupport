// Tipos da ponte com a knowledgeSupport-api (exposta pelo preload como window.backendAPI).

import type {
  ApiResult,
  AppConfig,
  CalledAnalysisResponse,
  CalledResponse,
  FeedbackResponse,
  GapReportResponse,
  JiraSettings,
  JiraSettingsInput,
  StandardAccuracyResponse,
  StandardRequest,
  StandardResponse,
} from '../api/types'

declare global {
  interface Window {
    backendAPI: {
      getConfig: () => Promise<AppConfig>
      setConfig: (config: AppConfig) => Promise<AppConfig>

      getJiraSettings: () => Promise<ApiResult<JiraSettings>>
      setJiraSettings: (body: JiraSettingsInput) => Promise<ApiResult<JiraSettings>>

      listCalleds: () => Promise<ApiResult<CalledResponse[]>>
      analyzeCalled: (key: string) => Promise<ApiResult<CalledAnalysisResponse>>
      sendFeedback: (
        key: string,
        body: { standardId: string; resolved: boolean },
      ) => Promise<ApiResult<FeedbackResponse>>
      gapReport: () => Promise<ApiResult<GapReportResponse>>

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
