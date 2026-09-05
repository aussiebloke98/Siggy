import { useState, useEffect } from 'react';
import { Sidebar, type ViewId } from '@/components/Sidebar';
import { Dashboard } from '@/components/Dashboard';
import { Contacts } from '@/components/Contacts';
import { Templates } from '@/components/Templates';
import { BroadcastQueue } from '@/components/BroadcastQueue';
import { Settings } from '@/components/Settings';
import { useWebSocketStatus } from '@/hooks/useWebSocketStatus';
import { useBroadcastQueue } from '@/hooks/useBroadcastQueue';
import { useContacts, useTemplates } from '@/hooks/useData';

function App() {
  const [view, setView] = useState<ViewId>('dashboard');
  const wsConnected = useWebSocketStatus();
  const { contacts, loading: contactsLoading } = useContacts();
  const { templates, loading: templatesLoading } = useTemplates();
  const {
    campaigns,
    loading: campaignsLoading,
    progress,
    liveFeed,
    launchCampaign,
    pauseCampaign,
    resumeCampaign,
    cancelCampaign,
    createCampaign,
    deleteCampaign,
  } = useBroadcastQueue();

  const activeCampaigns = campaigns.filter((c) => c.status === 'sending' || c.status === 'queued').length;
  const totalMessages = campaigns.reduce((s, c) => s + c.total, 0);

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)]">
      <Sidebar
        active={view}
        onNavigate={setView}
        wsConnected={wsConnected}
        activeCampaigns={activeCampaigns}
      />
      <main className="flex-1 overflow-y-auto h-screen">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {view === 'dashboard' && (
            <Dashboard
              campaigns={campaigns}
              contacts={contacts}
              templates={templates}
              progress={progress}
              liveFeed={liveFeed}
              onNavigate={(v) => setView(v as ViewId)}
            />
          )}
          {view === 'contacts' && <Contacts />}
          {view === 'templates' && <Templates />}
          {view === 'broadcast' && (
            <BroadcastQueue
              campaigns={campaigns}
              contacts={contacts}
              templates={templates}
              progress={progress}
              liveFeed={liveFeed}
              onCreateCampaign={createCampaign}
              onLaunch={launchCampaign}
              onPause={pauseCampaign}
              onResume={resumeCampaign}
              onCancel={cancelCampaign}
              onDelete={deleteCampaign}
            />
          )}
          {view === 'settings' && (
            <Settings
              wsConnected={wsConnected}
              totalContacts={contacts.length}
              totalCampaigns={campaigns.length}
              totalMessages={totalMessages}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
