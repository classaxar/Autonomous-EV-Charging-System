import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default leaflet icon issues by using custom HTML markers
function createMarkerIcon(emoji, bgGradient, borderColor = '#38bdf8', size = 36) {
  return L.divIcon({
    className: 'custom-osm-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: ${bgGradient};
        border: 2px solid ${borderColor};
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${Math.round(size * 0.48)}px;
        box-shadow: 0 4px 14px rgba(0,0,0,0.45);
        cursor: pointer;
        transition: transform 0.2s ease;
      ">
        ${emoji}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
}

const originIcon = createMarkerIcon('🟢', 'linear-gradient(135deg, #10b981, #059669)', '#34d399', 36);
const destinationIcon = createMarkerIcon('🏁', 'linear-gradient(135deg, #f43f5e, #be123c)', '#fb7185', 36);
const recommendedIcon = createMarkerIcon('⚡', 'linear-gradient(135deg, #0ea5e9, #38bdf8)', '#38bdf8', 42);
const touristIcon = createMarkerIcon('🏛️', 'linear-gradient(135deg, #f59e0b, #d97706)', '#fbbf24', 38);
const candidateIcon = createMarkerIcon('🔋', 'linear-gradient(135deg, #475569, #334155)', '#94a3b8', 30);

export default function OpenStreetMapRoute({
  origin,
  destination,
  recommended,
  allStations = [],
  touristSpot = null,
  height = '420px',
  onSelectStation = null
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);

  // Initialize Map Once
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [23.5880, 72.3693], // Default Center: Gujarat corridor
        zoom: 9,
        scrollWheelZoom: true,
        attributionControl: true
      });

      // Official OpenStreetMap Standard Tiles (100% Free, Public, Zero API Key Required)
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
      }).addTo(map);

      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      // Clean up map when component unmounts
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers & Polyline whenever route data changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();
    const bounds = L.latLngBounds();

    // 1. Origin Marker
    if (origin && origin.latitude && origin.longitude) {
      const latlng = [origin.latitude, origin.longitude];
      bounds.extend(latlng);
      L.marker(latlng, { icon: originIcon })
        .bindPopup(`
          <div style="font-family: inherit; font-size: 13px; color: #0f172a;">
            <b style="color: #059669;">🟢 Departure / Origin</b><br/>
            ${origin.name || 'Current Location'}<br/>
            <small style="color: #64748b;">${origin.latitude.toFixed(4)}, ${origin.longitude.toFixed(4)}</small>
          </div>
        `)
        .addTo(layerGroup);
    }

    // 2. Destination Marker
    if (destination && destination.latitude && destination.longitude) {
      const latlng = [destination.latitude, destination.longitude];
      bounds.extend(latlng);
      L.marker(latlng, { icon: destinationIcon })
        .bindPopup(`
          <div style="font-family: inherit; font-size: 13px; color: #0f172a;">
            <b style="color: #be123c;">🏁 Destination</b><br/>
            ${destination.name || 'Target Destination'}<br/>
            <small style="color: #64748b;">${destination.latitude.toFixed(4)}, ${destination.longitude.toFixed(4)}</small>
          </div>
        `)
        .addTo(layerGroup);
    }

    // 3. Candidate Stations along corridor
    (allStations || []).forEach((st) => {
      if (!st.location) return;
      const isRec = recommended && recommended.stationId === st.stationId;
      if (isRec) return; // handled separately

      const latlng = [st.location.latitude, st.location.longitude];
      bounds.extend(latlng);
      const m = L.marker(latlng, { icon: candidateIcon }).addTo(layerGroup);
      m.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; color: #0f172a;">
          <b>⚡ ${st.name}</b><br/>
          Detour: <b>+${st.detourKm || 0} km</b><br/>
          Free Chargers: <b>${st.availableChargers || 0}</b> | ₹${st.pricePerKwh}/kWh<br/>
          ${st.touristSpot ? `<small style="color: #d97706;">🏛️ Near: ${st.touristSpot.name}</small>` : ''}
        </div>
      `);
      if (onSelectStation) {
        m.on('click', () => onSelectStation(st));
      }
    });

    // 4. Recommended Charging Stop (Highlighted with pulsing border)
    if (recommended && recommended.location) {
      const latlng = [recommended.location.latitude, recommended.location.longitude];
      bounds.extend(latlng);
      const recMarker = L.marker(latlng, { icon: recommendedIcon, zIndexOffset: 1000 }).addTo(layerGroup);
      recMarker.bindPopup(`
        <div style="font-family: inherit; font-size: 13px; color: #0f172a; min-width: 200px;">
          <div style="background: #38bdf8; color: #07111f; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 11px; display: inline-block; margin-bottom: 4px;">
            ⭐ AI RECOMMENDED CHARGER
          </div><br/>
          <b style="font-size: 14px; color: #0284c7;">⚡ ${recommended.name}</b><br/>
          Detour: <b>+${recommended.detourKm || 0} km</b> (${recommended.chargerPowerKw}kW DC Fast)<br/>
          Price: <b>₹${recommended.pricePerKwh}/kWh</b> | Queue: <b>${recommended.queueLength || 0}</b><br/>
          ${recommended.touristSpot ? `
            <div style="margin-top: 6px; padding: 6px; background: #fef3c7; border-left: 3px solid #f59e0b; border-radius: 4px;">
              <b style="color: #92400e;">🏛️ Tour While Charging:</b><br/>
              ${recommended.touristSpot.name}<br/>
              <small style="color: #78350f;">🚶 ${recommended.touristSpot.distanceFromStationKm} km walk (${recommended.touristSpot.recommendedTourMinutes}m tour)</small>
            </div>
          ` : ''}
        </div>
      `).openPopup();
    }

    // 5. Tourist Spot Marker (if present)
    const targetSpot = touristSpot || recommended?.touristSpot;
    if (targetSpot && targetSpot.location) {
      const latlng = [targetSpot.location.latitude, targetSpot.location.longitude];
      bounds.extend(latlng);
      L.marker(latlng, { icon: touristIcon, zIndexOffset: 900 })
        .bindPopup(`
          <div style="font-family: inherit; font-size: 13px; color: #0f172a; max-width: 220px;">
            <b style="color: #b45309;">🏛️ ${targetSpot.name}</b><br/>
            <small style="color: #475569;">${targetSpot.tagline || targetSpot.category}</small><br/>
            <div style="margin-top: 4px; font-size: 12px;">
              ⏱️ Recommended Tour: <b>${targetSpot.recommendedTourMinutes} mins</b><br/>
              ⭐ Rating: <b>${targetSpot.rating || 4.8}/5</b>
            </div>
          </div>
        `)
        .addTo(layerGroup);
    }

    // 6. Draw Route Polyline
    if (origin && destination) {
      let waypoints = [
        [origin.latitude, origin.longitude],
        ...(recommended && recommended.location ? [[recommended.location.latitude, recommended.location.longitude]] : []),
        [destination.latitude, destination.longitude]
      ];

      // Draw highway path
      L.polyline(waypoints, {
        color: '#0284c7',
        weight: 5,
        opacity: 0.85,
        dashArray: '8, 8',
        lineCap: 'round'
      }).addTo(layerGroup);

      // Walking detour line if tourist spot is nearby
      if (recommended && recommended.location && targetSpot && targetSpot.location) {
        L.polyline([
          [recommended.location.latitude, recommended.location.longitude],
          [targetSpot.location.latitude, targetSpot.location.longitude]
        ], {
          color: '#f59e0b',
          weight: 3,
          dashArray: '4, 6',
          opacity: 0.9
        }).addTo(layerGroup);
      }
    }

    // Fit map bounds with padding
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [45, 45], maxZoom: 12 });
    }
  }, [origin, destination, recommended, allStations, touristSpot]);

  return (
    <div style={{ position: 'relative', width: '100%', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color, #334155)', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
      {/* Map Canvas */}
      <div ref={mapContainerRef} style={{ width: '100%', height, background: '#1e293b' }} />

      {/* Floating Map Legend */}
      <div style={{
        position: 'absolute',
        bottom: '12px',
        left: '12px',
        zIndex: 500,
        background: 'rgba(15, 23, 42, 0.88)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '10px',
        padding: '8px 12px',
        fontSize: '11px',
        color: '#f8fafc',
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>🟢</span> <span>Origin</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>⚡</span> <span>Best Charger</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>🏛️</span> <span>Tourist Landmark</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>🏁</span> <span>Destination</span>
        </div>
      </div>
    </div>
  );
}
