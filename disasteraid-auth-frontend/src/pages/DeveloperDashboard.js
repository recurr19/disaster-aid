import { useEffect, useState, useRef } from 'react';
import MetricCard from '../components/developer/MetricCard';
import APIEndpointCard from '../components/developer/APIEndpointCard';
import DBPerformancePanel from '../components/developer/DBPerformancePanel';
import ArchitectureDiagram from '../components/developer/ArchitectureDiagram';
import API from '../api/axios';

const DeveloperDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await API.get('/dev/metrics');
      if (res.data && res.data.success) setMetrics(res.data.metrics);
    } catch (e) {
      // metrics endpoint not available
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    intervalRef.current = setInterval(fetchMetrics, 10000); // 10s
    return () => clearInterval(intervalRef.current);
  }, []);

  // Fallback: if metrics not available, show placeholders and connection hint
  const showConnectHint = !loading && !metrics;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Developer Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">
                Real-time monitoring, API analytics, and system performance metrics
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span>Live • Auto-refresh every 10s</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Metrics populate automatically when backend is active
              </p>
            </div>
          </div>
        </div>

        {showConnectHint && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            Metrics endpoint not available. To enable live metrics, expose a backend endpoint at <code>/api/dev/metrics</code> returning JSON <code>{'{"success":true,"metrics":{}}'}</code>.
          </div>
        )}

        {/* Architecture Diagram */}
        <ArchitectureDiagram />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <MetricCard
            title="CPU Load"
            value={metrics?.cpu?.loadAvg?.toFixed?.(2) ?? '--'}
            unit="%"
            delta={metrics?.cpu?.delta}
            description="Server CPU usage percentage - measures processing power consumption"
          >
            <div className="w-28 h-9">
              <MetricCardSpark data={metrics?.cpu?.history || [0,0,0,0,0]} />
            </div>
          </MetricCard>

          <MetricCard
            title="Memory"
            value={metrics?.memory?.usedPercent ?? '--'}
            unit="%"
            delta={metrics?.memory?.delta}
            description="RAM usage percentage - indicates memory allocation and availability"
          >
            <div className="w-28 h-9">
              <MetricCardSpark data={metrics?.memory?.history || [0,0,0,0,0]} />
            </div>
          </MetricCard>

          <MetricCard
            title="Request Queue"
            value={metrics?.requests?.queueLength ?? '--'}
            unit="items"
            delta={metrics?.requests?.delta}
            description="Number of pending requests waiting to be processed"
          >
            <div className="w-28 h-9">
              <MetricCardSpark data={metrics?.requests?.history || [0,0,0,0,0]} />
            </div>
          </MetricCard>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">API Health</h3>
            <div className="grid grid-cols-1 gap-3">
              <MetricCard
                title="Success Rate"
                value={metrics?.api?.successRate ? `${metrics.api.successRate}%` : '--'}
                unit=""
                description="Percentage of successful API responses (2xx status codes)"
              />
              <MetricCard
                title="Avg Latency"
                value={metrics?.api?.avgLatency ?? '--'}
                unit="ms"
                description="Average response time across all API endpoints"
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Total API Metrics</h3>
            <div className="grid grid-cols-1 gap-3">
              <MetricCard
                title="Total Requests"
                value={metrics?.totalRequests ?? '--'}
                unit=""
                description="Total number of API requests processed"
              />
              <MetricCard
                title="Overall Success Rate"
                value={metrics?.totalSuccessRate ? `${metrics.totalSuccessRate}%` : '--'}
                unit=""
                description="Combined success rate across all endpoints"
              />
            </div>
          </div>
        </div>

        {/* DB Performance Section */}
        <div className="mt-6">
          <DBPerformancePanel dbMetrics={metrics?.db} />
        </div>

        {/* API Endpoint Analytics Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">API Endpoint Analytics</h3>
            {metrics?.totalEndpoints && (
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-600">
                  Total Endpoints: <span className="font-semibold text-gray-900">{metrics.totalEndpoints}</span>
                </span>
                <span className="text-gray-600">
                  Active: <span className="font-semibold text-green-600">{metrics.activeEndpoints}</span>
                </span>
                <span className="text-gray-600">
                  Inactive: <span className="font-semibold text-gray-400">{metrics.totalEndpoints - metrics.activeEndpoints}</span>
                </span>
              </div>
            )}
          </div>

          {/* API Endpoints Info Banner */}
          <div className="mb-4 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-indigo-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-indigo-900 font-medium mb-1">
                  Endpoint Tracking
                </p>
                <p className="text-xs text-indigo-700">
                  All {metrics?.totalEndpoints || '30+'} API endpoints are listed below with their request/response structures. 
                  Endpoints marked "No requests yet" will populate with live analytics (success/error rates, latency, CPU usage) 
                  once they receive API calls. Expand any endpoint to view its documentation and metrics.
                </p>
              </div>
            </div>
          </div>
          
          {!metrics?.apiAnalytics && (
            <div className="text-sm text-gray-500">No API analytics data available yet. Make some API requests to see analytics.</div>
          )}
          {metrics?.apiAnalytics && metrics.apiAnalytics.length === 0 && (
            <div className="text-sm text-gray-500">No API requests recorded yet. The analytics will appear after API calls are made.</div>
          )}
          {metrics?.apiAnalytics && metrics.apiAnalytics.length > 0 && (
            <div className="space-y-4">
              {metrics.apiAnalytics.map((endpoint) => (
                <APIEndpointCard key={endpoint.endpoint} endpointData={endpoint} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// small internal spark wrapper to avoid circular import
const MetricCardSpark = ({ data }) => {
  const Spark = require('../components/developer/MetricCard').default; // not importing Sparkline directly to keep file simple
  // But MetricCard export is default component; we need a lightweight spark here.
  // Render a simple SVG inline instead
  if (!data || data.length === 0) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const width = 120;
  const height = 36;
  const len = data.length;
  const points = data.map((d, i) => {
    const x = (i / (len - 1 || 1)) * width;
    const y = height - ((d - min) / (max - min || 1)) * height;
    return `${x},${y}`;
  });
  return (
    <svg width={120} height={36}>
      <polyline fill="none" stroke="#ef4444" strokeWidth="2" points={points.join(' ')} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export default DeveloperDashboard;
