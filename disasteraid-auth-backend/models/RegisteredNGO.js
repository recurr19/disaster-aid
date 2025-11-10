const mongoose = require('mongoose');

const registeredNGOSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true
  },

  organizationName: { type: String, required: true },
  contactPerson: { type: String },
  phone: { type: String },
  location: { type: String },

  // Type of relief work NGO handles
  areasOfWork: [{ type: String }],

  // Manpower / time availability
  availability: { 
    type: String, 
    enum: ['full-time', 'part-time', 'on-call'], 
    default: 'full-time' 
  },

  // General resources description (free text)
  resources: { type: String },

  // Verification / Registration number
  registrationId: { type: String, unique: true },

  // Operational Capacity Fields
  foodCapacity: { type: Number, default: 0 },          // e.g., meals per day
  medicalTeamCount: { type: Number, default: 0 },       // no. of medical teams
  vehiclesAvailable: { type: Number, default: 0 },      // boats/trucks/ambulances/etc.
  coverageRadius: { type: Number, default: 5 },         // km radius of service area

}, { timestamps: true });

module.exports = mongoose.model('RegisteredNGO', registeredNGOSchema);
