const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, refPath: 'userModel' },
    userModel: { type: String, enum: ['student', 'staff'], default: 'student' },
    userName: { type: String },
    userUid: { type: String },
    category: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    comment: { type: String, required: true, trim: true },
    status: { type: String, enum: ['pending', 'reviewed', 'resolved'], default: 'pending' },
    responseComment: { type: String, default: "" },
    resolvedBy: { type: String, default: "" },
    resolvedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('feedback', feedbackSchema);

