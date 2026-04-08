// Owns the document-library state (list, load, upload, remove, seed) and the
// loading/error flags the UI needs. Kept deliberately small and framework-light.

import { useCallback, useEffect, useState } from 'react';
import { deleteDocument, listDocuments, seedDocuments, uploadDocument } from '../lib/api';
import type { DocumentInfo } from '../types';

export interface UseDocuments {
  documents: DocumentInfo[];
  loading: boolean;
  error: string | null;
  uploading: boolean;
  seeding: boolean;
  reload: () => Promise<void>;
  upload: (file: File) => Promise<void>;
  remove: (docId: string) => Promise<void>;
  seed: () => Promise<void>;
}

export function useDocuments(): UseDocuments {
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setDocuments(await listDocuments());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const upload = useCallback(async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      await uploadDocument(file);
      setDocuments(await listDocuments());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  }, []);

  const remove = useCallback(async (docId: string) => {
    setError(null);
    // Optimistic removal, with reconciliation against the server on success.
    const previous = documents;
    setDocuments((docs) => docs.filter((d) => d.doc_id !== docId));
    try {
      await deleteDocument(docId);
      setDocuments(await listDocuments());
    } catch (err) {
      setDocuments(previous); // rollback
      setError((err as Error).message);
    }
  }, [documents]);

  const seed = useCallback(async () => {
    setSeeding(true);
    setError(null);
    try {
      await seedDocuments();
      setDocuments(await listDocuments());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSeeding(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { documents, loading, error, uploading, seeding, reload, upload, remove, seed };
}
