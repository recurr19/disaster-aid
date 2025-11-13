import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Clock, Truck } from 'lucide-react';

const DispatcherTrackingMap = ({ ticket, statusHistory }) => {
  console.log('DispatcherTrackingMap component rendered with:', { ticket, statusHistory });
  
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [dispatcherMarker, setDispatcherMarker] = useState(null);
  const [victimMarker, setVictimMarker] = useState(null);
  const [routePolyline, setRoutePolyline] = useState(null);
  const [dispatcherLocation, setDispatcherLocation] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [ngoMarker, setNgoMarker] = useState(null);

  // Mock dispatcher location updates starting from NGO headquarters
  useEffect(() => {
    if (!ticket) {
      console.log('No ticket data available');
      return;
    }
    
    console.log('DispatcherTrackingMap - Ticket data:', ticket);
    console.log('DispatcherTrackingMap - Status history:', statusHistory);

    // NGO headquarters location (mock - in real app, get from NGO profile)
    const ngoHeadquarters = {
      lat: 28.6139 + (Math.random() - 0.5) * 0.02, // Random NGO location near Delhi
      lng: 77.2090 + (Math.random() - 0.5) * 0.02,
      name: statusHistory?.ticket?.assignedTo?.organizationName || 'NGO Headquarters'
    };

    // Victim location - try multiple possible data structures
    const victimLocation = {
      lat: ticket.locationGeo?.coordinates?.[1] || 
           ticket.location?.lat || 
           ticket.lat || 
           28.6139 + (Math.random() - 0.5) * 0.01,
      lng: ticket.locationGeo?.coordinates?.[0] || 
           ticket.location?.lng || 
           ticket.lng || 
           77.2090 + (Math.random() - 0.5) * 0.01
    };
    
    console.log('Victim location:', victimLocation);
    console.log('NGO headquarters:', ngoHeadquarters);

    let currentStep = 0;
    const totalSteps = 20; // Number of steps to reach victim

    // Simulate dispatcher location updates from NGO to victim
    const updateDispatcherLocation = () => {
      // Calculate progress from NGO headquarters to victim location
      const progress = Math.min(currentStep / totalSteps, 1);
      
      // Interpolate between NGO headquarters and victim location
      const currentLat = ngoHeadquarters.lat + (victimLocation.lat - ngoHeadquarters.lat) * progress;
      const currentLng = ngoHeadquarters.lng + (victimLocation.lng - ngoHeadquarters.lng) * progress;
      
      // Add some realistic movement variation
      const variation = 0.001;
      const lat = currentLat + (Math.random() - 0.5) * variation;
      const lng = currentLng + (Math.random() - 0.5) * variation;
      
      // Calculate heading towards victim
      const deltaLat = victimLocation.lat - lat;
      const deltaLng = victimLocation.lng - lng;
      const heading = Math.atan2(deltaLng, deltaLat) * (180 / Math.PI);
      
      setDispatcherLocation({
        lat,
        lng,
        timestamp: new Date(),
        speed: Math.floor(Math.random() * 20) + 30, // 30-50 km/h
        heading: heading + 90, // Adjust for icon orientation
        progress: progress * 100,
        ngoHeadquarters
      });

      // Calculate remaining distance and ETA
      const remainingDistance = Math.sqrt(
        Math.pow(victimLocation.lat - lat, 2) + Math.pow(victimLocation.lng - lng, 2)
      ) * 111; // Rough km conversion
      
      const eta = Math.max(1, Math.floor(remainingDistance * 60 / 40)); // Assuming 40 km/h average
      setEstimatedTime(eta);

      // Increment step for next update
      if (currentStep < totalSteps) {
        currentStep++;
      }
    };

    // Initial update
    updateDispatcherLocation();

    // Update every 5 seconds for smoother movement
    const interval = setInterval(updateDispatcherLocation, 5000);

    return () => clearInterval(interval);
  }, [ticket, statusHistory]);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapRef.current || map) return;

    // Initialize map
    const L = window.L;
    if (!L) {
      console.error('Leaflet not loaded! Make sure Leaflet CDN is included.');
      return;
    }
    
    console.log('Leaflet loaded successfully, creating map...');

    // Default center coordinates with fallbacks
    const centerLat = ticket.locationGeo?.coordinates?.[1] || 
                     ticket.location?.lat || 
                     ticket.lat || 
                     28.6139;
    const centerLng = ticket.locationGeo?.coordinates?.[0] || 
                     ticket.location?.lng || 
                     ticket.lng || 
                     77.2090;
    
    console.log('Initializing map at center:', centerLat, centerLng);
    
    const newMap = L.map(mapRef.current, {
      center: [centerLat, centerLng],
      zoom: 13,
      zoomControl: true
    });

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(newMap);

    setMap(newMap);

    return () => {
      if (newMap) {
        newMap.remove();
      }
    };
  }, [ticket]);

  // Add victim marker
  useEffect(() => {
    if (!map || !ticket) return;
    
    // Get victim coordinates with fallbacks
    const victimLat = ticket.locationGeo?.coordinates?.[1] || 
                     ticket.location?.lat || 
                     ticket.lat || 
                     28.6139 + (Math.random() - 0.5) * 0.01;
    const victimLng = ticket.locationGeo?.coordinates?.[0] || 
                     ticket.location?.lng || 
                     ticket.lng || 
                     77.2090 + (Math.random() - 0.5) * 0.01;
    
    console.log('Adding victim marker at:', victimLat, victimLng);

    const L = window.L;
    const victimIcon = L.divIcon({
      html: `<div class="flex items-center justify-center w-8 h-8 bg-red-500 rounded-full border-2 border-white shadow-lg">
               <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                 <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path>
               </svg>
             </div>`,
      className: 'victim-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const marker = L.marker([victimLat, victimLng], {
      icon: victimIcon
    }).addTo(map);

    marker.bindPopup(`
      <div class="p-2">
        <h4 class="font-bold text-red-800">🚨 Emergency Location</h4>
        <p class="text-sm text-gray-600">${ticket.name || 'Victim'}</p>
        <p class="text-xs text-gray-500">${ticket.address || 'Location'}</p>
      </div>
    `);

    setVictimMarker(marker);

    return () => {
      if (marker) {
        map.removeLayer(marker);
      }
    };
  }, [map, ticket]);

  // Add NGO headquarters marker
  useEffect(() => {
    if (!map || !dispatcherLocation?.ngoHeadquarters) return;

    const L = window.L;
    const ngoIcon = L.divIcon({
      html: `<div class="flex items-center justify-center w-10 h-10 bg-green-500 rounded-full border-2 border-white shadow-lg">
               <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                 <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"></path>
                 <path fill-rule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clip-rule="evenodd"></path>
               </svg>
             </div>`,
      className: 'ngo-marker',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    // Remove existing NGO marker
    if (ngoMarker) {
      map.removeLayer(ngoMarker);
    }

    const marker = L.marker([dispatcherLocation.ngoHeadquarters.lat, dispatcherLocation.ngoHeadquarters.lng], {
      icon: ngoIcon
    }).addTo(map);

    marker.bindPopup(`
      <div class="p-2">
        <h4 class="font-bold text-green-800">🏢 NGO Headquarters</h4>
        <p class="text-sm text-gray-600">${dispatcherLocation.ngoHeadquarters.name}</p>
        <p class="text-xs text-gray-500">Dispatcher starting point</p>
      </div>
    `);

    setNgoMarker(marker);

    return () => {
      if (marker) {
        map.removeLayer(marker);
      }
    };
  }, [map, dispatcherLocation?.ngoHeadquarters]);

  // Update dispatcher marker
  useEffect(() => {
    if (!map || !dispatcherLocation) return;

    const L = window.L;
    
    // Remove existing marker
    if (dispatcherMarker) {
      map.removeLayer(dispatcherMarker);
    }

    // Create dispatcher icon with rotation
    const dispatcherIcon = L.divIcon({
      html: `<div class="flex items-center justify-center w-10 h-10 bg-blue-500 rounded-full border-2 border-white shadow-lg transform rotate-${Math.floor(dispatcherLocation.heading / 45) * 45}">
               <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                 <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"></path>
                 <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1V8a1 1 0 00-1-1h-3z"></path>
               </svg>
             </div>`,
      className: 'dispatcher-marker',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    const marker = L.marker([dispatcherLocation.lat, dispatcherLocation.lng], {
      icon: dispatcherIcon
    }).addTo(map);

    marker.bindPopup(`
      <div class="p-2">
        <h4 class="font-bold text-blue-800">🚚 Dispatcher</h4>
        <p class="text-sm text-gray-600">${statusHistory?.ticket?.assignedTo?.organizationName || 'NGO Team'}</p>
        <p class="text-xs text-gray-500">Speed: ${dispatcherLocation.speed} km/h</p>
        <p class="text-xs text-gray-500">Updated: ${dispatcherLocation.timestamp.toLocaleTimeString()}</p>
      </div>
    `);

    setDispatcherMarker(marker);

    // Auto-fit bounds to show all markers
    const markers = [marker];
    if (victimMarker) markers.push(victimMarker);
    if (ngoMarker) markers.push(ngoMarker);
    
    if (markers.length > 1) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.1));
    }

  }, [map, dispatcherLocation, victimMarker, statusHistory]);

  // Draw route line
  useEffect(() => {
    if (!map || !dispatcherLocation || !victimMarker) return;

    const L = window.L;

    // Remove existing route
    if (routePolyline) {
      map.removeLayer(routePolyline);
    }

    // Get victim coordinates with fallbacks (same as in victim marker)
    const victimLat = ticket.locationGeo?.coordinates?.[1] || 
                     ticket.location?.lat || 
                     ticket.lat || 
                     28.6139;
    const victimLng = ticket.locationGeo?.coordinates?.[0] || 
                     ticket.location?.lng || 
                     ticket.lng || 
                     77.2090;

    // Draw simple line (in real app, use routing service)
    const route = L.polyline([
      [dispatcherLocation.lat, dispatcherLocation.lng],
      [victimLat, victimLng]
    ], {
      color: '#3B82F6',
      weight: 4,
      opacity: 0.7,
      dashArray: '10, 10'
    }).addTo(map);

    setRoutePolyline(route);

  }, [map, dispatcherLocation, victimMarker, ticket]);

  // Always show the map if we have ticket data, even without perfect conditions
  if (!ticket) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center border border-gray-200">
        <Truck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h4 className="font-bold text-gray-600 mb-2">Loading Tracking Data</h4>
        <p className="text-sm text-gray-500">Please wait while we load the tracking information</p>
      </div>
    );
  }

  // Show a message if no NGO is assigned but still show the map
  const ngoAssigned = statusHistory?.ticket?.assignedTo;
  const organizationName = ngoAssigned?.organizationName || statusHistory?.ticket?.assignedTo?.name || 'NGO Team';

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold">Live Dispatcher Tracking</h4>
              <p className="text-sm opacity-90">{organizationName}</p>
            </div>
          </div>
          {estimatedTime && (
            <div className="text-right">
              <div className="flex items-center gap-1 text-sm opacity-90">
                <Clock className="w-4 h-4" />
                ETA
              </div>
              <div className="text-xl font-bold">{estimatedTime} min</div>
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="relative">
        <div ref={mapRef} className="h-64 w-full" />
        
        {/* Live indicator */}
        <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 animate-pulse">
          <div className="w-2 h-2 bg-white rounded-full"></div>
          LIVE
        </div>

        {/* Dispatcher info overlay */}
        {dispatcherLocation && (
          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur rounded-lg p-3 border border-gray-200 shadow-lg">
            <div className="flex items-center gap-2 text-sm mb-2">
              <Truck className="w-4 h-4 text-blue-600" />
              <span className="font-medium">Speed: {dispatcherLocation.speed} km/h</span>
            </div>
            <div className="mb-2">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Progress</span>
                <span>{Math.round(dispatcherLocation.progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${dispatcherLocation.progress}%` }}
                ></div>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Last updated: {dispatcherLocation.timestamp.toLocaleTimeString()}
            </div>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="bg-gray-50 p-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="font-medium">Dispatcher en route</span>
          </div>
          <div className="text-gray-500">
            Track updates every 10 seconds
          </div>
        </div>
      </div>
    </div>
  );
};

export default DispatcherTrackingMap;
