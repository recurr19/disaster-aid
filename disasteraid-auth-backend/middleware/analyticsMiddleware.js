const os = require('os');

// In-memory store for API analytics
// Structure: { [endpoint]: { success: [], errors: [], latencies: [], cpuSamples: [], errorTypes: {} } }
const analyticsStore = new Map();

// Keep last N samples per endpoint
const MAX_SAMPLES = 100;

// Helper to get or create endpoint analytics
function getEndpointAnalytics(endpoint) {
  if (!analyticsStore.has(endpoint)) {
    analyticsStore.set(endpoint, {
      success: [], // Array of { timestamp, duration }
      errors: [], // Array of { timestamp, statusCode, errorMessage, duration }
      latencies: [], // Array of durations for quick percentile calc
      cpuSamples: [], // Array of { timestamp, loadAvg }
      errorTypes: {}, // Map of error message -> count
      totalRequests: 0,
      totalSuccess: 0,
      totalErrors: 0
    });
  }
  return analyticsStore.get(endpoint);
}

// Middleware to track all API requests
function analyticsMiddleware(req, res, next) {
  const startTime = Date.now();
  const startCpu = os.loadavg()[0]; // 1-minute load average
  
  // Normalize endpoint path (remove IDs, keep route pattern)
  const endpoint = normalizeEndpoint(req.method, req.originalUrl || req.url);
  
  // Capture the original end function
  const originalEnd = res.end;
  
  res.end = function(...args) {
    // Restore original end
    res.end = originalEnd;
    
    // Calculate metrics
    const duration = Date.now() - startTime;
    const endCpu = os.loadavg()[0];
    const timestamp = Date.now();
    
    // Get analytics for this endpoint
    const analytics = getEndpointAnalytics(endpoint);
    analytics.totalRequests++;
    
    // Record success or error
    const isSuccess = res.statusCode >= 200 && res.statusCode < 400;
    
    if (isSuccess) {
      analytics.totalSuccess++;
      analytics.success.push({ timestamp, duration, statusCode: res.statusCode });
      
      // Keep only last MAX_SAMPLES
      if (analytics.success.length > MAX_SAMPLES) {
        analytics.success.shift();
      }
    } else {
      analytics.totalErrors++;
      
      // Try to capture error message if available
      let errorMessage = `HTTP ${res.statusCode}`;
      if (res.locals && res.locals.errorMessage) {
        errorMessage = res.locals.errorMessage;
      }
      
      analytics.errors.push({ 
        timestamp, 
        duration, 
        statusCode: res.statusCode,
        errorMessage 
      });
      
      // Track error types
      if (!analytics.errorTypes[errorMessage]) {
        analytics.errorTypes[errorMessage] = 0;
      }
      analytics.errorTypes[errorMessage]++;
      
      // Keep only last MAX_SAMPLES
      if (analytics.errors.length > MAX_SAMPLES) {
        analytics.errors.shift();
      }
    }
    
    // Record latency
    analytics.latencies.push(duration);
    if (analytics.latencies.length > MAX_SAMPLES) {
      analytics.latencies.shift();
    }
    
    // Record CPU snapshot
    analytics.cpuSamples.push({ timestamp, loadAvg: endCpu });
    if (analytics.cpuSamples.length > MAX_SAMPLES) {
      analytics.cpuSamples.shift();
    }
    
    // Call original end
    return originalEnd.apply(res, args);
  };
  
  next();
}

// Normalize endpoint to group similar routes
function normalizeEndpoint(method, url) {
  // Remove query string
  let path = url.split('?')[0];
  
  // Remove /api prefix for cleaner display
  if (path.startsWith('/api/')) {
    path = path.substring(4);
  }
  
  // Replace IDs and UUIDs with placeholders
  // MongoDB ObjectIds (24 hex chars)
  path = path.replace(/\/[0-9a-fA-F]{24}/g, '/:id');
  
  // UUIDs
  path = path.replace(/\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/gi, '/:uuid');
  
  // Numeric IDs
  path = path.replace(/\/\d+/g, '/:id');
  
  // Ticket IDs (DA-xxxxx format)
  path = path.replace(/\/DA-\d+/gi, '/:ticketId');
  
  return `${method} ${path}`;
}

// Get all analytics data
function getAnalytics() {
  const results = [];
  
  for (const [endpoint, data] of analyticsStore.entries()) {
    // Calculate aggregates
    const successRate = data.totalRequests > 0 
      ? ((data.totalSuccess / data.totalRequests) * 100).toFixed(2)
      : 0;
    
    // Calculate latency percentiles
    const sortedLatencies = [...data.latencies].sort((a, b) => a - b);
    const p50 = sortedLatencies[Math.floor(sortedLatencies.length * 0.5)] || 0;
    const p95 = sortedLatencies[Math.floor(sortedLatencies.length * 0.95)] || 0;
    const p99 = sortedLatencies[Math.floor(sortedLatencies.length * 0.99)] || 0;
    const avgLatency = data.latencies.length > 0
      ? (data.latencies.reduce((a, b) => a + b, 0) / data.latencies.length).toFixed(2)
      : 0;
    
    // Get recent time-series data for charts (last 20 points)
    const recentSuccessTimeseries = data.success.slice(-20).map(s => ({
      timestamp: s.timestamp,
      count: 1
    }));
    
    const recentErrorTimeseries = data.errors.slice(-20).map(e => ({
      timestamp: e.timestamp,
      count: 1
    }));
    
    const recentLatencyTimeseries = data.success.slice(-20).map(s => ({
      timestamp: s.timestamp,
      value: s.duration
    }));
    
    const recentCpuTimeseries = data.cpuSamples.slice(-20);
    
    // Convert error types to array
    const errorBreakdown = Object.entries(data.errorTypes).map(([msg, count]) => ({
      message: msg,
      count
    })).sort((a, b) => b.count - a.count);
    
    results.push({
      endpoint,
      totalRequests: data.totalRequests,
      totalSuccess: data.totalSuccess,
      totalErrors: data.totalErrors,
      successRate: parseFloat(successRate),
      latency: {
        avg: parseFloat(avgLatency),
        p50,
        p95,
        p99
      },
      timeseries: {
        success: recentSuccessTimeseries,
        errors: recentErrorTimeseries,
        latency: recentLatencyTimeseries,
        cpu: recentCpuTimeseries
      },
      errorBreakdown
    });
  }
  
  // Sort by total requests (most active first)
  return results.sort((a, b) => b.totalRequests - a.totalRequests);
}

// Clear old data (optional, can be called periodically)
function clearAnalytics() {
  analyticsStore.clear();
}

module.exports = {
  analyticsMiddleware,
  getAnalytics,
  clearAnalytics
};
