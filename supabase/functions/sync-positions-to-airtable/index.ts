// @ts-nocheck
// Syncs positions from Supabase → Airtable

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const AIRTABLE_PAT = Deno.env.get("AIRTABLE_PAT");
        const AIRTABLE_BASE_ID = Deno.env.get("AIRTABLE_BASE_ID");
        const AIRTABLE_TABLE_NAME = Deno.env.get("AIRTABLE_TABLE_NAME") ?? "Positions";

        if (!AIRTABLE_PAT || !AIRTABLE_BASE_ID) {
            return new Response(
                JSON.stringify({ error: "Missing AIRTABLE_PAT or AIRTABLE_BASE_ID secrets." }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Parse request body
        let body = {};
        try { body = await req.json(); } catch (_) { }

        if (!body.position_id) {
            return new Response(
                JSON.stringify({ error: "position_id is required" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        console.log("Syncing position:", body.position_id);


        // Fetch position directly by ID
        const { data: positions, error: posError } = await supabase
            .from("positions")
            .select("id, position_name, category, min_experience, max_experience, work_type, preferred_locations, in_office_days, key_requirements, client_jd_text, generated_jd, status, airtable_id")
            .eq("id", body.position_id);


        if (posError) throw posError;

        if (!positions || positions.length === 0) {
            return new Response(
                JSON.stringify({ success: true, message: "No positions to sync" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        console.log(`Syncing ${positions.length} position(s) to Airtable...`);

        let created = 0;
        let updated = 0;
        const errors = [];

        const statusMap = { draft: "On Hold", active: "Open", closed: "Filled", open: "Open" };
        const workTypeMap = { "In-Office": "In-Office", "Remote": "Remote", "Hybrid": "Hybrid" };
        const hiringTypeMap = {
            "EoR": "Employer of Record ( Straatix EoR)",
            "Direct": "Direct Hire (Client Payroll)",
            "Contract": "Direct Hire (Client Payroll)",
        };

        for (const pos of positions) {
            const airtableFields = {};

            // Only send fields that exist in the Airtable table
            if (pos.position_name) airtableFields["Position Name"] = pos.position_name;
            if (pos.status) airtableFields["Position status"] = statusMap[pos.status?.toLowerCase()] ?? pos.status;
            if (pos.min_experience != null) airtableFields["Min Experience (In Years)"] = pos.min_experience;
            if (pos.max_experience != null) airtableFields["Max Experience (In Years)"] = pos.max_experience;
            if (pos.generated_jd) airtableFields["JD JSON (output)"] = pos.generated_jd;
            if (pos.preferred_locations && Array.isArray(pos.preferred_locations) && pos.preferred_locations.length > 0) {
                airtableFields["Preferred Location"] = pos.preferred_locations;
            }

            try {
                if (pos.airtable_id) {
                    // UPDATE existing record
                    const res = await fetch(
                        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}/${pos.airtable_id}`,
                        {
                            method: "PATCH",
                            headers: { Authorization: `Bearer ${AIRTABLE_PAT}`, "Content-Type": "application/json" },
                            body: JSON.stringify({ fields: airtableFields }),
                        }
                    );
                    if (!res.ok) {
                        const err = await res.text();
                        console.error(`PATCH failed for ${pos.position_name}:`, err);
                        errors.push(`${pos.position_name}: ${err}`);
                        continue;
                    }
                    updated++;
                    console.log(`Updated: ${pos.position_name}`);
                } else {
                    // CREATE new record
                    const res = await fetch(
                        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`,
                        {
                            method: "POST",
                            headers: { Authorization: `Bearer ${AIRTABLE_PAT}`, "Content-Type": "application/json" },
                            body: JSON.stringify({ records: [{ fields: airtableFields }] }),
                        }
                    );
                    if (!res.ok) {
                        const err = await res.text();
                        console.error(`POST failed for ${pos.position_name}:`, err);
                        errors.push(`${pos.position_name}: ${err}`);
                        continue;
                    }
                    const data = await res.json();
                    const airtableId = data.records[0].id;

                    await supabase
                        .from("positions")
                        .update({ airtable_id: airtableId })
                        .eq("id", pos.id);

                    created++;
                    console.log(`Created: ${pos.position_name} (${airtableId})`);
                }
            } catch (e) {
                errors.push(`${pos.position_name}: ${e instanceof Error ? e.message : String(e)}`);
            }
        }

        return new Response(
            JSON.stringify({ success: true, created, updated, total: positions.length, errors: errors.length > 0 ? errors : undefined }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Sync error:", message);
        return new Response(
            JSON.stringify({ error: message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
