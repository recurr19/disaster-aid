const fs = require('fs');
const Ticket = require("../models/Ticket");
const RegisteredNGO = require("../models/RegisteredNGO");
const TicketAssignment = require("../models/TicketAssignment");
const generateTicketId = require("../utils/generateTicketId");
const { matchTicket } = require('../utils/matching');
const Notify = require('../utils/notify');
const Realtime = require('../utils/realtime');

const submitHelpRequest = async (req, res) => {
  try {
    const data = req.body;
    const ticketId = generateTicketId();

    const files = req.files?.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      path: file.path,
      size: file.size
    })) || [];

    const parsedHelpTypes = data.helpTypes ? (Array.isArray(data.helpTypes) ? data.helpTypes : [data.helpTypes]) : [];
    const normalizedHelpTypes = parsedHelpTypes.map(h => String(h).toLowerCase().trim());
    const parsedMedicalNeeds = data.medicalNeeds ? (Array.isArray(data.medicalNeeds) ? data.medicalNeeds : [data.medicalNeeds]) : [];

    // Derive total beneficiaries
    const totalBeneficiaries = (parseInt(data.adults || 0) || 0) + (parseInt(data.children || 0) || 0) + (parseInt(data.elderly || 0) || 0);

    // Auto-triage / SoS detection rules
    const text = `${data.description || ''}`.toLowerCase();
    const sosKeywords = ['sos','urgent','life-threatening','trapped','injured','bleeding','no food','no water','stranded','stuck','collapsed','flooded','unconscious'];
    const hasSOSKeyword = sosKeywords.some(k => text.includes(k));
    const lowBattery = (parseInt(data.batteryLevel || 0) || 0) <= 20;
    const poorNetwork = (parseInt(data.networkStrength || 0) || 0) <= 20;
    const medicalCritical = normalizedHelpTypes.includes('medical');
    const derivedSOS = !!data.isSOS || hasSOSKeyword || medicalCritical || (lowBattery && poorNetwork);

    // Priority scoring (simple heuristic)
    let priorityScore = 0;
    priorityScore += derivedSOS ? 30 : 0;
    priorityScore += totalBeneficiaries >= 10 ? 10 : 0;
    priorityScore += lowBattery ? 5 : 0;
    priorityScore += poorNetwork ? 5 : 0;
    const triageLevel = priorityScore >= 30 ? 'critical' : priorityScore >= 20 ? 'high' : priorityScore >= 10 ? 'medium' : 'low';

    const ticketPayload = {
      ...data,
      ticketId,
      files,
      helpTypes: normalizedHelpTypes,
      medicalNeeds: parsedMedicalNeeds,
      isSOS: derivedSOS,
      totalBeneficiaries,
      priorityScore,
      triageLevel,
      createdBy: req.user?.id || undefined,
      isAnonymous: !req.user?.id
    };

    if (data.locationGeo && Array.isArray(data.locationGeo.coordinates) && data.locationGeo.coordinates.length === 2) {
      ticketPayload.locationGeo = {
        type: 'Point',
        coordinates: data.locationGeo.coordinates
      };
    } else if (data.coordinates && Array.isArray(data.coordinates) && data.coordinates.length === 2) {
      ticketPayload.locationGeo = {
        type: 'Point',
        coordinates: data.coordinates
      };
    } else if ((data.latitude != null && data.longitude != null) || (data.lat != null && data.lng != null)) {
      const lat = parseFloat(data.latitude ?? data.lat);
      const lng = parseFloat(data.longitude ?? data.lng);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        ticketPayload.locationGeo = {
          type: 'Point',
          coordinates: [lng, lat]
        };
      }
    }

    // Clustering: compute coarse clusterId by rounding coords to ~300m grid + helpTypes
    const coordsUsed = ticketPayload.locationGeo?.coordinates;
    if (coordsUsed && coordsUsed.length === 2) {
      const [lng, lat] = coordsUsed;
      const round = (n) => Math.round(n * 200) / 200; // ~0.005 deg ~ 550m at equator; 200 gives ~0.005 steps
      const latR = round(lat);
      const lngR = round(lng);
      const htKey = (normalizedHelpTypes || []).slice().sort().join(',');
      ticketPayload.clusterId = `${latR}_${lngR}_${htKey}`;
    }

    const ticket = new Ticket(ticketPayload);
    await ticket.save();

    // Try to find a near duplicate in last 2 hours and same clusterId
    if (ticket.clusterId) {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const dup = await Ticket.findOne({
        _id: { $ne: ticket._id },
        status: 'active',
        clusterId: ticket.clusterId,
        createdAt: { $gte: twoHoursAgo }
      }).sort({ createdAt: -1 }).lean();
      if (dup) {
        ticket.possibleDuplicateOf = dup.ticketId;
        await ticket.save();
      }
    }

    // Realtime: notify new ticket
    Realtime.emit('ticket:created', { ticketId: ticket.ticketId, isSOS: ticket.isSOS, helpTypes: ticket.helpTypes, location: ticket.locationGeo });

    // Fire-and-forget: trigger matching to create multiple proposed assignments
    (async () => {
      try {
        const matches = await matchTicket(ticket, { maxResults: 10 });
        const proposals = matches.slice(0, 10);

        for (const m of proposals) {
          try {
            await TicketAssignment.updateOne(
              { ticket: ticket._id, ngo: m.ngoId },
              {
                $setOnInsert: {
                  ticket: ticket._id,
                  ticketId: ticket.ticketId,
                  ngo: m.ngoId,
                  status: 'proposed',
                  isSOS: !!ticket.isSOS,
                  matchedHelpTypes: m.matches || [],
                  score: m.score || 0,
                  distanceKm: m.distanceKm ?? null,
                  etaMinutes: m.etaMinutes ?? null,
                }
              },
              { upsert: true }
            );
            // Realtime: notify NGO side about new proposal
            Realtime.emit('assignment:proposed', { ticketId: ticket.ticketId, ngoId: m.ngoId });
          } catch (e) {
            // ignore duplicates per unique index
          }
        }

        // Notify citizen that matches are being arranged
        await Notify.ticketMatched(ticket, proposals);
        // Realtime: broadcast ticket matched update
        Realtime.emit(`ticket:update:${ticket.ticketId}`, { type: 'matched', proposals: proposals.map(p => ({ ngoId: p.ngoId, etaMinutes: p.etaMinutes, score: p.score })) });
      } catch (e) {
        console.error('Matching error (non-blocking):', e);
      }
    })();

    res.status(201).json({
      message: "Request submitted successfully.",
      ticketId: ticketId,
      status: "active",
      createdAt: ticket.createdAt,
      files: files.map(f => ({
        name: f.originalname,
        type: f.mimetype
      }))
    });

    // Notify citizen submission received (non-blocking)
    (async () => {
      try {
        await Notify.ticketCreated(ticket);
        Realtime.emit(`ticket:update:${ticket.ticketId}`, { type: 'created' });
      } catch (e) {
        console.error('Notify ticketCreated failed:', e);
      }
    })();
  } catch (error) {
    console.error("Error submitting help request:", error);

    if (req.files) {
      req.files.forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (err) {
          console.error('Error cleaning up file:', err);
        }
      });
    }
    res.status(500).json({
      error: "Failed to submit help request. Please try again later.",
    });
  }
};

const getTickets = async (req, res) => {
  try {
    const { status } = req.query;

    const filter = {};
    if (status) {
      filter.status = status;
    }

    // Restrict citizens to only their created tickets
    if (req.user && req.user.role === 'citizen') {
      filter.createdBy = req.user.id;
    }

    const tickets = await Ticket.find(filter)
      .sort({ createdAt: -1 })
      .select('-files.path')
      .lean();

    res.status(200).json({
      success: true,
      count: tickets.length,
      tickets: tickets.map(ticket => ({
        id: ticket._id,
        ticketId: ticket.ticketId,
        name: ticket.name,
        phone: ticket.phone,
        address: ticket.address,
        landmark: ticket.landmark,
        adults: ticket.adults,
        children: ticket.children,
        elderly: ticket.elderly,
        helpTypes: ticket.helpTypes,
        medicalNeeds: ticket.medicalNeeds,
        description: ticket.description,
        isSOS: ticket.isSOS,
        status: ticket.status,
        createdAt: ticket.createdAt,
        batteryLevel: ticket.batteryLevel,
        networkStrength: ticket.networkStrength,
        filesCount: ticket.files?.length || 0,
        title: `${ticket.isSOS ? '🚨 SOS: ' : ''}${ticket.helpTypes?.join(', ') || 'Help Request'}`,
        summary: ticket.description?.substring(0, 100) || 'No description'
      }))
    });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch tickets. Please try again later.",
    });
  }
};

const getMatchesForTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const ticket = await Ticket.findOne({ ticketId });
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    const assignments = await TicketAssignment.find({ ticket: ticket._id })
      .populate('ngo', 'organizationName phone location')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      ticketId,
      count: assignments.length,
      assignments: assignments.map(a => ({
        assignmentId: a._id,
        status: a.status,
        isSOS: a.isSOS,
        matchedHelpTypes: a.matchedHelpTypes,
        score: a.score,
        distanceKm: a.distanceKm,
        etaMinutes: a.etaMinutes,
        ngo: a.ngo ? {
          id: a.ngo._id,
          organizationName: a.ngo.organizationName,
          phone: a.ngo.phone,
          location: a.ngo.location
        } : null,
        createdAt: a.createdAt
      }))
    });
  } catch (e) {
    console.error('getMatchesForTicket error:', e);
    res.status(500).json({ success: false, message: 'Failed to fetch matches' });
  }
};

const assignBestNGO = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const ticket = await Ticket.findOne({ ticketId });
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    // Find highest score proposed assignment
    const best = await TicketAssignment.findOne({ ticket: ticket._id, status: 'proposed' })
      .sort({ score: -1, createdAt: 1 });
    if (!best) return res.status(404).json({ success: false, message: 'No proposed assignments available' });

    best.status = 'accepted';
    await best.save();

    ticket.assignedTo = best.ngo;
    ticket.assignedAt = new Date();
    ticket.status = 'matched';
    ticket.assignmentHistory = ticket.assignmentHistory || [];
    ticket.assignmentHistory.push({ ngo: best.ngo, assignedAt: new Date(), note: 'Auto-assigned best NGO' });
    await ticket.save();

    // Notify both sides
    (async () => {
      try {
        await Notify.ngoAccepted(ticket, best.ngo);
      } catch (e) {
        console.error('Notify ngoAccepted failed:', e);
      }
    })();

    res.status(200).json({
      success: true,
      message: "Best NGO assigned",
      ticketId,
      assignmentId: best._id
    });
  } catch (e) {
    console.error('assignBestNGO error:', e);
    res.status(500).json({ success: false, message: 'Failed to assign NGO' });
  }
};

module.exports = { submitHelpRequest, getTickets, getMatchesForTicket, assignBestNGO };
