import { useState, useEffect, useCallback } from 'react';
import axios from '../api/axios';

/**
 * Custom hook for fetching tickets
 */
export const useTickets = (userId, userRole) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTickets = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`/api/tickets/user/${userId}`);
      setTickets(response.data);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError(err.response?.data?.error || 'Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const refetchTickets = () => {
    fetchTickets();
  };

  const updateTicketStatus = (ticketId, newStatus) => {
    setTickets(prev => 
      prev.map(ticket => 
        ticket._id === ticketId 
          ? { ...ticket, status: newStatus }
          : ticket
      )
    );
  };

  return { tickets, loading, error, refetchTickets, updateTicketStatus };
};
