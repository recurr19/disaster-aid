import React, { useMemo, useState } from 'react';
import './authority.css';

const AutomatedBriefs = ({ mapData }) => {
  const [brief, setBrief] = useState('');

  const summary = useMemo(() => {
    const features = mapData?.tickets?.features ? mapData.tickets.features : [];
    const overlays = mapData?.overlays ? mapData.overlays : {};
    const now = Date.now();
    const total = features.length;
    const sos = features.filter(f => f.properties && f.properties.isSOS).length;
    const normal = total - sos;
    const unassigned = features.filter(f => !(f.properties && f.properties.assignedTo)).length;
    const unassignedSOS = features.filter(f => !(f.properties && f.properties.assignedTo) && f.properties && f.properties.isSOS).length;
    const unassignedNormal = features.filter(f => !(f.properties && f.properties.assignedTo) && !(f.properties && f.properties.isSOS)).length;

    const resolvedStatuses = ['resolved','closed','fulfilled','completed'];
    const resolvedSOS = features.filter(f => (f.properties && resolvedStatuses.includes(String(f.properties.status || '').toLowerCase())) && (f.properties && f.properties.isSOS)).length;
    const resolvedNormal = features.filter(f => (f.properties && resolvedStatuses.includes(String(f.properties.status || '').toLowerCase())) && !(f.properties && f.properties.isSOS)).length;

    const byHelp = {};
    const byHelpSOS = {};
    const byHelpNormal = {};
    features.forEach(f => {
      const isS = !!(f.properties && f.properties.isSOS);
      (f.properties?.helpTypes || []).forEach(h => {
        byHelp[h] = (byHelp[h] || 0) + 1;
        if (isS) byHelpSOS[h] = (byHelpSOS[h] || 0) + 1;
        else byHelpNormal[h] = (byHelpNormal[h] || 0) + 1;
      });
    });

    // Trend: compare last 3 hours vs previous 3 hours for each help type
    const THREE_HOURS = 3 * 60 * 60 * 1000;
    const recentWindow = features.filter(f => {
      const t = f.properties?.createdAt ? new Date(f.properties.createdAt).getTime() : (f.properties?.createdAt ? Date.parse(f.properties.createdAt) : null);
      return t && (now - t) <= THREE_HOURS;
    });
    const prevWindow = features.filter(f => {
      const t = f.properties?.createdAt ? new Date(f.properties.createdAt).getTime() : (f.properties?.createdAt ? Date.parse(f.properties.createdAt) : null);
      return t && (now - t) > THREE_HOURS && (now - t) <= (2 * THREE_HOURS);
    });

    const trendByHelp = {};
    const helpTypes = Object.keys(byHelp);
    helpTypes.forEach(h => {
      const recentCount = recentWindow.filter(f => (f.properties?.helpTypes || []).includes(h)).length;
      const prevCount = prevWindow.filter(f => (f.properties?.helpTypes || []).includes(h)).length;
      const change = prevCount === 0 ? (recentCount > 0 ? 100 : 0) : Math.round(((recentCount - prevCount) / prevCount) * 100);
      trendByHelp[h] = { recent: recentCount, prev: prevCount, pct: change };
    });

    // Shelters capacity analysis
    const shelters = overlays.shelters || [];
    let totalShelterCapacity = 0;
    let sheltersNearCapacity = [];
    shelters.forEach(s => {
      const cap = s.capacity || (s.properties && s.properties.capacity) || 0;
      const occupied = s.properties && (s.properties.occupied || s.properties.occupancy || s.properties.current) ? (s.properties.occupied || s.properties.current || s.properties.occupancy) : null;
      totalShelterCapacity += cap;
      if (cap && occupied != null) {
        const pct = Math.round((occupied / cap) * 100);
        if (pct >= 80) sheltersNearCapacity.push({ name: s.name, pct, cap, occupied, city: s.properties?.city });
      }
    });

    // hourly counts for last 6 hours for a simple line graph
    const HOURS = 6;
    const hourBins = new Array(HOURS).fill(0);
    features.forEach(f => {
      const t = f.properties?.createdAt ? new Date(f.properties.createdAt).getTime() : (f.properties?.createdAt ? Date.parse(f.properties.createdAt) : null);
      if (!t) return;
      const hoursAgo = Math.floor((now - t) / (60 * 60 * 1000));
      if (hoursAgo >= 0 && hoursAgo < HOURS) {
        // place older hours earlier in array
        hourBins[HOURS - 1 - hoursAgo] += 1;
      }
    });

    return { total, sos, normal, unassigned, unassignedSOS, unassignedNormal, resolvedSOS, resolvedNormal, byHelp, byHelpSOS, byHelpNormal, trendByHelp, shelters, totalShelterCapacity, sheltersNearCapacity, hourBins };
  }, [mapData]);

  const generate = () => {
    const lines = [];
    lines.push(`Situation Brief — ${new Date().toLocaleString()}`);
    lines.push('');
    // Summary block (each metric on its own line for readability)
    lines.push('Summary:');
    lines.push(` Total requests: ${summary.total}`);
    lines.push(` Normal requests: ${summary.normal}`);
    lines.push(` SOS requests: ${summary.sos}`);
    lines.push('');
    lines.push(' Unassigned:');
    lines.push(`  - Normal: ${summary.unassignedNormal}`);
    lines.push(`  - SOS: ${summary.unassignedSOS}`);
    lines.push('');
    lines.push(' Resolved:');
    lines.push(`  - Normal: ${summary.resolvedNormal}`);
    lines.push(`  - SOS: ${summary.resolvedSOS}`);
    lines.push('');

    // Help type stats with SOS vs Normal breakdown
    const helpKeys = Object.keys(summary.byHelp || {});
    if (helpKeys.length > 0) {
      lines.push('Analysis:');
      const stats = helpKeys.map(k => {
        const totalH = summary.byHelp[k] || 0;
        const sosH = summary.byHelpSOS[k] || 0;
        const normalH = summary.byHelpNormal[k] || 0;
        return { k, total: totalH, sos: sosH, normal: normalH };
      }).sort((a, b) => b.total - a.total);

      const top = stats.slice(0, 8);
      const maxCount = top[0] ? top[0].total : 1;

      // Simple counts list + short bar
      top.forEach(item => {
        const barLen = maxCount > 0 ? Math.round((item.total / maxCount) * 20) : 0;
        const bar = '#'.repeat(barLen || 0);
        lines.push(` - ${item.k}: ${item.total} (SOS:${item.sos} Normal:${item.normal}) ${bar}`);
      });

      // (hourly numeric line removed as requested)

      // Stacked graph (Normal = ▇, SOS = ░)
      lines.push('Graph (stacked: Normal ▇ | SOS ░ ):');
      top.forEach(item => {
        const width = 40;
        const totalLen = maxCount > 0 ? Math.round((item.total / maxCount) * width) : 0;
        const sosLen = item.sos > 0 ? Math.round((item.sos / (item.total || 1)) * totalLen) : 0;
        const normalLen = Math.max(0, totalLen - sosLen);
        const normalBar = '▇'.repeat(normalLen);
        const sosBar = '░'.repeat(sosLen);
        lines.push(`${item.k.padEnd(15)} | ${normalBar}${sosBar} ${item.total}`);
      });
    }

    // top help types
    const helpEntries = Object.entries(summary.byHelp).sort((a, b) => b[1] - a[1]);
    if (helpEntries.length > 0) {
      const top = helpEntries.slice(0, 3).map(h => `${h[0]} (${h[1]})`).join(', ');
      lines.push(`Most requested: ${top}.`);
    }

    // per-help trends
    const trendLines = [];
    Object.entries(summary.trendByHelp).forEach(([k, v]) => {
      if (v.recent > 0 || v.prev > 0) {
        const sign = v.pct > 0 ? `+${v.pct}%` : `${v.pct}%`;
        trendLines.push(`${k}: ${v.recent} in last 3h (${sign} vs previous 3h)`);
      }
    });
    if (trendLines.length > 0) {
      lines.push('Trends:');
      trendLines.forEach(t => lines.push(` - ${t}`));
    }

    // Shelters / capacity
    if (summary.shelters.length > 0) {
      if (summary.sheltersNearCapacity.length > 0) {
        const s = summary.sheltersNearCapacity.slice(0, 3).map(x => `${x.name} (${x.pct}% full${x.city ? ' • ' + x.city : ''})`).join('; ');
        lines.push(`Shelters near capacity: ${s}.`);
      } else if (summary.totalShelterCapacity > 0) {
        lines.push(`Total shelter capacity reported: ${summary.totalShelterCapacity}.`);
      }
    }

    // Suggested actions (heuristic)
    const suggestions = [];
    const foodNeed = summary.byHelp['food'] || summary.byHelp['food_packets'] || 0;
    if (foodNeed > 200) suggestions.push(`Deploy ${Math.ceil(foodNeed / 200)} food distribution teams`);
    const waterNeed = summary.byHelp['water'] || 0;
    if (waterNeed > 100) suggestions.push(`Send ${Math.ceil(waterNeed / 100)} water tankers`);
    if (summary.sos > 0) suggestions.push(`Prioritize ${summary.sos} SOS requests for immediate response`);
    if (suggestions.length > 0) {
      lines.push('Suggested actions:');
      suggestions.forEach(s => lines.push(` - ${s}`));
    }

    setBrief(lines.join('\n'));
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(brief);
      alert('Copied to clipboard');
    } catch (e) {
      alert('Copy failed');
    }
  };

  const download = () => {
    const blob = new Blob([brief], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brief-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Automated Briefs</h2>
      <p className="text-sm text-gray-600">Generate plain-English situation briefs for stakeholders. Briefs include counts, short trends, shelter capacity notes and suggested actions.</p>
      <div className="mt-4 grid grid-cols-1 gap-3">
        <div className="flex gap-3">
          <button className="button-primary" onClick={generate}>Generate Brief</button>
          <button className="button-secondary" onClick={copy} disabled={!brief}>Copy</button>
          <button className="button-secondary" onClick={download} disabled={!brief}>Download</button>
        </div>
        {brief && (
          <pre className="p-4 bg-gray-50 rounded text-sm whitespace-pre-wrap">{brief}</pre>
        )}
      </div>
    </div>
  );
};

export default AutomatedBriefs;
