// Thin API layer over the FastAPI backend. Each call unwraps the
// { success, data, message } envelope and throws Error(message) on failure,
// so components/hooks only deal with plain data or a thrown error.

import axios, { AxiosError } from 'axios';
import type {
  AnswerData,
  ApiResponse,
  DocumentInfo,
  HealthData,
  IngestResult,
  SeedResult,
} from '../types';

// In dev this is '' and Vite proxies /api → :8000. In prod set VITE_API_BASE_URL.
const baseURL = import.meta.env.VITE_API_BASE_URL ?? '';

const client = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

/** Pull a human-readable message out of an Axios error, falling back sensibly. */
function toError(err: unknown, fallback: string): Error {
  const axiosErr = err as AxiosError<ApiResponse<unknown>>;
  const fromBody = axiosErr.response?.data?.message;
  if (typeof fromBody === 'string' && fromBody.length > 0) return new Error(fromBody);
  if (axiosErr.message) return new Error(axiosErr.message);
  return new Error(fallback);
}

export async function getHealth(): Promise<HealthData> {
  try {
    const { data } = await client.get<ApiResponse<HealthData>>('/api/health');
    return data.data;
  } catch (err) {
    throw toError(err, 'Could not reach the service.');
  }
}

export async function listDocuments(): Promise<DocumentInfo[]> {
  try {
    const { data } = await client.get<ApiResponse<DocumentInfo[]>>('/api/documents');
    return data.data;
  } catch (err) {
    throw toError(err, 'Could not load the document library.');
  }
}

export async function uploadDocument(file: File): Promise<IngestResult> {
  const form = new FormData();
  form.append('file', file);
  try {
    const { data } = await client.post<ApiResponse<IngestResult>>(
      '/api/documents/upload',
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data.data;
  } catch (err) {
    throw toError(err, `Could not ingest "${file.name}".`);
  }
}

export async function deleteDocument(docId: string): Promise<void> {
  try {
    await client.delete<ApiResponse<{ doc_id: string }>>(`/api/documents/${docId}`);
  } catch (err) {
    throw toError(err, 'Could not remove the document.');
  }
}

export async function seedDocuments(): Promise<SeedResult> {
  try {
    const { data } = await client.post<ApiResponse<SeedResult>>('/api/documents/seed');
    return data.data;
  } catch (err) {
    throw toError(err, 'Could not load the sample documents.');
  }
}

export async function askQuestion(question: string, topK?: number): Promise<AnswerData> {
  try {
    const { data } = await client.post<ApiResponse<AnswerData>>('/api/query', {
      question,
      top_k: topK,
    });
    return data.data;
  } catch (err) {
    throw toError(err, 'Could not generate an answer.');
  }
}
