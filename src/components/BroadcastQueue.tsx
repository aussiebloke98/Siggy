import { useState, useMemo } from 'react';
import {
  Radio,
  Plus,
  Play,
  Pause,
  Square,
  Trash2,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  X,
  Users,
  Calendar,
} from 'lucide-react';
import type { Campaign, Contact, Template } from '@/types';
import type { CampaignProgress } from '@/hooks/useBroadcastQueue';
import { StatusBadge } from './StatusBadge';

interface BroadcastQueueProps {
  campaigns: Campaign[];
  contacts: Contact[];
  templates: Template[];
  progress: Record<string, CampaignProgress>;
  liveFeed: { campaignId: string; messageId: string; status: string; timestamp: number }[];
  onCreateCampaign: (name: string, templateId: string, scheduledAt: string | null, contactIds: string[]) => Promise<string | null>;
  onLaunch: (campaignId: string) => Promise<void>;
  onPause: (campaignId: string) => void;
  onResume: (campaignId: string) => void;
  onCancel: (campaignId: string) => Promise<void>;
  onDelete: (campaignId: string) => Promise<void>;
}

export function BroadcastQueue({
  campaigns,
  contacts,
  templates,
  progress,
  liveFeed,
  onCreateCampaign,
  onLaunch,
  onPause,
  onResume,
  onCancel,
  onDelete,
}: BroadcastQueueProps) {
  const [showComposer, setShowComposer] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Broadcast Queue</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Compose, schedule, and dispatch mass communications
          </p>
        </div>
        <button
          onClick={() => setShowComposer(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-light)] text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Broadcast
        </button>
      </div>

      {/* Queue stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass-card rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <p className="text-lg font-bold">{campaigns.filter((c) => c.status === 'sending').length}</p>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Active</p>
          </div>
        </div>
        <div className="glass-card rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <p className="text-lg font-bold">{campaigns.filter((c) => c.status === 'scheduled').length}</p>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Scheduled</p>
          </div>
        </div>
        <div className="glass-card rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-lg font-bold">{campaigns.filter((c) => c.status === 'completed').length}</p>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Completed</p>
          </div>
        </div>
        <div className="glass-card rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-500/10 flex items-center justify-center">
            <Send className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <p className="text-lg font-bold">{campaigns.reduce((s, c) => s + c.total, 0)}</p>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Total Msgs</p>
          </div>
        </div>
      </div>

      {/* Campaign list */}
      <div className="glass-card rounded-xl overflow-hidden">
        {campaigns.length === 0 ? (
          <div className="p-12 text-center">
            <Radio className="w-10 h-10 mx-auto mb-3 text-[var(--text-muted)] opacity-40" />
            <p className="text-sm text-[var(--text-muted)] mb-3">No broadcasts yet</p>
            <button
              onClick={() => setShowComposer(true)}
              className="text-sm text-[var(--accent-light)] hover:underline"
            >
              Create your first broadcast →
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {campaigns.map((c) => {
              const p = progress[c.id];
              const pct = p && p.total > 0 ? Math.round((p.processed / p.total) * 100) : 0;
              const template = templates.find((t) => t.id === c.template_id);
              const isSending = c.status === 'sending';
              const isActive = p?.active;

              return (
                <div
                  key={c.id}
                  className="p-4 hover:bg-[var(--bg-hover)] transition-colors group cursor-pointer"
                  onClick={() => setSelectedCampaign(c)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        isSending ? 'bg-amber-500/10' : c.status === 'completed' ? 'bg-emerald-500/10' : 'bg-slate-500/10'
                      }`}>
                        <Radio className={`w-4 h-4 ${
                          isSending ? 'text-amber-400' : c.status === 'completed' ? 'text-emerald-400' : 'text-slate-400'
                        }`} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{c.name}</p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {template?.name ?? 'No template'} · {c.total} recipients
                          {c.scheduled_at && ` · ${new Date(c.scheduled_at).toLocaleString()}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <StatusBadge status={c.status} type="campaign" />
                      {c.status === 'queued' && (
                        <button
                          onClick={() => onLaunch(c.id)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-400 text-xs font-medium hover:bg-emerald-500/25 transition-colors"
                        >
                          <Play className="w-3 h-3" /> Launch
                        </button>
                      )}
                      {isActive && c.status === 'sending' && (
                        <button
                          onClick={() => onPause(c.id)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-400 text-xs font-medium hover:bg-amber-500/25 transition-colors"
                        >
                          <Pause className="w-3 h-3" /> Pause
                        </button>
                      )}
                      {c.status === 'paused' && (
                        <button
                          onClick={() => onResume(c.id)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-400 text-xs font-medium hover:bg-emerald-500/25 transition-colors"
                        >
                          <Play className="w-3 h-3" /> Resume
                        </button>
                      )}
                      {(c.status === 'sending' || c.status === 'paused') && (
                        <button
                          onClick={() => onCancel(c.id)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-500/15 text-red-400 text-xs font-medium hover:bg-red-500/25 transition-colors"
                        >
                          <Square className="w-3 h-3" /> Cancel
                        </button>
                      )}
                      <button
                        onClick={() => onDelete(c.id)}
                        className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-red-400 transition-all p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  {(isSending || c.status === 'paused' || c.status === 'completed') && c.total > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center gap-4 text-xs mb-1.5">
                        <span className="text-[var(--text-secondary)]">
                          {p?.processed ?? c.sent}/{p?.total ?? c.total} processed
                        </span>
                        {isActive && p && (
                          <span className="text-amber-400 flex items-center gap-1">
                            <Zap className="w-3 h-3" /> {p.throughput} msg/s
                          </span>
                        )}
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> {p?.delivered ?? c.delivered}
                        </span>
                        <span className="text-red-400 flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> {p?.failed ?? c.failed}
                        </span>
                        <span className="ml-auto text-[var(--text-muted)]">{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-[var(--bg-primary)] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            c.status === 'completed' ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-500 to-cyan-400'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Composer Modal */}
      {showComposer && (
        <BroadcastComposer
          contacts={contacts}
          templates={templates}
          onClose={() => setShowComposer(false)}
          onCreate={async (name, templateId, scheduledAt, contactIds) => {
            const id = await onCreateCampaign(name, templateId, scheduledAt, contactIds);
            if (id) setShowComposer(false);
          }}
        />
      )}

      {/* Campaign Detail Modal */}
      {selectedCampaign && (
        <CampaignDetail
          campaign={selectedCampaign}
          progress={progress[selectedCampaign.id]}
          liveFeed={liveFeed.filter((f) => f.campaignId === selectedCampaign.id)}
          templates={templates}
          onClose={() => setSelectedCampaign(null)}
        />
      )}
    </div>
  );
}

// ── Composer ───────────────────────────────────────────────
function BroadcastComposer({
  contacts,
  templates,
  onClose,
  onCreate,
}: {
  contacts: Contact[];
  templates: Template[];
  onClose: () => void;
  onCreate: (name: string, templateId: string, scheduledAt: string | null, contactIds: string[]) => Promise<void>;
}) {
  const [name, setName] = useState('Untitled Broadcast');
  const [templateId, setTemplateId] = useState('');
  const [schedule, setSchedule] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [tagFilter, setTagFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [creating, setCreating] = useState(false);

  const availableContacts = useMemo(() => {
    return contacts.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (tagFilter && !(c.tags ?? []).some((t) => t.toLowerCase().includes(tagFilter.toLowerCase()))) return false;
      return true;
    });
  }, [contacts, tagFilter, statusFilter]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    contacts.forEach((c) => (c.tags ?? []).forEach((t) => set.add(t)));
    return Array.from(set);
  }, [contacts]);

  const toggleContact = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === availableContacts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(availableContacts.map((c) => c.id)));
    }
  };

  const handleCreate = async () => {
    if (!templateId || selectedIds.size === 0) return;
    setCreating(true);
    await onCreate(name, templateId, schedule && scheduledAt ? scheduledAt : null, Array.from(selectedIds));
    setCreating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm fade-in" onClick={onClose}>
      <div
        className="w-full max-w-3xl glass-card rounded-2xl p-6 gradient-border max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-[var(--accent-light)]" />
            <h3 className="text-lg font-semibold">New Broadcast</h3>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">Broadcast Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          {/* Template */}
          <div>
            <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">Message Template</label>
            {templates.length === 0 ? (
              <p className="text-sm text-amber-400 py-2">No templates available. Create a template first.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTemplateId(t.id)}
                    className={`text-left p-3 rounded-lg border transition-colors ${
                      templateId === t.id
                        ? 'bg-[var(--accent-glow)] border-[var(--accent)]'
                        : 'bg-[var(--bg-primary)] border-[var(--border)] hover:border-[var(--border-light)]'
                    }`}
                  >
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      {t.channel.toUpperCase()} · {t.subject || t.body.slice(0, 40)}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Schedule */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={schedule}
                onChange={(e) => setSchedule(e.target.checked)}
                className="accent-blue-500"
              />
              <span className="text-sm flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[var(--text-secondary)]" />
                Schedule for later
              </span>
            </label>
            {schedule && (
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="mt-2 w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--accent)]"
              />
            )}
          </div>

          {/* Contact selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Select Recipients
              </label>
              <span className="text-xs text-[var(--accent-light)] font-medium">
                {selectedIds.size} selected
              </span>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 mb-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2 py-1.5 rounded-md bg-[var(--bg-primary)] border border-[var(--border)] text-xs focus:outline-none focus:border-[var(--accent)]"
              >
                <option value="active">Active Only</option>
                <option value="all">All Statuses</option>
                <option value="unsubscribed">Unsubscribed</option>
                <option value="bounced">Bounced</option>
              </select>
              {allTags.length > 0 && (
                <select
                  value={tagFilter}
                  onChange={(e) => setTagFilter(e.target.value)}
                  className="px-2 py-1.5 rounded-md bg-[var(--bg-primary)] border border-[var(--border)] text-xs focus:outline-none focus:border-[var(--accent)]"
                >
                  <option value="">All Tags</option>
                  {allTags.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              )}
              <button
                onClick={selectAll}
                className="ml-auto text-xs text-[var(--accent-light)] hover:underline"
              >
                {selectedIds.size === availableContacts.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]">
              {availableContacts.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)] text-center py-4">
                  No contacts available. Import contacts first.
                </p>
              ) : (
                availableContacts.map((c) => (
                  <label
                    key={c.id}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-[var(--bg-hover)] cursor-pointer border-b border-[var(--border)] last:border-0"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(c.id)}
                      onChange={() => toggleContact(c.id)}
                      className="accent-blue-500"
                    />
                    <span className="text-sm flex-1">{c.name || 'Unnamed'}</span>
                    <span className="text-xs text-[var(--text-muted)]">{c.email}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      c.status === 'active' ? 'bg-emerald-500/15 text-emerald-400'
                      : c.status === 'unsubscribed' ? 'bg-amber-500/15 text-amber-400'
                      : 'bg-red-500/15 text-red-400'
                    }`}>{c.status}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!templateId || selectedIds.size === 0 || creating}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-light)] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
          >
            <Send className="w-4 h-4" />
            {creating ? 'Creating...' : `Create Broadcast (${selectedIds.size})`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Campaign Detail ─────────────────────────────────────────
function CampaignDetail({
  campaign,
  progress,
  liveFeed,
  templates,
  onClose,
}: {
  campaign: Campaign;
  progress?: CampaignProgress;
  liveFeed: { campaignId: string; messageId: string; status: string; timestamp: number }[];
  templates: Template[];
  onClose: () => void;
}) {
  const template = templates.find((t) => t.id === campaign.template_id);
  const pct = progress && progress.total > 0 ? Math.round((progress.processed / progress.total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm fade-in" onClick={onClose}>
      <div
        className="w-full max-w-2xl glass-card rounded-2xl p-6 gradient-border max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              campaign.status === 'sending' ? 'bg-amber-500/10'
              : campaign.status === 'completed' ? 'bg-emerald-500/10'
              : 'bg-slate-500/10'
            }`}>
              <Radio className={`w-5 h-5 ${
                campaign.status === 'sending' ? 'text-amber-400'
                : campaign.status === 'completed' ? 'text-emerald-400'
                : 'text-slate-400'
              }`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{campaign.name}</h3>
              <p className="text-xs text-[var(--text-muted)]">{template?.name ?? 'No template'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <StatusBadge status={campaign.status} type="campaign" />
          {progress?.active && (
            <span className="text-xs text-amber-400 flex items-center gap-1">
              <Zap className="w-3 h-3" /> {progress.throughput} msg/s
            </span>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="bg-[var(--bg-primary)] rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{progress?.total ?? campaign.total}</p>
            <p className="text-[10px] text-[var(--text-muted)] uppercase">Total</p>
          </div>
          <div className="bg-[var(--bg-primary)] rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-emerald-400">{progress?.delivered ?? campaign.delivered}</p>
            <p className="text-[10px] text-[var(--text-muted)] uppercase">Delivered</p>
          </div>
          <div className="bg-[var(--bg-primary)] rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-red-400">{progress?.failed ?? campaign.failed}</p>
            <p className="text-[10px] text-[var(--text-muted)] uppercase">Failed</p>
          </div>
          <div className="bg-[var(--bg-primary)] rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-amber-400">{progress?.processed ?? campaign.sent}</p>
            <p className="text-[10px] text-[var(--text-muted)] uppercase">Processed</p>
          </div>
        </div>

        {/* Progress bar */}
        {campaign.total > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-[var(--text-secondary)]">Progress</span>
              <span className="text-[var(--text-muted)]">{pct}%</span>
            </div>
            <div className="h-2 bg-[var(--bg-primary)] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  campaign.status === 'completed' ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-500 to-cyan-400'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        {/* Live delivery feed */}
        {liveFeed.length > 0 && (
          <div>
            <h4 className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">Live Delivery Feed</h4>
            <div className="max-h-48 overflow-y-auto rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] p-2 space-y-1">
              {liveFeed.map((entry, i) => (
                <div
                  key={`${entry.messageId}-${i}`}
                  className="flex items-center gap-2 text-xs slide-in-right py-1 px-2 rounded-md hover:bg-[var(--bg-hover)]"
                >
                  {entry.status === 'delivered' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  )}
                  <span className="text-[var(--text-secondary)]">
                    {entry.status === 'delivered' ? 'Delivered' : 'Failed'}
                  </span>
                  <span className="text-[var(--text-muted)] font-mono text-[10px] ml-auto">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Template preview */}
        {template && (
          <div className="mt-4">
            <h4 className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">Template Preview</h4>
            <div className="rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] p-3">
              {template.subject && (
                <p className="text-sm font-medium mb-1">{template.subject}</p>
              )}
              <p className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap">{template.body}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
