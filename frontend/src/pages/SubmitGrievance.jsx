import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Upload, CheckCircle2, AlertCircle, Copy, ArrowRight, ShieldAlert } from 'lucide-react';
import api from '../api';

const SubmitGrievance = () => {
  const [formData, setFormData] = useState({
    title: '',
    category: 'Water Issue',
    area: 'North Zone',
    priority: 'Medium',
    customerPhone: '',
    customerEmail: '',
    description: '',
    attachmentUrl: ''
  });

  const [loading, setLoading] = useState(false);
  const [submittedId, setSubmittedId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSimulateAttachment = (e) => {
    const file = e.target.files[0];
    if (file) {
      const blobUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, attachmentUrl: blobUrl }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/grievances', formData);
      setSubmittedId(response.data.id);
    } catch (err) {
      setError('Failed to submit grievance. Please verify all details and try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (submittedId) {
      navigator.clipboard.writeText(submittedId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '720px', margin: '1rem auto' }}>
      <div className="glass-panel" style={{ padding: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{ background: 'var(--primary-glow)', color: 'var(--primary)', padding: '0.6rem', borderRadius: '12px' }}>
            <ShieldAlert size={26} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>File Official Grievance</h2>
            <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', margin: 0 }}>Provide details to route your complaint directly to the responsible zone officer.</p>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '1.5rem 0' }} />

        {error && (
          <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '1rem 1.25rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title / Subject *</label>
            <input 
              type="text" 
              name="title" 
              className="form-control" 
              value={formData.title}
              onChange={handleChange}
              required 
              placeholder="e.g. Major Water Pipeline Leakage on Main Street"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
            <div className="form-group">
              <label>Category *</label>
              <select 
                name="category" 
                className="form-control"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="Water Issue">💧 Water Supply & Drainage</option>
                <option value="Road Issue">🛣️ Road, Pothole & Traffic</option>
                <option value="Electricity Complaint">⚡ Electricity & Streetlights</option>
                <option value="Sanitation & Garbage">🗑️ Sanitation & Waste Management</option>
                <option value="Other">📌 Other Civic Issues</option>
              </select>
            </div>

            <div className="form-group">
              <label>Zone / Location *</label>
              <select 
                name="area" 
                className="form-control"
                value={formData.area}
                onChange={handleChange}
              >
                <option value="North Zone">North Zone</option>
                <option value="South Zone">South Zone</option>
                <option value="East Zone">East Zone</option>
                <option value="West Zone">West Zone</option>
              </select>
            </div>

            <div className="form-group">
              <label>Priority Level *</label>
              <select 
                name="priority" 
                className="form-control"
                value={formData.priority}
                onChange={handleChange}
              >
                <option value="Low">🟢 Low Priority</option>
                <option value="Medium">🔵 Medium Priority</option>
                <option value="High">🟠 High Priority</option>
                <option value="Urgent">🔴 Urgent Emergency</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
            <div className="form-group">
              <label>Contact Phone *</label>
              <input 
                type="tel" 
                name="customerPhone" 
                className="form-control" 
                value={formData.customerPhone}
                onChange={handleChange}
                required 
                placeholder="e.g. +1 (555) 019-2834"
              />
            </div>

            <div className="form-group">
              <label>Email Address (Optional)</label>
              <input 
                type="email" 
                name="customerEmail" 
                className="form-control" 
                value={formData.customerEmail}
                onChange={handleChange}
                placeholder="e.g. citizen@example.com"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Detailed Description *</label>
            <textarea 
              name="description" 
              className="form-control" 
              rows="4"
              value={formData.description}
              onChange={handleChange}
              required
              placeholder="Describe exact location landmarks, duration of issue, severity, and any additional details..."
            ></textarea>
          </div>

          <div className="form-group">
            <label>Upload Photo / Attachment (Optional)</label>
            <div style={{ border: '2px dashed var(--border)', padding: '1.25rem', borderRadius: '12px', textAlign: 'center', background: 'var(--surface-hover)', cursor: 'pointer' }}>
              <input 
                type="file" 
                accept="image/*"
                onChange={handleSimulateAttachment}
                style={{ display: 'none' }}
                id="photo-upload"
              />
              <label htmlFor="photo-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                <Upload size={24} color="var(--primary)" />
                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--primary)' }}>Click to upload incident photo</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Supports PNG, JPG up to 10MB</span>
              </label>
              {formData.attachmentUrl && (
                <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <img src={formData.attachmentUrl} alt="Preview" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: 600 }}>Image attached!</span>
                </div>
              )}
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: '1rem', padding: '0.9rem' }}>
            {loading ? 'Submitting Grievance...' : <><Send size={18} /> Submit Grievance Ticket</>}
          </button>
        </form>
      </div>

      {/* Success Modal */}
      {submittedId && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--success-bg)', color: 'var(--success)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <CheckCircle2 size={36} />
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.5rem' }}>Grievance Submitted!</h2>
            <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem' }}>
              Your issue has been automatically logged and routed to the assigned zone officer.
            </p>

            <div style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', padding: '1rem', borderRadius: '14px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
              <code style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.02em', wordBreak: 'break-all' }}>
                {submittedId}
              </code>
              <button onClick={copyToClipboard} className="btn btn-outline btn-sm" style={{ flexShrink: 0 }}>
                <Copy size={16} /> {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '2rem' }}>
              Save this Tracking ID to check status updates or receive SMS alerts.
            </p>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={() => navigate(`/track?id=${submittedId}`)} 
                className="btn btn-primary" 
                style={{ flex: 1 }}
              >
                Track Status Now <ArrowRight size={18} />
              </button>
              <button 
                onClick={() => {
                  setSubmittedId(null);
                  setFormData({ title: '', category: 'Water Issue', area: 'North Zone', priority: 'Medium', customerPhone: '', customerEmail: '', description: '', attachmentUrl: '' });
                }} 
                className="btn btn-outline"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmitGrievance;
