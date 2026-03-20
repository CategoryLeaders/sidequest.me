import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — sidequest.me",
  description: "Privacy Policy for sidequest.me",
};

export default function PrivacyPage() {
  const lastUpdated = "20 March 2026";

  return (
    <main className="privacy-page">
      <div className="privacy-container">
        <h1>Privacy Policy</h1>
        <p className="privacy-meta">Last updated: {lastUpdated}</p>

        <section>
          <p>
            This Privacy Policy explains how sidequest.me (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;)
            collects, uses, and stores information when you use our website and Android application
            (together, &ldquo;the Service&rdquo;). We are committed to handling your data responsibly
            and in accordance with applicable data protection law, including the UK GDPR.
          </p>
        </section>

        <section>
          <h2>1. Information We Collect</h2>

          <h3>Account information</h3>
          <p>
            When you create an account, we collect your email address and any profile information
            you choose to provide, including display name, biography, avatar image, and profile tags.
          </p>

          <h3>Content you post</h3>
          <p>
            We store content you create on the Service: microblog posts, long-form writings,
            bookmarks (including URLs you save and any commentary you add), quotes, questions,
            photos, project details, and associated metadata such as tags. If you choose to add
            location information to a post, that is also stored.
          </p>

          <h3>Comments and interactions</h3>
          <p>
            When you comment on content, we store the text of your comment along with your
            user identity. Comments are publicly visible alongside your display name and avatar.
            Your email address is never displayed publicly. If you delete your account, your
            comments are anonymised (attributed to &ldquo;Deleted User&rdquo;) rather than
            removed, to preserve conversation context for other participants.
          </p>

          <h3>Imported content</h3>
          <p>
            You may choose to import content from external platforms (such as Facebook or Telegram).
            Imported posts retain their original timestamps and are attributed to their source.
            Comments on imported posts may include names and avatars from the original platform;
            these are stored as anonymous identifiers and are not linked to accounts on our Service.
          </p>

          <h3>Email digest preferences</h3>
          <p>
            If you configure an email digest, we store your delivery preferences (frequency, timezone,
            content selections) and an optional reply-to email address. This information is only
            accessible to you.
          </p>

          <h3>Device and technical information</h3>
          <p>
            When you use the Android app, we collect a device push token (provided by Google Firebase
            Cloud Messaging) solely to deliver push notifications to your device. This token is
            stored against your account and refreshed automatically. It is not used for advertising.
          </p>

          <h3>Usage and analytics data</h3>
          <p>
            We use analytics tools, which may include Google Analytics and Google Firebase Analytics,
            to collect information about how the Service is used. This may include pages or screens
            visited, session duration, general device type and operating system, and approximate
            geographic region (country or city level). This data is collected in aggregated or
            pseudonymous form and is used solely to understand usage patterns, improve the Service,
            and diagnose technical issues. We do not use analytics data to build advertising profiles
            or share it with third parties for marketing purposes.
          </p>
          <p>
            Analytics cookies are only loaded after you give consent via the cookie banner.
            If you decline analytics cookies, no analytics data is collected from your session.
          </p>
          <p>
            Google&rsquo;s use of analytics data is governed by{" "}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google&rsquo;s Privacy Policy
            </a>
            . You can opt out of Google Analytics data collection by using the{" "}
            <a
              href="https://tools.google.com/dlpage/gaoptout"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google Analytics opt-out browser add-on
            </a>{" "}
            or by adjusting your device&rsquo;s advertising settings.
          </p>
        </section>

        <section>
          <h2>2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide, operate, and maintain the Service</li>
            <li>Authenticate your identity and manage your account</li>
            <li>Display your published content and comments to other users</li>
            <li>Deliver push notifications you have opted in to receive</li>
            <li>Send email digests you have configured (you may unsubscribe at any time)</li>
            <li>Understand and improve how the Service is used (with your analytics consent)</li>
            <li>Diagnose technical problems and ensure platform stability</li>
            <li>Comply with legal obligations</li>
          </ul>
          <p>
            We do not sell your personal data. We do not use your data for targeted advertising.
          </p>
        </section>

        <section>
          <h2>3. Legal Basis for Processing</h2>
          <p>
            Under UK GDPR, we process your personal data on the following legal bases:
          </p>
          <ul>
            <li>
              <strong>Contract:</strong> Processing necessary to provide the Service you signed up for
              (account management, content hosting, comment display).
            </li>
            <li>
              <strong>Consent:</strong> Analytics cookies are only activated after you consent via
              the cookie banner. Email digests are only sent when you opt in.
            </li>
            <li>
              <strong>Legitimate interest:</strong> Diagnosing technical issues, preventing abuse,
              and improving the Service.
            </li>
          </ul>
        </section>

        <section>
          <h2>4. Third-Party Services</h2>
          <p>We use the following third-party services to operate the platform:</p>

          <h3>Supabase</h3>
          <p>
            We use Supabase for authentication and database storage. Your account data and content
            are stored on Supabase infrastructure hosted in the EU (London, eu-west-2).
            Supabase&rsquo;s privacy practices are described in the{" "}
            <a
              href="https://supabase.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
            >
              Supabase Privacy Policy
            </a>
            .
          </p>

          <h3>Bunny.net</h3>
          <p>
            Images and media you upload are delivered via Bunny.net, a content delivery network.
            Bunny.net may process your media files through servers in multiple regions to ensure
            fast delivery. Their privacy practices are described in the{" "}
            <a
              href="https://bunny.net/privacy"
              target="_blank"
              rel="noopener noreferrer"
            >
              Bunny.net Privacy Policy
            </a>
            .
          </p>

          <h3>Google Firebase</h3>
          <p>
            We use Google Firebase Cloud Messaging (FCM) to deliver push notifications to Android
            devices, and may use Firebase Analytics to understand app usage. Google&rsquo;s privacy
            practices are described in the{" "}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google Privacy Policy
            </a>
            .
          </p>

          <h3>Vercel</h3>
          <p>
            The website is hosted on Vercel. Vercel may collect standard web server logs including
            IP addresses and request metadata. Their privacy practices are described in the{" "}
            <a
              href="https://vercel.com/legal/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
            >
              Vercel Privacy Policy
            </a>
            .
          </p>
        </section>

        <section>
          <h2>5. Data Retention</h2>
          <p>
            We retain your account data and content for as long as your account is active.
          </p>
          <p>
            If you request account deletion, your account enters a 30-day grace period during
            which you can cancel the deletion by logging back in. After 30 days, your personal
            data is permanently deleted, including your profile, content, and settings.
            Comments you made on other users&rsquo; content are anonymised (not deleted) to
            preserve conversation context.
          </p>
          <p>
            Email digest subscription data is deleted immediately when you unsubscribe.
          </p>
          <p>
            Analytics data is retained in accordance with the retention settings of the respective
            analytics provider (typically 14 months for Google Analytics).
          </p>
        </section>

        <section>
          <h2>6. Your Rights</h2>
          <p>
            Under UK GDPR, you have the following rights:
          </p>
          <ul>
            <li>
              <strong>Access:</strong> Request a copy of all personal data we hold about you.
              You can download your data at any time from your account settings.
            </li>
            <li>
              <strong>Correction:</strong> Update inaccurate or incomplete data via your profile settings.
            </li>
            <li>
              <strong>Deletion:</strong> Request deletion of your account and personal data.
              This is available in your account settings and takes effect after a 30-day grace period.
            </li>
            <li>
              <strong>Restriction and objection:</strong> Request that we limit or stop processing
              your data in certain circumstances.
            </li>
            <li>
              <strong>Data portability:</strong> Download a machine-readable copy of your data (JSON format)
              from your account settings.
            </li>
            <li>
              <strong>Withdraw consent:</strong> You can withdraw analytics consent at any time by
              clearing the cookie consent cookie in your browser, or by rejecting cookies when the
              banner reappears.
            </li>
          </ul>
          <p>
            To exercise any of these rights, use the self-service tools in your account settings
            or contact us at the address below. You also have the right to lodge a complaint
            with the Information Commissioner&rsquo;s Office (ICO) at{" "}
            <a
              href="https://ico.org.uk"
              target="_blank"
              rel="noopener noreferrer"
            >
              ico.org.uk
            </a>
            .
          </p>
        </section>

        <section>
          <h2>7. Cookies</h2>
          <p>
            The Service uses cookies and similar technologies. We categorise our cookies as follows:
          </p>
          <ul>
            <li>
              <strong>Essential cookies:</strong> Required for authentication and core functionality.
              These are set automatically and cannot be disabled without breaking the Service.
            </li>
            <li>
              <strong>Analytics cookies:</strong> Used by Google Analytics to understand how the
              Service is used. These are only set after you give consent via the cookie banner
              that appears on your first visit.
            </li>
          </ul>
          <p>
            We do not use advertising or tracking cookies. You can manage your cookie preferences
            by clearing your browser cookies, which will cause the consent banner to reappear
            on your next visit.
          </p>
        </section>

        <section>
          <h2>8. Children</h2>
          <p>
            The Service is not directed at children under 13. We do not knowingly collect personal
            data from children under 13. If you believe a child has provided us with personal data,
            please contact us so we can delete it.
          </p>
        </section>

        <section>
          <h2>9. International Data Transfers</h2>
          <p>
            Your data is primarily stored in the EU (London, eu-west-2) via Supabase. Some
            third-party services (Vercel, Google, Bunny.net) may process data in other regions.
            Where data is transferred outside the UK, appropriate safeguards are in place as
            required by UK GDPR.
          </p>
        </section>

        <section>
          <h2>10. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify registered users
            of material changes via email or a prominent notice on the Service. Continued use of
            the Service after changes are posted constitutes acceptance of the updated policy.
          </p>
        </section>

        <section>
          <h2>11. Contact</h2>
          <p>
            For privacy-related questions or requests, contact us at:{" "}
            <a href="mailto:privacy@sidequest.me">privacy@sidequest.me</a>
          </p>
        </section>
      </div>
    </main>
  );
}
