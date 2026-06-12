const express = require("express");
const bcrypt = require("bcrypt");
const cors = require("cors");
const axios = require("axios");
const jwt = require("jsonwebtoken");

const { OAuth2Client } = require("google-auth-library");

const cookieParser = require("cookie-parser");
const { HfInference } = require("@huggingface/inference");
const {
  generateTokens,
  setTokenCookies,
  clearTokenCookies,
} = require("./tokenUtils");
const { authenticateToken, authorizeRoles } = require("./authMiddleware");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const connectDb = require("./config/db");
const student = require("./models/student");
const staff = require("./models/staff");
const attendance = require("./models/attendance");
const AttendanceToken = require("./models/attendanceToken");

const app = express();
connectDb();

// Load environment variables
require("dotenv").config();
const SECRET_KEY = process.env.SECRET_KEY || "This is my security key";
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
const hf = HUGGINGFACE_API_KEY ? new HfInference(HUGGINGFACE_API_KEY) : null;

app.use(express.json());
app.use(cookieParser());

// Allow connections from any local network IP for mobile development
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:5174",
]
  .filter(Boolean)
  .flatMap((url) => [url, url.replace(/\/$/, ""), url + "/"]);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) {
        return callback(null, true);
      }

      // Allow any local network origin for development
      if (
        origin.match(
          /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.\d+\.\d+\.\d+)(:\d+)?$/,
        )
      ) {
        return callback(null, true);
      }

      // Check against allowed origins list
      if (
        allowedOrigins.some(
          (allowed) =>
            allowed.replace(/\/$/, "") === origin?.replace(/\/$/, ""),
        )
      ) {
        return callback(null, true);
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

app.get("/", (req, res) => {
  res.json({ message: "Hello, World!" });
});

app.post("/student", async (req, res) => {
  const { firstname, lastname, uid, email, password, course, semester } =
    req.body;
  const name = `${firstname} ${lastname}`;

  try {
    const studentExist = await student.findOne({ $or: [{ email }, { uid }] });
    if (studentExist) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new student({
      name,
      email,
      uid,
      password: hashedPassword,
      course,
      semester,
    });
    await newUser.save();

    return res.status(200).json({ message: "Student registered successfully" });
  } catch (error) {
    console.error("Student signup error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/staff", async (req, res) => {
  const { firstname, lastname, uid, email, password } = req.body;
  const name = `${firstname} ${lastname}`;

  try {
    const staffExist = await staff.findOne({ $or: [{ email }, { uid }] });
    if (staffExist) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new staff({
      name,
      email,
      uid,
      password: hashedPassword,
    });
    await newUser.save();

    return res.status(200).json({ message: "Staff registered successfully" });
  } catch (error) {
    console.error("Staff signup error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/signup", async (req, res) => {
  const { role, firstName, lastName, uid, email, password, course, semester } =
    req.body;
  const name = `${firstName} ${lastName}`;

  try {
    if (role === "student") {
      const studentExist = await student.findOne({ $or: [{ email }, { uid }] });
      if (studentExist) {
        return res.status(400).json({ message: "User already exists" });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = new student({
        name,
        email,
        uid,
        password: hashedPassword,
        course,
        semester,
        profileCompleted: true,
      });
      await newUser.save();

      return res
        .status(200)
        .json({ message: "Student registered successfully" });
    } else {
      const staffExist = await staff.findOne({ $or: [{ email }, { uid }] });
      if (staffExist) {
        return res.status(400).json({ message: "User already exists" });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = new staff({ name, email, uid, password: hashedPassword });
      await newUser.save();

      return res.status(200).json({ message: "Staff registered successfully" });
    }
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/login", async (req, res) => {
  const { role, username, password } = req.body;

  try {
    if (role === "student") {
      const studentExist = await student.findOne({
        $or: [{ uid: username }, { email: username }],
      });
      if (studentExist) {
        const studentMatch = await bcrypt.compare(
          password,
          studentExist.password,
        );
        if (studentMatch) {
          const { accessToken, refreshToken } = generateTokens({
            username,
            role,
          });
          setTokenCookies(res, accessToken, refreshToken);

          return res.status(200).json({
            message: "Login Successful",
            role,
            user: { ...studentExist.toObject(), role },
          });
        }
      }
    } else if (role === "staff") {
      const staffExist = await staff.findOne({
        $or: [{ uid: username }, { email: username }],
      });
      if (staffExist) {
        const staffMatch = await bcrypt.compare(password, staffExist.password);
        if (staffMatch) {
          const { accessToken, refreshToken } = generateTokens({
            username,
            role,
          });
          setTokenCookies(res, accessToken, refreshToken);

          return res.status(200).json({
            message: "Login Successful",
            role,
            user: { ...staffExist.toObject(), role },
          });
        }
      }
    }

    return res.status(401).json({ message: "Invalid credentials" });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/auth/google", async (req, res) => {
  try {
    const { accessToken, role } = req.body;

    // Validate role
    if (!role || (role !== "student" && role !== "staff")) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid role (student or staff)",
      });
    }

    // Get user info from Google
    const googleResponse = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    const { email, name, sub, picture } = googleResponse.data;

    const hashedPassword = await bcrypt.hash("GOOGLE_ACCOUNT", 10);

    if (role === "student") {
      let studentData = await student.findOne({ email });

      // Create account if first login (without UID - will be added during profile completion)
      if (!studentData) {
        studentData = await student.create({
          name,
          email,
          uid: `TEMP_${email.split("@")[0]}_${Date.now()}`, // Temporary UID until user completes profile
          password: hashedPassword,
          course: "Pending",
          semester: "Pending",
          profileCompleted: false,
        });
      }

      // Use your existing JWT system
      const { accessToken: jwtAccessToken, refreshToken } = generateTokens({
        username: email,
        role: "student",
      });

      setTokenCookies(res, jwtAccessToken, refreshToken);

      res.json({
        success: true,
        role: "student",
        user: {
          id: studentData._id,
          name: studentData.name,
          email: studentData.email,
          uid: studentData.uid,
          course: studentData.course,
          semester: studentData.semester,
          profileCompleted: studentData.profileCompleted,
        },
      });
    } else if (role === "staff") {
      let staffData = await staff.findOne({ email });

      // Create account if first login
      if (!staffData) {
        // For staff, use email-based UID temporarily (they can update it later in profile)
        const tempUID = `STAFF_${email.split("@")[0]}_${Date.now()}`;
        staffData = await staff.create({
          name,
          email,
          uid: tempUID,
          password: hashedPassword,
        });
      }

      // Use your existing JWT system
      const { accessToken: jwtAccessToken, refreshToken } = generateTokens({
        username: email,
        role: "staff",
      });

      setTokenCookies(res, jwtAccessToken, refreshToken);

      res.json({
        success: true,
        role: "staff",
        user: {
          id: staffData._id,
          name: staffData.name,
          email: staffData.email,
          uid: staffData.uid,
        },
      });
    }
  } catch (error) {
    console.error("Google auth error:", error);

    res.status(401).json({
      success: false,
      message: "Google authentication failed",
    });
  }
});

app.get("/profile", authenticateToken, async (req, res) => {
  try {
    const { username, role } = req.user;

    let user;
    if (role === "student") {
      user = await student.findOne({
        $or: [{ uid: username }, { email: username }],
      });
    } else {
      user = await staff.findOne({
        $or: [{ uid: username }, { email: username }],
      });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user);
  } catch (error) {
    console.error("Profile error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

app.put("/profile", authenticateToken, async (req, res) => {
  try {
    const { username, role } = req.user;
    const updates = req.body;

    // If UID is being updated, check if it's already taken
    if (updates.uid) {
      const existingStudent = await student.findOne({ uid: updates.uid });
      const existingStaff = await staff.findOne({ uid: updates.uid });

      // Get current user to check if this is their own UID
      let currentUser;
      if (role === "student") {
        currentUser = await student.findOne({
          $or: [{ uid: username }, { email: username }],
        });
      } else {
        currentUser = await staff.findOne({
          $or: [{ uid: username }, { email: username }],
        });
      }

      // If UID exists and belongs to someone else, reject the update
      if (
        (existingStudent && existingStudent.email !== currentUser.email) ||
        (existingStaff && existingStaff.email !== currentUser.email)
      ) {
        return res.status(400).json({
          message:
            "This University ID is already taken. Please use a different UID.",
        });
      }
    }

    // If completing profile for the first time, mark it as completed
    if (
      updates.uid &&
      updates.course &&
      updates.semester &&
      updates.course !== "Pending" &&
      updates.semester !== "Pending"
    ) {
      updates.profileCompleted = true;
    }

    let user;
    if (role === "student") {
      user = await student.findOneAndUpdate(
        { $or: [{ uid: username }, { email: username }] },
        updates,
        { new: true, runValidators: true },
      );
    } else {
      user = await staff.findOneAndUpdate(
        { $or: [{ uid: username }, { email: username }] },
        updates,
        { new: true, runValidators: true },
      );
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ message: "Profile updated", user });
  } catch (error) {
    console.error("Profile update error:", error);

    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        message:
          "This University ID is already taken. Please use a different UID.",
      });
    }

    return res.status(500).json({ message: "Something went wrong" });
  }
});

app.post("/chatbot", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: "Prompt is required" });
  }

  // Smart AI-powered chatbot with context understanding
  const lowerPrompt = prompt.toLowerCase();
  let response = "";

  // Greetings
  if (
    lowerPrompt.match(
      /^(hi|hello|hey|greetings|good morning|good afternoon|good evening)/,
    )
  ) {
    response =
      "Hello! 👋 I'm your Attendance Management System assistant. I can help you with:\n\n✅ Submitting attendance\n✅ Viewing attendance records\n✅ Token management\n✅ Profile settings\n✅ Reports & statistics\n✅ Troubleshooting\n\nWhat would you like to know?";
  }
  // Attendance submission
  else if (
    lowerPrompt.includes("submit") ||
    lowerPrompt.includes("mark attendance") ||
    lowerPrompt.includes("how to attend") ||
    lowerPrompt.includes("give attendance")
  ) {
    response =
      "📝 **How to Submit Attendance:**\n\n1. Navigate to **'Mark Attendance'** page from the sidebar\n2. Enter the **4-character token** provided by your teacher\n3. Click **'Submit'** button\n\n⚠️ **Important Notes:**\n• Tokens are only valid during class hours\n• Each token can be used once per day per subject\n• You'll get instant confirmation after submission\n• Check 'My Attendance' to verify your submission";
  }
  // Token related
  else if (lowerPrompt.includes("token") && !lowerPrompt.includes("submit")) {
    if (
      lowerPrompt.includes("create") ||
      lowerPrompt.includes("generate") ||
      lowerPrompt.includes("make")
    ) {
      response =
        "🎯 **Creating Attendance Tokens (Staff Only):**\n\n1. Go to **'Token Management'** section\n2. Click **'Create New Token'**\n3. Fill in details:\n   • Subject name\n   • Faculty name\n   • Valid from date & time\n   • Valid until date & time\n   • Max usage limit (optional)\n4. Generate a unique 4-character token\n5. Share the token with students during class\n\n💡 **Tips:**\n• Tokens auto-expire after the set time\n• You can deactivate tokens anytime\n• Track token usage in real-time";
    } else if (
      lowerPrompt.includes("invalid") ||
      lowerPrompt.includes("expired") ||
      lowerPrompt.includes("not working")
    ) {
      response =
        "❌ **Token Issues & Solutions:**\n\n**Token Invalid/Expired:**\n• Verify the token is exactly 4 characters\n• Check if you're within the valid time period\n• Ensure the token is for the correct subject\n• Contact your teacher for a new token\n\n**Token Already Used:**\n• You can only use each token once per day\n• Check 'My Attendance' to verify if already marked\n\n**Still Having Issues?**\n• Clear your browser cache\n• Try logging out and back in\n• Contact your administrator";
    } else {
      response =
        "🔑 **About Attendance Tokens:**\n\nTokens are unique 4-character codes used to mark attendance. Teachers generate tokens during class hours, and students submit them to record their presence.\n\n**Key Features:**\n• Time-limited validity\n• One-time use per student per day\n• Subject-specific\n• Secure and trackable\n\nNeed help with submitting or creating tokens? Just ask!";
    }
  }
  // View attendance
  else if (
    lowerPrompt.includes("view") ||
    lowerPrompt.includes("check") ||
    lowerPrompt.includes("see my") ||
    lowerPrompt.includes("my attendance")
  ) {
    response =
      "📊 **Viewing Your Attendance Records:**\n\n1. Click **'My Attendance'** in the sidebar\n2. You'll see:\n   • Complete attendance history\n   • Subject-wise breakdown\n   • Attendance percentage\n   • Visual charts and graphs\n\n**Filter Options:**\n• By date range\n• By subject\n• By status (Present/Absent)\n\n**Export Options:**\n• Download as PDF\n• Export to Excel\n• Print attendance report\n\n💡 Your attendance percentage is calculated automatically!";
  }
  // Reports
  else if (
    lowerPrompt.includes("report") ||
    lowerPrompt.includes("export") ||
    lowerPrompt.includes("download") ||
    lowerPrompt.includes("pdf") ||
    lowerPrompt.includes("excel")
  ) {
    response =
      "📄 **Generating Attendance Reports:**\n\n**For Students:**\n1. Go to 'My Attendance'\n2. Click **'Export'** button\n3. Choose format: PDF or Excel\n4. Download your report\n\n**For Staff:**\n1. Navigate to 'Attendance Records'\n2. Apply filters (date, subject, student)\n3. Click **'Generate Report'**\n4. Select format and download\n\n**Report Includes:**\n• Detailed attendance data\n• Date and time stamps\n• Subject information\n• Attendance statistics\n• Visual charts";
  }
  // Dashboard
  else if (
    lowerPrompt.includes("dashboard") ||
    lowerPrompt.includes("statistics") ||
    lowerPrompt.includes("stats") ||
    lowerPrompt.includes("overview")
  ) {
    response =
      "📈 **Dashboard Overview:**\n\n**Student Dashboard:**\n• Overall attendance percentage\n• Subject-wise attendance breakdown\n• Recent attendance records\n• Attendance trends (charts)\n• Quick access to mark attendance\n\n**Staff Dashboard:**\n• Total students count\n• Today's attendance summary\n• Overall attendance statistics\n• Active tokens list\n• Recent activity\n\n💡 Dashboard updates in real-time!";
  }
  // Profile
  else if (
    lowerPrompt.includes("profile") ||
    (lowerPrompt.includes("update") && lowerPrompt.includes("information")) ||
    lowerPrompt.includes("edit profile")
  ) {
    response =
      "👤 **Managing Your Profile:**\n\n1. Click your **profile icon** (top right)\n2. Select **'Profile Settings'**\n3. Update information:\n   • Name\n   • Email\n   • Phone number\n   • Course (students)\n   • Semester (students)\n4. Click **'Save Changes'**\n\n⚠️ **Note:**\n• UID cannot be changed after registration\n• Email changes may require verification\n• Keep your profile updated for accurate records";
  }
  // Troubleshooting
  else if (
    lowerPrompt.includes("error") ||
    lowerPrompt.includes("problem") ||
    lowerPrompt.includes("issue") ||
    lowerPrompt.includes("not working") ||
    lowerPrompt.includes("help")
  ) {
    response =
      "🔧 **Common Issues & Solutions:**\n\n**Login Problems:**\n• Verify your credentials (UID/Email & Password)\n• Check if you selected the correct role\n• Clear browser cache and cookies\n• Try incognito/private mode\n\n**Token Issues:**\n• Ensure token is exactly 4 characters\n• Check if within valid time period\n• Verify you haven't already submitted today\n\n**Attendance Not Showing:**\n• Refresh the page\n• Check your internet connection\n• Verify you're logged in\n• Wait a few seconds for sync\n\n**Still Need Help?**\n• Contact your administrator\n• Check system status\n• Report the issue with details";
  }
  // How to use system
  else if (
    lowerPrompt.includes("how to use") ||
    lowerPrompt.includes("how does") ||
    lowerPrompt.includes("how it works")
  ) {
    response =
      "📚 **How the Attendance System Works:**\n\n**For Students:**\n1. Login with your credentials\n2. Teacher shares a token during class\n3. Go to 'Mark Attendance'\n4. Enter the token and submit\n5. View your records in 'My Attendance'\n\n**For Staff:**\n1. Login with staff credentials\n2. Create tokens in 'Token Management'\n3. Share tokens with students during class\n4. Monitor attendance in real-time\n5. Generate reports as needed\n\n**Key Features:**\n• Real-time tracking\n• Secure token-based system\n• Automated calculations\n• Easy report generation";
  }
  // Percentage/calculation
  else if (
    lowerPrompt.includes("percentage") ||
    lowerPrompt.includes("calculate") ||
    (lowerPrompt.includes("how is") && lowerPrompt.includes("calculated"))
  ) {
    response =
      "🧮 **Attendance Percentage Calculation:**\n\n**Formula:**\nAttendance % = (Classes Attended / Total Classes) × 100\n\n**Example:**\n• Total classes: 20\n• Classes attended: 18\n• Percentage: (18/20) × 100 = 90%\n\n**Features:**\n• Auto-calculated in real-time\n• Subject-wise breakdown available\n• Overall percentage displayed on dashboard\n• Visual charts for easy understanding\n\n💡 Aim for at least 75% attendance!";
  }
  // Staff specific
  else if (
    lowerPrompt.includes("staff") ||
    lowerPrompt.includes("teacher") ||
    lowerPrompt.includes("faculty")
  ) {
    response =
      "👨‍🏫 **Staff Features:**\n\n**Token Management:**\n• Create and manage attendance tokens\n• Set validity periods\n• Track token usage\n\n**Student Management:**\n• View all registered students\n• Access student profiles\n• Monitor individual attendance\n\n**Reports & Analytics:**\n• Generate comprehensive reports\n• Export data (PDF/Excel)\n• View attendance trends\n• Access dashboard statistics\n\n**Administration:**\n• Manage attendance records\n• Update student information\n• System configuration";
  }
  // Default intelligent response
  else {
    response =
      'I\'m your Attendance Management System assistant! 🤖\n\nI can help you with:\n\n📝 **Attendance:** Submit, view, and track attendance\n🔑 **Tokens:** Create and manage attendance tokens\n👤 **Profile:** Update your information\n📊 **Reports:** Generate and download reports\n📈 **Statistics:** View attendance analytics\n🔧 **Support:** Troubleshoot issues\n\nPlease ask me something specific about the attendance system. For example:\n• "How do I submit attendance?"\n• "How to view my attendance records?"\n• "How to create a token?"\n• "What if my token is invalid?"';
  }

  return res.status(200).json({ response });
});

app.post("/data", async (req, res) => {
  const { duration } = req.body;

  try {
    const data = await attendance.find({ duration });
    return res.json(data);
  } catch (error) {
    console.error("Data fetch error:", error);
    return res.status(500).json({ message: "Data fetch failed" });
  }
});

app.get(
  "/students",
  authenticateToken,
  authorizeRoles("staff"),
  async (req, res) => {
    try {
      const data = await student.find();
      return res.json(data);
    } catch (error) {
      console.error("Student fetch error:", error);
      return res.status(500).json({ message: "Failed to get students" });
    }
  },
);

// Token refresh endpoint
app.post("/auth/refresh", (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token required" });
  }

  try {
    const { verifyRefreshToken } = require("./tokenUtils");
    const decoded = verifyRefreshToken(refreshToken);
    const { accessToken, refreshToken: newRefreshToken } = generateTokens({
      username: decoded.username,
      role: decoded.role,
    });

    setTokenCookies(res, accessToken, newRefreshToken);
    return res.status(200).json({ message: "Token refreshed successfully" });
  } catch (error) {
    return res.status(401).json({ message: "Invalid refresh token" });
  }
});

// Logout endpoint
app.post("/auth/logout", (req, res) => {
  clearTokenCookies(res);
  return res.status(200).json({ message: "Logged out successfully" });
});

// Check authentication status
app.get("/auth/status", (req, res) => {
  try {
    const accessToken = req.cookies?.accessToken;

    if (!accessToken) {
      return res.status(401).json({ authenticated: false });
    }

    const { verifyAccessToken } = require("./tokenUtils");
    const decoded = verifyAccessToken(accessToken);
    return res.status(200).json({
      authenticated: true,
      user: decoded,
    });
  } catch (error) {
    return res.status(401).json({ authenticated: false });
  }
});

// Submit attendance token
app.post("/attendance/submit", authenticateToken, async (req, res) => {
  const { token: attendanceToken, subject } = req.body;
  const { username, role } = req.user;

  // Check if user is a student
  if (role !== "student") {
    return res
      .status(403)
      .json({ message: "Only students can submit attendance" });
  }

  try {
    // Sanitize and validate input
    const sanitizedToken = attendanceToken?.toString().trim().toUpperCase();
    if (!sanitizedToken || !/^[A-Z0-9]{4}$/.test(sanitizedToken)) {
      return res.status(400).json({
        message: "Please enter a valid 4-character alphanumeric token",
      });
    }

    const studentData = await student.findOne({
      $or: [{ uid: username }, { email: username }],
    });

    if (!studentData) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Find valid token
    const now = new Date();
    const tokenData = await AttendanceToken.findOne({
      token: sanitizedToken,
      isActive: true,
      validFrom: { $lte: now },
      validUntil: { $gte: now },
    });

    if (!tokenData) {
      return res.status(400).json({
        message: "Invalid or expired token",
      });
    }

    if (tokenData.currentUsage >= tokenData.maxUsage) {
      return res.status(400).json({
        message: "Token usage limit reached",
      });
    }

    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    // Check if attendance already exists for today and subject
    const existingAttendance = await attendance.findOne({
      studentId: studentData._id,
      subject: tokenData.subject,
      date: { $gte: startOfDay, $lt: endOfDay },
    });

    if (existingAttendance) {
      return res.status(400).json({
        message: `Attendance already marked for ${tokenData.subject} today`,
      });
    }

    // Create new attendance record
    const newAttendance = new attendance({
      studentId: studentData._id,
      studentUid: studentData.uid,
      studentName: studentData.name,
      subject: tokenData.subject,
      faculty: tokenData.faculty,
      date: today,
      time: today.toLocaleTimeString("en-US", { hour12: false }),
      status: "Present",
      token: sanitizedToken,
      duration: "1 hour",
    });

    await newAttendance.save();

    // Update token usage
    await AttendanceToken.findByIdAndUpdate(tokenData._id, {
      $inc: { currentUsage: 1 },
    });

    return res.status(200).json({
      message: `Attendance marked successfully for ${tokenData.subject}`,
    });
  } catch (error) {
    console.error("Attendance submission error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get student's attendance records
app.get(
  "/attendance/student",
  authenticateToken,
  authorizeRoles("student"),
  async (req, res) => {
    const { username, role } = req.user;

    try {
      const studentData = await student.findOne({
        $or: [{ uid: username }, { email: username }],
      });

      if (!studentData) {
        return res.status(404).json({ message: "Student not found" });
      }

      const attendanceRecords = await attendance
        .find({ studentId: studentData._id })
        .sort({ date: -1 });

      return res.json(attendanceRecords);
    } catch (error) {
      console.error("Get student attendance error:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  },
);

// Get all attendance records (admin only)
app.get(
  "/attendance/all",
  authenticateToken,
  authorizeRoles("staff"),
  async (req, res) => {
    const { role } = req.user;

    try {
      const attendanceRecords = await attendance
        .find()
        .populate("studentId", "name uid email course semester")
        .sort({ date: -1 });

      return res.json(attendanceRecords);
    } catch (error) {
      console.error("Get all attendance error:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  },
);

// Get attendance summary (admin dashboard)
app.get(
  "/api/attendance/summary",
  authenticateToken,
  authorizeRoles("staff"),
  async (req, res) => {
    const { role } = req.user;

    try {
      const totalStudents = await student.countDocuments();
      const totalRecords = await attendance.countDocuments();

      const today = new Date();
      const startOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      );
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

      const presentToday = await attendance.countDocuments({
        date: { $gte: startOfDay, $lt: endOfDay },
        status: "Present",
      });

      return res.json({ totalStudents, totalRecords, presentToday });
    } catch (error) {
      console.error("Get attendance summary error:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  },
);

// Token Management Routes

// Get all tokens (staff only)
app.get(
  "/tokens",
  authenticateToken,
  authorizeRoles("staff"),
  async (req, res) => {
    try {
      const tokens = await AttendanceToken.find().sort({ createdAt: -1 });
      return res.json(tokens);
    } catch (error) {
      console.error("Get tokens error:", error);
      return res.status(500).json({ message: "Failed to fetch tokens" });
    }
  },
);

// Get active tokens (students can see current sessions)
app.get("/tokens/active", authenticateToken, async (req, res) => {
  try {
    const activeTokens = await AttendanceToken.find({
      isActive: true,
      validFrom: { $lte: new Date() },
      validUntil: { $gte: new Date() },
      $expr: { $lt: ["$currentUsage", "$maxUsage"] },
    })
      .select("subject faculty validUntil currentUsage maxUsage")
      .sort({ validUntil: 1 });

    return res.json(activeTokens);
  } catch (error) {
    console.error("Get active tokens error:", error);
    return res.status(500).json({ message: "Failed to fetch active tokens" });
  }
});

// Create new token (staff only)
app.post(
  "/tokens",
  authenticateToken,
  authorizeRoles("staff"),
  async (req, res) => {
    const { subject, token, faculty, validFrom, validUntil, maxUsage } =
      req.body;
    const { username } = req.user;

    try {
      const newToken = new AttendanceToken({
        subject,
        token,
        faculty,
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        maxUsage: maxUsage || 100,
        createdBy: username,
      });

      await newToken.save();
      return res
        .status(201)
        .json({ message: "Token created successfully", token: newToken });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({ message: "Token already exists" });
      }
      console.error("Create token error:", error);
      return res.status(500).json({ message: "Failed to create token" });
    }
  },
);

// Update token (staff only)
app.put(
  "/tokens/:id",
  authenticateToken,
  authorizeRoles("staff"),
  async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    try {
      const updatedToken = await AttendanceToken.findByIdAndUpdate(
        id,
        updates,
        { new: true },
      );
      if (!updatedToken) {
        return res.status(404).json({ message: "Token not found" });
      }
      return res.json({
        message: "Token updated successfully",
        token: updatedToken,
      });
    } catch (error) {
      console.error("Update token error:", error);
      return res.status(500).json({ message: "Failed to update token" });
    }
  },
);

// Delete token (staff only)
app.delete(
  "/tokens/:id",
  authenticateToken,
  authorizeRoles("staff"),
  async (req, res) => {
    const { id } = req.params;

    try {
      const deletedToken = await AttendanceToken.findByIdAndDelete(id);
      if (!deletedToken) {
        return res.status(404).json({ message: "Token not found" });
      }
      return res.json({ message: "Token deleted successfully" });
    } catch (error) {
      console.error("Delete token error:", error);
      return res.status(500).json({ message: "Failed to delete token" });
    }
  },
);

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global error:", err);
  res.status(500).json({
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 5000;
// Allow network access in development for mobile testing
const HOST = process.env.HOST || "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);

  // Display local network IPs for mobile access
  if (HOST === "0.0.0.0") {
    const os = require("os");
    const networkInterfaces = os.networkInterfaces();
    console.log(`\n📱 Access from mobile/other devices:`);

    Object.keys(networkInterfaces).forEach((interfaceName) => {
      networkInterfaces[interfaceName].forEach((iface) => {
        if (iface.family === "IPv4" && !iface.internal) {
          console.log(`   ➜ Network: http://${iface.address}:${PORT}`);
        }
      });
    });
    console.log(
      `\n⚠️  Make sure your mobile device is on the same WiFi network\n`,
    );
  }
});
