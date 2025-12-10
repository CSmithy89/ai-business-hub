import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | HYVVE',
  description: 'Privacy Policy for the HYVVE platform',
};

/**
 * Privacy Policy Page
 *
 * Describes how HYVVE collects, uses, and protects user data.
 */
export default function PrivacyPage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1>Privacy Policy</h1>

      <p className="text-gray-600">Last updated: December 2024</p>

      <section>
        <h2>1. Introduction</h2>
        <p>
          HYVVE (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed
          to protecting your privacy. This Privacy Policy explains how we
          collect, use, disclose, and safeguard your information when you use
          our AI-powered business orchestration platform.
        </p>
      </section>

      <section>
        <h2>2. Information We Collect</h2>

        <h3>2.1 Information You Provide</h3>
        <ul>
          <li>
            <strong>Account Information:</strong> Name, email address, password,
            and profile information
          </li>
          <li>
            <strong>Business Information:</strong> Business name, industry,
            goals, and operational data
          </li>
          <li>
            <strong>API Keys:</strong> Third-party AI provider API keys (stored
            encrypted)
          </li>
          <li>
            <strong>Communications:</strong> Messages and feedback you send to
            us
          </li>
        </ul>

        <h3>2.2 Information Collected Automatically</h3>
        <ul>
          <li>
            <strong>Usage Data:</strong> Pages visited, features used, and
            interactions with AI agents
          </li>
          <li>
            <strong>Device Information:</strong> Browser type, operating system,
            and device identifiers
          </li>
          <li>
            <strong>Log Data:</strong> IP address, access times, and referring
            URLs
          </li>
        </ul>
      </section>

      <section>
        <h2>3. How We Use Your Information</h2>
        <p>We use the collected information to:</p>
        <ul>
          <li>Provide and maintain the Service</li>
          <li>Process your AI automation requests</li>
          <li>Personalize your experience</li>
          <li>Communicate with you about updates and support</li>
          <li>Improve our Service and develop new features</li>
          <li>Detect and prevent fraud and security issues</li>
        </ul>
      </section>

      <section>
        <h2>4. Data Security</h2>
        <p>We implement industry-standard security measures including:</p>
        <ul>
          <li>
            <strong>Encryption:</strong> AES-256-GCM encryption for sensitive
            data like API keys
          </li>
          <li>
            <strong>Password Security:</strong> Argon2id hashing for passwords
          </li>
          <li>
            <strong>Secure Sessions:</strong> HTTP-only cookies with secure
            flags
          </li>
          <li>
            <strong>Access Controls:</strong> Role-based access and
            multi-tenancy isolation
          </li>
        </ul>
      </section>

      <section>
        <h2>5. Third-Party Services</h2>
        <p>
          HYVVE integrates with third-party AI providers (OpenAI, Anthropic,
          Google, etc.) using your provided API keys. When you use these
          integrations:
        </p>
        <ul>
          <li>Your data is sent to these providers per your instructions</li>
          <li>
            Each provider&apos;s privacy policy applies to their processing
          </li>
          <li>We do not control how third-party providers use your data</li>
        </ul>
      </section>

      <section>
        <h2>6. Data Retention</h2>
        <p>We retain your information for as long as your account is active. You can request deletion of your data at any time. Some information may be retained for legal or operational purposes.</p>
      </section>

      <section>
        <h2>7. Your Rights</h2>
        <p>Depending on your location, you may have rights including:</p>
        <ul>
          <li>Access to your personal data</li>
          <li>Correction of inaccurate data</li>
          <li>Deletion of your data</li>
          <li>Data portability</li>
          <li>Objection to certain processing</li>
          <li>Withdrawal of consent</li>
        </ul>
      </section>

      <section>
        <h2>8. Cookies</h2>
        <p>
          We use essential cookies for authentication and session management.
          These are strictly necessary for the Service to function and cannot be
          disabled.
        </p>
      </section>

      <section>
        <h2>9. Children&apos;s Privacy</h2>
        <p>
          The Service is not intended for users under 18 years of age. We do not
          knowingly collect information from children.
        </p>
      </section>

      <section>
        <h2>10. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy periodically. We will notify you of
          significant changes by posting the new policy and updating the
          &quot;Last updated&quot; date.
        </p>
      </section>

      <section>
        <h2>11. Contact Us</h2>
        <p>
          For privacy-related questions or to exercise your rights, contact us
          at{' '}
          <a
            href="mailto:privacy@hyvve.io"
            className="text-[#FF6B6B] hover:underline"
          >
            privacy@hyvve.io
          </a>
          .
        </p>
      </section>
    </article>
  );
}
