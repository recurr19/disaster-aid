const express = require("express");
const { submitHelpRequest, getTickets } = require("../controllers/ticketController");
const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Handle multiple files with field name 'files[]'
router.post("/", upload.array('files[]', 10), submitHelpRequest);

// Get tickets with optional status filter (requires authentication)
router.get("/", protect, getTickets);

module.exports = router;
