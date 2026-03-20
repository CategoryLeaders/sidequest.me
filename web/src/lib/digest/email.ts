/* ── Digest email helpers — Resend integration ── [SQ.S-W-2603-0068] */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sidequest.me";
const FROM_EMAIL = process.env.DIGEST_FROM_EMAIL ?? "digest@sidequest.me";

interface SendConfirmationParams {
  to: string;
  confirmToken: string;
  profileUsername: string;
  profileDisplayName: string;
}

export async function sendConfirmationEmail(params: SendConfirmationParams) {
  const confirmUrl = `${BASE_URL}/api/digest/confirm?token=${params.confirmToken}`;

  const html = `
    <div style="font-family: 'Space Mono', monospace, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
      <h2 style="font-family: 'Archivo', sans-serif; text-transform: uppercase; font-size: 18px; font-weight: 900; margin-bottom: 16px;">
        Confirm your subscription
      </h2>
      <p style="font-size: 14px; line-height: 1.6; color: #333;">
        You asked to subscribe to updates from <strong>${params.profileDisplayName}</strong> on sidequest.me.
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #333;">
        Click the button below to confirm. If you didn't request this, just ignore this email.
      </p>
      <a href="${confirmUrl}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; font-family: 'Archivo', sans-serif; font-weight: 700; text-transform: uppercase; font-size: 13px; margin: 16px 0;">
        Confirm subscription
      </a>
      <p style="font-size: 11px; color: #999; margin-top: 24px;">
        This email was sent by sidequest.me. <a href="${BASE_URL}/privacy" style="color: #999;">Privacy Policy</a>
      </p>
    </div>
  `;

  return sendEmail({
    to: params.to,
    subject: `Confirm your subscription to ${params.profileDisplayName}'s updates`,
    html,
  });
}

interface DigestEmailParams {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  profileId: string;
}

export async function sendDigestEmail(params: DigestEmailParams) {
  const unsubscribeUrl = `${BASE_URL}/api/digest/unsubscribe?email=${encodeURIComponent(params.to)}&profile_id=${params.profileId}`;

  const fullHtml = `
    ${params.html}
    <div style="font-size: 11px; color: #999; padding: 24px; text-align: center; border-top: 1px solid #eee; margin-top: 24px;">
      <a href="${unsubscribeUrl}" style="color: #999;">Unsubscribe</a> ·
      <a href="${BASE_URL}/privacy" style="color: #999;">Privacy Policy</a> ·
      Sent from <a href="${BASE_URL}" style="color: #999;">sidequest.me</a>
    </div>
  `;

  return sendEmail({
    to: params.to,
    subject: params.subject,
    html: fullHtml,
    replyTo: params.replyTo,
  });
}

interface NotificationEmailParams {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendNotificationEmail(params: NotificationEmailParams) {
  return sendEmail(params);
}

// ─── Core send function ──────────────────────────────────────────────────────

async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}) {
  if (!RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set — email not sent:", params.subject);
    return { id: "dry-run" };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: params.to,
      subject: params.subject,
      html: params.html,
      ...(params.replyTo ? { reply_to: params.replyTo } : {}),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend API error (${res.status}): ${err}`);
  }

  return res.json();
}
