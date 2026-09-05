export type ContactStatus = 'active' | 'unsubscribed' | 'bounced';

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  tags: string[];
  status: ContactStatus;
  source: string;
  created_at: string;
}

export type Channel = 'email' | 'sms';

export interface Template {
  id: string;
  name: string;
  channel: Channel;
  subject: string;
  body: string;
  created_at: string;
}

export type CampaignStatus =
  | 'draft'
  | 'scheduled'
  | 'queued'
  | 'sending'
  | 'completed'
  | 'paused'
  | 'cancelled';

export interface Campaign {
  id: string;
  name: string;
  template_id: string | null;
  status: CampaignStatus;
  scheduled_at: string | null;
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  pending: number;
  created_at: string;
}

export type MessageStatus =
  | 'pending'
  | 'queued'
  | 'sending'
  | 'delivered'
  | 'failed';

export interface BroadcastMessage {
  id: string;
  campaign_id: string;
  contact_id: string;
  status: MessageStatus;
  attempts: number;
  error: string;
  dispatched_at: string | null;
  delivered_at: string | null;
  created_at: string;
}

export interface BroadcastMessageWithContact extends BroadcastMessage {
  contact?: Pick<Contact, 'name' | 'email' | 'phone'>;
}

export interface DispatchRecipient {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
}

export interface DispatchPayload {
  messageId: string;
  campaignId: string;
  channel: Channel;
  subject: string;
  body: string;
  recipient: DispatchRecipient;
}

export interface WorkerMessage {
  type: 'dispatch_batch' | 'pause' | 'resume' | 'cancel' | 'status_query';
  campaignId?: string;
  messages?: DispatchPayload[];
}

export interface WorkerUpdate {
  type: 'progress' | 'complete' | 'error' | 'status';
  campaignId?: string;
  messageId?: string;
  status?: MessageStatus;
  processed?: number;
  total?: number;
  delivered?: number;
  failed?: number;
  error?: string;
  throughput?: number;
  apiEndpoint?: string;
}
