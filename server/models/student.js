const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    uid: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    course: { type: String, required: true, default: "Pending" },
    semester: { type: String, required: true, default: "Pending" },
    profileCompleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const student = mongoose.model("student", studentSchema);

module.exports = student;
