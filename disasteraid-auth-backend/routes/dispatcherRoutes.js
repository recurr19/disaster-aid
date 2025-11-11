const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
  generateDispatchers,
  listDispatchers,
  assignTicketToDispatcher,
  getDispatcherTickets,
  uploadDeliveryProof
} = require('../controllers/dispatcherController');

/**
 * @route   POST /api/dispatcher/generate
 * @desc    Generate dispatchers for an NGO
 * @access  Protected (NGO only)
 */
router.post('/generate', protect, generateDispatchers);

/**
 * @route   GET /api/dispatcher/list
 * @desc    Get all dispatchers for an NGO
 * @access  Protected (NGO only)
 */
router.get('/list', protect, listDispatchers);

/**
 * @route   POST /api/dispatcher/assign-ticket
 * @desc    Assign a ticket to a dispatcher
 * @access  Protected (NGO only)
 */
router.post('/assign-ticket', protect, assignTicketToDispatcher);

/**
 * @route   GET /api/dispatcher/my-tickets
 * @desc    Get tickets assigned to logged-in dispatcher
 * @access  Protected (Dispatcher only)
 */
router.get('/my-tickets', protect, getDispatcherTickets);

/**
 * @route   POST /api/dispatcher/upload-proof/:ticketId
 * @desc    Upload delivery proof for a ticket
 * @access  Protected (Dispatcher only)
 */
router.post('/upload-proof/:ticketId', protect, upload.array('files[]', 10), uploadDeliveryProof);

module.exports = router;
