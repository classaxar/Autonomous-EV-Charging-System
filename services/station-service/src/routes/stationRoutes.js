const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const {
  listStations,
  createStation,
  getStation,
  updateStation,
  deleteStation,
  getStationSlots
} = require('../controllers/stationController');

const router = express.Router();

router.get('/', listStations);
router.get('/:id', getStation);
router.get('/:id/slots', getStationSlots);

router.use(authenticate);
router.post('/', requireRole('STATION_ADMIN', 'SYSTEM_ADMIN'), createStation);
router.put('/:id', requireRole('STATION_ADMIN', 'SYSTEM_ADMIN'), updateStation);
router.delete('/:id', requireRole('STATION_ADMIN', 'SYSTEM_ADMIN'), deleteStation);

module.exports = router;
