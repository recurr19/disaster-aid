import { useEffect, useState, useContext } from "react";
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, User, Package, Truck, Bell, MapPin, Target, Settings, RefreshCw, Users, Mail, Key, Activity, FileText, Shield, CheckCircle, X, Eye } from "lucide-react";
import NGOResourceForm from "./NGOResourceForm";
import MatchedCitizensList from "./MatchedCitizensList";
import ActiveRequestsTracker from "./ActiveRequestsTracker";
import GenerateDispatchersModal from "./GenerateDispatchersModal";
import DispatcherCredentialsModal from "../modals/DispatcherCredentialsModal";
import { listNGOMatches, acceptAssignment, rejectAssignment } from "../../api/ngo";
import { updateTicketStatus } from "../../api/tracker";
import { connectRealtime } from "../../api/realtime";
import { assignTicketToDispatcher, generateDispatchers as generateDispatchersAPI, listDispatchers as listDispatchersAPI } from "../../api/dispatcher";
import { AuthContext } from '../../context/AuthContext';
import API from '../../api/axios';
import AppHeader from '../common/AppHeader';

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
  const [dispatchSuccess, setDispatchSuccess] = useState(null);
  const [showAssignedTicketsModal, setShowAssignedTicketsModal] = useState(false);
  const [reassignSelection, setReassignSelection] = useState({});
  const [reassigningTicketId, setReassigningTicketId] = useState(null);

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
          dispatchedTo: a.ticket?.dispatchedTo,
          deliveryProof: a.ticket?.deliveryProof,
          proofOfDelivery: a.ticket?.proofOfDelivery
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
          ticketObjectId: a.ticket?._id,
          citizenName: a.ticket?.name || 'Citizen',
          helpType: (a.ticket?.helpTypes || []).join(', '),
          location: a.ticket?.address || a.ticket?.landmark || 'Unknown',
          acceptedAt: new Date(a.createdAt).toLocaleString(),
          status: 'matched',
          isDispatched: a.ticket?.isDispatched || false,
          dispatchedTo: a.ticket?.dispatchedTo,
          deliveryProof: a.ticket?.deliveryProof,
          proofOfDelivery: a.ticket?.proofOfDelivery
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

  const handleStatusUpdate = async (ticketId, newStatus, note) => {
    try {
      await updateTicketStatus(ticketId, newStatus, note);
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
      console.error('Invalid ticket or dispatcher:', { ticketObjectId, dispatcherId });
      return;
    }

    try {
      console.log('Dispatching ticket:', ticketObjectId, 'to dispatcher:', dispatcherId);
      await assignTicketToDispatcher(ticketObjectId, dispatcherId);
      
      // Update the activeRequests state to reflect the dispatch
      setActiveRequests(prevRequests => 
        prevRequests.map(request => 
          (request.ticketObjectId === ticketObjectId || request.id === ticketObjectId)
            ? { 
                ...request, 
                isDispatched: true, 
                dispatchedTo: dispatchers.find(d => d._id === dispatcherId) 
              }
            : request
        )
      );
      
      // Show success notification
      const dispatcherName = dispatchers.find(d => d._id === dispatcherId)?.name || 'Dispatcher';
      setDispatchSuccess(`Ticket successfully assigned to ${dispatcherName}`);
      setTimeout(() => setDispatchSuccess(null), 5000); // Clear after 5 seconds
      
      console.log('Ticket dispatched successfully');
    } catch (err) {
      console.error('Dispatch failed:', err);
      // Show a more user-friendly error without alert
      const errorMessage = err.response?.data?.message || 'Failed to dispatch ticket';
      console.error('Dispatch error:', errorMessage);
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

  const handleOpenAssignedTickets = async () => {
    try {
      const dispatcherRes = await listDispatchersAPI();
      setDispatchers(dispatcherRes.dispatchers || []);
    } catch (err) {
      console.error('Failed to refresh dispatchers before opening assigned tickets:', err);
    } finally {
      setShowAssignedTicketsModal(true);
    }
  };

  const handleCloseAssignedTickets = () => {
    setShowAssignedTicketsModal(false);
  };

  const handleReassignDispatcher = async (ticketObjectId, dispatcherId) => {
    if (!ticketObjectId || !dispatcherId) {
      alert('Please select a dispatcher to reassign this ticket');
      return;
    }

    try {
      setReassigningTicketId(ticketObjectId);
      await assignTicketToDispatcher(ticketObjectId, dispatcherId);

      // Refresh dispatchers/tickets so modal reflects the new assignment
      const dispatcherRes = await listDispatchersAPI();
      setDispatchers(dispatcherRes.dispatchers || []);
      setReassignSelection((prev) => ({ ...prev, [ticketObjectId]: dispatcherId }));
    } catch (err) {
      console.error('Failed to reassign dispatcher from NGO dashboard:', err);
      alert(err?.response?.data?.message || 'Failed to reassign dispatcher');
    } finally {
      setReassigningTicketId(null);
    }
  };

  const assignedTicketsRaw = dispatchers.flatMap((dispatcher) =>
    (dispatcher.assignedTickets || []).map((t) => {
      const ticket = typeof t === 'object' && t !== null ? t : { id: t };
      const ticketId =
        ticket.ticketId || ticket.id || ticket._id || ticket.ticketObjectId;

      return {
        ticketId,
        ticketObjectId: ticket._id || ticket.ticketObjectId || ticketId,
        citizenName: ticket.citizenName || ticket.name,
        location: ticket.location || ticket.address || ticket.landmark,
        // Raw status/proof from dispatcher view; final status shown in modal
        // will come from activeRequests when available
        statusFromDispatcher: ticket.status || ticket.deliveryStatus,
        deliveryProof: ticket.deliveryProof,
        proofOfDelivery: ticket.proofOfDelivery,
        dispatcher,
      };
    })
  );

  const assignedTickets = assignedTicketsRaw
    .map((ticket) => {
      const trackerRequest = activeRequests.find((r) => r.id === ticket.ticketId);
      // Prefer latest status from ticket/dispatcher (DB), fall back to older tracker snapshot
      const status =
        ticket.statusFromDispatcher ||
        trackerRequest?.status ||
        'dispatched';
      return { ...ticket, status };
    })
    .filter((ticket) => ticket.status !== 'closed');

  const stats = {
    foodCapacity: ngoProfile?.foodCapacity || 0,
    medicalTeams: ngoProfile?.medicalTeamCount || 0,
    vehicles: ngoProfile?.vehiclesAvailable || 0,
    coverageRadius: ngoProfile?.coverageRadius || 5,
    pendingMatches: matchedCitizens.length,
    activeAssignments: activeRequests.length,
    assignedTickets: assignedTickets.length,
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">

      {/* Header */}
      <AppHeader
        title="NGO Dashboard"
        subtitle="Manage resources, matches, and missions"
        onLogout={handleLogout}
        rightSlot={user?.name ? (
          <div className="hidden sm:flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-xs font-semibold">
            <User className="w-3 h-3 mr-1" />
            {user.name}
          </div>
        ) : null}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="glass-card bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80 rounded-2xl p-5 border border-white/60 shadow-xl hover:shadow-2xl transition-all">
            <p className="text-blue-600 text-sm font-semibold mb-1">Food Capacity</p>
            <p className="text-2xl font-bold text-gray-900">{stats.foodCapacity}</p>
            <p className="text-xs text-gray-600 mt-1">meals/day</p>
          </div>

          <div className="glass-card bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80 rounded-2xl p-5 border border-white/60 shadow-xl hover:shadow-2xl transition-all">
            <p className="text-green-600 text-sm font-semibold mb-1">Medical Teams</p>
            <p className="text-2xl font-bold text-gray-900">{stats.medicalTeams}</p>
            <p className="text-xs text-gray-600 mt-1">available</p>
          </div>

          <div className="glass-card bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80 rounded-2xl p-5 border border-white/60 shadow-xl hover:shadow-2xl transition-all">
            <p className="text-purple-600 text-sm font-semibold mb-1">Vehicles</p>
            <p className="text-2xl font-bold text-gray-900">{stats.vehicles}</p>
            <p className="text-xs text-gray-600 mt-1">total fleet</p>
          </div>

          <div className="glass-card bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80 rounded-2xl p-5 border border-white/60 shadow-xl hover:shadow-2xl transition-all">
            <p className="text-orange-600 text-sm font-semibold mb-1">Coverage</p>
            <p className="text-2xl font-bold text-gray-900">{stats.coverageRadius}</p>
            <p className="text-xs text-gray-600 mt-1">km radius</p>
          </div>

          <div className="glass-card bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80 rounded-2xl p-5 border border-white/60 shadow-xl hover:shadow-2xl transition-all">
            <p className="text-yellow-600 text-sm font-semibold mb-1">Pending</p>
            <p className="text-2xl font-bold text-gray-900">{stats.pendingMatches}</p>
            <p className="text-xs text-gray-600 mt-1">matches</p>
          </div>

          <div className="glass-card bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80 rounded-2xl p-5 border border-white/60 shadow-xl hover:shadow-2xl transition-all">
            <p className="text-red-600 text-sm font-semibold mb-1">Active</p>
            <p className="text-2xl font-bold text-gray-900">{stats.activeAssignments}</p>
            <p className="text-xs text-gray-600 mt-1">missions</p>
          </div>

          <button
            type="button"
            onClick={handleOpenAssignedTickets}
            className="glass-card bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80 rounded-2xl p-5 border border-white/60 shadow-xl hover:shadow-2xl transition-all text-left"
          >
            <p className="text-indigo-600 text-sm font-semibold mb-1">Assigned Tickets</p>
            <p className="text-2xl font-bold text-gray-900">{stats.assignedTickets}</p>
            <p className="text-xs text-gray-600 mt-1">with field dispatchers</p>
          </button>
        </div>

        {/* Tabs */}
        <div className="glass-card bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80 rounded-2xl shadow-xl border border-white/60 overflow-hidden mb-6">
          <div className="flex overflow-x-auto">
            {[
              { key: "profile", label: "Profile", icon: User },
              { key: "resources", label: "Resources", icon: Package },
              { key: "dispatchers", label: "Dispatchers", icon: Truck },
              { key: "matches", label: "Matches", icon: Bell },
              { key: "tracking", label: "Tracking", icon: MapPin }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 px-6 py-4 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  activeTab === tab.key
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50/50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

      {/* Profile */}
      {activeTab === "profile" && ngoProfile && (
        <div className="glass-card bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80 rounded-2xl shadow-xl border border-white/60 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Organization Profile</h3>
            <button 
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl" 
              onClick={() => setEditingProfile(!editingProfile)}
            >
              <Edit2 size={16} /> {editingProfile ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {!editingProfile ? (
            <div className="space-y-6">
              <div className="glass-card bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/50 rounded-xl p-5 border border-gray-200">
                <h4 className="font-bold text-lg mb-4 text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" /> Basic Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/60 backdrop-blur p-3 rounded-lg">
                    <span className="text-sm text-gray-600">Organization Name</span>
                    <p className="font-semibold text-gray-900">{ngoProfile.organizationName}</p>
                  </div>
                  <div className="bg-white/60 backdrop-blur p-3 rounded-lg">
                    <span className="text-sm text-gray-600">Contact Person</span>
                    <p className="font-semibold text-gray-900">{ngoProfile.contactPerson}</p>
                  </div>
                  <div className="bg-white/60 backdrop-blur p-3 rounded-lg">
                    <span className="text-sm text-gray-600">Phone Number</span>
                    <p className="font-semibold text-gray-900">{ngoProfile.phone}</p>
                  </div>
                  <div className="bg-white/60 backdrop-blur p-3 rounded-lg">
                    <span className="text-sm text-gray-600">Base Location</span>
                    <p className="font-semibold text-gray-900">{ngoProfile.location}</p>
                  </div>
                  <div className="bg-white/60 backdrop-blur p-3 rounded-lg">
                    <span className="text-sm text-gray-600">Registration ID</span>
                    <p className="font-semibold text-gray-900">{ngoProfile.registrationId || 'Not registered'}</p>
                  </div>
                  <div className="bg-white/60 backdrop-blur p-3 rounded-lg">
                    <span className="text-sm text-gray-600">Availability</span>
                    <p className="font-semibold text-gray-900 capitalize">{ngoProfile.availability}</p>
                  </div>
                </div>
              </div>

              <div className="glass-card bg-gradient-to-br from-green-50/50 to-emerald-50/50 backdrop-blur supports-[backdrop-filter]:bg-green-50/40 rounded-xl p-5 border border-green-200">
                <h4 className="font-bold text-lg mb-4 text-green-900 flex items-center gap-2">
                  <Target className="w-5 h-5" /> Areas of Work
                </h4>
                <div className="flex flex-wrap gap-2">
                  {ngoProfile.areasOfWork?.length > 0 ? (
                    ngoProfile.areasOfWork.map((area, idx) => (
                      <span key={idx} className="px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200 text-green-800 rounded-xl text-sm font-semibold shadow-sm">
                        {area}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500">No areas specified</span>
                  )}
                </div>
              </div>
              
              <div className="glass-card bg-gradient-to-br from-purple-50/50 to-pink-50/50 backdrop-blur supports-[backdrop-filter]:bg-purple-50/40 rounded-xl p-5 border border-purple-200">
                <h4 className="font-bold text-lg mb-4 text-purple-900 flex items-center gap-2">
                  <Settings className="w-5 h-5" /> Operational Capacity & Resources
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="glass-card bg-gradient-to-br from-orange-100 to-orange-50 backdrop-blur p-4 rounded-xl border border-orange-200 shadow-md">
                    <div className="text-sm text-orange-700 font-medium mb-1">Food Distribution Capacity</div>
                    <div className="text-3xl font-bold text-orange-600">{ngoProfile.foodCapacity}</div>
                    <div className="text-xs text-orange-600 mt-1">meals per day</div>
                  </div>
                  <div className="glass-card bg-gradient-to-br from-red-100 to-red-50 backdrop-blur p-4 rounded-xl border border-red-200 shadow-md">
                    <div className="text-sm text-red-700 font-medium mb-1">Medical Teams Available</div>
                    <div className="text-3xl font-bold text-red-600">{ngoProfile.medicalTeamCount}</div>
                    <div className="text-xs text-red-600 mt-1">trained teams</div>
                  </div>
                  <div className="glass-card bg-gradient-to-br from-blue-100 to-blue-50 backdrop-blur p-4 rounded-xl border border-blue-200 shadow-md">
                    <div className="text-sm text-blue-700 font-medium mb-1">Vehicles Fleet</div>
                    <div className="text-3xl font-bold text-blue-600">
                      {(ngoProfile.trucks || 0) + (ngoProfile.boats || 0) + (ngoProfile.ambulances || 0)}
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      {ngoProfile.trucks || 0} trucks, {ngoProfile.boats || 0} boats, {ngoProfile.ambulances || 0} ambulances
                    </div>
                  </div>
                  <div className="glass-card bg-gradient-to-br from-green-100 to-green-50 backdrop-blur p-4 rounded-xl border border-green-200 shadow-md">
                    <div className="text-sm text-green-700 font-medium mb-1">Service Coverage</div>
                    <div className="text-3xl font-bold text-green-600">{ngoProfile.coverageRadius}</div>
                    <div className="text-xs text-green-600 mt-1">km radius</div>
                  </div>
                </div>
              </div>

              <div className="glass-card bg-gradient-to-br from-indigo-50/50 to-blue-50/50 backdrop-blur supports-[backdrop-filter]:bg-indigo-50/40 rounded-xl p-5 border border-indigo-200">
                <h4 className="font-bold text-lg mb-4 text-indigo-900 flex items-center gap-2">
                  <Package className="w-5 h-5" /> Additional Resources & Equipment
                </h4>
                <div className="bg-white/60 backdrop-blur p-4 rounded-lg">
                  <p className="text-gray-700">{ngoProfile.resources || 'No additional resources specified'}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-semibold text-gray-700">Organization Name</label>
                <input 
                  className="w-full px-4 py-3 bg-white/80 backdrop-blur border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm hover:shadow-md" 
                  value={profileForm.organizationName}
                  onChange={(e) => setProfileForm({...profileForm, organizationName: e.target.value})}
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold text-gray-700">Contact Person</label>
                <input 
                  className="w-full px-4 py-3 bg-white/80 backdrop-blur border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm hover:shadow-md" 
                  value={profileForm.contactPerson}
                  onChange={(e) => setProfileForm({...profileForm, contactPerson: e.target.value})}
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold text-gray-700">Phone</label>
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
      )}

      {/* Resources Management */}
      {activeTab === "resources" && (
        <div className="glass-card bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80 rounded-2xl shadow-xl border border-white/60 p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Package className="w-7 h-7 text-blue-600" />
                Resource Inventory
              </h3>
              <p className="text-sm text-gray-600 mt-1">Manage additional resources, supplies, and equipment available for disaster relief operations</p>
            </div>
            <button 
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl" 
              onClick={() => setShowResourceForm(!showResourceForm)}
            >
              <Plus className="w-4 h-4" /> Add New Resource
            </button>
          </div>

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
        <div className="glass-card bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80 rounded-2xl shadow-xl border border-white/60 p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Users className="w-7 h-7 text-blue-600" />
                Dispatcher Management
              </h3>
              <p className="text-sm text-gray-600 mt-1">Manage your field team dispatchers and credentials</p>
            </div>
            <div className="flex gap-3">
              {dispatchers.length === 0 && (
                <button 
                  onClick={() => setShowGenerateModal(true)}
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Generate Dispatchers
                </button>
              )}
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-white/80 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all shadow-sm hover:shadow-md flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
          
          {dispatchers.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-2xl inline-block mb-6">
                <Truck className="w-16 h-16 text-indigo-600" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">No Dispatchers Yet</h4>
              <p className="text-gray-600 mb-4 max-w-md mx-auto">Create dispatcher accounts to manage field operations and ticket assignments efficiently.</p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-lg mx-auto">
                <p className="text-sm text-blue-800 font-medium mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Getting Started
                </p>
                <p className="text-xs text-blue-700">Dispatchers can also be created during NGO registration for immediate setup.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stats Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Total Dispatchers</p>
                      <p className="text-2xl font-bold text-blue-900">{dispatchers.length}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Activity className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-green-600 font-medium">Active</p>
                      <p className="text-2xl font-bold text-green-900">{dispatchers.filter(d => d.isActive).length}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <FileText className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-orange-600 font-medium">Total Assignments</p>
                      <p className="text-2xl font-bold text-orange-900">{dispatchers.reduce((sum, d) => sum + (d.assignedTickets?.length || 0), 0)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dispatchers Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {dispatchers.map((dispatcher) => (
                  <div key={dispatcher._id} className="bg-white/60 backdrop-blur rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                          <User className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">{dispatcher.name}</h4>
                          <p className="text-xs text-gray-500 font-mono">ID: {dispatcher.dispatcherId}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                        dispatcher.isActive ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-gray-100 text-gray-800 border border-gray-200'
                      }`}>
                        <Activity className="w-3 h-3" />
                        {dispatcher.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Mail className="w-3 h-3 text-gray-500" />
                          <span className="text-xs text-gray-500 font-medium">Email</span>
                        </div>
                        <p className="text-sm font-mono text-gray-900">{dispatcher.email}</p>
                      </div>

                      <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                        <div className="flex items-center gap-2 mb-1">
                          <Key className="w-3 h-3 text-yellow-600" />
                          <span className="text-xs text-yellow-600 font-medium">Generated Password</span>
                        </div>
                        <code className="text-sm font-mono text-yellow-800 bg-yellow-100 px-2 py-1 rounded">
                          {dispatcher.generatedPassword}
                        </code>
                      </div>

                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="w-3 h-3 text-blue-600" />
                          <span className="text-xs text-blue-600 font-medium">Assigned Tickets</span>
                        </div>
                        <p className="text-lg font-bold text-blue-900">{dispatcher.assignedTickets?.length || 0}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Instructions */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-blue-900 mb-3">Security & Usage Guidelines</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <ul className="space-y-2 text-sm text-blue-800">
                        <li className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                          Share credentials securely with dispatchers
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                          Dispatchers login with email and password
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                          They see only assigned tickets
                        </li>
                      </ul>
                      <ul className="space-y-2 text-sm text-blue-800">
                        <li className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                          Can upload delivery proof
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                          Cannot close tickets independently
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                          Only NGO admins close completed tickets
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
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
        <div className="space-y-4">
          {/* Success Notification */}
          {dispatchSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-green-800 font-medium">{dispatchSuccess}</p>
                <p className="text-green-600 text-sm">The dispatcher will receive the assignment notification</p>
              </div>
              <button 
                onClick={() => setDispatchSuccess(null)}
                className="text-green-600 hover:text-green-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          
          <ActiveRequestsTracker
            requests={activeRequests}
            onStatusUpdate={handleStatusUpdate}
            onDispatch={handleDispatchTicket}
            dispatchers={dispatchers}
          />
        </div>
      )}

      {showAssignedTicketsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Assigned Tickets</h3>
                <p className="text-xs text-gray-500">All tickets currently dispatched to field teams</p>
              </div>
              <button
                type="button"
                onClick={handleCloseAssignedTickets}
                className="text-gray-500 hover:text-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-4 overflow-y-auto">
              {assignedTickets.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No tickets have been assigned to dispatchers yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {assignedTickets.map((ticket) => {
                    const ticketId = ticket.ticketId;
                    const rawStatus = ticket.status;
                    const hasProof =
                      (ticket.deliveryProof && ticket.deliveryProof.length > 0) ||
                      (ticket.proofOfDelivery && ticket.proofOfDelivery.length > 0) ||
                      false;
                    const dispatcherLabel =
                      ticket.dispatcher?.name || ticket.dispatcher?.dispatcherId;

                    let statusLabel = rawStatus;
                    if (rawStatus === 'matched' && dispatcherLabel) statusLabel = 'Dispatched';
                    else if (rawStatus === 'dispatched') statusLabel = 'Dispatched';
                    else if (rawStatus === 'in_progress' || rawStatus === 'in-progress') statusLabel = 'On the way';
                    else if (rawStatus === 'fulfilled') statusLabel = 'Reached location';
                    else if (rawStatus === 'completed') statusLabel = 'Delivered';
                    else if (rawStatus === 'closed') statusLabel = 'Closed';

                    const ticketStatus = rawStatus;

                    return (
                      <div
                        key={ticketId}
                        className="glass-card bg-white/90 backdrop-blur rounded-xl border border-gray-200 p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <p className="text-[11px] text-gray-500 font-mono tracking-tight">
                              Ticket ID: {ticketId}
                            </p>
                            {ticket.citizenName && (
                              <p className="text-sm font-semibold text-gray-900">
                                {ticket.citizenName}
                              </p>
                            )}
                            {ticket.location && (
                              <p className="text-xs text-gray-600">
                                <span className="font-semibold text-gray-700">Location:</span>{' '}
                                {ticket.location}
                              </p>
                            )}
                            {dispatcherLabel && (
                              <p className="text-xs text-gray-600">
                                <span className="font-semibold text-gray-700">Dispatcher:</span>{' '}
                                {dispatcherLabel}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                ticketStatus === 'closed'
                                  ? 'bg-green-100 text-green-800 border border-green-200'
                                  : ticketStatus === 'completed' || ticketStatus === 'fulfilled'
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                  : (ticketStatus === 'in_progress' || ticketStatus === 'in-progress')
                                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                  : 'bg-gray-100 text-gray-800 border-gray-200'
                              }`}
                            >
                              Status: {statusLabel}
                            </span>

                            <div className="text-xs text-gray-600 flex flex-col items-end gap-1 mt-1">
                              <div className="flex items-center gap-2">
                                <span>Proof of delivery:</span>
                                {hasProof ? (
                                  <span className="font-semibold text-green-700">
                                    Available
                                  </span>
                                ) : (
                                  <span className="font-semibold text-red-600">
                                    Not uploaded
                                  </span>
                                )}
                                {hasProof && (
                                  <details className="ml-1 cursor-pointer">
                                    <summary className="list-none flex items-center gap-1 text-indigo-600 hover:text-indigo-800">
                                      <Eye className="w-3 h-3" />
                                      <span>View</span>
                                    </summary>
                                    <div className="mt-1 bg-white border border-gray-200 rounded-md shadow-sm p-2 min-w-[180px] text-left">
                                      {ticket.deliveryProof && ticket.deliveryProof.length > 0 && (
                                        <div className="mb-1">
                                          <p className="font-semibold text-xs text-gray-800 mb-1">Dispatcher Uploads</p>
                                          <ul className="text-[11px] text-gray-700 space-y-0.5 max-h-32 overflow-y-auto">
                                            {ticket.deliveryProof.map((file, idx) => {
                                              const href = `http://localhost:5001/uploads/${file.filename}`;
                                              return (
                                                <li key={idx} className="truncate">
                                                  • <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800">
                                                      {file.originalname || file.filename || 'File'}
                                                    </a>
                                                </li>
                                              );
                                            })}
                                          </ul>
                                        </div>
                                      )}
                                      {ticket.proofOfDelivery && ticket.proofOfDelivery.length > 0 && (
                                        <div>
                                          <p className="font-semibold text-xs text-gray-800 mb-1">Citizen / Other Proof</p>
                                          <ul className="text-[11px] text-gray-700 space-y-0.5 max-h-32 overflow-y-auto">
                                            {ticket.proofOfDelivery.map((file, idx) => {
                                              const href = `http://localhost:5001/uploads/${file.filename}`;
                                              return (
                                                <li key={idx} className="truncate">
                                                  • <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800">
                                                      {file.originalname || file.filename || 'File'}
                                                    </a>
                                                </li>
                                              );
                                            })}
                                          </ul>
                                        </div>
                                      )}
                                      {!ticket.deliveryProof && !ticket.proofOfDelivery && (
                                        <p className="text-[11px] text-gray-500">No file metadata available.</p>
                                      )}
                                    </div>
                                  </details>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <button
                                type="button"
                                onClick={() =>
                                  handleReassignDispatcher(
                                    ticket.ticketObjectId,
                                    ticket.dispatcher?._id
                                  )
                                }
                                disabled={
                                  reassigningTicketId === ticket.ticketObjectId ||
                                  !ticket.dispatcher?._id
                                }
                                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                {reassigningTicketId === ticket.ticketObjectId
                                  ? 'Reassigning to dispatcher...'
                                  : 'Reassign to same dispatcher'}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleStatusUpdate(ticketId, 'closed')}
                                disabled={!hasProof || ticketStatus === 'closed'}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                                  !hasProof || ticketStatus === 'closed'
                                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                    : 'bg-green-600 text-white border-green-700 hover:bg-green-700'
                                }`}
                                title={
                                  !hasProof
                                    ? 'Cannot close ticket until proof of delivery is uploaded'
                                    : ticketStatus === 'closed'
                                    ? 'Ticket already closed'
                                    : 'Close ticket after verifying proof'
                                }
                              >
                                Close Ticket
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
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
    </div>
  );
}
