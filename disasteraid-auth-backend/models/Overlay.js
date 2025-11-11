const mongoose = require('mongoose');

const overlaySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['shelter', 'medicalCamp', 'depot', 'blockedRoute', 'advisory'],
    required: true,
    index: true
  },
  name: { type: String, required: true },
  status: { type: String, required: false }, // e.g., open/closed, active/inactive
  capacity: { type: Number, required: false }, // for shelters/depots
  properties: { type: Object, default: {} },
  geometry: {
    type: { type: String, enum: ['Point', 'LineString', 'Polygon'], required: true },
    coordinates: { type: Array, required: true }
  }
}, { timestamps: true });

overlaySchema.index({ geometry: '2dsphere' });

module.exports = mongoose.model('Overlay', overlaySchema);


