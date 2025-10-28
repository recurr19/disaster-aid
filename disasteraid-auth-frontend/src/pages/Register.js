import { useState, useContext, useEffect, useRef } from 'react';
import API from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Register.css';

const Register = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', // used for citizen
    email: '',
    password: '',
    role: 'citizen',
    // NGO/Volunteer specific fields (UI-only)
    organizationName: '',
    contactPerson: '',
    phone: '',
    location: '',
    areasOfWork: [],
    availability: 'full-time',
    resources: '',
    registrationId: ''
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleCheckboxArray = (e) => {
    const { value, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      areasOfWork: checked
        ? [...prev.areasOfWork, value]
        : prev.areasOfWork.filter((v) => v !== value)
    }));
  };
  const handleMultiSelectAreas = (e) => {
    const values = Array.from(e.target.selectedOptions).map((o) => o.value);
    setForm((prev) => ({ ...prev, areasOfWork: values }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Map NGO fields to backend payload: now supports ngoProfile in backend
      const payload =
        form.role === 'ngo'
          ? {
              name: form.organizationName || form.contactPerson || 'NGO/Volunteer',
              email: form.email,
              password: form.password,
              role: form.role,
              ngoProfile: {
                organizationName: form.organizationName,
                contactPerson: form.contactPerson,
                phone: form.phone,
                location: form.location,
                areasOfWork: form.areasOfWork,
                availability: form.availability,
                resources: form.resources,
                registrationId: form.registrationId
              }
            }
          : {
              name: form.name,
              email: form.email,
              password: form.password,
              role: form.role
            };

      const res = await API.post('/auth/register', payload);
      login(res.data.user, res.data.token);
      if (res.data.user.role === 'citizen') navigate('/dashboard/citizen');
      else if (res.data.user.role === 'ngo') navigate('/dashboard/ngo');
      else navigate('/dashboard/authority');
    } catch (err) {
      alert(err.response?.data?.message || 'Registration failed');
    }
  };

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
    <div className="page-bg">
      <canvas ref={canvasRef} className="network-canvas" />
      <div className="gov-form-container">
        <h2>Register</h2>
        <form onSubmit={handleSubmit}>
        <select name="role" value={form.role} onChange={handleChange}>
          <option value="citizen">Citizen</option>
          <option value="ngo">NGO / Volunteer</option>
          <option value="authority">Authority</option>
        </select>

        {form.role === 'citizen' && (
          <>
            <input
              name="name"
              placeholder="Full Name"
              value={form.name}
              onChange={handleChange}
              required
            />
            <input
              name="email"
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
            />
            <input
              name="password"
              placeholder="Password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </>
        )}

        {form.role === 'ngo' && (
          <>
            <div className="section-title">Organization Details</div>
            <input
              name="organizationName"
              placeholder="Organization/Volunteer Group Name"
              value={form.organizationName}
              onChange={handleChange}
              required
            />
            <input
              name="contactPerson"
              placeholder="Primary Contact Person"
              value={form.contactPerson}
              onChange={handleChange}
              required
            />
            <input
              name="phone"
              placeholder="Contact Phone"
              value={form.phone}
              onChange={handleChange}
            />
            <input
              name="location"
              placeholder="Base Location / City"
              value={form.location}
              onChange={handleChange}
            />

            <div className="section-title">Areas of Work</div>
            <div className="checkbox-grid left-align">
              {['Food', 'Shelter', 'Medical', 'Rescue', 'Logistics', 'Supplies'].map((area) => (
                <label key={area} className="checkbox-item">
                  <input
                    type="checkbox"
                    value={area}
                    checked={form.areasOfWork.includes(area)}
                    onChange={handleCheckboxArray}
                  />
                  <span>{area}</span>
                </label>
              ))}
            </div>

            <div className="section-title">Availability</div>
            <select name="availability" value={form.availability} onChange={handleChange}>
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="on-call">On-call</option>
            </select>

            <input
              name="resources"
              placeholder="Resources (vehicles, supplies, medics, etc.)"
              value={form.resources}
              onChange={handleChange}
            />
            <input
              name="registrationId"
              placeholder="Govt Registration/ID (if any)"
              value={form.registrationId}
              onChange={handleChange}
            />

            <div className="section-title">Account</div>
            <input
              name="email"
              placeholder="Official Email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
            />
            <input
              name="password"
              placeholder="Password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </>
        )}

        {form.role === 'authority' && (
          <>
            <input
              name="name"
              placeholder="Department/Officer Name"
              value={form.name}
              onChange={handleChange}
              required
            />
            <input
              name="email"
              placeholder="Official Email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
            />
            <input
              name="password"
              placeholder="Password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </>
        )}

          <button type="submit">Register</button>
        </form>
      </div>
    </div>
  );
};

export default Register;
