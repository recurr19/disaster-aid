import React from 'react';
import { Clock, AlertCircle } from 'lucide-react';

/**
 * Pending requests queue display
 */
const PendingRequestsQueue = ({ pendingRequests, isProcessingQueue }) => {
  if (pendingRequests.length === 0) return null;

  return (
    <div className="mb-6 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
      <div className="flex items-center space-x-2 mb-3">
        <AlertCircle className="h-5 w-5 text-yellow-600" />
        <h3 className="text-lg font-semibold text-yellow-800">
          Pending Requests ({pendingRequests.length})
        </h3>
      </div>
      <p className="text-sm text-yellow-700 mb-3">
        {isProcessingQueue 
          ? 'Processing queued requests...' 
          : 'These requests will be submitted automatically when network improves.'
        }
      </p>
      <div className="space-y-2">
        {pendingRequests.map((req, index) => (
          <div key={req.id} className="flex items-center justify-between p-3 bg-white rounded border border-yellow-200">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-gray-700">
                Request #{index + 1} - {new Date(req.timestamp).toLocaleString()}
              </span>
            </div>
            <span className="text-xs text-gray-500">
              {req.files?.length || 0} file(s)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingRequestsQueue;
