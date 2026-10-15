const autocannon = require('autocannon');

const url = process.env.DECISION_URL || 'http://localhost:5005/api/decision/recommend';
const payload = JSON.stringify({
  vehicleId: 'EV101', currentBattery: 20, targetBattery: 80,
  batteryCapacity: 60, maxChargingPower: 50,
  location: { latitude: 23.21, longitude: 72.63 }
});

autocannon({
  url,
  connections: Number(process.env.CONNECTIONS || 200),
  duration: Number(process.env.DURATION || 30),
  headers: { 'content-type': 'application/json', authorization: process.env.AUTHORIZATION || '' },
  body: payload,
  method: 'POST'
}, (error, result) => {
  if (error) {
    console.error(error.message);
    process.exitCode = 1;
    return;
  }
  console.log(autocannon.printResult(result));
});
