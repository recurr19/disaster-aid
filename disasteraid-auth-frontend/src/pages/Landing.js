import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Zap, Sparkles, ArrowRight, Shield, MapPin, Activity } from 'lucide-react';
import { Logo } from '../components/common/Logo';
import { AnimatedBackground } from '../components/common/AnimatedBackground';

const Landing = () => {
  const navigate = useNavigate();
  const [isPortalDialogOpen, setIsPortalDialogOpen] = useState(false);

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
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <button
              onClick={() => navigate('/request-form')}
              className="inline-flex items-center justify-center h-14 px-8 text-base font-medium text-white bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:via-rose-700 hover:to-red-800 rounded-lg shadow-2xl shadow-red-500/30 transition-all group"
            >
              <AlertTriangle className="w-5 h-5 mr-2 group-hover:animate-pulse" />
              Urgent Request Aid
              <motion.div
                className="ml-2"
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ArrowRight className="w-5 h-5" />
              </motion.div>
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
                onClick={(e) => { e.stopPropagation(); navigate('/status-map'); }}
                className="text-gray-600 hover:text-gray-700"
              >
                View Status Map
              </button>
              <span className="text-gray-400">•</span>
              <button
                onClick={(e) => { e.stopPropagation(); navigate('/ngo-heat-map'); }}
                className="text-gray-600 hover:text-gray-700"
              >
                NGO Service Coverage
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
    </div>
  );
};

export default Landing;
