/**
 * Utility functions for ticket status
 */

import { TICKET_STATUS } from './constants';

/**
 * Get status color for badges
 */
export const getStatusColor = (status) => {
  const colors = {
    [TICKET_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    [TICKET_STATUS.IN_PROGRESS]: 'bg-blue-100 text-blue-800 border-blue-300',
    [TICKET_STATUS.ASSIGNED]: 'bg-purple-100 text-purple-800 border-purple-300',
    [TICKET_STATUS.COMPLETED]: 'bg-green-100 text-green-800 border-green-300',
    [TICKET_STATUS.CANCELLED]: 'bg-red-100 text-red-800 border-red-300'
  };
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
};

/**
 * Get status icon
 */
export const getStatusIcon = (status) => {
  const icons = {
    [TICKET_STATUS.PENDING]: '⏳',
    [TICKET_STATUS.IN_PROGRESS]: '🔄',
    [TICKET_STATUS.ASSIGNED]: '👤',
    [TICKET_STATUS.COMPLETED]: '✅',
    [TICKET_STATUS.CANCELLED]: '❌'
  };
  return icons[status] || '📋';
};

/**
 * Format ticket display name
 */
export const formatTicketId = (ticket) => {
  return ticket.ticketId || ticket._id || 'Unknown';
};

/**
 * Check if ticket is active
 */
export const isActiveTicket = (status) => {
  return [
    TICKET_STATUS.PENDING,
    TICKET_STATUS.IN_PROGRESS,
    TICKET_STATUS.ASSIGNED
  ].includes(status);
};

/**
 * Check if ticket is completed
 */
export const isCompletedTicket = (status) => {
  return status === TICKET_STATUS.COMPLETED;
};

/**
 * Format date for display
 */
export const formatTicketDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString();
};
