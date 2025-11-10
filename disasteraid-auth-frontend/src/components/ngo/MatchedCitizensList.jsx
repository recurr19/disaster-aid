import { AlertCircle, Users, MapPin, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { useState } from "react";
import "./MatchedCitizensList.css";

export default function MatchedCitizensList({ citizens, onAccept, onReject }) {
  const [loading, setLoading] = useState(false);

  if (citizens.length === 0) {
    return (
      <div className="card text-center p-12">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No matched citizens currently.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {citizens.map((c) => (
        <div key={c.id} className="card">
          <h3 className="text-lg font-semibold">{c.name}</h3>
          <p className="text-sm">Help: {c.helpType}</p>
          <p className="text-sm flex items-center gap-1"><MapPin className="w-4 h-4" /> {c.location}</p>
          <p className="text-sm flex items-center gap-1"><Users className="w-4 h-4" /> {c.peopleCount} people</p>

          <div className="flex gap-3 mt-4">
            <button className="button-primary flex-1" onClick={() => onAccept(c.id)}><CheckCircle /> Accept</button>
            <button className="button-secondary flex-1" onClick={() => onReject(c.id)}><XCircle /> Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
}
