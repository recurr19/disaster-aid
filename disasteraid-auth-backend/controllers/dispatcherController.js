const User = require('../models/User');
const RegisteredNGO = require('../models/RegisteredNGO');
const Dispatcher = require('../models/Dispatcher');
const Ticket = require('../models/Ticket');
const bcrypt = require('bcryptjs');

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
 * Generate dispatcher email from NGO name
 */
function generateDispatcherEmail(ngoName, index) {
  // Clean NGO name: remove special chars, convert to lowercase, replace spaces with hyphens
  const cleanName = ngoName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 20); // Limit length
  
  return `${cleanName}-dispatcher${index}@disasteraid.org`;
}

/**
 * @route   POST /api/dispatcher/generate
 * @desc    Generate dispatchers for an NGO
 * @access  Protected (NGO only)
 */
exports.generateDispatchers = async (req, res) => {
  try {
    console.log('Generate dispatchers request:', req.body);
    
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'ngo') {
      console.log('Permission denied: user role is', user?.role);
      return res.status(403).json({ message: 'Only NGOs can generate dispatchers' });
    }

    const { count } = req.body;
    if (!count || count < 1 || count > 50) {
      console.log('Invalid count:', count);
      return res.status(400).json({ message: 'Dispatcher count must be between 1 and 50' });
    }

    const ngo = await RegisteredNGO.findOne({ user: user._id });
    if (!ngo) {
      console.log('NGO profile not found for user:', user._id);
      return res.status(404).json({ message: 'NGO profile not found. Please complete your NGO registration first.' });
    }

    console.log('Generating', count, 'dispatchers for NGO:', ngo.organizationName);

    // Delete existing dispatchers if regenerating
    if (ngo.dispatchers && ngo.dispatchers.length > 0) {
      const existingDispatchers = await Dispatcher.find({ ngo: ngo._id });
      const userIds = existingDispatchers.map(d => d.user);
      await User.deleteMany({ _id: { $in: userIds } });
      await Dispatcher.deleteMany({ ngo: ngo._id });
    }

    const createdDispatchers = [];
    const dispatcherIds = [];

    for (let i = 1; i <= count; i++) {
      const email = generateDispatcherEmail(ngo.organizationName, i);
      const plainPassword = generatePassword();
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      // Create User account
      const dispatcherUser = await User.create({
        name: `${ngo.organizationName} - Dispatcher ${i}`,
        email: email,
        password: hashedPassword,
        role: 'dispatcher',
        parentNGO: ngo._id
      });

      // Create Dispatcher profile
      const dispatcher = await Dispatcher.create({
        user: dispatcherUser._id,
        ngo: ngo._id,
        dispatcherId: `DISP-${ngo._id.toString().substring(0, 8).toUpperCase()}-${i.toString().padStart(3, '0')}`,
        name: dispatcherUser.name,
        email: email,
        generatedPassword: plainPassword, // Store plain password for NGO to share
        isActive: true
      });

      dispatcherIds.push(dispatcher._id);
      createdDispatchers.push({
        _id: dispatcher._id,
        dispatcherId: dispatcher.dispatcherId,
        name: dispatcher.name,
        email: dispatcher.email,
        password: plainPassword,
        generatedPassword: plainPassword,
        isActive: true,
        assignedTickets: []
      });
    }

    // Update NGO with dispatcher references
    ngo.dispatcherCount = count;
    ngo.dispatchers = dispatcherIds;
    await ngo.save();

    console.log('Successfully generated', createdDispatchers.length, 'dispatchers');

    // Send webhook notification for dispatcher generation
    const Realtime = require('../utils/realtime');
    Realtime.emit('ngo:dispatchers:generated', {
      ngoId: ngo._id,
      organizationName: ngo.organizationName,
      dispatcherCount: count,
      timestamp: new Date()
    }, { ngoId: ngo._id });
    
    res.json({
      message: `Successfully generated ${count} dispatchers`,
      dispatchers: createdDispatchers
    });

  } catch (err) {
    console.error('GENERATE DISPATCHERS ERROR:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ 
      message: 'Failed to generate dispatchers. Please try again.', 
      error: err.message 
    });
  }
};

/**
 * @route   GET /api/dispatcher/list
 * @desc    Get all dispatchers for an NGO
 * @access  Protected (NGO only)
 */
exports.listDispatchers = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'ngo') {
      return res.status(403).json({ message: 'Only NGOs can view dispatchers' });
    }

    const ngo = await RegisteredNGO.findOne({ user: user._id });
    if (!ngo) {
      return res.status(404).json({ message: 'NGO profile not found' });
    }

    const dispatchers = await Dispatcher.find({ ngo: ngo._id })
      .populate('user', 'name email')
      .populate({
        path: 'assignedTickets',
        select: 'ticketId name address landmark deliveryProof status',
      })
      .sort({ createdAt: 1 });

    res.json({ dispatchers });

  } catch (err) {
    console.error('LIST DISPATCHERS ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @route   POST /api/dispatcher/assign-ticket
 * @desc    Assign a ticket to a dispatcher
 * @access  Protected (NGO only)
 */
exports.assignTicketToDispatcher = async (req, res) => {
  try {
    console.log('Assign ticket request:', req.body);
    
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'ngo') {
      return res.status(403).json({ message: 'Only NGOs can assign dispatchers' });
    }

    const { ticketId, dispatcherId } = req.body;

    // Validate input
    if (!ticketId || !dispatcherId) {
      console.log('Missing ticketId or dispatcherId:', { ticketId, dispatcherId });
      return res.status(400).json({ message: 'Invalid ticket or dispatcher' });
    }

    // Find ticket by ticketId string (e.g., "DA-123") or MongoDB _id
    let ticket = await Ticket.findOne({ ticketId: ticketId });
    if (!ticket) {
      // Fallback: try finding by MongoDB ObjectId
      ticket = await Ticket.findById(ticketId);
    }
    if (!ticket) {
      console.log('Ticket not found:', ticketId);
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const dispatcher = await Dispatcher.findById(dispatcherId);
    if (!dispatcher) {
      console.log('Dispatcher not found:', dispatcherId);
      return res.status(404).json({ message: 'Dispatcher not found' });
    }

    // Verify dispatcher belongs to this NGO
    const ngo = await RegisteredNGO.findOne({ user: user._id });
    if (dispatcher.ngo.toString() !== ngo._id.toString()) {
      return res.status(403).json({ message: 'Dispatcher does not belong to your NGO' });
    }

    // Update ticket
    ticket.dispatchedTo = dispatcher._id;
    ticket.dispatchedAt = new Date();
    ticket.isDispatched = true;
    await ticket.save();

    // Add ticket to dispatcher's assigned list (use MongoDB ObjectId)
    const ticketObjectId = ticket._id.toString();
    const assignedTicketIds = dispatcher.assignedTickets.map(id => id.toString());
    
    if (!assignedTicketIds.includes(ticketObjectId)) {
      dispatcher.assignedTickets.push(ticket._id);
      await dispatcher.save();
    }

    console.log('Ticket assigned successfully:', ticket.ticketId, 'to dispatcher:', dispatcher.name);
    
    // Send webhook notification for dispatcher assignment (to NGO)
    const Realtime = require('../utils/realtime');
    Realtime.emit('ngo:ticket:dispatched:database', {
      ngoId: ngo._id,
      ticketId: ticket._id,
      ticketNumber: ticket.ticketId,
      dispatcherId: dispatcher._id,
      dispatcherName: dispatcher.name,
      timestamp: new Date()
    }, { ngoId: ngo._id, broadcast: true });
    
    // Send targeted event to dispatcher room for real-time UI update
    Realtime.emit('dispatcher:ticket:assigned', {
      dispatcherId: dispatcher._id,
      ticketId: ticket._id,
      ticketNumber: ticket.ticketId,
      assignedTicketsCount: dispatcher.assignedTickets.length,
      timestamp: new Date(),
      ticket: {
        _id: ticket._id,
        ticketId: ticket.ticketId,
        name: ticket.name,
        phone: ticket.phone,
        address: ticket.address,
        status: ticket.status,
        isSOS: ticket.isSOS,
        dispatchedAt: ticket.dispatchedAt
      }
    }, { ngoId: ngo._id, dispatcherId: dispatcher._id, broadcast: true }); // Emit to both NGO and dispatcher rooms
    
    res.json({ 
      message: 'Ticket assigned to dispatcher successfully', 
      ticket: {
        ticketId: ticket.ticketId,
        dispatchedTo: dispatcher.name,
        dispatchedAt: ticket.dispatchedAt
      }
    });

  } catch (err) {
    console.error('ASSIGN TICKET TO DISPATCHER ERROR:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ 
      message: 'Server error', 
      error: err.message 
    });
  }
};

/**
 * @route   GET /api/dispatcher/my-tickets
 * @desc    Get tickets assigned to logged-in dispatcher
 * @access  Protected (Dispatcher only)
 */
exports.getDispatcherTickets = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'dispatcher') {
      return res.status(403).json({ message: 'Only dispatchers can access this' });
    }

    const dispatcher = await Dispatcher.findOne({ user: user._id });
    if (!dispatcher) {
      return res.status(404).json({ message: 'Dispatcher profile not found' });
    }

    const tickets = await Ticket.find({ 
      dispatchedTo: dispatcher._id 
    })
    .populate('assignedTo', 'organizationName')
    .sort({ dispatchedAt: -1 });

    res.json({ tickets });

  } catch (err) {
    console.error('GET DISPATCHER TICKETS ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @route   POST /api/dispatcher/upload-proof/:ticketId
 * @desc    Upload delivery proof for a ticket
 * @access  Protected (Dispatcher only)
 */
exports.uploadDeliveryProof = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'dispatcher') {
      return res.status(403).json({ message: 'Only dispatchers can upload delivery proof' });
    }

    const { ticketId } = req.params;
    const ticket = await Ticket.findById(ticketId);
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const dispatcher = await Dispatcher.findOne({ user: user._id });
    if (ticket.dispatchedTo.toString() !== dispatcher._id.toString()) {
      return res.status(403).json({ message: 'You are not assigned to this ticket' });
    }

    // Handle file uploads (assuming multer middleware)
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const uploadedFiles = req.files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      path: file.path,
      size: file.size,
      uploadedAt: new Date(),
      uploadedBy: user._id
    }));

    ticket.deliveryProof = [...(ticket.deliveryProof || []), ...uploadedFiles];
    await ticket.save();

    res.json({ 
      message: 'Delivery proof uploaded successfully', 
      files: uploadedFiles 
    });

  } catch (err) {
    console.error('UPLOAD DELIVERY PROOF ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
