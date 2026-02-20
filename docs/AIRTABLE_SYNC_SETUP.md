# Airtable Two-Way Sync Setup (Free Tier Compatible)

This guide explains how to set up bidirectional sync without Airtable premium.

## Architecture

```
Form Submit → Supabase → sync-to-airtable → Airtable
         ↓
   (scheduled job polls)
         ↓
Airtable → sync-from-airtable → Supabase
```

**No webhooks or scripts required** – uses polling approach.

---

## Environment Variables

Add to Supabase Edge Function secrets:

```bash
AIRTABLE_PAT=your_personal_access_token
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
AIRTABLE_TABLE_NAME=Contacts
```

---

## Airtable Table Schema

| Field | Type | Notes |
|-------|------|-------|
| **Name** | Single line text | Required |
| **Email** | Email | Required |
| **Postgres ID** | Single line text | Auto-filled by sync |

---

## Deploy Functions

```bash
# Deploy both Edge Functions
supabase functions deploy sync-to-airtable
supabase functions deploy sync-from-airtable
```

---

## Set Up Scheduled Polling

### Option 1: Supabase pg_cron (Recommended)

Run this SQL in Supabase SQL Editor:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule sync every 5 minutes
SELECT cron.schedule(
  'airtable-sync',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/sync-from-airtable',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  );
  $$
);
```

Replace:
- `YOUR_PROJECT_ID` with your Supabase project ID
- `YOUR_ANON_KEY` with your anon/public key

### Option 2: External Cron (Free alternatives)

Use any free cron service to call the endpoint:

| Service | Free Tier |
|---------|-----------|
| [cron-job.org](https://cron-job.org) | Unlimited |
| [easycron.com](https://easycron.com) | 200/month |
| GitHub Actions | 2000 mins/month |

**Endpoint to call:**
```
POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/sync-from-airtable
Header: Authorization: Bearer YOUR_ANON_KEY
```

### Option 3: Manual Trigger

Call the function manually when needed:

```bash
curl -X POST \
  https://YOUR_PROJECT_ID.supabase.co/functions/v1/sync-from-airtable \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

---

## Testing

1. **Add record in Airtable** → Wait for next poll → Check Supabase
2. **Edit record in Airtable** → Wait for next poll → Verify update
3. **Delete in Airtable** → Wait for next poll → Record removed from Supabase
4. **Submit form** → Check Airtable immediately (real-time)

---

## Sync Behavior

| Action | Direction | Speed |
|--------|-----------|-------|
| Form submit | Supabase → Airtable | Instant |
| Airtable create | Airtable → Supabase | Next poll (5 min) |
| Airtable edit | Airtable → Supabase | Next poll (5 min) |
| Airtable delete | Airtable → Supabase | Next poll (5 min) |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Records not syncing | Check Edge Function logs |
| Duplicate records | Ensure `Postgres ID` field exists |
| 401 errors | Verify AIRTABLE_PAT is correct |
