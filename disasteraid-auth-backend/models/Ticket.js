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

const Ticket = mongoose.model("Ticket", ticketSchema);

module.exports = Ticket;
