import { useNavigate } from 'react-router-dom';
import './Landing.css';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="gov-landing">
      <div className="landing-content">
        <div className="brand">
          <h1>DISASTER-AID REQUEST MANAGEMENT PORTAL</h1>
          <p>Immediate, Trackable & Centralized Relief Coordination</p>
        </div>

        <div className="cta">
          <button onClick={() => navigate('/request-form')}>Request Urgent Aid</button>
        </div>

        <div className="auth-links">
          <button onClick={() => navigate('/login')}>Login (Dashboard)</button>
          <button onClick={() => navigate('/register')}>Register (Citizen / Volunteer)</button>
        </div>

        <div className="footer">
          <span>Official System. Highly Secure.</span>
          <a href="/status-map" onClick={(e) => { e.preventDefault(); navigate('/status-map'); }}>
            View Service Status Map
          </a>
        </div>
      </div>
    </div>
  );
};

export default Landing;
