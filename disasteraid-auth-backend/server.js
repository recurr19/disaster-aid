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
const MATCH_LOOKBACK_MS = 6 * 60 * 60 * 1000; // 6 hours
async function backgroundMatch() {
  try {
    const since = new Date(Date.now() - MATCH_LOOKBACK_MS);
    const activeTickets = await Ticket.find({ status: 'active', createdAt: { $gte: since } })
      .select('_id ticketId helpTypes locationGeo createdAt isSOS')
      .lean();

    for (const t of activeTickets) {
      try {
        // Find NGOs that have already been assigned (proposed, rejected, completed, etc.)
        // We want to exclude them from being matched again.
        const existingAssignments = await TicketAssignment.find({ ticket: t._id }).select('ngo status').lean();
        const excludedNgoIds = existingAssignments.map(a => a.ngo.toString());

        // Use multi-assign matcher
        const { findNGOCombinations } = require('./utils/multiAssignMatching');

        // Get combinations (returns array of groups)
        const combinations = await findNGOCombinations(t, { maxResults: 20, excludedNgoIds });

        // Take the best combination (index 0)
        const bestCombo = combinations[0];

        if (bestCombo && bestCombo.assignments) {
          for (const assignment of bestCombo.assignments) {
            const m = assignment.ngo;
            const capacities = assignment.assignedCapacities;

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
                    assignedCapacities: capacities
                  }
                },
                { upsert: true }
              );
            } catch (_) { /* ignore duplicate */ }
          }

          // Notify about proposals
          if (bestCombo.assignments.length > 0) {
            const proposals = bestCombo.assignments.map(a => ({
              ngoId: a.ngo.ngoId,
              distanceKm: a.ngo.distanceKm,
              etaMinutes: a.ngo.etaMinutes,
              score: a.ngo.score,
              assignedCapacities: a.assignedCapacities
            }));
            Realtime.emit('ticket:proposals', { ticketId: t.ticketId, proposals });
          }
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
