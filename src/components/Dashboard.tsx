import type { Campaign, Contact, Template } from '@/types';
import {
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Users,
  FileText,
  Radio,
} from 'lucide-react';
import type { CampaignProgress } from '@/hooks/useBroadcastQueue';

interface DashboardProps {
  campaigns: Campaign[];
  contacts: Contact[];
  templates: Template[];
  progress: Record<string, CampaignProgress>;
  liveFeed: { campaignId: string; messageId: string; status: string; timestamp: number }[];
  onNavigate: (view: string) => void;
}

export function Dashboard({ campaigns, contacts, templates, progress, liveFeed, onNavigate }: DashboardProps) {
  const totalSent = campaigns.reduce((s, c) => s + c.sent, 0);
  const totalDelivered = campaigns.reduce((s, c) => s + c.delivered, 0);
  const totalFailed = campaigns.reduce((s, c) => s + c.failed, 0);
  const activeCampaigns = campaigns.filter((c) => c.status === 'sending' || c.status === 'queued');
  const deliveryRate = totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0;

  const stats = [
    { label: 'Total Contacts', value: contacts.length, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Templates', value: templates.length, icon: FileText, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { label: 'Messages Sent', value: totalSent, icon: Send, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Delivery Rate', value: `${deliveryRate}%`, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  ];

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Real-time overview of your communication infrastructure
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="glass-card rounded-xl p-5 gradient-border hover:border-[var(--border-light)] transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <p className="text-3xl font-bold count-up">{stat.value}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1 uppercase tracking-wider">
                {stat.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Active campaigns + Live feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Active campaigns */}
        <div className="lg:col-span-2 glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-[var(--accent-light)]" />
              <h3 className="text-sm font-semibold">Active Dispatches</h3>
            </div>
            <button
              onClick={() => onNavigate('broadcast')}
              className="text-xs text-[var(--accent-light)] hover:underline"
            >
              View all →
            </button>
          </div>

          {activeCampaigns.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-muted)]">
              <Radio className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No active dispatches running</p>
              <button
                onClick={() => onNavigate('broadcast')}
                className="text-xs text-[var(--accent-light)] hover:underline mt-2"
              >
                Launch a broadcast →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {activeCampaigns.map((c) => {
                const p = progress[c.id];
                const pct = p && p.total > 0 ? Math.round((p.processed / p.total) * 100) : 0;
                return (
                  <div key={c.id} className="bg-[var(--bg-tertiary)] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{c.name}</span>
                      {p?.active && (
                        <span className="text-xs text-amber-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 pulse-dot" />
                          {p.throughput} msg/s
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)] mb-2">
                      <span className="flex items-center gap-1">
                        <Send className="w-3 h-3" /> {p?.processed ?? c.sent}/{p?.total ?? c.total}
                      </span>
                      <span className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" /> {p?.delivered ?? c.delivered}
                      </span>
                      <span className="flex items-center gap-1 text-red-400">
                        <XCircle className="w-3 h-3" /> {p?.failed ?? c.failed}
                      </span>
                    </div>
                    <div className="h-1.5 bg-[var(--bg-primary)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Live feed */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-[var(--success)] pulse-dot" />
            <h3 className="text-sm font-semibold">Live Delivery Feed</h3>
          </div>
          {liveFeed.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-muted)]">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Waiting for events...</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[320px] overflow-y-auto">
              {liveFeed.map((entry, i) => (
                <div
                  key={`${entry.messageId}-${i}`}
                  className="flex items-center gap-2 text-xs slide-in-right py-1.5 px-2 rounded-md hover:bg-[var(--bg-hover)]"
                >
                  {entry.status === 'delivered' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  )}
                  <span className="text-[var(--text-secondary)] truncate flex-1">
                    {entry.status === 'delivered' ? 'Delivered' : 'Failed'}
                  </span>
                  <span className="text-[var(--text-muted)] font-mono text-[10px]">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent campaigns */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-4">Recent Campaigns</h3>
        {campaigns.length === 0 ? (
          <div className="text-center py-8 text-[var(--text-muted)]">
            <p className="text-sm">No campaigns yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {campaigns.slice(0, 5).map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                onClick={() => onNavigate('broadcast')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center">
                    <Send className="w-4 h-4 text-[var(--text-secondary)]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {c.total} recipients · {new Date(c.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-emerald-400">{c.delivered} delivered</span>
                  <span className="text-red-400">{c.failed} failed</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
