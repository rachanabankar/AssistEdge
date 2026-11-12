import LegalPageLayout from "../components/layout/LegalPageLayout";
import { SUPPORT_EMAIL } from "../config/constants";

export default function PrivacyPolicy() {
  return (
    <LegalPageLayout title="Privacy Policy" otherPage="/terms" otherTitle="Terms of Service">
      <p>AssistEdge is an internship and demonstration project for AI-assisted customer-support coaching. This policy explains how we handle information when you use the app.</p>
      <section>
        <h2>What we collect</h2>
        <ul>
          <li>Account information such as your name and email. For password-based accounts, we store a hashed password, never a plain-text password.</li>
          <li>Your Google profile name, email address, and picture when you use Google sign-in.</li>
          <li>Optional profile details and an avatar that you choose to provide.</li>
          <li>Support-session messages and generated analysis, including sentiment, escalation risk, coaching suggestions, and reports.</li>
          <li>Uploaded knowledge-base documents and support tickets you submit.</li>
        </ul>
      </section>
      <section>
        <h2>How we use information</h2>
        <p>We use this information to provide account features, authenticate users, display profiles, analyze support conversations, suggest coaching, generate reports, retrieve relevant knowledge, and respond to support tickets.</p>
      </section>
      <section>
        <h2>Services that process data</h2>
        <ul>
          <li>Google provides sign-in and the profile information described above.</li>
          <li>Groq processes conversation text for large language model (LLM) analysis and coaching.</li>
          <li>Resend processes transactional email, such as password-reset messages.</li>
          <li>Neon hosts the database.</li>
          <li>Render hosts the backend.</li>
          <li>Vercel hosts the frontend.</li>
        </ul>
        <p className="mt-3">These services process the information needed for their respective functions. Google user data is used only for authentication and profile display. We do not sell it or share it for advertising.</p>
      </section>
      <section>
        <h2>Storage, retention, and security</h2>
        <p>Your authentication token (JWT) is stored in your browser's localStorage to keep you signed in. Information is retained until you request account deletion. We use password hashing, authenticated access to account features, and encrypted HTTPS connections in the hosted app. No storage or transmission method can guarantee complete security. Avoid uploading sensitive customer information or documents you are not authorized to share.</p>
      </section>
      <section>
        <h2>Your choices and contact</h2>
        <p>You can request access to, correction of, or deletion of your information, including account deletion, by contacting us. For privacy questions or requests, contact: {SUPPORT_EMAIL}.</p>
      </section>
    </LegalPageLayout>
  );
}
