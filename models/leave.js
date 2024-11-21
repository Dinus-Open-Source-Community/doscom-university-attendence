const mongoose = require('mongoose');

const LeaveSchema = new mongoose.Schema({
  token: {
    type: Number,
    required: true,
    ref: 'Person'
  },
  start_date: {
    type: String,
    required: true
  },
  end_date: {
    type: String,
    required: true
  },
  days: {
    type: Number,
    required: true
  },
  leave_type: {
    type: String,
    required: true
  },
  leave_desc: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Leave', LeaveSchema);
