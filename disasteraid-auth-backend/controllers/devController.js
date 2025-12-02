const os = require('os');
const process = require('process');
const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');
const { getAnalytics } = require('../middleware/analyticsMiddleware');
const { getAllEndpoints } = require('../utils/endpointRegistry');
const { getDBAnalytics } = require('../middleware/dbAnalyticsMiddleware');
const { getAllModels } = require('../utils/modelRegistry');

// Minimal metrics snapshot for developer dashboard
exports.getMetrics = async (req, res) => {
  try {
    // Basic system metrics
    const mem = process.memoryUsage();
    const totalMem = os.totalmem();
    const usedPercent = Math.round((mem.rss / totalMem) * 100);

    // Ticket queue: count active tickets
    const activeCount = await Ticket.countDocuments({ status: 'active' });
    const matchedCount = await Ticket.countDocuments({ status: { $in: ['matched', 'in_progress'] } });

    // Get API analytics from middleware (only endpoints that have been called)
    const liveAnalytics = getAnalytics();
    
    // Get DB query analytics
    const dbQueryAnalytics = getDBAnalytics();
    
    // Get all registered models
    const allModels = getAllModels();
    
    // Merge model registry with query analytics
    const dbCollectionsMap = new Map();
    dbQueryAnalytics.collections.forEach(col => {
      dbCollectionsMap.set(col.modelName, col);
    });
    
    // Create complete list of collections (tracked + untracked)
    const dbCollections = allModels.map(model => {
      const liveData = dbCollectionsMap.get(model.name);
      
      if (liveData) {
        // Model has been queried
        return {
          ...liveData,
          description: model.description,
          icon: model.icon,
          schema: model.schema,
          registered: true
        };
      } else {
        // Model exists but hasn't been queried yet
        return {
          modelName: model.name,
          description: model.description,
          icon: model.icon,
          schema: model.schema,
          registered: true,
          totalQueries: 0,
          avgLatency: 0,
          errors: 0,
          operations: [],
          timeseries: []
        };
      }
    });
    
    // Get all registered endpoints from registry
    const allEndpoints = getAllEndpoints();
    
    // Create a map of live analytics by endpoint
    const analyticsMap = new Map();
    liveAnalytics.forEach(analytics => {
      analyticsMap.set(analytics.endpoint, analytics);
    });
    
    // Merge registry with live analytics
    const apiAnalytics = allEndpoints.map(endpoint => {
      const liveData = analyticsMap.get(endpoint.fullPath);
      
      if (liveData) {
        // Endpoint has been called - return live data with registry metadata
        return {
          ...liveData,
          description: endpoint.description,
          auth: endpoint.auth,
          requestHeaders: endpoint.requestHeaders,
          requestParams: endpoint.requestParams,
          requestQuery: endpoint.requestQuery,
          requestBody: endpoint.requestBody,
          requestFiles: endpoint.requestFiles,
          responseSuccess: endpoint.responseSuccess,
          responseError: endpoint.responseError,
          registered: true
        };
      } else {
        // Endpoint exists but hasn't been called yet - return empty analytics
        return {
          endpoint: endpoint.fullPath,
          description: endpoint.description,
          auth: endpoint.auth,
          requestHeaders: endpoint.requestHeaders,
          requestParams: endpoint.requestParams,
          requestQuery: endpoint.requestQuery,
          requestBody: endpoint.requestBody,
          requestFiles: endpoint.requestFiles,
          responseSuccess: endpoint.responseSuccess,
          responseError: endpoint.responseError,
          registered: true,
          totalRequests: 0,
          totalSuccess: 0,
          totalErrors: 0,
          successRate: 0,
          latency: {
            avg: 0,
            p50: 0,
            p95: 0,
            p99: 0
          },
          timeseries: {
            success: [],
            errors: [],
            latency: [],
            cpu: []
          },
          errorBreakdown: []
        };
      }
    });
    
    // Add any tracked endpoints that aren't in registry (dynamic routes)
    liveAnalytics.forEach(liveData => {
      const inRegistry = allEndpoints.some(ep => ep.fullPath === liveData.endpoint);
      if (!inRegistry) {
        apiAnalytics.push({
          ...liveData,
          description: 'Dynamic endpoint (not in registry)',
          auth: null,
          registered: false
        });
      }
    });
    
    // Calculate total success rate across all endpoints
    let totalRequests = 0;
    let totalSuccess = 0;
    apiAnalytics.forEach(endpoint => {
      totalRequests += endpoint.totalRequests || 0;
      totalSuccess += endpoint.totalSuccess || 0;
    });
    const totalSuccessRate = totalRequests > 0 ? Math.round((totalSuccess / totalRequests) * 100) : 0;

    const metrics = {
      timestamp: Date.now(),
      uptime: process.uptime(),
      cpu: {
        loadAvg: os.loadavg()[0],
      },
      memory: {
        rss: mem.rss,
        heapUsed: mem.heapUsed,
        heapTotal: mem.heapTotal,
        usedPercent
      },
      requests: {
        queueLength: activeCount,
        matched: matchedCount
      },
      db: {
        readyState: mongoose.connection.readyState,
        collections: dbCollections,
        totalQueries: dbQueryAnalytics.totalQueries,
        totalModels: allModels.length,
        activeModels: dbQueryAnalytics.collections.length
      },
      cache: null,
      jobs: {
        running: 0
      },
      alerts: [],
      apiAnalytics, // All endpoints with analytics
      totalEndpoints: allEndpoints.length,
      activeEndpoints: liveAnalytics.length,
      totalRequests,
      totalSuccessRate
    };

    res.json({ success: true, metrics });
  } catch (e) {
    console.error('Failed to collect metrics', e?.message || e);
    res.status(500).json({ success: false, error: e?.message || String(e) });
  }
};

