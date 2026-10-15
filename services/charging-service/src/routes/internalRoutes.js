const express = require('express');
const { requireInternalKey } = require('../middleware/internal');
const { all } = require('../controllers/chargingController');
const router = express.Router();
router.use(requireInternalKey);
router.get('/all', all);
module.exports = router;
