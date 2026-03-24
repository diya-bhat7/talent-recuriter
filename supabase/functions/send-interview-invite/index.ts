import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const SMTP_USER = Deno.env.get('SMTP_USER')
        const SMTP_PASS = Deno.env.get('SMTP_PASS')

        if (!SMTP_USER || !SMTP_PASS) {
            console.error('CRITICAL: SMTP_USER or SMTP_PASS is missing from environment variables')
            throw new Error('Server configuration error: Missing SMTP credentials')
        }

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

        if (!candidateEmail) throw new Error('Candidate email is required')

        const date = new Date(scheduledAt).toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
        })

        const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1a1a1b;">
        <p>Dear ${candidateName},</p>
        <p>Thank you for your interest in the <strong>${positionName}</strong> position at <strong>${companyName}</strong>. We have reviewed your application and would like to invite you for an interview to discuss your background and experience further.</p>
        
        <div style="background-color: #f8fafc; padding: 24px; border-radius: 8px; margin: 32px 0; border: 1px solid #edf2f7;">
          <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #2d3748;">Interview Details:</h3>
          <p style="margin: 0 0 8px 0; font-size: 15px;"><strong>Date & Time:</strong> ${date}</p>
          ${meetingLink ? `<p style="margin: 0; font-size: 15px;"><strong>Meeting Link:</strong> <a href="${meetingLink}" style="color: #2563eb; text-decoration: underline;">Join Interview Here</a></p>` : ''}
        </div>

        <p style="margin-bottom: 16px;">Please ensure you have a stable internet connection and are in a quiet environment for the duration of the interview.</p>
        <p style="margin-bottom: 32px;">We look forward to speaking with you!</p>
        
        <p style="margin: 0;">Best regards,</p>
        <p style="margin: 0;"><strong>The Hiring Team</strong></p>
        <p style="margin: 0;">${companyName}</p>
      </div>
    `

        console.log(`Sending SMTP email to ${candidateEmail}...`)

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
            to: [candidateEmail, ...interviewerEmails],
            subject: `Interview Invitation: ${interviewType} - ${companyName}`,
            html: htmlContent,
        });

        await client.close();
        console.log('Email sent successfully via SMTP');

        return new Response(JSON.stringify({ success: true, message: 'Email sent successfully' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        console.error('Function Error:', error.message)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
