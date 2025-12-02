import React, { useState } from 'react';
import LineChart from './LineChart';
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle, Lock, Unlock, Activity } from 'lucide-react';

const APIEndpointCard = ({ endpointData }) => {
  const [expanded, setExpanded] = useState(false);
  
  const {
    endpoint,
    description,
    auth,
    registered,
    totalRequests,
    totalSuccess,
    totalErrors,
    successRate,
    latency,
    timeseries,
    errorBreakdown,
    requestHeaders,
    requestParams,
    requestQuery,
    requestBody,
    requestFiles,
    responseSuccess,
    responseError
  } = endpointData;

  const hasBeenCalled = totalRequests > 0;

  // Parse method from endpoint string
  const [method] = endpoint.split(' ');
  const methodColors = {
    'GET': 'bg-blue-100 text-blue-700',
    'POST': 'bg-green-100 text-green-700',
    'PUT': 'bg-yellow-100 text-yellow-700',
    'DELETE': 'bg-red-100 text-red-700',
    'PATCH': 'bg-purple-100 text-purple-700'
  };

  // Prepare chart data
  const successChartData = timeseries?.success?.map(s => ({ 
    timestamp: s.timestamp, 
    count: 1 
  })) || [];
  
  const errorChartData = timeseries?.errors?.map(e => ({ 
    timestamp: e.timestamp, 
    count: 1 
  })) || [];
  
  const latencyChartData = timeseries?.latency?.map(l => ({
    timestamp: l.timestamp,
    value: l.value
  })) || [];
  
  const cpuChartData = timeseries?.cpu?.map(c => ({
    timestamp: c.timestamp,
    value: c.loadAvg
  })) || [];

  // Aggregate success/error counts per time bucket for better visualization
  const aggregateTimeseries = (data, bucketSize = 5) => {
    if (!data || data.length === 0) return [];
    const buckets = {};
    data.forEach(d => {
      const bucket = Math.floor(d.timestamp / (bucketSize * 1000)) * (bucketSize * 1000);
      if (!buckets[bucket]) buckets[bucket] = 0;
      buckets[bucket]++;
    });
    return Object.entries(buckets).map(([ts, count]) => ({
      timestamp: parseInt(ts),
      count
    }));
  };

  const aggregatedSuccess = aggregateTimeseries(successChartData);
  const aggregatedErrors = aggregateTimeseries(errorChartData);

  return (
    <div className={`bg-white rounded-xl shadow-md border overflow-hidden ${
      !hasBeenCalled ? 'border-gray-300 opacity-75' : 'border-gray-200'
    }`}>
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`px-2 py-1 rounded text-xs font-bold ${methodColors[method] || 'bg-gray-100 text-gray-700'}`}>
              {method}
            </span>
            <code className="text-sm font-semibold text-gray-800">{endpoint}</code>
            {!hasBeenCalled && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                No requests yet
              </span>
            )}
            {hasBeenCalled && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                successRate >= 95 ? 'bg-green-100 text-green-700' :
                successRate >= 80 ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {successRate}% success
              </span>
            )}
            {auth !== null && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                {auth ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                {auth ? 'Protected' : 'Public'}
              </span>
            )}
            {!registered && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                Dynamic
              </span>
            )}
          </div>
          
          {description && (
            <p className="text-xs text-gray-600 mt-1">{description}</p>
          )}
          
          {hasBeenCalled && (
            <div className="flex items-center gap-6 mt-2 text-sm text-gray-600 flex-wrap">
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>{totalSuccess} success</span>
              </div>
              <div className="flex items-center gap-1">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span>{totalErrors} errors</span>
              </div>
              <div>
                <span className="text-gray-500">Avg latency:</span> <span className="font-medium">{latency?.avg || 0}ms</span>
              </div>
              <div>
                <span className="text-gray-500">p95:</span> <span className="font-medium">{latency?.p95 || 0}ms</span>
              </div>
            </div>
          )}
        </div>
        
        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          {/* Request/Response Structure - Always show */}
          <div className="mb-6 bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">📋 Request / Response Structure</h4>
            
            <div className="space-y-3">
              {/* Request */}
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-1">Request:</p>
                <div className="bg-gray-50 p-2 rounded text-xs font-mono space-y-1">
                  {requestHeaders && <div className="text-blue-700">Headers: {requestHeaders}</div>}
                  {requestParams && <div className="text-purple-700">Params: {requestParams}</div>}
                  {requestQuery && <div className="text-green-700">Query: {requestQuery}</div>}
                  {requestBody && <div className="text-orange-700">Body: {requestBody}</div>}
                  {requestFiles && <div className="text-pink-700">Files: {requestFiles}</div>}
                  {!requestHeaders && !requestParams && !requestQuery && !requestBody && !requestFiles && (
                    <div className="text-gray-500">No request data required</div>
                  )}
                </div>
              </div>
              
              {/* Response */}
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-1">Response:</p>
                <div className="bg-gray-50 p-2 rounded text-xs font-mono space-y-1">
                  {responseSuccess && (
                    <div>
                      <span className="text-green-600 font-bold">✓ Success: </span>
                      <span className="text-gray-800">{responseSuccess}</span>
                    </div>
                  )}
                  {responseError && (
                    <div>
                      <span className="text-red-600 font-bold">✗ Error: </span>
                      <span className="text-gray-800">{responseError}</span>
                    </div>
                  )}
                  {!responseSuccess && !responseError && (
                    <div className="text-gray-500">No response structure documented</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {!hasBeenCalled ? (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No data available yet</p>
              <p className="text-sm text-gray-500 mt-1">
                This endpoint hasn't received any requests. Make a {method} request to <code className="bg-gray-200 px-1 rounded">{endpoint}</code> to see analytics.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Success Rate Over Time */}
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Success Rate (requests/time)</h4>
                  <LineChart 
                    data={aggregatedSuccess} 
                    width={320} 
                    height={120} 
                    color="#10b981" 
                    label="Success"
                  />
                </div>

                {/* Error Rate Over Time */}
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Error Rate (requests/time)</h4>
                  <LineChart 
                    data={aggregatedErrors} 
                    width={320} 
                    height={120} 
                    color="#ef4444" 
                    label="Errors"
                  />
                </div>

                {/* Latency Over Time */}
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Response Latency (ms)</h4>
                  <LineChart 
                    data={latencyChartData} 
                    width={320} 
                    height={120} 
                    color="#3b82f6" 
                    label="Latency"
                  />
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="text-gray-500">p50</div>
                      <div className="font-semibold">{latency?.p50 || 0}ms</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-500">p95</div>
                      <div className="font-semibold">{latency?.p95 || 0}ms</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-500">p99</div>
                      <div className="font-semibold">{latency?.p99 || 0}ms</div>
                    </div>
                  </div>
                </div>

                {/* CPU Usage During Requests */}
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">CPU Load Average</h4>
                  <LineChart 
                    data={cpuChartData} 
                    width={320} 
                    height={120} 
                    color="#8b5cf6" 
                    label="CPU Load"
                  />
                </div>
              </div>

              {/* Error Breakdown */}
              {errorBreakdown && errorBreakdown.length > 0 && (
                <div className="mt-6 bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Error Breakdown</h4>
                  <div className="space-y-2">
                    {errorBreakdown.slice(0, 5).map((error, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-500" />
                          <code className="text-xs bg-red-50 px-2 py-1 rounded">{error.message}</code>
                        </span>
                        <span className="font-semibold text-red-600">{error.count} occurrences</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default APIEndpointCard;
