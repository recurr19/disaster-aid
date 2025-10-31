function generateTicketId() {
  return "DA-" + Date.now();
}

module.exports = generateTicketId;
