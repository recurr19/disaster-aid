import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Landing from './pages/Landing';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StatusMap from './pages/StatusMap';
import NGOServiceHeatMap from './pages/NGOServiceHeatMap';
import RequestFormPublic from './pages/RequestFormPublic';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Landing page at root */}
          <Route path="/" element={<Landing />} />

          {/* Auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Dashboard route */}
          <Route path="/dashboard/:role" element={<Dashboard />} />

          {/* Public citizen request form */}
          <Route path="/request-form" element={<RequestFormPublic />} />

          {/* Status Map route */}
          <Route path="/status-map" element={<StatusMap />} />

          <Route path="/ngo-heat-map" element={<NGOServiceHeatMap />} />
          {/* Fallback */}
          <Route path="*" element={<p style={{ textAlign: 'center', marginTop: '50px' }}>Page Not Found</p>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
