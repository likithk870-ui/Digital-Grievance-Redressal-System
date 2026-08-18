import React, { useState } from 'react';
import { Phone, Mail, MapPin, Send } from 'lucide-react';
import api from '../api';

const ContactSupport = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/support', formData);
      setSubmitted(true);
      setFormData({ name: '', email: '', message: '' });
    } catch (err) {
      console.error('Failed to submit message');
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '2rem auto' }}>
      <h2 style={{ color: 'var(--primary)', marginBottom: '2rem', textAlign: 'center' }}>Customer Support</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        
        {/* Contact Info */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Get in Touch</h3>
          <p style={{ color: 'var(--text-light)', marginBottom: '2rem', lineHeight: '1.6' }}>
            Have a question or need help with a grievance? Our support team is here to assist you. Reach out to us through any of the channels below.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ background: 'var(--bg-gradient-start)', padding: '0.8rem', borderRadius: '50%' }}>
                <Phone size={24} color="var(--primary)" />
              </div>
              <div>
                <h4 style={{ margin: '0 0 0.25rem 0' }}>Phone</h4>
                <p style={{ color: 'var(--text-light)', margin: 0 }}>1-800-123-4567<br/>Mon - Fri, 9am - 6pm</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ background: 'var(--bg-gradient-start)', padding: '0.8rem', borderRadius: '50%' }}>
                <Mail size={24} color="var(--primary)" />
              </div>
              <div>
                <h4 style={{ margin: '0 0 0.25rem 0' }}>Email</h4>
                <p style={{ color: 'var(--text-light)', margin: 0 }}>support@resolveit.gov</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ background: 'var(--bg-gradient-start)', padding: '0.8rem', borderRadius: '50%' }}>
                <MapPin size={24} color="var(--primary)" />
              </div>
              <div>
                <h4 style={{ margin: '0 0 0.25rem 0' }}>Office Address</h4>
                <p style={{ color: 'var(--text-light)', margin: 0 }}>123 Civic Center Drive<br/>Metropolis, NY 10001</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Send a Message</h3>
          
          {submitted ? (
            <div style={{ background: 'var(--success)', color: 'white', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
              <strong>Thank you!</strong><br/>
              Your message has been sent. We will get back to you shortly.
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input 
                  type="text" 
                  name="name" 
                  className="form-control" 
                  value={formData.name}
                  onChange={handleChange}
                  required 
                  placeholder="Your Full Name"
                />
              </div>
              
              <div className="form-group">
                <label>Email</label>
                <input 
                  type="email" 
                  name="email" 
                  className="form-control" 
                  value={formData.email}
                  onChange={handleChange}
                  required 
                  placeholder="Your Email Address"
                />
              </div>

              <div className="form-group">
                <label>Message</label>
                <textarea 
                  name="message" 
                  className="form-control" 
                  rows="4"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  placeholder="How can we help you?"
                ></textarea>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                <Send size={18} /> Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactSupport;
