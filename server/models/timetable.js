const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema({
  sub: { type: String, required: true },
  teacher: { type: String, default: "Faculty" },
  start: { type: String, default: "09:15" },
  end: { type: String, default: "10:15" },
  room: { type: String, default: "" },
});

const timetableSchema = new mongoose.Schema(
  {
    academicYear: { type: String, default: "2024-25" },
    department: { type: String, default: "General" },
    semester: { type: String, default: "1" },
    mon: [slotSchema],
    tue: [slotSchema],
    wed: [slotSchema],
    thu: [slotSchema],
    fri: [slotSchema],
    sat: [slotSchema],
    leave: [slotSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("timetable", timetableSchema);

