import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ShieldCheck, KeyRound, ArrowRight } from 'lucide-react';
import api from '../api';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/admin/login', { email, password });
      localStorage.setItem('adminToken', response.data.token);
      navigate('/admin');
    } catch (err) {
      setError('Invalid officer email or password.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password123');
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh', padding: '1rem 0' }}>
      <div className="glass-panel" style={{ padding: '3rem 2.5rem', width: '100%', maxWidth: '480px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ background: 'var(--primary-glow)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
            <ShieldCheck size={36} color="var(--primary)" />
          </div>
          <h2 style={{ color: 'var(--text-dark)', margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>Officer Portal Sign-In</h2>
          <p style={{ color: 'var(--text-light)', marginTop: '0.4rem', fontSize: '0.9rem' }}>Secure access for municipal department heads & zone officers</p>
        </div>

        {error && (
          <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.85rem', borderRadius: '12px', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.9rem', fontWeight: 600 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Officer Email</label>
            <input 
              type="email" 
              className="form-control" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
              placeholder="admin@resolveit.gov"
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              className="form-control" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem', padding: '0.85rem' }} disabled={loading}>
            {loading ? 'Authenticating...' : <><KeyRound size={18} /> Sign In to Control Panel</>}
          </button>
        </form>

        {/* Quick Demo Logins */}
        <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', textAlign: 'center' }}>
            Quick Demo Credentials (1-Click Fill)
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button onClick={() => setDemoCredentials('admin@resolveit.gov')} className="btn btn-outline btn-sm" style={{ fontSize: '0.75rem', padding: '0.4rem 0.6rem' }}>
              👑 Super Admin
            </button>
            <button onClick={() => setDemoCredentials('water_head@resolveit.gov')} className="btn btn-outline btn-sm" style={{ fontSize: '0.75rem', padding: '0.4rem 0.6rem' }}>
              💧 Water Dept Head
            </button>
            <button onClick={() => setDemoCredentials('roads_head@resolveit.gov')} className="btn btn-outline btn-sm" style={{ fontSize: '0.75rem', padding: '0.4rem 0.6rem' }}>
              🛣️ Roads Dept Head
            </button>
            <button onClick={() => setDemoCredentials('electricity_head@resolveit.gov')} className="btn btn-outline btn-sm" style={{ fontSize: '0.75rem', padding: '0.4rem 0.6rem' }}>
              ⚡ Electricity Head
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminLogin;
