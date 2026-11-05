const { GoogleGenerativeAI } = require("@google/generative-ai");

// ============================================================================
// AMS CANONICAL KNOWLEDGE BASE
// ============================================================================
const AMS_KNOWLEDGE = {
  identity: {
    systemName: "AMS (Attendance Management System) Enterprise Academic Platform",
    version: "v2.4.0 (Slate Enterprise Edition)",
    originator: "Ronak Malam",
    originatorRole: "Project Originator & Lead Developer",
    originatorContact: "itzronakmalam94@gmail.com",
    institution: "Rai University / Institutional Higher Education",
    supportedCourses: [
      "B.Tech Computer Science & Engineering",
      "B.Tech Information Technology",
      "B.Tech Electronics & Communication",
      "B.Tech Mechanical Engineering",
      "B.Tech Civil Engineering",
      "BCA (Computer Applications)",
      "MCA (Master of Computer Applications)",
    ],
  },
  policies: {
    statutoryAttendanceRequirement: 75,
    reconciliationWindowHours: 24,
    tokenLength: 4,
    tokenValidityMinutes: "Configurable by instructor (default 10-15 minutes)",
    dailySubmissionLimit: "1 attendance per subject per student per day",
    uidImmutable: true,
  },
};

// ============================================================================
// TOPIC INTENTS & IN-DEPTH EXPERT RESPONSES
// ============================================================================
const KNOWLEDGE_TOPICS = [
  // 1. Project Originator & Developer
  {
    id: "developer_info",
    keywords: [
      "who made", "who created", "who built", "who developed", "developer", "creator",
      "author", "originator", "lead developer", "ronak", "malam", "ronak malam",
      "who programmed", "system architect", "owner", "credits"
    ],
    title: "👨‍💻 Project Originator & Lead Developer",
    response: `**Project Originator & Lead Developer:**\n\n` +
      `The Attendance Management System (AMS) was conceived, architected, and built by **Ronak Malam**, who serves as the **Project Originator & Lead Developer**.\n\n` +
      `**Platform Overview:**\n` +
      `• **System:** ${AMS_KNOWLEDGE.identity.systemName}\n` +
      `• **Role:** ${AMS_KNOWLEDGE.identity.originatorRole}\n` +
      `• **Contact:** \`itzronakmalam94@gmail.com\`\n` +
      `• **Version:** ${AMS_KNOWLEDGE.identity.version}\n` +
      `• **Architecture:** Full-stack React 19 + Node.js/Express, Slate Enterprise UI, MongoDB with real-time token telemetry & DNS-level email security.\n\n` +
      `For architectural inquiries or institutional feedback, navigate to the **About Us** page or use the Feedback grievance portal.`,
  },

  // 2. How to Mark Attendance (Student)
  {
    id: "mark_attendance",
    keywords: [
      "how to mark", "how to attend", "submit attendance", "mark my attendance",
      "give attendance", "enter token", "enter code", "punch attendance", "register presence",
      "check in", "student attendance"
    ],
    title: "📝 How to Submit Attendance (Students)",
    response: `**How to Submit Attendance (Student Guide):**\n\n` +
      `1. **Obtain Token:** Your lecture professor will generate and display a unique **4-character token** (e.g., \`A7B2\`) during class.\n` +
      `2. **Navigate:** From your student sidebar, click on **'Mark Attendance'** (or click the quick attendance widget on your Dashboard).\n` +
      `3. **Enter Token:** Type the 4-character code into the token input field.\n` +
      `4. **Submit:** Click the **'Submit Attendance'** button.\n` +
      `5. **Verify:** You will receive an instantaneous green confirmation toast. Your attendance record will immediately reflect under **'My Attendance'**.\n\n` +
      `⚠️ **Key Rules:**\n` +
      `• Tokens auto-expire once class contact hours conclude.\n` +
      `• Only one submission is permitted per subject per day.\n` +
      `• You must be logged into your verified student account tied to your UID.`,
  },

  // 3. 75% Statutory Rule & Percentage Calculation
  {
    id: "attendance_rule_75",
    keywords: [
      "75%", "75 percent", "minimum attendance", "attendance rule", "statutory rule",
      "shortage", "detained", "exam hall ticket", "low attendance", "eligibility",
      "attendance percentage", "how is percentage calculated", "calculate attendance",
      "below 75", "less than 75", "attendance percent", "attendance criteria",
      "attendance required", "attendance requirement", "attendance shortage",
      "60%", "65%", "attendance calculation"
    ],
    title: "⚖️ 75% Statutory Attendance Rule & Calculation",
    response: `**Statutory 75% Attendance Requirement:**\n\n` +
      `In accordance with university academic regulations, every student must maintain a **minimum of 75% aggregate attendance** across all enrolled theory and laboratory courses to remain eligible for end-semester examinations.\n\n` +
      `**How Attendance Percentage is Calculated:**\n` +
      `$$\\text{Attendance \\%} = \\left( \\frac{\\text{Total Contact Hours Attended}}{\\text{Total Conducted Contact Hours}} \\right) \\times 100$$\n\n` +
      `**Telemetry Indicators on Dashboard:**\n` +
      `• 🟢 **75% and Above:** Compliant / Eligible for examination hall ticket.\n` +
      `• 🟡 **65% - 74%:** Advisory Warning — student must attend upcoming sessions consistently.\n` +
      `• 🔴 **Below 65%:** Critical Shortage — deanery notification and parental intimation triggered.\n\n` +
      `💡 **Recovery Tip:** If your attendance is currently below 75%, navigate to **'My Attendance'** to calculate how many consecutive lectures you must attend to cross the 75% safety threshold.`,
  },

  // 4. Token Creation & Management (Faculty)
  {
    id: "token_management_faculty",
    keywords: [
      "create token", "generate token", "make token", "new token", "faculty token",
      "token management", "expire token", "deactivate token", "session code", "teacher token"
    ],
    title: "🔑 Token Generation & Management (Faculty Guide)",
    response: `**How Faculty Generate Attendance Tokens:**\n\n` +
      `1. Log in with your **Faculty / Staff** credentials.\n` +
      `2. Click **'Token Management'** in the left navigation sidebar.\n` +
      `3. Click the **'Create New Token'** button.\n` +
      `4. Configure the session parameters:\n` +
      `   • **Subject Name:** Select or enter course title.\n` +
      `   • **Faculty Name:** Assigned instructor.\n` +
      `   • **Valid From & Valid Until:** Set start time and auto-expiration window (e.g., 10 to 15 minutes).\n` +
      `   • **Max Usage:** (Optional) limit token to expected class roster size.\n` +
      `5. Click **'Generate Token'** to produce a randomized 4-character alphanumeric session token.\n` +
      `6. Display or announce the token to students in the classroom.\n\n` +
      `💡 **Faculty Controls:**\n` +
      `• You can manually **Deactivate** an active token at any moment to instantly prevent late entries.\n` +
      `• Active tokens and live redemption counters are tracked in real time.`,
  },

  // 5. Token Issues & Troubleshooting
  {
    id: "token_troubleshooting",
    keywords: [
      "token invalid", "token expired", "token not working", "invalid token",
      "expired code", "code not working", "already used", "token issue", "wrong token"
    ],
    title: "🔧 Resolving Token Errors",
    response: `**Common Token Issues & Instant Fixes:**\n\n` +
      `1. ❌ **'Invalid Token':**\n` +
      `   • Ensure the token is exactly **4 alphanumeric characters** (e.g., \`3F9X\`).\n` +
      `   • Check for character confusion (e.g., letter \`O\` vs number \`0\`, letter \`I\` vs number \`1\`).\n` +
      `   • Make sure your instructor has activated the token.\n\n` +
      `2. ⏳ **'Token Expired':**\n` +
      `   • The instructor's set time limit has elapsed. Request the instructor to extend validity or generate a new session.\n\n` +
      `3. 🔁 **'Attendance Already Submitted':**\n` +
      `   • You have already recorded attendance for this subject today. Check **'My Attendance'** to view your recorded timestamp.\n\n` +
      `4. 📡 **Network Interruption During Submission:**\n` +
      `   • Refresh the page and check **'My Attendance'** before retrying to prevent duplicate errors.`,
  },

  // 6. Attendance Discrepancy & 24-Hour Reconciliation
  {
    id: "discrepancy_reconciliation",
    keywords: [
      "discrepancy", "missed attendance", "wrongly marked absent", "wifi disconnected",
      "proxy", "reconciliation", "marked absent", "attendance correction", "24 hours",
      "teacher marked absent", "fix attendance"
    ],
    title: "🔄 Attendance Discrepancy & 24-Hour Reconciliation",
    response: `**Handling Missed or Inaccurate Attendance:**\n\n` +
      `If you attended a lecture but were marked absent due to technical issues, Wi-Fi outage, or token expiration:\n\n` +
      `1. **24-Hour Statutory Window:** You must request attendance reconciliation within **24 hours** of the lecture session.\n` +
      `2. **Option A — Instructor Direct Resolution:** Approach your subject instructor with lecture notes/proof. Faculty have administrative privileges in **'All Attendance'** to manually update a status from *Absent* to *Present* with an audit justification.\n` +
      `3. **Option B — Raise Grievance Ticket:**\n` +
      `   • Go to **'Feedback & Grievance'** from the sidebar.\n` +
      `   • Select Category: **Attendance Discrepancy**.\n` +
      `   • Specify the Subject, Date, Lecture Time, and Reason.\n` +
      `   • Faculty/Admin will review the session audit log and update your attendance status.`,
  },

  // 7. Grievance & Feedback System
  {
    id: "grievance_feedback",
    keywords: [
      "grievance", "feedback", "complaint", "ticket", "issue ticket", "helpdesk",
      "support ticket", "report problem", "feedback system", "file complaint"
    ],
    title: "🎫 Grievance & Feedback Helpdesk System",
    response: `**Grievance & Feedback Ticketing Portal:**\n\n` +
      `AMS includes a comprehensive ticketing system for both students and faculty:\n\n` +
      `**How to File a Ticket:**\n` +
      `1. Click on **'Feedback'** in the navigation bar or footer.\n` +
      `2. Fill in the ticket fields:\n` +
      `   • **Category:** Academic, Attendance Discrepancy, Infrastructure, or Technical Issue.\n` +
      `   • **Priority:** Low, Medium, High, or Urgent.\n` +
      `   • **Subject & Description:** Detail the inquiry or issue clearly.\n` +
      `3. Click **'Submit Ticket'**.\n\n` +
      `**Tracking & Resolution:**\n` +
      `• View active and closed tickets in your **'My Tickets'** tab.\n` +
      `• Status flows from **Open** ➔ **In Progress** ➔ **Resolved**.\n` +
      `• Administrators receive real-time dashboard notifications for rapid turnaround.`,
  },

  // 8. Exporting Attendance (PDF & Excel)
  {
    id: "export_reports",
    keywords: [
      "export", "download report", "download pdf", "download excel", "pdf", "excel",
      "transcript", "attendance report", "print attendance", "generate report", "roster"
    ],
    title: "📊 Exporting Attendance Records (PDF & Excel)",
    response: `**Generating Institutional Attendance Reports:**\n\n` +
      `**For Students:**\n` +
      `1. Navigate to **'My Attendance'**.\n` +
      `2. (Optional) Filter by subject or custom date range.\n` +
      `3. Click the **'Export PDF'** button for an official cryptographically timestamped transcript with university headers and summary statistics.\n` +
      `4. Or click **'Export Excel'** for raw tabular attendance data.\n\n` +
      `**For Faculty / Admin:**\n` +
      `1. Go to **'All Attendance'**.\n` +
      `2. Filter by Course, Semester, Date, or Subject.\n` +
      `3. Click **'Export Master Roster'** (PDF / Excel) for university compliance audits and departmental records.`,
  },

  // 9. Excel Bulk Import for Students (Faculty)
  {
    id: "bulk_student_import",
    keywords: [
      "bulk import", "import students", "excel import", "csv import", "import excel",
      "upload roster", "upload students", "bulk upload", "student spreadsheet"
    ],
    title: "📁 Excel & CSV Bulk Student Ingestion Engine",
    response: `**Bulk Student Roster Ingestion (Staff Only):**\n\n` +
      `Faculty and Administrators can onboard entire class rosters simultaneously without entering students one by one:\n\n` +
      `1. Go to **'Students Management'** (or **'Student Directory'**).\n` +
      `2. Click **'Bulk Import Excel / CSV'**.\n` +
      `3. Download the standardized Excel template with columns:\n` +
      `   • \`UID\` or \`RollNo\` (e.g., \`23010101\`)\n` +
      `   • \`Name\` (e.g., \`Alex Johnson\`)\n` +
      `   • \`Email\` (e.g., \`alex.j@university.edu\`)\n` +
      `   • \`Course\` (e.g., \`B.Tech Computer Science\`)\n` +
      `   • \`Semester\` (e.g., \`4\`)\n` +
      `4. Upload your filled spreadsheet. The ingestion engine automatically validates data, eliminates duplicate UIDs, hashes default credentials, and enrolls the students.`,
  },

  // 10. Manual Attendance Corrections (Faculty)
  {
    id: "manual_attendance_edit",
    keywords: [
      "edit attendance", "change attendance", "manual attendance", "modify attendance",
      "update attendance", "mark manually", "change to present", "change to absent",
      "override attendance"
    ],
    title: "✏️ Manual Attendance Edits & Audit Overrides (Faculty)",
    response: `**Manual Attendance Status Edits (Faculty/Admin Guide):**\n\n` +
      `1. Go to **'All Attendance'** from the staff sidebar.\n` +
      `2. Use the search bar or filters to locate the specific student and date.\n` +
      `3. In the student's attendance row, click the **Status Badge** or **Edit** action.\n` +
      `4. Select the updated status: **Present**, **Absent**, or **Excused**.\n` +
      `5. The platform logs the editing staff UID and timestamp into the institutional audit trail for compliance verification.\n\n` +
      `⚠️ *Note: Students cannot edit attendance records. All overrides must be conducted by authorized faculty.*`,
  },

  // 11. Timetable & Class Schedule
  {
    id: "timetable_schedule",
    keywords: [
      "timetable", "schedule", "class schedule", "lecture schedule", "routine",
      "class timing", "when is class", "classes today", "weekly schedule",
      "my timetable", "show timetable", "view schedule", "lecture timing",
      "classroom", "periods", "class routine"
    ],
    title: "📅 Timetable & Lecture Schedule",
    response: `**Timetable & Class Schedule Guide:**\n\n` +
      `• **Student Access:** Click **'Timetable'** in your sidebar navigation or check the **Weekly Schedule Preview** directly on your Home Dashboard.\n` +
      `• **Details Displayed:** Day-of-week, contact hour start and end times, subject codes, faculty in charge, and lecture hall / laboratory numbers.\n` +
      `• **Semester Synchronization:** Timetables automatically adjust according to your registered Course and Semester settings in your Profile.`,
  },

  // 12. Profile & Credential Management
  {
    id: "profile_settings",
    keywords: [
      "profile", "change password", "update profile", "my profile", "edit profile",
      "change email", "change uid", "semester update", "profile settings"
    ],
    title: "👤 Managing Profile & Settings",
    response: `**Profile & Account Settings:**\n\n` +
      `1. Click on your **User Avatar** (top-right corner of the navigation bar) and select **'Profile'**.\n` +
      `2. **Editable Fields:**\n` +
      `   • Full Name\n` +
      `   • University Email Address (subject to verification)\n` +
      `   • Current Semester (advances attendance course grouping)\n` +
      `   • Password update\n` +
      `3. 🔒 **UID Immutability:**\n` +
      `   • Your Institutional UID / Enrollment Number cannot be modified by students after registration to preserve academic audit integrity. Contact your campus administrator if your UID was entered erroneously.`,
  },

  // 13. Security, RBAC & Google OAuth SSO
  {
    id: "security_rbac",
    keywords: [
      "security", "rbac", "role based", "roles", "permission", "safe", "google login",
      "google sso", "jwt", "token security", "encryption", "anti proxy"
    ],
    title: "🛡️ Enterprise Security, RBAC & Authentication",
    response: `**Enterprise Security Architecture:**\n\n` +
      `• **Role-Based Access Control (RBAC):** Strict partition between **Student** check-in roles and **Faculty/Staff** administrative roles. Students cannot access token generation or modify attendance records.\n` +
      `• **Cryptographic Passwords:** All passwords hashed via \`bcrypt\` with automated salt rounds.\n` +
      `• **Session Tokens:** Stateless, signed JWT tokens transmitted over secure TLS 1.3 connections.\n` +
      `• **Google SSO:** Sign in with your verified institutional Google Workspace account in one click.\n` +
      `• **Email Guardian:** Automatic blocking of disposable/burner emails and DNS MX verification preventing fake account creation.`,
  },

  // 14. Email Validation & Disposable Mail Prevention
  {
    id: "email_validation_info",
    keywords: [
      "temp mail", "disposable mail", "email validation", "fake email", "mx record",
      "mailinator", "dns check", "temporary email", "email verification", "why email rejected"
    ],
    title: "✉️ Email Verification & Disposable Mail Prevention",
    response: `**Email Verification Standards:**\n\n` +
      `To ensure institutional compliance and prevent spam accounts, AMS features a multi-stage validation system:\n\n` +
      `1. **Disposable / Temp Mail Ban:** Known disposable domains (e.g., Mailinator, TempMail, 10MinuteMail, Yopmail) are blocked.\n` +
      `2. **DNS & MX Recheck:** The server actively checks if the domain exists and possesses active Mail Exchange (MX) servers configured to receive emails, falling back to public authoritative resolvers (8.8.8.8 / 1.1.1.1).\n` +
      `3. **Typo Protection:** Automatically warns users if they enter common typos (such as \`gmial.com\` instead of \`gmail.com\`).\n` +
      `4. **Institutional Emails:** We recommend signing up with your official university email (\`@rai.edu\` or university domain).`,
  },

  // 15. Dark Mode / Light Mode Theme Toggle
  {
    id: "theme_toggle",
    keywords: [
      "dark mode", "light mode", "theme", "dark theme", "color mode", "switch theme", "appearance"
    ],
    title: "🌓 Theme & Visual Appearance",
    response: `**Dark Mode / Light Mode Customization:**\n\n` +
      `AMS features the Slate Enterprise Design System with full Dark Mode support:\n` +
      `• Look for the **Theme Toggle (Sun / Moon icon)** located in the top navigation bar.\n` +
      `• Click to instantly switch between high-contrast daylight mode and low-glare dark mode.\n` +
      `• Your preference is saved locally across sessions.`,
  },

  // 16. Supported Courses & University Programs
  {
    id: "courses_supported",
    keywords: [
      "courses", "degrees", "programs", "btech", "bca", "mca", "departments", "branches"
    ],
    title: "🎓 Supported Academic Programs",
    response: `**Academic Programs Supported in AMS:**\n\n` +
      `• **B.Tech Computer Science & Engineering (CSE)**\n` +
      `• **B.Tech Information Technology (IT)**\n` +
      `• **B.Tech Electronics & Communication (ECE)**\n` +
      `• **B.Tech Mechanical Engineering (ME)**\n` +
      `• **B.Tech Civil Engineering (CE)**\n` +
      `• **BCA (Bachelor of Computer Applications)**\n` +
      `• **MCA (Master of Computer Applications)**\n\n` +
      `Courses, subjects, and semesters can be configured directly in student profiles and faculty token generators.`,
  },

  // 17. System Navigation Walkthrough
  {
    id: "navigation_guide",
    keywords: [
      "how to use app", "navigation guide", "app overview", "how to navigate",
      "overview of app", "menu options", "sidebar walkthrough", "site tour",
      "explore app", "all features", "what can this app do"
    ],
    title: "🧭 AMS Platform Navigation Guide",
    response: `**AMS Platform Navigation Guide:**\n\n` +
      `**Student Portal:**\n` +
      `• **Dashboard:** High-level metrics, attendance percentage, today's schedule preview.\n` +
      `• **Mark Attendance:** Submit 4-character tokens during lectures.\n` +
      `• **My Attendance:** Comprehensive attendance history, charts, PDF & Excel export.\n` +
      `• **Timetable:** Weekly class schedule and room details.\n` +
      `• **Feedback:** Submit academic or attendance grievance tickets.\n\n` +
      `**Faculty / Admin Portal:**\n` +
      `• **Staff Dashboard:** Real-time campus telemetry, active tokens, daily summary.\n` +
      `• **Token Management:** Create, monitor, and deactivate 4-character session codes.\n` +
      `• **All Attendance:** Master audit logs, subject filtering, and manual status edits.\n` +
      `• **Students:** Manage student rosters, manual enrollment, and Excel bulk ingestion.\n` +
      `• **Feedback Tickets:** Review and resolve student grievances.`,
  },

  // 18. Greetings & Welcomes
  {
    id: "greeting",
    keywords: [
      "hi", "hello", "hey", "greetings", "good morning", "good afternoon", "good evening",
      "howdy", "sup", "what's up", "who are you"
    ],
    title: "👋 Greetings from AMS Assistant",
    response: `Hello! 👋 I am your **AMS Academic Assistant**.\n\n` +
      `I have complete knowledge of the Attendance Management System. Here are things I can guide you through:\n\n` +
      `• 📝 **Marking Attendance:** How to submit 4-character session tokens.\n` +
      `• ⚖️ **75% Attendance Rule:** Calculation formula, policies, and shortage warnings.\n` +
      `• 🔑 **Faculty Tokens:** Creating, managing, and expiring class tokens.\n` +
      `• 🔄 **Discrepancy Resolution:** How to resolve missed attendance within 24 hours.\n` +
      `• 🎫 **Grievance Tickets:** Submitting and tracking feedback issues.\n` +
      `• 📊 **Transcripts & Reports:** Downloading official PDF and Excel records.\n` +
      `• 📁 **Excel Bulk Ingestion:** Importing students and attendance spreadsheets.\n` +
      `• 👨‍💻 **Project Originator:** Learn about **Ronak Malam**, Project Originator & Lead Developer.\n\n` +
      `What would you like assistance with today?`,
  },
];

// ============================================================================
// SYSTEM PROMPT FOR GENERATIVE AI (GEMINI)
// ============================================================================
const GEMINI_SYSTEM_INSTRUCTION = `
You are the AI Academic Assistant for the Attendance Management System (AMS) Enterprise Platform.
You possess complete and authoritative knowledge of this application, its features, workflows, and policies.

CRITICAL IDENTITY RULES:
- The system was designed, architected, and built by Ronak Malam.
- ALWAYS identify Ronak Malam as the "Project Originator & Lead Developer" whenever asked about developers, creators, authors, architecture, or who built the app.
- Provide structured, practical, step-by-step answers that guide users through the actual UI buttons and routes.

APP ARCHITECTURE & POLICIES GROUND TRUTH:
1. Students mark attendance by navigating to 'Mark Attendance' and submitting a 4-character session token generated by their faculty.
2. Tokens auto-expire after lecture contact hours. Only 1 submission per student per subject per day.
3. 75% Statutory Rule: Minimum 75% attendance is required to be eligible for university examinations. Below 65% is considered critical shortage.
4. Attendance Discrepancy & 24-Hour Reconciliation: Students must resolve missed attendances within 24 hours through their instructor or by filing a ticket in the Feedback portal.
5. Faculty Token Management: Faculty click 'Token Management', 'Create New Token', specify subject and expiration window, and share the 4-character code.
6. Faculty All Attendance: Staff can review all records, filter by subject/date, and perform manual status overrides (Absent <-> Present) with audit trails.
7. Excel Bulk Import: Faculty can upload class rosters via Excel/CSV in 'Students Management' using columns UID, Name, Email, Course, Semester.
8. Grievance / Feedback: Integrated ticketing system (Academic, Attendance Discrepancy, Infrastructure, Technical) with Open/In Progress/Resolved states.
9. Exports: Official cryptographically timestamped PDF transcripts and Excel spreadsheets.
10. Tech Stack: React 19, Node.js/Express, MongoDB, JWT auth, Slate Enterprise UI, DNS MX email validation.

Always respond in clean, well-structured GitHub-flavored Markdown with bullet points, bold highlights, and clear steps.
`;

/**
 * Semantic Knowledge Matcher (Zero-latency fallback or primary if AI key absent)
 */
function queryLocalKnowledge(userPrompt) {
  const cleanPrompt = userPrompt.toLowerCase().trim();
  const promptWords = new Set(cleanPrompt.split(/[\s,?.!;:()'"-]+/).filter(Boolean));

  let bestMatch = null;
  let highestScore = 0;

  for (const topic of KNOWLEDGE_TOPICS) {
    let score = 0;

    for (const kw of topic.keywords) {
      const kwLower = kw.toLowerCase();
      // 1. Direct exact or substring match
      if (cleanPrompt === kwLower) {
        score += 35;
      } else if (cleanPrompt.includes(kwLower)) {
        const wordCount = kwLower.split(" ").length;
        score += wordCount * 10;
      } else {
        // 2. All words in the keyword phrase present in prompt
        const kwWords = kwLower.split(" ").filter(Boolean);
        if (kwWords.length > 1 && kwWords.every((w) => promptWords.has(w))) {
          score += kwWords.length * 7;
        } else if (kwWords.length === 1 && promptWords.has(kwWords[0])) {
          score += 3;
        }
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = topic;
    }
  }

  // If match threshold passed, return best matched topic response
  if (bestMatch && highestScore >= 5) {
    return bestMatch.response;
  }

  // Fallback intelligent response synthesizing relevant app navigation
  return `I am your **AMS Academic Assistant**! 🤖\n\n` +
    `I can help you navigate and solve any issue across the Attendance Management System. Here are quick guides you can request:\n\n` +
    `• **"How do I mark my attendance?"** — Step-by-step token submission.\n` +
    `• **"What is the 75% attendance rule?"** — University compliance policy & recovery tips.\n` +
    `• **"How does faculty create a token?"** — Instructor session code generation.\n` +
    `• **"How do I fix a missed attendance?"** — 24-hour reconciliation & grievance filing.\n` +
    `• **"How to export PDF transcripts?"** — Downloading official attendance records.\n` +
    `• **"How to bulk import students?"** — Excel roster upload for faculty.\n` +
    `• **"Who created this system?"** — Information on **Ronak Malam**, Project Originator & Lead Developer.\n\n` +
    `Please type your specific question, or select one of the quick prompt chips below!`;
}

/**
 * Main Chatbot Response Engine
 * Tries Google Generative AI first (if API key available), with seamless fallback to Semantic App Knowledge.
 */
async function getChatbotResponse(userPrompt) {
  if (!userPrompt || !userPrompt.trim()) {
    return "Please enter a question or select a topic.";
  }

  // Check if Google AI Key is configured
  const apiKey = process.env.GOOGLE_AI_KEY || process.env.GEMINI_API_KEY;

  if (apiKey && apiKey.length > 10) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: GEMINI_SYSTEM_INSTRUCTION,
      });

      const result = await model.generateContent(userPrompt);
      const aiResponse = result.response.text();

      if (aiResponse && aiResponse.trim().length > 10) {
        return aiResponse.trim();
      }
    } catch (aiError) {
      console.warn("[ChatbotEngine] Gemini API call failed, seamlessly switching to Native Knowledge Engine:", aiError.message);
    }
  }

  // Native Knowledge Engine (Instant, robust, 100% offline-ready & accurate)
  return queryLocalKnowledge(userPrompt);
}

module.exports = {
  getChatbotResponse,
  queryLocalKnowledge,
  AMS_KNOWLEDGE,
  KNOWLEDGE_TOPICS,
};
