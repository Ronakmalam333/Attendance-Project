import React from "react";
import Icons from "../ui/Icons";
import "./Help.css";

const Help = () => {
  return (
    <div className='help-container'>
      <div className='support-title'>
        <h1>Help & Technical Support</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "4px" }}>
          Frequently asked questions and student support for the Attendance Management System.
        </p>
      </div>

      <div className='help-content'>
        <div className='faq-section'>
          <h2>Frequently Asked Questions</h2>
          <ul>
            <li>
              <strong>How do I check in with a 4-digit session token?</strong>
              <p>
                Navigate to the Check-in Station or Dashboard Overview, enter the 4-character code displayed by your instructor in class, and click "Verify & Submit Attendance".
              </p>
            </li>
            <li>
              <strong>How is the mandatory 75% attendance threshold tracked?</strong>
              <p>
                Your overall rate and per-course percentages update automatically as attendance receipts are registered. If your attendance falls below 75%, visual indicators will alert you before semester exam clearance.
              </p>
            </li>
            <li>
              <strong>What should I do if I miss a check-in due to connection issues?</strong>
              <p>
                Inform your instructor immediately after lecture. You can also file a discrepancy ticket via the System & Campus Feedback Desk within 24 hours.
              </p>
            </li>
            <li>
              <strong>How do I update my profile or password?</strong>
              <p>
                Visit your Profile settings from the navigation bar menu to verify your UID, degree course, semester, and personal details.
              </p>
            </li>
          </ul>
        </div>

        <div className='contact-section'>
          <h2>Academic Support Assistance</h2>
          <p>If you encounter technical glitches or require attendance discrepancy review:</p>
          <ul>
            <li>System Status: Active & Operational</li>
            <li>In-person Support: Department Academic Coordinator Desk</li>
            <li>Online Submissions: Available via the Campus Feedback Desk</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Help;
