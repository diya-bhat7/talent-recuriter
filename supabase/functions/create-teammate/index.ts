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

console.log("Function 'auth-invite' - High Performance Streamlined (v1.1.2)");

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
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) throw new Error('Unauthorized');

        // 1. Authenticate caller (Must be first for security)
        const { data: { user: caller }, error: callerError } = await supabaseAdmin.auth.getUser(
            authHeader.replace('Bearer ', '')
        )
        if (callerError || !caller) throw new Error('Unauthorized');

        const { email, password, full_name, company_id, role } = await req.json();
        const companyId = company_id; // Map frontend field to internal variable

        // Verify caller is an admin in the target company
        const { data: callerMember, error: callerMemberError } = await supabaseAdmin
            .from('team_members')
            .select('role')
            .eq('company_id', companyId)
            .eq('user_id', caller.id)
            .single();

        if (callerMemberError || !callerMember || callerMember.role !== 'admin') {
            // Also check if they are the company owner
            const { data: company, error: companyError } = await supabaseAdmin
                .from('companies')
                .select('user_id')
                .eq('id', companyId)
                .single();

            if (companyError || !company || company.user_id !== caller.id) {
                console.error(`Unauthorized invitation attempt by ${caller.id} for company ${companyId}`);
                throw new Error('Forbidden: You must be an admin to invite teammates');
            }
        }

        const cleanEmail = email.toLowerCase().trim();
        const tempPassword = password || generatePassword();
        const displayName = full_name || cleanEmail.split('@')[0];
        let targetUserId = null;
        let isNewUser = false;

        // 2. ATTEMPT TO INVITE
        console.log(`INVOKE: Attempting to invite ${cleanEmail}...`);
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
                console.log("INVOKE: User already in Auth system. Attempting to locate ID...");

                // Fetch user ID using listUsers (more compatible than getUserByEmail)
                const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
                if (listError) throw listError;

                const existingUser = users?.find(u => u.email?.toLowerCase() === cleanEmail);
                if (existingUser) {
                    targetUserId = existingUser.id;
                    console.log(`INVOKE: Located existing user ID: ${targetUserId}`);
                }
            } else {
                throw inviteError;
            }
        } else {
            targetUserId = inviteData?.user?.id;
            isNewUser = true;
            console.log(`INVOKE: New user invited successfully: ${targetUserId}`);
        }

        if (!targetUserId) {
            throw new Error(`Could not find or create user for ${cleanEmail}. This can happen if the user list is too large to scan.`);
        }

        // 3. FINALIZE RECORDS
        console.log(`INVOKE: Finalizing records for ${targetUserId}...`);
        const finalOps = [];

        // ONLY update password/metadata for NEW users or those we just invited
        // If they already exist, we should NOT touch their password for security reasons
        if (isNewUser) {
            finalOps.push(supabaseAdmin.auth.admin.updateUserById(targetUserId, {
                password: tempPassword,
                email_confirm: true,
                user_metadata: {
                    needs_password_reset: true
                }
            }));
        } else {
            // For existing users, just ensure they have the company metadata for the next login
            // We do NOT change their password.
            finalOps.push(supabaseAdmin.auth.admin.updateUserById(targetUserId, {
                user_metadata: {
                    last_invited_company: companyId,
                    last_invited_role: role
                }
            }));
        }

        // Create/Update membership (The most important part)
        // Using 'team_members' instead of 'company_members' to match frontend usage in TeamManagement.tsx
        finalOps.push(
            supabaseAdmin.from("team_members").upsert({
                user_id: targetUserId,
                company_id: companyId,
                role: role,
                name: displayName,
                email: cleanEmail,
                accepted_at: new Date().toISOString(),
                invited_by: caller.id
            }, { onConflict: "user_id,company_id" })
        );

        /* 
        // Commenting out company_invites for now as schema is unverified
        finalOps.push(
            supabaseAdmin.from("company_invites").upsert({
                email: cleanEmail,
                company_id: companyId,
                role: role,
                status: "accepted",
                invited_by: caller.id
            }, { onConflict: "email,company_id" })
        );
        */

        await Promise.all(finalOps);

        console.log("INVOKE: SUCCESS - Invitation/Linking complete.");
        return new Response(JSON.stringify({
            success: true,
            message: isNewUser
                ? "Teammate invited successfully. An invitation email has been sent."
                : "Teammate linked to company successfully."
        }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("CRITICAL ERROR:", error.message);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});