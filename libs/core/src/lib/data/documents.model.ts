/** ProseMirror document JSON — opaque to everything except the editor. */
export type ProseMirrorDoc = Record<string, unknown>;
export type ProseMirrorStep = Record<string, unknown>;

export interface RwDocument {
  id: string;
  title: string;
  issue_id?: string;
  container_id?: string;
  doc: ProseMirrorDoc;
  version: number;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  /** Latest openable snapshot number. Distinct from `version`, which gates live collab. */
  revision?: number;
  kind?: string;
}

/** One stored snapshot of a document. `doc` is present only when a single revision is fetched. */
export interface RwDocumentRevision {
  id?: string;
  document_id: string;
  number: number;
  doc?: ProseMirrorDoc;
  created_by?: string;
  created_at: string;
}

export interface RwDocumentStepsResponse {
  steps: Array<{ version: number; client_id: string; step: ProseMirrorStep }>;
  version: number;
  /** false means a gap in the step log — refetch the whole document instead of applying steps. */
  ok: boolean;
}

export interface RwDocumentSubmitStepsRequest {
  expected_version: number;
  steps: ProseMirrorStep[];
  client_id: string;
  doc: ProseMirrorDoc;
}
