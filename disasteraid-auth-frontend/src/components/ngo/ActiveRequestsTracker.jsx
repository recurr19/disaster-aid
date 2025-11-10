import { Clock, Truck, CheckCircle2, MapPin } from "lucide-react";
import { useState } from "react";
import "./ActiveRequestsTracker.css";

export default function ActiveRequestsTracker({ requests, onStatusUpdate }) {
  const [expanded, setExpanded] = useState(null);

  if (requests.length === 0) {
    return <div className="card text-center p-12 text-gray-600">No Active Assignments</div>;
  }

  return (
    <div className="space-y-4">
      {requests.map((r) => (
        <div key={r.id} className="card cursor-pointer" onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
          <h3 className="text-lg font-semibold">{r.citizenName}</h3>
          <p className="text-sm">{r.helpType}</p>
          <p className="text-sm flex items-center gap-1"><MapPin className="w-4 h-4" /> {r.location}</p>
          <p className="text-xs text-gray-500">Accepted at: {r.acceptedAt}</p>

          {expanded === r.id && (
            <div className="mt-4 flex gap-3">
              <button className="button-secondary flex-1" onClick={() => onStatusUpdate(r.id, "pending")}>Pending</button>
              <button className="button-primary flex-1" onClick={() => onStatusUpdate(r.id, "dispatched")}>Dispatched</button>
              <button className="button-secondary flex-1 bg-green-200" onClick={() => onStatusUpdate(r.id, "completed")}>Completed</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
