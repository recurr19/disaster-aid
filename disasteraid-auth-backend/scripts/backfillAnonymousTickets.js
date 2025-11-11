require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Ticket = require('../models/Ticket');

(async () => {
  try {
    await connectDB();
    const res = await Ticket.updateMany(
      { $or: [{ createdBy: { $exists: false } }, { createdBy: null }] },
      { $set: { isAnonymous: true } }
    );
    console.log(`Backfill complete. Modified: ${res.modifiedCount}`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (e) {
    console.error('Backfill error:', e);
    process.exit(1);
  }
})();


