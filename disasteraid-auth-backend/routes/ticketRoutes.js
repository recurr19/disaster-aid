const express = require("express");
const router = express.Router();

const { 
  submitHelpRequest, 
  getTickets, 
  getMatchesForTicket, 
  assignBestNGO 
} = require("../controllers/ticketController");

const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');

// Submit Help Request (Protected - requires authentication)
router.post("/", protect, upload.array("files[]", 10), submitHelpRequest);

// Get Tickets (Protected for Authority & Citizen Dashboard)
router.get("/", protect, getTickets);

// Get NGO matches for a ticket
router.get("/match/:ticketId", protect, getMatchesForTicket);

// Assign best NGO to handle the ticket
router.post("/assign/:ticketId", protect, assignBestNGO);

module.exports = router;
