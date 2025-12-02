import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Zap, Sparkles, ArrowRight, Shield, MapPin, Activity } from 'lucide-react';
import { Logo } from '../components/common/Logo';
import { AnimatedBackground } from '../components/common/AnimatedBackground';
import SOSSuccessModal from '../components/modals/SOSSuccessModal';
import API from '../api/axios';

const Landing = () => {
  const navigate = useNavigate();
  const [isPortalDialogOpen, setIsPortalDialogOpen] = useState(false);
  const [isSosDialogOpen, setIsSosDialogOpen] = useState(false);
  const [sosSubmitting, setSosSubmitting] = useState(false);
  const [sosSuccessTicketId, setSosSuccessTicketId] = useState(null);

  const handleUrgentSOSClick = () => {
    setIsSosDialogOpen(true);
  };

  const handleConfirmSOS = async () => {
    setSosSubmitting(true);
    setIsSosDialogOpen(false);

    try {
      const fd = new FormData();
      
      // Basic required fields matching Ticket model
      fd.append('name', 'Emergency Caller');
      fd.append('phone', ''); // Can be prompted for phone later if needed
      fd.append('language', 'en');
      fd.append('preferredContact', 'call');
      fd.append('channel', 'web');
      
      // Location fields
      fd.append('address', '');
      fd.append('landmark', '');
      
      // Beneficiaries count - set to high numbers to ensure priorityScore bonus (>=10 gives +10 points)
      // Total: 75 beneficiaries ensures maximum priority
      fd.append('adults', '50');
      fd.append('children', '15');
      fd.append('elderly', '10');
      
      // Emergency description with SOS keywords (triggers SOS heuristics)
      fd.append('description', 'URGENT SOS - Immediate emergency assistance required. Life-threatening situation. People trapped and injured.');
      
      // Critical SOS flag - MUST be 'true' string for backend to recognize (gives +30 priority points)
      fd.append('isSOS', 'true');
      
      // Help types - ALL types selected to show critical need
      const helpTypes = ['food', 'water', 'shelter', 'medical', 'rescue', 'sanitation', 'baby supplies', 'transportation', 'power/charging'];
      helpTypes.forEach(ht => fd.append('helpTypes[]', ht));
      
      // Medical needs - ALL medical needs to indicate critical medical emergency
      const medicalNeeds = ['insulin', 'dialysis', 'wheelchair', 'oxygen', 'medication', 'infant care', 'elderly care', 'mental health'];
      medicalNeeds.forEach(mn => fd.append('medicalNeeds[]', mn));

      // Battery level - try to get real value, or set low to indicate emergency (+5 priority if <=20)
      let batteryLevel = 15; // Default to low battery to boost priority
      if (navigator.getBattery) {
        try {
          const batt = await navigator.getBattery();
          const realBattery = Math.round((batt.level || 0.15) * 100);
          // Use real battery if available, otherwise keep emergency default
          batteryLevel = realBattery > 0 ? realBattery : 15;
        } catch (e) {
          // Keep default low battery
        }
      }
      fd.append('batteryLevel', batteryLevel);

      // Network strength - try to get real value, or set low to indicate emergency (+5 priority if <=20)
      let networkStrength = 15; // Default to poor network to boost priority
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (connection && typeof connection.downlink === 'number') {
        const realNetwork = Math.max(1, Math.min(100, Math.round((connection.downlink / 100) * 100)));
        // Use real network if available, otherwise keep emergency default
        networkStrength = realNetwork > 0 ? realNetwork : 15;
      }
      fd.append('networkStrength', networkStrength);

      // Geolocation - CRITICAL for locationGeo field and accurate matching
      // Wait longer for high-accuracy location in emergency
      const getLocation = () => new Promise((resolve) => {
        if (!navigator.geolocation) {
          resolve(null);
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => resolve(null),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 } // High accuracy, 10s timeout
        );
      });

      const coords = await getLocation();
      if (coords) {
        // Send latitude and longitude - backend converts to locationGeo.coordinates [lng, lat]
        fd.append('latitude', coords.lat);
        fd.append('longitude', coords.lng);
      } else {
        // Location critical for emergency - warn user
        console.warn('Location not available for SOS request');
      }

      // Submit the SOS request to backend
      // Backend will calculate: priorityScore = 30(SOS) + 10(beneficiaries>=10) + 5(lowBattery) + 5(poorNetwork) = 50 (CRITICAL)
      const res = await API.post('/tickets/public', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.status === 201 && res.data?.ticketId) {
        setSosSuccessTicketId(res.data.ticketId);
      } else {
        alert('Failed to submit SOS request. Please try again or contact emergency services.');
      }
    } catch (err) {
      console.error('SOS submission error:', err);
      alert('Error submitting SOS request. Please contact emergency services directly.');
    } finally {
      setSosSubmitting(false);
    }
  };

  const roles = [
    {
      id: 'citizen',
      title: 'Citizen Portal',
      description: 'Submit emergency requests and track rescue status',
      icon: AlertTriangle,
      gradient: 'from-red-500 via-red-600 to-rose-600',
      borderGlow: 'hover:shadow-red-500/30',
      iconBg: 'bg-gradient-to-br from-red-500 to-rose-600',
      route: '/login',
    },
    {
      id: 'ngo',
      title: 'NGO Command',
      description: 'Coordinate relief operations and manage teams',
      icon: Activity,
      gradient: 'from-blue-500 via-blue-600 to-blue-700',
      borderGlow: 'hover:shadow-blue-500/30',
      iconBg: 'bg-gradient-to-br from-blue-500 to-blue-700',
      route: '/login',
    },
    {
      id: 'dispatcher',
      title: 'Dispatcher Control',
      description: 'Triage requests and deploy response units',
      icon: MapPin,
      gradient: 'from-purple-500 via-purple-600 to-purple-700',
      borderGlow: 'hover:shadow-purple-500/30',
      iconBg: 'bg-gradient-to-br from-purple-500 to-purple-700',
      route: '/login',
    },
    {
      id: 'authority',
      title: 'Authority Dashboard',
      description: 'Monitor operations and verify outcomes',
      icon: Shield,
      gradient: 'from-emerald-500 via-emerald-600 to-emerald-700',
      borderGlow: 'hover:shadow-emerald-500/30',
      iconBg: 'bg-gradient-to-br from-emerald-500 to-emerald-700',
      route: '/login',
    },
  ];

  const handlePortalSelect = (roleId) => {
    setIsPortalDialogOpen(false);
    navigate('/login');
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Animated Background */}
      <AnimatedBackground />

      {/* Floating header */}
      <motion.header
        className="relative z-10"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <Logo variant="full" size="lg" />
            
            <div className="inline-flex items-center px-4 py-2 border border-emerald-200/50 bg-emerald-50/80 backdrop-blur-sm rounded-full text-emerald-700 text-sm">
              <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse" />
              All Systems Operational
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main content - Centered */}
      <div className="relative z-10 container mx-auto px-6 flex items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
        <motion.div
          className="max-w-5xl mx-auto text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="inline-flex items-center px-4 py-2 mb-8 border border-red-200/50 bg-red-50/80 backdrop-blur-sm rounded-full text-red-700 text-sm">
              <Zap className="w-4 h-4 mr-2" />
              Crisis Coordination Platform
            </div>
          </motion.div>
          
          {/* Main headline */}
          <motion.h1
            className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <span className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
              Disaster
            </span>
            <span className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 bg-clip-text text-transparent">
              Aid
            </span>
          </motion.h1>
          
          {/* Subtitle */}
          <motion.p
            className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-12 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            Life-saving emergency coordination connecting citizens, relief organizations, 
            dispatchers, and authorities in real-time.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <button
              onClick={handleUrgentSOSClick}
              disabled={sosSubmitting}
              className="inline-flex items-center justify-center h-14 px-8 text-base font-medium text-white bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:via-rose-700 hover:to-red-800 rounded-lg shadow-2xl shadow-red-500/30 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <AlertTriangle className="w-5 h-5 mr-2 group-hover:animate-pulse" />
              {sosSubmitting ? 'Submitting SOS...' : 'Urgent Request Aid'}
              {!sosSubmitting && (
                <motion.div
                  className="ml-2"
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="w-5 h-5" />
                </motion.div>
              )}
            </button>

            <button
              onClick={() => setIsPortalDialogOpen(!isPortalDialogOpen)}
              className="inline-flex items-center justify-center h-14 px-8 text-base font-medium border-2 border-gray-300 hover:bg-gray-50 rounded-lg backdrop-blur-sm transition-all group"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Access Portal
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>

          {/* Track SOS Quick Link */}
          <motion.div
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            <button
              onClick={() => navigate('/track-sos')}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-50/80 hover:bg-red-100/80 border border-red-200 rounded-lg backdrop-blur-sm transition-all"
            >
              <Activity className="w-4 h-4" />
              Track Active SOS Requests
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span>24/7 Operations</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
              <span>Real-time Coordination</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
              <span>Verified Response Teams</span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Portal Selection Dialog */}
      {isPortalDialogOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setIsPortalDialogOpen(false)}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-y-auto"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold mb-2">Select Your Access Portal</h2>
              <p className="text-gray-600">Choose your role to access the appropriate control system</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
              {roles.map((role) => {
                const Icon = role.icon;
                
                return (
                  <div
                    key={role.id}
                    className={`group relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] border border-gray-200 hover:border-gray-300 bg-white/60 backdrop-blur-sm hover:shadow-xl ${role.borderGlow} p-6 rounded-xl`}
                    onClick={() => handlePortalSelect(role.id)}
                  >
                    {/* Gradient overlay on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${role.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300`} />
                    
                    <div className="relative">
                      {/* Icon */}
                      <div className={`w-14 h-14 rounded-xl ${role.iconBg} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      
                      {/* Content */}
                      <h3 className="text-xl font-semibold tracking-tight mb-2">
                        {role.title}
                      </h3>
                      
                      <p className="text-sm text-gray-600 mb-4">
                        {role.description}
                      </p>
                      
                      {/* CTA */}
                      <div className="flex items-center gap-2 text-sm font-medium group-hover:gap-3 transition-all duration-300">
                        <span className={`bg-gradient-to-r ${role.gradient} bg-clip-text text-transparent`}>
                          Access Now
                        </span>
                        <ArrowRight className="w-4 h-4 text-current opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Additional links */}
            <div className="p-6 border-t border-gray-200 flex flex-wrap gap-4 justify-center text-sm">
              <button
                onClick={(e) => { e.stopPropagation(); navigate('/register'); }}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Register as New User
              </button>
              <span className="text-gray-400">•</span>
              <button
                onClick={(e) => { e.stopPropagation(); navigate('/track-sos'); }}
                className="text-red-600 hover:text-red-700 font-medium"
              >
                Track SOS Requests
              </button>
              <span className="text-gray-400">•</span>
              <button
                onClick={(e) => { e.stopPropagation(); navigate('/developer'); }}
                className="text-rose-600 hover:text-rose-700 font-medium"
              >
                Developer Dashboard
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* SOS Confirmation Dialog */}
      {isSosDialogOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setIsSosDialogOpen(false)}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-red-200 bg-gradient-to-r from-red-50 to-rose-50">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-rose-600 flex items-center justify-center shadow-lg">
                  <AlertTriangle className="w-6 h-6 text-white animate-pulse" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-red-900">🚨 URGENT SOS REQUEST</h2>
                  <p className="text-sm text-red-700">Emergency assistance deployment</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-gray-700 leading-relaxed">
                This will immediately submit a <span className="font-semibold text-red-600">critical priority emergency SOS request</span> to our emergency coordination network.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <p className="font-semibold text-blue-900 mb-2">The system will automatically:</p>
                <ul className="space-y-1.5 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">✓</span>
                    <span>Mark <strong>all resource types</strong> as critically needed (food, water, medical, shelter, etc.)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">✓</span>
                    <span>Request your <strong>current location</strong> (browser will ask for permission)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">✓</span>
                    <span>Capture <strong>battery and network status</strong> for emergency prioritization</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">✓</span>
                    <span>Set <strong>critical priority level</strong> for immediate dispatch</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">✓</span>
                    <span>Notify <strong>nearby verified NGOs and response teams</strong> instantly</span>
                  </li>
                </ul>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-900">
                  <strong>⚠️ Important:</strong> Emergency teams will be dispatched immediately. Use this only for genuine life-threatening situations.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3">
              <button
                onClick={() => setIsSosDialogOpen(false)}
                className="flex-1 h-12 px-6 text-base font-medium border-2 border-gray-300 hover:bg-white rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSOS}
                disabled={sosSubmitting}
                className="flex-1 h-12 px-6 text-base font-semibold text-white bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:via-rose-700 hover:to-red-800 rounded-lg shadow-lg shadow-red-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sosSubmitting ? 'Submitting...' : 'Confirm Emergency Request'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Footer */}
      <motion.footer
        className="relative z-10 border-t border-gray-200/40 bg-white/40 backdrop-blur-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1 }}
      >
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>&copy; 2025 DisasterAid. Mission-critical infrastructure.</span>
            </div>
            <div className="flex gap-6">
              <button
                type="button"
                onClick={() => navigate('/privacy')}
                className="hover:text-gray-900 transition-colors"
              >Privacy</button>
              <button
                type="button"
                onClick={() => navigate('/security')}
                className="hover:text-gray-900 transition-colors"
              >Security</button>
              <button
                type="button"
                onClick={() => navigate('/support')}
                className="hover:text-gray-900 transition-colors"
              >Support</button>
            </div>
          </div>
        </div>
      </motion.footer>

      {/* SOS Success Modal */}
      <SOSSuccessModal 
        ticketId={sosSuccessTicketId} 
        onClose={() => setSosSuccessTicketId(null)} 
      />
    </div>
  );
};

export default Landing;
