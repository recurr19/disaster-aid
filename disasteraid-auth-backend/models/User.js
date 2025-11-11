const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },

  email: { 
    type: String, 
    required: true, 
    unique: true 
  },

  password: { 
    type: String, 
    required: true 
  },

  role: { 
    type: String, 
    enum: ['citizen', 'ngo', 'authority', 'dispatcher'], 
    required: true 
  },

  // For dispatchers - link to their parent NGO
  parentNGO: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RegisteredNGO',
    required: false
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
