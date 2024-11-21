const mongoose = require('mongoose');

const LoginSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  hash: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Login', LoginSchema);