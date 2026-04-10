// Types that mirror the backend's { success, data, message } API contract.

/** Standard response envelope returned by every endpoint. */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

/** A document currently stored in the vector library. */
export interface DocumentInfo {
  doc_id: string;
  filename: string;
  chunks: number;
  pages: number;
  uploaded_at: string;
}

/** A retrieved chunk used to ground an answer; rendered as a numbered source. */
export interface Source {
  id: number; // 1-based index used for inline [n] citations
  doc_id: string;
  filename: string;
  page: number | null;
  chunk_index: number;
  snippet: string;
  relevance: number; // 0..1
  cited: boolean; // whether the answer referenced this source by [n]
}

/** Payload returned by the Q&A endpoint. */
export interface AnswerData {
  answer: string;
  sources: Source[];
  model: string;
  grounded: boolean; // false when the library had no documents to search
}

/** Result of ingesting a single document. */
export interface IngestResult {
  doc_id: string;
  filename: string;
  chunks: number;
  pages: number;
}

/** Result of seeding the bundled sample SOPs. */
export interface SeedResult {
  ingested: IngestResult[];
  skipped: string[];
}

/** Service health + configuration snapshot. */
export interface HealthData {
  status: string;
  model: string;
  key_configured: boolean;
}

/** One question/answer exchange in the chat thread. */
export interface ChatTurn {
  id: string;
  question: string;
  answer: AnswerData | null;
  error: string | null;
  pending: boolean;
}
