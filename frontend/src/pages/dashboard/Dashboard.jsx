import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getVehicles } from '../../api/evApi';
import { getStations } from '../../api/stationApi';

export default function Dashboard() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [vehiclesData, stationsData] = await Promise.all([
          getVehicles().catch(() => []),
          getStations().catch(() => [])
        ]);
        setVehicles(Array.isArray(vehiclesData) ? vehiclesData : []);
        setStations(Array.isArray(stationsData) ? stationsData : []);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  // Primary vehicle or fallback demo
  const primaryVehicle = vehicles[0] || {
    vehicleId: 'EV-101',
    brand: 'Tesla',
    model: 'Model 3 Performance',
    currentBattery: 24,
    batteryCapacity: 75,
    maxChargingPower: 150
  };

  // Nearest station or fallback demo
  const nearestStation = stations[0] || {
    stationId: 'ST-101',
    name: 'Gandhinagar Fast Charger Hub A',
    availableChargers: 6,
    totalChargers: 10,
    queueLength: 1,
    chargerPowerKw: 50,
    pricePerKwh: 12
  };

  const batteryColor =
    primaryVehicle.currentBattery <= 20
      ? 'var(--accent-red)'
      : primaryVehicle.currentBattery <= 50
      ? 'var(--accent-amber)'
      : 'var(--accent-green)';

  return (
    <div className="page-container">
      {/* Header section with Greeting and Main Action */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1.25rem'
      }}>
        <div>
          <span className="eyebrow">Fleet Command & Telemetry</span>
          <h1 style={{ fontSize: '2.2rem', marginTop: '0.25rem', color: 'var(--text-primary)' }}>
            Welcome back, {user?.name || 'Driver'} 👋
          </h1>
          <p className="muted" style={{ fontSize: '0.95rem', marginTop: '0.2rem' }}>
            Autonomous Electric Vehicle Routing & Intelligent Charging Infrastructure
          </p>
        </div>

        <Link
          to="/recommend"
          state={{ vehicleId: primaryVehicle.vehicleId, currentBattery: primaryVehicle.currentBattery }}
          className="btn-primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none',
            fontSize: '1rem',
            padding: '14px 24px',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(56, 189, 248, 0.25)'
          }}
        >
          <span>⚡</span>
          <span>Find Best Charger</span>
        </Link>
      </div>

      {/* Grid of Key Info Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2.5rem'
      }}>
        {/* Connected EV Telemetry Card */}
        <div className="surface" style={{ padding: '1.75rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '180px',
            height: '180px',
            background: 'radial-gradient(circle, rgba(73, 213, 255, 0.08) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <span className="eyebrow" style={{ letterSpacing: '0.08em' }}>Connected Vehicle</span>
            <Link to="/ev" style={{ fontSize: '0.82rem', color: 'var(--accent-cyan)', textDecoration: 'none', fontWeight: 600 }}>
              Manage EVs →
            </Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.35rem', color: 'var(--text-primary)' }}>
                {primaryVehicle.brand} {primaryVehicle.model}
              </h3>
              <span className="muted" style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>
                ID: {primaryVehicle.vehicleId || 'EV-DEMO'}
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '2.25rem', fontWeight: '700', color: batteryColor, lineHeight: 1 }}>
                {primaryVehicle.currentBattery}%
              </div>
              <span className="muted" style={{ fontSize: '0.72rem', textTransform: 'uppercase' }}>State of Charge</span>
            </div>
          </div>

          {/* Battery Bar with smooth glow */}
          <div style={{
            width: '100%',
            height: '12px',
            background: 'rgba(15, 23, 42, 0.6)',
            borderRadius: '999px',
            overflow: 'hidden',
            padding: '2px',
            border: '1px solid rgba(148, 163, 184, 0.1)',
            marginBottom: '1.25rem'
          }}>
            <div style={{
              width: `${Math.min(100, Math.max(5, primaryVehicle.currentBattery))}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${batteryColor}, #38bdf8)`,
              borderRadius: '999px',
              transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: `0 0 12px ${batteryColor}`
            }} />
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.75rem',
            background: 'rgba(7, 17, 31, 0.45)',
            padding: '0.9rem',
            borderRadius: '12px',
            border: '1px solid rgba(148, 163, 184, 0.08)'
          }}>
            <div>
              <div className="muted" style={{ fontSize: '0.72rem', textTransform: 'uppercase' }}>Capacity</div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginTop: '2px' }}>
                {primaryVehicle.batteryCapacity || 75} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>kWh</span>
              </div>
            </div>
            <div>
              <div className="muted" style={{ fontSize: '0.72rem', textTransform: 'uppercase' }}>Max Rate</div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--accent-cyan)', marginTop: '2px' }}>
                {primaryVehicle.maxChargingPower || 150} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>kW</span>
              </div>
            </div>
            <div>
              <div className="muted" style={{ fontSize: '0.72rem', textTransform: 'uppercase' }}>Estimated Range</div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginTop: '2px' }}>
                {~~(primaryVehicle.currentBattery * 3.8)} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>km</span>
              </div>
            </div>
          </div>
        </div>

        {/* Nearest Charging Station Card */}
        <div className="surface" style={{ padding: '1.75rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '180px',
            height: '180px',
            background: 'radial-gradient(circle, rgba(53, 211, 153, 0.08) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <span className="eyebrow" style={{ letterSpacing: '0.08em' }}>Recommended Station</span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: 'var(--accent-green)',
              background: 'rgba(53, 211, 153, 0.12)',
              border: '1px solid rgba(53, 211, 153, 0.3)',
              padding: '3px 10px',
              borderRadius: '999px'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-green)' }} />
              ONLINE & ACTIVE
            </span>
          </div>

          <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.35rem', color: 'var(--text-primary)' }}>
            {nearestStation.name}
          </h3>
          <p className="muted" style={{ fontSize: '0.8rem', margin: '0 0 1.25rem' }}>
            Fast DC corridor with dynamic queue optimization & automated slot locking.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', textAlign: 'center' }}>
            <div style={{
              background: 'rgba(7, 17, 31, 0.45)',
              padding: '0.9rem 0.5rem',
              borderRadius: '12px',
              border: '1px solid rgba(148, 163, 184, 0.08)'
            }}>
              <div style={{ color: 'var(--accent-green)', fontSize: '1.5rem', fontWeight: 700 }}>
                {nearestStation.availableChargers ?? 4}
              </div>
              <div className="muted" style={{ fontSize: '0.72rem', textTransform: 'uppercase', marginTop: '2px' }}>Available</div>
            </div>

            <div style={{
              background: 'rgba(7, 17, 31, 0.45)',
              padding: '0.9rem 0.5rem',
              borderRadius: '12px',
              border: '1px solid rgba(148, 163, 184, 0.08)'
            }}>
              <div style={{ color: 'var(--accent-amber)', fontSize: '1.5rem', fontWeight: 700 }}>
                {nearestStation.queueLength ?? 1}
              </div>
              <div className="muted" style={{ fontSize: '0.72rem', textTransform: 'uppercase', marginTop: '2px' }}>In Queue</div>
            </div>

            <div style={{
              background: 'rgba(7, 17, 31, 0.45)',
              padding: '0.9rem 0.5rem',
              borderRadius: '12px',
              border: '1px solid rgba(148, 163, 184, 0.08)'
            }}>
              <div style={{ color: 'var(--accent-cyan)', fontSize: '1.5rem', fontWeight: 700 }}>
                ₹{nearestStation.pricePerKwh ?? 12}
              </div>
              <div className="muted" style={{ fontSize: '0.72rem', textTransform: 'uppercase', marginTop: '2px' }}>Per kWh</div>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Hub Navigation Section */}
      <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div>
          <span className="eyebrow">Quick Navigation</span>
          <h2 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
            Autonomous Operations Suite
          </h2>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '1.25rem'
      }}>
        {/* Recommendation Tool */}
        <Link
          to="/recommend"
          style={{ textDecoration: 'none' }}
        >
          <div className="surface" style={{
            padding: '1.5rem',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'rgba(73, 213, 255, 0.12)',
                color: 'var(--accent-cyan)',
                display: 'grid',
                placeItems: 'center',
                fontSize: '1.4rem',
                marginBottom: '1rem'
              }}>
                🎯
              </div>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                Smart Route Recommendation
              </h3>
              <p className="muted" style={{ fontSize: '0.85rem', lineHeight: '1.45' }}>
                Multi-objective decision engine balancing distance, queue latency, charging speed, and pricing.
              </p>
            </div>
            <div style={{ marginTop: '1.25rem', color: 'var(--accent-cyan)', fontSize: '0.82rem', fontWeight: 600 }}>
              Launch Optimizer →
            </div>
          </div>
        </Link>

        {/* Slot Booking Tool */}
        <Link
          to="/booking"
          style={{ textDecoration: 'none' }}
        >
          <div className="surface" style={{
            padding: '1.5rem',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'rgba(59, 130, 246, 0.12)',
                color: 'var(--accent-blue)',
                display: 'grid',
                placeItems: 'center',
                fontSize: '1.4rem',
                marginBottom: '1rem'
              }}>
                📅
              </div>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                Slot Reservation & Locking
              </h3>
              <p className="muted" style={{ fontSize: '0.85rem', lineHeight: '1.45' }}>
                Secure instant 15-minute reservation windows with atomic hold to eliminate station wait times.
              </p>
            </div>
            <div style={{ marginTop: '1.25rem', color: 'var(--accent-cyan)', fontSize: '0.82rem', fontWeight: 600 }}>
              Book Charger →
            </div>
          </div>
        </Link>

        {/* Fleet Management */}
        <Link
          to="/ev"
          style={{ textDecoration: 'none' }}
        >
          <div className="surface" style={{
            padding: '1.5rem',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'rgba(53, 211, 153, 0.12)',
                color: 'var(--accent-green)',
                display: 'grid',
                placeItems: 'center',
                fontSize: '1.4rem',
                marginBottom: '1rem'
              }}>
                🚗
              </div>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                Vehicle Fleet Profiles
              </h3>
              <p className="muted" style={{ fontSize: '0.85rem', lineHeight: '1.45' }}>
                Register EVs, calibrate battery capacity curves, and track real-time telemetry updates.
              </p>
            </div>
            <div style={{ marginTop: '1.25rem', color: 'var(--accent-cyan)', fontSize: '0.82rem', fontWeight: 600 }}>
              Manage Vehicles →
            </div>
          </div>
        </Link>

        {/* History & Invoices */}
        <Link
          to="/history"
          style={{ textDecoration: 'none' }}
        >
          <div className="surface" style={{
            padding: '1.5rem',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'rgba(245, 184, 75, 0.12)',
                color: 'var(--accent-amber)',
                display: 'grid',
                placeItems: 'center',
                fontSize: '1.4rem',
                marginBottom: '1rem'
              }}>
                📊
              </div>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                History & Analytics
              </h3>
              <p className="muted" style={{ fontSize: '0.85rem', lineHeight: '1.45' }}>
                Review past charging sessions, energy consumed (kWh), and automated payment settlements.
              </p>
            </div>
            <div style={{ marginTop: '1.25rem', color: 'var(--accent-cyan)', fontSize: '0.82rem', fontWeight: 600 }}>
              View History →
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
