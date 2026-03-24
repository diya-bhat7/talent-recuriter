// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SMTP_USER = Deno.env.get("SMTP_USER");
const SMTP_PASS = Deno.env.get("SMTP_PASS");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

console.log("Function 'manage-teammate' starting...");

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error("Missing Supabase configuration");
        }

        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
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

            // Send notification email via SMTP (Gmail)
            if (SMTP_USER && SMTP_PASS) {
                console.log(`INVOKE: Sending password update email (SMTP) to user ${targetUserId}...`);

                // Fetch user email
                const { data: { user: targetUser }, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
                if (getUserError || !targetUser?.email) {
                    console.warn("Could not fetch target user email for notification.");
                } else {
                    const htmlContent = `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                            <h2 style="color: #0f172a; margin-bottom: 24px;">Password Updated</h2>
                            <p>An administrator has updated your account password for our platform.</p>
                            
                            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 24px 0;">
                                <p style="margin: 0 0 10px 0;"><strong>Your New Login Credentials:</strong></p>
                                <p style="margin: 5px 0;"><strong>Email:</strong> ${targetUser.email}</p>
                                <p style="margin: 5px 0;"><strong>New Temporary Password:</strong> <code style="background: #e2e8f0; padding: 2px 4px; border-radius: 4px;">${password}</code></p>
                            </div>

                            <p style="margin-top: 32px; color: #64748b; font-size: 14px;">
                                Please login and change your password immediately for security.
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
                            to: targetUser.email,
                            subject: "Password Updated - Straatix",
                            html: htmlContent,
                        });

                        await client.close();
                        console.log("INVOKE: SMTP Mail sent successfully.");
                    } catch (mailError) {
                        console.error("INVOKE: SMTP Failure -", mailError.message);
                    }
                }
            } else {
                console.warn("INVOKE: SMTP credentials missing. Skipping email.");
            }

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
