// One row in the document library: filename, chunk/page counts, and a remove button.

import { FileTextIcon, LayersIcon, TrashIcon } from './Icons';
import type { DocumentInfo } from '../types';

interface DocumentItemProps {
  doc: DocumentInfo;
  onRemove: (docId: string) => void;
}

export function DocumentItem({ doc, onRemove }: DocumentItemProps) {
  return (
    <li className="group flex items-start gap-2.5 rounded-lg border border-line bg-surface px-3 py-2.5 shadow-card">
      <FileTextIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink" title={doc.filename}>
          {doc.filename}
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 font-mono text-[0.7rem] text-ink-faint">
          <LayersIcon className="h-3 w-3" />
          {doc.chunks} chunk{doc.chunks === 1 ? '' : 's'}
          {doc.pages > 0 && <span>· {doc.pages} pp.</span>}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onRemove(doc.doc_id)}
        aria-label={`Remove ${doc.filename}`}
        title="Remove"
        className="rounded p-1 text-ink-faint opacity-0 transition-opacity hover:bg-warn-soft hover:text-warn focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-warn/40 group-hover:opacity-100"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </li>
  );
}
