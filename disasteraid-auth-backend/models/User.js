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
    enum: ['citizen', 'ngo', 'authority'], 
    required: true 
  },

  // Optional NGO/Volunteer profile (only for role === 'ngo')
  ngoProfile: {
    organizationName: { type: String },
    contactPerson: { type: String },
    phone: { type: String },
    location: { type: String },
    areasOfWork: [{ type: String }],
    availability: { type: String, enum: ['full-time', 'part-time', 'on-call'], default: 'full-time' },
    resources: { type: String },
    registrationId: { type: String }
  }

}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
