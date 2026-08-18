import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, PlusCircle, Search, HelpCircle, UserCheck, Sun, Moon } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">
        <ShieldCheck size={30} style={{ filter: 'drop-shadow(0 0 8px var(--primary-glow))' }} />
        ResolveIt <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '12px', background: 'var(--primary-glow)', color: 'var(--primary)', marginLeft: '0.4rem' }}>GOV</span>
      </Link>
      
      <div className="nav-links">
        <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
          Home
        </Link>
        <Link to="/submit" className={`nav-link ${location.pathname === '/submit' ? 'active' : ''}`}>
          <PlusCircle size={18} /> File Grievance
        </Link>
        <Link to="/track" className={`nav-link ${location.pathname === '/track' ? 'active' : ''}`}>
          <Search size={18} /> Track Status
        </Link>
        <Link to="/support" className={`nav-link ${location.pathname === '/support' ? 'active' : ''}`}>
          <HelpCircle size={18} /> Help & Support
        </Link>
        <Link to="/admin" className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}>
          <UserCheck size={18} /> Portal
        </Link>

        <button 
          onClick={() => setDarkMode(!darkMode)}
          className="btn btn-outline btn-sm"
          style={{ padding: '0.5rem 0.8rem', borderRadius: '50%', width: '40px', height: '40px' }}
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? <Sun size={18} color="#FBBF24" /> : <Moon size={18} color="#4F46E5" />}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
