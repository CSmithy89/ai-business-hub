import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | HYVVE',
  description: 'Terms of Service for the HYVVE platform',
};

/**
 * Terms of Service Page
 *
 * Legal terms governing the use of the HYVVE platform.
 */
export default function TermsPage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1>Terms of Service</h1>

      <p className="text-gray-600">Last updated: December 2024</p>

      <section>
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using the HYVVE platform (&quot;Service&quot;), you
          agree to be bound by these Terms of Service (&quot;Terms&quot;). If
          you do not agree to these Terms, please do not use the Service.
        </p>
      </section>

      <section>
        <h2>2. Description of Service</h2>
        <p>
          HYVVE is an AI-powered business orchestration platform designed to
          help small and medium businesses automate operations through
          intelligent AI agents. The Service provides:
        </p>
        <ul>
          <li>AI-powered business automation</li>
          <li>Workflow management and approval systems</li>
          <li>Business planning and validation tools</li>
          <li>Integration with third-party AI providers</li>
        </ul>
      </section>

      <section>
        <h2>3. Account Registration</h2>
        <p>
          To use certain features of the Service, you must create an account.
          You agree to:
        </p>
        <ul>
          <li>Provide accurate and complete information</li>
          <li>Maintain the security of your account credentials</li>
          <li>
            Notify us immediately of any unauthorized access to your account
          </li>
          <li>Accept responsibility for all activities under your account</li>
        </ul>
      </section>

      <section>
        <h2>4. BYOAI (Bring Your Own AI)</h2>
        <p>
          HYVVE uses a BYOAI model where you provide your own API keys for AI
          services. You are responsible for:
        </p>
        <ul>
          <li>
            Obtaining and maintaining valid API keys from supported providers
          </li>
          <li>Complying with the terms of service of your AI providers</li>
          <li>All costs associated with AI API usage</li>
          <li>Ensuring your API keys are kept secure</li>
        </ul>
      </section>

      <section>
        <h2>5. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the Service for any unlawful purpose</li>
          <li>Attempt to gain unauthorized access to any part of the Service</li>
          <li>Interfere with or disrupt the Service</li>
          <li>
            Use the Service to generate harmful, misleading, or illegal content
          </li>
          <li>
            Violate the rights of others, including intellectual property rights
          </li>
        </ul>
      </section>

      <section>
        <h2>6. Data and Privacy</h2>
        <p>
          Your use of the Service is also governed by our{' '}
          <a href="/privacy" className="text-[#FF6B6B] hover:underline">
            Privacy Policy
          </a>
          . By using the Service, you consent to the collection and use of
          information as described in the Privacy Policy.
        </p>
      </section>

      <section>
        <h2>7. Intellectual Property</h2>
        <p>
          The Service and its original content, features, and functionality are
          owned by HYVVE and are protected by international copyright,
          trademark, and other intellectual property laws.
        </p>
      </section>

      <section>
        <h2>8. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, HYVVE shall not be liable for
          any indirect, incidental, special, consequential, or punitive damages
          resulting from your use of the Service.
        </p>
      </section>

      <section>
        <h2>9. Changes to Terms</h2>
        <p>
          We reserve the right to modify these Terms at any time. We will notify
          you of any changes by posting the new Terms on this page and updating
          the &quot;Last updated&quot; date.
        </p>
      </section>

      <section>
        <h2>10. Contact Us</h2>
        <p>
          If you have any questions about these Terms, please contact us at{' '}
          <a
            href="mailto:legal@hyvve.io"
            className="text-[#FF6B6B] hover:underline"
          >
            legal@hyvve.io
          </a>
          .
        </p>
      </section>
    </article>
  );
}
