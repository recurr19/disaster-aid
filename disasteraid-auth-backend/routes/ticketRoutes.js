const express = require("express");
const { submitHelpRequest } = require("../controllers/ticketController");
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// Handle multiple files with field name 'files[]'
router.post("/", upload.array('files[]', 10), submitHelpRequest);

module.exports = router;
