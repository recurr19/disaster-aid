const Ticket = require('../models/Ticket');
const TicketAssignment = require('../models/TicketAssignment');
const RegisteredNGO = require('../models/RegisteredNGO');
const Notify = require('../utils/notify');
const Realtime = require('../utils/realtime');

// List matches for logged-in NGO
exports.listMatches = async (req, res) => {
  try {
    const userId = req.user.id;
    const ngoProfile = await RegisteredNGO.findOne({ user: userId }).lean();
    if (!ngoProfile) return res.status(404).json({ success: false, message: 'NGO profile not found' });

    const { status = 'proposed' } = req.query;

    const assignments = await TicketAssignment.find({ ngo: ngoProfile._id, status })
      .populate('ticket', '-files.path')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      assignments: assignments.map(a => ({
        assignmentId: a._id,
        status: a.status,
        isSOS: a.isSOS,
        matchedHelpTypes: a.matchedHelpTypes,
        score: a.score,
        distanceKm: a.distanceKm,
        etaMinutes: a.etaMinutes,
        createdAt: a.createdAt,
        ticket: a.ticket ? {
          ticketId: a.ticket.ticketId,
          name: a.ticket.name,
          phone: a.ticket.phone,
          address: a.ticket.address,
          helpTypes: a.ticket.helpTypes,
          isSOS: a.ticket.isSOS,
          description: a.ticket.description,
          createdAt: a.ticket.createdAt
        } : null
      }))
    });
  } catch (e) {
    console.error('listMatches error:', e);
    res.status(500).json({ success: false, message: 'Failed to fetch matches' });
  }
};

// NGO accepts an assignment
exports.acceptAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const userId = req.user.id;
    const ngoProfile = await RegisteredNGO.findOne({ user: userId });
    if (!ngoProfile) return res.status(404).json({ success: false, message: 'NGO profile not found' });

    const assignment = await TicketAssignment.findById(assignmentId);
    if (!assignment || String(assignment.ngo) !== String(ngoProfile._id)) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    assignment.status = 'accepted';
    await assignment.save();

    const ticket = await Ticket.findById(assignment.ticket);
    ticket.assignedTo = assignment.ngo;
    ticket.assignedAt = new Date();
    ticket.status = 'matched';
    ticket.assignmentHistory = ticket.assignmentHistory || [];
    ticket.assignmentHistory.push({ ngo: assignment.ngo, assignedAt: new Date(), note: 'NGO accepted assignment' });
    await ticket.save();

    // Notify both parties
    (async () => {
      try {
        await Notify.ngoAccepted(ticket, assignment.ngo);
        Realtime.emit(`ticket:update:${ticket.ticketId}`, { type: 'accepted', ngoId: String(assignment.ngo), distanceKm: assignment.distanceKm, etaMinutes: assignment.etaMinutes });
        Realtime.emit('assignment:accepted', { ticketId: ticket.ticketId, ngoId: String(assignment.ngo), distanceKm: assignment.distanceKm, etaMinutes: assignment.etaMinutes });
      Realtime.emit('assignment:accepted', { ticketId: ticket.ticketId, ngoId: String(assignment.ngo), distanceKm: assignment.distanceKm ?? null, etaMinutes: assignment.etaMinutes ?? null });
      } catch (e) {
        console.error('Notify ngoAccepted failed:', e);
      }
    })();

    res.json({ success: true, ticketId: ticket.ticketId, assignmentId, status: 'accepted' });
  } catch (e) {
    console.error('acceptAssignment error:', e);
    res.status(500).json({ success: false, message: 'Failed to accept assignment' });
  }
};

// NGO rejects an assignment (forbidden for SOS)
exports.rejectAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const userId = req.user.id;
    const ngoProfile = await RegisteredNGO.findOne({ user: userId });
    if (!ngoProfile) return res.status(404).json({ success: false, message: 'NGO profile not found' });

    const assignment = await TicketAssignment.findById(assignmentId);
    if (!assignment || String(assignment.ngo) !== String(ngoProfile._id)) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    if (assignment.isSOS) {
      return res.status(403).json({ success: false, message: 'SOS requests cannot be rejected' });
    }

    assignment.status = 'rejected';
    await assignment.save();

    const ticket = await Ticket.findById(assignment.ticket);
    ticket.assignmentHistory = ticket.assignmentHistory || [];
    ticket.assignmentHistory.push({ ngo: assignment.ngo, assignedAt: new Date(), note: 'NGO rejected assignment' });
    await ticket.save();

    res.json({ success: true, ticketId: ticket.ticketId, assignmentId, status: 'rejected' });
  } catch (e) {
    console.error('rejectAssignment error:', e);
    res.status(500).json({ success: false, message: 'Failed to reject assignment' });
  }
};


