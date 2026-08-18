import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Activity, FileText, ShieldCheck, CheckCircle2, Clock, Users, Zap } from 'lucide-react';
import api from '../api';

const Home = () => {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    urgent: 0,
    activeOfficers: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/public/stats');
        setStats(response.data);
      } catch (err) {
        console.error('Failed to fetch public stats');
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      {/* Hero Section */}
      <section style={{ textAlign: 'center', margin: '2rem 0 4rem 0' }}>
        <div className="badge badge-inprogress" style={{ marginBottom: '1.25rem', padding: '0.4rem 1rem' }}>
          <Zap size={16} /> Official Digital Civic Redressal Portal
        </div>
        <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.8rem)', fontWeight: 800, lineHeight: 1.15, marginBottom: '1.25rem' }}>
          Transparent, Fast & Direct <br/>
          <span style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Civic Problem Redressal
          </span>
        </h1>
        <p style={{ fontSize: '1.15rem', color: 'var(--text-light)', maxWidth: '650px', margin: '0 auto 2.5rem auto' }}>
          Empowering citizens to report municipal & utility issues directly to local department officers with transparent live tracking, auto-assignment, and SLA resolution guarantees.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/submit" className="btn btn-primary" style={{ padding: '0.9rem 2rem', fontSize: '1.05rem' }}>
            File a Grievance <ArrowRight size={20} />
          </Link>
          <Link to="/track" className="btn btn-outline" style={{ padding: '0.9rem 2rem', fontSize: '1.05rem' }}>
            Track Existing Ticket
          </Link>
        </div>
      </section>

      {/* Live Civic Stats Counter Grid */}
      <section className="stats-grid">
        <div className="glass-panel stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(79, 70, 229, 0.15)', color: 'var(--primary)' }}>
            <FileText size={28} />
          </div>
          <div>
            <p style={{ color: 'var(--text-light)', fontSize: '0.875rem', fontWeight: 600, margin: 0 }}>Total Filed</p>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>{stats.total}</h3>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(59, 130, 246, 0.15)', color: 'var(--info)' }}>
            <Clock size={28} />
          </div>
          <div>
            <p style={{ color: 'var(--text-light)', fontSize: '0.875rem', fontWeight: 600, margin: 0 }}>In Progress</p>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>{stats.inProgress}</h3>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)' }}>
            <CheckCircle2 size={28} />
          </div>
          <div>
            <p style={{ color: 'var(--text-light)', fontSize: '0.875rem', fontWeight: 600, margin: 0 }}>Resolved</p>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>{stats.resolved}</h3>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(139, 92, 246, 0.15)', color: 'var(--secondary)' }}>
            <Users size={28} />
          </div>
          <div>
            <p style={{ color: 'var(--text-light)', fontSize: '0.875rem', fontWeight: 600, margin: 0 }}>Active Officers</p>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>{stats.activeOfficers}</h3>
          </div>
        </div>
      </section>

      {/* Main Action Cards */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginTop: '3rem' }}>
        <div className="glass-panel glass-panel-interactive" style={{ padding: '2.5rem' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <FileText size={28} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.75rem' }}>Report a Civic Issue</h2>
          <p style={{ color: 'var(--text-light)', marginBottom: '1.75rem', lineHeight: '1.6' }}>
            Submit complaints for Water Supply, Roads & Potholes, Electricity Outages, or Sanitation. Attach priority urgency levels and photos.
          </p>
          <Link to="/submit" className="btn btn-primary" style={{ width: '100%' }}>
            Submit Grievance <ArrowRight size={18} />
          </Link>
        </div>

        <div className="glass-panel glass-panel-interactive" style={{ padding: '2.5rem' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: 'rgba(6, 182, 212, 0.1)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <Activity size={28} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.75rem' }}>Live Status Timeline</h2>
          <p style={{ color: 'var(--text-light)', marginBottom: '1.75rem', lineHeight: '1.6' }}>
            Track your grievance step-by-step with real-time official updates, direct contact details of assigned officers, and progress logs.
          </p>
          <Link to="/track" className="btn btn-outline" style={{ width: '100%' }}>
            Track Status <ArrowRight size={18} />
          </Link>
        </div>

        <div className="glass-panel glass-panel-interactive" style={{ padding: '2.5rem' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <ShieldCheck size={28} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.75rem' }}>Government Accountability</h2>
          <p style={{ color: 'var(--text-light)', marginBottom: '1.75rem', lineHeight: '1.6' }}>
            Automatic zone routing ensures your ticket immediately lands on the specific zone officer's dashboard for swift SLA action.
          </p>
          <Link to="/support" className="btn btn-outline" style={{ width: '100%' }}>
            Contact Support <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
