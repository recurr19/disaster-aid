import { useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import './Landing.css';

const Landing = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    function resize() {
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
    }
    resize();
    window.addEventListener('resize', resize);

    const POINTS = 60;
    const MAX_SPEED = 0.22;
    const CONNECT_DIST = 170 * dpr;
    const nodes = Array.from({ length: POINTS }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() * 2 - 1) * MAX_SPEED * dpr,
      vy: (Math.random() * 2 - 1) * MAX_SPEED * dpr,
      r: (2 + Math.random() * 2) * dpr
    }));

    function step() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 1 * dpr;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < CONNECT_DIST) {
            const alpha = 1 - dist / CONNECT_DIST;
            ctx.strokeStyle = `rgba(220,38,38,${0.06 + alpha * 0.12})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      for (const p of nodes) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.fillStyle = 'rgba(220,38,38,0.5)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      animationId = requestAnimationFrame(step);
    }
    animationId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="gov-landing">
      <canvas ref={canvasRef} className="network-canvas" />
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
          <a href="/status-map" onClick={(e) => { e.preventDefault(); navigate('/status-map'); }}>
            View Service Status Map
          </a>
          <span style={{ margin: '0 10px', color: '#999' }}>•</span>
          <a href="/ngo-heat-map" onClick={(e) => { e.preventDefault(); navigate('/ngo-heat-map'); }}>
            NGO Service Coverage Heat Map
          </a>
        </div>
      </div>
    </div>
  );
};

export default Landing;
