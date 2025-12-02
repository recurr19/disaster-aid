const mongoose = require('mongoose');

// In-memory store for DB query analytics
const dbAnalytics = {
  queries: new Map(), // { modelName: { count, totalTime, queries: [] } }
  totalQueries: 0,
  lastReset: Date.now()
};

const MAX_QUERY_SAMPLES = 50;

/**
 * Track MongoDB queries by hooking into Mongoose events
 */
function initDBAnalytics() {
  // Hook into mongoose query execution
  mongoose.set('debug', function(collectionName, method, query, doc, options) {
    const startTime = Date.now();
    
    // Store query info
    const modelName = collectionName;
    
    if (!dbAnalytics.queries.has(modelName)) {
      dbAnalytics.queries.set(modelName, {
        count: 0,
        totalTime: 0,
        avgTime: 0,
        queries: [],
        methods: {}
      });
    }
    
    const modelStats = dbAnalytics.queries.get(modelName);
    modelStats.count++;
    dbAnalytics.totalQueries++;
    
    // Track method usage
    if (!modelStats.methods[method]) {
      modelStats.methods[method] = 0;
    }
    modelStats.methods[method]++;
    
    // Store query sample
    const queryInfo = {
      timestamp: Date.now(),
      method,
      duration: 0, // Will be updated if we can measure
      query: JSON.stringify(query).substring(0, 100) // Limit size
    };
    
    modelStats.queries.push(queryInfo);
    
    // Keep only last MAX_QUERY_SAMPLES
    if (modelStats.queries.length > MAX_QUERY_SAMPLES) {
      modelStats.queries.shift();
    }
  });
}

/**
 * Enhanced: Track query execution time by instrumenting mongoose
 */
function instrumentMongoose() {
  const originalExec = mongoose.Query.prototype.exec;
  
  mongoose.Query.prototype.exec = async function() {
    const startTime = Date.now();
    const modelName = this.model?.modelName || 'unknown';
    const operation = this.op || 'query';
    
    try {
      const result = await originalExec.apply(this, arguments);
      const duration = Date.now() - startTime;
      
      // Record successful query
      recordQuery(modelName, operation, duration, false);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Record failed query
      recordQuery(modelName, operation, duration, true);
      
      throw error;
    }
  };
}

function recordQuery(modelName, operation, duration, isError) {
  if (!dbAnalytics.queries.has(modelName)) {
    dbAnalytics.queries.set(modelName, {
      count: 0,
      totalTime: 0,
      avgTime: 0,
      queries: [],
      methods: {},
      errors: 0
    });
  }
  
  const modelStats = dbAnalytics.queries.get(modelName);
  modelStats.count++;
  modelStats.totalTime += duration;
  modelStats.avgTime = modelStats.totalTime / modelStats.count;
  
  if (isError) {
    modelStats.errors = (modelStats.errors || 0) + 1;
  }
  
  dbAnalytics.totalQueries++;
  
  // Track operation type
  if (!modelStats.methods[operation]) {
    modelStats.methods[operation] = 0;
  }
  modelStats.methods[operation]++;
  
  // Store query sample
  const queryInfo = {
    timestamp: Date.now(),
    method: operation,
    duration,
    isError
  };
  
  modelStats.queries.push(queryInfo);
  
  // Keep only last MAX_QUERY_SAMPLES
  if (modelStats.queries.length > MAX_QUERY_SAMPLES) {
    modelStats.queries.shift();
  }
}

/**
 * Get DB analytics data
 */
function getDBAnalytics() {
  const result = {
    totalQueries: dbAnalytics.totalQueries,
    uptime: Date.now() - dbAnalytics.lastReset,
    collections: []
  };
  
  for (const [modelName, stats] of dbAnalytics.queries.entries()) {
    // Calculate time-series for charts
    const timeseries = stats.queries.slice(-20).map(q => ({
      timestamp: q.timestamp,
      duration: q.duration
    }));
    
    // Get operation breakdown
    const operations = Object.entries(stats.methods).map(([method, count]) => ({
      method,
      count
    }));
    
    result.collections.push({
      modelName,
      totalQueries: stats.count,
      avgLatency: stats.avgTime?.toFixed(2) || 0,
      errors: stats.errors || 0,
      operations,
      timeseries
    });
  }
  
  // Sort by most queried
  result.collections.sort((a, b) => b.totalQueries - a.totalQueries);
  
  return result;
}

/**
 * Reset analytics (optional)
 */
function resetDBAnalytics() {
  dbAnalytics.queries.clear();
  dbAnalytics.totalQueries = 0;
  dbAnalytics.lastReset = Date.now();
}

module.exports = {
  initDBAnalytics,
  instrumentMongoose,
  getDBAnalytics,
  resetDBAnalytics
};
