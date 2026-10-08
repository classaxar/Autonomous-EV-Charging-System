const express = require('express');
const { requireInternalKey } = require('../middleware/internal');
const { updateSlotStatus, updateQueue } = require('../controllers/stationController');

const router = express.Router();

router.use(requireInternalKey);
router.patch('/:id/slots/:slotId', updateSlotStatus);
router.patch('/:id/queue', updateQueue);

module.exports = router;
