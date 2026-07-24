// Types mirroring the knowledgeSupport-api DTOs (source: /v3/api-docs).
// If the API changes a contract, this is the ONLY types file to update.

export type IncidentType = 'ALERT' | 'ERROR'
export type FilterCategory = 'SUPPORT' | 'INFRASTRUCTURE' | 'DEVELOPMENT' | 'PENDING'
export type Confidence = 'CONFIRMED' | 'LIKELY' | 'UNCERTAIN' | 'NONE'

export interface AppConfig {
  apiUrl: string
  apiKey: string
  chatwootUrl: string
  chatwootAccountId: string
  chatwootToken: string
}

// ---------- Chatwoot (separate integration from knowledgeSupport-api) ----------

/** Chatwoot API response when creating a message — only the fields we use. */
export interface ChatwootMessageResponse {
  id: number
  content: string
}

// ---------- Jira settings (GET/PUT /api/settings/jira) ----------

/** Jira config returned by the API. The token never comes back — only whether it's set. */
export interface JiraSettings {
  baseUrl: string
  email: string
  jql: string
  tokenConfigured: boolean
}

/** PUT body. Blank fields preserve the current value; token is optional. */
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

/** Filters accepted by GET /api/calleds — become query params, all optional. */
export interface CalledFilter {
  createdFrom?: string
  createdTo?: string
  onlyOpen?: boolean
  assignee?: string
}

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
  assigneeName: string | null
  createdAt: string
  deadline: string | null
  updateAt: string
  resolvedAt: string | null
}

export interface CalledAnalysisResponse {
  titleCalled: string
  routineNumber: number | null
  solution: string | null
  method: string
  score: number
  confidence: Confidence
  /** Not exposed by the API yet — needed for feedback. See open items in the README. */
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

// ---------- Documentation (indexing and search in knowledgeSupport-api) ----------

export interface DocumentMeta {
  id: string
  name: string
  type: 'pdf' | 'docx'
  totalChunks: number
  status: 'indexed' | 'failed'
  error?: string
  indexedAt: string
}

export interface FoundChunk {
  docId: string
  docName: string
  page: number | null
  text: string
  relevance: number
}

export interface DocumentChunk {
  page: number | null
  text: string
}

export interface RelatedCalled {
  key: string
  relevance: number
}
