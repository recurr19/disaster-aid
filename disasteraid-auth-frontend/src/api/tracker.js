import API from './axios';

export async function getTrackerStatus(ticketId) {
  const { data } = await API.get(`/tracker/${ticketId}`);
  return data;
}

export async function updateTicketStatus(ticketId, status, note) {
  const { data } = await API.post(`/tracker/${ticketId}/status`, { status, note });
  return data;
}


