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
const dispatcherRoutes = require('./routes/dispatcherRoutes');
const RegisteredNGO = require('./models/RegisteredNGO');
const Ticket = require('./models/Ticket');
const TicketAssignment = require('./models/TicketAssignment');
const { matchTicket } = require('./utils/matching');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Ensure geo indexes for RegisteredNGO exist (for $geoNear)
RegisteredNGO.createIndexes().catch((e) => {
  console.warn('Warning: could not ensure RegisteredNGO indexes:', e?.message || e);
});

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
app.use("/api/dispatcher", dispatcherRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('DisasterAid Auth API is running...');
});

// Start server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Background matcher: periodically ensure proposals exist for active tickets
const MATCH_INTERVAL_MS = 60 * 1000; // 60s
async function backgroundMatch() {
  try {
    const since = new Date(Date.now() - 6 * 60 * 60 * 1000); // last 6 hours
    const activeTickets = await Ticket.find({ status: 'active', createdAt: { $gte: since } })
      .select('_id ticketId helpTypes locationGeo createdAt isSOS')
      .lean();

    for (const t of activeTickets) {
      try {
        const matches = await matchTicket(t, { maxResults: 10 });
        const proposals = matches.slice(0, 10);
        for (const m of proposals) {
          try {
            await TicketAssignment.updateOne(
              { ticket: t._id, ngo: m.ngoId },
              {
                $setOnInsert: {
                  ticket: t._id,
                  ticketId: t.ticketId,
                  ngo: m.ngoId,
                  status: 'proposed',
                  isSOS: !!t.isSOS,
                  matchedHelpTypes: m.matches || [],
                  score: m.score || 0,
                  distanceKm: m.distanceKm ?? null,
                  etaMinutes: m.etaMinutes ?? null,
                }
              },
              { upsert: true }
            );
          } catch (_) { /* ignore duplicate */ }
        }
        if (proposals.length) {
          Realtime.emit('ticket:proposals', { ticketId: t.ticketId, proposals: proposals.map(p => ({ ngoId: p.ngoId, distanceKm: p.distanceKm, etaMinutes: p.etaMinutes, score: p.score })) });
        }
      } catch (e) {
        console.warn('Background match error for ticket', t.ticketId, e?.message || e);
      }
    }
  } catch (e) {
    console.warn('Background matcher loop failed:', e?.message || e);
  }
}

setInterval(backgroundMatch, MATCH_INTERVAL_MS);
