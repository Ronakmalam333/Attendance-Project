const express = require("express");
const bcrypt = require("bcrypt");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { generateTokens, setTokenCookies, clearTokenCookies } = require('./tokenUtils');
const { authenticateToken, authorizeRoles } = require('./authMiddleware');

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
const GOOGLE_AI_KEY = process.env.GOOGLE_AI_KEY;
const genAI = new GoogleGenerativeAI(GOOGLE_AI_KEY);

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.get("/", (req, res) => {
  res.json({ message: "Hello, World!" });
});

app.post("/student", async (req, res) => {
  const { firstname, lastname, uid, email, password, course, semester } = req.body;
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
  const { role, firstName, lastName, uid, email, password, course, semester } = req.body;
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
      });
      await newUser.save();

      return res.status(200).json({ message: "Student registered successfully" });
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
        const studentMatch = await bcrypt.compare(password, studentExist.password);
        if (studentMatch) {
          const { accessToken, refreshToken } = generateTokens({ username, role });
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
          const { accessToken, refreshToken } = generateTokens({ username, role });
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

    let user;
    if (role === "student") {
      user = await student.findOneAndUpdate(
        { $or: [{ uid: username }, { email: username }] },
        updates,
        { new: true }
      );
    } else {
      user = await staff.findOneAndUpdate(
        { $or: [{ uid: username }, { email: username }] },
        updates,
        { new: true }
      );
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ message: "Profile updated", user });
  } catch (error) {
    console.error("Profile update error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
});

app.post("/chatbot", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: "Prompt is required" });
  }

  try {
    const systemPrompt = `You are an AI assistant for an Attendance Management System (AMS). You help students and staff with attendance-related queries only. 

System Features:
- Students can submit attendance using tokens during class hours
- Staff can view all attendance records and generate reports
- Students can view their personal attendance history
- System supports role-based access (student/staff)
- Attendance tracking with date, time, subject, and status
- Profile management for users
- Dashboard with attendance statistics

Only answer questions related to:
- How to submit attendance
- Viewing attendance records
- Understanding attendance statistics
- Profile management
- System navigation
- Troubleshooting attendance issues
- Academic attendance policies

If asked about topics unrelated to attendance management, politely redirect to attendance-related topics.

User Question: ${prompt}`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(systemPrompt);
    const response = result.response;
    const text = response.text();
    return res.status(200).json({ response: text });
  } catch (error) {
    console.error("Chatbot Error:", error.message);
    return res.status(500).json({ message: "Failed to fetch AI response", error: error.message });
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

app.get("/students", authenticateToken, authorizeRoles('staff'), async (req, res) => {
  try {
    const data = await student.find();
    return res.json(data);
  } catch (error) {
    console.error("Student fetch error:", error);
    return res.status(500).json({ message: "Failed to get students" });
  }
});

// Token refresh endpoint
app.post("/auth/refresh", (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  
  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token required" });
  }

  try {
    const { verifyRefreshToken } = require('./tokenUtils');
    const decoded = verifyRefreshToken(refreshToken);
    const { accessToken, refreshToken: newRefreshToken } = generateTokens({
      username: decoded.username,
      role: decoded.role
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

    const { verifyAccessToken } = require('./tokenUtils');
    const decoded = verifyAccessToken(accessToken);
    return res.status(200).json({ 
      authenticated: true, 
      user: decoded 
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
  if (role !== 'student') {
    return res.status(403).json({ message: "Only students can submit attendance" });
  }

  try {
    // Sanitize and validate input
    const sanitizedToken = attendanceToken?.toString().trim().toUpperCase();
    if (!sanitizedToken || !/^[A-Z0-9]{4}$/.test(sanitizedToken)) {
      return res.status(400).json({ message: "Please enter a valid 4-character alphanumeric token" });
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
      validUntil: { $gte: now }
    });

    if (!tokenData) {
      return res.status(400).json({ 
        message: "Invalid or expired token" 
      });
    }

    if (tokenData.currentUsage >= tokenData.maxUsage) {
      return res.status(400).json({ 
        message: "Token usage limit reached" 
      });
    }

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    // Check if attendance already exists for today and subject
    const existingAttendance = await attendance.findOne({
      studentId: studentData._id,
      subject: tokenData.subject,
      date: { $gte: startOfDay, $lt: endOfDay }
    });

    if (existingAttendance) {
      return res.status(400).json({ 
        message: `Attendance already marked for ${tokenData.subject} today` 
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
      time: today.toLocaleTimeString('en-US', { hour12: false }),
      status: "Present",
      token: sanitizedToken,
      duration: "1 hour"
    });

    await newAttendance.save();
    
    // Update token usage
    await AttendanceToken.findByIdAndUpdate(tokenData._id, {
      $inc: { currentUsage: 1 }
    });

    return res.status(200).json({ 
      message: `Attendance marked successfully for ${tokenData.subject}` 
    });
  } catch (error) {
    console.error("Attendance submission error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get student's attendance records
app.get("/attendance/student", authenticateToken, authorizeRoles('student'), async (req, res) => {
  const { username, role } = req.user;

  try {
    const studentData = await student.findOne({
      $or: [{ uid: username }, { email: username }],
    });

    if (!studentData) {
      return res.status(404).json({ message: "Student not found" });
    }

    const attendanceRecords = await attendance.find({ studentId: studentData._id })
      .sort({ date: -1 });

    return res.json(attendanceRecords);
  } catch (error) {
    console.error("Get student attendance error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get all attendance records (admin only)
app.get("/attendance/all", authenticateToken, authorizeRoles('staff'), async (req, res) => {
  const { role } = req.user;

  try {
    const attendanceRecords = await attendance.find()
      .populate('studentId', 'name uid email course semester')
      .sort({ date: -1 });

    return res.json(attendanceRecords);
  } catch (error) {
    console.error("Get all attendance error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get attendance summary (admin dashboard)
app.get("/api/attendance/summary", authenticateToken, authorizeRoles('staff'), async (req, res) => {
  const { role } = req.user;

  try {
    const totalStudents = await student.countDocuments();
    const totalRecords = await attendance.countDocuments();
    
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
    
    const presentToday = await attendance.countDocuments({
      date: { $gte: startOfDay, $lt: endOfDay },
      status: "Present"
    });

    return res.json({ totalStudents, totalRecords, presentToday });
  } catch (error) {
    console.error("Get attendance summary error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// Token Management Routes

// Get all tokens (staff only)
app.get("/tokens", authenticateToken, authorizeRoles('staff'), async (req, res) => {
  try {
    const tokens = await AttendanceToken.find().sort({ createdAt: -1 });
    return res.json(tokens);
  } catch (error) {
    console.error("Get tokens error:", error);
    return res.status(500).json({ message: "Failed to fetch tokens" });
  }
});

// Get active tokens (students can see current sessions)
app.get("/tokens/active", authenticateToken, async (req, res) => {
  try {
    const activeTokens = await AttendanceToken.find({
      isActive: true,
      validFrom: { $lte: new Date() },
      validUntil: { $gte: new Date() },
      $expr: { $lt: ['$currentUsage', '$maxUsage'] }
    }).select('subject faculty validUntil currentUsage maxUsage').sort({ validUntil: 1 });
    
    return res.json(activeTokens);
  } catch (error) {
    console.error("Get active tokens error:", error);
    return res.status(500).json({ message: "Failed to fetch active tokens" });
  }
});

// Create new token (staff only)
app.post("/tokens", authenticateToken, authorizeRoles('staff'), async (req, res) => {
  const { subject, token, faculty, validFrom, validUntil, maxUsage } = req.body;
  const { username } = req.user;

  try {
    const newToken = new AttendanceToken({
      subject,
      token,
      faculty,
      validFrom: new Date(validFrom),
      validUntil: new Date(validUntil),
      maxUsage: maxUsage || 100,
      createdBy: username
    });

    await newToken.save();
    return res.status(201).json({ message: "Token created successfully", token: newToken });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Token already exists" });
    }
    console.error("Create token error:", error);
    return res.status(500).json({ message: "Failed to create token" });
  }
});

// Update token (staff only)
app.put("/tokens/:id", authenticateToken, authorizeRoles('staff'), async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const updatedToken = await AttendanceToken.findByIdAndUpdate(id, updates, { new: true });
    if (!updatedToken) {
      return res.status(404).json({ message: "Token not found" });
    }
    return res.json({ message: "Token updated successfully", token: updatedToken });
  } catch (error) {
    console.error("Update token error:", error);
    return res.status(500).json({ message: "Failed to update token" });
  }
});

// Delete token (staff only)
app.delete("/tokens/:id", authenticateToken, authorizeRoles('staff'), async (req, res) => {
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
});



// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({ 
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});