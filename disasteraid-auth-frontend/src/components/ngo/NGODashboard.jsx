import { useEffect, useState, useContext } from "react";
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2 } from "lucide-react";
import NGOResourceForm from "./NGOResourceForm";
import MatchedCitizensList from "./MatchedCitizensList";
import ActiveRequestsTracker from "./ActiveRequestsTracker";
import GenerateDispatchersModal from "./GenerateDispatchersModal";
import DispatcherCredentialsModal from "../modals/DispatcherCredentialsModal";
import "./NGODashboard.css";
import { listNGOMatches, acceptAssignment, rejectAssignment } from "../../api/ngo";
import { updateTicketStatus } from "../../api/tracker";
import { connectRealtime } from "../../api/realtime";
import { assignTicketToDispatcher, generateDispatchers as generateDispatchersAPI, listDispatchers as listDispatchersAPI } from "../../api/dispatcher";
import { AuthContext } from '../../context/AuthContext';
import API from '../../api/axios';

export default function NGODashboard() {
  const [activeTab, setActiveTab] = useState("profile");
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const navigate = useNavigate();
  const { logout, user } = useContext(AuthContext);

  // Additional resources managed separately from profile
  const [resources, setResources] = useState([]);

  const [ngoProfile, setNgoProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({
    organizationName: '',
    contactPerson: '',
    phone: '',
    location: '',
    areasOfWork: [],
    availability: 'full-time',
    resources: '',
    registrationId: '',
    foodCapacity: 0,
    medicalTeamCount: 0,
    trucks: 0,
    boats: 0,
    ambulances: 0,
    coverageRadius: 5,
    manualAddress: ''
  });

  const [matchedCitizens, setMatchedCitizens] = useState([]);
  const [activeRequests, setActiveRequests] = useState([]);
  const [dispatchers, setDispatchers] = useState([]);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState(null);

  // Load NGO profile and matches
  useEffect(() => {
    async function load() {
      try {
        // Fetch NGO profile
        const profileRes = await API.get('/auth/profile');
        if (profileRes.data.ngoProfile) {
          setNgoProfile(profileRes.data.ngoProfile);
          setProfileForm({
            organizationName: profileRes.data.ngoProfile.organizationName || '',
            contactPerson: profileRes.data.ngoProfile.contactPerson || '',
            phone: profileRes.data.ngoProfile.phone || '',
            location: profileRes.data.ngoProfile.location || '',
            areasOfWork: profileRes.data.ngoProfile.areasOfWork || [],
            availability: profileRes.data.ngoProfile.availability || 'full-time',
            resources: profileRes.data.ngoProfile.resources || '',
            registrationId: profileRes.data.ngoProfile.registrationId || '',
            foodCapacity: profileRes.data.ngoProfile.foodCapacity || 0,
            medicalTeamCount: profileRes.data.ngoProfile.medicalTeamCount || 0,
            trucks: profileRes.data.ngoProfile.trucks || 0,
            boats: profileRes.data.ngoProfile.boats || 0,
            ambulances: profileRes.data.ngoProfile.ambulances || 0,
            coverageRadius: profileRes.data.ngoProfile.coverageRadius || 5,
            manualAddress: profileRes.data.ngoProfile.manualAddress || ''
          });
        }

        const proposed = await listNGOMatches('proposed');
        const accepted = await listNGOMatches('accepted');

        const citizens = (proposed.assignments || []).map(a => ({
          id: a.assignmentId,
          name: a.ticket?.name || 'Citizen',
          helpType: (a.ticket?.helpTypes || []).join(', '),
          urgency: a.isSOS ? 'SOS' : 'Normal',
          location: a.ticket?.address || a.ticket?.landmark || 'Unknown',
          peopleCount: (a.ticket?.adults || 0) + (a.ticket?.children || 0) + (a.ticket?.elderly || 0),
          ticketId: a.ticket?.ticketId
        }));
        setMatchedCitizens(citizens);

        const requests = (accepted.assignments || []).map(a => ({
          id: a.ticket?.ticketId,
          ticketObjectId: a.ticket?._id,
          citizenName: a.ticket?.name || 'Citizen',
          helpType: (a.ticket?.helpTypes || []).join(', '),
          location: a.ticket?.address || a.ticket?.landmark || 'Unknown',
          acceptedAt: new Date(a.createdAt).toLocaleString(),
          status: 'matched', // actual status comes from tracker; we will update as user changes
          isDispatched: a.ticket?.isDispatched || false,
          dispatchedTo: a.ticket?.dispatchedTo
        }));
        setActiveRequests(requests);

        // Fetch dispatchers
        try {
          const dispatcherRes = await listDispatchersAPI();
          console.log('Dispatchers loaded:', dispatcherRes);
          setDispatchers(dispatcherRes.dispatchers || []);
        } catch (dispErr) {
          console.error('Failed to load dispatchers:', dispErr);
          setDispatchers([]);
        }
      } catch (e) {
        console.error('Failed to load NGO data', e);
      }
    }
    load();
  }, []);

  // Realtime refresh for NGO matches/accepted
  useEffect(() => {
    const s = connectRealtime();
    const reload = async () => {
      try {
        const proposed = await listNGOMatches('proposed');
        const accepted = await listNGOMatches('accepted');
        const citizens = (proposed.assignments || []).map(a => ({
          id: a.assignmentId,
          name: a.ticket?.name || 'Citizen',
          helpType: (a.ticket?.helpTypes || []).join(', '),
          urgency: a.isSOS ? 'SOS' : 'Normal',
          location: a.ticket?.address || a.ticket?.landmark || 'Unknown',
          peopleCount: (a.ticket?.adults || 0) + (a.ticket?.children || 0) + (a.ticket?.elderly || 0),
          ticketId: a.ticket?.ticketId
        }));
        setMatchedCitizens(citizens);
        const requests = (accepted.assignments || []).map(a => ({
          id: a.ticket?.ticketId,
          citizenName: a.ticket?.name || 'Citizen',
          helpType: (a.ticket?.helpTypes || []).join(', '),
          location: a.ticket?.address || a.ticket?.landmark || 'Unknown',
          acceptedAt: new Date(a.createdAt).toLocaleString(),
          status: 'matched'
        }));
        setActiveRequests(requests);
      } catch {}
    };
    s.on('assignment:proposed', reload);
    s.on('assignment:accepted', reload);
    return () => {
      s.off('assignment:proposed', reload);
      s.off('assignment:accepted', reload);
    };
  }, []);

  const handleAcceptMatch = async (assignmentId) => {
    try {
      const res = await acceptAssignment(assignmentId);
      // Move from matchedCitizens to activeRequests
      const citizen = matchedCitizens.find((c) => c.id === assignmentId);
      if (citizen) {
        setActiveRequests([
          ...activeRequests,
          {
            id: res.ticketId,
            citizenName: citizen.name,
            helpType: citizen.helpType,
            location: citizen.location,
            acceptedAt: new Date().toLocaleString(),
            status: "matched",
          },
        ]);
      }
      setMatchedCitizens(matchedCitizens.filter((c) => c.id !== assignmentId));
    } catch (e) {
      console.error('Accept failed', e);
      alert('Failed to accept assignment');
    }
  };

  const handleRejectMatch = async (assignmentId) => {
    try {
      await rejectAssignment(assignmentId);
      setMatchedCitizens(matchedCitizens.filter((c) => c.id !== assignmentId));
    } catch (e) {
      console.error('Reject failed', e);
      alert(e?.response?.data?.message || 'Failed to reject assignment');
    }
  };

  const handleStatusUpdate = async (ticketId, newStatus) => {
    try {
      await updateTicketStatus(ticketId, newStatus);
      setActiveRequests(
        activeRequests.map((req) =>
          req.id === ticketId ? { ...req, status: newStatus } : req
        )
      );
    } catch (e) {
      console.error('Status update failed', e);
      alert('Failed to update status');
    }
  };

  const handleUpdateProfile = async () => {
    try {
      await API.put('/auth/profile', { ngoProfile: profileForm });
      setNgoProfile({ ...ngoProfile, ...profileForm });
      setEditingProfile(false);
      alert('Profile updated successfully!');
    } catch (e) {
      console.error('Profile update failed', e);
      alert('Failed to update profile');
    }
  };

  const handleAddResource = (resource) => {
    setResources([
      ...resources,
      { ...resource, id: Date.now().toString(), status: "active" },
    ]);
    setShowResourceForm(false);
  };

  const handleDeleteResource = (resourceId) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      setResources(resources.filter(r => r.id !== resourceId));
    }
  };

  const handleDispatchTicket = async (ticketObjectId, dispatcherId) => {
    if (!ticketObjectId || !dispatcherId) {
      alert('Invalid ticket or dispatcher');
      return;
    }

    try {
      await assignTicketToDispatcher(ticketObjectId, dispatcherId);
      alert('Ticket dispatched successfully!');
      // Reload data
      window.location.reload();
    } catch (err) {
      console.error('Dispatch failed:', err);
      alert(err.response?.data?.message || 'Failed to dispatch ticket');
    }
  };

  const handleGenerateDispatchers = async (count) => {
    try {
      const res = await generateDispatchersAPI(count);
      setDispatchers(res.dispatchers || []);
      
      // Show credentials modal
      if (res.dispatchers && res.dispatchers.length > 0) {
        setGeneratedCredentials(res.dispatchers);
      }
      
      return res;
    } catch (err) {
      console.error('Generate dispatchers failed:', err);
      throw new Error(err.response?.data?.message || 'Failed to generate dispatchers');
    }
  };

  const stats = {
    foodCapacity: ngoProfile?.foodCapacity || 0,
    medicalTeams: ngoProfile?.medicalTeamCount || 0,
    vehicles: ngoProfile?.vehiclesAvailable || 0,
    coverageRadius: ngoProfile?.coverageRadius || 5,
    pendingMatches: matchedCitizens.length,
    activeAssignments: activeRequests.length,
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="container-main ngo-root">

      {/* Header */}
      <div className="mb-8 ngo-header">
        <div>
          <h1>NGO Dashboard</h1>
          <p>Manage resources, match help requests, track missions.</p>
          {user?.name && <p style={{ fontSize: '0.9rem', color: '#666' }}>Logged in as: <strong>{user.name}</strong></p>}
        </div>
        <button onClick={handleLogout} className="button-secondary logout-button" aria-label="Logout from NGO dashboard">
          Logout
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="card">
          <p>Food Capacity</p>
          <p>{stats.foodCapacity} meals/day</p>
        </div>

        <div className="card">
          <p>Medical Teams</p>
          <p>{stats.medicalTeams}</p>
        </div>

        <div className="card">
          <p>Vehicles</p>
          <p>{stats.vehicles}</p>
        </div>

        <div className="card">
          <p>Coverage Radius</p>
          <p>{stats.coverageRadius} km</p>
        </div>

        <div className="card">
          <p>Pending Matches</p>
          <p>{stats.pendingMatches}</p>
        </div>

        <div className="card">
          <p>Active Assignments</p>
          <p>{stats.activeAssignments}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-row">
        {["profile", "resources", "dispatchers", "matches", "tracking"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`tab-button ${activeTab === tab ? 'active' : ''}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Profile */}
      {activeTab === "profile" && ngoProfile && (
        <div>
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Organization Profile</h3>
              <button 
                className="button-secondary" 
                onClick={() => setEditingProfile(!editingProfile)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Edit2 size={16} /> {editingProfile ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {!editingProfile ? (
              <div className="space-y-4">
                <div className="mb-4">
                  <h4 className="font-semibold text-lg mb-3 text-blue-700">📋 Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div><strong>Organization Name:</strong> {ngoProfile.organizationName}</div>
                    <div><strong>Contact Person:</strong> {ngoProfile.contactPerson}</div>
                    <div><strong>Phone Number:</strong> {ngoProfile.phone}</div>
                    <div><strong>Base Location:</strong> {ngoProfile.location}</div>
                    <div><strong>Registration ID:</strong> {ngoProfile.registrationId || 'Not registered'}</div>
                    <div><strong>Availability Status:</strong> <span className="capitalize">{ngoProfile.availability}</span></div>
                  </div>
                </div>

                <div className="mb-4 pt-4 border-t">
                  <h4 className="font-semibold text-lg mb-3 text-green-700">🎯 Areas of Work</h4>
                  <div className="flex flex-wrap gap-2">
                    {ngoProfile.areasOfWork?.length > 0 ? (
                      ngoProfile.areasOfWork.map((area, idx) => (
                        <span key={idx} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                          {area}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500">No areas specified</span>
                    )}
                  </div>
                </div>
                
                <div className="mb-4 pt-4 border-t">
                  <h4 className="font-semibold text-lg mb-3 text-purple-700">⚙️ Operational Capacity & Resources</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <div className="text-sm text-gray-600">Food Distribution Capacity</div>
                      <div className="text-2xl font-bold text-orange-600">{ngoProfile.foodCapacity}</div>
                      <div className="text-xs text-gray-500">meals per day</div>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg">
                      <div className="text-sm text-gray-600">Medical Teams Available</div>
                      <div className="text-2xl font-bold text-red-600">{ngoProfile.medicalTeamCount}</div>
                      <div className="text-xs text-gray-500">trained medical personnel teams</div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm text-gray-600">Vehicles Fleet</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {(ngoProfile.trucks || 0) + (ngoProfile.boats || 0) + (ngoProfile.ambulances || 0)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {ngoProfile.trucks || 0} trucks, {ngoProfile.boats || 0} boats, {ngoProfile.ambulances || 0} ambulances
                      </div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-sm text-gray-600">Service Coverage Radius</div>
                      <div className="text-2xl font-bold text-green-600">{ngoProfile.coverageRadius}</div>
                      <div className="text-xs text-gray-500">kilometers from base location</div>
                    </div>
                  </div>
                </div>

                <div className="mb-4 pt-4 border-t">
                  <h4 className="font-semibold text-lg mb-3 text-indigo-700">📦 Additional Resources & Equipment</h4>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-700">{ngoProfile.resources || 'No additional resources specified'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block mb-1 font-medium">Organization Name</label>
                  <input 
                    className="input-field w-full" 
                    value={profileForm.organizationName}
                    onChange={(e) => setProfileForm({...profileForm, organizationName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Contact Person</label>
                  <input 
                    className="input-field w-full" 
                    value={profileForm.contactPerson}
                    onChange={(e) => setProfileForm({...profileForm, contactPerson: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Phone</label>
                  <input 
                    className="input-field w-full" 
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Location</label>
                  <input 
                    className="input-field w-full" 
                    value={profileForm.location}
                    onChange={(e) => setProfileForm({...profileForm, location: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Food Capacity (meals/day)</label>
                  <input 
                    type="number"
                    className="input-field w-full" 
                    value={profileForm.foodCapacity}
                    onChange={(e) => setProfileForm({...profileForm, foodCapacity: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Medical Teams</label>
                  <input 
                    type="number"
                    className="input-field w-full" 
                    value={profileForm.medicalTeamCount}
                    onChange={(e) => setProfileForm({...profileForm, medicalTeamCount: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Vehicles Available</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                    <div>
                      <label className="block mb-1 text-sm text-gray-600">Trucks</label>
                      <input 
                        type="number"
                        className="input-field w-full" 
                        value={profileForm.trucks}
                        onChange={(e) => setProfileForm({...profileForm, trucks: parseInt(e.target.value) || 0})}
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm text-gray-600">Boats</label>
                      <input 
                        type="number"
                        className="input-field w-full" 
                        value={profileForm.boats}
                        onChange={(e) => setProfileForm({...profileForm, boats: parseInt(e.target.value) || 0})}
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm text-gray-600">Ambulances</label>
                      <input 
                        type="number"
                        className="input-field w-full" 
                        value={profileForm.ambulances}
                        onChange={(e) => setProfileForm({...profileForm, ambulances: parseInt(e.target.value) || 0})}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block mb-1 font-medium">Coverage Radius (km)</label>
                  <input 
                    type="number"
                    className="input-field w-full" 
                    value={profileForm.coverageRadius}
                    onChange={(e) => setProfileForm({...profileForm, coverageRadius: parseInt(e.target.value) || 5})}
                  />
                </div>
                <button className="button-primary w-full mt-4" onClick={handleUpdateProfile}>
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Resources Management */}
      {activeTab === "resources" && (
        <div>
          <div className="mb-4">
            <h3 className="text-xl font-bold mb-2">Resource Inventory</h3>
            <p className="text-gray-600 mb-4">Manage additional resources, supplies, and equipment available for disaster relief operations.</p>
          </div>
          
          <button 
            className="button-primary" 
            style={{ display: "flex", gap: "8px", marginBottom: "1.5rem" }} 
            onClick={() => setShowResourceForm(!showResourceForm)}
          >
            <Plus size={18} /> Add New Resource
          </button>

          {showResourceForm && (
            <NGOResourceForm
              onSubmit={handleAddResource}
              onCancel={() => setShowResourceForm(false)}
            />
          )}

          {resources.length === 0 ? (
            <div className="card text-center py-8 text-gray-500">
              <p>No resources added yet. Click "Add New Resource" to start managing your inventory.</p>
            </div>
          ) : (
            <div className="list-grid">
              {resources.map((r) => (
                <div key={r.id} className="card relative">
                  <button 
                    onClick={() => handleDeleteResource(r.id)}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                    title="Delete resource"
                  >
                    ✕
                  </button>
                  <h3 className="text-lg font-semibold mb-2">{r.category}</h3>
                  <p className="text-gray-700 mb-2">{r.description}</p>
                  <div className="text-sm space-y-1">
                    <p><strong>Quantity:</strong> {r.quantity} units</p>
                    <p><strong>People Capacity:</strong> {r.peopleCapacity} people</p>
                    <p><strong>Location:</strong> {r.location}</p>
                    {r.additionalInfo && <p><strong>Notes:</strong> {r.additionalInfo}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Dispatchers Tab */}
      {activeTab === "dispatchers" && (
        <div>
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold">Dispatcher Management</h3>
              <div className="flex gap-2">
                {dispatchers.length === 0 && (
                  <button 
                    onClick={() => setShowGenerateModal(true)}
                    className="button-primary flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Generate Dispatchers
                  </button>
                )}
                <button 
                  onClick={() => window.location.reload()}
                  className="button-secondary text-sm"
                >
                  Refresh
                </button>
              </div>
            </div>
            
            {dispatchers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No dispatchers registered yet.</p>
                <p className="text-sm text-gray-500 mb-4">Click "Generate Dispatchers" to create dispatcher accounts.</p>
                <p className="text-xs text-gray-400">Note: Dispatchers can also be created during NGO registration.</p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Total Dispatchers: <strong>{dispatchers.length}</strong>
                </p>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Email</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Password</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Assigned Tickets</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {dispatchers.map((dispatcher) => (
                        <tr key={dispatcher._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-mono text-blue-600">{dispatcher.dispatcherId}</td>
                          <td className="px-4 py-3 text-sm">{dispatcher.name}</td>
                          <td className="px-4 py-3 text-sm font-mono">{dispatcher.email}</td>
                          <td className="px-4 py-3 text-sm">
                            <code className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                              {dispatcher.generatedPassword}
                            </code>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              dispatcher.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {dispatcher.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            {dispatcher.assignedTickets?.length || 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                  <h4 className="font-semibold text-blue-900 mb-2">📋 Important Instructions</h4>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Share these credentials securely with your dispatchers</li>
                    <li>Dispatchers can login using their email and password</li>
                    <li>They will see only tickets assigned to them</li>
                    <li>Dispatchers can upload delivery proof but cannot close tickets</li>
                    <li>Only NGO admins can close completed tickets</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Matches */}
      {activeTab === "matches" && (
        <MatchedCitizensList
          citizens={matchedCitizens}
          onAccept={handleAcceptMatch}
          onReject={handleRejectMatch}
        />
      )}

      {/* Tracking */}
      {activeTab === "tracking" && (
        <ActiveRequestsTracker
          requests={activeRequests}
          onStatusUpdate={handleStatusUpdate}
          onDispatch={handleDispatchTicket}
          dispatchers={dispatchers}
        />
      )}

      {/* Generate Dispatchers Modal */}
      {showGenerateModal && (
        <GenerateDispatchersModal
          onClose={() => setShowGenerateModal(false)}
          onGenerate={handleGenerateDispatchers}
        />
      )}

      {/* Dispatcher Credentials Modal */}
      {generatedCredentials && (
        <DispatcherCredentialsModal
          dispatchers={generatedCredentials}
          onClose={() => {
            setGeneratedCredentials(null);
            window.location.reload(); // Refresh to show new dispatchers
          }}
        />
      )}
    </div>
  );
}
