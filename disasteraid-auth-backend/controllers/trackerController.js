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
        isSOS: !!ticket.isSOS,
        createdAt: ticket.createdAt,
        name: ticket.name || null,
        phone: ticket.phone || null,
        address: ticket.address || null,
        landmark: ticket.landmark || null,
        adults: ticket.adults || 0,
        children: ticket.children || 0,
        elderly: ticket.elderly || 0,
        totalBeneficiaries: ticket.totalBeneficiaries || ((ticket.adults || 0) + (ticket.children || 0) + (ticket.elderly || 0)),
        priorityScore: ticket.priorityScore || 0,
        triageLevel: ticket.triageLevel || null,
        batteryLevel: ticket.batteryLevel != null ? ticket.batteryLevel : null,
        networkStrength: ticket.networkStrength != null ? ticket.networkStrength : null,
        description: ticket.description || null,
        filesCount: (ticket.files && ticket.files.length) ? ticket.files.length : 0,
        locationGeo: ticket.locationGeo || null,
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
    const allowed = ['triaged', 'in_progress', 'fulfilled', 'closed', 'dispatched', 'completed', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const ticket = await Ticket.findOne({ ticketId }).populate('assignedTo');
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    ticket.status = status;
    ticket.assignmentHistory = ticket.assignmentHistory || [];
    ticket.assignmentHistory.push({
      ngo: ticket.assignedTo || null,
      assignedAt: new Date(),
      note: note || `Status updated to ${status}`
    });
    await ticket.save();

    // Send webhook notification to assigned NGO about status update
    if (ticket.assignedTo && ticket.assignedTo._id) {
      Realtime.emit('ngo:ticket:status:updated', {
        ngoId: ticket.assignedTo._id,
        ticketId: ticket._id,
        ticketNumber: ticket.ticketId,
        oldStatus: ticket.status,
        newStatus: status,
        note: note,
        timestamp: new Date()
      }, { ngoId: ticket.assignedTo._id });

      // If ticket is closed, emit specific event to remove from UI
      if (status === 'closed') {
        Realtime.emit('ngo:ticket:closed', {
          ngoId: ticket.assignedTo._id,
          ticketId: ticket._id,
          ticketNumber: ticket.ticketId,
          timestamp: new Date()
        }, { ngoId: ticket.assignedTo._id, broadcast: true });
      }
    }

    // Notify citizen of the status update
    (async () => {
      try {
        await Notify.ticketStatusUpdated(ticket, status);
      Realtime.emit(`ticket:update:${ticket.ticketId}`, { type: 'status', status }, { ticketId: ticket.ticketId });
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

// Public endpoint: Get all active SOS requests (no auth required)
exports.getPublicSOSRequests = async (req, res) => {
  try {
    const tickets = await Ticket.find({ 
      isSOS: true, 
      status: { $in: ['active', 'matched', 'in_progress'] } 
    })
      .populate('assignedTo', 'organizationName')
      .select('ticketId helpTypes address landmark status createdAt totalBeneficiaries triageLevel priorityScore assignedTo channel isAnonymous')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json({
      success: true,
      count: tickets.length,
      tickets: tickets.map(t => ({
        ticketId: t.ticketId,
        helpTypes: t.helpTypes,
        address: t.address,
        landmark: t.landmark,
        status: t.status,
        createdAt: t.createdAt,
        totalBeneficiaries: t.totalBeneficiaries,
        triageLevel: t.triageLevel,
        priorityScore: t.priorityScore,
        channel: t.channel,
        isAnonymous: t.isAnonymous,
        assignedTo: t.assignedTo ? {
          organizationName: t.assignedTo.organizationName
        } : null
      }))
    });
  } catch (e) {
    console.error('getPublicSOSRequests error:', e);
    res.status(500).json({ success: false, message: 'Failed to fetch SOS requests' });
  }
};

