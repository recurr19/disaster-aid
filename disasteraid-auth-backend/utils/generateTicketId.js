function generateTicketId() {
  const timestamp = Date.now();
  const randomPart = Math.floor(100000 + Math.random() * 900000); 
  return `DA-${timestamp}${randomPart}`;
}

module.exports = generateTicketId;
