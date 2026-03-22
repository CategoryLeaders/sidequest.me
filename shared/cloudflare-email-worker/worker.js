/**
 * Cloudflare Email Worker — SideQuest.me inbound email ingestion
 *
 * Receives emails to {token}@sidequest.me, extracts content,
 * and POSTs to the Supabase Edge Function for storage.
 *
 * Environment variables (set in Cloudflare Workers dashboard):
 *   SUPABASE_EDGE_URL  — https://loawjmjuwrjjgmedswro.supabase.co/functions/v1/ingest-email
 *   INGEST_SECRET      — shared secret matching EMAIL_INGEST_SECRET in Supabase
 */

export default {
  async email(message, env, ctx) {
    // Extract the token from the To address
    // Format: {token}@sidequest.me
    const toAddress = message.to;
    const tokenMatch = toAddress.match(/^([a-f0-9]+)@sidequest\.me$/i);

    if (!tokenMatch) {
      // Not a token address — reject silently
      console.log(`Rejected: unrecognised To address: ${toAddress}`);
      message.setReject("Unknown recipient");
      return;
    }

    const token = tokenMatch[1];

    // Read the email body
    const rawEmail = await new Response(message.raw).text();

    // Extract text and HTML parts from raw email
    // For simplicity, we extract what we can and send both raw parts
    const bodyText = extractTextBody(rawEmail);
    const bodyHtml = extractHtmlBody(rawEmail);

    const payload = {
      token,
      from_email: message.from,
      from_name: extractFromName(message.headers),
      subject: message.headers.get("subject") || "(no subject)",
      body_text: bodyText,
      body_html: bodyHtml,
      raw_email_id: message.headers.get("message-id") || null,
    };

    try {
      const response = await fetch(env.SUPABASE_EDGE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ingest-secret": env.INGEST_SECRET,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error(`Edge Function error (${response.status}):`, result);
        // Don't reject — the email was delivered, we just couldn't process it
        // Rejecting would cause a bounce which is confusing
      } else {
        console.log(`Ingested update for project ${result.project}: ${result.update_id}`);
      }
    } catch (err) {
      console.error("Failed to forward email to Edge Function:", err);
    }
  },
};

/**
 * Extract the display name from the From header.
 * e.g. "Kickstarter <no-reply@kickstarter.com>" → "Kickstarter"
 */
function extractFromName(headers) {
  const from = headers.get("from") || "";
  const nameMatch = from.match(/^"?([^"<]+)"?\s*</);
  return nameMatch ? nameMatch[1].trim() : "";
}

/**
 * Basic text/plain extraction from a raw MIME email.
 * Looks for the text/plain content between MIME boundaries.
 */
function extractTextBody(raw) {
  // Try to find text/plain section
  const textMatch = raw.match(
    /Content-Type:\s*text\/plain[^\r\n]*\r?\n(?:Content-[^\r\n]*\r?\n)*\r?\n([\s\S]*?)(?:\r?\n--|\r?\n\r?\n$)/i
  );
  if (textMatch) {
    return decodeBody(textMatch[1], raw);
  }
  // If no MIME boundaries, treat the whole thing as text
  if (!raw.includes("Content-Type:")) {
    const bodyStart = raw.indexOf("\n\n");
    return bodyStart > -1 ? raw.slice(bodyStart + 2) : raw;
  }
  return "";
}

/**
 * Basic text/html extraction from a raw MIME email.
 */
function extractHtmlBody(raw) {
  const htmlMatch = raw.match(
    /Content-Type:\s*text\/html[^\r\n]*\r?\n(?:Content-[^\r\n]*\r?\n)*\r?\n([\s\S]*?)(?:\r?\n--)/i
  );
  if (htmlMatch) {
    return decodeBody(htmlMatch[1], raw);
  }
  return "";
}

/**
 * Handle base64 and quoted-printable transfer encoding.
 */
function decodeBody(body, rawContext) {
  // Check for base64 encoding
  if (/Content-Transfer-Encoding:\s*base64/i.test(rawContext)) {
    try {
      return atob(body.replace(/\s/g, ""));
    } catch {
      return body;
    }
  }
  // Check for quoted-printable
  if (/Content-Transfer-Encoding:\s*quoted-printable/i.test(rawContext)) {
    return body
      .replace(/=\r?\n/g, "")
      .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) =>
        String.fromCharCode(parseInt(hex, 16))
      );
  }
  return body;
}
