import { Settings as SettingsIcon, Server, Database, Cpu, Activity } from 'lucide-react';

interface SettingsProps {
  wsConnected: boolean;
  totalContacts: number;
  totalCampaigns: number;
  totalMessages: number;
}

export function Settings({ wsConnected, totalContacts, totalCampaigns, totalMessages }: SettingsProps) {
  const items = [
    { icon: Server, label: 'WebSocket Connection', value: wsConnected ? 'Connected' : 'Disconnected', color: wsConnected ? 'text-emerald-400' : 'text-red-400' },
    { icon: Database, label: 'Database', value: 'Supabase (PostgreSQL)', color: 'text-blue-400' },
    { icon: Cpu, label: 'Worker Thread', value: 'Active (8 msg/batch)', color: 'text-amber-400' },
    { icon: Activity, label: 'Dispatch Mode', value: 'Real API (/api/send)', color: 'text-cyan-400' },
  ];

  const stats = [
    { label: 'Total Contacts', value: totalContacts },
    { label: 'Total Campaigns', value: totalCampaigns },
    { label: 'Total Messages', value: totalMessages },
  ];

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          System configuration and infrastructure status
        </p>
      </div>

      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <SettingsIcon className="w-4 h-4 text-[var(--accent-light)]" />
          <h3 className="text-sm font-semibold">System Status</h3>
        </div>
        <div className="space-y-3">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-3 py-2">
                <div className="w-9 h-9 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center">
                  <Icon className="w-4 h-4 text-[var(--text-secondary)]" />
                </div>
                <span className="text-sm text-[var(--text-secondary)] flex-1">{item.label}</span>
                <span className={`text-sm font-medium ${item.color}`}>{item.value}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-4">Data Summary</h3>
        <div className="grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="bg-[var(--bg-primary)] rounded-lg p-4 text-center">
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-3">Architecture Overview</h3>
        <div className="text-sm text-[var(--text-secondary)] space-y-2">
          <p>This dashboard uses a worker-thread pattern for high-frequency message dispatch. A dedicated Web Worker processes messages in batches of 8, sending each message via a real POST request to the <code className="text-[var(--accent-light)]">/api/send</code> endpoint.</p>
          <p>Delivery status updates flow through a simulated WebSocket connection, providing real-time progress tracking. All data persists in a Supabase PostgreSQL database with row-level security enabled.</p>
          <p>The message queue supports pause, resume, and cancel operations, with throughput metrics displayed in messages per second. To connect a real provider, update the <code className="text-[var(--accent-light)]">dispatchRealMessage</code> function in the worker to call your provider's API instead of <code className="text-[var(--accent-light)]">/api/send</code>.</p>
        </div>
      </div>
    </div>
  );
}
