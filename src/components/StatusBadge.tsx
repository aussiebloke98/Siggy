import type { CampaignStatus, MessageStatus } from '@/types';

const campaignColors: Record<CampaignStatus, string> = {
  draft: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  scheduled: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  queued: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  sending: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  paused: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  cancelled: 'bg-red-500/15 text-red-400 border-red-500/30',
};

const messageColors: Record<MessageStatus, string> = {
  pending: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  queued: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  sending: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  delivered: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  failed: 'bg-red-500/15 text-red-400 border-red-500/30',
};

export function StatusBadge({ status, type }: { status: CampaignStatus | MessageStatus; type: 'campaign' | 'message' }) {
  const colorClass = type === 'campaign' ? campaignColors[status as CampaignStatus] : messageColors[status as MessageStatus];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${colorClass}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
      {status}
    </span>
  );
}
