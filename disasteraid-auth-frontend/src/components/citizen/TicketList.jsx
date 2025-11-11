import React from 'react';
import { Clock, CheckCircle2 } from 'lucide-react';
import { Card } from '../common';

/**
 * Ticket list component for sidebar
 */
const TicketList = ({ tickets, loading, onTicketClick, emptyMessage }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>{emptyMessage || 'No tickets found.'}</p>
      </div>
    );
  }

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      'assigned': 'bg-purple-100 text-purple-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-3">
      {tickets.map((ticket) => (
        <Card
          key={ticket._id}
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => onTicketClick(ticket)}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-gray-800">
                {ticket.ticketId || ticket._id}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                {ticket.status}
              </span>
            </div>
            {ticket.isSOS && (
              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full">
                SOS
              </span>
            )}
          </div>

          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
            {ticket.description || 'No description provided'}
          </p>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              {ticket.status === 'completed' ? (
                <CheckCircle2 className="h-3 w-3 text-green-600" />
              ) : (
                <Clock className="h-3 w-3 text-blue-600" />
              )}
              <span>
                {new Date(ticket.createdAt).toLocaleDateString()}
              </span>
            </div>
            {ticket.helpTypes && ticket.helpTypes.length > 0 && (
              <span className="text-blue-600 font-medium">
                {ticket.helpTypes.length} help type(s)
              </span>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};

export default TicketList;
