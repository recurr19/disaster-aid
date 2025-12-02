/**
 * Endpoint Registry - Discovers all API endpoints in the application
 * This module scans route files and extracts all registered endpoints
 */

// Registry of all known endpoints in the application
const endpointRegistry = [
  // Auth Routes (/api/auth)
  { 
    method: 'POST', 
    path: '/auth/register', 
    description: 'Register new user', 
    auth: false,
    requestBody: 'name: string, email: string, password: string, role: citizen|ngo|dispatcher|authority',
    responseSuccess: 'success: true, token: string, user: {id, name, email, role}',
    responseError: 'error: string'
  },
  { 
    method: 'POST', 
    path: '/auth/login', 
    description: 'Login existing user', 
    auth: false,
    requestBody: 'email: string, password: string',
    responseSuccess: 'success: true, token: string, user: {id, name, email, role}',
    responseError: 'error: "Invalid credentials"'
  },
  { 
    method: 'GET', 
    path: '/auth/profile', 
    description: 'Get current user profile', 
    auth: true,
    requestHeaders: 'Authorization: Bearer <token>',
    responseSuccess: 'user: {id, name, email, role, ...profile}',
    responseError: 'error: "Not authorized"'
  },
  { 
    method: 'PUT', 
    path: '/auth/profile', 
    description: 'Update user profile', 
    auth: true,
    requestHeaders: 'Authorization: Bearer <token>',
    requestBody: 'name?: string, email?: string, ...otherFields',
    responseSuccess: 'success: true, user: {...updatedProfile}',
    responseError: 'error: string'
  },
  
  // Ticket Routes (/api/tickets)
  { 
    method: 'POST', 
    path: '/tickets', 
    description: 'Submit help request (authenticated)', 
    auth: true,
    requestHeaders: 'Authorization: Bearer <token>',
    requestBody: 'helpTypes: string[], address: string, isSOS?: boolean, description?: string',
    requestFiles: 'files?: File[]',
    responseSuccess: 'success: true, ticket: {ticketId, status, ...}',
    responseError: 'error: "Validation failed"'
  },
  { 
    method: 'POST', 
    path: '/tickets/public', 
    description: 'Submit public help request', 
    auth: false,
    requestBody: 'name: string, phone: string, helpTypes: string[], address: string, isSOS?: boolean',
    requestFiles: 'files?: File[]',
    responseSuccess: 'success: true, ticket: {ticketId, status, ...}',
    responseError: 'error: "Rate limit exceeded"'
  },
  { 
    method: 'GET', 
    path: '/tickets', 
    description: 'Get tickets (dashboard)', 
    auth: true,
    requestHeaders: 'Authorization: Bearer <token>',
    requestQuery: 'status?: string, limit?: number, page?: number',
    responseSuccess: 'tickets: [...], total: number, page: number',
    responseError: 'error: "Not authorized"'
  },
  { 
    method: 'GET', 
    path: '/tickets/match/:ticketId', 
    description: 'Get NGO matches for ticket', 
    auth: true,
    requestHeaders: 'Authorization: Bearer <token>',
    requestParams: 'ticketId: string',
    responseSuccess: 'matches: [{ngoId, organizationName, score, distanceKm}]',
    responseError: 'error: "Ticket not found"'
  },
  { 
    method: 'POST', 
    path: '/tickets/assign/:ticketId', 
    description: 'Assign best NGO to ticket', 
    auth: true,
    requestHeaders: 'Authorization: Bearer <token>',
    requestParams: 'ticketId: string',
    responseSuccess: 'success: true, assignment: {ngoId, status}',
    responseError: 'error: "No matches available"'
  },
  
  // NGO Routes (/api/ngo)
  { 
    method: 'GET', 
    path: '/ngo/matches', 
    description: 'List NGO assignment proposals', 
    auth: true,
    requestHeaders: 'Authorization: Bearer <token>',
    requestQuery: 'status?: proposed|accepted|rejected',
    responseSuccess: 'assignments: [{ticketId, status, ticket: {...}}]',
    responseError: 'error: "Not authorized"'
  },
  { 
    method: 'POST', 
    path: '/ngo/assignments/:assignmentId/accept', 
    description: 'Accept assignment', 
    auth: true,
    requestHeaders: 'Authorization: Bearer <token>',
    requestParams: 'assignmentId: string',
    responseSuccess: 'success: true, assignment: {status: "accepted", ...}',
    responseError: 'error: "Assignment not found"'
  },
  { 
    method: 'POST', 
    path: '/ngo/assignments/:assignmentId/reject', 
    description: 'Reject assignment', 
    auth: true,
    requestHeaders: 'Authorization: Bearer <token>',
    requestParams: 'assignmentId: string',
    responseSuccess: 'success: true, assignment: {status: "rejected", ...}',
    responseError: 'error: "Assignment not found"'
  },
  
  // Tracker Routes (/api/tracker)
  { 
    method: 'GET', 
    path: '/tracker/sos/public', 
    description: 'Get public SOS requests', 
    auth: false,
    responseSuccess: 'success: true, count: number, tickets: [{ticketId, status, ...}]',
    responseError: 'error: "Server error"'
  },
  { 
    method: 'GET', 
    path: '/tracker/:ticketId', 
    description: 'Check ticket status', 
    auth: false,
    requestParams: 'ticketId: string',
    responseSuccess: 'ticket: {ticketId, status, ...statusData}',
    responseError: 'error: "Ticket not found"'
  },
  { 
    method: 'POST', 
    path: '/tracker/:ticketId/status', 
    description: 'Update ticket status', 
    auth: true,
    requestHeaders: 'Authorization: Bearer <token>',
    requestParams: 'ticketId: string',
    requestBody: 'status: matched|in_progress|completed, notes?: string',
    responseSuccess: 'success: true, ticket: {ticketId, status}',
    responseError: 'error: "Not authorized to update"'
  },
  
  // Dispatcher Routes (/api/dispatcher)
  { 
    method: 'POST', 
    path: '/dispatcher/generate', 
    description: 'Generate dispatchers for NGO', 
    auth: true,
    requestHeaders: 'Authorization: Bearer <token>',
    requestBody: 'count: number, prefix?: string',
    responseSuccess: 'success: true, dispatchers: [{email, password, dispatcherId}]',
    responseError: 'error: "Not authorized"'
  },
  { 
    method: 'GET', 
    path: '/dispatcher/list', 
    description: 'List dispatchers for NGO', 
    auth: true,
    requestHeaders: 'Authorization: Bearer <token>',
    responseSuccess: 'dispatchers: [{dispatcherId, email, name, status}]',
    responseError: 'error: "Not authorized"'
  },
  { 
    method: 'POST', 
    path: '/dispatcher/assign-ticket', 
    description: 'Assign ticket to dispatcher', 
    auth: true,
    requestHeaders: 'Authorization: Bearer <token>',
    requestBody: 'ticketId: string, dispatcherId: string',
    responseSuccess: 'success: true, assignment: {ticketId, dispatcherId}',
    responseError: 'error: "Assignment failed"'
  },
  { 
    method: 'GET', 
    path: '/dispatcher/my-tickets', 
    description: 'Get dispatcher tickets', 
    auth: true,
    requestHeaders: 'Authorization: Bearer <token>',
    responseSuccess: 'tickets: [{ticketId, status, ...ticketData}]',
    responseError: 'error: "Not authorized"'
  },
  { 
    method: 'POST', 
    path: '/dispatcher/upload-proof/:ticketId', 
    description: 'Upload delivery proof', 
    auth: true,
    requestHeaders: 'Authorization: Bearer <token>',
    requestParams: 'ticketId: string',
    requestBody: 'notes?: string',
    requestFiles: 'files: File[]',
    responseSuccess: 'success: true, ticket: {ticketId, deliveryProof: [{filename, path}]}',
    responseError: 'error: "Upload failed"'
  },
  
  // Authority Routes (/api/authority)
  { 
    method: 'GET', 
    path: '/authority/map', 
    description: 'Get authority map data', 
    auth: true,
    requestHeaders: 'Authorization: Bearer <token>',
    responseSuccess: 'tickets: [...], ngos: [...], overlays: [...]',
    responseError: 'error: "Not authorized"'
  },
  { 
    method: 'GET', 
    path: '/authority/overlays', 
    description: 'List map overlays', 
    auth: true,
    requestHeaders: 'Authorization: Bearer <token>',
    responseSuccess: 'overlays: [{id, name, type, geometry}]',
    responseError: 'error: "Not authorized"'
  },
  { 
    method: 'POST', 
    path: '/authority/overlays', 
    description: 'Create map overlay', 
    auth: true,
    requestHeaders: 'Authorization: Bearer <token>',
    requestBody: 'name: string, type: polygon|line|marker, geometry: GeoJSON, metadata?: object',
    responseSuccess: 'success: true, overlay: {id, name, ...overlayData}',
    responseError: 'error: "Validation failed"'
  },
  { 
    method: 'PUT', 
    path: '/authority/overlays/:id', 
    description: 'Update map overlay', 
    auth: true,
    requestHeaders: 'Authorization: Bearer <token>',
    requestParams: 'id: string',
    requestBody: 'name?: string, geometry?: GeoJSON, metadata?: object',
    responseSuccess: 'success: true, overlay: {id, ...updatedData}',
    responseError: 'error: "Overlay not found"'
  },
  { 
    method: 'DELETE', 
    path: '/authority/overlays/:id', 
    description: 'Delete map overlay', 
    auth: true,
    requestHeaders: 'Authorization: Bearer <token>',
    requestParams: 'id: string',
    responseSuccess: 'success: true, message: "Overlay deleted"',
    responseError: 'error: "Overlay not found"'
  },
  { 
    method: 'GET', 
    path: '/authority/map-debug', 
    description: 'Map debug (dev only)', 
    auth: false,
    responseSuccess: 'tickets: [...], ngos: [...], debug: true',
    responseError: 'error: "Only available in development"'
  },
  
  // Dev Routes (/api/dev)
  { 
    method: 'GET', 
    path: '/dev/metrics', 
    description: 'Get system and API metrics', 
    auth: false,
    responseSuccess: 'success: true, metrics: {timestamp, cpu, memory, db, apiAnalytics}',
    responseError: 'success: false, error: string'
  },
];

/**
 * Get all registered endpoints
 */
function getAllEndpoints() {
  return endpointRegistry.map(endpoint => ({
    ...endpoint,
    fullPath: `${endpoint.method} ${endpoint.path}`
  }));
}

/**
 * Find endpoint by method and path
 */
function findEndpoint(method, path) {
  // Normalize path to match registry format
  let normalizedPath = path;
  if (normalizedPath.startsWith('/api/')) {
    normalizedPath = normalizedPath.substring(4);
  }
  
  return endpointRegistry.find(
    ep => ep.method === method && ep.path === normalizedPath
  );
}

module.exports = {
  getAllEndpoints,
  findEndpoint,
  endpointRegistry
};
