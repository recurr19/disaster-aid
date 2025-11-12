import { Truck, MapPin, Send } from "lucide-react";
import { useState } from "react";
import "./ActiveRequestsTracker.css";

export default function ActiveRequestsTracker({ requests, onStatusUpdate, onDispatch, dispatchers }) {
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
          {r.acceptedAt && <p className="text-xs text-gray-500">Accepted at: {r.acceptedAt}</p>}
          
          {r.isDispatched && (
            <div className="mt-2 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full inline-flex items-center gap-1">
              <Truck className="w-3 h-3" />
              Dispatched to Field Team
            </div>
          )}

          {expanded === r.id && (
            <div className="mt-4 space-y-3" onClick={(e) => e.stopPropagation()}>
              {!r.isDispatched && (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Assign to Dispatcher:
                  </p>
                  {dispatchers && dispatchers.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {dispatchers.map((dispatcher) => (
                        <button
                          key={dispatcher._id}
                          className="button-secondary text-xs flex items-center justify-center gap-1 py-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log(r);
                            console.log('Dispatching ticket:', r.id, 'to dispatcher:', dispatcher._id);
                            onDispatch(r.id, dispatcher._id);
                          }}
                        >
                          <Send className="w-3 h-3" />
                          {dispatcher.name.split(' - ')[1] || dispatcher.name}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500 bg-yellow-50 p-2 rounded border border-yellow-200">
                      No dispatchers available. Add dispatchers in the "Dispatchers" tab or during registration.
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex gap-3">
                <button className="button-secondary flex-1" onClick={(e) => { e.stopPropagation(); onStatusUpdate(r.id, "pending"); }}>Pending</button>
                <button className="button-secondary flex-1 bg-green-200" onClick={(e) => { e.stopPropagation(); onStatusUpdate(r.id, "completed"); }}>Completed</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
