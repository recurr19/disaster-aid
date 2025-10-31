import { useContext, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, Phone, MapPin, Users, FileText, Camera, Search, Menu, X, PlusCircle, Clock, CheckCircle2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import API from '../api/axios';
import TicketSuccessModal from "../components/TicketSuccessModal";


const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const { role } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('request');
  const [sidebarTab, setSidebarTab] = useState('new'); // 'new' | 'active' | 'past'
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [newTicketId, setNewTicketId] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSOS, setIsSOS] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  
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
    'Evacuation', 'Supplies', 'Transportation', 'Communication'
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
  const handleSubmit = async () => {
    try {
      const payload = {
        ...formData,
        isSOS,
      };

      console.log("Submitting request:", payload);
      setLoadingTickets(true);
      const res = await API.post("/tickets", payload);

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
      alert("Something went wrong. Please check your network or try again.");
    } finally {
      setLoadingTickets(false);
    }
  };

  // const handleSubmit = () => {
  //   console.log('Submitting request:', { ...formData, isSOS });
  //   alert('Request submitted! Your ticket ID: DA-' + Date.now());
  // };

  const handleStatusCheck = () => {
    console.log('Checking status for:', formData.ticketId);
    alert('Status check for ticket: ' + formData.ticketId);
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
        const status = sidebarTab === 'active' ? 'active' : 'closed';
        // Exposed API endpoint (backend to be implemented later)
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

  // No sync needed; Check Status handled inside main tabs

  if (!user) return null;

  if (user.role === 'ngo') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">NGO/Volunteer Dashboard</h2>
            <p className="text-gray-600 mb-6">Welcome, {user?.name}!</p>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
                <h3 className="font-semibold text-lg mb-2">Active Requests</h3>
                <p className="text-3xl font-bold text-blue-600">24</p>
              </div>
              <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-500">
                <h3 className="font-semibold text-lg mb-2">Completed</h3>
                <p className="text-3xl font-bold text-green-600">156</p>
              </div>
              <div className="bg-orange-50 p-6 rounded-lg border-l-4 border-orange-500">
                <h3 className="font-semibold text-lg mb-2">In Progress</h3>
                <p className="text-3xl font-bold text-orange-600">12</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (user.role === 'authority') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-2xl p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Authority Control Room</h2>
            <p className="text-gray-600 mb-6">Welcome, {user?.name}!</p>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-red-50 p-6 rounded-lg border-l-4 border-red-500">
                <h3 className="font-semibold text-lg mb-2">Critical (SOS)</h3>
                <p className="text-3xl font-bold text-red-600">3</p>
              </div>
              <div className="bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-500">
                <h3 className="font-semibold text-lg mb-2">High Priority</h3>
                <p className="text-3xl font-bold text-yellow-600">18</p>
              </div>
              <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
                <h3 className="font-semibold text-lg mb-2">Active Teams</h3>
                <p className="text-3xl font-bold text-blue-600">45</p>
              </div>
              <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-500">
                <h3 className="font-semibold text-lg mb-2">Resolved Today</h3>
                <p className="text-3xl font-bold text-green-600">89</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
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
                    className="mb-4 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <MapPin className="w-5 h-5" />
                    <span>Use Current Location</span>
                  </button>
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
                          <span className="text-3xl font-bold w-12 text-center">{formData[field]}</span>
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
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer">
                    <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium mb-1">Click to add photos or audio</p>
                    <p className="text-gray-500 text-sm">Images help responders understand the situation better</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-4">
                    <div className={`flex items-center space-x-2 ${isOffline ? 'text-red-600' : 'text-gray-500'}`}>
                      <div className={`w-2 h-2 rounded-full ${isOffline ? 'bg-red-600' : 'bg-gray-400'}`}></div>
                      <span>{isOffline ? 'Offline' : 'Online'}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-green-600">
                      <div className="w-2 h-2 rounded-full bg-green-600"></div>
                      <span>Battery OK</span>
                    </div>
                  </div>
                  <p className="text-gray-500 italic">Form will be saved if connection is lost</p>
                </div>

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

                <div className="text-center py-12">
                  <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg mb-2">
                    Enter your ticket ID above to check the status of your request
                  </p>
                  <p className="text-gray-500">
                    Your ticket ID was provided when you submitted your request
                  </p>
                </div>
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
                        <span className={`px-2 py-1 rounded text-xs ${t.status==='active'?'bg-yellow-100 text-yellow-800':'bg-green-100 text-green-800'}`}>{t.status}</span>
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
    </div>
    
  );
};

export default Dashboard;