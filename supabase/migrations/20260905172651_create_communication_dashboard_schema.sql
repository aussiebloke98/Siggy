/*
# Communication Management Dashboard Schema

## Overview
Creates the full schema for a communication management dashboard with contact
synchronization, message templates, broadcast campaigns, and per-recipient
delivery tracking. Single-tenant (no auth) — all data is shared/public.

## New Tables

1. `contacts`
   - `id` (uuid, PK)
   - `name` (text)
   - `email` (text)
   - `phone` (text)
   - `company` (text)
   - `tags` (text[]) — labels for segmentation
   - `status` (text: active | unsubscribed | bounced) default 'active'
   - `source` (text) — where the contact was imported from
   - `created_at` (timestamptz)

2. `templates`
   - `id` (uuid, PK)
   - `name` (text)
   - `channel` (text: email | sms)
   - `subject` (text) — email only
   - `body` (text) — message body with {{merge}} placeholders
   - `created_at` (timestamptz)

3. `campaigns`
   - `id` (uuid, PK)
   - `name` (text)
   - `template_id` (uuid FK → templates)
   - `status` (text: draft | scheduled | queued | sending | completed | paused | cancelled)
   - `scheduled_at` (timestamptz) — when dispatch should begin
   - `total` (int) — total recipients
   - `sent` (int) — messages dispatched
   - `delivered` (int) — confirmed delivered
   - `failed` (int) — failed deliveries
   - `pending` (int) — not yet dispatched
   - `created_at` (timestamptz)

4. `broadcast_messages`
   - `id` (uuid, PK)
   - `campaign_id` (uuid FK → campaigns)
   - `contact_id` (uuid FK → contacts)
   - `status` (text: pending | queued | sending | delivered | failed)
   - `attempts` (int) default 0
   - `error` (text)
   - `dispatched_at` (timestamptz)
   - `delivered_at` (timestamptz)
   - `created_at` (timestamptz)

## Security
- RLS enabled on all tables.
- All policies use `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)`
  because this is a single-tenant app with no sign-in — the data is intentionally shared.

## Indexes
- `broadcast_messages` by campaign_id and by status for fast queue/status queries.
- `contacts` by status for active-contact filtering.
- `campaigns` by status for dashboard widgets.
*/

-- ── contacts ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contacts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL DEFAULT '',
  email       text DEFAULT '',
  phone       text DEFAULT '',
  company     text DEFAULT '',
  tags        text[] DEFAULT '{}',
  status      text NOT NULL DEFAULT 'active'
              CHECK (status IN ('active','unsubscribed','bounced')),
  source      text DEFAULT 'manual',
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_contacts_sel" ON contacts;
CREATE POLICY "anon_crud_contacts_sel" ON contacts FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_contacts_ins" ON contacts;
CREATE POLICY "anon_crud_contacts_ins" ON contacts FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_contacts_upd" ON contacts;
CREATE POLICY "anon_crud_contacts_upd" ON contacts FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_contacts_del" ON contacts;
CREATE POLICY "anon_crud_contacts_del" ON contacts FOR DELETE
  TO anon, authenticated USING (true);

-- ── templates ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS templates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL DEFAULT 'Untitled Template',
  channel     text NOT NULL DEFAULT 'email'
              CHECK (channel IN ('email','sms')),
  subject     text DEFAULT '',
  body        text NOT NULL DEFAULT '',
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_templates_sel" ON templates;
CREATE POLICY "anon_crud_templates_sel" ON templates FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_templates_ins" ON templates;
CREATE POLICY "anon_crud_templates_ins" ON templates FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_templates_upd" ON templates;
CREATE POLICY "anon_crud_templates_upd" ON templates FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_templates_del" ON templates;
CREATE POLICY "anon_crud_templates_del" ON templates FOR DELETE
  TO anon, authenticated USING (true);

-- ── campaigns ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS campaigns (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL DEFAULT 'Untitled Campaign',
  template_id   uuid REFERENCES templates(id) ON DELETE SET NULL,
  status        text NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft','scheduled','queued','sending','completed','paused','cancelled')),
  scheduled_at  timestamptz,
  total         int  NOT NULL DEFAULT 0,
  sent          int  NOT NULL DEFAULT 0,
  delivered     int  NOT NULL DEFAULT 0,
  failed        int  NOT NULL DEFAULT 0,
  pending       int  NOT NULL DEFAULT 0,
  created_at    timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_campaigns_sel" ON campaigns;
CREATE POLICY "anon_crud_campaigns_sel" ON campaigns FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_campaigns_ins" ON campaigns;
CREATE POLICY "anon_crud_campaigns_ins" ON campaigns FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_campaigns_upd" ON campaigns;
CREATE POLICY "anon_crud_campaigns_upd" ON campaigns FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_campaigns_del" ON campaigns;
CREATE POLICY "anon_crud_campaigns_del" ON campaigns FOR DELETE
  TO anon, authenticated USING (true);

-- ── broadcast_messages ────────────────────────────────────
CREATE TABLE IF NOT EXISTS broadcast_messages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id   uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  contact_id    uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  status        text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','queued','sending','delivered','failed')),
  attempts      int  NOT NULL DEFAULT 0,
  error         text DEFAULT '',
  dispatched_at timestamptz,
  delivered_at  timestamptz,
  created_at    timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bm_campaign ON broadcast_messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_bm_status  ON broadcast_messages(status);

ALTER TABLE broadcast_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_bm_sel" ON broadcast_messages;
CREATE POLICY "anon_crud_bm_sel" ON broadcast_messages FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_bm_ins" ON broadcast_messages;
CREATE POLICY "anon_crud_bm_ins" ON broadcast_messages FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_bm_upd" ON broadcast_messages;
CREATE POLICY "anon_crud_bm_upd" ON broadcast_messages FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_bm_del" ON broadcast_messages;
CREATE POLICY "anon_crud_bm_del" ON broadcast_messages FOR DELETE
  TO anon, authenticated USING (true);
