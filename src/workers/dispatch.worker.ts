/// <reference lib="webworker" />
import type { WorkerMessage, WorkerUpdate, MessageStatus, DispatchPayload } from '@/types';

const API_ENDPOINT = '/api/send';

let paused = false;
let cancelled = false;
let activeCampaignId: string | null = null;

function post(update: WorkerUpdate) {
  (self as unknown as Worker).postMessage(update);
}

interface DispatchResult {
  status: MessageStatus;
  error?: string;
}

/**
 * Placeholder for real message dispatch.
 * Sends a POST request to the generic /api/send endpoint.
 * Replace this function's body with your actual provider integration
 * (SendGrid, Twilio, SES, etc.) when the backend is available.
 */
async function dispatchRealMessage(payload: DispatchPayload): Promise<DispatchResult> {
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel: payload.channel,
        subject: payload.subject,
        body: payload.body,
        recipient: {
          name: payload.recipient.name,
          email: payload.recipient.email,
          phone: payload.recipient.phone,
          company: payload.recipient.company,
        },
        campaignId: payload.campaignId,
        messageId: payload.messageId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      return {
        status: 'failed',
        error: `API returned ${response.status}: ${errorText || response.statusText}`,
      };
    }

    const data = await response.json().catch(() => ({}));
    if (data && data.status === 'failed') {
      return { status: 'failed', error: data.error || 'API reported failure' };
    }

    return { status: 'delivered' };
  } catch (err) {
    return {
      status: 'failed',
      error: err instanceof Error ? err.message : 'Network error during dispatch',
    };
  }
}

async function dispatchBatch(
  messages: DispatchPayload[],
  campaignId: string,
  batchSize: number,
) {
  activeCampaignId = campaignId;
  paused = false;
  cancelled = false;

  const total = messages.length;
  let processed = 0;
  let delivered = 0;
  let failed = 0;
  const startTime = Date.now();

  for (let i = 0; i < total; i += batchSize) {
    if (cancelled) {
      post({ type: 'complete', campaignId, processed, total, delivered, failed });
      return;
    }

    if (paused) {
      await new Promise<void>((resolve) => {
        const check = setInterval(() => {
          if (!paused || cancelled) {
            clearInterval(check);
            resolve();
          }
        }, 100);
      });
      if (cancelled) {
        post({ type: 'complete', campaignId, processed, total, delivered, failed });
        return;
      }
    }

    const batch = messages.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async (msg) => {
        const result = await dispatchRealMessage(msg);
        processed++;

        if (result.status === 'failed') {
          failed++;
          post({
            type: 'progress',
            campaignId,
            messageId: msg.messageId,
            status: 'failed',
            processed,
            total,
            delivered,
            failed,
            error: result.error,
          });
        } else {
          delivered++;
          post({
            type: 'progress',
            campaignId,
            messageId: msg.messageId,
            status: 'delivered',
            processed,
            total,
            delivered,
            failed,
          });
        }
      }),
    );

    const elapsed = (Date.now() - startTime) / 1000;
    const throughput = elapsed > 0 ? Math.round(processed / elapsed) : 0;
    post({ type: 'status', campaignId, throughput, apiEndpoint: API_ENDPOINT });
  }

  post({ type: 'complete', campaignId, processed, total, delivered, failed });
  activeCampaignId = null;
}

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const msg = e.data;
  switch (msg.type) {
    case 'dispatch_batch':
      if (msg.messages && msg.campaignId) {
        dispatchBatch(msg.messages, msg.campaignId, 8);
      }
      break;
    case 'pause':
      paused = true;
      break;
    case 'resume':
      paused = false;
      break;
    case 'cancel':
      cancelled = true;
      paused = false;
      break;
    case 'status_query':
      post({
        type: 'status',
        campaignId: activeCampaignId ?? undefined,
        throughput: 0,
        apiEndpoint: API_ENDPOINT,
      });
      break;
  }
};
