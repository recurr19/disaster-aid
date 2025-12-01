const User = require('../models/User');
const RegisteredNGO = require('../models/RegisteredNGO');
const Dispatcher = require('../models/Dispatcher');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * Generate random password
 */
function generatePassword(length = 12) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

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

    // 2️⃣ Generate Token (before NGO profile creation)
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 3️⃣ If NGO — Create NGO Profile (separate model)
    let dispatcherCredentials = null;
    
    if (role === 'ngo' && ngoProfile) {
      console.log('Creating NGO profile for user:', user._id);
      console.log('NGO Profile data:', JSON.stringify(ngoProfile, null, 2));
      
      const normalizedAreas = Array.isArray(ngoProfile.areasOfWork)
        ? ngoProfile.areasOfWork.map(h => String(h).toLowerCase().trim())
        : [];
      
      try {
        const ngoData = {
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

          // ✅ Added Capacity Fields
          foodCapacity: ngoProfile.foodCapacity || 0,
          medicalTeamCount: ngoProfile.medicalTeamCount || 0,
          vehiclesAvailable: ngoProfile.vehiclesAvailable || 0,
          trucks: ngoProfile.trucks || 0,
          boats: ngoProfile.boats || 0,
          ambulances: ngoProfile.ambulances || 0,
          coverageRadius: ngoProfile.coverageRadius || 5,
          manualAddress: ngoProfile.manualAddress,
          dispatcherCount: ngoProfile.dispatcherCount || 0
        };

        // Only add registrationId if it's not empty
        if (ngoProfile.registrationId && ngoProfile.registrationId.trim() !== '') {
          ngoData.registrationId = ngoProfile.registrationId.trim();
        }

        const ngo = await RegisteredNGO.create(ngoData);
        
        console.log('NGO profile created successfully:', ngo._id);

        // Generate dispatchers if requested
        if (ngoProfile.dispatcherCount && ngoProfile.dispatcherCount > 0) {
          dispatcherCredentials = [];
          for (let i = 1; i <= ngoProfile.dispatcherCount; i++) {
            const cleanName = ngoProfile.organizationName
              .toLowerCase()
              .replace(/[^a-z0-9\s]/g, '')
              .replace(/\s+/g, '-')
              .substring(0, 20);
            
            const dispatcherEmail = `${cleanName}-dispatcher${i}@disasteraid.org`;
            const plainPassword = generatePassword();
            const hashedPassword = await bcrypt.hash(plainPassword, 10);

            const dispatcherUser = await User.create({
              name: `${ngoProfile.organizationName} - Dispatcher ${i}`,
              email: dispatcherEmail,
              password: hashedPassword,
              role: 'dispatcher',
              parentNGO: ngo._id
            });

            const dispatcher = await Dispatcher.create({
              user: dispatcherUser._id,
              ngo: ngo._id,
              dispatcherId: `DISP-${ngo._id.toString().substring(0, 8).toUpperCase()}-${i.toString().padStart(3, '0')}`,
              name: dispatcherUser.name,
              email: dispatcherEmail,
              generatedPassword: plainPassword,
              isActive: true
            });

            ngo.dispatchers.push(dispatcher._id);
            dispatcherCredentials.push({
              dispatcherId: dispatcher.dispatcherId,
              name: dispatcher.name,
              email: dispatcherEmail,
              password: plainPassword,
              generatedPassword: plainPassword,
              isActive: true,
              assignedTickets: []
            });
          }
          await ngo.save();
        }
      } catch (ngoError) {
        console.error('NGO PROFILE CREATION ERROR:', ngoError);
        console.error('Error details:', ngoError.message);
        console.error('Error stack:', ngoError.stack);
        // Delete the user account if NGO profile creation fails
        await User.findByIdAndDelete(user._id);
        return res.status(500).json({ 
          message: 'Failed to create NGO profile', 
          error: ngoError.message 
        });
      }
    }

    // 4️⃣ Send Response
    const response = {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };

    // Include dispatcher credentials if they were created
    if (dispatcherCredentials && dispatcherCredentials.length > 0) {
      response.dispatchers = dispatcherCredentials;
      response.message = `NGO registered successfully with ${dispatcherCredentials.length} dispatchers`;
    }

    res.status(201).json(response);

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

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile (including NGO profile)
 */
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { name, ngoProfile } = req.body;

    // Update user name if provided
    if (name) {
      user.name = name;
      await user.save();
    }

    // Update NGO profile if user is NGO and ngoProfile data provided
    if (user.role === 'ngo' && ngoProfile) {
      const existingNGO = await RegisteredNGO.findOne({ user: user._id });
      
      if (existingNGO) {
        // Normalize areasOfWork to lowercase strings
        if (Array.isArray(ngoProfile.areasOfWork)) {
          existingNGO.areasOfWork = ngoProfile.areasOfWork.map(h => String(h).toLowerCase().trim());
        }

        // Map coordinates or lat/lng to GeoJSON Point [lng, lat]
        if (Array.isArray(ngoProfile.coordinates) && ngoProfile.coordinates.length === 2) {
          existingNGO.locationGeo = { type: 'Point', coordinates: ngoProfile.coordinates };
        } else if (ngoProfile.lat != null && ngoProfile.lng != null) {
          const lat = parseFloat(ngoProfile.lat);
          const lng = parseFloat(ngoProfile.lng);
          if (Number.isFinite(lat) && Number.isFinite(lng)) {
            existingNGO.locationGeo = { type: 'Point', coordinates: [lng, lat] };
          }
        }

        // Ensure coverageRadius is a number if provided
        if (ngoProfile.coverageRadius != null) {
          const r = parseFloat(ngoProfile.coverageRadius);
          if (Number.isFinite(r)) existingNGO.coverageRadius = r;
        }

        // Copy other simple fields
        ['organizationName','contactPerson','phone','location','resources','availability','manualAddress','dispatcherCount','foodCapacity','medicalTeamCount','vehiclesAvailable','trucks','boats','ambulances','registrationId']
          .forEach(key => {
            if (ngoProfile[key] !== undefined) existingNGO[key] = ngoProfile[key];
          });
        await existingNGO.save();

        // Send webhook notification for profile update
        const Realtime = require('../utils/realtime');
        Realtime.emit('ngo:profile:updated', {
          ngoId: existingNGO._id,
          organizationName: existingNGO.organizationName,
          updatedFields: Object.keys(ngoProfile),
          timestamp: new Date()
        }, { ngoId: existingNGO._id });
      } else {
        // Create new NGO profile if it doesn't exist
        const normalizedAreas = Array.isArray(ngoProfile.areasOfWork)
          ? ngoProfile.areasOfWork.map(h => String(h).toLowerCase().trim())
          : [];
        const locGeo = Array.isArray(ngoProfile.coordinates) && ngoProfile.coordinates.length === 2
          ? { type: 'Point', coordinates: ngoProfile.coordinates }
          : (ngoProfile.lat != null && ngoProfile.lng != null
            ? { type: 'Point', coordinates: [parseFloat(ngoProfile.lng), parseFloat(ngoProfile.lat)] }
            : undefined);
        await RegisteredNGO.create({
          user: user._id,
          ...ngoProfile,
          areasOfWork: normalizedAreas,
          locationGeo: locGeo
        });
      }
    }

    // Return updated profile
    const updatedUser = await User.findById(req.user.id).select('-password');
    let updatedNgoProfile = null;
    if (user.role === 'ngo') {
      updatedNgoProfile = await RegisteredNGO.findOne({ user: user._id });
    }

    return res.json({ 
      message: 'Profile updated successfully',
      user: updatedUser, 
      ngoProfile: updatedNgoProfile 
    });

  } catch (err) {
    console.error("UPDATE PROFILE ERROR:", err);
    res.status(500).json({ message: 'Server error' });
  }
};
