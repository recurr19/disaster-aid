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
  registrationId: { type: String, unique: true, sparse: true },

  // Operational Capacity Fields
  foodCapacity: { type: Number, default: 0 },          // e.g., meals per day
  medicalTeamCount: { type: Number, default: 0 },       // no. of medical teams
  vehiclesAvailable: { type: Number, default: 0 },      // total vehicles (sum of trucks+boats+ambulances)
  
  // Vehicle breakdown
  trucks: { type: Number, default: 0 },
  boats: { type: Number, default: 0 },
  ambulances: { type: Number, default: 0 },
  
  coverageRadius: { type: Number, default: 5 },         // km radius of service area
  
  // Manual address entry
  manualAddress: { type: String },

  // Dispatcher management
  dispatcherCount: { type: Number, default: 0 },
  dispatchers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dispatcher'
  }]

}, { timestamps: true });

// GeoJSON location for spatial queries (optional). Stored as [lng, lat]
registeredNGOSchema.add({
  locationGeo: {
    type: {
      type: String,
      enum: ['Point'],
      required: false
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: false
    }
  }
});

// Ensure a 2dsphere index exists for geo queries (only when coordinates exist)
registeredNGOSchema.index(
  { locationGeo: '2dsphere' },
  { partialFilterExpression: { 'locationGeo.coordinates': { $type: 'array' } } }
);

module.exports = mongoose.model('RegisteredNGO', registeredNGOSchema);
