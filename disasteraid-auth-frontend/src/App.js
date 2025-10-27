import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Landing from './pages/Landing';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

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

          {/* Fallback */}
          <Route path="*" element={<p style={{ textAlign: 'center', marginTop: '50px' }}>Page Not Found</p>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
