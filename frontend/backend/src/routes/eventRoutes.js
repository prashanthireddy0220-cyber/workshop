const express = require('express');
const router = express.Router();
const { getEventDetails, getEventStatus } = require('../controllers/eventController');

router.get('/', getEventDetails);
router.get('/status', getEventStatus);

module.exports = router;
