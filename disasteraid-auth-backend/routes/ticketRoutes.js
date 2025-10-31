const express = require("express");
const { submitHelpRequest } = require("../controllers/ticketController");

const router = express.Router();

router.post("/", submitHelpRequest);

module.exports = router;
