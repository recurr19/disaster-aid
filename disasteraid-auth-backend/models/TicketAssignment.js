const mongoose = require('mongoose');

const ticketAssignmentSchema = new mongoose.Schema({
  ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true, index: true },
  ticketId: { type: String, required: true, index: true },
  ngo: { type: mongoose.Schema.Types.ObjectId, ref: 'RegisteredNGO', required: true, index: true },
  status: { type: String, enum: ['proposed', 'accepted', 'rejected', 'completed'], default: 'proposed', index: true },
  isSOS: { type: Boolean, default: false },
  matchedHelpTypes: [{ type: String }],
  score: { type: Number, default: 0 },
  distanceKm: { type: Number },
  etaMinutes: { type: Number },
  etaMinutes: { type: Number },
  note: { type: String },
  assignedCapacities: {
    food: { type: Number, default: 0 },
    medical: { type: Number, default: 0 },
    transport: { type: Number, default: 0 },
    shelter: { type: Number, default: 0 }
  }
}, { timestamps: true });

ticketAssignmentSchema.index({ ticket: 1, ngo: 1 }, { unique: true });

module.exports = mongoose.model('TicketAssignment', ticketAssignmentSchema);

