const User = require('../models/User');
const RegisteredNGO = require('../models/RegisteredNGO');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user (Citizen / NGO / Authority)
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

    // 1️⃣ Create Base User Account
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role
    });

    // 2️⃣ If NGO — Create NGO Profile (separate model)
    if (role === 'ngo' && ngoProfile) {
      const normalizedAreas = Array.isArray(ngoProfile.areasOfWork)
        ? ngoProfile.areasOfWork.map(h => String(h).toLowerCase().trim())
        : [];
      await RegisteredNGO.create({
        user: user._id,
        organizationName: ngoProfile.organizationName,
        contactPerson: ngoProfile.contactPerson,
        phone: ngoProfile.phone,
        location: ngoProfile.location,
        // optional geo coordinates: expected as [lng, lat]
        locationGeo: ngoProfile.coordinates && Array.isArray(ngoProfile.coordinates) && ngoProfile.coordinates.length === 2 ? {
          type: 'Point',
          coordinates: ngoProfile.coordinates
        } : undefined,
        areasOfWork: normalizedAreas,
        availability: ngoProfile.availability,
        resources: ngoProfile.resources,
        registrationId: ngoProfile.registrationId,

        // ✅ Added Capacity Fields
        foodCapacity: ngoProfile.foodCapacity || 0,
        medicalTeamCount: ngoProfile.medicalTeamCount || 0,
        vehiclesAvailable: ngoProfile.vehiclesAvailable || 0,
        coverageRadius: ngoProfile.coverageRadius || 5
      });
    }

    // 3️⃣ Generate Token
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
        role: user.role
      }
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Login user
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
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @route   GET /api/auth/profile
 * @desc    Get logged-in user profile
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    let ngoProfile = null;
    if (user.role === 'ngo') {
      ngoProfile = await RegisteredNGO.findOne({ user: user._id });
    }

    return res.json({ user, ngoProfile });

  } catch (err) {
    console.error("PROFILE ERROR:", err);
    res.status(500).json({ message: 'Server error' });
  }
};
