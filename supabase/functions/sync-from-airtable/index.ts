// @ts-nocheck
// Polling-based sync from Airtable to Supabase
// Run this on a schedule (e.g., every 5 minutes via cron)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const AIRTABLE_PAT = Deno.env.get("AIRTABLE_PAT");
const AIRTABLE_BASE_ID = Deno.env.get("AIRTABLE_BASE_ID");
const AIRTABLE_TABLE_NAME = Deno.env.get("AIRTABLE_TABLE_NAME") ?? "Contacts";

interface AirtableRecord {
    id: string;
    fields: {
        Name: string;
        Email: string;
        "Postgres ID"?: string;
    };
    createdTime: string;
}

interface AirtableResponse {
    records: AirtableRecord[];
    offset?: string;
}

Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // SECURITY CHECK: Verify that the request is authenticated with the service role key
        // This prevents unauthorized users from triggering the sync cycle
        const authHeader = req.headers.get("Authorization");
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        if (!authHeader || !serviceRoleKey) {
            return new Response(
                JSON.stringify({ error: "Unauthorized" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Timing-safe comparison helper
        const safeCompare = (a: string, b: string) => {
            if (a.length !== b.length) return false;
            let result = 0;
            for (let i = 0; i < a.length; i++) {
                result |= a.charCodeAt(i) ^ b.charCodeAt(i);
            }
            return result === 0;
        };

        const token = authHeader.replace("Bearer ", "");
        if (!safeCompare(token, serviceRoleKey)) {
            console.error("Unauthorized attempt to trigger sync-from-airtable: Invalid token");
            return new Response(
                JSON.stringify({ error: "Unauthorized" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        if (!AIRTABLE_PAT || !AIRTABLE_BASE_ID) {
            console.error("Missing Airtable configuration");
            return new Response(
                JSON.stringify({ error: "Airtable not configured" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        console.log("Starting Airtable → Supabase sync poll...");

        // Fetch all records from Airtable
        const airtableRecords: AirtableRecord[] = [];
        let offset: string | undefined;

        do {
            const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`);
            if (offset) url.searchParams.set("offset", offset);

            const response = await fetch(url.toString(), {
                headers: {
                    Authorization: `Bearer ${AIRTABLE_PAT}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Airtable API error: ${response.status}`);
            }

            const data: AirtableResponse = await response.json();
            airtableRecords.push(...data.records);
            offset = data.offset;
        } while (offset);

        console.log(`Fetched ${airtableRecords.length} records from Airtable`);

        // Get existing records from Supabase
        const { data: existingRecords, error: fetchError } = await supabase
            .from("submissions")
            .select("id, airtable_id, name, email, updated_at");

        if (fetchError) throw fetchError;

        const existingByAirtableId = new Map(
            existingRecords?.filter(r => r.airtable_id).map(r => [r.airtable_id, r]) ?? []
        );

        let created = 0;
        let updated = 0;
        let skipped = 0;

        for (const record of airtableRecords) {
            const { id: airtableId, fields } = record;
            const { Name: name, Email: email } = fields;

            if (!name || !email) {
                console.log(`Skipping record ${airtableId} - missing name or email`);
                skipped++;
                continue;
            }

            const existing = existingByAirtableId.get(airtableId);

            if (existing) {
                // Check if data differs
                if (existing.name !== name || existing.email !== email) {
                    const { error } = await supabase
                        .from("submissions")
                        .update({
                            name,
                            email,
                            source: "airtable",
                            sync_status: "synced",
                            last_synced_at: new Date().toISOString(),
                        })
                        .eq("airtable_id", airtableId);

                    if (error) {
                        console.error(`Update error for ${airtableId}:`, error);
                    } else {
                        console.log(`Updated: ${name}`);
                        updated++;
                    }
                } else {
                    skipped++;
                }
            } else {
                // Create new record
                const { error } = await supabase
                    .from("submissions")
                    .insert({
                        name,
                        email,
                        airtable_id: airtableId,
                        source: "airtable",
                        sync_status: "synced",
                        last_synced_at: new Date().toISOString(),
                    });

                if (error) {
                    console.error(`Insert error for ${airtableId}:`, error);
                } else {
                    console.log(`Created: ${name}`);
                    created++;
                }
            }
        }

        // Handle deletions: find Supabase records with airtable_id not in Airtable
        const airtableIds = new Set(airtableRecords.map(r => r.id));
        const toDelete = existingRecords?.filter(r => r.airtable_id && !airtableIds.has(r.airtable_id)) ?? [];

        let deleted = 0;
        for (const record of toDelete) {
            const { error } = await supabase
                .from("submissions")
                .delete()
                .eq("id", record.id);

            if (!error) {
                console.log(`Deleted: ${record.name} (removed from Airtable)`);
                deleted++;
            }
        }

        const summary = { created, updated, deleted, skipped, total: airtableRecords.length };
        console.log("Sync complete:", summary);

        return new Response(
            JSON.stringify({ success: true, ...summary }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Poll sync error:", message);
        return new Response(
            JSON.stringify({ error: message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
