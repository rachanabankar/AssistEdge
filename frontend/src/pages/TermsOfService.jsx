import LegalPageLayout from "../components/layout/LegalPageLayout";
import { SUPPORT_EMAIL } from "../config/constants";

export default function TermsOfService() {
  return (
    <LegalPageLayout title="Terms of Service" otherPage="/privacy" otherTitle="Privacy Policy">
      <p>By using AssistEdge, you agree to these terms. AssistEdge is an internship and demonstration project for practicing and reviewing customer-support conversations.</p>
      <section>
        <h2>Acceptable use</h2>
        <p>Use AssistEdge lawfully and respectfully. Do not upload content you lack permission to use, expose confidential or sensitive personal information without authorization, harass others, introduce malicious software, attempt unauthorized access, or disrupt the service.</p>
      </section>
      <section>
        <h2>Your account</h2>
        <p>Provide accurate account information, keep your sign-in credentials secure, and take responsibility for activity under your account. Contact us if you believe someone has accessed your account without permission.</p>
      </section>
      <section>
        <h2>Review AI output</h2>
        <p>AI-generated replies, sentiment scores, escalation assessments, coaching, and reports may be inaccurate, incomplete, or inappropriate for a particular situation. A human must review all AI output before using it with real customers. You are responsible for decisions and messages based on that output.</p>
      </section>
      <section>
        <h2>No warranty</h2>
        <p>This demonstration project is provided "as is" and "as available," without warranties to the extent permitted by law. We do not guarantee accuracy, availability, reliability, or fitness for any particular purpose.</p>
      </section>
      <section>
        <h2>Limitation of liability</h2>
        <p>To the extent permitted by law, the project and its maintainers are not liable for losses arising from use of, or inability to use, AssistEdge, including inaccurate AI output, lost data, lost profits, or service interruptions. These terms do not exclude liability or rights that cannot legally be excluded.</p>
      </section>
      <section>
        <h2>Account suspension</h2>
        <p>We may suspend or terminate accounts that violate these terms, misuse the service, or threaten its security or operation.</p>
      </section>
      <section>
        <h2>Changes to these terms</h2>
        <p>We may update these terms as the project changes. Updates will appear on this page with a revised last-updated date. Review the terms periodically; continued use after an update means you accept the revised terms.</p>
      </section>
      <section>
        <h2>Contact</h2>
        <p>For questions about these terms or your account, contact: {SUPPORT_EMAIL}.</p>
      </section>
    </LegalPageLayout>
  );
}
