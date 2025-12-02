const express = require('express');
const router = express.Router();
const devController = require('../controllers/devController');

// GET /api/dev/metrics
router.get('/metrics', devController.getMetrics);

module.exports = router;
