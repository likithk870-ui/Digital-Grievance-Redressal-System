import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, CheckCircle, Clock, AlertCircle, LogOut, Search, Download, 
  UserPlus, Trash2, Mail, Phone, MessageSquare, Paperclip, AlertTriangle, 
  Shield, Check, UserCheck, Layers, FileText
} from 'lucide-react';
import api from '../api';

const AdminDashboard = () => {
  const [grievances, setGrievances] = useState([]);
  const [supportMessages, setSupportMessages] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tabs & Filters
  const [activeTab, setActiveTab] = useState('grievances'); // 'grievances' | 'staff' | 'support'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterArea, setFilterArea] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');

  // Selection & Bulk Actions
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkReplyContent, setBulkReplyContent] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Support Reply State
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');

  // Progress Note State
  const [noteGrievanceId, setNoteGrievanceId] = useState(null);
  const [noteContent, setNoteContent] = useState('');

  // Image Modal State
  const [viewImageUrl, setViewImageUrl] = useState(null);

  // Staff Management State
  const [currentUser, setCurrentUser] = useState(null);
  const [newStaff, setNewStaff] = useState({ name: '', department: 'Water Dept', area: 'North Zone', workPhone: '', email: '', password: '' });

  const navigate = useNavigate();

  useEffect(() => {
    fetchCurrentUser();
    fetchGrievances();
    fetchSupportMessages();
    fetchStaff();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/admin/me');
      setCurrentUser(response.data);
    } catch (err) {
      console.error('Failed to fetch current user');
    }
  };

  const fetchGrievances = async () => {
    try {
      const response = await api.get('/grievances');
      setGrievances(response.data);
    } catch (err) {
      console.error('Failed to fetch grievances');
    } finally {
      setLoading(false);
    }
  };

  const fetchSupportMessages = async () => {
    try {
      const response = await api.get('/support');
      setSupportMessages(response.data);
    } catch (err) {
      console.error('Failed to fetch support messages');
    }
  };

  const fetchStaff = async () => {
    try {
      const response = await api.get('/staff');
      setStaff(response.data);
    } catch (err) {
      console.error('Failed to fetch staff');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.put(`/grievances/${id}/status`, { status: newStatus });
      fetchGrievances();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handlePriorityChange = async (id, newPriority) => {
    try {
      await api.put(`/grievances/${id}/status`, { priority: newPriority });
      fetchGrievances();
    } catch (err) {
      alert('Failed to update priority');
    }
  };

  const handleAssign = async (id, assignedToId) => {
    try {
      await api.put(`/grievances/${id}/assign`, { assignedToId: assignedToId || null });
      fetchGrievances();
    } catch (err) {
      alert('Failed to assign grievance');
    }
  };

  const submitProgressNote = async () => {
    if (!noteContent.trim() || !noteGrievanceId) return;
    try {
      await api.post(`/grievances/${noteGrievanceId}/comments`, { comment: noteContent });
      setNoteGrievanceId(null);
      setNoteContent('');
      fetchGrievances();
    } catch (err) {
      alert('Failed to add comment');
    }
  };

  const submitSupportReply = async (id) => {
    if (!replyContent.trim()) return;
    try {
      await api.put(`/support/${id}/reply`, { reply: replyContent });
      setReplyingTo(null);
      setReplyContent('');
      fetchSupportMessages();
      alert('Reply email dispatched via Ethereal Nodemailer!');
    } catch (err) {
      alert('Failed to send reply');
    }
  };

  const handleBulkAction = async () => {
    if (selectedIds.length === 0) return;
    try {
      await api.post('/grievances/bulk-action', {
        ids: selectedIds,
        status: 'Resolved',
        reply: bulkReplyContent
      });
      setSelectedIds([]);
      setBulkReplyContent('');
      setShowBulkModal(false);
      fetchGrievances();
    } catch (err) {
      alert('Failed to execute bulk action');
    }
  };

  const handleExportCSV = () => {
    const token = localStorage.getItem('adminToken');
    window.open(`http://localhost:5000/api/grievances/export/csv?token=${token}`, '_blank');
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      await api.post('/staff', newStaff);
      setNewStaff({ name: '', department: 'Water Dept', area: 'North Zone', workPhone: '', email: '', password: '' });
      fetchStaff();
      alert('Staff officer created successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create staff');
    }
  };

  const handleDeleteStaff = async (id) => {
    if (!window.confirm('Are you sure you want to remove this staff member?')) return;
    try {
      await api.delete(`/staff/${id}`);
      fetchStaff();
    } catch (err) {
      alert('Failed to delete staff');
    }
  };

  const filteredGrievances = grievances.filter(g => {
    if (filterArea !== 'All' && g.area !== filterArea) return false;
    if (filterCategory !== 'All' && g.category !== filterCategory) return false;
    if (filterStatus !== 'All' && g.status !== filterStatus) return false;
    if (filterPriority !== 'All' && (g.priority || 'Medium') !== filterPriority) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        g.title?.toLowerCase().includes(q) ||
        g.description?.toLowerCase().includes(q) ||
        g.id?.toLowerCase().includes(q) ||
        g.customerPhone?.toLowerCase().includes(q)
      );
    }
    return true;
  });

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

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '4rem', fontWeight: 600 }}>Loading Portal Dashboard...</div>;
  }

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '4rem' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Settings size={32} color="var(--primary)" />
            <h2 style={{ color: 'var(--text-dark)', margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>
              Officer Control Panel
            </h2>
          </div>
          {currentUser && (
            <p style={{ color: 'var(--text-light)', margin: '0.2rem 0 0 0', fontSize: '0.9rem', fontWeight: 500 }}>
              Logged in as <strong style={{ color: 'var(--primary)' }}>{currentUser.email}</strong> ({currentUser.department} • {currentUser.area})
            </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={handleExportCSV} className="btn btn-outline" style={{ padding: '0.6rem 1.2rem' }}>
            <Download size={16} /> Export CSV Report
          </button>
          <button 
            onClick={() => { localStorage.removeItem('adminToken'); navigate('/login'); }} 
            className="btn btn-danger btn-sm" 
            style={{ padding: '0.6rem 1.2rem' }}
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setActiveTab('grievances')}
          className={`btn ${activeTab === 'grievances' ? 'btn-primary' : 'btn-outline'}`}
          style={{ padding: '0.6rem 1.4rem' }}
        >
          <FileText size={18} /> Grievances Registry ({grievances.length})
        </button>

        {currentUser?.department === 'Management' && (
          <button 
            onClick={() => setActiveTab('staff')}
            className={`btn ${activeTab === 'staff' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '0.6rem 1.4rem' }}
          >
            <UserCheck size={18} /> Staff Roster ({staff.length})
          </button>
        )}

        {currentUser?.department === 'Management' && (
          <button 
            onClick={() => setActiveTab('support')}
            className={`btn ${activeTab === 'support' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '0.6rem 1.4rem' }}
          >
            <Mail size={18} /> Support Inquiries ({supportMessages.length})
          </button>
        )}
      </div>

      {/* STATS CARDS */}
      {activeTab === 'grievances' && (
        <>
          <div className="stats-grid">
            <div className="glass-panel stat-card">
              <div className="stat-icon-wrapper" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>
                <AlertCircle size={28} />
              </div>
              <div>
                <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>Pending Action</p>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>{grievances.filter(g => g.status === 'Pending').length}</h3>
              </div>
            </div>

            <div className="glass-panel stat-card">
              <div className="stat-icon-wrapper" style={{ background: 'var(--info-bg)', color: 'var(--info)' }}>
                <Clock size={28} />
              </div>
              <div>
                <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>In Progress</p>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>{grievances.filter(g => g.status === 'In Progress').length}</h3>
              </div>
            </div>

            <div className="glass-panel stat-card">
              <div className="stat-icon-wrapper" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
                <CheckCircle size={28} />
              </div>
              <div>
                <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>Resolved Tickets</p>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>{grievances.filter(g => g.status === 'Resolved').length}</h3>
              </div>
            </div>

            <div className="glass-panel stat-card">
              <div className="stat-icon-wrapper" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>
                <AlertTriangle size={28} />
              </div>
              <div>
                <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>Urgent Priority</p>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>{grievances.filter(g => g.priority === 'Urgent').length}</h3>
              </div>
            </div>
          </div>

          {/* Search & Filters Toolbar */}
          <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Search Title, ID, Phone..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
              <Search size={18} color="var(--text-light)" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>

            <select className="form-control" value={filterArea} onChange={e => setFilterArea(e.target.value)} style={{ width: 'auto' }}>
              <option value="All">All Zones</option>
              <option value="North Zone">North Zone</option>
              <option value="South Zone">South Zone</option>
              <option value="East Zone">East Zone</option>
              <option value="West Zone">West Zone</option>
            </select>

            <select className="form-control" value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ width: 'auto' }}>
              <option value="All">All Categories</option>
              <option value="Water Issue">Water Issue</option>
              <option value="Road Issue">Road Issue</option>
              <option value="Electricity Complaint">Electricity Complaint</option>
              <option value="Sanitation & Garbage">Sanitation</option>
              <option value="Other">Other</option>
            </select>

            <select className="form-control" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 'auto' }}>
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>

            <select className="form-control" value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={{ width: 'auto' }}>
              <option value="All">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            {selectedIds.length > 0 && (
              <button className="btn btn-primary" onClick={() => setShowBulkModal(true)} style={{ whiteSpace: 'nowrap' }}>
                Bulk Resolve ({selectedIds.length})
              </button>
            )}
          </div>

          {/* Grievance Table */}
          <div className="glass-panel" style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.length === filteredGrievances.length && filteredGrievances.length > 0}
                      onChange={(e) => setSelectedIds(e.target.checked ? filteredGrievances.map(g => g.id) : [])}
                    />
                  </th>
                  <th>ID</th>
                  <th>Title & Contact</th>
                  <th>Zone / Dept</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assignee</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGrievances.map((g) => (
                  <tr key={g.id} style={{ background: selectedIds.includes(g.id) ? 'rgba(79, 70, 229, 0.06)' : 'transparent' }}>
                    <td>
                      <input type="checkbox" checked={selectedIds.includes(g.id)} onChange={() => toggleSelect(g.id)} />
                    </td>
                    <td>
                      <code style={{ fontSize: '0.8rem', fontWeight: 700 }}>{g.id.substring(0, 8)}...</code>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-dark)' }}>{g.title}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>📞 {g.customerPhone} | 🗓️ {new Date(g.createdAt).toLocaleDateString()}</div>
                      {g.attachmentUrl && (
                        <button 
                          onClick={() => setViewImageUrl(g.attachmentUrl)}
                          className="btn btn-outline btn-sm" 
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', marginTop: '0.3rem' }}
                        >
                          <Paperclip size={12} /> View Photo Evidence
                        </button>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{g.area}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{g.category}</div>
                    </td>
                    <td>
                      <select 
                        className={`badge ${getPriorityBadgeClass(g.priority || 'Medium')}`}
                        value={g.priority || 'Medium'}
                        onChange={(e) => handlePriorityChange(g.id, e.target.value)}
                        style={{ border: 'none', cursor: 'pointer', outline: 'none' }}
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Urgent">Urgent</option>
                      </select>
                    </td>
                    <td>
                      <select 
                        className={`badge ${getStatusBadge(g.status)}`}
                        value={g.status}
                        onChange={(e) => handleStatusChange(g.id, e.target.value)}
                        style={{ border: 'none', cursor: 'pointer', outline: 'none' }}
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </td>
                    <td>
                      <select 
                        className="form-control"
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem', width: 'auto' }}
                        value={g.assignedToId || ''}
                        onChange={(e) => handleAssign(g.id, e.target.value)}
                      >
                        <option value="">Unassigned</option>
                        {staff.map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.area})</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button 
                        onClick={() => setNoteGrievanceId(g.id)}
                        className="btn btn-outline btn-sm"
                        title="Add Progress Comment"
                      >
                        <MessageSquare size={14} /> Note
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* STAFF MANAGEMENT TAB */}
      {activeTab === 'staff' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          {/* Create Staff Form */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserPlus size={22} color="var(--primary)" /> Add Department Officer
            </h3>

            <form onSubmit={handleCreateStaff}>
              <div className="form-group">
                <label>Officer Full Name *</label>
                <input type="text" className="form-control" value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} required placeholder="e.g. John Doe" />
              </div>

              <div className="form-group">
                <label>Department *</label>
                <select className="form-control" value={newStaff.department} onChange={e => setNewStaff({...newStaff, department: e.target.value})}>
                  <option value="Water Dept">Water Dept</option>
                  <option value="Roads Dept">Roads Dept</option>
                  <option value="Electricity Dept">Electricity Dept</option>
                  <option value="Sanitation Dept">Sanitation Dept</option>
                  <option value="Management">Management (Super Admin)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Assigned Zone *</label>
                <select className="form-control" value={newStaff.area} onChange={e => setNewStaff({...newStaff, area: e.target.value})}>
                  <option value="All Zones">All Zones</option>
                  <option value="North Zone">North Zone</option>
                  <option value="South Zone">South Zone</option>
                  <option value="East Zone">East Zone</option>
                  <option value="West Zone">West Zone</option>
                </select>
              </div>

              <div className="form-group">
                <label>Work Phone *</label>
                <input type="text" className="form-control" value={newStaff.workPhone} onChange={e => setNewStaff({...newStaff, workPhone: e.target.value})} required placeholder="555-0199" />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input type="email" className="form-control" value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})} required placeholder="officer@resolveit.gov" />
              </div>

              <div className="form-group">
                <label>Password *</label>
                <input type="password" className="form-control" value={newStaff.password} onChange={e => setNewStaff({...newStaff, password: e.target.value})} required placeholder="••••••••" />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Create Officer Account</button>
            </form>
          </div>

          {/* Roster Table */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1.25rem' }}>Active Officers Roster</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Officer</th>
                    <th>Dept & Zone</th>
                    <th>Contact</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map(s => (
                    <tr key={s.id}>
                      <td>
                        <div style={{ fontWeight: 700 }}>{s.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{s.email}</div>
                      </td>
                      <td>
                        <span className="badge badge-inprogress">{s.department}</span>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '0.2rem' }}>{s.area}</div>
                      </td>
                      <td>📞 {s.workPhone}</td>
                      <td>
                        <button onClick={() => handleDeleteStaff(s.id)} className="btn btn-danger btn-sm">
                          <Trash2 size={14} /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUPPORT INQUIRIES TAB */}
      {activeTab === 'support' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1.5rem' }}>Citizen Support Messages</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {supportMessages.map(msg => (
              <div key={msg.id} style={{ background: 'var(--surface-hover)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                  <div>
                    <h4 style={{ margin: 0, fontWeight: 700 }}>{msg.name}</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-light)' }}>✉️ {msg.email} | 🗓️ {new Date(msg.createdAt).toLocaleString()}</p>
                  </div>
                  {msg.reply && (
                    <span className="badge badge-resolved">✓ Replied</span>
                  )}
                </div>

                <div style={{ background: 'rgba(0,0,0,0.03)', padding: '1rem', borderRadius: '10px', marginBottom: '1rem', lineHeight: '1.5' }}>
                  {msg.message}
                </div>

                {msg.reply ? (
                  <div style={{ background: 'var(--info-bg)', padding: '1rem', borderRadius: '10px', borderLeft: '4px solid var(--info)' }}>
                    <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'var(--info)' }}>Official Reply dispatched:</p>
                    <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.9rem' }}>{msg.reply}</p>
                  </div>
                ) : (
                  <div>
                    {replyingTo === msg.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <textarea 
                          className="form-control" 
                          rows="3" 
                          placeholder="Type email response to citizen..." 
                          value={replyContent}
                          onChange={e => setReplyContent(e.target.value)}
                        ></textarea>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => submitSupportReply(msg.id)} className="btn btn-primary btn-sm">Send Email Response</button>
                          <button onClick={() => setReplyingTo(null)} className="btn btn-outline btn-sm">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => { setReplyingTo(msg.id); setReplyContent(''); }} className="btn btn-outline btn-sm">
                        <Mail size={14} /> Reply via Nodemailer Email
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress Note Modal */}
      {noteGrievanceId && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in">
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1rem' }}>Add Progress Note / Comment</h3>
            <textarea 
              className="form-control" 
              rows="4" 
              placeholder="e.g. Field team dispatched to site. Inspection in progress..." 
              value={noteContent}
              onChange={e => setNoteContent(e.target.value)}
            ></textarea>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem' }}>
              <button onClick={submitProgressNote} className="btn btn-primary" style={{ flex: 1 }}>Save Comment</button>
              <button onClick={() => setNoteGrievanceId(null)} className="btn btn-outline">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* View Photo Evidence Modal */}
      {viewImageUrl && (
        <div className="modal-overlay" onClick={() => setViewImageUrl(null)}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: '650px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1rem' }}>Incident Evidence Photo</h3>
            <img src={viewImageUrl} alt="Evidence" style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '16px', objectFit: 'contain' }} />
            <div style={{ marginTop: '1.5rem' }}>
              <button onClick={() => setViewImageUrl(null)} className="btn btn-primary">Close Preview</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Resolve Modal */}
      {showBulkModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in">
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.5rem' }}>Bulk Resolve ({selectedIds.length} Tickets)</h3>
            <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              This will set all selected grievances to "Resolved" and dispatch notification alerts.
            </p>

            <div className="form-group">
              <label>Resolution Message / Reply to Citizens</label>
              <textarea 
                className="form-control" 
                rows="4" 
                placeholder="e.g. Municipal team has resolved the issue in your area. Thank you for reporting." 
                value={bulkReplyContent}
                onChange={e => setBulkReplyContent(e.target.value)}
              ></textarea>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem' }}>
              <button onClick={handleBulkAction} className="btn btn-primary" style={{ flex: 1 }}>Execute Bulk Resolution</button>
              <button onClick={() => setShowBulkModal(false)} className="btn btn-outline">Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
