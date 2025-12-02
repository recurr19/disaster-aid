import React, { useState } from 'react';
import { Network, Server, Database, Users, Map, Bell, Shield, ChevronDown, ChevronUp } from 'lucide-react';

const ArchitectureDiagram = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <Network className="w-6 h-6 text-purple-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">System Architecture</h3>
            <p className="text-sm text-gray-500">DisasterAid platform overview</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
      </div>

      {expanded && (
        <div className="mt-6">
          {/* Architecture Diagram */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Frontend Layer */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border-2 border-blue-300">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-blue-700" />
                <h4 className="font-semibold text-blue-900">Frontend Layer</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="bg-white rounded p-2 border border-blue-200">
                  <p className="font-medium text-blue-800">React Application</p>
                  <p className="text-xs text-gray-600">React Router, Tailwind CSS</p>
                </div>
                <div className="bg-white rounded p-2 border border-blue-200">
                  <p className="font-medium text-blue-800">User Interfaces</p>
                  <p className="text-xs text-gray-600">Citizen, NGO, Dispatcher, Authority</p>
                </div>
                <div className="bg-white rounded p-2 border border-blue-200">
                  <p className="font-medium text-blue-800">Real-time Updates</p>
                  <p className="text-xs text-gray-600">Socket.io Client, Axios</p>
                </div>
                <div className="bg-white rounded p-2 border border-blue-200">
                  <p className="font-medium text-blue-800">Maps & Visualization</p>
                  <p className="text-xs text-gray-600">Leaflet, React Simple Maps</p>
                </div>
              </div>
            </div>

            {/* Backend Layer */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border-2 border-green-300">
              <div className="flex items-center gap-2 mb-3">
                <Server className="w-5 h-5 text-green-700" />
                <h4 className="font-semibold text-green-900">Backend Layer</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="bg-white rounded p-2 border border-green-200">
                  <p className="font-medium text-green-800">Node.js + Express</p>
                  <p className="text-xs text-gray-600">RESTful API, 30+ endpoints</p>
                </div>
                <div className="bg-white rounded p-2 border border-green-200">
                  <p className="font-medium text-green-800">Authentication</p>
                  <p className="text-xs text-gray-600">JWT, bcrypt, Role-based access</p>
                </div>
                <div className="bg-white rounded p-2 border border-green-200">
                  <p className="font-medium text-green-800">Real-time Server</p>
                  <p className="text-xs text-gray-600">Socket.io WebSocket</p>
                </div>
                <div className="bg-white rounded p-2 border border-green-200">
                  <p className="font-medium text-green-800">File Upload</p>
                  <p className="text-xs text-gray-600">Multer middleware</p>
                </div>
                <div className="bg-white rounded p-2 border border-green-200">
                  <p className="font-medium text-green-800">Analytics</p>
                  <p className="text-xs text-gray-600">API & DB performance tracking</p>
                </div>
              </div>
            </div>

            {/* Data Layer */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border-2 border-purple-300">
              <div className="flex items-center gap-2 mb-3">
                <Database className="w-5 h-5 text-purple-700" />
                <h4 className="font-semibold text-purple-900">Data Layer</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="bg-white rounded p-2 border border-purple-200">
                  <p className="font-medium text-purple-800">MongoDB Database</p>
                  <p className="text-xs text-gray-600">Mongoose ODM, 6 collections</p>
                </div>
                <div className="bg-white rounded p-2 border border-purple-200">
                  <p className="font-medium text-purple-800">Collections</p>
                  <p className="text-xs text-gray-600">User, Ticket, NGO, Assignment, Dispatcher, Overlay</p>
                </div>
                <div className="bg-white rounded p-2 border border-purple-200">
                  <p className="font-medium text-purple-800">Geospatial Data</p>
                  <p className="text-xs text-gray-600">Location coordinates, service areas</p>
                </div>
              </div>
            </div>
          </div>

          {/* External Services Row */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* External Services */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border-2 border-orange-300">
              <div className="flex items-center gap-2 mb-3">
                <Bell className="w-5 h-5 text-orange-700" />
                <h4 className="font-semibold text-orange-900">External Services</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="bg-white rounded p-2 border border-orange-200">
                  <p className="font-medium text-orange-800">SendGrid</p>
                  <p className="text-xs text-gray-600">Email notifications</p>
                </div>
                <div className="bg-white rounded p-2 border border-orange-200">
                  <p className="font-medium text-orange-800">Twilio</p>
                  <p className="text-xs text-gray-600">SMS alerts</p>
                </div>
              </div>
            </div>

            {/* Security & Middleware */}
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border-2 border-red-300">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-red-700" />
                <h4 className="font-semibold text-red-900">Security & Middleware</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="bg-white rounded p-2 border border-red-200">
                  <p className="font-medium text-red-800">Authentication</p>
                  <p className="text-xs text-gray-600">JWT tokens, Protected routes</p>
                </div>
                <div className="bg-white rounded p-2 border border-red-200">
                  <p className="font-medium text-red-800">CORS</p>
                  <p className="text-xs text-gray-600">Cross-origin resource sharing</p>
                </div>
                <div className="bg-white rounded p-2 border border-red-200">
                  <p className="font-medium text-red-800">Analytics Middleware</p>
                  <p className="text-xs text-gray-600">Request tracking, DB monitoring</p>
                </div>
              </div>
            </div>
          </div>

          {/* Data Flow */}
          <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-3">🔄 Data Flow</h4>
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">1</div>
                <div>
                  <p className="font-medium">User Action</p>
                  <p className="text-xs text-gray-600">Citizen submits SOS ticket</p>
                </div>
              </div>
              <div className="text-2xl text-gray-400">→</div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">2</div>
                <div>
                  <p className="font-medium">API Processing</p>
                  <p className="text-xs text-gray-600">Validates, authenticates, stores</p>
                </div>
              </div>
              <div className="text-2xl text-gray-400">→</div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold">3</div>
                <div>
                  <p className="font-medium">Database</p>
                  <p className="text-xs text-gray-600">Persists ticket data</p>
                </div>
              </div>
              <div className="text-2xl text-gray-400">→</div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold">4</div>
                <div>
                  <p className="font-medium">Notifications</p>
                  <p className="text-xs text-gray-600">Alerts nearby NGOs</p>
                </div>
              </div>
            </div>
          </div>

          {/* Key Features */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h5 className="font-semibold text-blue-900 mb-2">🎯 Ticket Matching</h5>
              <p className="text-xs text-gray-700">AI-powered matching between help requests and NGO resources based on location, category, and availability</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <h5 className="font-semibold text-green-900 mb-2">🗺️ Geospatial Analysis</h5>
              <p className="text-xs text-gray-700">Real-time heat maps showing disaster zones, NGO coverage areas, and active ticket locations</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <h5 className="font-semibold text-purple-900 mb-2">⚡ Real-time Updates</h5>
              <p className="text-xs text-gray-700">WebSocket connections for instant notifications, status updates, and dashboard synchronization</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArchitectureDiagram;
