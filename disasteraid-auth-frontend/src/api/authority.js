import API from './axios';

export async function getMapData() {
  const { data } = await API.get('/authority/map');
  return data;
}

export async function listOverlays() {
  const { data } = await API.get('/authority/overlays');
  return data;
}

export async function createOverlay(payload) {
  const { data } = await API.post('/authority/overlays', payload);
  return data;
}

export async function updateOverlay(id, payload) {
  const { data } = await API.put(`/authority/overlays/${id}`, payload);
  return data;
}

export async function deleteOverlay(id) {
  const { data } = await API.delete(`/authority/overlays/${id}`);
  return data;
}


