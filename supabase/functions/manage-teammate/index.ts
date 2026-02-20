// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

console.log("Function 'manage-teammate' starting...");

Deno.serve(async (req: Request) => {
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
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Unauthorized');

        // 1. Authenticate caller
        const { data: { user: caller }, error: callerError } = await supabaseAdmin.auth.getUser(
            authHeader.replace('Bearer ', '')
        );
        if (callerError || !caller) throw new Error('Unauthorized');

        const { action, targetUserId, companyId, password } = await req.json();

        // 2. Verify caller is an admin for this company
        const { data: member, error: memberError } = await supabaseAdmin
            .from('team_members')
            .select('role')
            .eq('user_id', caller.id)
            .eq('company_id', companyId)
            .single();

        if (memberError || !member || member.role !== 'admin') {
            console.error(`Access denied for user ${caller.id} in company ${companyId}`);
            return new Response(JSON.stringify({ success: false, error: 'Only administrators can manage teammate accounts.' }), {
                status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        if (action === 'update-password') {
            console.log(`Updating password for user ${targetUserId} as requested by ${caller.id}`);

            const { data, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
                password: password,
                user_metadata: {
                    needs_password_reset: true
                }
            });

            if (updateError) throw updateError;

            return new Response(JSON.stringify({ success: true }), {
                status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        throw new Error(`Invalid action: ${action}`);

    } catch (error) {
        console.error("CRITICAL ERROR:", error.message);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
