const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const ngoController = require('../controllers/ngoController');

// All routes require NGO auth
router.get('/matches', protect, ngoController.listMatches);
router.post('/assignments/:assignmentId/accept', protect, ngoController.acceptAssignment);
router.post('/assignments/:assignmentId/reject', protect, ngoController.rejectAssignment);

module.exports = router;


