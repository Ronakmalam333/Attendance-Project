const mongoose = require('mongoose');

const URI = 'mongodb://localhost:27017/studentDb';

function connectDb() {
    mongoose.connect(URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.log(err));
}

module.exports = connectDb;