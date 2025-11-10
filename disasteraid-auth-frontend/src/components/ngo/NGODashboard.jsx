import { useState } from "react";
import { Plus } from "lucide-react";
import NGOResourceForm from "./NGOResourceForm";
import MatchedCitizensList from "./MatchedCitizensList";
import ActiveRequestsTracker from "./ActiveRequestsTracker";
import "./NGODashboard.css";

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

  const [matchedCitizens, setMatchedCitizens] = useState([
    {
      id: "1",
      name: "John Doe",
      helpType: "Medical",
      urgency: "SOS",
      location: "Downtown",
      peopleCount: 3,
    },
    {
      id: "2",
      name: "Jane Smith",
      helpType: "Food",
      urgency: "Normal",
      location: "Midtown",
      peopleCount: 2,
    }
  ]);

  const [activeRequests, setActiveRequests] = useState([
    {
      id: "1",
      citizenName: "John Doe",
      helpType: "Medical",
      location: "Downtown",
      acceptedAt: "2024-11-06 10:30",
      status: "dispatched",
    },
  ]);

  const handleAddResource = (resource) => {
    setResources([
      ...resources,
      { ...resource, id: Date.now().toString(), status: "active" },
    ]);
    setShowResourceForm(false);
  };

  const handleAcceptMatch = (citizenId) => {
    const citizen = matchedCitizens.find((c) => c.id === citizenId);
    if (!citizen) return;

    setActiveRequests([
      ...activeRequests,
      {
        id: Date.now().toString(),
        citizenName: citizen.name,
        helpType: citizen.helpType,
        location: citizen.location,
        acceptedAt: new Date().toLocaleString(),
        status: "pending",
      },
    ]);

    setMatchedCitizens(matchedCitizens.filter((c) => c.id !== citizenId));
  };

  const handleRejectMatch = (citizenId) => {
    setMatchedCitizens(matchedCitizens.filter((c) => c.id !== citizenId));
  };

  const handleStatusUpdate = (requestId, newStatus) => {
    setActiveRequests(
      activeRequests.map((req) =>
        req.id === requestId ? { ...req, status: newStatus } : req
      )
    );
  };

  const stats = {
    activeResources: resources.filter((r) => r.status === "active").length,
    totalCapacity: resources.reduce((sum, r) => sum + r.peopleCapacity, 0),
    pendingMatches: matchedCitizens.length,
    activeAssignments: activeRequests.length,
  };

  return (
    <div className="container-main" style={{ padding: "2rem" }}>

      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2.25rem", fontWeight: "700", color: "#111" }}>
          NGO Dashboard
        </h1>
        <p style={{ color: "#555" }}>Manage resources, match help requests, track missions.</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gap: "1.5rem", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginBottom: "2rem" }}>
        <div className="card">
          <p style={{ color: "#666", fontSize: "0.9rem" }}>Active Resources</p>
          <p style={{ fontSize: "2rem", fontWeight: "600" }}>{stats.activeResources}</p>
        </div>

        <div className="card">
          <p style={{ color: "#666", fontSize: "0.9rem" }}>Total Capacity</p>
          <p style={{ fontSize: "2rem", fontWeight: "600" }}>{stats.totalCapacity}</p>
        </div>

        <div className="card">
          <p style={{ color: "#666", fontSize: "0.9rem" }}>Pending Matches</p>
          <p style={{ fontSize: "2rem", fontWeight: "600" }}>{stats.pendingMatches}</p>
        </div>

        <div className="card">
          <p style={{ color: "#666", fontSize: "0.9rem" }}>Active Assignments</p>
          <p style={{ fontSize: "2rem", fontWeight: "600" }}>{stats.activeAssignments}</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", borderBottom: "1px solid #ddd", paddingBottom: "0.75rem" }}>
        {["resources", "matches", "tracking"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              fontWeight: activeTab === tab ? "700" : "500",
              color: activeTab === tab ? "#2563eb" : "#444",
              borderBottom: activeTab === tab ? "3px solid #2563eb" : "3px solid transparent",
              padding: "0.5rem 1rem",
              background: "none",
              cursor: "pointer"
            }}
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

          <div style={{ display: "grid", gap: "1rem" }}>
            {resources.map((r) => (
              <div key={r.id} className="card">
                <h3 style={{ fontSize: "1.25rem", fontWeight: "600" }}>{r.category}</h3>
                <p style={{ color: "#555", margin: "0.25rem 0" }}>{r.description}</p>
                <p style={{ fontSize: "0.9rem" }}>Quantity: {r.quantity}</p>
                <p style={{ fontSize: "0.9rem" }}>Capacity: {r.peopleCapacity} people</p>
                <p style={{ fontSize: "0.9rem" }}>Location: {r.location}</p>
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
