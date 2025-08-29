const mongoose = require('mongoose');

const attendanceTokenSchema = new mongoose.Schema({
    subject: { type: String, required: true },
    token: { type: String, required: true, unique: true, minlength: 4, maxlength: 4 },
    faculty: { type: String, required: true },
    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    maxUsage: { type: Number, default: 100 },
    currentUsage: { type: Number, default: 0 },
    createdBy: { type: String, required: true }
}, { timestamps: true });

attendanceTokenSchema.index({ token: 1 });
attendanceTokenSchema.index({ subject: 1, validFrom: 1, validUntil: 1 });

const AttendanceToken = mongoose.model('AttendanceToken', attendanceTokenSchema);

module.exports = AttendanceToken;