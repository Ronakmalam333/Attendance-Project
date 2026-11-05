import React from "react";
import Icons from "../ui/Icons";
import Badge from "../ui/Badge";
import "./aboutus.css";

const corePillars = [
  {
    icon: Icons.Clock,
    title: "Real-time Attendance Telemetry",
    description: "Instantaneous classroom verification using synchronized 4-character session tokens with automated expiration.",
  },
  {
    icon: Icons.Calendar,
    title: "Institutional Analytics & Roster",
    description: "Audit-ready reporting, automated compliance threshold monitoring (75% statutory rule), and student directories.",
  },
  {
    icon: Icons.Shield,
    title: "Enterprise Access Governance",
    description: "Strict role-based access control (RBAC) separating administrative powers from student check-in portals.",
  },
];

const teamMembers = [
  {
    name: "Ronak Malam",
    role: "Project Originator & Lead Developer",
    dept: "Computer Science & Engineering",
  },
];

const faqs = [
  {
    q: "How does AMS eliminate proxy attendance?",
    a: "Session tokens are ephemeral 4-character alphanumeric codes generated live by professors in lecture halls. They auto-expire within minutes and require an active authenticated student session tied to their university UID.",
  },
  {
    q: "How is the 75% attendance rule monitored?",
    a: "The telemetry engine aggregates theory lectures and laboratory contact hours continuously. When a student falls below 75%, visual indicators and advisory warnings trigger on both student and faculty dashboards.",
  },
  {
    q: "What if Wi-Fi disconnection causes a missed check-in?",
    a: "Students can request attendance reconciliation through their course instructor within 24 hours. Faculty can review timestamps and adjust records with audit trail justification.",
  },
  {
    q: "Can attendance records be exported for university audits?",
    a: "Yes. Both students and administrators can generate official cryptographically timestamped PDF transcripts and Excel rosters containing complete verification signatures.",
  },
];

const AboutUs = () => {
  return (
    <div className='erp-doc-page'>
      {/* Header */}
      <div className='erp-page-header'>
        <div>
          <h1 className='erp-page-title'>About AMS Enterprise</h1>
          <p className='erp-page-subtitle'>
            Next-Generation Academic Telemetry & Attendance Management System.
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <Badge variant='brand'>System Version 2.4</Badge>
          <Badge variant='present'>Active</Badge>
        </div>
      </div>

      {/* Mission & Core Architecture */}
      <div className='erp-doc-card erp-card'>
        <h2 className='erp-card-title'>Institutional Mission & Platform Architecture</h2>
        <p className='erp-doc-text'>
          The Attendance Management System (AMS) was engineered to eliminate paper attendance registries, manual roll calls, and delayed reporting across modern higher education environments. By coupling temporary 4-character session codes with role-governed authorization, AMS guarantees data integrity, transparent student transcripts, and instant academic auditing.
        </p>

        <div className='erp-pillars-grid'>
          {corePillars.map((pillar, i) => {
            const IconComponent = pillar.icon;
            return (
              <div key={i} className='erp-pillar-item'>
                <div className='erp-pillar-icon'>
                  <IconComponent size={20} />
                </div>
                <div>
                  <h3 className='erp-pillar-title'>{pillar.title}</h3>
                  <p className='erp-pillar-desc'>{pillar.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Project Originator & Lead Developer */}
      <div className='erp-doc-card erp-card'>
        <h2 className='erp-card-title' style={{ marginBottom: "16px" }}>
          Project Originator & Lead Developer
        </h2>
        <div className='erp-team-grid'>
          {teamMembers.map((member, i) => (
            <div key={i} className='erp-team-card'>
              <div className='erp-team-avatar'>
                <Icons.User size={20} />
              </div>
              <div className='erp-team-info'>
                <h3 className='erp-team-name'>{member.name}</h3>
                <span className='erp-team-role'>{member.role}</span>
                <span className='erp-team-dept'>{member.dept}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Architecture & FAQs Grid */}
      <div className='erp-card erp-faq-card'>
        <div className='erp-section-header-row'>
          <div>
            <h2 className='erp-card-title'>Frequently Asked Questions & Academic Standards</h2>
            <p className='erp-card-desc'>
              Common policies regarding token verification, statutory 75% thresholds, and transcript audits.
            </p>
          </div>
          <Badge variant='neutral'>Knowledge Base</Badge>
        </div>

        <div className='erp-faqs-grid'>
          {faqs.map((f, i) => (
            <div key={i} className='erp-faq-item'>
              <div className='erp-faq-q-row'>
                <Icons.Info size={16} className='text-brand' />
                <h4>{f.q}</h4>
              </div>
              <p>{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
