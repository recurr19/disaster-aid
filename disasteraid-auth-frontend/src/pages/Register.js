import { useState, useContext } from 'react';
import API from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Register.css';

const Register = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'citizen'
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/auth/register', form);
      login(res.data.user, res.data.token);
      if (res.data.user.role === 'citizen') navigate('/dashboard/citizen');
      else if (res.data.user.role === 'ngo') navigate('/dashboard/ngo');
      else navigate('/dashboard/authority');
    } catch (err) {
      alert(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="gov-form-container">
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Name" value={form.name} onChange={handleChange} required />
        <input name="email" placeholder="Email" type="email" value={form.email} onChange={handleChange} required />
        <input name="password" placeholder="Password" type="password" value={form.password} onChange={handleChange} required />
        <select name="role" value={form.role} onChange={handleChange}>
          <option value="citizen">Citizen</option>
          <option value="ngo">NGO / Volunteer</option>
          <option value="authority">Authority</option>
        </select>
        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default Register;
