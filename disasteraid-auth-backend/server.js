const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const authorityRoutes = require('./routes/authorityRoutes');
const http = require('http');
const Realtime = require('./utils/realtime');
const ngoRoutes = require('./routes/ngoRoutes');
const trackerRoutes = require('./routes/trackerRoutes');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Express
const app = express();
const server = http.createServer(app);
Realtime.init(server);

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/auth', authRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/authority", authorityRoutes);
app.use("/api/ngo", ngoRoutes);
app.use("/api/tracker", trackerRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('DisasterAid Auth API is running...');
});

// Start server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
