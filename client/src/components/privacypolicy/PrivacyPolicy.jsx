import React from 'react';
import './privacypolicy.css';

const LAST_UPDATED = "25/06/2025";
const CONTACT = {
  email: "anmolsinha4321@gmail.com",
  phone: "+918733942557",
};

const PrivacyPolicy = () => (
  <main className="privacy-policy-container" aria-label="Privacy Policy">
    <h1>Privacy Policy</h1>
    <p>
      <strong>Last Updated:</strong> {LAST_UPDATED}
    </p>

    <section>
      <h2>1. Introduction</h2>
      <p>
        Welcome to CampusTrack. We are committed to protecting your privacy and ensuring that your personal information is handled in a safe and responsible manner. This Privacy Policy outlines how we collect, use, and protect your information when you use our college attendance app.
      </p>
    </section>

    <section>
      <h2>2. Information We Collect</h2>
      <p>
        We may collect the following types of information:
      </p>
      <ul>
        <li><strong>Personal Information:</strong> Name, student ID, email address, and other identifiable information.</li>
        <li><strong>Attendance Data:</strong> Records of your attendance in classes, lectures, and other college-related activities.</li>
        <li><strong>Device Information:</strong> IP address, device type, operating system, and browser type.</li>
        <li><strong>Usage Data:</strong> Information about how you interact with the app, including log data and usage patterns.</li>
      </ul>
    </section>

    <section>
      <h2>3. Cookies & Tracking Technologies</h2>
      <p>
        We may use cookies and similar tracking technologies to enhance your experience and gather information about usage patterns. You can adjust your browser settings to refuse cookies or to alert you when cookies are being sent. (We do not use cookies for advertising or third-party tracking.)
      </p>
    </section>

    <section>
      <h2>4. How We Use Your Information</h2>
      <p>
        We use the information we collect for the following purposes:
      </p>
      <ul>
        <li>To track and manage attendance records.</li>
        <li>To communicate with you regarding your attendance and other college-related matters.</li>
        <li>To improve the functionality and user experience of the app.</li>
        <li>To comply with legal obligations and college policies.</li>
      </ul>
    </section>

    <section>
      <h2>5. Data Security</h2>
      <p>
        We implement a variety of security measures to maintain the safety of your personal information. These measures include encryption, access controls, and regular security audits.
      </p>
    </section>

    <section>
      <h2>6. Data Retention</h2>
      <p>
        We retain your personal information only as long as necessary to fulfill the purposes outlined in this policy, unless a longer retention period is required or permitted by law.
      </p>
    </section>

    <section>
      <h2>7. Data Sharing</h2>
      <p>
        We do not sell, trade, or otherwise transfer your personal information to outside parties except as described below:
      </p>
      <ul>
        <li>With your consent.</li>
        <li>To comply with legal obligations or college policies.</li>
        <li>To trusted third parties who assist us in operating our app, conducting our business, or servicing you, so long as those parties agree to keep this information confidential.</li>
      </ul>
    </section>

    <section>
      <h2>8. Your Rights</h2>
      <p>
        You have the right to:
      </p>
      <ul>
        <li>Access and review your personal information.</li>
        <li>Request corrections to any inaccurate or incomplete data.</li>
        <li>Request the deletion of your personal information, subject to certain legal and college policy constraints.</li>
      </ul>
    </section>

    <section>
      <h2>9. Children's Privacy</h2>
      <p>
        Our service is not intended for children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us.
      </p>
    </section>

    <section>
      <h2>10. Changes to This Privacy Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated revision date. We encourage you to review this Privacy Policy periodically to stay informed about how we are protecting your information.
      </p>
    </section>

    <section>
      <h2>11. Contact Us</h2>
      <p>
        If you have any questions or concerns about this Privacy Policy, please contact us at:
      </p>
      <p>
        <strong>Email: </strong>
        <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a><br />
        <strong>Phone: </strong>
        <a href={`tel:${CONTACT.phone}`}>{CONTACT.phone}</a>
      </p>
    </section>
  </main>
);

export default PrivacyPolicy;