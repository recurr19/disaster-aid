import React, { useState } from 'react';
import LineChart from './LineChart';
import { Database, Activity, AlertTriangle, User, Ticket, Building, Clipboard, Truck, Map, ChevronDown, ChevronUp } from 'lucide-react';

const iconMap = {
  user: User,
  ticket: Ticket,
  building: Building,
  clipboard: Clipboard,
  truck: Truck,
  map: Map
};

const DBCollectionCard = ({ collection }) => {
  const {
    modelName,
    description,
    icon,
    schema,
    totalQueries,
    avgLatency,
    errors,
    operations,
    timeseries
  } = collection;

  const [showSchema, setShowSchema] = useState(false);
  const hasQueries = totalQueries > 0;

  // Prepare latency chart data
  const latencyData = timeseries?.map(t => ({
    timestamp: t.timestamp,
    value: t.duration
  })) || [];

  const hasErrors = errors > 0;
  const errorRate = totalQueries > 0 ? ((errors / totalQueries) * 100).toFixed(1) : 0;

  // Get the appropriate icon component
  const IconComponent = iconMap[icon] || Database;

  return (
    <div className={`bg-white rounded-lg shadow border p-4 ${!hasQueries ? 'border-gray-300 opacity-75' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <IconComponent className="w-5 h-5 text-blue-600" />
          <div>
            <h4 className="font-semibold text-gray-800">{modelName}</h4>
            {description && <p className="text-xs text-gray-500">{description}</p>}
          </div>
        </div>
        {!hasQueries && (
          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
            No queries yet
          </span>
        )}
        {hasErrors && hasQueries && (
          <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
            <AlertTriangle className="w-3 h-3" />
            {errors} errors
          </span>
        )}
      </div>

      {/* Schema Details - Collapsible */}
      {schema && (
        <div className="mb-4">
          <button
            onClick={() => setShowSchema(!showSchema)}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {showSchema ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            View Schema Structure
          </button>
          {showSchema && (
            <div className="mt-2 bg-gray-50 p-3 rounded border border-gray-200">
              <p className="text-xs font-semibold text-gray-700 mb-2">Model Fields:</p>
              <div className="space-y-1">
                {Object.entries(schema).map(([field, type]) => (
                  <div key={field} className="flex items-start gap-2 text-xs">
                    <span className="font-mono text-blue-600 min-w-[100px]">{field}:</span>
                    <span className="text-gray-600">{type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {hasQueries ? (
        <>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500">Total Queries</p>
              <p className="text-lg font-bold text-gray-900">{totalQueries}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Avg Latency</p>
              <p className="text-lg font-bold text-blue-600">{avgLatency}ms</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Error Rate</p>
              <p className={`text-lg font-bold ${hasErrors ? 'text-red-600' : 'text-green-600'}`}>
                {errorRate}%
              </p>
            </div>
          </div>

          {/* Query latency over time */}
          {latencyData.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-gray-600 mb-2">Query Latency Over Time</p>
              <LineChart 
                data={latencyData}
                width={280}
                height={80}
                color="#3b82f6"
                label="Latency (ms)"
              />
            </div>
          )}

          {/* Operation breakdown */}
          {operations && operations.length > 0 && (
            <div>
              <p className="text-xs text-gray-600 mb-2">Operations</p>
              <div className="flex flex-wrap gap-2">
                {operations.map((op, idx) => (
                  <span 
                    key={idx}
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium"
                  >
                    {op.method}: {op.count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-4">
          <p className="text-xs text-gray-500">
            This model hasn't been queried yet. Queries will be tracked automatically when your application uses this collection.
          </p>
        </div>
      )}
    </div>
  );
};

const DBPerformancePanel = ({ dbMetrics }) => {
  if (!dbMetrics) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold">Database Performance</h3>
        </div>
        <p className="text-sm text-gray-500">No database metrics available yet.</p>
      </div>
    );
  }

  const { collections, totalQueries, readyState } = dbMetrics;
  const connectionStatus = {
    0: { label: 'Disconnected', color: 'text-red-600' },
    1: { label: 'Connected', color: 'text-green-600' },
    2: { label: 'Connecting', color: 'text-yellow-600' },
    3: { label: 'Disconnecting', color: 'text-orange-600' }
  };

  const status = connectionStatus[readyState] || { label: 'Unknown', color: 'text-gray-600' };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Database className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold">Database Performance</h3>
            <p className="text-xs text-gray-500">MongoDB query analytics and model schemas</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-gray-500">Connection Status</p>
            <p className={`text-sm font-semibold ${status.color}`}>{status.label}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Total Queries</p>
            <p className="text-sm font-semibold text-gray-900">{totalQueries || 0}</p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Activity className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-blue-900 font-medium mb-1">
              Live Data Tracking
            </p>
            <p className="text-xs text-blue-700">
              Query metrics update automatically as your application interacts with the database. 
              Models with "No queries yet" will populate once backend operations are performed. 
              Data refreshes every 10 seconds.
            </p>
          </div>
        </div>
      </div>

      {!collections || collections.length === 0 ? (
        <div className="text-center py-8">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No query data yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Database queries will appear here once your application starts using MongoDB.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((collection, idx) => (
            <DBCollectionCard key={idx} collection={collection} />
          ))}
        </div>
      )}
    </div>
  );
};

export default DBPerformancePanel;
