import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { customerAPI } from '../services/api';
import { getErrorMessage } from '../utils/format';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.fullName.trim() || !form.email.trim() || !form.password || !form.phone.trim()) {
      return setError('All fields are required.');
    }
    if (form.password.length < 6) return setError('Password must be at least 6 characters long.');
    if (!/^\d{10}$/.test(form.phone.trim())) return setError('Phone number must contain exactly 10 digits.');

    setLoading(true);
    try {
      await customerAPI.register({ ...form, fullName: form.fullName.trim(), email: form.email.trim(), phone: form.phone.trim() });
      navigate('/login');
    } catch (err) {
      setError(getErrorMessage(err, 'Registration failed. Please check your details.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <form onSubmit={handleSubmit} className="card auth-card">
        <h2>Register</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <input className="input" type="text" name="fullName" placeholder="Full Name" value={form.fullName} onChange={handleChange} />
        <input className="input" type="email" name="email" placeholder="Email" autoComplete="email" value={form.email} onChange={handleChange} />
        <input className="input" type="password" name="password" placeholder="Password (min 6 chars)" autoComplete="new-password" value={form.password} onChange={handleChange} />
        <input className="input" type="text" name="phone" placeholder="Phone Number (10 digits)" maxLength={10} value={form.phone} onChange={handleChange} />
        <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Creating Account...' : 'Create Account'}</button>
        <p className="center small">Already have an account? <Link to="/login">Login</Link></p>
      </form>
    </div>
  );
}
