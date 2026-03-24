// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const SMTP_USER = Deno.env.get("SMTP_USER");
const SMTP_PASS = Deno.env.get("SMTP_PASS");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// Helper: Secure password generation
function generatePassword(length = 12) {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
    let retVal = ""
    for (let i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n))
    }
    return retVal
}

console.log("Function 'create-teammate' - SMTP Debug Version (v1.1.4)");

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    let mailStatus = "Not attempted";
    let debugInfo = {
        secretsSet: !!(SMTP_USER && SMTP_PASS),
        emailTo: null
    };

    try {
        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error("Missing Supabase configuration");
        }

        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) throw new Error('Unauthorized');

        // 1. Authenticate caller
        const { data: { user: caller }, error: callerError } = await supabaseAdmin.auth.getUser(
            authHeader.replace('Bearer ', '')
        )
        if (callerError || !caller) throw new Error('Unauthorized');

        const { email, password, full_name, company_id, role } = await req.json();
        const companyId = company_id;

        // Verify caller is an admin
        const { data: callerMember } = await supabaseAdmin
            .from('team_members')
            .select('role')
            .eq('company_id', companyId)
            .eq('user_id', caller.id)
            .single();

        if (!callerMember || callerMember.role !== 'admin') {
            const { data: company } = await supabaseAdmin
                .from('companies')
                .select('user_id')
                .eq('id', companyId)
                .single();

            if (!company || company.user_id !== caller.id) {
                throw new Error('Forbidden: You must be an admin to invite teammates');
            }
        }

        const cleanEmail = email.toLowerCase().trim();
        debugInfo.emailTo = cleanEmail;

        const tempPassword = password || generatePassword();
        const displayName = full_name || cleanEmail.split('@')[0];
        let targetUserId = null;
        let isNewUser = false;

        // 1. User Logic
        const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = users?.find(u => u.email?.toLowerCase() === cleanEmail);

        if (existingUser) {
            targetUserId = existingUser.id;
            console.log(`INVOKE: Found existing user ${targetUserId}`);
        } else {
            console.log(`INVOKE: Creating new user ${cleanEmail}...`);
            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: cleanEmail,
                password: tempPassword,
                email_confirm: true,
                user_metadata: {
                    full_name: displayName,
                    company_id: company_id,
                    role: role,
                    needs_password_reset: true
                }
            });
            if (createError) throw createError;
            targetUserId = newUser?.user?.id;
            isNewUser = true;
        }

        if (!targetUserId) throw new Error(`User identification failed for ${cleanEmail}`);

        // 2. Team Membership
        await supabaseAdmin.from("team_members").upsert({
            user_id: targetUserId,
            company_id: company_id,
            role: role,
            name: displayName,
            email: cleanEmail,
            accepted_at: new Date().toISOString(),
            invited_by: caller.id
        }, { onConflict: "user_id,company_id" });

        // 3. SMTP Email Notification
        if (SMTP_USER && SMTP_PASS) {
            console.log(`INVOKE: Attempting SMTP Welcome Mail to ${cleanEmail}...`);
            const htmlContent = `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                    <h2 style="color: #0f172a; margin-bottom: 24px;">Welcome to the Team</h2>
                    <p>Hi ${displayName},</p>
                    <p>You have been added to the recruitment team at Straatix Partners.</p>
                    
                    <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 24px 0;">
                        <p style="margin: 0 0 10px 0;"><strong>Your Login Credentials:</strong></p>
                        <p style="margin: 5px 0;"><strong>Email:</strong> ${cleanEmail}</p>
                        <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <code style="background: #e2e8f0; padding: 2px 4px; border-radius: 4px;">${tempPassword}</code></p>
                    </div>

                    <p style="margin-top: 32px; color: #64748b; font-size: 14px;">
                        Please login at <strong>http://localhost:8081</strong> and update your password.
                    </p>
                    
                    <hr style="margin: 32px 0; border: 0; border-top: 1px solid #e2e8f0;" />
                    <p style="text-align: center; color: #94a3b8; font-size: 12px;">Sent via Straatix Talent Sync</p>
                </div>
            `;

            try {
                const { SMTPClient } = await import("https://deno.land/x/denomailer@1.6.0/mod.ts");
                const client = new SMTPClient({
                    connection: {
                        hostname: "smtp.gmail.com",
                        port: 465,
                        tls: true,
                        auth: {
                            username: SMTP_USER,
                            password: SMTP_PASS,
                        },
                    },
                });

                await client.send({
                    from: SMTP_USER,
                    to: cleanEmail,
                    subject: "Welcome to Straatix Partners",
                    html: htmlContent,
                });

                await client.close();
                mailStatus = "Success";
                console.log("INVOKE: SMTP Mail sent successfully.");
            } catch (mailError) {
                mailStatus = `Failed: ${mailError.message}`;
                console.error("INVOKE: SMTP Failure -", mailError.message);
            }
        } else {
            mailStatus = "Bypassed: SMTP Secrets (SMTP_USER/SMTP_PASS) not found in function environment.";
        }

        return new Response(JSON.stringify({
            success: true,
            message: "Teammate created successfully and welcome email sent."
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