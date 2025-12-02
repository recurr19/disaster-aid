import React, { useMemo, useState, useRef } from 'react';
import { FileText, Download, TrendingUp, AlertTriangle, Users, CheckCircle, BarChart3, PieChart } from 'lucide-react';
import './authority.css';

const AutomatedBriefs = ({ mapData }) => {
  const [showBrief, setShowBrief] = useState(false);
  const briefRef = useRef(null);

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

  const downloadPDF = async () => {
    const element = briefRef.current;
    if (!element) return;

    try {
      const printWindow = window.open('', '', 'width=1200,height=800');
      
      const styles = `
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            padding: 20px;
            background: white;
            color: #111827;
          }
          .space-y-6 > * + * { margin-top: 1.5rem; }
          .space-y-4 > * + * { margin-top: 1rem; }
          .space-y-3 > * + * { margin-top: 0.75rem; }
          .space-y-2 > * + * { margin-top: 0.5rem; }
          
          /* Containers */
          .bg-white {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 1rem;
            padding: 1.5rem;
            margin-bottom: 1rem;
            page-break-inside: avoid;
          }
          
          /* Grid layouts */
          .grid { display: grid; gap: 1rem; }
          .grid-cols-1 { grid-template-columns: repeat(1, 1fr); }
          .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
          .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
          .grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
          
          /* Flex */
          .flex { display: flex; }
          .flex-1 { flex: 1; }
          .items-start { align-items: flex-start; }
          .items-center { align-items: center; }
          .justify-between { justify-content: space-between; }
          .justify-end { justify-content: flex-end; }
          .gap-1 { gap: 0.25rem; }
          .gap-2 { gap: 0.5rem; }
          .gap-3 { gap: 0.75rem; }
          .gap-4 { gap: 1rem; }
          
          /* Text styles */
          .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
          .text-2xl { font-size: 1.5rem; line-height: 2rem; }
          .text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
          .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
          .text-xs { font-size: 0.75rem; line-height: 1rem; }
          .font-bold { font-weight: 700; }
          .font-semibold { font-weight: 600; }
          .font-medium { font-weight: 500; }
          .text-gray-900 { color: #111827; }
          .text-gray-700 { color: #374151; }
          .text-gray-600 { color: #4b5563; }
          .text-gray-500 { color: #6b7280; }
          .text-gray-400 { color: #9ca3af; }
          .text-white { color: white; }
          .text-right { text-align: right; }
          .capitalize { text-transform: capitalize; }
          .uppercase { text-transform: uppercase; }
          
          /* Colors */
          .text-blue-600 { color: #2563eb; }
          .text-blue-700 { color: #1d4ed8; }
          .text-blue-900 { color: #1e3a8a; }
          .text-orange-600 { color: #ea580c; }
          .text-orange-700 { color: #c2410c; }
          .text-orange-900 { color: #7c2d12; }
          .text-green-600 { color: #16a34a; }
          .text-green-700 { color: #15803d; }
          .text-green-900 { color: #14532d; }
          .text-purple-600 { color: #9333ea; }
          .text-purple-700 { color: #7e22ce; }
          .text-purple-900 { color: #581c87; }
          .text-indigo-600 { color: #4f46e5; }
          .text-red-600 { color: #dc2626; }
          .text-red-900 { color: #7f1d1d; }
          
          /* Backgrounds */
          .bg-gray-50 { background: #f9fafb; }
          .bg-gray-100 { background: #f3f4f6; }
          .bg-red-50 { background: #fef2f2; }
          
          /* Stat cards with gradients */
          .bg-gradient-to-br {
            border-radius: 0.75rem;
            padding: 1.25rem;
            border: 2px solid;
          }
          .from-blue-50.to-blue-100 { background: linear-gradient(to bottom right, #eff6ff, #dbeafe); border-color: #93c5fd !important; }
          .from-orange-50.to-orange-100 { background: linear-gradient(to bottom right, #fff7ed, #ffedd5); border-color: #fdba74 !important; }
          .from-green-50.to-green-100 { background: linear-gradient(to bottom right, #f0fdf4, #dcfce7); border-color: #86efac !important; }
          .from-purple-50.to-purple-100 { background: linear-gradient(to bottom right, #faf5ff, #f3e8ff); border-color: #d8b4fe !important; }
          .from-green-50.to-emerald-50 { background: linear-gradient(to bottom right, #f0fdf4, #ecfdf5); border-color: #6ee7b7 !important; }
          .from-red-50.to-orange-50 { background: linear-gradient(to bottom right, #fef2f2, #fff7ed); border-color: #fca5a5 !important; }
          .from-blue-50.to-indigo-50 { background: linear-gradient(to bottom right, #eff6ff, #eef2ff); border-color: #a5b4fc !important; }
          
          /* Bar charts */
          .relative { position: relative; }
          .h-6 { height: 1.5rem; }
          .h-8 { height: 2rem; }
          .w-2 { width: 0.5rem; }
          .w-4 { width: 1rem; }
          .w-8 { width: 2rem; }
          .w-32 { width: 8rem; }
          .rounded { border-radius: 0.25rem; }
          .rounded-lg { border-radius: 0.5rem; }
          .rounded-xl { border-radius: 0.75rem; }
          .rounded-full { border-radius: 9999px; }
          .overflow-hidden { overflow: hidden; }
          .overflow-visible { overflow: visible; }
          
          /* Padding & Margin */
          .p-2 { padding: 0.5rem; }
          .p-3 { padding: 0.75rem; }
          .p-4 { padding: 1rem; }
          .p-5 { padding: 1.25rem; }
          .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
          .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
          .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
          .mb-1 { margin-bottom: 0.25rem; }
          .mb-2 { margin-bottom: 0.5rem; }
          .mb-4 { margin-bottom: 1rem; }
          .mb-6 { margin-bottom: 1.5rem; }
          .mt-2 { margin-top: 0.5rem; }
          .mt-4 { margin-top: 1rem; }
          .mt-6 { margin-top: 1.5rem; }
          .ml-2 { margin-left: 0.5rem; }
          .pt-4 { padding-top: 1rem; }
          
          /* Borders */
          .border { border: 1px solid #e5e7eb; }
          .border-2 { border: 2px solid; }
          .border-t { border-top: 1px solid #e5e7eb; }
          .border-l-4 { border-left: 4px solid; }
          .border-gray-200 { border-color: #e5e7eb; }
          .border-blue-200 { border-color: #bfdbfe; }
          .border-red-200 { border-color: #fecaca; }
          .border-green-200 { border-color: #bbf7d0; }
          .border-red-500 { border-color: #ef4444; }
          
          /* Bar colors */
          .bg-blue-600 { background: #2563eb; }
          .bg-red-600 { background: #dc2626; }
          .bg-blue-500 { background: #3b82f6; }
          .bg-red-500 { background: #ef4444; }
          
          /* Crisis Overview Card - authority.css */
          .crisis-overview-card { 
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 0.75rem;
            padding: 1.25rem;
            margin-bottom: 1.5rem;
            page-break-inside: avoid;
          }
          
          .co-header { 
            display: flex; 
            align-items: center; 
            justify-content: space-between; 
            gap: 1rem;
            margin-bottom: 1rem;
          }
          
          .co-title { 
            font-size: 1.125rem; 
            font-weight: 700; 
            margin: 0; 
            color: #0f172a;
          }
          
          .co-sub { 
            margin: 0.25rem 0 0; 
            font-size: 0.95rem;
            color: #6b7280;
          }
          
          .co-footer {
            padding-top: 1rem;
            border-top: 1px solid #e5e7eb;
            margin-top: 1rem;
          }
          
          .co-grid { 
            display: grid; 
            grid-template-columns: repeat(4, 1fr); 
            gap: 1rem; 
            margin-top: 1rem;
          }
          
          /* Stat Cards - authority.css */
          .stat-card { 
            display: flex; 
            gap: 1rem; 
            align-items: center; 
            background: linear-gradient(180deg, rgba(255,255,255,0.9), rgba(249,250,251,0.4)); 
            padding: 1rem; 
            border-radius: 0.75rem; 
            box-shadow: 0 4px 12px rgba(2,6,23,0.04); 
            border: 1px solid #e5e7eb;
            page-break-inside: avoid;
          }
          
          .stat-left { 
            width: 64px; 
            display: flex; 
            align-items: center; 
            justify-content: center;
          }
          
          .stat-icon { 
            width: 52px; 
            height: 52px; 
            border-radius: 12px; 
            display: flex; 
            align-items: center; 
            justify-content: center;
          }
          
          /* Icon backgrounds - authority.css */
          .bg-ghost { background: linear-gradient(135deg, rgba(37,99,235,0.15), rgba(37,99,235,0.05)); }
          .bg-amber { background: linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05)); }
          .bg-success { background: linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05)); }
          .bg-violet { background: linear-gradient(135deg, rgba(139,92,246,0.15), rgba(139,92,246,0.05)); }
          
          .stat-main { 
            flex: 1; 
            min-width: 0;
          }
          
          .stat-label { 
            font-size: 0.85rem; 
            color: #6b7280; 
            margin-bottom: 0.25rem;
            font-weight: 500;
          }
          
          .stat-value { 
            font-size: 1.75rem; 
            font-weight: 800; 
            color: #0f172a;
            line-height: 1.2;
          }
          
          .stat-value.accent { color: #f59e0b; }
          .stat-value.success { color: #22c55e; }
          
          .stat-note { 
            font-size: 0.85rem; 
            color: #6b7280; 
            margin-top: 0.25rem;
          }
          
          /* Hide interactive elements */
          .hidden { display: none !important; }
          .group-hover\\:block { display: none !important; }
          svg { display: none !important; }
          
          @media print {
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            .bg-white { box-shadow: none; }
            @page { margin: 0.5cm; size: A4; }
          }
        </style>
      `;
      
      printWindow.document.write(`
        <html>
          <head>
            <title>Situation Brief - ${new Date().toLocaleDateString()}</title>
            ${styles}
          </head>
          <body>
            <h1 style="font-size: 1.875rem; font-weight: 700; color: #4f46e5; margin-bottom: 1.5rem;">
              DisasterAid Situation Brief
            </h1>
            <p style="color: #6b7280; margin-bottom: 2rem; font-size: 0.875rem;">
              Generated on ${new Date().toLocaleString()}
            </p>
            ${element.innerHTML}
          </body>
        </html>
      `);
      
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const helpTypeStats = useMemo(() => {
    return Object.entries(summary.byHelp)
      .map(([key, total]) => ({
        name: key,
        total,
        sos: summary.byHelpSOS[key] || 0,
        normal: summary.byHelpNormal[key] || 0
      }))
      .sort((a, b) => b.total - a.total);
  }, [summary]);

  const maxValue = helpTypeStats[0]?.total || 1;

  return (
    <div className="space-y-6">
      {/* Header matching authority dashboard style */}
      <div className="crisis-overview-card">
        <div className="co-header">
          <div className="flex items-center gap-3">
            <div className="stat-icon bg-ghost">
              <FileText className="icon" />
            </div>
            <div>
              <h2 className="co-title">Automated Briefs</h2>
              <p className="co-sub">Visual situation reports with downloadable PDF</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowBrief(!showBrief)}
              className="nav-button active"
            >
              <BarChart3 className="w-4 h-4" />
              <span>{showBrief ? 'Hide' : 'Generate'} Brief</span>
            </button>
            {showBrief && (
              <button 
                onClick={downloadPDF}
                className="nav-button"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {showBrief && (
        <div ref={briefRef} className="space-y-6">
          {/* Stats Overview */}
          <div className="crisis-overview-card">
            <div className="co-header">
              <h3 className="co-title">Situation Brief</h3>
              <p className="text-sm text-gray-500">{new Date().toLocaleString()}</p>
            </div>

            <div className="co-grid">
              <div className="stat-card">
                <div className="stat-left">
                  <div className="stat-icon bg-ghost">
                    <Users className="icon" />
                  </div>
                </div>
                <div className="stat-main">
                  <div className="stat-label">Total Requests</div>
                  <div className="stat-value">{summary.total}</div>
                  <div className="stat-note">SOS: {summary.sos} • Normal: {summary.normal}</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-left">
                  <div className="stat-icon bg-amber">
                    <AlertTriangle className="icon" />
                  </div>
                </div>
                <div className="stat-main">
                  <div className="stat-label">Unassigned</div>
                  <div className="stat-value accent">{summary.unassigned}</div>
                  <div className="stat-note">SOS: {summary.unassignedSOS} • Normal: {summary.unassignedNormal}</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-left">
                  <div className="stat-icon bg-success">
                    <CheckCircle className="icon" />
                  </div>
                </div>
                <div className="stat-main">
                  <div className="stat-label">Resolved</div>
                  <div className="stat-value success">{summary.resolvedSOS + summary.resolvedNormal}</div>
                  <div className="stat-note">SOS: {summary.resolvedSOS} • Normal: {summary.resolvedNormal}</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-left">
                  <div className="stat-icon bg-violet">
                    <TrendingUp className="icon" />
                  </div>
                </div>
                <div className="stat-main">
                  <div className="stat-label">Recent (3h)</div>
                  <div className="stat-value">{Object.values(summary.trendByHelp).reduce((sum, v) => sum + v.recent, 0)}</div>
                  <div className="stat-note">Last 3 hours</div>
                </div>
              </div>
            </div>
          </div>

          {/* Response Efficiency Metrics */}
          <div className="crisis-overview-card">
            <div className="co-header">
              <div className="flex items-center gap-2">
                <div className="stat-icon bg-success">
                  <CheckCircle className="icon" />
                </div>
                <h3 className="co-title">Response Efficiency</h3>
              </div>
            </div>
            
            <div className="co-grid">
              {/* Resolution Rate */}
              <div className="stat-card">
                <div className="stat-main">
                  <div className="stat-label">Resolution Rate</div>
                  <div className="stat-value success">
                    {summary.total > 0 ? ((summary.resolvedSOS + summary.resolvedNormal) / summary.total * 100).toFixed(1) : 0}%
                  </div>
                  <div className="stat-note">
                    {summary.resolvedSOS + summary.resolvedNormal} of {summary.total} resolved
                  </div>
                </div>
              </div>

              {/* SOS Response Rate */}
              <div className="stat-card">
                <div className="stat-main">
                  <div className="stat-label">SOS Response Rate</div>
                  <div className="stat-value accent">
                    {summary.sos > 0 ? ((summary.sos - summary.unassignedSOS) / summary.sos * 100).toFixed(1) : 0}%
                  </div>
                  <div className="stat-note">
                    {summary.sos - summary.unassignedSOS} of {summary.sos} assigned
                  </div>
                </div>
              </div>

              {/* Assignment Rate */}
              <div className="stat-card">
                <div className="stat-main">
                  <div className="stat-label">Assignment Rate</div>
                  <div className="stat-value">
                    {summary.total > 0 ? ((summary.total - summary.unassigned) / summary.total * 100).toFixed(1) : 0}%
                  </div>
                  <div className="stat-note">
                    {summary.total - summary.unassigned} of {summary.total} assigned
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Critical Areas Summary */}
          <div className="crisis-overview-card">
            <div className="co-header">
              <div className="flex items-center gap-2">
                <div className="stat-icon bg-amber">
                  <AlertTriangle className="icon" />
                </div>
                <h3 className="co-title">Critical Needs Summary</h3>
              </div>
            </div>
            
            <div className="co-grid grid-cols-2 md:grid-cols-4">
              {helpTypeStats.slice(0, 8).map((item) => (
                <div key={item.name} className="stat-card">
                  <div className="stat-main">
                    <div className="stat-label capitalize">{item.name}</div>
                    <div className="stat-value">{item.total}</div>
                    <div className="stat-note flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        {item.normal}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        <span className="font-semibold">{item.sos}</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="co-footer">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Top 3 priorities:</span>{' '}
                {helpTypeStats.slice(0, 3).map(item => `${item.name} (${item.total})`).join(', ')}
              </p>
            </div>
          </div>

          {/* Stacked Graph Visualization */}
          <div className="crisis-overview-card">
            <div className="co-header">
              <div className="flex items-center gap-2">
                <div className="stat-icon bg-ghost">
                  <BarChart3 className="icon" />
                </div>
                <h3 className="co-title">Stacked Graph (Normal | SOS)</h3>
              </div>
            </div>
            
            <div className="space-y-3">
              {helpTypeStats.map((item) => {
                const totalWidth = 100; // Full width bar
                const normalPercent = (item.normal / item.total) * 100;
                const sosPercent = (item.sos / item.total) * 100;
                
                return (
                  <div key={item.name} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700 capitalize w-32 text-right">{item.name}</span>
                    <div className="flex-1 flex items-center gap-1">
                      <span className="text-gray-400">|</span>
                      <div className="flex-1 h-6 bg-gray-100 rounded overflow-visible flex relative">
                        <div 
                          className="bg-blue-600 flex items-center justify-center text-white text-xs font-bold transition-all duration-200 hover:shadow-[0_0_20px_rgba(59,130,246,0.8)] cursor-pointer relative group"
                          style={{ width: `${normalPercent}%` }}
                        >
                          {normalPercent > 10 && ''.repeat(Math.ceil(normalPercent / 10))}
                          <div className="absolute hidden group-hover:block bg-gray-900 text-white text-xs rounded py-1 px-2 -top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap z-50 pointer-events-none shadow-lg">
                            Normal: {item.normal} ({normalPercent.toFixed(1)}%)
                            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
                          </div>
                        </div>
                        <div 
                          className="bg-red-600 flex items-center justify-center text-white text-xs font-bold transition-all duration-200 hover:shadow-[0_0_20px_rgba(239,68,68,0.8)] cursor-pointer relative group"
                          style={{ width: `${sosPercent}%` }}
                        >
                          {sosPercent > 10 && ''.repeat(Math.ceil(sosPercent / 10))}
                          <div className="absolute hidden group-hover:block bg-gray-900 text-white text-xs rounded py-1 px-2 -top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap z-50 pointer-events-none shadow-lg">
                            SOS: {item.sos} ({sosPercent.toFixed(1)}%)
                            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
                          </div>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-gray-900 ml-2 w-8">{item.total}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Trends Section */}
          {Object.keys(summary.trendByHelp).length > 0 && (
            <div className="crisis-overview-card">
              <div className="co-header">
                <div className="flex items-center gap-2">
                  <div className="stat-icon bg-violet">
                    <TrendingUp className="icon" />
                  </div>
                  <h3 className="co-title">Trends</h3>
                </div>
              </div>
              
              <div className="space-y-2">
                {Object.entries(summary.trendByHelp)
                  .filter(([_, v]) => v.recent > 0 || v.prev > 0)
                  .map(([key, value]) => (
                    <div key={key} className="text-sm text-gray-700">
                      <span className="font-medium capitalize">- {key}:</span>{' '}
                      <span className="font-semibold text-gray-900">{value.recent}</span> in last 3h{' '}
                      <span className={`font-semibold ${value.pct > 0 ? 'text-red-600' : value.pct < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                        ({value.pct > 0 ? '+' : ''}{value.pct}% vs previous 3h)
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Suggested Actions */}
          <div className="crisis-overview-card">
            <div className="co-header">
              <div className="flex items-center gap-2">
                <div className="stat-icon bg-amber">
                  <AlertTriangle className="icon" />
                </div>
                <h3 className="co-title">Suggested Actions</h3>
              </div>
            </div>
            
            <div className="space-y-2">
              {(() => {
                const suggestions = [];
                const foodNeed = summary.byHelp['food'] || summary.byHelp['food_packets'] || 0;
                if (foodNeed > 200) suggestions.push(`Deploy ${Math.ceil(foodNeed / 200)} food distribution teams`);
                const waterNeed = summary.byHelp['water'] || 0;
                if (waterNeed > 100) suggestions.push(`Send ${Math.ceil(waterNeed / 100)} water tankers`);
                const medicalNeed = summary.byHelp['medical'] || 0;
                if (medicalNeed > 50) suggestions.push(`Mobilize ${Math.ceil(medicalNeed / 50)} medical response teams`);
                const shelterNeed = summary.byHelp['shelter'] || 0;
                if (shelterNeed > 30) suggestions.push(`Arrange temporary shelter facilities for ${shelterNeed} requests`);
                if (summary.sos > 0) suggestions.push(`Prioritize ${summary.sos} SOS requests for immediate response`);
                if (summary.unassignedSOS > 0) suggestions.push(`Urgent: ${summary.unassignedSOS} unassigned SOS requests need immediate attention`);
                
                return suggestions.length > 0 ? (
                  suggestions.map((suggestion, idx) => (
                    <div key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-orange-600 font-bold">-</span>
                      <span>{suggestion}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">No specific actions suggested at this time.</p>
                );
              })()}
            </div>
          </div>

          {/* Shelter Capacity */}
          {summary.sheltersNearCapacity.length > 0 && (
            <div className="crisis-overview-card">
              <div className="co-header">
                <h3 className="co-title">Shelter Capacity Alerts</h3>
              </div>
              <div className="space-y-3">
                {summary.sheltersNearCapacity.slice(0, 5).map((shelter, idx) => (
                  <div key={idx} className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{shelter.name}</p>
                        {shelter.city && <p className="text-sm text-gray-600">{shelter.city}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-red-600">{shelter.pct}%</p>
                        <p className="text-xs text-gray-600">{shelter.occupied}/{shelter.cap}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!showBrief && (
        <div className="crisis-overview-card text-center py-12">
          <PieChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="co-title">No brief generated yet</h3>
          <p className="co-sub mt-2">Click "Generate Brief" to create visual analytics report</p>
        </div>
      )}
    </div>
  );
};

export default AutomatedBriefs;
