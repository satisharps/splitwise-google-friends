import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const PrivacyPolicy = () => {
  const lastUpdated = "May 1, 2026";
  const appName = "SplitEase";
  const contactEmail = "support@satty.in";
  const websiteUrl = "https://satty.in";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center gap-3 px-4">
          <Button asChild variant="ghost" size="icon">
            <Link to="/" aria-label="Back to home">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-lg font-semibold">Privacy Policy</h1>
        </div>
      </header>

      <main className="container max-w-3xl px-4 py-8">
        <article className="prose prose-sm md:prose-base max-w-none text-foreground">
          <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mb-8">Last updated: {lastUpdated}</p>

          <section className="space-y-4">
            <p>
              This Privacy Policy describes how {appName} ("we", "us", or "our") collects, uses,
              stores, shares, and protects your information when you use our mobile application
              and website (collectively, the "Service"). By using the Service you agree to this
              Policy.
            </p>

            <h2 className="text-xl font-semibold mt-8">1. Information We Collect</h2>
            <p>We collect the following categories of information:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Account information:</strong> name, email address, profile picture and
                authentication identifiers provided when you sign in with email or Google.
              </li>
              <li>
                <strong>User content:</strong> expense groups, expenses, splits, settlements,
                notes and any other content you create within the app.
              </li>
              <li>
                <strong>Device & technical data:</strong> device model, OS version, app version,
                language, crash logs, and basic diagnostics needed to keep the app stable.
              </li>
              <li>
                <strong>Usage data:</strong> in-app actions (e.g. group created, expense added)
                used in aggregate to improve the product.
              </li>
            </ul>
            <p>
              We do <strong>not</strong> collect contacts, SMS, call logs, location, photos,
              microphone, or camera data.
            </p>

            <h2 className="text-xl font-semibold mt-8">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To create and authenticate your account.</li>
              <li>To provide the core expense-sharing and settlement features.</li>
              <li>To sync your data across devices.</li>
              <li>To diagnose crashes, prevent abuse and improve performance.</li>
              <li>To communicate important service or security notices.</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8">3. Legal Basis (GDPR)</h2>
            <p>
              Where GDPR applies, we process personal data based on (a) your consent, (b)
              performance of our contract to provide the Service, (c) compliance with legal
              obligations, and (d) our legitimate interest in operating and improving the Service.
            </p>

            <h2 className="text-xl font-semibold mt-8">4. Data Sharing</h2>
            <p>We do not sell your personal data. We share data only with:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Other group members</strong> you choose to share an expense group with
                (name, avatar, and expenses you add to that group).
              </li>
              <li>
                <strong>Service providers</strong> that host our backend (Lovable Cloud /
                Supabase) and authentication (Google Sign-In), bound by contractual data
                protection obligations.
              </li>
              <li>
                <strong>Authorities</strong> when required by law, court order, or to protect
                rights, safety, or security.
              </li>
            </ul>

            <h2 className="text-xl font-semibold mt-8">5. Data Retention</h2>
            <p>
              We retain your account data for as long as your account is active. When you delete
              your account, your profile, groups you own, expenses, splits, and settlements are
              permanently removed from our active systems within 30 days. Backup copies are
              purged on a rolling 90-day cycle.
            </p>

            <h2 className="text-xl font-semibold mt-8">6. Data Security</h2>
            <p>
              All data is transmitted over HTTPS/TLS. Stored data is protected by row-level
              security policies, access controls, and encryption at rest provided by our
              infrastructure provider. No method of transmission or storage is 100% secure, but
              we work hard to protect your information.
            </p>

            <h2 className="text-xl font-semibold mt-8">7. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access the personal data we hold about you.</li>
              <li>Correct inaccurate data via the in-app profile settings.</li>
              <li>
                <strong>Delete your account and all associated data</strong> directly from the
                app: open the avatar menu (top-right) → <em>Delete account</em>.
              </li>
              <li>Export a copy of your data by emailing us.</li>
              <li>Withdraw consent or object to processing where applicable.</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8">8. Children's Privacy</h2>
            <p>
              The Service is not directed to children under 13 (or 16 in the EEA). We do not
              knowingly collect personal information from children. If you believe a child has
              provided us with personal data, contact us and we will delete it.
            </p>

            <h2 className="text-xl font-semibold mt-8">9. International Transfers</h2>
            <p>
              Your data may be processed in countries other than your own. Where required, we
              rely on Standard Contractual Clauses or equivalent safeguards.
            </p>

            <h2 className="text-xl font-semibold mt-8">10. Third-Party Services</h2>
            <p>
              The app uses Google Sign-In for authentication. Google's handling of your data is
              governed by{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Google's Privacy Policy
              </a>
              .
            </p>

            <h2 className="text-xl font-semibold mt-8">11. Changes to This Policy</h2>
            <p>
              We may update this Policy from time to time. Material changes will be announced
              in-app or by email. The "Last updated" date at the top reflects the latest version.
            </p>

            <h2 className="text-xl font-semibold mt-8">12. Contact Us</h2>
            <p>
              For privacy questions, data requests, or complaints, contact us at:
              <br />
              Email:{" "}
              <a href={`mailto:${contactEmail}`} className="text-primary underline">
                {contactEmail}
              </a>
              <br />
              Website:{" "}
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                {websiteUrl}
              </a>
            </p>
          </section>
        </article>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
