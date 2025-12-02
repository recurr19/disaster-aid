import React from 'react';
import { Activity, CheckCircle, AlertTriangle } from 'lucide-react';
import './authority.css';

const CrisisOverview = ({ mapData, loading }) => {
  const features = mapData && mapData.tickets && mapData.tickets.features ? mapData.tickets.features : [];

  // Total Tickets: all tickets that are not closed/resolved/canceled (both SOS and normal)
  const total = features.filter(f => {
    const s = f.properties && f.properties.status ? String(f.properties.status).toLowerCase() : '';
    return !['closed','resolved','canceled'].includes(s);
  }).length;

  // Active Tickets: non-SOS tickets that are not closed/resolved/canceled
  const active = features.filter(f => {
    const s = f.properties && f.properties.status ? String(f.properties.status).toLowerCase() : '';
    const isClosed = ['closed','resolved','canceled'].includes(s);
    const isSOS = !!(f.properties && f.properties.isSOS);
    return !isClosed && !isSOS;
  }).length;

  // Resolved Today: tickets (SOS or normal) that were closed today.
  // Prefer explicit `closedAt` if available, otherwise fall back to createdAt (best-effort).
  const resolvedToday = features.filter(f => {
    if (!f.properties) return false;
    const s = f.properties.status ? String(f.properties.status).toLowerCase() : '';
    if (s !== 'closed') return false;
    const closedAt = f.properties.closedAt || f.properties.updatedAt || f.properties.modifiedAt || f.properties.createdAt;
    if (!closedAt) return false;
    const d = new Date(closedAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  // Active SoS tickets: SOS tickets that are not closed/resolved/canceled
  const activeSoS = features.filter(f => {
    const isSOS = !!(f.properties && f.properties.isSOS);
    const s = f.properties && f.properties.status ? String(f.properties.status).toLowerCase() : '';
    const isClosed = ['closed','resolved','canceled'].includes(s);
    return isSOS && !isClosed;
  }).length;

  const resolvedPercent = total > 0 ? Math.round((resolvedToday / total) * 100) : 0;

  return (
    <div className="crisis-overview-card">
      <div className="co-header">
        <div>
          <h2 className="co-title">Crisis Overview</h2>
          <p className="co-sub">Summary information and recent alerts will appear here.</p>
        </div>
      </div>

      <div className="co-grid">
        <div className="stat-card">
          <div className="stat-left">
            <div className="stat-icon bg-ghost">
              <Activity className="icon" />
            </div>
          </div>
          <div className="stat-main">
            <div className="stat-label">Total Tickets</div>
            <div className="stat-value">{loading ? '…' : total}</div>
            <div className="stat-note">Currently tracked active incidents</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-left">
            <div className="stat-icon bg-amber">
              <AlertTriangle className="icon" />
            </div>
          </div>
          <div className="stat-main">
            <div className="stat-label">Active Tickets</div>
            <div className="stat-value accent">{loading ? '…' : active}</div>
            <div className="stat-note">Unassigned or in-progress (non-SOS)</div>
          </div>
        </div>

        <div className="stat-card stat-highlight">
          <div className="stat-left">
            <div className="donut-wrap">
              <svg className="donut" viewBox="0 0 36 36">
                <path className="donut-bg" d="M18 2.0845a15.9155 15.9155 0 1 0 0 31.831 15.9155 15.9155 0 1 0 0-31.831" />
                <path className="donut-fg" strokeDasharray={`${resolvedPercent}, 100`} d="M18 2.0845a15.9155 15.9155 0 1 0 0 31.831 15.9155 15.9155 0 1 0 0-31.831" />
              </svg>
            </div>
          </div>
          <div className="stat-main">
            <div className="stat-label">Resolved Today</div>
            <div className="stat-value success">{loading ? '…' : resolvedToday}</div>
            <div className="stat-note">{resolvedPercent}% of today's tracked tickets</div>
          </div>
        </div>
      </div>

      <div className="co-footer">
        <div className="sos-panel">
          <div className="sos-left">
            <div className="sos-icon"><AlertTriangle className="icon" /></div>
          </div>
          <div className="sos-main">
            <div className="sos-label">Active SoS Tickets</div>
            <div className="sos-value">{loading ? '…' : activeSoS}</div>
            <div className="sos-note">Immediate attention required</div>
          </div>
        </div>

        <div className="co-meta">Total tracked tickets: <strong>{total}</strong></div>
      </div>
    </div>
  );
};

export default CrisisOverview;
