// The document library. Static left column on desktop; a slide-in drawer with a
// backdrop on smaller screens (toggled from the header).

import { UploadDropzone } from './UploadDropzone';
import { DocumentItem } from './DocumentItem';
import { CloseIcon, DatabaseIcon } from './Icons';
import type { UseDocuments } from '../hooks/useDocuments';

interface SidebarProps {
  docs: UseDocuments;
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ docs, open, onClose }: SidebarProps) {
  return (
    <>
      {/* Backdrop (mobile only) */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-ink/30 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-40 flex w-80 max-w-[85vw] flex-col border-r border-line bg-paper',
          'transition-transform duration-200 ease-out lg:static lg:z-auto lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3 lg:hidden">
          <span className="font-display text-sm font-semibold text-ink">Document library</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close library"
            className="rounded p-1 text-ink-faint hover:bg-line/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
          <UploadDropzone onFile={docs.upload} uploading={docs.uploading} />

          <button
            type="button"
            onClick={docs.seed}
            disabled={docs.seeding}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-brand/25 bg-brand/5 px-3 py-2 text-sm font-medium text-brand transition-colors hover:bg-brand/10 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright"
          >
            <DatabaseIcon className="h-4 w-4" />
            {docs.seeding ? 'Loading samples…' : 'Load sample SOPs'}
          </button>

          {docs.error && (
            <p className="rounded-md bg-warn-soft px-3 py-2 text-xs text-warn">{docs.error}</p>
          )}

          <div className="mt-1 flex items-center justify-between">
            <h3 className="font-mono text-[0.7rem] font-semibold uppercase tracking-wider text-ink-faint">
              In library
            </h3>
            <span className="font-mono text-[0.7rem] text-ink-faint">{docs.documents.length}</span>
          </div>

          {docs.loading ? (
            <p className="px-1 text-sm text-ink-faint">Loading…</p>
          ) : docs.documents.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line px-3 py-4 text-center text-xs text-ink-faint">
              No documents yet. Add your own or load the sample SOPs to start asking questions.
            </p>
          ) : (
            <ul className="space-y-2">
              {docs.documents.map((doc) => (
                <DocumentItem key={doc.doc_id} doc={doc} onRemove={docs.remove} />
              ))}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
}
