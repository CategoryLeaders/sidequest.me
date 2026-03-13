import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — sidequest.me",
  description: "Privacy Policy for sidequest.me",
};

export default function PrivacyPage() {
  const lastUpdated = "13 March 2026";

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
            We store content you create on the Service: text updates, photos, project details,
            and associated metadata such as location tags where you choose to add them.
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
            <li>Deliver push notifications you have opted in to receive</li>
            <li>Understand and improve how the Service is used</li>
            <li>Diagnose technical problems and ensure platform stability</li>
            <li>Comply with legal obligations</li>
          </ul>
          <p>
            We do not sell your personal data. We do not use your data for targeted advertising.
          </p>
        </section>

        <section>
          <h2>3. Third-Party Services</h2>
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
          <h2>4. Data Retention</h2>
          <p>
            We retain your account data and content for as long as your account is active.
            If you delete your account, we will delete your personal data within 30 days,
            except where we are required to retain it by law. Analytics data is retained in
            accordance with the retention settings of the respective analytics provider
            (typically 14 months for Google Analytics).
          </p>
        </section>

        <section>
          <h2>5. Your Rights</h2>
          <p>
            Under UK GDPR, you have the right to access, correct, or delete your personal data;
            to restrict or object to processing; and to data portability. To exercise any of these
            rights, contact us at the address below. You also have the right to lodge a complaint
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
          <h2>6. Cookies</h2>
          <p>
            The Service uses cookies and similar technologies for authentication (session cookies)
            and analytics. Analytics cookies may be set by Google Analytics. You can control
            cookies through your browser settings; note that disabling cookies may affect the
            functionality of the Service.
          </p>
        </section>

        <section>
          <h2>7. Children</h2>
          <p>
            The Service is not directed at children under 13. We do not knowingly collect personal
            data from children under 13. If you believe a child has provided us with personal data,
            please contact us so we can delete it.
          </p>
        </section>

        <section>
          <h2>8. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify registered users
            of material changes. Continued use of the Service after changes are posted constitutes
            acceptance of the updated policy.
          </p>
        </section>

        <section>
          <h2>9. Contact</h2>
          <p>
            For privacy-related questions or requests, contact us at:{" "}
            <a href="mailto:privacy@sidequest.me">privacy@sidequest.me</a>
          </p>
        </section>
      </div>
    </main>
  );
}
