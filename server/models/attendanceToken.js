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

// Prevent duplicate tokens for same subject in overlapping time periods
attendanceTokenSchema.index({ subject: 1, validFrom: 1, validUntil: 1 });

// Add validation
attendanceTokenSchema.pre('save', function(next) {
  if (this.validFrom >= this.validUntil) {
    next(new Error('Valid from date must be before valid until date'));
  }
  if (this.maxUsage < 1) {
    next(new Error('Max usage must be at least 1'));
  }
  next();
});

const AttendanceToken = mongoose.model('AttendanceToken', attendanceTokenSchema);

module.exports = AttendanceToken;