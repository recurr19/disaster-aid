// import { useState, useEffect } from 'react';
// import { MapPin, Users, Activity, TrendingUp, Filter, X, Package, AlertCircle } from 'lucide-react';

// const NGOServiceHeatMap = () => {
//   const [selectedState, setSelectedState] = useState(null);
//   const [filterType, setFilterType] = useState('active'); // active, completed, pending
//   const [showStats, setShowStats] = useState(true);
//   const [timeRange, setTimeRange] = useState('today'); // today, week, month

//   // Mock data - Replace with API call to get actual service data
//   const serviceData = {
//     'Maharashtra': { 
//       activeRequests: 145, 
//       completedRequests: 1240, 
//       pendingRequests: 23,
//       ngosServing: 42,
//       responseTime: '18 min',
//       color: '#dc2626' // High activity
//     },
//     'Tamil Nadu': { 
//       activeRequests: 98, 
//       completedRequests: 980, 
//       pendingRequests: 15,
//       ngosServing: 35,
//       responseTime: '22 min',
//       color: '#ea580c'
//     },
//     'Karnataka': { 
//       activeRequests: 87, 
//       completedRequests: 875, 
//       pendingRequests: 12,
//       ngosServing: 28,
//       responseTime: '25 min',
//       color: '#f59e0b'
//     },
//     'West Bengal': { 
//       activeRequests: 72, 
//       completedRequests: 720, 
//       pendingRequests: 18,
//       ngosServing: 24,
//       responseTime: '30 min',
//       color: '#f59e0b'
//     },
//     'Gujarat': { 
//       activeRequests: 65, 
//       completedRequests: 650, 
//       pendingRequests: 9,
//       ngosServing: 22,
//       responseTime: '28 min',
//       color: '#fbbf24'
//     },
//     'Rajasthan': { 
//       activeRequests: 58, 
//       completedRequests: 580, 
//       pendingRequests: 14,
//       ngosServing: 19,
//       responseTime: '35 min',
//       color: '#fbbf24'
//     },
//     'Uttar Pradesh': { 
//       activeRequests: 142, 
//       completedRequests: 1420, 
//       pendingRequests: 31,
//       ngosServing: 48,
//       responseTime: '20 min',
//       color: '#b91c1c' // Highest activity
//     },
//     'Madhya Pradesh': { 
//       activeRequests: 49, 
//       completedRequests: 490, 
//       pendingRequests: 8,
//       ngosServing: 16,
//       responseTime: '38 min',
//       color: '#fbbf24'
//     },
//     'Kerala': { 
//       activeRequests: 68, 
//       completedRequests: 680, 
//       pendingRequests: 11,
//       ngosServing: 26,
//       responseTime: '24 min',
//       color: '#f59e0b'
//     },
//     'Telangana': { 
//       activeRequests: 54, 
//       completedRequests: 540, 
//       pendingRequests: 7,
//       ngosServing: 18,
//       responseTime: '32 min',
//       color: '#fbbf24'
//     },
//     'Andhra Pradesh': { 
//       activeRequests: 62, 
//       completedRequests: 620, 
//       pendingRequests: 10,
//       ngosServing: 21,
//       responseTime: '29 min',
//       color: '#fbbf24'
//     },
//     'Bihar': { 
//       activeRequests: 38, 
//       completedRequests: 380, 
//       pendingRequests: 19,
//       ngosServing: 12,
//       responseTime: '45 min',
//       color: '#fde047'
//     },
//     'Odisha': { 
//       activeRequests: 42, 
//       completedRequests: 420, 
//       pendingRequests: 13,
//       ngosServing: 14,
//       responseTime: '40 min',
//       color: '#fde047'
//     },
//     'Punjab': { 
//       activeRequests: 31, 
//       completedRequests: 310, 
//       pendingRequests: 6,
//       ngosServing: 11,
//       responseTime: '36 min',
//       color: '#fef08a'
//     },
//     'Haryana': { 
//       activeRequests: 29, 
//       completedRequests: 290, 
//       pendingRequests: 5,
//       ngosServing: 10,
//       responseTime: '34 min',
//       color: '#fef08a'
//     },
//     'Delhi': { 
//       activeRequests: 45, 
//       completedRequests: 450, 
//       pendingRequests: 8,
//       ngosServing: 15,
//       responseTime: '26 min',
//       color: '#fde047'
//     },
//     'Jharkhand': { 
//       activeRequests: 24, 
//       completedRequests: 240, 
//       pendingRequests: 11,
//       ngosServing: 8,
//       responseTime: '48 min',
//       color: '#fef3c7'
//     },
//     'Assam': { 
//       activeRequests: 28, 
//       completedRequests: 280, 
//       pendingRequests: 9,
//       ngosServing: 9,
//       responseTime: '42 min',
//       color: '#fef08a'
//     },
//     'Chhattisgarh': { 
//       activeRequests: 22, 
//       completedRequests: 220, 
//       pendingRequests: 7,
//       ngosServing: 7,
//       responseTime: '50 min',
//       color: '#fef3c7'
//     },
//     'Uttarakhand': { 
//       activeRequests: 18, 
//       completedRequests: 180, 
//       pendingRequests: 4,
//       ngosServing: 6,
//       responseTime: '44 min',
//       color: '#fef3c7'
//     },
//     'Himachal Pradesh': { 
//       activeRequests: 15, 
//       completedRequests: 150, 
//       pendingRequests: 3,
//       ngosServing: 5,
//       responseTime: '46 min',
//       color: '#fefce8'
//     },
//     'Goa': { 
//       activeRequests: 9, 
//       completedRequests: 95, 
//       pendingRequests: 2,
//       ngosServing: 4,
//       responseTime: '38 min',
//       color: '#fefce8'
//     },
//     'Puducherry': { 
//       activeRequests: 6, 
//       completedRequests: 65, 
//       pendingRequests: 1,
//       ngosServing: 3,
//       responseTime: '40 min',
//       color: '#fefce8'
//     },
//     'Jammu and Kashmir': { 
//       activeRequests: 19, 
//       completedRequests: 190, 
//       pendingRequests: 8,
//       ngosServing: 7,
//       responseTime: '52 min',
//       color: '#fef3c7'
//     },
//     'Chandigarh': { 
//       activeRequests: 4, 
//       completedRequests: 45, 
//       pendingRequests: 1,
//       ngosServing: 2,
//       responseTime: '35 min',
//       color: '#fefce8'
//     }
//   };

//   const getFilteredCount = (state) => {
//     const data = serviceData[state];
//     if (filterType === 'active') return data.activeRequests;
//     if (filterType === 'completed') return data.completedRequests;
//     if (filterType === 'pending') return data.pendingRequests;
//     return data.activeRequests;
//   };

//   const totalActive = Object.values(serviceData).reduce((sum, state) => sum + state.activeRequests, 0);
//   const totalCompleted = Object.values(serviceData).reduce((sum, state) => sum + state.completedRequests, 0);
//   const totalPending = Object.values(serviceData).reduce((sum, state) => sum + state.pendingRequests, 0);
//   const totalNGOs = Object.values(serviceData).reduce((sum, state) => sum + state.ngosServing, 0);

//   const sortedStatesByActivity = Object.entries(serviceData)
//     .sort((a, b) => b[1].activeRequests - a[1].activeRequests)
//     .slice(0, 10);

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
//       <div className="max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
//           <div className="flex items-center justify-between mb-2">
//             <div className="flex items-center space-x-3">
//               <div className="bg-gradient-to-br from-red-500 to-orange-500 p-3 rounded-lg">
//                 <Activity className="w-8 h-8 text-white" />
//               </div>
//               <div>
//                 <h1 className="text-3xl font-bold text-gray-900">NGO Service Coverage Heat Map</h1>
//                 <p className="text-gray-600">Real-time visualization of DisasterAid relief operations across India</p>
//               </div>
//             </div>
//             <div className="flex items-center space-x-2">
//               <select
//                 value={timeRange}
//                 onChange={(e) => setTimeRange(e.target.value)}
//                 className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500"
//               >
//                 <option value="today">Today</option>
//                 <option value="week">This Week</option>
//                 <option value="month">This Month</option>
//               </select>
//               <button
//                 onClick={() => setShowStats(!showStats)}
//                 className="text-gray-600 hover:text-gray-900"
//               >
//                 {showStats ? <X className="w-6 h-6" /> : <Filter className="w-6 h-6" />}
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Stats Cards */}
//         {showStats && (
//           <div className="grid md:grid-cols-4 gap-6 mb-6">
//             <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm font-medium text-gray-600 mb-1">Active Requests</p>
//                   <p className="text-4xl font-bold text-orange-600">{totalActive.toLocaleString()}</p>
//                   <p className="text-xs text-gray-500 mt-1">Being Served Now</p>
//                 </div>
//                 <Activity className="w-12 h-12 text-orange-500 opacity-20" />
//               </div>
//             </div>
//             <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm font-medium text-gray-600 mb-1">Completed</p>
//                   <p className="text-4xl font-bold text-green-600">{totalCompleted.toLocaleString()}</p>
//                   <p className="text-xs text-gray-500 mt-1">Successfully Fulfilled</p>
//                 </div>
//                 <Package className="w-12 h-12 text-green-500 opacity-20" />
//               </div>
//             </div>
//             <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm font-medium text-gray-600 mb-1">Pending</p>
//                   <p className="text-4xl font-bold text-red-600">{totalPending.toLocaleString()}</p>
//                   <p className="text-xs text-gray-500 mt-1">Awaiting Assignment</p>
//                 </div>
//                 <AlertCircle className="w-12 h-12 text-red-500 opacity-20" />
//               </div>
//             </div>
//             <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm font-medium text-gray-600 mb-1">NGOs Serving</p>
//                   <p className="text-4xl font-bold text-blue-600">{totalNGOs.toLocaleString()}</p>
//                   <p className="text-xs text-gray-500 mt-1">Active Organizations</p>
//                 </div>
//                 <Users className="w-12 h-12 text-blue-500 opacity-20" />
//               </div>
//             </div>
//           </div>
//         )}

//         <div className="grid lg:grid-cols-3 gap-6">
//           {/* Map Section */}
//           <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
//             <div className="flex items-center justify-between mb-6">
//               <h2 className="text-2xl font-bold text-gray-900">Service Coverage Map</h2>
//               <div className="flex items-center space-x-2">
//                 <button
//                   onClick={() => setFilterType('active')}
//                   className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
//                     filterType === 'active'
//                       ? 'bg-orange-600 text-white'
//                       : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
//                   }`}
//                 >
//                   Active
//                 </button>
//                 <button
//                   onClick={() => setFilterType('completed')}
//                   className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
//                     filterType === 'completed'
//                       ? 'bg-green-600 text-white'
//                       : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
//                   }`}
//                 >
//                   Completed
//                 </button>
//                 <button
//                   onClick={() => setFilterType('pending')}
//                   className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
//                     filterType === 'pending'
//                       ? 'bg-red-600 text-white'
//                       : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
//                   }`}
//                 >
//                   Pending
//                 </button>
//               </div>
//             </div>

//             {/* India Map Grid */}
//             <div className="grid grid-cols-5 gap-2 mb-6">
//               {Object.entries(serviceData).map(([state, data]) => (
//                 <div
//                   key={state}
//                   onClick={() => setSelectedState(state)}
//                   className="relative group cursor-pointer rounded-lg p-4 transition-all hover:scale-105 hover:shadow-xl"
//                   style={{ backgroundColor: data.color }}
//                 >
//                   <div className="text-white text-center">
//                     <p className="text-xs font-bold mb-1 truncate">{state}</p>
//                     <p className="text-lg font-bold">{getFilteredCount(state)}</p>
//                     <p className="text-xs opacity-80">{data.ngosServing} NGOs</p>
//                   </div>
//                   <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded-lg py-3 px-4 whitespace-nowrap z-10 shadow-xl">
//                     <p className="font-bold text-sm mb-2">{state}</p>
//                     <p>🟠 Active: {data.activeRequests}</p>
//                     <p>✅ Completed: {data.completedRequests}</p>
//                     <p>⏳ Pending: {data.pendingRequests}</p>
//                     <p className="mt-2 pt-2 border-t border-gray-700">
//                       👥 {data.ngosServing} NGOs serving
//                     </p>
//                     <p>⏱️ Avg Response: {data.responseTime}</p>
//                   </div>
//                 </div>
//               ))}
//             </div>

//             {/* Color Legend */}
//             <div className="flex items-center justify-center flex-wrap gap-4 text-sm">
//               <div className="flex items-center space-x-2">
//                 <div className="w-6 h-6 rounded bg-red-700"></div>
//                 <span className="text-gray-700 font-medium">Very High Activity (100+)</span>
//               </div>
//               <div className="flex items-center space-x-2">
//                 <div className="w-6 h-6 rounded bg-orange-500"></div>
//                 <span className="text-gray-700 font-medium">High (50-99)</span>
//               </div>
//               <div className="flex items-center space-x-2">
//                 <div className="w-6 h-6 rounded bg-yellow-400"></div>
//                 <span className="text-gray-700 font-medium">Moderate (20-49)</span>
//               </div>
//               <div className="flex items-center space-x-2">
//                 <div className="w-6 h-6 rounded bg-yellow-100"></div>
//                 <span className="text-gray-700 font-medium">Low (&lt;20)</span>
//               </div>
//             </div>
//           </div>

//           {/* Sidebar */}
//           <div className="space-y-6">
//             {/* Selected State Details */}
//             {selectedState && (
//               <div className="bg-white rounded-xl shadow-lg p-6">
//                 <div className="flex items-center justify-between mb-4">
//                   <h3 className="text-xl font-bold text-gray-900">{selectedState}</h3>
//                   <button
//                     onClick={() => setSelectedState(null)}
//                     className="text-gray-400 hover:text-gray-600"
//                   >
//                     <X className="w-5 h-5" />
//                   </button>
//                 </div>
//                 <div className="space-y-3">
//                   <div className="p-3 bg-orange-50 rounded-lg border-l-4 border-orange-500">
//                     <p className="text-sm text-gray-600 mb-1">Active Requests</p>
//                     <p className="text-2xl font-bold text-orange-600">
//                       {serviceData[selectedState].activeRequests}
//                     </p>
//                   </div>
//                   <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
//                     <p className="text-sm text-gray-600 mb-1">Completed</p>
//                     <p className="text-2xl font-bold text-green-600">
//                       {serviceData[selectedState].completedRequests}
//                     </p>
//                   </div>
//                   <div className="p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
//                     <p className="text-sm text-gray-600 mb-1">Pending</p>
//                     <p className="text-2xl font-bold text-red-600">
//                       {serviceData[selectedState].pendingRequests}
//                     </p>
//                   </div>
//                   <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
//                     <p className="text-sm text-gray-600 mb-1">NGOs Currently Serving</p>
//                     <p className="text-2xl font-bold text-blue-600">
//                       {serviceData[selectedState].ngosServing}
//                     </p>
//                   </div>
//                   <div className="mt-4 p-3 bg-gray-50 rounded-lg">
//                     <p className="text-sm font-semibold text-gray-700 mb-2">Performance Metrics</p>
//                     <p className="text-sm text-gray-600">
//                       ⏱️ Avg Response Time: <span className="font-bold">{serviceData[selectedState].responseTime}</span>
//                     </p>
//                     <p className="text-sm text-gray-600 mt-1">
//                       ✅ Success Rate:{' '}
//                       <span className="font-bold text-green-600">
//                         {((serviceData[selectedState].completedRequests / 
//                           (serviceData[selectedState].completedRequests + serviceData[selectedState].activeRequests)) * 100).toFixed(1)}%
//                       </span>
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             )}

//             {/* Top 10 Most Active States */}
//             <div className="bg-white rounded-xl shadow-lg p-6">
//               <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
//                 <TrendingUp className="w-5 h-5 mr-2 text-orange-600" />
//                 Most Active States
//               </h3>
//               <div className="space-y-3">
//                 {sortedStatesByActivity.map(([state, data], index) => (
//                   <div
//                     key={state}
//                     onClick={() => setSelectedState(state)}
//                     className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
//                   >
//                     <div className="flex items-center space-x-3">
//                       <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-sm">
//                         {index + 1}
//                       </div>
//                       <div>
//                         <p className="font-medium text-gray-700 text-sm">{state}</p>
//                         <p className="text-xs text-gray-500">{data.ngosServing} NGOs serving</p>
//                       </div>
//                     </div>
//                     <div className="text-right">
//                       <p className="text-lg font-bold text-orange-600">{data.activeRequests}</p>
//                       <p className="text-xs text-gray-500">active</p>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Footer Note */}
//         <div className="mt-6 bg-white rounded-xl shadow-lg p-4 text-center">
//           <p className="text-sm text-gray-600">
//             🔴 Live Data • Last Updated: <span className="font-semibold">{new Date().toLocaleString()}</span>
//             {' • '}
//             Auto-refreshing every 30 seconds
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default NGOServiceHeatMap;

/// ----------------

// import React, { useState } from "react";
// import { ComposableMap, Geographies, Geography } from "react-simple-maps";
// import { scaleLinear } from "d3-scale";
// import indiaGeo from "../data/india_full.geojson"; // <-- local geojson file

// const NGOServiceHeatMap = () => {
//   const [selectedState, setSelectedState] = useState(null);

//   // Dummy service coverage data by state
//   const serviceData = {
//     "Andhra Pradesh": 70,
//     "Maharashtra": 90,
//     "Assam": 55,
//     "Delhi": 95,
//     "Karnataka": 80,
//     "Tamil Nadu": 75,
//     "Bihar": 40,
//     "West Bengal": 60,
//   };

//   const colorScale = scaleLinear().domain([0, 100]).range(["#ffedea", "#ff5233"]);

//   return (
//     <div style={{ textAlign: "center", padding: "20px" }}>
//       <h2 className="text-2xl font-bold mb-4 text-gray-800">
//         NGO Service Coverage Heat Map
//       </h2>

//       <ComposableMap
//         projection="geoMercator"
//         projectionConfig={{
//           center: [80, 22],
//           scale: 1000,
//         }}
//         style={{ width: "100%", height: "85vh" }}
//       >
//         <Geographies geography={indiaGeo}>
//           {({ geographies }) =>
//             geographies.map((geo) => {
//               const stateName = geo.properties.NAME_1;
//               const coverage = serviceData[stateName] || 0;

//               return (
//                 <Geography
//                   key={geo.rsmKey}
//                   geography={geo}
//                   onClick={() => setSelectedState(stateName)}
//                   style={{
//                     default: {
//                       fill: colorScale(coverage),
//                       outline: "none",
//                     },
//                     hover: {
//                       fill: "#ffa07a",
//                       outline: "none",
//                     },
//                     pressed: {
//                       fill: "#ff7043",
//                       outline: "none",
//                     },
//                   }}
//                 />
//               );
//             })
//           }
//         </Geographies>
//       </ComposableMap>

//       {selectedState && (
//         <div
//           style={{
//             marginTop: "20px",
//             fontSize: "18px",
//             fontWeight: "500",
//             color: "#333",
//           }}
//         >
//           Selected State: {selectedState} — Coverage:{" "}
//           {serviceData[selectedState] || "No Data"}%
//         </div>
//       )}
//     </div>
//   );
// };

// export default NGOServiceHeatMap;


import { useState } from "react";
import { Users, Activity, Filter, X, Package, AlertCircle } from "lucide-react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import indiaGeo from "../data/india_full.geojson"; // local file

const NGOServiceHeatMap = () => {
  const [selectedState, setSelectedState] = useState(null);
  const [hoveredState, setHoveredState] = useState(null);
  const [filterType, setFilterType] = useState("active");
  const [showStats, setShowStats] = useState(true);
  const [timeRange, setTimeRange] = useState("today");

  // Sample data (replace with live API later)
  const serviceData = {
    Maharashtra: { activeRequests: 145, completedRequests: 1240, pendingRequests: 23, ngosServing: 42, responseTime: "18 min", color: "#dc2626" },
    "Uttar Pradesh": { activeRequests: 142, completedRequests: 1420, pendingRequests: 31, ngosServing: 48, responseTime: "20 min", color: "#b91c1c" },
    "Tamil Nadu": { activeRequests: 98, completedRequests: 980, pendingRequests: 15, ngosServing: 35, responseTime: "22 min", color: "#ea580c" },
    Karnataka: { activeRequests: 87, completedRequests: 875, pendingRequests: 12, ngosServing: 28, responseTime: "25 min", color: "#f59e0b" },
    "West Bengal": { activeRequests: 72, completedRequests: 720, pendingRequests: 18, ngosServing: 24, responseTime: "30 min", color: "#f59e0b" },
    Gujarat: { activeRequests: 65, completedRequests: 650, pendingRequests: 9, ngosServing: 22, responseTime: "28 min", color: "#fbbf24" },
    Rajasthan: { activeRequests: 58, completedRequests: 580, pendingRequests: 14, ngosServing: 19, responseTime: "35 min", color: "#fbbf24" },
    Kerala: { activeRequests: 68, completedRequests: 680, pendingRequests: 11, ngosServing: 26, responseTime: "24 min", color: "#f59e0b" },
    Telangana: { activeRequests: 54, completedRequests: 540, pendingRequests: 7, ngosServing: 18, responseTime: "32 min", color: "#fbbf24" },
    Bihar: { activeRequests: 38, completedRequests: 380, pendingRequests: 19, ngosServing: 12, responseTime: "45 min", color: "#fde047" },
    Odisha: { activeRequests: 42, completedRequests: 420, pendingRequests: 13, ngosServing: 14, responseTime: "40 min", color: "#fde047" },
    Delhi: { activeRequests: 45, completedRequests: 450, pendingRequests: 8, ngosServing: 15, responseTime: "26 min", color: "#fde047" },
    Assam: { activeRequests: 28, completedRequests: 280, pendingRequests: 9, ngosServing: 9, responseTime: "42 min", color: "#fef08a" },
    Punjab: { activeRequests: 31, completedRequests: 310, pendingRequests: 6, ngosServing: 11, responseTime: "36 min", color: "#fef08a" },
    Haryana: { activeRequests: 29, completedRequests: 290, pendingRequests: 5, ngosServing: 10, responseTime: "34 min", color: "#fef08a" },
  };

  // getFilteredCount not used in current UI; remove to avoid unused warnings

  const totalActive = Object.values(serviceData).reduce((sum, s) => sum + s.activeRequests, 0);
  const totalCompleted = Object.values(serviceData).reduce((sum, s) => sum + s.completedRequests, 0);
  const totalPending = Object.values(serviceData).reduce((sum, s) => sum + s.pendingRequests, 0);
  const totalNGOs = Object.values(serviceData).reduce((sum, s) => sum + s.ngosServing, 0);

  const sortedStatesByActivity = Object.entries(serviceData)
    .sort((a, b) => b[1].activeRequests - a[1].activeRequests)
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-red-500 to-orange-500 p-3 rounded-lg">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">NGO Service Coverage Heat Map</h1>
              <p className="text-gray-600">Real-time visualization of DisasterAid relief operations across India</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
            <button onClick={() => setShowStats(!showStats)} className="text-gray-600 hover:text-gray-900">
              {showStats ? <X className="w-6 h-6" /> : <Filter className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {showStats && (
          <div className="grid md:grid-cols-4 gap-6 mb-6">
            <StatCard title="Active Requests" value={totalActive} color="orange" icon={<Activity />} />
            <StatCard title="Completed" value={totalCompleted} color="green" icon={<Package />} />
            <StatCard title="Pending" value={totalPending} color="red" icon={<AlertCircle />} />
            <StatCard title="NGOs Serving" value={totalNGOs} color="blue" icon={<Users />} />
          </div>
        )}

        {/* Map + Sidebar */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6 relative">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Service Coverage Map</h2>
              <div className="flex items-center space-x-2">
                {["active", "completed", "pending"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      filterType === type
                        ? type === "active"
                          ? "bg-orange-600 text-white"
                          : type === "completed"
                          ? "bg-green-600 text-white"
                          : "bg-red-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive India Map */}
            <div className="flex justify-center relative">
              <ComposableMap projection="geoMercator" projectionConfig={{ scale: 1000, center: [82.8, 22.5] }} width={600} height={600}>
                <Geographies geography={indiaGeo}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      const stateName = geo.properties.ST_NM;
                      const data = serviceData[stateName];
                      const color = data ? data.color : "#e5e7eb";
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={color}
                          stroke="#fff"
                          strokeWidth={0.5}
                          onMouseEnter={() => setHoveredState(stateName)}
                          onMouseLeave={() => setHoveredState(null)}
                          onClick={() => setSelectedState(stateName)}
                          style={{
                            default: { outline: "none" },
                            hover: { fill: "#2563eb", outline: "none" },
                            pressed: { outline: "none" },
                          }}
                        />
                      );
                    })
                  }
                </Geographies>
              </ComposableMap>

              {/* Tooltip */}
              {hoveredState && serviceData[hoveredState] && (
                <div className="absolute bg-white shadow-lg rounded-lg p-3 border border-gray-200 text-sm text-gray-700 pointer-events-none"
                     style={{ top: "10px", right: "10px" }}>
                  <p className="font-semibold text-gray-900 mb-1">{hoveredState}</p>
                  <p>🟠 Active: {serviceData[hoveredState].activeRequests}</p>
                  <p>✅ Completed: {serviceData[hoveredState].completedRequests}</p>
                  <p>⏳ Pending: {serviceData[hoveredState].pendingRequests}</p>
                  <p>🏢 NGOs: {serviceData[hoveredState].ngosServing}</p>
                  <p>⚡ Response: {serviceData[hoveredState].responseTime}</p>
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center flex-wrap gap-4 text-sm mt-6">
              <Legend color="bg-red-700" label="Very High Activity (100+)" />
              <Legend color="bg-orange-500" label="High (50–99)" />
              <Legend color="bg-yellow-400" label="Moderate (20–49)" />
              <Legend color="bg-yellow-100" label="Low (<20)" />
            </div>
          </div>

          {/* Sidebar */}
          <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-semibold mb-4">Top 10 States by Active Requests</h3>
              <ul className="divide-y divide-gray-100">
                {sortedStatesByActivity.map(([name, data], idx) => (
                  <li key={name} className="py-3 flex justify-between items-center">
                    <span className="font-medium text-gray-700">
                      {idx + 1}. {name}
                    </span>
                    <span className="text-orange-600 font-semibold">{data.activeRequests}</span>
                  </li>
                ))}
              </ul>
            </div>

            {selectedState && serviceData[selectedState] && (
              <div className="mt-6 border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedState}</h3>
                <p className="text-sm text-gray-600">Active: {serviceData[selectedState].activeRequests}</p>
                <p className="text-sm text-gray-600">Completed: {serviceData[selectedState].completedRequests}</p>
                <p className="text-sm text-gray-600">Pending: {serviceData[selectedState].pendingRequests}</p>
                <p className="text-sm text-gray-600">NGOs: {serviceData[selectedState].ngosServing}</p>
                <p className="text-sm text-gray-600">Response: {serviceData[selectedState].responseTime}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Reusable sub-components
const StatCard = ({ title, value, color, icon }) => (
  <div className={`bg-white rounded-xl shadow-lg p-6 border-l-4 border-${color}-500`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
        <p className={`text-4xl font-bold text-${color}-600`}>{value.toLocaleString()}</p>
      </div>
      <div className={`text-${color}-500 opacity-20`}>{icon}</div>
    </div>
  </div>
);

const Legend = ({ color, label }) => (
  <div className="flex items-center space-x-2">
    <div className={`w-6 h-6 rounded ${color}`}></div>
    <span className="text-gray-700 font-medium">{label}</span>
  </div>
);

export default NGOServiceHeatMap;
