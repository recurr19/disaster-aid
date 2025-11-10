const express = require("express");
const {
  submitHelpRequest,
  getTickets,
  getMatchesForTicket,
  assignBestNGO
} = require("../controllers/ticketController");
const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Handle multiple files with field name 'files[]'
router.post("/", upload.array('files[]', 10), submitHelpRequest);

// Get tickets with optional status filter (requires authentication)
router.get("/", protect, getTickets);

// Get matching NGOs for a ticket
router.get('/match/:ticketId', getMatchesForTicket);

// Assign the best NGO to a ticket (simulated notification)
router.post('/assign/:ticketId', express.json(), assignBestNGO);

module.exports = router;
