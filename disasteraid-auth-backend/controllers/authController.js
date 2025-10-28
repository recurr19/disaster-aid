const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user (Citizen / NGO / Authority)
 * @body    {
 *            name: String,
 *            email: String,
 *            password: String,
 *            role: String ('citizen' | 'ngo' | 'authority')
 *          }
 * @returns { token: String, user: { id, name, email, role } }
 */
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, role, ngoProfile } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(409).json({ message: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      ngoProfile: role === 'ngo' && ngoProfile ? {
        organizationName: ngoProfile.organizationName,
        contactPerson: ngoProfile.contactPerson,
        phone: ngoProfile.phone,
        location: ngoProfile.location,
        areasOfWork: Array.isArray(ngoProfile.areasOfWork) ? ngoProfile.areasOfWork : [],
        availability: ngoProfile.availability,
        resources: ngoProfile.resources,
        registrationId: ngoProfile.registrationId
      } : undefined
    });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        ngoProfile: user.ngoProfile
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @body    { email: String, password: String }
 * @returns { token: String, user: { id, name, email, role } }
 */
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @route   GET /api/auth/profile
 * @desc    Get logged-in user profile
 * @header  Authorization: Bearer <token>
 * @returns { user: { id, name, email, role } }
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
