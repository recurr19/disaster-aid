import API from './axios';

/**
 * Generate dispatchers for an NGO
 * @param {number} count - Number of dispatchers to generate (1-50)
 * @returns {Promise} Response with generated dispatcher credentials
 */
export async function generateDispatchers(count) {
  const { data } = await API.post('/dispatcher/generate', { count });
  return data;
}

/**
 * Get all dispatchers for the logged-in NGO
 * @returns {Promise} Response with dispatchers list
 */
export async function listDispatchers() {
  const { data } = await API.get('/dispatcher/list');
  return data;
}

/**
 * Assign a ticket to a dispatcher
 * @param {string} ticketId - Ticket MongoDB _id
 * @param {string} dispatcherId - Dispatcher MongoDB _id
 * @returns {Promise} Response with updated ticket
 */
export async function assignTicketToDispatcher(ticketId, dispatcherId) {
  const { data } = await API.post('/dispatcher/assign-ticket', { 
    ticketId, 
    dispatcherId 
  });
  return data;
}

/**
 * Get tickets assigned to the logged-in dispatcher
 * @returns {Promise} Response with assigned tickets
 */
export async function getMyTickets() {
  const { data } = await API.get('/dispatcher/my-tickets');
  return data;
}

/**
 * Upload delivery proof for a ticket
 * @param {string} ticketId - Ticket ID
 * @param {File[]} files - Array of proof files to upload
 * @returns {Promise} Response with uploaded file info
 */
export async function uploadDeliveryProof(ticketId, files) {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files[]', file);
  });
  
  const { data } = await API.post(`/dispatcher/upload-proof/${ticketId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
}
