const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  token: {
    type: Number,
    required: true,
    ref: 'Person'
  },
  present_date: {
    type: String,
    required: true
  },
  join_time: {
    type: String,
    required: true
  },
  exit_time: {
    type: String,
    default: null
  },
  status: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Attendance', AttendanceSchema);
