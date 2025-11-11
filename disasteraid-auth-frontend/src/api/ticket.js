import API from './axios';

export async function getTickets(params = {}) {
  const { data } = await API.get('/tickets', { params });
  return data;
}

export async function getMatchesForTicket(ticketId) {
  const { data } = await API.get(`/tickets/match/${ticketId}`);
  return data;
}

export async function assignBestNGO(ticketId) {
  const { data } = await API.post(`/tickets/assign/${ticketId}`);
  return data;
}
