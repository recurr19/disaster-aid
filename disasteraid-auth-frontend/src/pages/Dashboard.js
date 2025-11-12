import { useContext, useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, Phone, MapPin, Users, FileText, Camera, Search, Menu, X, PlusCircle, Clock, CheckCircle2, LogOut } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import API from '../api/axios';
import { getTrackerStatus } from '../api/tracker';
import { connectRealtime } from '../api/realtime';
import TicketSuccessModal from "../components/modals/TicketSuccessModal";
import TicketStatusView from "../components/modals/TicketStatusView";
import NGODashboard from "../components/ngo/NGODashboard";
import AuthorityDashboard from "../components/authority/AuthorityDashboard";
import DispatcherDashboard from "../components/dispatcher/DispatcherDashboard";

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
  const [menuOpen, setMenuOpen] = useState(false);
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
    <div className="min-h-screen bg-rose-50">
      <div className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-red-600 p-2 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">DisasterAid</h1>
              <p className="text-sm text-gray-500">Crisis Relief Platform</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${isOffline ? 'text-red-600' : 'text-green-600'}`}>
              <div className={`w-2 h-2 rounded-full ${isOffline ? 'bg-red-600' : 'bg-green-600'}`}></div>
              <span className="text-sm font-medium">{isOffline ? 'Offline' : 'Online'}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium hidden sm:inline">Logout</span>
            </button>
            <button className="lg:hidden" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Citizen sidebar + content layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <aside className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow p-4 sticky top-24">
              <p className="text-sm text-gray-500 mb-3">Your Tickets</p>
              <nav className="space-y-2">
                <button onClick={() => setSidebarTab('new')} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left ${sidebarTab==='new'?'bg-red-50 text-red-700':'hover:bg-gray-50'}`}>
                  <PlusCircle className="w-5 h-5" /> New Request
                </button>
                <button onClick={() => setSidebarTab('active')} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left ${sidebarTab==='active'?'bg-red-50 text-red-700':'hover:bg-gray-50'}`}>
                  <Clock className="w-5 h-5" /> Active Tickets
                </button>
                <button onClick={() => setSidebarTab('past')} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left ${sidebarTab==='past'?'bg-red-50 text-red-700':'hover:bg-gray-50'}`}>
                  <CheckCircle2 className="w-5 h-5" /> Past Tickets
                </button>
                {/* Check Status is already present in main tabs */}
              </nav>
            </div>
          </aside>

          <section className="lg:col-span-9">
            {sidebarTab === 'new' && (
              <>
                <div className="text-center mb-8">
                  <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                  <h2 className="text-4xl font-bold text-gray-900 mb-2">Emergency Assistance</h2>
                  <p className="text-lg text-gray-600">Report your situation and get connected with relief teams</p>
                </div>

                <div className="bg-red-50 border-l-4 border-red-600 p-6 rounded-lg mb-8">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-bold text-red-900 text-lg mb-1">Life-Threatening Emergency?</h3>
                      <p className="text-red-800">
                        If you're in immediate danger, call local emergency services first (112, 100, 108). 
                        Then use this form to coordinate relief efforts.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="border-b border-gray-200">
                    <div className="flex">
                      <button
                        onClick={() => setActiveTab('request')}
                        className={`flex-1 px-6 py-4 text-center font-semibold border-b-2 transition-colors ${
                          activeTab === 'request'
                            ? 'border-red-600 text-red-600 bg-red-50'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        <FileText className="w-5 h-5 inline mr-2" />
                        Request Help
                      </button>
                      <button
                        onClick={() => setActiveTab('status')}
                        className={`flex-1 px-6 py-4 text-center font-semibold border-b-2 transition-colors ${
                          activeTab === 'status'
                            ? 'border-red-600 text-red-600 bg-red-50'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
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
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSOS}
                      onChange={(e) => setIsSOS(e.target.checked)}
                      className="mt-1 w-5 h-5 text-red-600 rounded focus:ring-red-500"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <span className="font-bold text-red-900 text-lg">
                          This is a life-threatening emergency (SOS)
                        </span>
                      </div>
                      <p className="text-red-700 text-sm mt-1">
                        Check this if you or others are in immediate danger and need urgent assistance
                      </p>
                    </div>
                  </label>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <Phone className="w-5 h-5 text-gray-700" />
                    <h3 className="text-xl font-bold text-gray-900">Contact Information</h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Your full name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+91 98765 43210"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <MapPin className="w-5 h-5 text-gray-700" />
                    <h3 className="text-xl font-bold text-gray-900">Location</h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={locating}
                    className={`mb-4 px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 ${locating ? 'bg-gray-400 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                  >
                    <MapPin className="w-5 h-5" />
                    <span>{locating ? 'Locating...' : 'Use Current Location'}</span>
                  </button>
                  {coords.lat != null && coords.lng != null && (
                    <div className="mt-2 text-sm text-gray-700">
                      <div>Latitude: {coords.lat.toFixed(6)}</div>
                      <div>Longitude: {coords.lng.toFixed(6)}</div>

                      {/* Map */}
                      <div className="mt-4 rounded-lg overflow-hidden border">
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

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Address/Area</label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Building, street, area"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Landmark</label>
                      <input
                        type="text"
                        name="landmark"
                        value={formData.landmark}
                        onChange={handleInputChange}
                        placeholder="Near school, hospital, etc."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <Users className="w-5 h-5 text-gray-700" />
                    <h3 className="text-xl font-bold text-gray-900">Number of People</h3>
                  </div>
                  <div className="grid md:grid-cols-3 gap-6">
                    {[
                      { field: 'adults', label: 'Adults' },
                      { field: 'children', label: 'Children' },
                      { field: 'elderly', label: 'Elderly' }
                    ].map(({ field, label }) => (
                      <div key={field} className="text-center">
                        <p className="font-medium text-gray-700 mb-3">{label}</p>
                        <div className="flex items-center justify-center space-x-4">
                          <button
                            type="button"
                            onClick={() => handleNumberChange(field, -1)}
                            className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-xl font-bold"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={formData[field]}
                            onChange={(e) => handleNumberInput(field, e.target.value)}
                            className="text-3xl font-bold w-20 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          />
                          <button
                            type="button"
                            onClick={() => handleNumberChange(field, 1)}
                            className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-xl font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Type of Help Needed</h3>
                  <div className="grid md:grid-cols-3 gap-3">
                    {helpTypes.map(type => (
                      <label
                        key={type}
                        className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={formData.helpTypes.includes(type)}
                          onChange={() => handleCheckbox('helpTypes', type)}
                          className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                        />
                        <span className="font-medium text-gray-700">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Special Medical/Care Needs</h3>
                  <div className="grid md:grid-cols-3 gap-3">
                    {medicalNeeds.map(need => (
                      <label
                        key={need}
                        className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={formData.medicalNeeds.includes(need)}
                          onChange={() => handleCheckbox('medicalNeeds', need)}
                          className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                        />
                        <span className="font-medium text-gray-700">{need}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Description</h3>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe your situation, any injuries, immediate dangers, or other important details..."
                    rows="5"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  />
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <Camera className="w-5 h-5 text-gray-700" />
                    <h3 className="text-xl font-bold text-gray-900">Photos/Evidence (Optional)</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <label 
                      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer block relative"
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
                      <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 font-medium mb-1">
                        {uploading ? 'Uploading...' : 'Click or drag files here'}
                      </p>
                      <p className="text-gray-500 text-sm">
                        Upload photos or audio files (JPG, PNG, MP3, WAV, OGG)
                      </p>
                      <p className="text-gray-500 text-sm mt-1">Max 10MB per file</p>
                    </label>

                    {uploadError && (
                      <div className="text-red-600 text-sm text-center">{uploadError}</div>
                    )}

                    {files.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {files.map((file, index) => (
                          <div key={index} className="relative group">
                            {isImage(file) ? (
                              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt={`Upload preview ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : isAudio(file) && (
                              <div className="aspect-square rounded-lg bg-gray-100 flex items-center justify-center p-4">
                                <div className="text-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto text-gray-400 mb-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                  </svg>
                                  <p className="text-xs text-gray-500 truncate">{file.name}</p>
                                </div>
                              </div>
                            )}
                            <button
                              onClick={() => removeFile(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
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

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-4">
                    {/* Network Signal Indicator */}
                    <div className={`flex items-center space-x-2 ${
                      networkStrength === 0 ? 'text-red-600' : 
                      networkStrength < 40 ? 'text-red-500' : 
                      networkStrength < 70 ? 'text-yellow-500' : 
                      'text-green-600'
                    }`}>
                      <div className="flex items-center space-x-0.5">
                        {/* Signal bars */}
                        <div className={`w-1 h-2 rounded-sm ${networkStrength > 0 ? 'bg-current' : 'bg-gray-300'}`}></div>
                        <div className={`w-1 h-3 rounded-sm ${networkStrength > 25 ? 'bg-current' : 'bg-gray-300'}`}></div>
                        <div className={`w-1 h-4 rounded-sm ${networkStrength > 50 ? 'bg-current' : 'bg-gray-300'}`}></div>
                        <div className={`w-1 h-5 rounded-sm ${networkStrength > 75 ? 'bg-current' : 'bg-gray-300'}`}></div>
                      </div>
                      <span className="font-medium">
                        {networkStrength === 0 ? 'No Signal' : 
                         networkStrength < 40 ? 'Weak Signal' : 
                         networkStrength < 70 ? 'Fair Signal' : 
                         'Strong Signal'}
                      </span>
                    </div>

                    {/* Battery Level Indicator */}
                    <div className={`flex items-center space-x-2 ${
                      batteryLevel < 20 ? 'text-red-600' : 
                      batteryLevel < 50 ? 'text-yellow-500' : 
                      'text-green-600'
                    }`}>
                      <div className="relative w-6 h-3 border-2 border-current rounded-sm">
                        <div className="absolute top-0 right-0 -mr-1 h-full w-0.5 bg-current rounded-r-sm"></div>
                        <div 
                          className={`h-full ${
                            batteryLevel < 20 ? 'bg-red-600' : 
                            batteryLevel < 50 ? 'bg-yellow-500' : 
                            'bg-green-600'
                          } transition-all duration-300`}
                          style={{ width: `${batteryLevel}%` }}
                        ></div>
                      </div>
                      <span className="font-medium">
                        {isCharging ? '⚡ ' : ''}{batteryLevel}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-gray-500 italic">Form will be saved if connection is lost</p>
                    {pendingRequests.length > 0 && (
                      <div className="flex items-center space-x-2 text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                        <Clock className="w-4 h-4 animate-pulse" />
                        <span className="text-xs font-semibold">
                          {pendingRequests.length} request{pendingRequests.length > 1 ? 's' : ''} pending
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {pendingRequests.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Clock className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-orange-900 mb-1">
                          Pending Requests in Queue
                        </h4>
                        <p className="text-sm text-orange-800 mb-2">
                          {pendingRequests.length} emergency request{pendingRequests.length > 1 ? 's are' : ' is'} waiting to be submitted. 
                          {networkStrength < 40 ? ' Waiting for better network...' : ' Submitting now...'}
                        </p>
                        <button
                          onClick={processQueuedRequests}
                          disabled={isProcessingQueue || networkStrength < 20}
                          className="text-sm bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          {isProcessingQueue ? 'Processing...' : 'Retry Now'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSubmit}
                  className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
                >
                  Submit Request for Help
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-lg font-semibold text-gray-900 mb-3">
                    Enter your ticket ID to check status
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      name="ticketId"
                      value={formData.ticketId}
                      onChange={handleInputChange}
                      placeholder="DA-1234567890"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-lg"
                    />
                    <button
                      onClick={handleStatusCheck}
                      className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <Search className="w-5 h-5" />
                      <span>Search</span>
                    </button>
                  </div>
                </div>

                {!trackerData && !trackerLoading && (
                  <div className="text-center py-12">
                    <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg mb-2">
                      Enter your ticket ID above to check the status of your request
                    </p>
                    <p className="text-gray-500">
                      Your ticket ID was provided when you submitted your request
                    </p>
                  </div>
                )}
                {trackerLoading && (
                  <p className="text-gray-500">Loading ticket status...</p>
                )}
                {trackerError && (
                  <p className="text-red-600">{trackerError}</p>
                )}
                {trackerData && trackerData.ticket && (
                  <div className="bg-white rounded-xl shadow p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Ticket {trackerData.ticket.ticketId}</h3>
                        <p className="text-sm text-gray-600">Status: <span className="font-semibold">{trackerData.ticket.status}</span></p>
                      </div>
                      {trackerData.ticket.isSOS && (
                        <span className="px-3 py-1 rounded bg-red-100 text-red-700 text-xs font-semibold">SOS</span>
                      )}
                    </div>
                    {trackerData.ticket.assignedTo ? (
                      <div className="p-4 rounded border border-green-200 bg-green-50">
                        <p className="font-semibold text-green-800">Accepted by:</p>
                        <p className="text-green-900">{trackerData.ticket.assignedTo.organizationName}</p>
                        <p className="text-sm text-green-900">{trackerData.ticket.assignedTo.phone} • {trackerData.ticket.assignedTo.location}</p>
                      </div>
                    ) : (
                      <div className="p-4 rounded border border-blue-200 bg-blue-50">
                        <p className="font-semibold text-blue-800">Matched NGOs:</p>
                        {Array.isArray(trackerData.assignments) && trackerData.assignments.length > 0 ? (
                          <ul className="list-disc pl-5 text-blue-900">
                            {trackerData.assignments.map(a => (
                              <li key={a.assignmentId}>
                                <span className="font-medium">{a.ngo?.organizationName || 'NGO'}</span>
                                {' '}- {a.status}{a.etaMinutes ? ` • ETA ~ ${a.etaMinutes} min` : ''}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-blue-900">Finding NGOs near you...</p>
                        )}
                      </div>
                    )}
                    {Array.isArray(trackerData.ticket.assignmentHistory) && trackerData.ticket.assignmentHistory.length > 0 && (
                      <div>
                        <p className="font-semibold mb-2">Timeline</p>
                        <ul className="space-y-2">
                          {trackerData.ticket.assignmentHistory.map((h, idx) => (
                            <li key={idx} className="text-sm text-gray-700">
                              {new Date(h.assignedAt).toLocaleString()} — {h.note || 'Update'}
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

        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>Emergency Response System</p>
                </div>
              </>
            )}

            {/* No separate status section; use the top tabs */}

            {(sidebarTab === 'active' || sidebarTab === 'past') && (
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">
                    {sidebarTab === 'active' ? 'Active Tickets' : 'Past Tickets'}
                  </h3>
                </div>
                {loadingTickets ? (
                  <p className="text-gray-500">Loading tickets...</p>
                ) : tickets.length === 0 ? (
                  <p className="text-gray-500">No tickets found.</p>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {tickets.map((t) => (
                      <li key={t.id} className="py-3 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{t.title || `Ticket ${t.id}`}</p>
                          <p className="text-sm text-gray-500">{t.summary || t.status}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                            onClick={() => {
                              setSelectedTicket(t);
                              setShowTicketStatus(true);
                            }}
                          >
                            View Details
                          </button>
                          <span className={`px-2 py-1 rounded text-xs ${t.status==='active'?'bg-yellow-100 text-yellow-800':'bg-green-100 text-green-800'}`}>{t.status}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>
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