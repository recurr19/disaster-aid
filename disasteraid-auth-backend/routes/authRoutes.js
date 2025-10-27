const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @body    { name, email, password, role }
 */
router.post('/register', registerUser);

/**
 * @route   POST /api/auth/login
 * @desc    Login existing user
 * @body    { email, password }
 */
router.post('/login', loginUser);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current logged-in user info
 * @header  Authorization: Bearer <token>
 */
router.get('/profile', protect, getProfile);

module.exports = router;
