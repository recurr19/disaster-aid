import React from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * Location picker with map
 */
const LocationPicker = ({ coords, onUseCurrentLocation, locating }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <MapPin className="h-5 w-5 text-green-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-800">Location</h3>
        </div>
        <button
          type="button"
          onClick={onUseCurrentLocation}
          disabled={locating}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <Navigation className="h-4 w-4" />
          <span>{locating ? 'Locating...' : 'Use Current Location'}</span>
        </button>
      </div>

      {coords.lat && coords.lng && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>Coordinates:</strong> {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
          </p>
        </div>
      )}

      {coords.lat && coords.lng && (
        <div className="h-64 rounded-lg overflow-hidden border border-gray-300">
          <MapContainer
            center={[coords.lat, coords.lng]}
            zoom={15}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <Marker position={[coords.lat, coords.lng]}>
              <Popup>Your Location</Popup>
            </Marker>
          </MapContainer>
        </div>
      )}

      {!coords.lat && !coords.lng && !locating && (
        <div className="p-8 bg-gray-50 rounded-lg text-center text-gray-500">
          <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p>Click "Use Current Location" to get your coordinates</p>
        </div>
      )}
    </div>
  );
};

export default LocationPicker;
