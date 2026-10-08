const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  createEV,
  listEVs,
  getEV,
  updateEV,
  deleteEV,
  updateBattery
} = require('../controllers/evController');

const router = express.Router();
router.use(authenticate);
router.post('/', createEV);
router.get('/', listEVs);
router.get('/:id', getEV);
router.put('/:id', updateEV);
router.delete('/:id', deleteEV);

const internalRouter = express.Router();
internalRouter.patch('/:id/battery', updateBattery);

module.exports = router;
module.exports.internalRouter = internalRouter;
