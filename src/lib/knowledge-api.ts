import { getToken } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

export type KnowledgeUploadResponse = {
  document_id: number;
  filename: string;
  doc_type: string;
  ingestion_status: string;
  job_id?: number | null;
  message: string;
};

export type KnowledgeJobStatus = {
  job_id: number;
  document_id: number;
  job_type: string;
  status: string;
  progress_pct: number;
  error_message?: string | null;
};

export type KnowledgeDocumentSummary = {
  document_id: number;
  tenant_id: string;
  filename: string;
  storage_filename: string;
  doc_type: string;
  ingestion_status: string;
  page_count: number | null;
  file_size_bytes: number | null;
  entity_count: number;
  pending_approval_count: number;
  doc_class: string | null;
  label: string | null;
  avg_confidence: number | null;
  processing_time_ms: number | null;
  created_at: string;
};

export type KnowledgeEntityReviewItem = {
  entity_id: number;
  entity_type: string;
  name: string;
  description: string | null;
  attributes: Record<string, unknown>;
  raw_text: string | null;
  approval_status: "pending" | "approved" | "rejected" | "edited";
  embed_status: string | null;
  document_id: number | null;
  confidence: number | null;
  confidence_score: number | null;
  extraction_tier: string | null;
  needs_review: boolean;
  source_page: number | null;
  created_at: string;
};

export type KnowledgeDocumentDetail = {
  document: Omit<KnowledgeDocumentSummary, "document_id"> & {
    id: number;
    document_id?: number;
    doc_category?: string | null;
    ingestion_meta?: Record<string, unknown> | null;
  };
  entities: KnowledgeEntityReviewItem[];
};

export type WebsiteAnalysisStatus = {
  analysis_id: number;
  tenant_id: string;
  url: string;
  status: "pending" | "running" | "completed" | "failed";
  pages_explored: number | null;
  total_entries_generated: number | null;
  website_type: string | null;
  error_message: string | null;
};

export type WebsiteKnowledgeEntry = {
  id: number;
  tenant_id: string;
  analysis_id: number | null;
  question: string;
  answer: string;
  display_title: string | null;
  entry_type: string | null;
  structured_data: Record<string, unknown> | null;
  tags: string[] | null;
  category: string | null;
  source_url: string | null;
  source_path: string | null;
  confidence: number | null;
  status: "draft" | "approved" | "rejected";
  embed_status: string;
  qdrant_point_id: string | null;
  created_at: string;
  updated_at: string;
};

export type WebsiteEntryPatch = {
  question?: string;
  answer?: string;
  display_title?: string;
  entry_type?: string;
  tags?: string[];
  category?: string;
};

export type RetrievalTestResult = {
  source: string;
  entity_type: string | null;
  entity_id: number | null;
  name: string | null;
  content: string;
  score: number | null;
  attributes: Record<string, unknown>;
};

export type RetrievalTestResponse = {
  query: string;
  results: RetrievalTestResult[];
  routed_to: string;
  retrieval_mode: string | null;
  ai_preview: string | null;
  answer: string | null;
  latency_ms: number;
  elapsed_ms: number | null;
  total_results: number;
};

function baseUrl(path: string) {
  if (!API_BASE) throw new Error("NEXT_PUBLIC_API_BASE is not configured");
  return `${API_BASE}${path}`;
}

export function knowledgeDocumentPreviewUrl(doc: Pick<KnowledgeDocumentSummary, "document_id">) {
  if (!API_BASE) return "";
  return `${API_BASE}/admin/knowledge/documents/${encodeURIComponent(doc.document_id)}/preview`;
}

function optionalAuthHeaders(extra?: HeadersInit) {
  const headers = new Headers(extra);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return headers;
}

async function readJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!res.ok) {
    const message =
      body && typeof body === "object"
        ? (body as { detail?: string; message?: string }).detail ||
          (body as { detail?: string; message?: string }).message
        : undefined;
    throw new Error(message || `HTTP ${res.status}`);
  }

  return body as T;
}

export async function uploadKnowledgeCatalogue(
  file: File,
  label?: string,
  docCategory?: string,
) {
  const form = new FormData();
  form.append("file", file);
  if (docCategory?.trim()) form.append("doc_category", docCategory.trim());
  if (label?.trim()) form.append("label", label.trim());

  const res = await fetch(baseUrl("/admin/knowledge/documents/upload"), {
    method: "POST",
    headers: optionalAuthHeaders(),
    body: form,
  });

  return readJson<KnowledgeUploadResponse>(res);
}

export async function fetchKnowledgeDocumentPreview(documentId: number) {
  const res = await fetch(baseUrl(`/admin/knowledge/documents/${documentId}/preview`), {
    headers: optionalAuthHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    await readJson<never>(res);
  }
  return res.blob();
}

export async function getKnowledgeJob(jobId: number) {
  const res = await fetch(baseUrl(`/admin/knowledge/jobs/${jobId}`), {
    headers: optionalAuthHeaders({ Accept: "application/json" }),
    cache: "no-store",
  });

  return readJson<KnowledgeJobStatus>(res);
}

export async function listKnowledgeDocuments() {
  const res = await fetch(baseUrl("/admin/knowledge/documents"), {
    headers: optionalAuthHeaders({ Accept: "application/json" }),
    cache: "no-store",
  });

  return readJson<KnowledgeDocumentSummary[]>(res);
}

export async function getKnowledgeDocument(documentId: number) {
  const res = await fetch(baseUrl(`/admin/knowledge/documents/${documentId}`), {
    headers: optionalAuthHeaders({ Accept: "application/json" }),
    cache: "no-store",
  });

  return readJson<KnowledgeDocumentDetail>(res);
}

export async function listKnowledgeEntities(params: {
  documentId?: number;
  approvalStatus?: string;
  minConfidence?: number;
} = {}) {
  const qs = queryString({
    document_id: params.documentId,
    approval_status: params.approvalStatus,
    min_confidence: params.minConfidence,
  });
  const res = await fetch(baseUrl(`/admin/knowledge/entities${qs}`), {
    headers: optionalAuthHeaders({ Accept: "application/json" }),
    cache: "no-store",
  });

  return readJson<KnowledgeEntityReviewItem[]>(res);
}

export async function approveKnowledgeEntity(entityId: number, patch?: {
  attributes?: Record<string, unknown>;
  description?: string;
}) {
  const res = await fetch(baseUrl(`/admin/knowledge/entities/${entityId}/approve`), {
    method: "POST",
    headers: optionalAuthHeaders({
      Accept: "application/json",
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(patch ?? {}),
  });

  return readJson<{ entity_id: number; status: string; embed_queued?: boolean }>(res);
}

export async function rejectKnowledgeEntity(entityId: number) {
  const res = await fetch(baseUrl(`/admin/knowledge/entities/${entityId}/reject`), {
    method: "POST",
    headers: optionalAuthHeaders({ Accept: "application/json" }),
  });

  return readJson<{ entity_id: number; status: string }>(res);
}

export async function bulkApproveKnowledgeEntities(entityIds: number[]) {
  const res = await fetch(baseUrl("/admin/knowledge/entities/bulk-approve"), {
    method: "POST",
    headers: optionalAuthHeaders({
      Accept: "application/json",
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({ entity_ids: entityIds }),
  });

  return readJson<{ approved: number; embed_queued?: boolean }>(res);
}

export async function editKnowledgeEntity(entityId: number, patch: {
  name?: string;
  description?: string;
  attributes?: Record<string, unknown>;
}) {
  const res = await fetch(baseUrl(`/admin/knowledge/entities/${entityId}`), {
    method: "PUT",
    headers: optionalAuthHeaders({
      Accept: "application/json",
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(patch),
  });

  return readJson<{ entity_id: number; status: string; approval_status: string }>(res);
}

export async function analyzeKnowledgeWebsite(
  url: string,
  maxPages = 12,
  maxRuntimeSeconds = 120,
) {
  const res = await fetch(baseUrl("/admin/knowledge/website/analyze"), {
    method: "POST",
    headers: optionalAuthHeaders({
      Accept: "application/json",
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({
      url,
      max_pages: maxPages,
      max_runtime_seconds: maxRuntimeSeconds,
    }),
  });

  return readJson<WebsiteAnalysisStatus>(res);
}

export async function getKnowledgeWebsiteAnalysis(analysisId: number) {
  const res = await fetch(baseUrl(`/admin/knowledge/website/analyses/${analysisId}`), {
    headers: optionalAuthHeaders({ Accept: "application/json" }),
    cache: "no-store",
  });

  return readJson<WebsiteAnalysisStatus>(res);
}

function queryString(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export async function listWebsiteKnowledgeEntries(params: {
  analysisId?: number;
  status?: string;
  search?: string;
  pageSize?: number;
} = {}) {
  const qs = queryString({
    analysis_id: params.analysisId,
    status: params.status,
    search: params.search,
    page_size: params.pageSize ?? 100,
  });
  const res = await fetch(baseUrl(`/admin/knowledge/website/entries${qs}`), {
    headers: optionalAuthHeaders({ Accept: "application/json" }),
    cache: "no-store",
  });

  return readJson<WebsiteKnowledgeEntry[]>(res);
}

export async function editWebsiteKnowledgeEntry(id: number, patch: WebsiteEntryPatch) {
  const res = await fetch(baseUrl(`/admin/knowledge/website/entries/${id}`), {
    method: "PUT",
    headers: optionalAuthHeaders({
      Accept: "application/json",
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(patch),
  });

  return readJson<WebsiteKnowledgeEntry>(res);
}

export async function approveWebsiteKnowledgeEntry(id: number, patch?: WebsiteEntryPatch) {
  const res = await fetch(baseUrl(`/admin/knowledge/website/entries/${id}/approve`), {
    method: "POST",
    headers: optionalAuthHeaders({
      Accept: "application/json",
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(patch ?? {}),
  });

  return readJson<WebsiteKnowledgeEntry>(res);
}

export async function rejectWebsiteKnowledgeEntry(id: number) {
  const res = await fetch(baseUrl(`/admin/knowledge/website/entries/${id}/reject`), {
    method: "POST",
    headers: optionalAuthHeaders({ Accept: "application/json" }),
  });

  return readJson<WebsiteKnowledgeEntry>(res);
}

export async function bulkApproveWebsiteKnowledgeEntries(entryIds: number[]) {
  const res = await fetch(baseUrl("/admin/knowledge/website/entries/bulk-approve"), {
    method: "POST",
    headers: optionalAuthHeaders({
      Accept: "application/json",
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({ entry_ids: entryIds }),
  });

  return readJson<{ approved: number; embed_queued?: boolean }>(res);
}

export async function bulkRejectWebsiteKnowledgeEntries(entryIds: number[]) {
  const res = await fetch(baseUrl("/admin/knowledge/website/entries/bulk-reject"), {
    method: "POST",
    headers: optionalAuthHeaders({
      Accept: "application/json",
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({ entry_ids: entryIds }),
  });

  return readJson<{ rejected: number }>(res);
}

export async function testKnowledgeRetrieval(query: string, topK = 5) {
  const res = await fetch(baseUrl("/admin/knowledge/test-retrieval"), {
    method: "POST",
    headers: optionalAuthHeaders({
      Accept: "application/json",
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({
      query,
      top_k: topK,
      retrieval_mode: "auto",
    }),
  });

  return readJson<RetrievalTestResponse>(res);
}
