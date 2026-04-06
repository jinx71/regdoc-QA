// Application root: fetches service health on mount, owns the responsive drawer
// state, and composes the header, document library, and chat view.

import { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatView } from './components/ChatView';
import { AlertIcon } from './components/Icons';
import { useDocuments } from './hooks/useDocuments';
import { useChat } from './hooks/useChat';
import { getHealth } from './lib/api';
import type { HealthData } from './types';

export default function App() {
  const docs = useDocuments();
  const chat = useChat();
  const [health, setHealth] = useState<HealthData | null>(null);
  const [mobileLibraryOpen, setMobileLibraryOpen] = useState(false);

  useEffect(() => {
    getHealth()
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  const hasDocuments = docs.documents.length > 0;
  const keyMissing = health !== null && !health.key_configured;

  return (
    <div className="flex h-full flex-col">
      <Header health={health} onToggleLibrary={() => setMobileLibraryOpen(true)} />

      <div className="flex min-h-0 flex-1">
        <Sidebar
          docs={docs}
          open={mobileLibraryOpen}
          onClose={() => setMobileLibraryOpen(false)}
        />

        <main className="flex min-w-0 flex-1 flex-col">
          {keyMissing && (
            <div className="flex items-start gap-2 border-b border-warn/20 bg-warn-soft px-4 py-2.5 text-sm text-warn sm:px-6">
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                No Anthropic API key is configured on the backend. You can still add and browse
                documents, but answering questions requires <code className="font-mono">ANTHROPIC_API_KEY</code>.
              </span>
            </div>
          )}
          <div className="min-h-0 flex-1">
            <ChatView chat={chat} hasDocuments={hasDocuments} />
          </div>
        </main>
      </div>
    </div>
  );
}
