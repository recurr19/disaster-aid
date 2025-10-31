
import { CheckCircle2 } from "lucide-react";

const TicketSuccessModal = ({ ticketId, onClose }) => {
  if (!ticketId) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white px-6 py-8 rounded-xl shadow-xl text-center w-full max-w-sm">
        <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
        <h2 className="text-xl font-semibold text-gray-800">
          Help is on the way!
        </h2>
        <p className="text-gray-600 text-sm mt-2 mb-4">
          Your request has been received successfully.
        </p>
        <p className="text-base text-gray-700">
          Ticket ID:{" "}
          <span className="font-mono text-blue-700 font-medium">{ticketId}</span>
        </p>
        <button
          onClick={onClose}
          className="mt-5 bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
};

export default TicketSuccessModal;