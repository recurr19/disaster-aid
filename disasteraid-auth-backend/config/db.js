// import the Mongoose library
const mongoose = require('mongoose');
// asynchronous function named connectDB
const connectDB = async () => {
  try {
    // pauses the function until the connection is either established or fails.
    await mongoose.connect(process.env.MONGO_URI, {
        // Mongoose to use the new URL parser and the new server discovery and monitoring engine
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected");
  } catch (err) {
    console.error("DB connection error:", err.message);
    process.exit(1);
  }
};
module.exports = connectDB;
