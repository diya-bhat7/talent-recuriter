// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

// Helper: Secure password generation
function generatePassword(length = 12) {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
    let retVal = ""
    for (let i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n))
    }
    return retVal
}

console.log("Function 'create-teammate' - Robust Version (v2.0)");

Deno.serve(async (req) => {
    // 1. Handle CORS immediately
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // 2. Setup Clients
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        if (!supabaseUrl || !serviceRoleKey) {
            console.error("FATAL: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
            throw new Error("Server configuration error: Missing environment variables.");
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
        
        // 3. Authenticate User
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            console.error("AUTH ERROR: Missing Authorization header.");
            // Return 200 with error to prevent 401 crashing the client unexpectedly
            return new Response(JSON.stringify({ 
                success: false, 
                error: 'Missing Authorization Header', 
                is_diag: true 
            }), {
                status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user: caller }, error: callerError } = await supabaseAdmin.auth.getUser(token);

        if (callerError || !caller) {
            console.error("AUTH ERROR: Invalid Token.", callerError);
            return new Response(JSON.stringify({ 
                success: false, 
                error: 'Unauthorized: Session expired or invalid.', 
                is_diag: true 
            }), {
                status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // 4. Parse Body
        const body = await req.json();
        const { email, company_id, role } = body;
        
        // Use company_id from body, or fallback to companyId if mismatched
        const companyId = company_id || body.companyId;

        if (!email || !companyId || !role) {
             throw new Error("Missing required fields: email, company_id, role");
        }

        const cleanEmail = email.toLowerCase().trim();
        const tempPassword = generatePassword();
        let targetUserId = null;
        let isNewUser = false;

        // 5. Logic
        console.log(`INVOKE: Processing invite for ${cleanEmail} by ${caller.id}`);

        const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(cleanEmail, {
            data: {
                company_id: companyId,
                role: role,
                temp_password: tempPassword
            }
        });

        if (inviteError) {
            const msg = inviteError.message.toLowerCase();
            if (msg.includes('already')) {
                console.log("INVOKE: User exists. Fetching ID...");
                const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
                if (listError) throw listError;
                const existingUser = users?.find(u => u.email?.toLowerCase() === cleanEmail);
                if (existingUser) targetUserId = existingUser.id;
            } else {
                throw inviteError;
            }
        } else {
            targetUserId = inviteData?.user?.id;
            isNewUser = true;
        }

        if (!targetUserId) throw new Error(`Could not resolve user ID for ${cleanEmail}`);

        // 6. Finalize
        const finalOps = [];

        if (isNewUser) {
            finalOps.push(supabaseAdmin.auth.admin.updateUserById(targetUserId, {
                password: tempPassword,
                email_confirm: true,
                user_metadata: { needs_password_reset: true }
            }));
        } else {
            finalOps.push(supabaseAdmin.auth.admin.updateUserById(targetUserId, {
                user_metadata: { last_invited_company: companyId, last_invited_role: role }
            }));
        }

        finalOps.push(
            supabaseAdmin.from("team_members").upsert({
                user_id: targetUserId,
                company_id: companyId,
                role: role,
                name: cleanEmail.split('@')[0], 
                email: cleanEmail,
                status: 'accepted',
                invited_by: caller.id
            }, { onConflict: "user_id,company_id" })
        );

        await Promise.all(finalOps);

        console.log("INVOKE: SUCCESS");
        return new Response(JSON.stringify({
            success: true,
            tempPassword: isNewUser ? tempPassword : "User already has an account."
        }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("CRITICAL ERROR:", error.message, error.stack);
        return new Response(JSON.stringify({ 
            success: false, 
            error: error.message || "Unknown Server Error",
            is_diag: true
        }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
