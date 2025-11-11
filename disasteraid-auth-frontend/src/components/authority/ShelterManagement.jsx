import React, { useEffect, useState } from 'react';
import './authority.css';
import { listOverlays, createOverlay, updateOverlay, deleteOverlay } from '../../api/authority';

const ShelterManagement = () => {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    type: 'shelter',
    name: '',
    status: 'open',
    capacity: '',
    latitude: '',
    longitude: ''
  });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const res = await listOverlays();
      setItems(res.items || []);
    } catch (e) {
      setItems([]);
    }
  };

  useEffect(() => { load(); }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        type: form.type,
        name: form.name,
        status: form.status,
        capacity: form.capacity ? Number(form.capacity) : undefined,
        geometry: {
          type: 'Point',
          coordinates: [Number(form.longitude), Number(form.latitude)]
        }
      };
      await createOverlay(payload);
      setForm({ ...form, name: '', capacity: '', latitude: '', longitude: '' });
      await load();
    } catch (e) {
      // no-op
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (id) => {
    await deleteOverlay(id);
    await load();
  };

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Shelters & Resources</h2>
      <p className="text-sm text-gray-600 mb-4">Manage map overlays: shelters, medical camps, depots, blocked routes, advisories.</p>

      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-6">
        <select className="input-field md:col-span-2" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option value="shelter">Shelter</option>
          <option value="medicalCamp">Medical Camp</option>
          <option value="depot">Supply Depot</option>
          <option value="blockedRoute">Blocked Route</option>
          <option value="advisory">Advisory</option>
        </select>
        <input className="input-field md:col-span-2" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="input-field" placeholder="Latitude" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
        <input className="input-field" placeholder="Longitude" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
        <input className="input-field md:col-span-2" placeholder="Capacity (optional)" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
        <select className="input-field md:col-span-2" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button className="button-primary md:col-span-2" type="submit" disabled={loading}>{loading ? 'Saving...' : 'Add Overlay'}</button>
      </form>

      <div className="list-grid">
        {(items || []).map(item => (
          <div key={item._id} className="card">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">{item.name}</div>
              <span className="badge-status pending">{item.type}</span>
            </div>
            <div className="text-sm text-gray-700">
              <div>Status: {item.status || '—'} {typeof item.capacity === 'number' ? `• Capacity: ${item.capacity}` : ''}</div>
              {item.geometry?.type === 'Point' && item.geometry?.coordinates && (
                <div>Coords: {item.geometry.coordinates[1]?.toFixed(5)}, {item.geometry.coordinates[0]?.toFixed(5)}</div>
              )}
            </div>
            <div className="mt-3">
              <button className="button-secondary" onClick={() => onDelete(item._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShelterManagement;
