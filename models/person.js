const mongoose = require('mongoose');

const PersonSchema = new mongoose.Schema({
  token: { 
    type: Number,
    required: true,
    unique: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  dept_name: { 
    type: String, 
    required: false,
    default: null
  },
  phone: { 
    type: String,
    required: false,
    default: null
  },
  salary: { 
    type: String,
    required: false ,
    default: null
  },
  role: { 
    type: String,
    required: true 
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Person', PersonSchema);
