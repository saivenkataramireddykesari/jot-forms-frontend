import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'https://jotforms-backend-1.onrender.com/api';
const DIVISIONS = ['maxmus', 'nucles', 'gladius', 'stimulas', 'glamus', 'nutrius'];

function AdminPanel() {
  const [forms, setForms] = useState([]);
  const [formData, setFormData] = useState({ division: 'maxmus', name: '', url: '' });
  const [editingId, setEditingId] = useState(null);
  const navigate = useNavigate();

  const token = localStorage.getItem('admin_token');

  useEffect(() => {
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchForms();
  }, [token, navigate]);

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${token}` }
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${API_URL}/admin/forms/${editingId}`, formData, getAuthHeader());
      } else {
        await axios.post(`${API_URL}/admin/forms`, formData, getAuthHeader());
      }
      setFormData({ division: 'maxmus', name: '', url: '' });
      setEditingId(null);
      fetchForms();
    } catch (err) {
      console.error('Failed to save form', err);
    }
  };

  const handleEdit = (form) => {
    setFormData({ division: form.division, name: form.name, url: form.url });
    setEditingId(form.id);
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
      <div className="header">
        <div>
          <h1>Admin Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage forms for all divisions</p>
        </div>
        <button onClick={handleLogout} className="glass-button" style={{ background: 'rgba(255, 77, 77, 0.1)', color: '#ff4d4d', borderColor: 'rgba(255, 77, 77, 0.2)' }}>
          Logout
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h2>{editingId ? 'Edit Form' : 'Add New Form'}</h2>
        <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
          <div className="form-group">
            <label>Division</label>
            <div className="division-grid">
              {DIVISIONS.map(d => (
                <div
                  key={d}
                  className={`division-box ${formData.division === d ? 'active' : ''}`}
                  onClick={() => setFormData({ ...formData, division: d })}
                >
                  {d.toUpperCase()}
                </div>
              ))}
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

          <button type="submit" className="btn-primary">
            {editingId ? 'Update Form' : 'Add Form'}
          </button>
          {editingId && (
            <button
              type="button"
              style={{ marginLeft: '1rem', background: 'transparent', color: 'var(--text-primary)' }}
              onClick={() => {
                setEditingId(null);
                setFormData({ division: 'maxmus', name: '', url: '' });
              }}
            >
              Cancel
            </button>
          )}
        </form>
      </div>

      <h2>Existing Forms</h2>
      <div className="grid" style={{ marginTop: '1.5rem' }}>
        {forms.map(form => (
          <div key={form.id} className="card glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span className="badge">{form.division}</span>
            </div>
            <h3 className="card-title">{form.name}</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
              {form.url}
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '1rem' }}>
              <button
                className="btn-primary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', flex: 1 }}
                onClick={() => handleEdit(form)}
              >
                Edit
              </button>
              <button
                className="btn-danger"
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
