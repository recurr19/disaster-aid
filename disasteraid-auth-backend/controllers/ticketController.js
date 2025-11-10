const fs = require('fs');
const Ticket = require("../models/Ticket");
const RegisteredNGO = require("../models/RegisteredNGO");
const generateTicketId = require("../utils/generateTicketId");
const { matchTicket } = require('../utils/matching');

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
    const parsedMedicalNeeds = data.medicalNeeds ? (Array.isArray(data.medicalNeeds) ? data.medicalNeeds : [data.medicalNeeds]) : [];

    const ticketPayload = {
      ...data,
      ticketId,
      files,
      helpTypes: parsedHelpTypes,
      medicalNeeds: parsedMedicalNeeds,
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
    }

    const ticket = new Ticket(ticketPayload);
    await ticket.save();

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
  res.status(200).json({
    success: true,
    message: "Matching logic not implemented yet.",
    ticketId: req.params.ticketId
  });
};

const assignBestNGO = async (req, res) => {
  res.status(200).json({
    success: true,
    message: "NGO assignment logic not implemented yet.",
    ticketId: req.params.ticketId
  });
};

module.exports = { submitHelpRequest, getTickets, getMatchesForTicket, assignBestNGO };
