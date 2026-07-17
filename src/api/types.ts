// Tipos espelhando os DTOs da knowledgeSupport-api (fonte: /v3/api-docs).
// Se a API mudar um contrato, este arquivo é o ÚNICO lugar de tipos a atualizar.

export type IncidentType = 'ALERT' | 'ERROR'
export type FilterCategory = 'SUPPORT' | 'INFRASTRUCTURE' | 'DEVELOPMENT' | 'PENDING'
export type Confidence = 'CONFIRMED' | 'LIKELY' | 'UNCERTAIN' | 'NONE'

export interface AppConfig {
  apiUrl: string
  apiKey: string
}

// ---------- Jira settings (GET/PUT /api/settings/jira) ----------

/** Config do Jira retornada pela API. O token nunca vem — só se está configurado. */
export interface JiraSettings {
  baseUrl: string
  email: string
  jql: string
  tokenConfigured: boolean
}

/** Corpo do PUT. Campos em branco preservam o valor atual; token opcional. */
export interface JiraSettingsInput {
  baseUrl: string
  email: string
  jql: string
  apiToken?: string
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string }

// ---------- Standards ----------

export interface InvestigationStep {
  hypothesis: string
  query: string
  verification: string
  confirmed: boolean
}

export interface StandardRequest {
  standardName: string
  text: string
  result: string
  incidentType: IncidentType
  routineNumber: number | null
  investigationSteps: InvestigationStep[]
}

export interface StandardResponse {
  id: string
  standardName: string
  text: string
  result: string
  incidentType: IncidentType
  routineNumber: number | null
  investigationSteps: InvestigationStep[]
}

export interface StandardAccuracyResponse {
  standardId: string
  totalFeedbacks: number
  resolvedCount: number
  accuracyRate: number
}

// ---------- Calleds ----------

export interface CalledResponse {
  jiraKey: string
  titleCalled: string
  descriptionCalled: string | null
  routineNumber: number | null
  errorName: string | null
  incidentType: IncidentType
  filterCategory: FilterCategory
  status: string | null
  requesterName: string | null
  createdAt: string
  deadline: string | null
  updateAt: string
}

export interface CalledAnalysisResponse {
  titleCalled: string
  routineNumber: number | null
  solution: string | null
  method: string
  score: number
  confidence: Confidence
  /** Ainda não exposto pela API — necessário para o feedback. Ver pendências no README. */
  standardId?: string
}

export interface FeedbackResponse {
  id: string
  jiraKey: string
  standardId: string
  resolved: boolean
  createdAt: string
}

// ---------- Gap report ----------

export interface RoutineGapResponse {
  routineNumber: number | null
  count: number
}

export interface GapReportResponse {
  totalCalledsAnalyzed: number
  totalWithoutMatch: number
  gapsByRoutine: RoutineGapResponse[]
}
