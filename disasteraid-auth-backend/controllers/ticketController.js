const Ticket = require("../models/Ticket");
const generateTicketId = require("../utils/generateTicketId");

const submitHelpRequest = async (req, res) => {
  try {
    const data = req.body;
    const ticketId = generateTicketId();

    const ticket = new Ticket({ ...data, ticketId });
    await ticket.save();

    res.status(201).json({
      message: "Request submitted successfully.",
      ticketId: ticketId,
      status: "active",
      createdAt: ticket.createdAt,
    });
  } catch (error) {
    console.error("Error submitting help request:", error);
    res.status(500).json({
      error: "Failed to submit help request. Please try again later.",
    });
  }
};

module.exports = { submitHelpRequest };
