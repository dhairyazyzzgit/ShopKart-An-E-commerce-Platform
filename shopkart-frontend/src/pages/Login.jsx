import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/format';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email.trim() || !form.password) return setError('Please fill in all fields.');

    setLoading(true);
    try {
      await login(form.email.trim(), form.password);
      navigate(location.state?.from || '/products', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Invalid email or password.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <form onSubmit={handleSubmit} className="card auth-card">
        <h2>Login</h2>
        {location.state?.from && <div className="alert alert-info">Please log in to continue.</div>}
        {error && <div className="alert alert-error">{error}</div>}
        <input className="input" type="email" name="email" placeholder="Email" autoComplete="email" value={form.email} onChange={handleChange} />
        <input className="input" type="password" name="password" placeholder="Password" autoComplete="current-password" value={form.password} onChange={handleChange} />
        <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
        <p className="center small">Don't have an account? <Link to="/register">Register</Link></p>
      </form>
    </div>
  );
}
