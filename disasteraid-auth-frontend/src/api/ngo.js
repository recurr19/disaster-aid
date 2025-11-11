import API from './axios';

export async function listNGOMatches(status = 'proposed') {
  const { data } = await API.get('/ngo/matches', { params: { status } });
  return data;
}

export async function acceptAssignment(assignmentId) {
  const { data } = await API.post(`/ngo/assignments/${assignmentId}/accept`);
  return data;
}

export async function rejectAssignment(assignmentId) {
  const { data } = await API.post(`/ngo/assignments/${assignmentId}/reject`);
  return data;
}


