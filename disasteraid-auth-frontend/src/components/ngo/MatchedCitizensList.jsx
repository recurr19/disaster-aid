import { AlertCircle, Users, MapPin, CheckCircle, XCircle, Paperclip, Image, Volume2, PackageCheck } from "lucide-react";
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

          {/* Content */}
          <div className="px-5 pb-4 space-y-3">
            {/* Help Type */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-100">
              <div className="flex items-start gap-2">
                <PackageCheck className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-purple-900 mb-1">Required Help</p>
                  <p className="text-sm text-purple-800 font-medium">{c.helpType}</p>
                </div>
              </div>
            </div>

            {/* Location and People Count */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-blue-900 mb-1">Location</p>
                    <p className="text-sm text-blue-800 truncate" title={c.location}>{c.location}</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                <div className="flex items-start gap-2">
                  <Users className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-green-900 mb-1">Beneficiaries</p>
                    <p className="text-sm text-green-800 font-bold">{c.peopleCount} {c.peopleCount === 1 ? 'person' : 'people'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-0 border-t border-gray-200">
            <button 
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-4 font-semibold transition-all flex items-center justify-center gap-2 shadow-inner"
              onClick={() => onAccept(c.id)}
            >
              <CheckCircle className="w-5 h-5" />
              Accept
            </button>
            <button 
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-4 font-semibold transition-all flex items-center justify-center gap-2 border-l border-gray-200"
              onClick={() => onReject(c.id)}
            >
              <XCircle className="w-5 h-5" />
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
