const express = require("express");
const router = express.Router();

const { 
  submitHelpRequest, 
  getTickets, 
  getMatchesForTicket, 
  assignBestNGO,
  submitPublicHelpRequest
} = require("../controllers/ticketController");

const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');

// Simple in-memory rate limiter for public endpoint
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MAX = 20; // 20 requests per window per IP
const ipHits = new Map();

function publicRateLimit(req, res, next) {
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  const now = Date.now();
  const rec = ipHits.get(ip) || { count: 0, start: now };
  if (now - rec.start > RATE_LIMIT_WINDOW_MS) {
    rec.count = 0;
    rec.start = now;
  }
  rec.count += 1;
  ipHits.set(ip, rec);
  if (rec.count > RATE_LIMIT_MAX) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }
  next();
}

// Submit Help Request (Protected - requires authentication)
router.post("/", protect, upload.array("files[]", 10), submitHelpRequest);

// Public Help Request (No auth) with basic rate limiting
router.post("/public", publicRateLimit, upload.array("files[]", 10), submitPublicHelpRequest);

// Get Tickets (Protected for Authority & Citizen Dashboard)
router.get("/", protect, getTickets);

// Get NGO matches for a ticket
router.get("/match/:ticketId", protect, getMatchesForTicket);

// Assign best NGO to handle the ticket
router.post("/assign/:ticketId", protect, assignBestNGO);

module.exports = router;
