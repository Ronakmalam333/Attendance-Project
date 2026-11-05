require("dotenv").config();

const dns = require("dns");
try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch (e) {
  // Ignore if restricted
}

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
const Feedback = require("./models/feedback");
const Timetable = require("./models/timetable");
const { getChatbotResponse } = require("./utils/chatbotEngine");
const { validateEmail } = require("./utils/emailValidator");

const app = express();
connectDb();

const SECRET_KEY = process.env.SECRET_KEY || "This is my security key";
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
const hf = HUGGINGFACE_API_KEY ? new HfInference(HUGGINGFACE_API_KEY) : null;

// Increase payload limit to handle base64 images (10MB limit)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());

// Allow connections from frontend and local network IPs for development
const allowedOrigins = [
  process.env.CLIENT_URL,
  "https://attendance-management-system-mayamatrix.vercel.app",
  "http://localhost:5173",
  "http://localhost:5174",
]
  .filter(Boolean)
  .flatMap((url) => [url, url.replace(/\/$/, ""), url + "/"]);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl, etc.)
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

    // Allow Vercel deployments (both production and preview)
    if (
      origin.match(/^https:\/\/.*\.vercel\.app$/) ||
      origin.match(/^https:\/\/.*\.vercel\.com$/)
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

    // Log rejected origins for debugging
    console.log(`CORS: Rejected origin: ${origin}`);
    callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Cookie",
    "X-Requested-With",
    "Accept",
  ],
  exposedHeaders: ["Set-Cookie"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.get("/", (req, res) => {
  res.json({ message: "Hello, World!" });
});

// Pre-registration real-time email verification endpoint
app.post(["/api/validate-email", "/validate-email"], async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ valid: false, message: "Email is required" });
    }
    const result = await validateEmail(email);
    return res.json(result);
  } catch (error) {
    console.error("Email pre-validation error:", error);
    return res.status(500).json({ valid: false, message: "Email verification service unavailable" });
  }
});

app.post("/student", async (req, res) => {
  const { firstname, lastname, uid, email, password, course, semester } =
    req.body;
  const name = `${firstname} ${lastname}`;

  try {
    // Multi-tier Email Validation (syntax, disposable blocklist, DNS MX with fallback & recheck)
    const emailValidation = await validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({ message: emailValidation.message });
    }

    const studentExist = await student.findOne({ $or: [{ email }, { uid }] });
    if (studentExist) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new student({
      name,
      email: email.trim().toLowerCase(),
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
    // Multi-tier Email Validation (syntax, disposable blocklist, DNS MX with fallback & recheck)
    const emailValidation = await validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({ message: emailValidation.message });
    }

    const staffExist = await staff.findOne({ $or: [{ email }, { uid }] });
    if (staffExist) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new staff({
      name,
      email: email.trim().toLowerCase(),
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
    // Multi-tier Email Validation (syntax, disposable blocklist, DNS MX with fallback & recheck)
    const emailValidation = await validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({ message: emailValidation.message });
    }

    if (role === "student") {
      const studentExist = await student.findOne({ $or: [{ email }, { uid }] });
      if (studentExist) {
        return res.status(400).json({ message: "User already exists" });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = new student({
        name,
        email: email.trim().toLowerCase(),
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

      const newUser = new staff({ name, email: email.trim().toLowerCase(), uid, password: hashedPassword });
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

      // Create account if first login (without UID and name - will be added during profile completion)
      if (!staffData) {
        staffData = await staff.create({
          name: "Pending", // Temporary name until profile completion
          email,
          uid: `TEMP_${sub}`, // Temporary UID until user provides their actual UID
          password: hashedPassword,
          profileCompleted: false, // Mark profile as incomplete
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
          profileCompleted: staffData.profileCompleted !== false, // Default to true for existing users
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

    // For students: Mark profile as completed if all required fields are present
    if (role === "student") {
      if (
        updates.uid &&
        updates.course &&
        updates.semester &&
        updates.course !== "Pending" &&
        updates.semester !== "Pending"
      ) {
        updates.profileCompleted = true;
      }
    }

    // For staff: Mark profile as completed if name and uid are present
    if (role === "staff") {
      if (updates.name && updates.uid && updates.name !== "Pending") {
        updates.profileCompleted = true;
      }
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

  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({ message: "Prompt is required" });
  }

  try {
    const response = await getChatbotResponse(prompt.trim());
    return res.status(200).json({ response });
  } catch (error) {
    console.error("Chatbot processing error:", error);
    return res.status(500).json({
      message: "The assistant encountered an error. Please try again.",
      response: "I encountered a momentary issue processing your question. Please feel free to ask again or choose one of the quick guide topics.",
    });
  }
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
  ["/students", "/api/students"],
  authenticateToken,
  authorizeRoles("staff"),
  async (req, res) => {
    try {
      const data = await student.find().sort({ createdAt: -1 });
      return res.json(data);
    } catch (error) {
      console.error("Student fetch error:", error);
      return res.status(500).json({ message: "Failed to get students" });
    }
  },
);

// Add Single Student (staff only)
app.post(
  ["/students", "/api/students"],
  authenticateToken,
  authorizeRoles("staff"),
  async (req, res) => {
    try {
      const { name, uid, email, course, semester, password } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ message: "Student full name is required" });
      }
      if (!uid || !uid.trim()) {
        return res.status(400).json({ message: "Institutional UID / Roll No is required" });
      }
      if (!email || !email.trim()) {
        return res.status(400).json({ message: "Institutional email address is required" });
      }

      const cleanUid = uid.trim().toUpperCase();
      const cleanEmail = email.trim().toLowerCase();

      // Multi-tier Email Validation (syntax, disposable blocklist, DNS MX with fallback & recheck)
      const emailValidation = await validateEmail(cleanEmail);
      if (!emailValidation.valid) {
        return res.status(400).json({ message: emailValidation.message });
      }

      const existing = await student.findOne({
        $or: [{ uid: cleanUid }, { email: cleanEmail }],
      });
      if (existing) {
        return res.status(409).json({
          message: `A student with UID "${cleanUid}" or Email "${cleanEmail}" is already registered.`,
        });
      }

      const plainPassword = password && password.trim() ? password.trim() : cleanUid;
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      const newStudent = new student({
        name: name.trim(),
        uid: cleanUid,
        email: cleanEmail,
        password: hashedPassword,
        course: course && course.trim() ? course.trim() : "B.Tech Computer Science",
        semester: Number(semester) || 1,
      });

      await newStudent.save();
      return res.status(201).json({
        message: `Student ${newStudent.name} (${cleanUid}) enrolled successfully.`,
        student: newStudent,
      });
    } catch (error) {
      console.error("Add student error:", error);
      return res.status(500).json({ message: "Failed to enroll student" });
    }
  },
);

// Delete Student Record (staff only)
app.delete(
  ["/students/:id", "/api/students/:id"],
  authenticateToken,
  authorizeRoles("staff"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const deletedStudent = await student.findByIdAndDelete(id);
      if (!deletedStudent) {
        return res.status(404).json({ message: "Student record not found" });
      }

      // Also clean up any orphan attendance records tied to this student
      await attendance.deleteMany({ studentId: id });

      return res.json({
        message: `Student ${deletedStudent.name} (${deletedStudent.uid}) removed from roster.`,
      });
    } catch (error) {
      console.error("Delete student error:", error);
      return res.status(500).json({ message: "Failed to delete student" });
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
  ["/attendance/all", "/api/attendance/all"],
  authenticateToken,
  authorizeRoles("staff"),
  async (req, res) => {
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

// Update single attendance record status/subject/faculty (admin only)
app.patch(
  ["/attendance/:id", "/api/attendance/:id"],
  authenticateToken,
  authorizeRoles("staff"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status, subject, faculty } = req.body;

      const updateData = {};
      if (status) {
        // Normalize status to capitalized 'Present', 'Absent', 'Late'
        const normalized = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
        updateData.status = normalized;
      }
      if (subject) updateData.subject = subject.trim();
      if (faculty) updateData.faculty = faculty.trim();

      const updatedRecord = await attendance.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      ).populate("studentId", "name uid email course semester");

      if (!updatedRecord) {
        return res.status(404).json({ message: "Attendance record not found" });
      }

      return res.json({
        message: "Attendance status updated successfully",
        record: updatedRecord,
      });
    } catch (error) {
      console.error("Update attendance error:", error);
      return res.status(500).json({ message: "Failed to update attendance record" });
    }
  },
);

// Delete single attendance record (admin only)
app.delete(
  ["/attendance/:id", "/api/attendance/:id"],
  authenticateToken,
  authorizeRoles("staff"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const deletedRecord = await attendance.findByIdAndDelete(id);

      if (!deletedRecord) {
        return res.status(404).json({ message: "Attendance record not found" });
      }

      return res.json({
        message: "Attendance record deleted successfully from ledger",
      });
    } catch (error) {
      console.error("Delete attendance error:", error);
      return res.status(500).json({ message: "Failed to delete attendance record" });
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

// Submit Feedback / Grievance (all authenticated users)
app.post(
  ["/feedback", "/api/feedback"],
  authenticateToken,
  async (req, res) => {
    try {
      const { category, rating, comment } = req.body;
      if (!comment || !comment.trim()) {
        return res.status(400).json({ message: "Comment or discrepancy details are required" });
      }

      const { username, role } = req.user;
      let userDoc = null;
      if (role === "student") {
        userDoc = await student.findOne({
          $or: [{ uid: username }, { email: username }],
        });
      } else {
        userDoc = await staff.findOne({
          $or: [{ uid: username }, { email: username }],
        });
      }

      const newFeedback = new Feedback({
        userId: userDoc?._id || undefined,
        userModel: role === "staff" ? "staff" : "student",
        userName: userDoc?.name || username,
        userUid: userDoc?.uid || username,
        category: category || "general",
        rating: Number(rating) || 5,
        comment: comment.trim(),
        status: "pending",
      });

      await newFeedback.save();
      return res.status(201).json({
        message: "Your feedback / grievance ticket has been registered successfully.",
        feedback: newFeedback,
      });
    } catch (err) {
      console.error("Submit feedback error:", err);
      return res.status(500).json({ message: "Failed to submit feedback" });
    }
  },
);

// Get My Feedback Tickets (all authenticated users - student & staff)
app.get(
  ["/feedback/my", "/api/feedback/my"],
  authenticateToken,
  async (req, res) => {
    try {
      const { username, role } = req.user;
      let userDoc = null;
      if (role === "student") {
        userDoc = await student.findOne({
          $or: [{ uid: username }, { email: username }],
        });
      } else {
        userDoc = await staff.findOne({
          $or: [{ uid: username }, { email: username }],
        });
      }

      const queryOr = [{ userName: username }];
      if (userDoc) {
        queryOr.push({ userId: userDoc._id });
        if (userDoc.uid) queryOr.push({ userUid: userDoc.uid });
        if (userDoc.name) queryOr.push({ userName: userDoc.name });
      }

      const list = await Feedback.find({ $or: queryOr }).sort({ createdAt: -1 });
      return res.json(list);
    } catch (err) {
      console.error("Get my feedback error:", err);
      return res.status(500).json({ message: "Failed to fetch user feedback tickets" });
    }
  },
);

// Withdraw / Cancel Own Pending Ticket
app.delete(
  ["/feedback/my/:id", "/api/feedback/my/:id"],
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { username, role } = req.user;

      let userDoc = null;
      if (role === "student") {
        userDoc = await student.findOne({
          $or: [{ uid: username }, { email: username }],
        });
      } else {
        userDoc = await staff.findOne({
          $or: [{ uid: username }, { email: username }],
        });
      }

      const ticket = await Feedback.findById(id);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      // Check ownership
      const isOwner =
        (userDoc && ticket.userId && ticket.userId.toString() === userDoc._id.toString()) ||
        (userDoc && ticket.userUid === userDoc.uid) ||
        ticket.userName === username ||
        (userDoc && ticket.userName === userDoc.name);

      if (!isOwner) {
        return res.status(403).json({ message: "Unauthorized to withdraw this ticket" });
      }

      await Feedback.findByIdAndDelete(id);
      return res.json({ message: "Ticket withdrawn successfully" });
    } catch (err) {
      console.error("Withdraw ticket error:", err);
      return res.status(500).json({ message: "Failed to withdraw ticket" });
    }
  },
);

// Get All Feedback / Grievances with filters & search (staff only)
app.get(
  ["/feedback", "/api/feedback"],
  authenticateToken,
  authorizeRoles("staff"),
  async (req, res) => {
    try {
      const { status, category, search } = req.query;
      const filter = {};

      if (status && status !== "all") {
        filter.status = status;
      }

      if (category && category !== "all") {
        filter.category = category;
      }

      if (search && search.trim()) {
        const term = search.trim();
        const regex = new RegExp(term, "i");
        filter.$or = [
          { userName: regex },
          { userUid: regex },
          { comment: regex },
          { category: regex },
        ];
      }

      const list = await Feedback.find(filter).sort({ createdAt: -1 });
      return res.json(list);
    } catch (err) {
      console.error("Get feedback error:", err);
      return res.status(500).json({ message: "Failed to fetch feedback" });
    }
  },
);

// Update Feedback Status & Official Remarks (staff only)
app.patch(
  ["/feedback/:id/status", "/api/feedback/:id/status"],
  authenticateToken,
  authorizeRoles("staff"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status, responseComment } = req.body;

      const updateData = {};
      if (status) updateData.status = status;
      if (responseComment !== undefined) updateData.responseComment = responseComment.trim();

      if (status === "resolved" || status === "reviewed") {
        updateData.resolvedBy = req.user.username;
        updateData.resolvedAt = new Date();
      }

      const updated = await Feedback.findByIdAndUpdate(id, updateData, { new: true });
      if (!updated) {
        return res.status(404).json({ message: "Feedback ticket not found" });
      }

      return res.json({
        message: `Ticket status marked as "${updated.status}" with official remarks.`,
        feedback: updated,
      });
    } catch (err) {
      console.error("Update feedback status error:", err);
      return res.status(500).json({ message: "Failed to update feedback status" });
    }
  },
);

// Delete Feedback Ticket (staff only)
app.delete(
  ["/feedback/:id", "/api/feedback/:id"],
  authenticateToken,
  authorizeRoles("staff"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await Feedback.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({ message: "Feedback ticket not found" });
      }
      return res.json({ message: "Feedback ticket deleted successfully" });
    } catch (err) {
      console.error("Delete feedback error:", err);
      return res.status(500).json({ message: "Failed to delete feedback ticket" });
    }
  },
);

// Get Distinct Subjects dynamically from database
app.get("/subjects", authenticateToken, async (req, res) => {
  try {
    const tokenSubjects = await AttendanceToken.distinct("subject");
    const attendanceSubjects = await attendance.distinct("subject");
    const distinctList = Array.from(new Set([...tokenSubjects, ...attendanceSubjects]))
      .filter(Boolean)
      .sort();
    return res.json(distinctList);
  } catch (err) {
    console.error("Get distinct subjects error:", err);
    return res.status(500).json({ message: "Failed to fetch subjects" });
  }
});

// ============================================================================
// UNIVERSITY BIG DATA INGESTION ENGINE (EXCEL / XLSX / CSV / ROSTERS)
// ============================================================================

// Bulk import students from Excel / CSV (Staff / Admin only)
app.post(
  ["/api/students/bulk-import", "/students/bulk-import"],
  authenticateToken,
  authorizeRoles("staff"),
  async (req, res) => {
    try {
      const { students } = req.body;
      if (!Array.isArray(students) || students.length === 0) {
        return res.status(400).json({ message: "No student records provided for import." });
      }

      const defaultHashedPassword = await bcrypt.hash("ams@123", 10);
      let insertedCount = 0;
      let updatedCount = 0;
      const errors = [];

      const bulkOps = [];
      for (let i = 0; i < students.length; i++) {
        const item = students[i];
        const rawName = (item.name || `${item.firstname || ""} ${item.lastname || ""}`).trim();
        const rawUid = (item.uid || item.rollNo || item.rollNumber || "").trim().toUpperCase();
        const rawEmail = (item.email || "").trim().toLowerCase();

        if (!rawUid && !rawEmail) {
          errors.push({ row: i + 1, error: "Missing both UID and Email" });
          continue;
        }

        const studentUid = rawUid || rawEmail.split("@")[0].toUpperCase();
        const studentEmail = rawEmail || `${studentUid.toLowerCase()}@university.edu`;
        const studentName = rawName || `Student ${studentUid}`;
        const course = (item.course || item.branch || item.department || "General").trim();
        const semester = item.semester ? String(item.semester).trim() : "1";

        bulkOps.push({
          updateOne: {
            filter: {
              $or: [{ uid: studentUid }, { email: studentEmail }],
            },
            update: {
              $set: {
                name: studentName,
                uid: studentUid,
                email: studentEmail,
                course,
                semester,
                profileCompleted: true,
              },
              $setOnInsert: {
                password: defaultHashedPassword,
                createdAt: new Date(),
              },
            },
            upsert: true,
          },
        });
      }

      if (bulkOps.length > 0) {
        const result = await student.bulkWrite(bulkOps, { ordered: false });
        insertedCount = result.upsertedCount || 0;
        updatedCount = result.modifiedCount || 0;
      }

      return res.json({
        message: `Successfully processed ${bulkOps.length} student records (${insertedCount} new, ${updatedCount} updated).`,
        total: students.length,
        insertedCount,
        updatedCount,
        errorCount: errors.length,
        errors: errors.slice(0, 10),
      });
    } catch (error) {
      console.error("Bulk student import error:", error);
      return res.status(500).json({ message: "Failed to process bulk student import." });
    }
  }
);

// Bulk import attendance records from Excel (Staff / Admin only)
app.post(
  ["/api/attendance/bulk-import", "/attendance/bulk-import"],
  authenticateToken,
  authorizeRoles("staff"),
  async (req, res) => {
    try {
      const { records } = req.body;
      if (!Array.isArray(records) || records.length === 0) {
        return res.status(400).json({ message: "No attendance records provided." });
      }

      // Pre-fetch all students in bulk to map studentId by UID or Email
      const allStudents = await student.find({}, "_id uid name email");
      const uidToStudent = new Map();
      const emailToStudent = new Map();
      allStudents.forEach((s) => {
        if (s.uid) uidToStudent.set(s.uid.toUpperCase(), s);
        if (s.email) emailToStudent.set(s.email.toLowerCase(), s);
      });

      const docsToInsert = [];
      const errors = [];

      for (let i = 0; i < records.length; i++) {
        const r = records[i];
        const rawUid = (r.studentUid || r.rollNo || r.RollNo || "").trim().toUpperCase();
        const rawEmail = (r.email || "").trim().toLowerCase();

        const matchedStudent = uidToStudent.get(rawUid) || emailToStudent.get(rawEmail);
        if (!matchedStudent) {
          errors.push({ row: i + 1, error: `Student UID "${rawUid || rawEmail}" not found in registered directory.` });
          continue;
        }

        const validDate = r.date ? new Date(r.date) : new Date();
        const statusStr = (r.status || "Present").trim();
        const normalizedStatus =
          statusStr.toLowerCase() === "absent" ? "Absent" :
          statusStr.toLowerCase() === "late" ? "Late" : "Present";

        docsToInsert.push({
          studentId: matchedStudent._id,
          studentUid: matchedStudent.uid,
          studentName: matchedStudent.name,
          subject: (r.subject || "General").trim(),
          faculty: (r.faculty || req.user.username || "Faculty").trim(),
          date: validDate,
          time: r.time || "09:15 AM",
          status: normalizedStatus,
          duration: r.duration || "1 Hour",
        });
      }

      let insertedCount = 0;
      if (docsToInsert.length > 0) {
        const bulkOps = docsToInsert.map((d) => ({
          updateOne: {
            filter: { studentId: d.studentId, date: d.date, subject: d.subject },
            update: { $set: d },
            upsert: true,
          },
        }));

        const result = await attendance.bulkWrite(bulkOps, { ordered: false });
        insertedCount = (result.upsertedCount || 0) + (result.modifiedCount || 0);
      }

      return res.json({
        message: `Successfully ingested ${insertedCount} attendance ledger records into institutional database.`,
        total: records.length,
        insertedCount,
        skippedCount: errors.length,
        errors: errors.slice(0, 10),
      });
    } catch (error) {
      console.error("Bulk attendance import error:", error);
      return res.status(500).json({ message: "Failed to import attendance ledger." });
    }
  }
);

// Bulk update master timetable schedule (Staff only)
app.post(
  ["/api/schedule/bulk-import", "/schedule/bulk-import"],
  authenticateToken,
  authorizeRoles("staff"),
  async (req, res) => {
    try {
      const { timetable } = req.body;
      if (!timetable) {
        return res.status(400).json({ message: "Invalid timetable payload." });
      }

      const saved = await Timetable.findOneAndUpdate(
        { academicYear: timetable.academicYear || "2024-25" },
        {
          $set: {
            academicYear: timetable.academicYear || "2024-25",
            department: timetable.department || "General",
            mon: timetable.mon || [],
            tue: timetable.tue || [],
            wed: timetable.wed || [],
            thu: timetable.thu || [],
            fri: timetable.fri || [],
            sat: timetable.sat || [],
            leave: timetable.leave || [],
          },
        },
        { upsert: true, new: true }
      );

      return res.json({ message: "Master timetable schedule published successfully.", timetable: saved });
    } catch (error) {
      console.error("Schedule bulk import error:", error);
      return res.status(500).json({ message: "Failed to publish timetable schedule." });
    }
  }
);

// Academic Timetable Schedule endpoint
app.get("/schedule", async (req, res) => {
  try {
    const liveTimetable = await Timetable.findOne().sort({ updatedAt: -1 });
    if (liveTimetable) {
      return res.json({
        mon: liveTimetable.mon || [],
        tue: liveTimetable.tue || [],
        wed: liveTimetable.wed || [],
        thu: liveTimetable.thu || [],
        fri: liveTimetable.fri || [],
        sat: liveTimetable.sat || [],
        leave: liveTimetable.leave || [],
      });
    }
    return res.json({ mon: [], tue: [], wed: [], thu: [], fri: [], leave: [] });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch timetable" });
  }
});

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
