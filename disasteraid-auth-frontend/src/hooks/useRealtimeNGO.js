import { useEffect, useCallback } from 'react';
import { connectRealtime, getSocket } from '../api/realtime';

/**
 * Custom hook for NGO dashboard realtime updates
 * Automatically refetches data when proposals/assignments arrive
 * 
 * @param {string} ngoId - The NGO's _id
 * @param {function} onNewProposal - Callback when new proposal arrives
 * @param {function} onAssignmentUpdate - Callback when assignment status changes
 * @param {function} onTicketUpdate - Callback when ticket status changes
 * @param {function} onDispatcherUpdate - Callback when dispatcher assignments change
 */
export function useRealtimeNGO(ngoId, callbacks = {}) {
  const {
    onNewProposal,
    onAssignmentUpdate,
    onProposals,
    onTicketUpdate,
    onDispatcherUpdate,
    onTicketClosed
  } = callbacks;

  useEffect(() => {
    if (!ngoId) return;

    // Connect and join NGO room
    const socket = connectRealtime(ngoId, 'ngo');

    // Listen to assignment proposals
    const handleProposal = (data) => {
      console.log('🔔 New proposal received:', data);
      if (onNewProposal) {
        onNewProposal(data);
      }
    };

    // Listen to assignment accepted events
    const handleAssignmentAccepted = (data) => {
      console.log('✅ Assignment accepted:', data);
      if (onAssignmentUpdate) {
        onAssignmentUpdate(data);
      }
    };

    // Listen to ticket proposals batch
    const handleTicketProposals = (data) => {
      console.log('📋 Ticket proposals received:', data);
      if (onProposals) {
        onProposals(data);
      }
    };

    // Listen to ticket updates
    const handleTicketUpdate = (data) => {
      console.log('📝 Ticket update:', data);
      if (onTicketUpdate) {
        onTicketUpdate(data);
      }
    };

    // Listen to dispatcher assignment updates
    const handleDispatcherUpdate = (data) => {
      console.log('👷 Dispatcher assignment update:', data);
      if (onDispatcherUpdate) {
        onDispatcherUpdate(data);
      }
    };

    // Listen to ticket closed events
    const handleTicketClosed = (data) => {
      console.log('🔒 Ticket closed event:', data);
      if (onTicketClosed) {
        onTicketClosed(data);
      }
    };

    // Register listeners
    socket.on('assignment:proposed', handleProposal);
    socket.on('assignment:accepted', handleAssignmentAccepted);
    socket.on('ticket:proposals', handleTicketProposals);
    socket.on('ticket:created', handleTicketUpdate);
    socket.on('dispatcher:ticket:assigned', handleDispatcherUpdate);
    socket.on('ngo:ticket:closed', handleTicketClosed);
    
    // Pattern-based ticket updates (ticket:update:<ticketId>)
    // For this, we'll use a wildcard listener if available, or listen to specific events
    // Socket.io client doesn't support wildcards directly, so we listen to known patterns
    const handleGenericTicketUpdate = (data) => {
      if (onTicketUpdate) {
        onTicketUpdate(data);
      }
    };

    // Listen to generic ticket update pattern (you may need to emit with specific event names)
    socket.onAny((eventName, data) => {
      if (eventName.startsWith('ticket:update:')) {
        handleGenericTicketUpdate(data);
      }
    });

    // Cleanup on unmount
    return () => {
      socket.off('assignment:proposed', handleProposal);
      socket.off('assignment:accepted', handleAssignmentAccepted);
      socket.off('ticket:proposals', handleTicketProposals);
      socket.off('ticket:created', handleTicketUpdate);
      socket.off('dispatcher:ticket:assigned', handleDispatcherUpdate);
      socket.off('ngo:ticket:closed', handleTicketClosed);
      socket.offAny();
    };
  }, [ngoId, onNewProposal, onAssignmentUpdate, onTicketUpdate, onProposals, onDispatcherUpdate, onTicketClosed]);
}

export default useRealtimeNGO;
