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
  createdAt: { type: Date, default: Date.now }
});

const Ticket = mongoose.model("Ticket", ticketSchema);

module.exports = Ticket;
