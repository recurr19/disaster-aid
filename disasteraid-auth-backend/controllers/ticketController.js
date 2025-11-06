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

module.exports = { submitHelpRequest };
