// @ts-nocheck

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const AIRTABLE_PAT = Deno.env.get("AIRTABLE_PAT");
const AIRTABLE_BASE_ID = Deno.env.get("AIRTABLE_BASE_ID");
const AIRTABLE_TABLE_NAME = Deno.env.get("AIRTABLE_TABLE_NAME") ?? "Contacts";

interface SubmissionPayload {
  id: string;
  name: string;
  email: string;
  airtable_id?: string;
  source?: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!AIRTABLE_PAT || !AIRTABLE_BASE_ID) {
      console.error("Missing Airtable configuration. Check AIRTABLE_PAT and AIRTABLE_BASE_ID env vars.");
      return new Response(
        JSON.stringify({
          error: "Airtable is not configured. Please set AIRTABLE_PAT and AIRTABLE_BASE_ID.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // SECURITY CHECK: Full JWT validation as requested by Lovable
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Unauthenticated request to sync-to-airtable: Missing Authorization header");
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the caller's JWT
    const { data: { user: caller }, error: callerError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (callerError || !caller) {
      console.error("Unauthorized request to sync-to-airtable: Invalid JWT", callerError);
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid session" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Validated request from user: ${caller.id}`);

    const { id, name, email, airtable_id, source }: SubmissionPayload = await req.json();

    if (!id) {
      throw new Error("Missing submission ID");
    }

    // SECURITY CHECK: Verify the submission exists in our database and is pending sync
    const { data: submission, error: fetchError } = await supabase
      .from("submissions")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !submission) {
      console.error(`Security Alert: Attempted sync for non-existent submission ${id}`);
      return new Response(
        JSON.stringify({ error: "Invalid submission ID" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the data matches to prevent payload spoofing
    if (submission.email !== email || submission.name !== name) {
      console.error(`Security Alert: Payload mismatch for submission ${id}`);
      return new Response(
        JSON.stringify({ error: "Data integrity check failed" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Only allow syncing if it's pending or errored (don't re-sync already synced ones)
    if (submission.sync_status === "synced" && !airtable_id) {
      console.log(`Submission ${id} is already synced. Skipping.`);
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "already synced" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // LOOP PREVENTION: Skip if this change came from Airtable
    if (source === "airtable" || submission.source === "airtable") {
      console.log(`Skipping sync for ${name} - source is Airtable (preventing loop)`);
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "source is airtable" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Syncing verified submission to Airtable: ${name} (${email})`);

    let airtableRecordId = airtable_id;
    let action: "created" | "updated";

    if (airtable_id) {
      // UPDATE existing Airtable record (PATCH)
      console.log(`Updating existing Airtable record: ${airtable_id}`);

      const airtableResponse = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}/${airtable_id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${AIRTABLE_PAT}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fields: {
              Name: name,
              Email: email,
            },
          }),
        }
      );

      if (!airtableResponse.ok) {
        const errorText = await airtableResponse.text();
        console.error("Airtable PATCH error:", errorText);

        // If record not found, try creating instead
        if (airtableResponse.status === 404) {
          console.log("Airtable record not found, will create new one");
          airtableRecordId = null;
        } else {
          throw new Error(`Airtable API error: ${airtableResponse.status}`);
        }
      } else {
        action = "updated";
        console.log(`Updated Airtable record: ${airtable_id}`);
      }
    }

    if (!airtableRecordId) {
      // CREATE new Airtable record (POST)
      const airtableResponse = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${AIRTABLE_PAT}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            records: [
              {
                fields: {
                  Name: name,
                  Email: email,
                  "Postgres ID": id,
                },
              },
            ],
          }),
        }
      );

      if (!airtableResponse.ok) {
        const errorText = await airtableResponse.text();
        console.error("Airtable POST error:", errorText);
        throw new Error(`Airtable API error: ${airtableResponse.status}`);
      }

      const airtableData = await airtableResponse.json();
      airtableRecordId = airtableData.records[0].id;
      action = "created";
      console.log(`Created Airtable record: ${airtableRecordId}`);
    }

    // Update Supabase record with Airtable ID and sync status
    const { error: updateError } = await supabase
      .from("submissions")
      .update({
        airtable_id: airtableRecordId,
        sync_status: "synced",
        last_synced_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      console.error("Supabase update error:", updateError);
      throw updateError;
    }

    console.log(`✅ Successfully ${action}: ${name}`);

    return new Response(
      JSON.stringify({ success: true, action, airtable_id: airtableRecordId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Sync error:", message);

    // Try to update sync_status to error
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      const body = await req.clone().json();
      if (body.id) {
        await supabase
          .from("submissions")
          .update({ sync_status: "error" })
          .eq("id", body.id);
      }
    } catch (e) {
      console.error("Failed to update sync_status:", e);
    }

    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
