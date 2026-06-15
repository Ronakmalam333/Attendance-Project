const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    uid: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profilePicture: { type: String }, // Base64 encoded image
    profileCompleted: { type: Boolean, default: true }, // Default to true for normal signups
  },
  { timestamps: true },
);

const staff = mongoose.model("staff", staffSchema);

module.exports = staff;
