import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { simulatedSocket } from '@/lib/simulatedWebSocket';
import type {
  Campaign,
  BroadcastMessage,
  WorkerUpdate,
  MessageStatus,
  DispatchPayload,
  Contact,
  Template,
} from '@/types';

export interface CampaignProgress {
  processed: number;
  total: number;
  delivered: number;
  failed: number;
  throughput: number;
  active: boolean;
}

export function useBroadcastQueue() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<Record<string, CampaignProgress>>({});
  const [liveFeed, setLiveFeed] = useState<
    { campaignId: string; messageId: string; status: MessageStatus; timestamp: number }[]
  >([]);
  const workerRef = useRef<Worker | null>(null);

  const fetchCampaigns = useCallback(async () => {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Failed to load campaigns:', error.message);
      return;
    }
    setCampaigns((data as Campaign[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Initialize worker
  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../workers/dispatch.worker.ts', import.meta.url),
      { type: 'module' },
    );

    const handleUpdate = async (update: WorkerUpdate) => {
      if (update.type === 'progress' && update.campaignId) {
        setProgress((prev) => ({
          ...prev,
          [update.campaignId!]: {
            processed: update.processed ?? 0,
            total: update.total ?? 0,
            delivered: update.delivered ?? 0,
            failed: update.failed ?? 0,
            throughput: prev[update.campaignId!]?.throughput ?? 0,
            active: true,
          },
        }));

        setLiveFeed((prev) => {
          const entry = {
            campaignId: update.campaignId!,
            messageId: update.messageId!,
            status: update.status!,
            timestamp: Date.now(),
          };
          return [entry, ...prev].slice(0, 50);
        });

        // Update the message in DB
        const now = new Date().toISOString();
        const updateData: Record<string, unknown> = {
          status: update.status,
          attempts: 1,
        };
        if (update.status === 'delivered') {
          updateData.delivered_at = now;
        }
        if (update.status === 'failed') {
          updateData.error = update.error ?? 'Delivery failed';
        }
        await supabase
          .from('broadcast_messages')
          .update(updateData)
          .eq('id', update.messageId!);
      } else if (update.type === 'status' && update.campaignId) {
        setProgress((prev) => {
          const existing = prev[update.campaignId!];
          if (!existing) return prev;
          return {
            ...prev,
            [update.campaignId!]: {
              ...existing,
              throughput: update.throughput ?? 0,
            },
          };
        });
      } else if (update.type === 'complete' && update.campaignId) {
        const cid = update.campaignId;
        const finalDelivered = update.delivered ?? 0;
        const finalFailed = update.failed ?? 0;
        const finalProcessed = update.processed ?? 0;

        setProgress((prev) => ({
          ...prev,
          [cid]: {
            processed: finalProcessed,
            total: update.total ?? 0,
            delivered: finalDelivered,
            failed: finalFailed,
            throughput: 0,
            active: false,
          },
        }));

        // Update campaign in DB
        await supabase
          .from('campaigns')
          .update({
            status: 'completed',
            sent: finalProcessed,
            delivered: finalDelivered,
            failed: finalFailed,
            pending: (update.total ?? 0) - finalProcessed,
          })
          .eq('id', cid);

        fetchCampaigns();
      }
    };

    const workerHandler = (e: MessageEvent<WorkerUpdate>) => {
      simulatedSocket.emit(e.data);
    };

    workerRef.current.onmessage = workerHandler;

    const unsubSocket = simulatedSocket.onMessage(handleUpdate);

    return () => {
      workerRef.current?.terminate();
      unsubSocket();
    };
  }, [fetchCampaigns]);

  const launchCampaign = useCallback(
    async (campaignId: string) => {
      // Fetch pending messages for this campaign
      const { data: messages, error } = await supabase
        .from('broadcast_messages')
        .select('id, contact_id')
        .eq('campaign_id', campaignId)
        .eq('status', 'pending');

      if (error || !messages || messages.length === 0) {
        console.error('No pending messages found for campaign', error?.message);
        return;
      }

      // Fetch the campaign to get its template_id
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('template_id')
        .eq('id', campaignId)
        .single();

      if (!campaign?.template_id) {
        console.error('Campaign has no template assigned');
        return;
      }

      // Fetch the template
      const { data: template } = await supabase
        .from('templates')
        .select('*')
        .eq('id', campaign.template_id)
        .single();

      if (!template) {
        console.error('Template not found');
        return;
      }

      // Fetch all contacts for these messages
      const contactIds = messages.map((m) => m.contact_id);
      const { data: contacts } = await supabase
        .from('contacts')
        .select('*')
        .in('id', contactIds);

      if (!contacts) {
        console.error('Failed to fetch contacts');
        return;
      }

      const contactMap = new Map<string, Contact>();
      (contacts as Contact[]).forEach((c) => contactMap.set(c.id, c));

      // Build full dispatch payloads with recipient + template data
      const payloads: DispatchPayload[] = messages
        .map((m) => {
          const contact = contactMap.get(m.contact_id);
          if (!contact) return null;
          return {
            messageId: m.id,
            campaignId,
            channel: (template as Template).channel,
            subject: (template as Template).subject,
            body: (template as Template).body,
            recipient: {
              id: contact.id,
              name: contact.name,
              email: contact.email,
              phone: contact.phone,
              company: contact.company,
            },
          } as DispatchPayload;
        })
        .filter((p): p is DispatchPayload => p !== null);

      // Update campaign status to sending
      await supabase
        .from('campaigns')
        .update({ status: 'sending' })
        .eq('id', campaignId);

      // Update messages to queued
      await supabase
        .from('broadcast_messages')
        .update({ status: 'queued' })
        .in(
          'id',
          messages.map((m) => m.id),
        );

      setProgress((prev) => ({
        ...prev,
        [campaignId]: {
          processed: 0,
          total: payloads.length,
          delivered: 0,
          failed: 0,
          throughput: 0,
          active: true,
        },
      }));

      workerRef.current?.postMessage({
        type: 'dispatch_batch',
        campaignId,
        messages: payloads,
      });

      fetchCampaigns();
    },
    [fetchCampaigns],
  );

  const pauseCampaign = useCallback((campaignId: string) => {
    workerRef.current?.postMessage({ type: 'pause', campaignId } as { type: 'pause'; campaignId: string });
  }, []);

  const resumeCampaign = useCallback((campaignId: string) => {
    workerRef.current?.postMessage({ type: 'resume', campaignId } as { type: 'resume'; campaignId: string });
  }, []);

  const cancelCampaign = useCallback(
    async (campaignId: string) => {
      workerRef.current?.postMessage({ type: 'cancel', campaignId } as { type: 'cancel'; campaignId: string });
      await supabase
        .from('campaigns')
        .update({ status: 'cancelled' })
        .eq('id', campaignId);
      fetchCampaigns();
    },
    [fetchCampaigns],
  );

  const createCampaign = useCallback(
    async (
      name: string,
      templateId: string,
      scheduledAt: string | null,
      contactIds: string[],
    ): Promise<string | null> => {
      // Create campaign
      const { data: campaign, error: campErr } = await supabase
        .from('campaigns')
        .insert({
          name,
          template_id: templateId,
          status: scheduledAt ? 'scheduled' : 'queued',
          scheduled_at: scheduledAt,
          total: contactIds.length,
          pending: contactIds.length,
        })
        .select()
        .single();

      if (campErr || !campaign) {
        console.error('Failed to create campaign:', campErr?.message);
        return null;
      }

      // Create broadcast messages
      const messageRows = contactIds.map((contactId) => ({
        campaign_id: campaign.id,
        contact_id: contactId,
        status: 'pending' as MessageStatus,
      }));

      const { error: msgErr } = await supabase
        .from('broadcast_messages')
        .insert(messageRows);

      if (msgErr) {
        console.error('Failed to create broadcast messages:', msgErr.message);
        return null;
      }

      fetchCampaigns();
      return campaign.id;
    },
    [fetchCampaigns],
  );

  const deleteCampaign = useCallback(
    async (campaignId: string) => {
      await supabase.from('campaigns').delete().eq('id', campaignId);
      fetchCampaigns();
    },
    [fetchCampaigns],
  );

  const getCampaignMessages = useCallback(
    async (campaignId: string): Promise<BroadcastMessage[]> => {
      const { data, error } = await supabase
        .from('broadcast_messages')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: true })
        .limit(200);
      if (error) return [];
      return (data as BroadcastMessage[]) ?? [];
    },
    [],
  );

  return {
    campaigns,
    loading,
    progress,
    liveFeed,
    launchCampaign,
    pauseCampaign,
    resumeCampaign,
    cancelCampaign,
    createCampaign,
    deleteCampaign,
    getCampaignMessages,
    refreshCampaigns: fetchCampaigns,
  };
}
