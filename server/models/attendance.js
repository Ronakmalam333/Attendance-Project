const mongoose = require('mongoose');

const attendSchema = new mongoose.Schema({
    "24BTCSE079": { type: Boolean },
    "24BTCSE080": { type: Boolean }
})

const subAttendSchema = new mongoose.Schema({
    date: { type: Date },
    subject: { type: String },
    attendance: attendSchema,
    duration: { type: String },
    faculty: { type: String },
    time: { type: String }
})

const attendance = mongoose.model('attendance', subAttendSchema);

module.exports = attendance;