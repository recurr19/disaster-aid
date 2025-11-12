import { useContext, useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, Phone, MapPin, Users, FileText, Camera, Search, X, PlusCircle, Clock, CheckCircle2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import API from '../api/axios';
import { getTrackerStatus } from '../api/tracker';
import { connectRealtime } from '../api/realtime';
import TicketSuccessModal from "../components/modals/TicketSuccessModal";
import TicketStatusView from "../components/modals/TicketStatusView";
import NGODashboard from "../components/ngo/NGODashboard";
import AuthorityDashboard from "../components/authority/AuthorityDashboard";
import DispatcherDashboard from "../components/dispatcher/DispatcherDashboard";
import AppHeader from "../components/common/AppHeader";

// --- Leaflet / Map imports (add these near the top with other imports) ---
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet's default icon URLs when bundling with CRA / webpack
// Place this once in this file (or a shared file) so the marker icons show up
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});



const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const { role } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('request');
  const [sidebarTab, setSidebarTab] = useState('new'); // 'new' | 'active' | 'past'
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketStatus, setShowTicketStatus] = useState(false);
  const [newTicketId, setNewTicketId] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSOS, setIsSOS] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  // removed legacy mobile menu state after header refactor
  const [locating, setLocating] = useState(false);
  const [coords, setCoords] = useState({ lat: null, lng: null });
  const [networkStrength, setNetworkStrength] = useState(100); // 0-100
  const [batteryLevel, setBatteryLevel] = useState(100); // 0-100
  const [isCharging, setIsCharging] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  
  // File upload state
  const [files, setFiles] = useState([]);
  const [uploadError, setUploadError] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  // Accepted file types
  const acceptedTypes = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'audio/mpeg': ['.mp3'],
    'audio/wav': ['.wav'],
    'audio/ogg': ['.ogg']
  };

  const handleFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files);
    setUploadError(null);

    // Validate file types
    const invalidFiles = selectedFiles.filter(file => 
      !Object.keys(acceptedTypes).some(type => file.type === type)
    );

    if (invalidFiles.length > 0) {
      setUploadError('Please upload only images (JPG, PNG) or audio files (MP3, WAV, OGG)');
      return;
    }

    // Validate total size (10MB limit per file)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB in bytes
    const oversizedFiles = selectedFiles.filter(file => file.size > MAX_SIZE);
    
    if (oversizedFiles.length > 0) {
      setUploadError('Each file must be less than 10MB');
      return;
    }

    // Add new files to state
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setUploadError(null);
  };

  const isImage = (file) => file.type.startsWith('image/');
  const isAudio = (file) => file.type.startsWith('audio/');
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    landmark: '',
    adults: 1,
    children: 0,
    elderly: 0,
    helpTypes: [],
    medicalNeeds: [],
    description: '',
    ticketId: ''
  });

  const helpTypes = [
    'Food', 'Water', 'Shelter', 'Medical', 'Rescue', 
    'Sanitation', 'Baby Supplies', 'Transportation', 'Power/Charging'
  ];

  const medicalNeeds = [
    'insulin', 'dialysis', 'wheelchair', 'oxygen', 
    'medication', 'infant care', 'elderly care', 'mental health'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckbox = (category, value) => {
    setFormData(prev => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter(item => item !== value)
        : [...prev[category], value]
    }));
  };

  const handleNumberChange = (field, delta) => {
    setFormData(prev => ({
      ...prev,
      [field]: Math.max(0, prev[field] + delta)
    }));
  };

  const handleNumberInput = (field, value) => {
    const numValue = parseInt(value) || 0;
    setFormData(prev => ({
      ...prev,
      [field]: Math.max(0, numValue)
    }));
  };

  // Save request to localStorage for offline support
  const saveRequestToQueue = (formDataToSend) => {
    try {
      const queueKey = 'disaster_aid_pending_requests';
      const existingQueue = JSON.parse(localStorage.getItem(queueKey) || '[]');
      
      // Convert FormData to plain object for storage
      const requestData = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        data: {},
        files: []
      };

      // Extract form data
      for (let [key, value] of formDataToSend.entries()) {
        if (key === 'files[]') {
          // Store file info (can't store actual file in localStorage)
          requestData.files.push({
            name: value.name,
            type: value.type,
            size: value.size
          });
        } else {
          requestData.data[key] = value;
        }
      }

      existingQueue.push(requestData);
      localStorage.setItem(queueKey, JSON.stringify(existingQueue));
      setPendingRequests(existingQueue);
      
      return requestData.id;
    } catch (error) {
      console.error('Error saving request to queue:', error);
      return null;
    }
  };

  // Process queued requests when network is available
  const processQueuedRequests = useCallback(async () => {
    if (isProcessingQueue) return;
    
    const queueKey = 'disaster_aid_pending_requests';
    const queue = JSON.parse(localStorage.getItem(queueKey) || '[]');
    
    if (queue.length === 0) return;

    setIsProcessingQueue(true);

    for (const request of queue) {
      try {
        // Recreate FormData from stored data
        const formDataToSend = new FormData();
        Object.entries(request.data).forEach(([key, value]) => {
          formDataToSend.append(key, value);
        });

        // Try to submit
        const res = await API.post("/tickets", formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (res.status === 201) {
          // Remove successfully submitted request from queue
          const updatedQueue = queue.filter(q => q.id !== request.id);
          localStorage.setItem(queueKey, JSON.stringify(updatedQueue));
          setPendingRequests(updatedQueue);
          
          console.log(`Queued request ${request.id} submitted successfully`);
          alert(`✅ Queued emergency request submitted! Ticket ID: ${res.data.ticketId}`);
        }
      } catch (error) {
        console.error(`Failed to submit queued request ${request.id}:`, error);
        // Keep in queue to retry later
      }
    }

    setIsProcessingQueue(false);
  }, [isProcessingQueue]);

  const handleSubmit = async () => {
    // Create FormData outside try block so it's accessible in catch
    const formDataToSend = new FormData();
    
    try {
      setLoadingTickets(true);
      setUploading(true);

      // Append basic form data
      Object.entries({ ...formData, isSOS }).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          // Handle arrays (like helpTypes and medicalNeeds)
          value.forEach(item => formDataToSend.append(key + '[]', item));
        } else {
          formDataToSend.append(key, value);
        }
      });

      // Append coordinates if available
      if (coords.lat != null && coords.lng != null) {
        formDataToSend.append('latitude', coords.lat);
        formDataToSend.append('longitude', coords.lng);
      }

      // Append battery and network levels
      formDataToSend.append('batteryLevel', batteryLevel);
      formDataToSend.append('networkStrength', networkStrength);

      // Append files
      files.forEach(file => {
        formDataToSend.append('files[]', file);
      });

      console.log("Submitting request with files");
      const res = await API.post("/tickets", formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.status === 201 && res.data?.ticketId) {
        setNewTicketId(res.data.ticketId);
        setShowSuccessModal(true);
        
        setFormData({
          name: '',
          phone: '',
          address: '',
          landmark: '',
          adults: 1,
          children: 0,
          elderly: 0,
          helpTypes: [],
          medicalNeeds: [],
          description: '',
          ticketId: ''
        });
        setIsSOS(false);
      } else {
        alert("Failed to submit request. Please try again.");
      }

    } catch (error) {
      console.error("Error submitting ticket:", error);
      
      // If network error, save to queue for later submission
      if (networkStrength < 20 || !navigator.onLine || error.message.includes('Network')) {
        const queueId = saveRequestToQueue(formDataToSend);
        if (queueId) {
          alert("⚠️ Network is weak. Your request has been saved and will be submitted automatically when connection improves.");
          
          // Clear form
          setFormData({
            name: '',
            phone: '',
            address: '',
            landmark: '',
            adults: 1,
            children: 0,
            elderly: 0,
            helpTypes: [],
            medicalNeeds: [],
            description: '',
            ticketId: ''
          });
          setIsSOS(false);
        } else {
          alert("Failed to save request. Please try again.");
        }
      } else {
        alert("Something went wrong. Please check your network or try again.");
      }
    } finally {
      setLoadingTickets(false);
      setUploading(false);
      // Clear files after successful submission
      setFiles([]);
    }
  };

  const [trackerData, setTrackerData] = useState(null);
  const [trackerLoading, setTrackerLoading] = useState(false);
  const [trackerError, setTrackerError] = useState('');
  const [pollId, setPollId] = useState(null);

  const handleStatusCheck = useCallback(async () => {
    if (!formData.ticketId) return;
    try {
      setTrackerLoading(true);
      setTrackerError('');
      const res = await getTrackerStatus(formData.ticketId);
      setTrackerData(res);
    } catch (e) {
      setTrackerData(null);
      setTrackerError('Ticket not found or server error.');
    } finally {
      setTrackerLoading(false);
    }
  }, [formData.ticketId]);

  // Auto-refresh tracker every 12s when status tab is active and ticketId present
  useEffect(() => {
    if (activeTab !== 'status' || !formData.ticketId) {
      if (pollId) {
        clearInterval(pollId);
        setPollId(null);
      }
      return;
    }
    const id = setInterval(() => {
      handleStatusCheck();
    }, 12000);
    setPollId(id);
    return () => clearInterval(id);
  }, [activeTab, formData.ticketId, handleStatusCheck, pollId]);

  // Realtime updates for current ticket
  useEffect(() => {
    if (activeTab !== 'status' || !formData.ticketId) return;
    const s = connectRealtime();
    const channel = `ticket:update:${formData.ticketId}`;
    const handler = () => handleStatusCheck();
    s.on(channel, handler);
    return () => {
      s.off(channel, handler);
    };
  }, [activeTab, formData.ticketId, handleStatusCheck]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleUseCurrentLocation = () => {
    if (!('geolocation' in navigator)) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });
        setLocating(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        // Provide a simple human-friendly message
        switch (error.code) {
          case error.PERMISSION_DENIED:
            alert('Location permission denied. Please allow location access and try again.');
            break;
          case error.POSITION_UNAVAILABLE:
            alert('Location information is unavailable.');
            break;
          case error.TIMEOUT:
            alert('Location request timed out. Please try again.');
            break;
          default:
            alert('Unable to retrieve location.');
        }
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    if (!user) return;
    // If the route role doesn't match logged-in user's role, redirect to correct dashboard
    if (role && user.role !== role) {
      navigate(`/dashboard/${user.role}`, { replace: true });
    }
  }, [user, role, navigate]);

  // Fetch tickets when citizen sidebar switches to active/past
  useEffect(() => {
    if (!user) return;
    if (user.role !== 'citizen') return;
    if (sidebarTab !== 'active' && sidebarTab !== 'past') return;
    const controller = new AbortController();
    async function fetchTickets() {
      try {
        setLoadingTickets(true);
        const status = sidebarTab === 'active' ? 'active' : 'completed';
        const res = await API.get('/tickets', { params: { status }, signal: controller.signal });
        setTickets(Array.isArray(res.data?.tickets) ? res.data.tickets : []);
      } catch (e) {
        if (e.name !== 'CanceledError') {
          setTickets([]);
        }
      } finally {
        setLoadingTickets(false);
      }
    }
    fetchTickets();
    return () => controller.abort();
  }, [sidebarTab, user]);

  // Monitor network connection and measure actual strength via latency
  useEffect(() => {
    const measureNetworkStrength = async () => {
      if (!navigator.onLine) {
        setIsOffline(true);
        setNetworkStrength(0);
        return;
      }

      setIsOffline(false);

      try {
        const startTime = performance.now();
        
        // Ping a reliable endpoint (Google's DNS or your backend)
        await fetch('https://dns.google/resolve?name=example.com', {
          method: 'GET',
          mode: 'no-cors',
          cache: 'no-cache'
        });

        const endTime = performance.now();
        const latency = endTime - startTime;

        // Calculate strength based on latency (lower is better)
        // Excellent: <100ms = 100%
        // Good: 100-300ms = 70-99%
        // Fair: 300-600ms = 40-69%
        // Poor: 600-1000ms = 20-39%
        // Very Poor: >1000ms = 1-19%
        let strength;
        if (latency < 100) {
          strength = 100;
        } else if (latency < 300) {
          strength = 70 + Math.round((300 - latency) / 200 * 30);
        } else if (latency < 600) {
          strength = 40 + Math.round((600 - latency) / 300 * 30);
        } else if (latency < 1000) {
          strength = 20 + Math.round((1000 - latency) / 400 * 20);
        } else {
          strength = Math.max(1, 20 - Math.round((latency - 1000) / 200));
        }

        setNetworkStrength(Math.min(100, Math.max(0, strength)));
      } catch (error) {
        // If ping fails, fallback to connection API
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (connection && connection.downlink) {
          // Use downlink speed (Mbps) as indicator
          const downlink = connection.downlink;
          if (downlink >= 10) setNetworkStrength(100);
          else if (downlink >= 5) setNetworkStrength(80);
          else if (downlink >= 2) setNetworkStrength(60);
          else if (downlink >= 1) setNetworkStrength(40);
          else if (downlink >= 0.5) setNetworkStrength(20);
          else setNetworkStrength(10);
        } else {
          setNetworkStrength(50); // Unknown, assume medium
        }
      }
    };

    // Initial measurement
    measureNetworkStrength();

    // Re-measure every 10 seconds for real-time monitoring
    const interval = setInterval(measureNetworkStrength, 10000);

    // Listen for online/offline events
    const handleOnline = () => measureNetworkStrength();
    const handleOffline = () => {
      setIsOffline(true);
      setNetworkStrength(0);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load pending requests from localStorage on mount
  useEffect(() => {
    const queueKey = 'disaster_aid_pending_requests';
    const queue = JSON.parse(localStorage.getItem(queueKey) || '[]');
    setPendingRequests(queue);
  }, []);

  // Auto-process queue when network improves
  useEffect(() => {
    if (networkStrength >= 40 && !isOffline && pendingRequests.length > 0) {
      console.log('Network improved, processing queued requests...');
      processQueuedRequests();
    }
  }, [networkStrength, isOffline, pendingRequests.length, processQueuedRequests]);

  // Monitor battery level
  useEffect(() => {
    const updateBatteryStatus = (battery) => {
      setBatteryLevel(Math.round(battery.level * 100));
      setIsCharging(battery.charging);
    };

    if ('getBattery' in navigator) {
      navigator.getBattery().then((battery) => {
        updateBatteryStatus(battery);
        battery.addEventListener('levelchange', () => updateBatteryStatus(battery));
        battery.addEventListener('chargingchange', () => updateBatteryStatus(battery));
      });
    }
  }, []);

  // No sync needed; Check Status handled inside main tabs

  if (!user) return null;

  if (user.role === 'ngo') {
  return <NGODashboard />;
}


  if (user.role === 'authority') {
    return <AuthorityDashboard user={user} onLogout={handleLogout} />;
  }

  if (user.role === 'dispatcher') {
    return <DispatcherDashboard user={user} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-rose-50/30">
      <AppHeader
        subtitle="Crisis Relief Platform"
        onLogout={handleLogout}
        rightSlot={(
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${
            isOffline ? 'text-red-700 bg-red-50 border-red-100' : 'text-green-700 bg-green-50 border-green-100'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isOffline ? 'bg-red-600' : 'bg-green-600'} animate-pulse`}></div>
            <span className="text-xs font-semibold">{isOffline ? 'OFFLINE' : 'ONLINE'}</span>
          </div>
        )}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Citizen sidebar + content layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <aside className="lg:col-span-3">
            <div className="bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 rounded-2xl shadow-lg border border-white/60 p-5 sticky top-24">
              <p className="text-sm font-semibold text-gray-700 mb-4 tracking-wide uppercase">Your Tickets</p>
              <nav className="space-y-2">
                <button 
                  onClick={() => setSidebarTab('new')} 
                  className={`group w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-all ${
                    sidebarTab==='new'
                      ?'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-lg shadow-rose-500/30'
                      :'text-gray-700 hover:bg-rose-50 hover:text-rose-700'
                  }`}
                >
                  <PlusCircle className="w-5 h-5" /> 
                  <span>New Request</span>
                </button>
                <button 
                  onClick={() => setSidebarTab('active')} 
                  className={`group w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-all ${
                    sidebarTab==='active'
                      ?'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                      :'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  <Clock className="w-5 h-5" /> 
                  <span>Active Tickets</span>
                </button>
                <button 
                  onClick={() => setSidebarTab('past')} 
                  className={`group w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-all ${
                    sidebarTab==='past'
                      ?'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                      :'text-gray-700 hover:bg-emerald-50 hover:text-emerald-700'
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5" /> 
                  <span>Past Tickets</span>
                </button>
              </nav>
            </div>
          </aside>

          <main className="lg:col-span-9">
            {sidebarTab === 'new' && (
              <>
                {/* Offline Queue Alert */}
                {isOffline && pendingRequests.length > 0 && (
                  <div className="glass-card border-l-4 border-yellow-500 bg-gradient-to-r from-yellow-50/80 to-amber-50/80 backdrop-blur supports-[backdrop-filter]:bg-yellow-50/60 p-5 rounded-2xl shadow-lg mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-100 rounded-xl">
                        <AlertTriangle className="w-6 h-6 text-yellow-700" />
                      </div>
                      <div>
                        <h4 className="font-bold text-yellow-900">Offline Queue</h4>
                        <p className="text-sm text-yellow-800">
                          You have <strong>{pendingRequests.length}</strong> ticket(s) pending. They will be submitted once connectivity returns.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Hero Header */}
                <div className="text-center mb-8">
                  <div className="inline-flex p-4 bg-gradient-to-br from-rose-500/10 to-red-500/10 rounded-2xl mb-4">
                    <AlertTriangle className="w-14 h-14 text-rose-600" />
                  </div>
                  <h2 className="text-4xl font-bold bg-gradient-to-r from-rose-600 to-red-600 bg-clip-text text-transparent mb-2">
                    Emergency Assistance
                  </h2>
                  <p className="text-lg text-gray-600">Report your situation and get connected with relief teams</p>
                </div>

                {/* Emergency Alert Box */}
                <div className="glass-card border-l-4 border-rose-500 bg-gradient-to-r from-rose-50/80 to-red-50/80 backdrop-blur supports-[backdrop-filter]:bg-rose-50/60 p-6 rounded-2xl shadow-lg mb-8 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-rose-500/5 to-red-500/5"></div>
                  <div className="relative flex items-start gap-4">
                    <div className="p-3 bg-rose-100 rounded-2xl flex-shrink-0 animate-pulse-glow">
                      <AlertTriangle className="w-6 h-6 text-rose-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-rose-900 text-lg mb-1">Life-Threatening Emergency?</h3>
                      <p className="text-rose-800 text-sm">
                        If you're in immediate danger, call local emergency services first (112, 100, 108). 
                        Then use this form to coordinate relief efforts.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Main Card with Tabs */}
                <div className="glass-card bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80 rounded-2xl shadow-xl border border-white/60 overflow-hidden">
                  <div className="border-b border-gray-100">
                    <div className="flex">
                      <button
                        onClick={() => setActiveTab('request')}
                        className={`group flex-1 px-6 py-4 text-center font-semibold border-b-2 transition-all ${
                          activeTab === 'request'
                            ? 'border-rose-600 text-rose-600 bg-gradient-to-t from-rose-50/50 to-transparent'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
                        }`}
                      >
                        <FileText className="w-5 h-5 inline mr-2" />
                        Request Help
                      </button>
                      <button
                        onClick={() => setActiveTab('status')}
                        className={`group flex-1 px-6 py-4 text-center font-semibold border-b-2 transition-all ${
                          activeTab === 'status'
                            ? 'border-blue-600 text-blue-600 bg-gradient-to-t from-blue-50/50 to-transparent'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
                        }`}
                      >
                        <Search className="w-5 h-5 inline mr-2" />
                        Check Status
                      </button>
                    </div>
                  </div>

          <div className="p-6 sm:p-8">
            {activeTab === 'request' ? (
              <div className="space-y-8">
                {/* SOS Checkbox */}
                <div className="glass-card border-l-4 border-rose-500 bg-gradient-to-r from-rose-50/60 to-red-50/60 backdrop-blur supports-[backdrop-filter]:bg-rose-50/40 rounded-xl p-5">
                  <label className="flex items-start space-x-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={isSOS}
                      onChange={(e) => setIsSOS(e.target.checked)}
                      className="mt-1 w-5 h-5 text-rose-600 rounded-lg focus:ring-rose-500 focus:ring-offset-2 transition-all"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-5 h-5 text-rose-600 group-hover:animate-pulse" />
                        <span className="font-bold text-rose-900 text-lg">
                          This is a life-threatening emergency (SOS)
                        </span>
                      </div>
                      <p className="text-rose-700 text-sm mt-1">
                        Check this if you or others are in immediate danger and need urgent assistance
                      </p>
                    </div>
                  </label>
                </div>

                {/* Contact Information */}
                <div className="glass-card bg-white/50 backdrop-blur supports-[backdrop-filter]:bg-white/40 rounded-xl p-6 border border-white/60">
                  <div className="flex items-center space-x-2 mb-5">
                    <div className="p-2 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-xl">
                      <Phone className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Contact Information</h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Your Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Your full name"
                        className="w-full px-4 py-3 bg-white/80 backdrop-blur border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm hover:shadow-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Phone Number <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+91 98765 43210"
                        className="w-full px-4 py-3 bg-white/80 backdrop-blur border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm hover:shadow-md"
                      />
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="glass-card bg-white/50 backdrop-blur supports-[backdrop-filter]:bg-white/40 rounded-xl p-6 border border-white/60">
                  <div className="flex items-center space-x-2 mb-5">
                    <div className="p-2 bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 rounded-xl">
                      <MapPin className="w-5 h-5 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Location</h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={locating}
                    className={`mb-4 px-6 py-3 rounded-xl font-semibold transition-all flex items-center space-x-2 shadow-lg ${
                      locating 
                        ? 'bg-gray-400 text-white cursor-not-allowed' 
                        : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:shadow-xl hover:scale-105'
                    }`}
                  >
                    <MapPin className="w-5 h-5" />
                    <span>{locating ? 'Locating...' : 'Use Current Location'}</span>
                  </button>
                  {coords.lat != null && coords.lng != null && (
                    <div className="mt-3">
                      <div className="flex items-center gap-4 mb-3 text-sm font-medium text-gray-700">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Latitude:</span>
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg font-mono">{coords.lat.toFixed(6)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Longitude:</span>
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg font-mono">{coords.lng.toFixed(6)}</span>
                        </div>
                      </div>

                      {/* Map */}
                      <div className="mt-4 rounded-xl overflow-hidden border border-gray-200 shadow-lg">
                        <MapContainer
                          center={[coords.lat, coords.lng]}
                          zoom={15}
                          scrollWheelZoom={true}
                          style={{ height: '300px', width: '100%' }}
                        >
                          <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />
                          <Marker position={[coords.lat, coords.lng]}>
                            <Popup>
                              Current location<br />
                              Lat: {coords.lat.toFixed(6)}, Lng: {coords.lng.toFixed(6)}
                            </Popup>
                          </Marker>
                        </MapContainer>
                      </div>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Address/Area</label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Building, street, area"
                        className="w-full px-4 py-3 bg-white/80 backdrop-blur border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-sm hover:shadow-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Landmark</label>
                      <input
                        type="text"
                        name="landmark"
                        value={formData.landmark}
                        onChange={handleInputChange}
                        placeholder="Near school, hospital, etc."
                        className="w-full px-4 py-3 bg-white/80 backdrop-blur border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-sm hover:shadow-md"
                      />
                    </div>
                  </div>
                </div>

                {/* Number of People */}
                <div className="glass-card bg-white/50 backdrop-blur supports-[backdrop-filter]:bg-white/40 rounded-xl p-6 border border-white/60">
                  <div className="flex items-center space-x-2 mb-5">
                    <div className="p-2 bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-xl">
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Number of People</h3>
                  </div>
                  <div className="grid md:grid-cols-3 gap-6">
                    {[
                      { field: 'adults', label: 'Adults' },
                      { field: 'children', label: 'Children' },
                      { field: 'elderly', label: 'Elderly' }
                    ].map(({ field, label }) => (
                      <div key={field} className="text-center">
                        <p className="font-semibold text-gray-700 mb-3">{label}</p>
                        <div className="flex items-center justify-center space-x-3">
                          <button
                            type="button"
                            onClick={() => handleNumberChange(field, -1)}
                            className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 border border-purple-200 flex items-center justify-center text-xl font-bold text-purple-700 transition-all hover:scale-110 active:scale-95 shadow-md hover:shadow-lg"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={formData[field]}
                            onChange={(e) => handleNumberInput(field, e.target.value)}
                            className="text-3xl font-bold w-20 text-center bg-white/80 backdrop-blur border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm"
                          />
                          <button
                            type="button"
                            onClick={() => handleNumberChange(field, 1)}
                            className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 border border-purple-200 flex items-center justify-center text-xl font-bold text-purple-700 transition-all hover:scale-110 active:scale-95 shadow-md hover:shadow-lg"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Type of Help */}
                <div className="glass-card bg-white/50 backdrop-blur supports-[backdrop-filter]:bg-white/40 rounded-xl p-6 border border-white/60">
                  <h3 className="text-xl font-bold text-gray-900 mb-5">Type of Help Needed</h3>
                  <div className="grid md:grid-cols-3 gap-3">
                    {helpTypes.map(type => (
                      <label
                        key={type}
                        className="group flex items-center space-x-3 p-4 bg-white/80 backdrop-blur border-2 border-gray-200 rounded-xl cursor-pointer hover:border-rose-400 hover:bg-rose-50/50 transition-all has-[:checked]:border-rose-500 has-[:checked]:bg-gradient-to-br has-[:checked]:from-rose-50 has-[:checked]:to-red-50 has-[:checked]:shadow-lg"
                      >
                        <input
                          type="checkbox"
                          checked={formData.helpTypes.includes(type)}
                          onChange={() => handleCheckbox('helpTypes', type)}
                          className="w-5 h-5 text-rose-600 rounded-lg focus:ring-rose-500 focus:ring-offset-2 transition-all"
                        />
                        <span className="font-medium text-gray-700 group-has-[:checked]:text-rose-900 group-has-[:checked]:font-semibold">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Medical Needs */}
                <div className="glass-card bg-white/50 backdrop-blur supports-[backdrop-filter]:bg-white/40 rounded-xl p-6 border border-white/60">
                  <h3 className="text-xl font-bold text-gray-900 mb-5">Special Medical/Care Needs</h3>
                  <div className="grid md:grid-cols-3 gap-3">
                    {medicalNeeds.map(need => (
                      <label
                        key={need}
                        className="group flex items-center space-x-3 p-4 bg-white/80 backdrop-blur border-2 border-gray-200 rounded-xl cursor-pointer hover:border-red-400 hover:bg-red-50/50 transition-all has-[:checked]:border-red-500 has-[:checked]:bg-gradient-to-br has-[:checked]:from-red-50 has-[:checked]:to-rose-50 has-[:checked]:shadow-lg"
                      >
                        <input
                          type="checkbox"
                          checked={formData.medicalNeeds.includes(need)}
                          onChange={() => handleCheckbox('medicalNeeds', need)}
                          className="w-5 h-5 text-red-600 rounded-lg focus:ring-red-500 focus:ring-offset-2 transition-all"
                        />
                        <span className="font-medium text-gray-700 group-has-[:checked]:text-red-900 group-has-[:checked]:font-semibold">{need}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="glass-card bg-white/50 backdrop-blur supports-[backdrop-filter]:bg-white/40 rounded-xl p-6 border border-white/60">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Description</h3>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe your situation, any injuries, immediate dangers, or other important details..."
                    rows="5"
                    className="w-full px-4 py-3 bg-white/80 backdrop-blur border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none transition-all shadow-sm hover:shadow-md"
                  />
                </div>

                {/* File Upload */}
                <div className="glass-card bg-white/50 backdrop-blur supports-[backdrop-filter]:bg-white/40 rounded-xl p-6 border border-white/60">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="p-2 bg-gradient-to-br from-indigo-500/10 to-indigo-600/10 rounded-xl">
                      <Camera className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Photos/Evidence (Optional)</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <label 
                      className="group border-2 border-dashed border-gray-300 hover:border-indigo-400 rounded-xl p-8 text-center transition-all cursor-pointer block relative bg-gradient-to-br from-indigo-50/20 to-purple-50/20 hover:from-indigo-50/40 hover:to-purple-50/40"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleFileSelect({ target: { files: e.dataTransfer.files } });
                      }}
                    >
                      <input
                        type="file"
                        multiple
                        accept=".jpg,.jpeg,.png,.mp3,.wav,.ogg"
                        onChange={handleFileSelect}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={uploading}
                      />
                      <div className="p-3 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl inline-block mb-3">
                        <Camera className="w-10 h-10 text-indigo-600" />
                      </div>
                      <p className="text-gray-700 font-semibold mb-1">
                        {uploading ? 'Uploading...' : 'Click or drag files here'}
                      </p>
                      <p className="text-gray-500 text-sm">
                        Upload photos or audio files (JPG, PNG, MP3, WAV, OGG)
                      </p>
                      <p className="text-gray-500 text-sm mt-1">Max 10MB per file</p>
                    </label>

                    {uploadError && (
                      <div className="glass-card border-l-4 border-red-500 bg-red-50/80 backdrop-blur p-3 rounded-xl">
                        <p className="text-red-700 text-sm font-medium">{uploadError}</p>
                      </div>
                    )}

                    {files.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {files.map((file, index) => (
                          <div key={index} className="relative group">
                            {isImage(file) ? (
                              <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 border-2 border-gray-200 shadow-md group-hover:shadow-xl transition-all">
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt={`Upload preview ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : isAudio(file) && (
                              <div className="aspect-square rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 border-2 border-purple-200 flex items-center justify-center p-4 shadow-md group-hover:shadow-xl transition-all">
                                <div className="text-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-indigo-600 mb-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                  </svg>
                                  <p className="text-xs text-indigo-700 font-medium truncate">{file.name}</p>
                                </div>
                              </div>
                            )}
                            <button
                              onClick={() => removeFile(index)}
                              className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-110"
                              type="button"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Network and Battery Indicators */}
                <div className="glass-card bg-gradient-to-br from-gray-50/80 to-slate-50/80 backdrop-blur supports-[backdrop-filter]:bg-gray-50/60 rounded-xl p-5 border border-gray-200">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center space-x-6">
                      {/* Network Signal */}
                      <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                        networkStrength === 0 ? 'bg-red-100 text-red-700' : 
                        networkStrength < 40 ? 'bg-orange-100 text-orange-700' : 
                        networkStrength < 70 ? 'bg-yellow-100 text-yellow-700' : 
                        'bg-green-100 text-green-700'
                      }`}>
                        <div className="flex items-center space-x-0.5">
                          <div className={`w-1 h-2 rounded-sm ${networkStrength > 0 ? 'bg-current' : 'bg-gray-400'}`}></div>
                          <div className={`w-1 h-3 rounded-sm ${networkStrength > 25 ? 'bg-current' : 'bg-gray-400'}`}></div>
                          <div className={`w-1 h-4 rounded-sm ${networkStrength > 50 ? 'bg-current' : 'bg-gray-400'}`}></div>
                          <div className={`w-1 h-5 rounded-sm ${networkStrength > 75 ? 'bg-current' : 'bg-gray-400'}`}></div>
                        </div>
                        <span className="font-semibold text-sm">
                          {networkStrength === 0 ? 'No Signal' : 
                           networkStrength < 40 ? 'Weak' : 
                           networkStrength < 70 ? 'Fair' : 
                           'Strong'}
                        </span>
                      </div>

                      {/* Battery Level */}
                      <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                        batteryLevel < 20 ? 'bg-red-100 text-red-700' : 
                        batteryLevel < 50 ? 'bg-yellow-100 text-yellow-700' : 
                        'bg-green-100 text-green-700'
                      }`}>
                        <div className="relative w-6 h-3 border-2 border-current rounded-sm">
                          <div className="absolute top-0 right-0 -mr-1 h-full w-0.5 bg-current rounded-r-sm"></div>
                          <div 
                            className={`h-full rounded-l-sm ${
                              batteryLevel < 20 ? 'bg-red-600' : 
                              batteryLevel < 50 ? 'bg-yellow-600' : 
                              'bg-green-600'
                            } transition-all duration-300`}
                            style={{ width: `${batteryLevel}%` }}
                          ></div>
                        </div>
                        <span className="font-semibold text-sm">
                          {isCharging ? '⚡ ' : ''}{batteryLevel}%
                        </span>
                      </div>

                      {/* Pending Queue Badge */}
                      {pendingRequests.length > 0 && (
                        <div className="flex items-center space-x-2 bg-orange-100 text-orange-700 px-3 py-2 rounded-lg">
                          <Clock className="w-4 h-4 animate-pulse" />
                          <span className="text-sm font-semibold">
                            {pendingRequests.length} pending
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-gray-600 text-sm italic flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      Form saved if connection lost
                    </p>
                  </div>
                </div>

                {/* Pending Queue Alert */}
                {pendingRequests.length > 0 && (
                  <div className="glass-card border-l-4 border-orange-500 bg-gradient-to-r from-orange-50/80 to-yellow-50/80 backdrop-blur supports-[backdrop-filter]:bg-orange-50/60 rounded-xl p-5">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-orange-100 rounded-xl flex-shrink-0">
                        <Clock className="w-5 h-5 text-orange-600 animate-pulse" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-orange-900 mb-1">
                          Pending Requests in Queue
                        </h4>
                        <p className="text-sm text-orange-800 mb-3">
                          {pendingRequests.length} emergency request{pendingRequests.length > 1 ? 's are' : ' is'} waiting to be submitted. 
                          {networkStrength < 40 ? ' Waiting for better network...' : ' Submitting now...'}
                        </p>
                        <button
                          onClick={processQueuedRequests}
                          disabled={isProcessingQueue || networkStrength < 20}
                          className="text-sm bg-gradient-to-r from-orange-600 to-orange-700 text-white px-5 py-2 rounded-xl font-semibold hover:from-orange-700 hover:to-orange-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                        >
                          {isProcessingQueue ? 'Processing...' : 'Retry Now'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="group w-full bg-gradient-to-r from-rose-600 via-red-600 to-rose-600 text-white py-5 px-8 rounded-2xl text-lg font-bold hover:from-rose-700 hover:via-red-700 hover:to-rose-700 transition-all shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                  <span className="relative flex items-center justify-center gap-2">
                    <AlertTriangle className="w-6 h-6" />
                    Submit Emergency Request
                  </span>
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-lg font-bold text-gray-900 mb-3">
                    Enter your ticket ID to check status
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      name="ticketId"
                      value={formData.ticketId}
                      onChange={handleInputChange}
                      placeholder="DA-1234567890"
                      className="flex-1 px-5 py-4 bg-white/80 backdrop-blur border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-medium shadow-sm hover:shadow-md transition-all"
                    />
                    <button
                      onClick={handleStatusCheck}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl font-bold hover:from-blue-700 hover:to-blue-800 transition-all flex items-center space-x-2 shadow-lg hover:shadow-xl hover:scale-105"
                    >
                      <Search className="w-5 h-5" />
                      <span>Search</span>
                    </button>
                  </div>
                </div>

                {!trackerData && !trackerLoading && (
                  <div className="text-center py-16 glass-card bg-gradient-to-br from-blue-50/30 to-indigo-50/30 backdrop-blur rounded-2xl">
                    <div className="p-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl inline-block mb-4">
                      <Search className="w-12 h-12 text-blue-600" />
                    </div>
                    <p className="text-gray-700 text-lg font-medium mb-2">
                      Enter your ticket ID above to check the status of your request
                    </p>
                    <p className="text-gray-500">
                      Your ticket ID was provided when you submitted your request
                    </p>
                  </div>
                )}
                {trackerLoading && (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading ticket status...</p>
                  </div>
                )}
                {trackerError && (
                  <div className="glass-card border-l-4 border-red-500 bg-red-50/80 backdrop-blur supports-[backdrop-filter]:bg-red-50/60 p-5 rounded-xl">
                    <p className="text-red-700 font-medium">{trackerError}</p>
                  </div>
                )}
                {trackerData && trackerData.ticket && (
                  <div className="glass-card bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80 rounded-2xl shadow-xl border border-white/60 p-6 space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">Ticket {trackerData.ticket.ticketId}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Status: <span className="font-bold text-blue-600">{trackerData.ticket.status}</span>
                        </p>
                      </div>
                      {trackerData.ticket.isSOS && (
                        <span className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-100 to-rose-100 border border-red-200 text-red-700 text-sm font-bold shadow-md">
                          🚨 SOS
                        </span>
                      )}
                    </div>
                    {trackerData.ticket.assignedTo ? (
                      <div className="glass-card border-l-4 border-green-500 bg-gradient-to-r from-green-50/80 to-emerald-50/80 backdrop-blur supports-[backdrop-filter]:bg-green-50/60 p-5 rounded-xl">
                        <p className="font-bold text-green-900 mb-2">✓ Accepted by:</p>
                        <p className="text-green-900 font-semibold text-lg">{trackerData.ticket.assignedTo.organizationName}</p>
                        <p className="text-sm text-green-800 mt-1">{trackerData.ticket.assignedTo.phone} • {trackerData.ticket.assignedTo.location}</p>
                      </div>
                    ) : (
                      <div className="glass-card border-l-4 border-blue-500 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 backdrop-blur supports-[backdrop-filter]:bg-blue-50/60 p-5 rounded-xl">
                        <p className="font-bold text-blue-900 mb-3">Matched NGOs:</p>
                        {Array.isArray(trackerData.assignments) && trackerData.assignments.length > 0 ? (
                          <ul className="space-y-2">
                            {trackerData.assignments.map(a => (
                              <li key={a.assignmentId} className="flex items-center gap-2 text-blue-900">
                                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                                <span className="font-semibold">{a.ngo?.organizationName || 'NGO'}</span>
                                <span className="text-blue-700">— {a.status}</span>
                                {a.etaMinutes && <span className="text-blue-700">• ETA ~ {a.etaMinutes} min</span>}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-blue-900">Finding NGOs near you...</p>
                        )}
                      </div>
                    )}
                    {Array.isArray(trackerData.ticket.assignmentHistory) && trackerData.ticket.assignmentHistory.length > 0 && (
                      <div className="glass-card bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/50 p-5 rounded-xl border border-gray-200">
                        <p className="font-bold text-gray-900 mb-3">Timeline</p>
                        <ul className="space-y-3">
                          {trackerData.ticket.assignmentHistory.map((h, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                              <div className="text-sm text-gray-700">
                                <span className="font-medium text-gray-900">{new Date(h.assignedAt).toLocaleString()}</span>
                                <span className="text-gray-600"> — {h.note || 'Update'}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="text-center mt-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur rounded-full border border-gray-200 shadow-sm">
            <div className="w-2 h-2 bg-gradient-to-r from-rose-500 to-red-500 rounded-full animate-pulse"></div>
            <p className="text-gray-600 text-sm font-medium">Emergency Response System</p>
          </div>
                </div>
              </>
            )}

            {/* Active and Past Tickets */}
            {(sidebarTab === 'active' || sidebarTab === 'past') && (
              <div className="glass-card bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80 rounded-2xl shadow-xl border border-white/60 p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {sidebarTab === 'active' ? '🔄 Active Tickets' : '✓ Past Tickets'}
                  </h3>
                </div>
                {loadingTickets ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading tickets...</p>
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="text-center py-16 glass-card bg-gradient-to-br from-gray-50/30 to-slate-50/30 backdrop-blur rounded-xl">
                    <div className="p-4 bg-gradient-to-br from-gray-100 to-slate-100 rounded-2xl inline-block mb-4">
                      <FileText className="w-12 h-12 text-gray-400" />
                    </div>
                    <p className="text-gray-600 font-medium">No {sidebarTab} tickets found.</p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {tickets.map((t) => (
                      <li key={t.id} className="glass-card bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/50 rounded-xl p-5 border border-white/60 hover:shadow-lg transition-all">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <p className="font-bold text-gray-900 text-lg mb-1">{t.title || `Ticket ${t.id}`}</p>
                            <p className="text-sm text-gray-600">{t.summary || t.status}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              className="px-5 py-2 text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl"
                              onClick={() => {
                                setSelectedTicket(t);
                                setShowTicketStatus(true);
                              }}
                            >
                              View Details
                            </button>
                            <span className={`px-3 py-1 rounded-lg text-xs font-bold shadow-sm ${
                              t.status==='active'
                                ?'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-200'
                                :'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200'
                            }`}>
                              {t.status}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
      {showSuccessModal && (
      <TicketSuccessModal
        ticketId={newTicketId}
        onClose={() => setShowSuccessModal(false)}
      />
    )}
      {showTicketStatus && selectedTicket && (
        <TicketStatusView
          ticket={selectedTicket}
          onClose={() => {
            setShowTicketStatus(false);
            setSelectedTicket(null);
          }}
        />
      )}
    </div>
    
  );
};

export default Dashboard;