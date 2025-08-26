const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'student', required: true },
    studentUid: { type: String, required: true },
    studentName: { type: String, required: true },
    subject: { type: String, required: true },
    faculty: { type: String, required: true },
    date: { type: Date, required: true, default: Date.now },
    time: { type: String, required: true },
    status: { type: String, enum: ['Present', 'Absent', 'Late'], default: 'Absent' },
    token: { type: String },
    duration: { type: String, required: true }
}, { timestamps: true });

// Create compound index for efficient queries
attendanceSchema.index({ studentId: 1, date: 1, subject: 1 }, { unique: true });

const attendance = mongoose.model('attendance', attendanceSchema);

module.exports = attendance;