const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
  ticketId: { type: String, required: true, unique: true },
  name: String,
  phone: String,
  address: String,
  landmark: String,
  adults: Number,
  children: Number,
  elderly: Number,
  helpTypes: [String],
  medicalNeeds: [String],
  description: String,
  isSOS: Boolean,
  status: { type: String, default: "active" },
  createdAt: { type: Date, default: Date.now },
  batteryLevel: { type: Number, min: 0, max: 100 },
  networkStrength: { type: Number, min: 0, max: 100 },
  files: [{
    filename: String,
    originalname: String,
    mimetype: String,
    path: String,
    size: Number
  }]
});

// Assignment metadata
ticketSchema.add({
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'RegisteredNGO', required: false },
  assignedAt: { type: Date, required: false },
  assignmentHistory: [{
    ngo: { type: mongoose.Schema.Types.ObjectId, ref: 'RegisteredNGO' },
    assignedAt: Date,
    note: String
  }]
});

// Optional GeoJSON location for the ticket (for accurate matching). Stored as [lng, lat]
ticketSchema.add({
  locationGeo: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [lng, lat]
      index: '2dsphere',
      required: false
    }
  }
});

// 2dsphere index for geo queries
ticketSchema.index({ locationGeo: '2dsphere' });

const Ticket = mongoose.model("Ticket", ticketSchema);

module.exports = Ticket;
