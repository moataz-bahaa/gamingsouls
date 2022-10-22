const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  profit: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model('Admin', schema);
