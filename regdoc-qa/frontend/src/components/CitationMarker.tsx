// The signature element of the UI: an inline citation marker rendered as a
// monospace "document-control reference tag". This is the one bold accent in an
// otherwise quiet interface, so it always uses the reserved verify-green colour.

interface CitationMarkerProps {
  n: number;
  active: boolean;
  filename?: string;
  onActivate: (n: number) => void;
}

export function CitationMarker({ n, active, filename, onActivate }: CitationMarkerProps) {
  return (
    <button
      type="button"
      onClick={() => onActivate(n)}
      title={filename ? `Source ${n} — ${filename}` : `Source ${n}`}
      aria-label={filename ? `Jump to source ${n}, ${filename}` : `Jump to source ${n}`}
      className={[
        'mx-0.5 inline-flex h-[1.15rem] min-w-[1.15rem] items-center justify-center rounded',
        'px-1 align-[0.05em] font-mono text-[0.7rem] font-semibold leading-none',
        'border transition-colors duration-150 focus:outline-none focus-visible:ring-2',
        'focus-visible:ring-verify-ring',
        active
          ? 'border-verify bg-verify text-white'
          : 'border-verify-ring bg-verify-soft text-verify-ink hover:bg-verify hover:text-white',
      ].join(' ')}
    >
      {n}
    </button>
  );
}
