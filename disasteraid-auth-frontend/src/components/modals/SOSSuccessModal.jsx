import { AlertTriangle, CheckCircle2, Clock, Shield } from "lucide-react";

const SOSSuccessModal = ({ ticketId, onClose }) => {
  if (!ticketId) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl text-center w-full max-w-md overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-6">
          <div className="flex justify-center mb-3">
            <div className="bg-white rounded-full p-3">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white">
            SOS REQUEST SUBMITTED
          </h2>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-4">
          {/* Ticket ID */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Ticket ID</p>
            <p className="font-mono text-lg text-blue-700 font-semibold break-all">
              {ticketId}
            </p>
          </div>

          {/* Status Messages */}
          <div className="space-y-3 text-left">
            <div className="flex items-start gap-3">
              <div className="bg-green-100 rounded-full p-2 mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Emergency teams notified</p>
                <p className="text-xs text-gray-600">Nearby NGOs are being alerted immediately</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-blue-100 rounded-full p-2 mt-0.5">
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Response in progress</p>
                <p className="text-xs text-gray-600">You will receive updates via your contact method</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-purple-100 rounded-full p-2 mt-0.5">
                <Shield className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Critical priority assigned</p>
                <p className="text-xs text-gray-600">Your request is being processed with highest priority</p>
              </div>
            </div>
          </div>

          {/* Important Note */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-left">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-yellow-800">
                <span className="font-semibold">Stay safe:</span> Keep your phone charged and accessible. Help is on the way.
              </p>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl font-semibold"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default SOSSuccessModal;
