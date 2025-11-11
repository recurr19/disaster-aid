const mongoose = require('mongoose');

const dispatcherSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  ngo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RegisteredNGO',
    required: true
  },

  dispatcherId: {
    type: String,
    required: true,
    unique: true
  },

  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  // Auto-generated password (will be hashed in User model)
  generatedPassword: {
    type: String,
    required: true
  },

  isActive: {
    type: Boolean,
    default: true
  },

  // Track assigned tickets
  assignedTickets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket'
  }]

}, { timestamps: true });

module.exports = mongoose.model('Dispatcher', dispatcherSchema);
