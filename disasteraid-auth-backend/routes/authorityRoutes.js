const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const authorityController = require('../controllers/authorityController');

router.get('/map', protect, authorizeRoles('authority'), authorityController.getMapData);
router.get('/overlays', protect, authorizeRoles('authority'), authorityController.listOverlays);
router.post('/overlays', protect, authorizeRoles('authority'), authorityController.createOverlay);
router.put('/overlays/:id', protect, authorizeRoles('authority'), authorityController.updateOverlay);
router.delete('/overlays/:id', protect, authorizeRoles('authority'), authorityController.deleteOverlay);

module.exports = router;


