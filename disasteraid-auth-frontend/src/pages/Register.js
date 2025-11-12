import { useState, useContext, useRef } from 'react';
import API from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Building2, User, MapPin, Truck, Activity, Settings } from 'lucide-react';
import DispatcherCredentialsModal from '../components/modals/DispatcherCredentialsModal';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './Register.css';
import { AnimatedBackground } from '../components/common/AnimatedBackground';
import { Logo } from '../components/common/Logo';

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Draggable marker component
const DraggableMarker = ({ position, setPosition }) => {
  const markerRef = useRef(null);

  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker != null) {
        const newPos = marker.getLatLng();
        setPosition([newPos.lng, newPos.lat]);
      }
    },
  };

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={[position[1], position[0]]}
      ref={markerRef}
    />
  );
};

// Map click handler component
const MapClickHandler = ({ setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lng, e.latlng.lat]);
    },
  });
  return null;
};

const Register = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [dispatcherCredentials, setDispatcherCredentials] = useState(null);
  const [form, setForm] = useState({
    name: '', // used for citizen
    email: '',
    password: '',
    role: 'citizen',
    // NGO/Volunteer specific fields (UI-only)
    organizationName: '',
    contactPerson: '',
    phone: '',
    location: '',
    areasOfWork: [],
    availability: 'full-time',
    resources: '',
    registrationId: '',
    // Capacity fields
    foodCapacity: 0,
    medicalTeamCount: 0,
    // Vehicles breakdown
    trucks: 0,
    boats: 0,
    ambulances: 0,
    coverageRadius: 5,
    // Geolocation
    coordinates: null,
    manualAddress: '',
    // Dispatchers
    dispatcherCount: 0
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleCheckboxArray = (e) => {
    const { value, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      areasOfWork: checked
        ? [...prev.areasOfWork, value]
        : prev.areasOfWork.filter((v) => v !== value)
    }));
  };
  // handleMultiSelectAreas unused; removed to avoid ESLint warning

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Map NGO fields to backend payload: now supports ngoProfile in backend
      const payload =
        form.role === 'ngo'
          ? {
              name: form.organizationName || form.contactPerson || 'NGO/Volunteer',
              email: form.email,
              password: form.password,
              role: form.role,
              ngoProfile: {
                organizationName: form.organizationName,
                contactPerson: form.contactPerson,
                phone: form.phone,
                location: form.location,
                areasOfWork: form.areasOfWork,
                availability: form.availability,
                resources: form.resources,
                registrationId: form.registrationId,
                foodCapacity: parseInt(form.foodCapacity) || 0,
                medicalTeamCount: parseInt(form.medicalTeamCount) || 0,
                vehiclesAvailable: (parseInt(form.trucks) || 0) + (parseInt(form.boats) || 0) + (parseInt(form.ambulances) || 0),
                trucks: parseInt(form.trucks) || 0,
                boats: parseInt(form.boats) || 0,
                ambulances: parseInt(form.ambulances) || 0,
                coverageRadius: parseInt(form.coverageRadius) || 5,
                coordinates: form.coordinates,
                manualAddress: form.manualAddress,
                dispatcherCount: parseInt(form.dispatcherCount) || 0
              }
            }
          : {
              name: form.name,
              email: form.email,
              password: form.password,
              role: form.role
            };

      const res = await API.post('/auth/register', payload);
      login(res.data.user, res.data.token);
      
      // If dispatchers were created, show credentials modal
      if (res.data.dispatchers && res.data.dispatchers.length > 0) {
        setDispatcherCredentials(res.data.dispatchers);
      } else {
        // Navigate directly if no dispatchers
        if (res.data.user.role === 'citizen') navigate('/dashboard/citizen');
        else if (res.data.user.role === 'ngo') navigate('/dashboard/ngo');
        else navigate('/dashboard/authority');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Registration failed');
    }
  };

  // Removed legacy canvas network effect in favor of AnimatedBackground

  return (
    <div className="relative min-h-screen flex flex-col">
  {/* Animated ambient background */
  }
  <AnimatedBackground variant="mesh" />
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 pt-10 pb-16">
        <div className="flex flex-col items-center mb-8 text-center">
          <Logo size={56} />
          <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-rose-600 via-red-600 to-orange-500 bg-clip-text text-transparent drop-shadow-sm">
            Create Your Account
          </h1>
          <p className="mt-3 max-w-2xl text-sm sm:text-base text-gray-600">
            Join the unified disaster response network. Select your role and provide the required details. NGO registration supports operational capacity & dispatcher provisioning.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 shadow-xl rounded-2xl p-6 sm:p-10 border border-white/60 space-y-8">
          {/* Role Selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Account Type</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'citizen', label: 'Citizen' },
                { value: 'ngo', label: 'NGO / Volunteer' },
                { value: 'authority', label: 'Authority' }
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm({ ...form, role: opt.value })}
                  className={`group relative px-4 py-3 rounded-xl border text-sm font-medium flex flex-col items-center justify-center transition ${
                    form.role === opt.value
                      ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-inner'
                      : 'border-gray-200 hover:border-rose-300 hover:bg-rose-50/40'
                  }`}
                >
                  <span>{opt.label}</span>
                  {form.role === opt.value && (
                    <span className="absolute -top-2 -right-2 w-6 h-6 bg-rose-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

        {form.role === 'citizen' && (
          <>
            <input
              name="name"
              placeholder="Full Name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full mt-4 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
            <input
              name="email"
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full mt-3 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
            <input
              name="password"
              placeholder="Password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full mt-3 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
          </>
        )}

        {form.role === 'ngo' && (
          <>
            {/* Organization Details Section */}
            <div style={{ marginBottom: '2rem' }} className="mt-2">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Building2 className="w-5 h-5 text-gray-700" />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>Organization Details</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                    Organization Name <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    name="organizationName"
                    placeholder="e.g., Red Cross Society"
                    value={form.organizationName}
                    onChange={handleChange}
                    required
                    style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #D1D5DB', borderRadius: '0.5rem', fontSize: '1rem' }}
                    className="focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                    Contact Person <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    name="contactPerson"
                    placeholder="Primary contact name"
                    value={form.contactPerson}
                    onChange={handleChange}
                    required
                    style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #D1D5DB', borderRadius: '0.5rem', fontSize: '1rem' }}
                    className="focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                    Contact Phone
                  </label>
                  <input
                    name="phone"
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #D1D5DB', borderRadius: '0.5rem', fontSize: '1rem' }}
                    className="focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                    Base Location / City
                  </label>
                  <input
                    name="location"
                    placeholder="e.g., Mumbai, Maharashtra"
                    value={form.location}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #D1D5DB', borderRadius: '0.5rem', fontSize: '1rem' }}
                    className="focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Areas of Work Section */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Activity className="w-5 h-5 text-gray-700" />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>Areas of Work</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                {['Food', 'Shelter', 'Medical', 'Rescue', 'Logistics', 'Supplies'].map((area) => (
                  <label 
                    key={area} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem', 
                      padding: '0.75rem', 
                      border: '1px solid #D1D5DB', 
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      backgroundColor: form.areasOfWork.includes(area) ? '#FEF2F2' : 'white',
                      borderColor: form.areasOfWork.includes(area) ? '#DC2626' : '#D1D5DB'
                    }}
                  >
                    <input
                      type="checkbox"
                      value={area}
                      checked={form.areasOfWork.includes(area)}
                      onChange={handleCheckboxArray}
                      style={{ width: '1.25rem', height: '1.25rem', accentColor: '#DC2626' }}
                    />
                    <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{area}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Additional Information */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Settings className="w-5 h-5 text-gray-700" />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>Additional Information</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                    Availability
                  </label>
                  <select 
                    name="availability" 
                    value={form.availability} 
                    onChange={handleChange}
                    style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #D1D5DB', borderRadius: '0.5rem', fontSize: '1rem' }}
                    className="focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="on-call">On-call</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                    Government Registration ID
                  </label>
                  <input
                    name="registrationId"
                    placeholder="e.g., NGO/2024/12345"
                    value={form.registrationId}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #D1D5DB', borderRadius: '0.5rem', fontSize: '1rem' }}
                    className="focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Resources & Equipment Description
                </label>
                <textarea
                  name="resources"
                  placeholder="Describe your available resources (e.g., vehicles, medical supplies, volunteers, etc.)"
                  value={form.resources}
                  onChange={handleChange}
                  rows="3"
                  style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #D1D5DB', borderRadius: '0.5rem', fontSize: '1rem', resize: 'vertical' }}
                  className="focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Operational Capacity Section */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Truck className="w-5 h-5 text-gray-700" />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>Operational Capacity</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                    Food Distribution Capacity
                  </label>
                  <input
                    name="foodCapacity"
                    type="number"
                    placeholder="Meals per day (e.g., 500)"
                    value={form.foodCapacity}
                    onChange={handleChange}
                    min="0"
                    style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #D1D5DB', borderRadius: '0.5rem', fontSize: '1rem' }}
                    className="focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                    Medical Teams Available
                  </label>
                  <input
                    name="medicalTeamCount"
                    type="number"
                    placeholder="Number of teams (e.g., 3)"
                    value={form.medicalTeamCount}
                    onChange={handleChange}
                    min="0"
                    style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #D1D5DB', borderRadius: '0.5rem', fontSize: '1rem' }}
                    className="focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Vehicles Available
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.3rem' }}>Trucks</label>
                    <input
                      name="trucks"
                      type="number"
                      placeholder="0"
                      value={form.trucks}
                      onChange={handleChange}
                      min="0"
                      style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #D1D5DB', borderRadius: '0.5rem', fontSize: '1rem' }}
                      className="focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.3rem' }}>Boats</label>
                    <input
                      name="boats"
                      type="number"
                      placeholder="0"
                      value={form.boats}
                      onChange={handleChange}
                      min="0"
                      style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #D1D5DB', borderRadius: '0.5rem', fontSize: '1rem' }}
                      className="focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.3rem' }}>Ambulances</label>
                    <input
                      name="ambulances"
                      type="number"
                      placeholder="0"
                      value={form.ambulances}
                      onChange={handleChange}
                      min="0"
                      style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #D1D5DB', borderRadius: '0.5rem', fontSize: '1rem' }}
                      className="focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                    Service Coverage Radius (kilometers)
                  </label>
                  <input
                    name="coverageRadius"
                    type="number"
                    placeholder="e.g., 10"
                    value={form.coverageRadius}
                    onChange={handleChange}
                    min="1"
                    style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #D1D5DB', borderRadius: '0.5rem', fontSize: '1rem' }}
                    className="focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                    Number of Dispatchers
                  </label>
                  <input
                    name="dispatcherCount"
                    type="number"
                    placeholder="e.g., 5"
                    value={form.dispatcherCount}
                    onChange={handleChange}
                    min="0"
                    max="50"
                    style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #D1D5DB', borderRadius: '0.5rem', fontSize: '1rem' }}
                    className="focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <p style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.25rem' }}>
                    We'll generate login credentials for your dispatchers
                  </p>
                </div>
              </div>
            </div>

            {/* Headquarters Location Section */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <MapPin className="w-5 h-5 text-gray-700" />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>Headquarters Location</h3>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Manual Address Entry
                </label>
                <input
                  name="manualAddress"
                  type="text"
                  placeholder="Enter your headquarters address"
                  value={form.manualAddress}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #D1D5DB', borderRadius: '0.5rem', fontSize: '1rem' }}
                  className="focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>Or enter coordinates manually:</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Latitude</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g., 17.4460"
                    value={form.coordinates ? form.coordinates[1] : ''}
                    onChange={(e) => {
                      const lat = parseFloat(e.target.value);
                      if (!isNaN(lat)) {
                        setForm({
                          ...form,
                          coordinates: [form.coordinates?.[0] || 0, lat]
                        });
                      }
                    }}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Longitude</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g., 78.3492"
                    value={form.coordinates ? form.coordinates[0] : ''}
                    onChange={(e) => {
                      const lng = parseFloat(e.target.value);
                      if (!isNaN(lng)) {
                        setForm({
                          ...form,
                          coordinates: [lng, form.coordinates?.[1] || 0]
                        });
                      }
                    }}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
              </div>
            </div>
            
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.5rem' }}>Or use current location:</p>
                <button
                  type="button"
                  onClick={() => {
                    if ('geolocation' in navigator) {
                      navigator.geolocation.getCurrentPosition(
                        (position) => {
                          setForm({
                            ...form,
                            coordinates: [position.coords.longitude, position.coords.latitude]
                          });
                        },
                        (error) => {
                          alert('Unable to get location. Please enable location access.');
                        }
                      );
                    } else {
                      alert('Geolocation is not supported by your browser.');
                    }
                  }}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem 1rem', 
                    background: '#2563EB', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '0.5rem', 
                    cursor: 'pointer',
                    fontWeight: '500',
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                  className="hover:bg-blue-700 transition-colors"
                >
                  <MapPin className="w-5 h-5" />
                  <span>{form.coordinates ? '✓ Location Set' : 'Use Current Location'}</span>
                </button>
              </div>
            </div>
            
            {form.coordinates && form.coordinates[0] && form.coordinates[1] && (
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.5rem' }}>Interactive Map (Click or Drag Marker):</p>
                <div style={{ height: '350px', border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
                  <MapContainer
                    center={[form.coordinates[1], form.coordinates[0]]}
                    zoom={15}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <DraggableMarker 
                      position={form.coordinates} 
                      setPosition={(newPos) => setForm({ ...form, coordinates: newPos })}
                    />
                    <MapClickHandler 
                      setPosition={(newPos) => setForm({ ...form, coordinates: newPos })}
                    />
                  </MapContainer>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem', textAlign: 'center' }}>
                  📍 Lat: {form.coordinates[1].toFixed(6)}, Lng: {form.coordinates[0].toFixed(6)}
                </p>
              </div>
            )}

            {/* Account Section */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <User className="w-5 h-5 text-gray-700" />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>Account Credentials</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                    Official Email <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    name="email"
                    placeholder="organization@example.com"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #D1D5DB', borderRadius: '0.5rem', fontSize: '1rem' }}
                    className="focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                    Password <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    name="password"
                    placeholder="Create a strong password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #D1D5DB', borderRadius: '0.5rem', fontSize: '1rem' }}
                    className="focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {form.role === 'authority' && (
          <>
            <input
              name="name"
              placeholder="Department/Officer Name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full mt-4 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
            <input
              name="email"
              placeholder="Official Email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full mt-3 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
            <input
              name="password"
              placeholder="Password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full mt-3 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
          </>
        )}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 via-red-600 to-orange-500 text-white font-semibold shadow-lg shadow-rose-500/30 hover:shadow-rose-600/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-600 transition text-sm tracking-wide"
            >
              <span>Register</span>
            </button>
          </div>
        </form>
        <p className="mt-6 text-center text-xs text-gray-500">By registering you agree to our disaster response coordination guidelines.</p>
      </div>

      {/* Dispatcher Credentials Modal */}
      {dispatcherCredentials && (
        <DispatcherCredentialsModal
          dispatchers={dispatcherCredentials}
          onClose={() => {
            setDispatcherCredentials(null);
            navigate('/dashboard/ngo');
          }}
        />
      )}
    </div>
  );
};

export default Register;
