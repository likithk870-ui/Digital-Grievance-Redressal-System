import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, CheckCircle2, Clock, ShieldCheck, AlertCircle, Phone, Star, Send, UserCheck, Paperclip } from 'lucide-react';
import api from '../api';

const TrackGrievance = () => {
  const [searchParams] = useSearchParams();
  const [trackingId, setTrackingId] = useState(searchParams.get('id') || '');
  const [grievance, setGrievance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Rating & Feedback State
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [userFeedback, setUserFeedback] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [ratingLoading, setRatingLoading] = useState(false);

  useEffect(() => {
    const queryId = searchParams.get('id');
    if (queryId) {
      setTrackingId(queryId);
      fetchGrievance(queryId);
    }
  }, [searchParams]);

  const fetchGrievance = async (id) => {
    if (!id || !id.trim()) return;
    setLoading(true);
    setError('');
    setGrievance(null);

    try {
      const response = await api.get(`/grievances/${id.trim()}`);
      setGrievance(response.data);
      if (response.data.rating) {
        setUserRating(response.data.rating);
        setUserFeedback(response.data.feedback || '');
        setRatingSubmitted(true);
      }
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setError('Grievance not found. Please check your Tracking ID.');
      } else {
        setError('Failed to fetch grievance details. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    fetchGrievance(trackingId);
  };

  const submitRating = async () => {
    if (!userRating) return;
    setRatingLoading(true);
    try {
      await api.post(`/grievances/${grievance.id}/rating`, {
        rating: userRating,
        feedback: userFeedback
      });
      setRatingSubmitted(true);
    } catch (err) {
      alert('Failed to submit rating. Please try again.');
    } finally {
      setRatingLoading(false);
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'Urgent': return 'priority-urgent';
      case 'High': return 'priority-high';
      case 'Medium': return 'priority-medium';
      default: return 'priority-low';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Resolved': return 'badge-resolved';
      case 'In Progress': return 'badge-inprogress';
      default: return 'badge-pending';
    }
  };

  // Timeline Step logic
  const getStepProgress = (status) => {
    if (status === 'Resolved') return 100;
    if (status === 'In Progress') return 60;
    return 25;
  };

  const parseComments = (jsonStr) => {
    try {
      return JSON.parse(jsonStr || '[]');
    } catch (e) {
      return [];
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '840px', margin: '1rem auto', paddingBottom: '3rem' }}>
      {/* Search Header */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)', textAlign: 'center', marginBottom: '1.25rem' }}>
          Live Grievance Status Tracker
        </h2>
        
        <form onSubmit={handleTrackSubmit} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Enter unique Tracking ID (e.g. 550e8400-e29b-41d4-a716-446655440000)" 
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              required
              style={{ paddingLeft: '2.8rem' }}
            />
            <Search size={20} color="var(--text-light)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '0.8rem 1.8rem' }}>
            {loading ? 'Searching...' : 'Track Ticket'}
          </button>
        </form>

        {error && (
          <div style={{ color: 'var(--danger)', marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} /> {error}
          </div>
        )}
      </div>

      {/* Grievance Details & Timeline */}
      {grievance && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Status Header Card */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                  <span className={`badge ${getStatusBadge(grievance.status)}`}>
                    {grievance.status}
                  </span>
                  <span className={`badge ${getPriorityBadgeClass(grievance.priority || 'Medium')}`}>
                    {grievance.priority || 'Medium'} Priority
                  </span>
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-dark)' }}>
                  {grievance.title}
                </h3>
              </div>
              
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', margin: 0 }}>Ticket ID</p>
                <code style={{ fontSize: '0.85rem', fontWeight: 700, background: 'var(--surface-hover)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                  {grievance.id.substring(0, 18)}...
                </code>
              </div>
            </div>

            {/* Stepper Timeline */}
            <div className="stepper-container">
              <div className="stepper-progress-bar">
                <div className="stepper-progress-fill" style={{ width: `${getStepProgress(grievance.status)}%` }}></div>
              </div>

              <div className={`stepper-step completed`}>
                <div className="stepper-icon-node">
                  <CheckCircle2 size={24} />
                </div>
                <span className="stepper-label">Logged</span>
              </div>

              <div className={`stepper-step ${grievance.assignedTo ? 'completed' : 'active'}`}>
                <div className="stepper-icon-node">
                  <ShieldCheck size={24} />
                </div>
                <span className="stepper-label">Zone Assigned</span>
              </div>

              <div className={`stepper-step ${grievance.status === 'In Progress' ? 'active' : grievance.status === 'Resolved' ? 'completed' : ''}`}>
                <div className="stepper-icon-node">
                  <Clock size={24} />
                </div>
                <span className="stepper-label">In Progress</span>
              </div>

              <div className={`stepper-step ${grievance.status === 'Resolved' ? 'completed' : ''}`}>
                <div className="stepper-icon-node">
                  <CheckCircle2 size={24} />
                </div>
                <span className="stepper-label">Resolved</span>
              </div>
            </div>

            {/* Core Info Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', background: 'var(--surface-hover)', padding: '1.25rem', borderRadius: '14px', margin: '1.5rem 0' }}>
              <div>
                <p style={{ color: 'var(--text-light)', fontSize: '0.8rem', fontWeight: 600, margin: 0 }}>Category</p>
                <p style={{ fontWeight: 700, margin: '0.2rem 0 0 0' }}>{grievance.category}</p>
              </div>
              <div>
                <p style={{ color: 'var(--text-light)', fontSize: '0.8rem', fontWeight: 600, margin: 0 }}>Zone / Location</p>
                <p style={{ fontWeight: 700, margin: '0.2rem 0 0 0' }}>{grievance.area}</p>
              </div>
              <div>
                <p style={{ color: 'var(--text-light)', fontSize: '0.8rem', fontWeight: 600, margin: 0 }}>Submitted Date</p>
                <p style={{ fontWeight: 700, margin: '0.2rem 0 0 0' }}>{new Date(grievance.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p style={{ color: 'var(--text-light)', fontSize: '0.8rem', fontWeight: 600, margin: 0 }}>Customer Phone</p>
                <p style={{ fontWeight: 700, margin: '0.2rem 0 0 0' }}>{grievance.customerPhone}</p>
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>Grievance Description</p>
              <div style={{ background: 'var(--surface-hover)', padding: '1.1rem', borderRadius: '12px', lineHeight: '1.6', fontSize: '0.95rem' }}>
                {grievance.description}
              </div>
            </div>

            {/* Attachment preview if present */}
            {grievance.attachmentUrl && (
              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Paperclip size={16} /> Uploaded Photo Evidence
                </p>
                <img src={grievance.attachmentUrl} alt="Evidence" style={{ maxWidth: '100%', maxHeight: '250px', borderRadius: '12px', objectFit: 'cover', border: '1px solid var(--border)' }} />
              </div>
            )}
          </div>

          {/* Assigned Officer Contact Card */}
          {grievance.assignedTo && (
            <div className="glass-panel" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.08), rgba(139, 92, 246, 0.08))', border: '1px solid var(--border-glow)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserCheck size={26} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontWeight: 600, margin: 0 }}>Assigned Handling Officer</p>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0.1rem 0 0 0' }}>{grievance.assignedTo.name}</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, margin: 0 }}>{grievance.assignedTo.department} • {grievance.assignedTo.area}</p>
                </div>
                <a href={`tel:${grievance.assignedTo.workPhone}`} className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>
                  <Phone size={16} /> {grievance.assignedTo.workPhone}
                </a>
              </div>
            </div>
          )}

          {/* Activity Comments Log */}
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={20} color="var(--primary)" /> Progress & Audit Log
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {parseComments(grievance.commentsJson).map((c, idx) => (
                <div key={idx} style={{ padding: '1rem', borderRadius: '12px', background: 'var(--surface-hover)', borderLeft: '4px solid var(--primary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.8rem', color: 'var(--text-light)' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-dark)' }}>{c.author} ({c.role})</span>
                    <span>{new Date(c.timestamp).toLocaleString()}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-medium)' }}>{c.comment}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Citizen Rating & Feedback Box (If Resolved) */}
          {grievance.status === 'Resolved' && (
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(6, 182, 212, 0.08))' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.5rem' }}>Citizen Satisfaction Survey</h3>
              <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                How satisfied are you with the speed and quality of resolution?
              </p>

              {ratingSubmitted ? (
                <div style={{ background: 'var(--success-bg)', color: 'var(--success)', padding: '1rem', borderRadius: '12px', fontWeight: 700 }}>
                  ✓ Thank you! Your rating ({userRating}/5 Stars) has been recorded for civic evaluation.
                </div>
              ) : (
                <div>
                  <div className="star-rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={32}
                        className="star-icon"
                        color={(hoverRating || userRating) >= star ? '#F59E0B' : '#CBD5E1'}
                        fill={(hoverRating || userRating) >= star ? '#F59E0B' : 'transparent'}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setUserRating(star)}
                      />
                    ))}
                  </div>

                  <textarea 
                    className="form-control" 
                    rows="3" 
                    placeholder="Share optional feedback or remarks..." 
                    value={userFeedback}
                    onChange={(e) => setUserFeedback(e.target.value)}
                    style={{ margin: '1rem 0' }}
                  ></textarea>

                  <button onClick={submitRating} className="btn btn-primary" disabled={ratingLoading || !userRating}>
                    {ratingLoading ? 'Submitting...' : <><Send size={18} /> Submit Feedback</>}
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default TrackGrievance;
