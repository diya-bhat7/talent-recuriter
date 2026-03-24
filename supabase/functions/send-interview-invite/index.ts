// @ts-nocheck

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const SMTP_USER = Deno.env.get('SMTP_USER');
const SMTP_PASS = Deno.env.get('SMTP_PASS');

// Helper: Send email via SMTP
async function sendSmtpEmail(
    to: string | string[],
    subject: string,
    html: string
): Promise<{ success: boolean; error?: string }> {
    if (!SMTP_USER || !SMTP_PASS) {
        console.warn("SMTP credentials missing (SMTP_USER/SMTP_PASS). Skipping email.");
        return { success: false, error: "SMTP credentials not configured" };
    }

    const recipients = Array.isArray(to) ? to : [to];
    console.log(`SMTP: Sending email to ${recipients.join(', ')}...`);
    console.log(`SMTP: Using sender ${SMTP_USER}`);

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
            to: recipients,
            subject: subject,
            html: html,
        });

        await client.close();
        console.log(`SMTP: Email sent successfully to ${recipients.join(', ')}`);
        return { success: true };
    } catch (err) {
        console.error(`SMTP: Failed to send email:`, err.message);
        console.error(`SMTP: Full error:`, JSON.stringify(err, Object.getOwnPropertyNames(err)));
        return { success: false, error: err.message };
    }
}

console.log("Function 'send-interview-invite' v2.0.0 - Enhanced SMTP");

Deno.serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        let body;
        try {
            body = await req.json();
        } catch (e) {
            console.error('Invalid JSON body:', e);
            throw new Error('Invalid request payload');
        }

        const {
            candidateEmail,
            candidateName,
            interviewerEmails = [],
            scheduledAt,
            duration = 30,
            meetingLink,
            interviewType = 'General',
            positionName = 'Position',
            companyName = 'Company'
        } = body;

        if (!candidateEmail) throw new Error('Candidate email is required');

        console.log(`Processing interview invite for ${candidateName} (${candidateEmail})`);
        console.log(`Interview: ${interviewType} for ${positionName} at ${companyName}`);
        console.log(`Scheduled: ${scheduledAt}, Duration: ${duration}min`);
        if (interviewerEmails.length > 0) {
            console.log(`Interviewers CC: ${interviewerEmails.join(', ')}`);
        }

        const date = new Date(scheduledAt).toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
        });

        const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1a1a1b;">
        <p>Dear ${candidateName},</p>
        <p>Thank you for your interest in the <strong>${positionName}</strong> position at <strong>${companyName}</strong>. We have reviewed your application and would like to invite you for an interview to discuss your background and experience further.</p>
        
        <div style="background-color: #f8fafc; padding: 24px; border-radius: 8px; margin: 32px 0; border: 1px solid #edf2f7;">
          <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #2d3748;">Interview Details:</h3>
          <p style="margin: 0 0 8px 0; font-size: 15px;"><strong>Type:</strong> ${interviewType}</p>
          <p style="margin: 0 0 8px 0; font-size: 15px;"><strong>Date & Time:</strong> ${date}</p>
          <p style="margin: 0 0 8px 0; font-size: 15px;"><strong>Duration:</strong> ${duration} minutes</p>
          ${meetingLink ? `<p style="margin: 0; font-size: 15px;"><strong>Meeting Link:</strong> <a href="${meetingLink}" style="color: #2563eb; text-decoration: underline;">Join Interview Here</a></p>` : ''}
        </div>

        <p style="margin-bottom: 16px;">Please ensure you have a stable internet connection and are in a quiet environment for the duration of the interview.</p>
        <p style="margin-bottom: 32px;">We look forward to speaking with you!</p>
        
        <p style="margin: 0;">Best regards,</p>
        <p style="margin: 0;"><strong>The Hiring Team</strong></p>
        <p style="margin: 0;">${companyName}</p>
        
        <hr style="margin: 32px 0; border: 0; border-top: 1px solid #e2e8f0;" />
        <p style="text-align: center; color: #94a3b8; font-size: 12px;">Sent via Straatix Talent Sync</p>
      </div>
    `;

        const allRecipients = [candidateEmail, ...interviewerEmails].filter(Boolean);

        const emailResult = await sendSmtpEmail(
            allRecipients,
            `Interview Invitation: ${interviewType} - ${companyName}`,
            htmlContent
        );

        if (!emailResult.success) {
            console.error(`Email delivery failed: ${emailResult.error}`);
            return new Response(JSON.stringify({
                success: false,
                error: `Email delivery failed: ${emailResult.error}`
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            });
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'Interview invite email sent successfully',
            emailSent: true
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        console.error('Function Error:', error.message);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
