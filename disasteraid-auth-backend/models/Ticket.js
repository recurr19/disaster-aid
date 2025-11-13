const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
  ticketId: { type: String, required: true, unique: true },
  name: String,
  phone: String,
  language: String,
  preferredContact: { type: String, enum: ['call', 'sms', 'whatsapp', 'email'], required: false },
  channel: { type: String, enum: ['web', 'chat', 'sms', 'callcenter', 'bulk'], required: false },
  address: String,
  landmark: String,
  adults: Number,
  children: Number,
  elderly: Number,
  helpTypes: [String],
  medicalNeeds: [String],
  description: String,
  isSOS: Boolean,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false, index: true },
  status: { type: String, default: "active" },
  createdAt: { type: Date, default: Date.now },
  totalBeneficiaries: { type: Number, default: 0 },
  priorityScore: { type: Number, default: 0 },
  triageLevel: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'low' },
  isAnonymous: { type: Boolean, default: false, index: true },
  clusterId: { type: String, required: false, index: true },
  possibleDuplicateOf: { type: String, required: false },
  batteryLevel: { type: Number, min: 0, max: 100 },
  networkStrength: { type: Number, min: 0, max: 100 },
  files: [{
    filename: String,
    originalname: String,
    mimetype: String,
    path: String,
    size: Number
  }],
  locationGeo: {
    type: {
      type: String,
      enum: ['Point'],
      required: false
    },
    coordinates: {
      type: [Number],
      required: false
    }
  },
  coverageArea: {
    type: {
      type: String,
      enum: ['Polygon', 'MultiPolygon'],
      required: false
    },
    coordinates: {
      type: Array,
      required: false
    }
  },
  beneficiaries: {
    specialNeeds: [{ type: String }],
    disabilities: [{ type: String }],
    petsCount: { type: Number, default: 0 }
  }
});

// Common query indexes
ticketSchema.index({ status: 1, createdAt: -1 });
// Geo index for location point queries
ticketSchema.index({ locationGeo: '2dsphere' });

// Assignment metadata
ticketSchema.add({
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'RegisteredNGO', required: false },
  assignedAt: { type: Date, required: false },
  assignmentHistory: [{
    ngo: { type: mongoose.Schema.Types.ObjectId, ref: 'RegisteredNGO' },
    assignedAt: Date,
    note: String
  }],
  
  // Dispatcher assignment
  dispatchedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Dispatcher', required: false },
  dispatchedAt: { type: Date, required: false },
  isDispatched: { type: Boolean, default: false },
  
  // Delivery proof uploaded by dispatcher
  deliveryProof: [{
    filename: String,
    originalname: String,
    mimetype: String,
    path: String,
    size: Number,
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }]
});

// Optional GeoJSON location for the ticket (for accurate matching). Stored as [lng, lat]
ticketSchema.add({
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

// 2dsphere index for geo queries (only when coordinates exist)
ticketSchema.index(
  { locationGeo: '2dsphere' },
  { partialFilterExpression: { 'locationGeo.coordinates': { $type: 'array' } } }
);

const Ticket = mongoose.model("Ticket", ticketSchema);

module.exports = Ticket;
