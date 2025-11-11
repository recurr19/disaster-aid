const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const trackerController = require('../controllers/trackerController');

// Public: Citizens can check status by ticketId without login
router.get('/:ticketId', trackerController.getStatus);

// NGO: Update ticket status
router.post('/:ticketId/status', protect, trackerController.updateStatus);

module.exports = router;


