import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import NGOResourceForm from "./NGOResourceForm";
import MatchedCitizensList from "./MatchedCitizensList";
import ActiveRequestsTracker from "./ActiveRequestsTracker";
import "./NGODashboard.css";
import { listNGOMatches, acceptAssignment, rejectAssignment } from "../../api/ngo";
import { updateTicketStatus } from "../../api/tracker";
import { connectRealtime } from "../../api/realtime";

export default function NGODashboard() {
  const [activeTab, setActiveTab] = useState("resources");
  const [showResourceForm, setShowResourceForm] = useState(false);

  const [resources, setResources] = useState([
    {
      id: "1",
      category: "Medical",
      description: "Basic medical supplies",
      quantity: 50,
      peopleCapacity: 25,
      location: "Downtown Center",
      status: "active",
    },
  ]);

  const [matchedCitizens, setMatchedCitizens] = useState([]);

  const [activeRequests, setActiveRequests] = useState([]);

  // Load matches (proposed) and accepted assignments for the NGO
  useEffect(() => {
    async function load() {
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
          status: 'matched' // actual status comes from tracker; we will update as user changes
        }));
        setActiveRequests(requests);
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

  const handleAddResource = (resource) => {
    setResources([
      ...resources,
      { ...resource, id: Date.now().toString(), status: "active" },
    ]);
    setShowResourceForm(false);
  };

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

  const stats = {
    activeResources: resources.filter((r) => r.status === "active").length,
    totalCapacity: resources.reduce((sum, r) => sum + r.peopleCapacity, 0),
    pendingMatches: matchedCitizens.length,
    activeAssignments: activeRequests.length,
  };

  return (
    <div className="container-main ngo-root">

      {/* Header */}
      <div className="mb-8">
        <h1>NGO Dashboard</h1>
        <p>Manage resources, match help requests, track missions.</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="card">
          <p>Active Resources</p>
          <p>{stats.activeResources}</p>
        </div>

        <div className="card">
          <p>Total Capacity</p>
          <p>{stats.totalCapacity}</p>
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
        {["resources", "matches", "tracking"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`tab-button ${activeTab === tab ? 'active' : ''}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Resources */}
      {activeTab === "resources" && (
        <div>
          <button className="button-primary" style={{ display: "flex", gap: "8px", marginBottom: "1.5rem" }} onClick={() => setShowResourceForm(!showResourceForm)}>
            <Plus size={18} /> Add Resource
          </button>

          {showResourceForm && (
            <NGOResourceForm
              onSubmit={handleAddResource}
              onCancel={() => setShowResourceForm(false)}
            />
          )}

          <div className="list-grid">
            {resources.map((r) => (
              <div key={r.id} className="card">
                <h3 className="text-lg font-semibold">{r.category}</h3>
                <p className="text-gray-700 my-1">{r.description}</p>
                <p className="text-sm">Quantity: {r.quantity}</p>
                <p className="text-sm">Capacity: {r.peopleCapacity} people</p>
                <p className="text-sm">Location: {r.location}</p>
              </div>
            ))}
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
        />
      )}
    </div>
  );
}
