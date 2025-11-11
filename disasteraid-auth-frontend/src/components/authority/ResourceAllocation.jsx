import React, { useEffect, useState } from 'react';
import './authority.css';
import { listOverlays, createOverlay, deleteOverlay } from '../../api/authority';

const ResourceAllocation = () => {
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', latitude: '', longitude: '', capacity: '' });

  const load = async () => {
    try {
      setLoading(true);
      const res = await listOverlays();
      // Filter depots (resource allocations)
      const items = (res.items || []).filter(i => i.type === 'depot');
      setAllocations(items);
    } catch (e) {
      setAllocations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.latitude || !form.longitude) {
      alert('Please provide name and coordinates');
      return;
    }
    try {
      setLoading(true);
      const payload = {
        type: 'depot',
        name: form.name,
        status: 'active',
        capacity: form.capacity ? Number(form.capacity) : undefined,
        geometry: { type: 'Point', coordinates: [Number(form.longitude), Number(form.latitude)] }
      };
      await createOverlay(payload);
      setForm({ name: '', latitude: '', longitude: '', capacity: '' });
      await load();
    } catch (err) {
      console.error(err);
      alert('Failed to create allocation');
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (id) => {
    /* eslint-disable-next-line no-restricted-globals */
    if (!confirm('Delete this allocation?')) return;
    try {
      setLoading(true);
      await deleteOverlay(id);
      await load();
    } catch (e) {
      console.error(e);
      alert('Delete failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Resource Allocation</h2>
      <p className="text-sm text-gray-600">Allocate resources (depots) across affected zones. These are saved as overlays.</p>

      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-6">
        <input className="input-field md:col-span-2" placeholder="Depot name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="input-field" placeholder="Latitude" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
        <input className="input-field" placeholder="Longitude" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
        <input className="input-field md:col-span-2" placeholder="Capacity (optional)" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
        <button className="button-primary md:col-span-2" type="submit" disabled={loading}>{loading ? 'Saving...' : 'Add Depot'}</button>
      </form>

      <div>
        <h3 className="font-semibold mb-2">Existing Depots</h3>
        {loading && <div className="text-sm text-gray-500">Loading...</div>}
        {!loading && allocations.length === 0 && <div className="text-sm text-gray-500">No depots found.</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
          {allocations.map(a => (
            <div key={a._id} className="card">
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold">{a.name}</div>
                <span className="badge-status">Depot</span>
              </div>
              <div className="text-sm text-gray-700 mb-2">Status: {a.status || '—'} {typeof a.capacity === 'number' ? `• Capacity: ${a.capacity}` : ''}</div>
              {a.geometry?.type === 'Point' && a.geometry?.coordinates && (
                <div className="text-sm text-gray-600 mb-2">Coords: {a.geometry.coordinates[1]?.toFixed(5)}, {a.geometry.coordinates[0]?.toFixed(5)}</div>
              )}
              <div>
                <button className="button-secondary" onClick={() => onDelete(a._id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResourceAllocation;
