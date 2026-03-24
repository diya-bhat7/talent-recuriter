// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error("Missing Supabase configuration");
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

        const {
            email,
            name,
            meeting_link,
            scheduled_at,
            position_name,
            company_id,
            company_name
        } = await req.json();

        console.log(`INVOKE: Inviting ${email}...`);

        const sanitizeUrl = (url: string) => {
            if (!url) return null;
            const trimmed = url.trim();
            if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
            return `https://${trimmed}`;
        };

        const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            data: {
                full_name: name,
                company_id,
                company_name,
                meeting_link: sanitizeUrl(meeting_link),
                scheduled_at,
                position_name,
                role: 'candidate',
                is_candidate_invite: true
            }
        });

        if (inviteError) throw inviteError;

        return new Response(JSON.stringify({ success: true, data: inviteData }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("CRITICAL ERROR:", error.message);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
