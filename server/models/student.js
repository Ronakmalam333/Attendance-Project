const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    name: { type: String },
    uid: { type: String },
    email: { type: String },
    password: { type: String }
})

const student = mongoose.model('student', studentSchema);

module.exports = student;