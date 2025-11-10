const Ticket = require("../models/Ticket");
const generateTicketId = require("../utils/generateTicketId");

const submitHelpRequest = async (req, res) => {
  try {
    const data = req.body;
    const ticketId = generateTicketId();

    // Process files if they exist
    const files = req.files?.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      path: file.path,
      size: file.size
    })) || [];

    // Create ticket with files
    const ticket = new Ticket({
      ...data,
      ticketId,
      files,
      // Parse arrays that came as strings from FormData
      helpTypes: data.helpTypes ? 
        (Array.isArray(data.helpTypes) ? data.helpTypes : [data.helpTypes]) : [],
      medicalNeeds: data.medicalNeeds ? 
        (Array.isArray(data.medicalNeeds) ? data.medicalNeeds : [data.medicalNeeds]) : [],
    });

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
    // If files were uploaded but ticket save failed, try to clean up
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
    
    // Build query filter
    const filter = {};
    if (status) {
      filter.status = status;
    }

    // Fetch tickets from database, sorted by creation date (newest first)
    const tickets = await Ticket.find(filter)
      .sort({ createdAt: -1 })
      .select('-files.path') // Exclude file paths for security
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

module.exports = { submitHelpRequest, getTickets };
