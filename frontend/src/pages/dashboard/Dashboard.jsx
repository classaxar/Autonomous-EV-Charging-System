import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';

export default function Dashboard() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        // Fetch user's registered EVs
        const evRes = await client.get('/api/ev').catch(() => ({ data: { data: [] } }));
        if (evRes.data && evRes.data.success) {
          setVehicles(evRes.data.data || []);
        }

        // Fetch stations for nearest station preview
        const stationRes = await client.get('/api/stations').catch(() => ({ data: { data: [] } }));
        if (stationRes.data && stationRes.data.success) {
          setStations(stationRes.data.data || []);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  // Primary vehicle or demo fallback
  const primaryVehicle = vehicles[0] || {
    vehicleId: 'EV101',
    brand: 'Tesla',
    model: 'Model 3',
    currentBattery: 24,
    batteryCapacity: 75,
    maxChargingPower: 150
  };

  // Nearest station or demo fallback
  const nearestStation = stations[0] || {
    stationId: 'ST101',
    name: 'Gandhinagar Fast Charger Hub A',
    availableChargers: 6,
    totalChargers: 10,
    queueLength: 1,
    chargerPowerKw: 50,
    pricePerKwh: 12
  };

  const batteryColor =
    primaryVehicle.currentBattery <= 20
      ? '#ef4444'
      : primaryVehicle.currentBattery <= 50
      ? '#f59e0b'
      : '#10b981';

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ color: '#f8fafc', margin: 0, fontSize: '1.875rem' }}>
            Welcome, {user?.name || 'Driver'} 👋
          </h1>
          <p style={{ color: '#94a3b8', margin: '0.35rem 0 0', fontSize: '0.95rem' }}>
            Autonomous Electric Vehicle Operations Control Panel
          </p>
        </div>

        {/* Primary CTA Button per A-06 */}
        <Link
          to="/recommend"
          state={{ vehicleId: primaryVehicle.vehicleId, currentBattery: primaryVehicle.currentBattery }}
          style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
            color: '#fff',
            textDecoration: 'none',
            padding: '0.85rem 1.75rem',
            borderRadius: '0.5rem',
            fontWeight: '600',
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 14px 0 rgba(2, 132, 199, 0.39)',
            transition: 'transform 0.15s ease'
          }}
        >
          ⚡ Find Best Charger
        </Link>
      </div>

      {/* Grid of Key Info Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* EV Battery State Card */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '0.75rem', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 'bold' }}>
              Connected Vehicle
            </span>
            <Link to="/ev" style={{ fontSize: '0.8rem', color: '#38bdf8', textDecoration: 'none' }}>
              Manage EVs →
            </Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.25rem' }}>
              {primaryVehicle.brand} {primaryVehicle.model}
            </h3>
            <span style={{ fontSize: '1.75rem', fontWeight: 'bold', color: batteryColor }}>
              {primaryVehicle.currentBattery}%
            </span>
          </div>

          {/* Progress Bar */}
          <div style={{ width: '100%', height: '10px', background: '#0f172a', borderRadius: '9999px', overflow: 'hidden', marginBottom: '1rem' }}>
            <div style={{ width: `${primaryVehicle.currentBattery}%`, height: '100%', background: batteryColor, transition: 'width 0.5s ease' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
            <div>Capacity: <strong>{primaryVehicle.batteryCapacity || 75} kWh</strong></div>
            <div>Max Power: <strong>{primaryVehicle.maxChargingPower || 150} kW</strong></div>
          </div>
        </div>

        {/* Nearest Charging Station Card */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '0.75rem', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 'bold' }}>
              Nearest Station
            </span>
            <span style={{ fontSize: '0.75rem', background: '#10b98120', color: '#10b981', padding: '0.2rem 0.5rem', borderRadius: '9999px', fontWeight: 'bold' }}>
              ONLINE
            </span>
          </div>

          <h3 style={{ margin: '0 0 0.5rem', color: '#f8fafc', fontSize: '1.15rem' }}>
            {nearestStation.name}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginTop: '1rem', textAlign: 'center' }}>
            <div style={{ background: '#0f172a', padding: '0.75rem 0.5rem', borderRadius: '0.5rem' }}>
              <div style={{ color: '#10b981', fontSize: '1.25rem', fontWeight: 'bold' }}>
                {nearestStation.availableChargers ?? 4}
              </div>
              <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Available</div>
            </div>

            <div style={{ background: '#0f172a', padding: '0.75rem 0.5rem', borderRadius: '0.5rem' }}>
              <div style={{ color: '#f59e0b', fontSize: '1.25rem', fontWeight: 'bold' }}>
                {nearestStation.queueLength ?? 1}
              </div>
              <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>In Queue</div>
            </div>

            <div style={{ background: '#0f172a', padding: '0.75rem 0.5rem', borderRadius: '0.5rem' }}>
              <div style={{ color: '#38bdf8', fontSize: '1.25rem', fontWeight: 'bold' }}>
                ₹{nearestStation.pricePerKwh ?? 12}
              </div>
              <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Per kWh</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <h3 style={{ color: '#f8fafc', fontSize: '1.1rem', marginBottom: '1rem' }}>Operational Hub</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        <Link to="/recommend" style={{ textDecoration: 'none', background: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem', padding: '1.25rem', color: '#f8fafc', display: 'block', transition: 'border-color 0.15s' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🎯</div>
          <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Autonomous Recommendation</div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>AI-driven charging route optimization with battery boost scoring.</div>
        </Link>

        <Link to="/booking" style={{ textDecoration: 'none', background: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem', padding: '1.25rem', color: '#f8fafc', display: 'block', transition: 'border-color 0.15s' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📅</div>
          <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Slot Reservation</div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Lock charging slots and check real-time queue states.</div>
        </Link>

        <Link to="/history" style={{ textDecoration: 'none', background: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem', padding: '1.25rem', color: '#f8fafc', display: 'block', transition: 'border-color 0.15s' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📊</div>
          <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Charging History</div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Inspect previous charging sessions, kWh consumed, and invoices.</div>
        </Link>
      </div>
    </div>
  );
}
