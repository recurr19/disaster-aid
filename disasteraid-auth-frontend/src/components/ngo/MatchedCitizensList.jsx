import { AlertCircle, Users, MapPin, CheckCircle, XCircle, Paperclip, Image, Volume2 } from "lucide-react";
import "./MatchedCitizensList.css";

export default function MatchedCitizensList({ citizens, onAccept, onReject }) {

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
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-lg font-semibold">{c.name}</h3>
              {c.urgency === 'SOS' && (
                <span className="inline-block px-2 py-1 text-xs font-bold text-white bg-red-600 rounded mt-1">
                  🚨 SOS
                </span>
              )}
            </div>
            <span className="text-sm text-gray-500">Ticket: {c.ticketId}</span>
          </div>

          <div className="space-y-2 mb-4">
            <p className="text-sm"><strong>Help Type:</strong> {c.helpType}</p>
            <p className="text-sm flex items-center gap-1"><MapPin className="w-4 h-4" /> {c.location}</p>
            <p className="text-sm flex items-center gap-1"><Users className="w-4 h-4" /> {c.peopleCount} people</p>
            
            {c.description && (
              <div className="mt-2 p-2 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                <p className="text-sm text-gray-700"><strong>Description:</strong> {c.description}</p>
              </div>
            )}

            {c.files && c.files.length > 0 && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <Paperclip className="w-4 h-4" />
                  Citizen uploaded {c.files.length} file{c.files.length !== 1 ? 's' : ''}:
                </p>
                <ul className="space-y-1">
                  {c.files.map((file, idx) => {
                    const href = `http://localhost:5001/uploads/${file.filename}`;
                    const isImage = file.mimetype?.startsWith('image/');
                    const isAudio = file.mimetype?.startsWith('audio/');
                    
                    return (
                      <li key={idx} className="flex items-center gap-2">
                        {isImage && <Image className="w-4 h-4 text-blue-600" />}
                        {isAudio && <Volume2 className="w-4 h-4 text-blue-600" />}
                        {!isImage && !isAudio && <Paperclip className="w-4 h-4 text-blue-600" />}
                        <a 
                          href={href} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-sm text-blue-700 hover:text-blue-900 hover:underline truncate flex-1"
                        >
                          {file.originalname || file.filename}
                        </a>
                        <span className="text-xs text-gray-500">
                          ({Math.round((file.size || 0) / 1024)} KB)
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-4">
            <button className="button-primary flex-1" onClick={() => onAccept(c.id)}><CheckCircle /> Accept</button>
            <button className="button-secondary flex-1" onClick={() => onReject(c.id)}><XCircle /> Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
}
