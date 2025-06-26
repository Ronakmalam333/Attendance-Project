const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
    name: { type: String },
    uid: { type: String },
    email: { type: String },
    password: { type: String }
})

const staff = mongoose.model('staff', staffSchema);

module.exports = staff;