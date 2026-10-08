const slotStatuses = new Map();
const queueLengths = new Map();

function slotKey(stationId, slotId) {
  return `${stationId}:${slotId}`;
}

async function getSlot(stationId, slotId) {
  return {
    slotId,
    status: slotStatuses.get(slotKey(stationId, slotId)) || 'FREE'
  };
}

async function updateSlot(stationId, slotId, status) {
  slotStatuses.set(slotKey(stationId, slotId), status);
}

async function updateQueue(stationId, delta) {
  const nextLength = Math.max(0, (queueLengths.get(stationId) || 0) + delta);
  queueLengths.set(stationId, nextLength);
}

module.exports = {
  getSlot,
  updateSlot,
  updateQueue
};
