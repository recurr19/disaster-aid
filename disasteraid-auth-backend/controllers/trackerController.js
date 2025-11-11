const Ticket = require('../models/Ticket');
const TicketAssignment = require('../models/TicketAssignment');
const RegisteredNGO = require('../models/RegisteredNGO');
const Notify = require('../utils/notify');
const Realtime = require('../utils/realtime');

// Get full status by ticketId
exports.getStatus = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const ticket = await Ticket.findOne({ ticketId })
      .populate('assignedTo', 'organizationName phone location')
      .lean();
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    const assignments = await TicketAssignment.find({ ticket: ticket._id })
      .populate('ngo', 'organizationName phone location')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      ticket: {
        ticketId: ticket.ticketId,
        status: ticket.status,
        helpTypes: ticket.helpTypes,
        isSOS: ticket.isSOS,
        createdAt: ticket.createdAt,
        assignedTo: ticket.assignedTo ? {
          id: ticket.assignedTo._id,
          organizationName: ticket.assignedTo.organizationName,
          phone: ticket.assignedTo.phone,
          location: ticket.assignedTo.location
        } : null,
        assignmentHistory: (ticket.assignmentHistory || []).map(h => ({
          ngo: h.ngo,
          assignedAt: h.assignedAt,
          note: h.note
        }))
      },
      assignments: assignments.map(a => ({
        assignmentId: a._id,
        status: a.status,
        isSOS: a.isSOS,
        matchedHelpTypes: a.matchedHelpTypes,
        score: a.score,
        distanceKm: a.distanceKm,
        etaMinutes: a.etaMinutes,
        createdAt: a.createdAt,
        ngo: a.ngo ? {
          id: a.ngo._id,
          organizationName: a.ngo.organizationName,
          phone: a.ngo.phone,
          location: a.ngo.location
        } : null
      }))
    });
  } catch (e) {
    console.error('getStatus error:', e);
    res.status(500).json({ success: false, message: 'Failed to fetch status' });
  }
};

// NGO updates status/disposition of the ticket
exports.updateStatus = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status, note } = req.body;
    const allowed = ['dispatched', 'in_progress', 'completed', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const ticket = await Ticket.findOne({ ticketId });
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    ticket.status = status;
    ticket.assignmentHistory = ticket.assignmentHistory || [];
    ticket.assignmentHistory.push({
      ngo: ticket.assignedTo || null,
      assignedAt: new Date(),
      note: note || `Status updated to ${status}`
    });
    await ticket.save();

    // Notify citizen of the status update
    (async () => {
      try {
        await Notify.ticketStatusUpdated(ticket, status);
      Realtime.emit(`ticket:update:${ticket.ticketId}`, { type: 'status', status });
      } catch (e) {
        console.error('Notify ticketStatusUpdated failed:', e);
      }
    })();

    res.json({ success: true, ticketId, status });
  } catch (e) {
    console.error('updateStatus error:', e);
    res.status(500).json({ success: false, message: 'Failed to update status' });
  }
};


