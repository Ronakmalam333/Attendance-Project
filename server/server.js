const express = require("express");
const bcrypt = require("bcrypt");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const connectDb = require("./config/db");
const student = require("./models/student");
const staff = require("./models/staff");
const attendance = require("./models/attendance");

const app = express();
connectDb();

// Load environment variables
require("dotenv").config();
const SECRET_KEY = process.env.SECRET_KEY || "This is my security key";
const GOOGLE_AI_KEY = process.env.GOOGLE_AI_KEY;
const genAI = new GoogleGenerativeAI(GOOGLE_AI_KEY);

app.use(express.json());
app.use(cors());

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
          const token = jwt.sign({ username, role }, SECRET_KEY, {
            expiresIn: "24h",
          });
          return res.status(200).json({
            message: "Login Successful",
            token,
            role,
            user: { ...studentExist.toObject(), role }, // <-- FIXED
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
          const token = jwt.sign({ username, role }, SECRET_KEY, {
            expiresIn: "24h",
          });
          return res.status(200).json({
            message: "Login Successful",
            token,
            role,
            user: { ...staffExist.toObject(), role }, // <-- FIXED
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

app.get("/profile", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const { username, role } = decoded;

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
    return res.status(500).json({ message: "Invalid or expired token" });
  }
});

app.put("/profile", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const { username, role } = decoded;
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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
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

app.get("/students", async (req, res) => {
  try {
    const data = await student.find();
    return res.json(data);
  } catch (error) {
    console.error("Student fetch error:", error);
    return res.status(500).json({ message: "Failed to get students" });
  }
});

// Middleware for token verification
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Submit attendance token
app.post("/attendance/submit", verifyToken, async (req, res) => {
  const { token: attendanceToken, subject } = req.body;
  const { username, role } = req.user;

  if (role !== "student") {
    return res.status(403).json({ message: "Only students can submit attendance" });
  }

  try {
    const studentData = await student.findOne({
      $or: [{ uid: username }, { email: username }],
    });

    if (!studentData) {
      return res.status(404).json({ message: "Student not found" });
    }

    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const timeStr = today.toLocaleTimeString('en-US', { hour12: false });

    // Check if attendance already exists for today and subject
    const existingAttendance = await attendance.findOne({
      studentId: studentData._id,
      subject,
      date: {
        $gte: new Date(dateStr),
        $lt: new Date(new Date(dateStr).getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (existingAttendance) {
      return res.status(400).json({ message: "Attendance already submitted for this subject today" });
    }

    // Create new attendance record
    const newAttendance = new attendance({
      studentId: studentData._id,
      studentUid: studentData.uid,
      studentName: studentData.name,
      subject,
      faculty: "TBD", // This should come from schedule or be provided
      date: today,
      time: timeStr,
      status: "Present",
      token: attendanceToken,
      duration: "1 hour" // This should be calculated or provided
    });

    await newAttendance.save();
    return res.status(200).json({ message: "Attendance submitted successfully" });
  } catch (error) {
    console.error("Attendance submission error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get student's attendance records
app.get("/attendance/student", verifyToken, async (req, res) => {
  const { username, role } = req.user;

  if (role !== "student") {
    return res.status(403).json({ message: "Access denied" });
  }

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
app.get("/attendance/all", verifyToken, async (req, res) => {
  const { role } = req.user;

  if (role !== "staff") {
    return res.status(403).json({ message: "Access denied" });
  }

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
app.get("/api/attendance/summary", verifyToken, async (req, res) => {
  const { role } = req.user;

  if (role !== "staff") {
    return res.status(403).json({ message: "Access denied" });
  }

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));