import React from "react";
import Badge from "../ui/Badge";
import "./privacypolicy.css";

const LAST_UPDATED = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

const PrivacyPolicy = () => (
  <main className='erp-doc-page' aria-label='Privacy Policy'>
    <div className='erp-page-header'>
      <div>
        <h1 className='erp-page-title'>Institutional Privacy & Data Governance</h1>
        <p className='erp-page-subtitle'>
          Standard data protection protocols, retention schedules, and academic record confidentiality.
        </p>
      </div>
      <Badge variant='neutral'>Revision: {LAST_UPDATED}</Badge>
    </div>

    <div className='erp-doc-card erp-card'>
      <section className='erp-policy-section'>
        <h2 className='erp-policy-heading'>1. Purpose & Scope</h2>
        <p className='erp-doc-text'>
          The Attendance Management System (AMS) operates under strict academic privacy guidelines. This policy delineates the collection, retention, and processing of enrollment records and presence logs across academic faculties.
        </p>
      </section>

      <section className='erp-policy-section'>
        <h2 className='erp-policy-heading'>2. Telemetry & Data Collection</h2>
        <p className='erp-doc-text'>
          When using AMS, the system processes only the minimal dataset required for academic presence verification:
        </p>
        <ul className='erp-policy-list'>
          <li><strong>Institutional Identity:</strong> Full legal name, university enrollment UID, and institutional email address.</li>
          <li><strong>Attendance Verification Logs:</strong> Course identifier, timestamped session check-in receipts, and faculty signature hashes.</li>
          <li><strong>Access Governance Data:</strong> Role designation (Student vs Faculty/Staff) ensuring strict access boundary isolation.</li>
        </ul>
      </section>

      <section className='erp-policy-section'>
        <h2 className='erp-policy-heading'>3. Role Isolation & Access Control (RBAC)</h2>
        <p className='erp-doc-text'>
          Administrative features, token generation engines, and campus-wide rosters are strictly isolated behind cryptographic authorization checks. Students can solely inspect their own transcripts and submit check-ins during authorized windows.
        </p>
      </section>

      <section className='erp-policy-section'>
        <h2 className='erp-policy-heading'>4. Data Security & Cryptographic Storage</h2>
        <p className='erp-doc-text'>
          All network communications utilize TLS/HTTPS encryption. Session tokens and passwords are salted and hashed with standard industry algorithms (bcrypt), preventing unauthorized enumeration or credential replay.
        </p>
      </section>
    </div>
  </main>
);

export default PrivacyPolicy;
