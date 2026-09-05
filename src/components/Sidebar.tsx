import {
  LayoutDashboard,
  Users,
  FileText,
  Radio,
  Settings,
  Activity,
} from 'lucide-react';

export type ViewId = 'dashboard' | 'contacts' | 'templates' | 'broadcast' | 'settings';

interface SidebarProps {
  active: ViewId;
  onNavigate: (view: ViewId) => void;
  wsConnected: boolean;
  activeCampaigns: number;
}

const navItems: { id: ViewId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'contacts', label: 'Contacts', icon: Users },
  { id: 'templates', label: 'Templates', icon: FileText },
  { id: 'broadcast', label: 'Broadcast Queue', icon: Radio },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ active, onNavigate, wsConnected, activeCampaigns }: SidebarProps) {
  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 flex flex-col border-r border-[var(--border)] bg-[var(--bg-secondary)]">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center glow-accent">
            <Radio className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">Pulse</h1>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">
              Comms Platform
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative ${
                isActive
                  ? 'bg-[var(--accent-glow)] text-[var(--accent-light)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-[var(--accent)]" />
              )}
              <Icon className="w-[18px] h-[18px] shrink-0" />
              <span>{item.label}</span>
              {item.id === 'broadcast' && activeCampaigns > 0 && (
                <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--accent)] text-white">
                  {activeCampaigns}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Connection status */}
      <div className="px-4 py-4 border-t border-[var(--border)]">
        <div className="flex items-center gap-2.5 text-xs">
          <span
            className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-[var(--success)] pulse-dot' : 'bg-[var(--error)]'}`}
          />
          <span className="text-[var(--text-secondary)]">
            {wsConnected ? 'WebSocket Connected' : 'Disconnected'}
          </span>
          <Activity className="w-3.5 h-3.5 text-[var(--text-muted)] ml-auto" />
        </div>
      </div>
    </aside>
  );
}
