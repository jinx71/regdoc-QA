# RegDoc Q&A — Frontend

React 18 + TypeScript + Vite single-page app. A two-pane workspace: a document
library on the left and a citation-aware Q&A chat on the right.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
```

The dev server proxies `/api` to `http://localhost:8000`, so run the backend
alongside it. No CORS configuration is needed locally.

## Scripts

| Script             | Does |
|--------------------|------|
| `npm run dev`      | Start the Vite dev server |
| `npm run build`    | Type-check (`tsc -b`) then build for production |
| `npm run type-check` | Type-check only |
| `npm run preview`  | Preview the production build |

## Production

Set the backend origin and build:

```bash
# .env
VITE_API_BASE_URL=https://your-backend-host
```

```bash
npm run build      # outputs to dist/
```

Deploy `dist/` to any static host (Vercel, Netlify, S3, …).

## Structure

```
src/
├── App.tsx                 # health check, layout, drawer state
├── main.tsx                # React entrypoint
├── index.css               # Tailwind + base styles + reduced-motion
├── components/
│   ├── Header.tsx          # wordmark, model/key status, mobile menu
│   ├── Sidebar.tsx         # document library (responsive drawer)
│   ├── UploadDropzone.tsx  # drag-and-drop / browse
│   ├── DocumentItem.tsx    # one library row
│   ├── ChatView.tsx        # thread, empty state, composer
│   ├── Message.tsx         # one Q&A turn
│   ├── CitationMarker.tsx  # the signature [n] citation chip
│   ├── SourceCard.tsx      # a retrieved source with relevance bar
│   └── Icons.tsx           # inline SVG icons (no icon library)
├── hooks/
│   ├── useDocuments.ts     # library state & operations
│   └── useChat.ts          # Q&A thread state
├── lib/
│   ├── api.ts              # axios client; unwraps the response envelope
│   └── citations.ts        # parses answer text into text + [n] segments
└── types/index.ts          # shared types mirroring the API
```

## Design notes

The interface is intentionally quiet — a "controlled document workspace" — so the
one reserved accent (a verified-green, monospace **citation marker**) stands out.
Clicking a marker highlights and scrolls to the source it refers to, making every
claim traceable. Motion is subtle and fully disabled under
`prefers-reduced-motion`.
