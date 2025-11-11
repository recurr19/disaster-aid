const Ticket = require('../models/Ticket');
const TicketAssignment = require('../models/TicketAssignment');
const RegisteredNGO = require('../models/RegisteredNGO');
const Overlay = require('../models/Overlay');

// GET /api/authority/map
// Returns tickets with geo + assignee, and placeholder overlay layers
exports.getMapData = async (req, res) => {
  try {
    const tickets = await Ticket.find({
      'locationGeo.coordinates': { $type: 'array' }
    })
      .select('ticketId isSOS status helpTypes createdAt locationGeo assignedTo')
      .populate('assignedTo', 'organizationName phone location')
      .lean();

    const features = tickets.map(t => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: t.locationGeo.coordinates },
      properties: {
        ticketId: t.ticketId,
        status: t.status,
        isSOS: !!t.isSOS,
        helpTypes: t.helpTypes,
        createdAt: t.createdAt,
        assignedTo: t.assignedTo ? {
          id: String(t.assignedTo._id),
          organizationName: t.assignedTo.organizationName,
          phone: t.assignedTo.phone,
          location: t.assignedTo.location
        } : null
      }
    }));

    // Load overlays from DB
    const overlaysDocs = await Overlay.find().lean();
    const overlays = {
      shelters: overlaysDocs.filter(o => o.type === 'shelter'),
      medicalCamps: overlaysDocs.filter(o => o.type === 'medicalCamp'),
      depots: overlaysDocs.filter(o => o.type === 'depot'),
      blockedRoutes: overlaysDocs.filter(o => o.type === 'blockedRoute'),
      advisories: overlaysDocs.filter(o => o.type === 'advisory')
    };

    res.json({
      success: true,
      tickets: {
        type: 'FeatureCollection',
        features
      },
      overlays
    });
  } catch (e) {
    console.error('getMapData error:', e);
    res.status(500).json({ success: false, message: 'Failed to load map data' });
  }
};

// Overlays CRUD
exports.listOverlays = async (req, res) => {
  try {
    const items = await Overlay.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, items });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to list overlays' });
  }
};

exports.createOverlay = async (req, res) => {
  try {
    const { type, name, status, capacity, properties, geometry } = req.body;
    if (!type || !name || !geometry || !geometry.type || !geometry.coordinates) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const item = await Overlay.create({ type, name, status, capacity, properties: properties || {}, geometry });
    res.status(201).json({ success: true, item });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to create overlay' });
  }
};

exports.updateOverlay = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body || {};
    const item = await Overlay.findByIdAndUpdate(id, updates, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, item });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to update overlay' });
  }
};

exports.deleteOverlay = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Overlay.findByIdAndDelete(id);
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to delete overlay' });
  }
};


