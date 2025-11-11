import API from './axios';

export async function submitHelpRequest(payload, files = []) {
  if (files.length > 0) {
    const form = new FormData();
    Object.entries(payload).forEach(([k, v]) => {
      if (Array.isArray(v)) {
        v.forEach(item => form.append(`${k}[]`, item));
      } else if (v !== undefined && v !== null) {
        form.append(k, typeof v === 'object' ? JSON.stringify(v) : v);
      }
    });
    files.forEach(f => form.append('files[]', f));
    const { data } = await API.post('/tickets', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  }
  const { data } = await API.post('/tickets', payload);
  return data;
}

export async function listTickets(status) {
  const { data } = await API.get('/tickets', { params: { status } });
  return data;
}

export async function getTicketMatches(ticketId) {
  const { data } = await API.get(`/tickets/match/${ticketId}`);
  return data;
}


