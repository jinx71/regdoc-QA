// Drag-and-drop (or click-to-browse) zone for adding PDF / TXT / MD documents.

import { useRef, useState } from 'react';
import { UploadIcon } from './Icons';

interface UploadDropzoneProps {
  onFile: (file: File) => void;
  uploading: boolean;
  disabled?: boolean;
}

const ACCEPT = '.pdf,.txt,.md';

export function UploadDropzone({ onFile, uploading, disabled }: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const pick = () => {
    if (!disabled && !uploading) inputRef.current?.click();
  };

  const handleFiles = (files: FileList | null) => {
    if (files && files.length > 0) onFile(files[0]);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={pick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          pick();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (!disabled && !uploading) handleFiles(e.dataTransfer.files);
      }}
      aria-disabled={disabled || uploading}
      className={[
        'flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed',
        'px-3 py-5 text-center transition-colors duration-150 focus:outline-none',
        'focus-visible:ring-2 focus-visible:ring-brand-bright',
        dragging ? 'border-brand-bright bg-brand/5' : 'border-line bg-paper hover:border-brand-bright',
        disabled || uploading ? 'cursor-not-allowed opacity-60' : '',
      ].join(' ')}
    >
      <UploadIcon className="mb-1.5 h-5 w-5 text-brand-bright" />
      <p className="text-sm font-medium text-ink">
        {uploading ? 'Ingesting…' : 'Add documents'}
      </p>
      <p className="mt-0.5 text-xs text-ink-faint">Drop a file or browse · PDF, TXT, MD</p>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = ''; // allow re-selecting the same file
        }}
      />
    </div>
  );
}
