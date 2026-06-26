import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://jotforms-backend-1.onrender.com/api';
const DIVISIONS = [
  'NUCLEUS', 'NUTRIUS', 'MAXIMUS', 'GLADIUS', 'STIMULUS', 
  'IMPETUS', 'GLAMUS', 'GLOBUS KENYA', 'GLOBUS UGANDA', 'GLOBUS NIGERIA'
];

function AdminPanel() {
  const [forms, setForms] = useState([]);
  const [formData, setFormData] = useState({ division: 'NUCLEUS', name: '', url: '', region: '', role: '' });
  const [editingId, setEditingId] = useState(null);
  const [regions, setRegions] = useState([]);
  const [roles, setRoles] = useState([]);
  const navigate = useNavigate();

  const token = localStorage.getItem('admin_token');

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${token}` }
  });

  const fetchRegionsForDivision = async (d) => {
    try {
      const res = await axios.get(`${API_URL}/admin/regions?division=${d}`, getAuthHeader());
      setRegions(res.data);
    } catch (err) {
      console.error('Failed to fetch regions', err);
    }
  };

  const fetchRolesForRegion = async (d, r) => {
    try {
      const res = await axios.get(`${API_URL}/admin/roles?division=${d}&region=${r}`, getAuthHeader());
      setRoles(res.data);
    } catch (err) {
      console.error('Failed to fetch roles', err);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchForms();
    fetchRegionsForDivision('NUCLEUS');
  }, [token, navigate]);

  const fetchForms = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/forms`, getAuthHeader());
      setForms(res.data);
    } catch (err) {
      console.error('Failed to fetch forms', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout();
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/admin/login');
  };

  const handleDivisionChange = async (d) => {
    setFormData(prev => ({ ...prev, division: d, region: '', role: '' }));
    setRegions([]);
    setRoles([]);
    await fetchRegionsForDivision(d);
  };

  const handleRegionChange = async (r) => {
    setFormData(prev => ({ ...prev, region: r, role: '' }));
    setRoles([]);
    if (r) {
      await fetchRolesForRegion(formData.division, r);
    }
  };

  const handleRoleChange = (role) => {
    setFormData(prev => ({ ...prev, role }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${API_URL}/admin/forms/${editingId}`, formData, getAuthHeader());
      } else {
        await axios.post(`${API_URL}/admin/forms`, formData, getAuthHeader());
      }
      setFormData({ division: 'NUCLEUS', name: '', url: '', region: '', role: '' });
      setEditingId(null);
      setRegions([]);
      setRoles([]);
      await fetchForms();
      await fetchRegionsForDivision('NUCLEUS');
    } catch (err) {
      console.error('Failed to save form', err);
    }
  };

  const handleEdit = async (form) => {
    setEditingId(form.id);
    try {
      const regionsRes = await axios.get(`${API_URL}/admin/regions?division=${form.division}`, getAuthHeader());
      setRegions(regionsRes.data);
      
      if (form.region) {
        const rolesRes = await axios.get(`${API_URL}/admin/roles?division=${form.division}&region=${form.region}`, getAuthHeader());
        setRoles(rolesRes.data);
      } else {
        setRoles([]);
      }
      
      setFormData({
        division: form.division,
        name: form.name,
        url: form.url,
        region: form.region || '',
        role: form.role || ''
      });
    } catch (err) {
      console.error('Error preparing edit metadata', err);
      setFormData({
        division: form.division,
        name: form.name,
        url: form.url,
        region: form.region || '',
        role: form.role || ''
      });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this form?')) {
      try {
        await axios.delete(`${API_URL}/admin/forms/${id}`, getAuthHeader());
        fetchForms();
      } catch (err) {
        console.error('Failed to delete form', err);
      }
    }
  };

  return (
    <div className="container">
      <div className="header admin-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage forms for all divisions</p>
        </div>
        <button onClick={handleLogout} className="glass-button admin-logout-btn" style={{ background: 'rgba(255, 77, 77, 0.1)', color: '#ff4d4d', borderColor: 'rgba(255, 77, 77, 0.2)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Logout</span>
        </button>
      </div>

      <div className="glass-panel admin-form-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h2>{editingId ? 'Edit Form' : 'Add New Form'}</h2>
        <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
          <div className="form-group">
            <label>Division</label>
            <div className="division-grid admin-division-grid">
              {DIVISIONS.map(d => (
                <div
                  key={d}
                  className={`division-box ${formData.division === d ? 'active' : ''}`}
                  onClick={() => handleDivisionChange(d)}
                >
                  {d}
                </div>
              ))}
            </div>
          </div>

          <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label htmlFor="region-select">Region</label>
              <select
                id="region-select"
                value={formData.region}
                onChange={(e) => handleRegionChange(e.target.value)}
                required
                disabled={regions.length === 0}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'white',
                  color: 'var(--text-primary)',
                  fontSize: '0.95rem'
                }}
              >
                <option value="">Select Region</option>
                {regions.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="role-select">Role</label>
              <select
                id="role-select"
                value={formData.role}
                onChange={(e) => handleRoleChange(e.target.value)}
                required
                disabled={roles.length === 0}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'white',
                  color: 'var(--text-primary)',
                  fontSize: '0.95rem'
                }}
              >
                <option value="">Select Role</option>
                {roles.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Form Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Daily Standup Report"
              required
            />
          </div>

          <div className="form-group">
            <label>Form URL (Jotform)</label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://form.jotform.com/..."
              required
            />
          </div>

          <div className="admin-form-actions">
            <button type="submit" className="btn-primary admin-submit-btn">
              {editingId ? 'Update Form' : 'Add Form'}
            </button>
            {editingId && (
              <button
                type="button"
                className="admin-cancel-btn"
                style={{ marginLeft: '1rem', background: 'transparent', color: 'var(--text-primary)' }}
                onClick={() => {
                  setEditingId(null);
                  setFormData({ division: 'NUCLEUS', name: '', url: '', region: '', role: '' });
                  setRegions([]);
                  setRoles([]);
                  fetchRegionsForDivision('NUCLEUS');
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <h2>Existing Forms</h2>
      <div className="grid admin-forms-grid" style={{ marginTop: '1.5rem' }}>
        {forms.map(form => (
          <div key={form.id} className="card glass-panel admin-form-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
              <span className="badge">{form.division}</span>
              {form.region && <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1', borderColor: '#bae6fd' }}>{form.region}</span>}
              {form.role && <span className="badge" style={{ background: '#f3e8ff', color: '#6b21a8', borderColor: '#e9d5ff' }}>{form.role}</span>}
            </div>
            <h3 className="card-title" style={{ marginTop: 0 }}>{form.name}</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', wordBreak: 'break-all', marginBottom: '1.5rem' }}>
              {form.url}
            </p>
            <div className="admin-card-actions" style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '1rem' }}>
              <button
                className="btn-primary admin-edit-btn"
                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', flex: 1 }}
                onClick={() => handleEdit(form)}
              >
                Edit
              </button>
              <button
                className="btn-danger admin-delete-btn"
                onClick={() => handleDelete(form.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminPanel;
