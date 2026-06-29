import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://jotforms-backend-1.onrender.com/api';
const DIVISIONS = [
  'NUCLEUS', 'NUTRIUS', 'MAXIMUS', 'GLADIUS', 'STIMULUS',
  'IMPETUS', 'GLAMUS', 'GLOBUS KENYA', 'GLOBUS UGANDA', 'GLOBUS NIGERIA'
];

// ─── Multi-Select Dropdown with Checkboxes ────────────────────────────────────
const MultiSelectDropdown = ({ id, options, selected, onChange, placeholder, disabled }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const toggle = (val) => {
    if (selected.includes(val)) {
      onChange(selected.filter(v => v !== val));
    } else {
      onChange([...selected, val]);
    }
  };

  const selectAll = () => onChange([...options]);
  const clearAll = () => onChange([]);

  return (
    <div ref={ref} style={{ position: 'relative' }} id={id}>
      {/* Trigger */}
      <div
        onClick={() => !disabled && setOpen(o => !o)}
        style={{
          width: '100%',
          padding: '0.6rem 0.75rem',
          borderRadius: '8px',
          border: `1px solid ${open ? 'var(--primary, #6366f1)' : 'var(--border-color, #e5e7eb)'}`,
          background: disabled ? '#f9fafb' : 'white',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.92rem',
          minHeight: '44px',
          boxShadow: open ? '0 0 0 3px rgba(99,102,241,0.12)' : 'none',
          transition: 'border 0.2s, box-shadow 0.2s',
          gap: '8px',
          userSelect: 'none',
        }}
      >
        <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {selected.length === 0 ? (
            <span style={{ color: '#9ca3af' }}>{placeholder}</span>
          ) : (
            selected.map(v => (
              <span key={v} style={{
                background: '#ede9fe', color: '#5b21b6', borderRadius: '4px',
                padding: '2px 8px', fontSize: '0.78rem', fontWeight: 600,
                display: 'inline-flex', alignItems: 'center', gap: '4px'
              }}>
                {v}
                <span
                  onClick={e => { e.stopPropagation(); toggle(v); }}
                  style={{ cursor: 'pointer', fontWeight: 700, lineHeight: 1 }}
                >×</span>
              </span>
            ))
          )}
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {/* Dropdown Panel */}
      {open && !disabled && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '10px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          zIndex: 200,
          maxHeight: '220px',
          overflowY: 'auto',
        }}>
          {/* Select All / Clear All bar */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', padding: '0.5rem 1rem',
            borderBottom: '1px solid #f3f4f6', background: '#fafafa', borderRadius: '10px 10px 0 0'
          }}>
            <button type="button" onClick={selectAll}
              style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600, padding: 0 }}>
              Select All
            </button>
            <button type="button" onClick={clearAll}
              style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600, padding: 0 }}>
              Clear
            </button>
          </div>
          {options.length === 0 ? (
            <div style={{ padding: '0.75rem 1rem', color: '#9ca3af', fontSize: '0.88rem' }}>No options available</div>
          ) : (
            options.map(opt => (
              <label key={opt} style={{
                display: 'flex', alignItems: 'center', padding: '0.55rem 1rem',
                cursor: 'pointer', gap: '0.6rem', fontSize: '0.9rem',
                color: selected.includes(opt) ? '#5b21b6' : 'var(--text-primary)',
                background: selected.includes(opt) ? '#f5f3ff' : 'transparent',
                transition: 'background 0.12s',
              }}
                onMouseEnter={e => { if (!selected.includes(opt)) e.currentTarget.style.background = '#f9fafb'; }}
                onMouseLeave={e => { e.currentTarget.style.background = selected.includes(opt) ? '#f5f3ff' : 'transparent'; }}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={() => toggle(opt)}
                  style={{ accentColor: '#6366f1', width: '15px', height: '15px', cursor: 'pointer' }}
                />
                <span style={{ fontWeight: selected.includes(opt) ? 600 : 400 }}>{opt}</span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// ─── Helper: parse comma-separated string to array ────────────────────────────
const toArray = (str) => str ? str.split(',').map(s => s.trim()).filter(Boolean) : [];
const toStr = (arr) => Array.isArray(arr) ? arr.filter(Boolean).join(',') : (arr || '');

// ─── AdminPanel ───────────────────────────────────────────────────────────────
function AdminPanel() {
  const [forms, setForms] = useState([]);
  const [formData, setFormData] = useState({
    division: 'NUCLEUS', name: '', url: '', regions: [], roles: []
  });
  const [editingId, setEditingId] = useState(null);
  const [regions, setRegions] = useState([]);
  const [roles, setRoles] = useState([]);
  const navigate = useNavigate();

  const token = localStorage.getItem('admin_token');
  const getAuthHeader = () => ({ headers: { Authorization: `Bearer ${token}` } });

  const fetchRegionsForDivision = async (d) => {
    try {
      const res = await axios.get(`${API_URL}/admin/regions?division=${encodeURIComponent(d)}`, getAuthHeader());
      setRegions(res.data || []);
    } catch (err) {
      console.error('Failed to fetch regions', err);
      setRegions([]);
    }
  };

  // Fetch roles for all selected regions and merge unique results
  const fetchRolesForRegions = async (division, selectedRegions) => {
    if (!selectedRegions || selectedRegions.length === 0) {
      setRoles([]);
      return;
    }
    try {
      const results = await Promise.all(
        selectedRegions.map(r =>
          axios.get(`${API_URL}/admin/roles?division=${encodeURIComponent(division)}&region=${encodeURIComponent(r)}`, getAuthHeader())
            .then(res => res.data || [])
            .catch(() => [])
        )
      );
      const allRoles = [...new Set(results.flat())].sort();
      setRoles(allRoles);
    } catch (err) {
      console.error('Failed to fetch roles', err);
      setRoles([]);
    }
  };

  useEffect(() => {
    if (!token) { navigate('/admin/login'); return; }
    fetchForms();
    fetchRegionsForDivision('NUCLEUS');
  }, [token, navigate]);

  const fetchForms = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/forms`, getAuthHeader());
      setForms(res.data);
    } catch (err) {
      console.error('Failed to fetch forms', err);
      if (err.response?.status === 401 || err.response?.status === 403) handleLogout();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/admin/login');
  };

  const handleDivisionChange = async (d) => {
    setFormData(prev => ({ ...prev, division: d, regions: [], roles: [] }));
    setRegions([]);
    setRoles([]);
    await fetchRegionsForDivision(d);
  };

  const handleRegionsChange = async (selectedRegions) => {
    setFormData(prev => ({ ...prev, regions: selectedRegions, roles: [] }));
    setRoles([]);
    await fetchRolesForRegions(formData.division, selectedRegions);
  };

  const handleRolesChange = (selectedRoles) => {
    setFormData(prev => ({ ...prev, roles: selectedRoles }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      division: formData.division,
      name: formData.name,
      url: formData.url,
      region: toStr(formData.regions),
      role: toStr(formData.roles),
    };
    try {
      if (editingId) {
        await axios.put(`${API_URL}/admin/forms/${editingId}`, payload, getAuthHeader());
      } else {
        await axios.post(`${API_URL}/admin/forms`, payload, getAuthHeader());
      }
      setFormData({ division: 'NUCLEUS', name: '', url: '', regions: [], roles: [] });
      setEditingId(null);
      setRoles([]);
      await fetchForms();
      await fetchRegionsForDivision('NUCLEUS');
    } catch (err) {
      console.error('Failed to save form', err);
    }
  };

  const handleEdit = async (form) => {
    setEditingId(form.id);
    const selectedRegions = toArray(form.region);
    const selectedRoles = toArray(form.role);
    try {
      const regRes = await axios.get(`${API_URL}/admin/regions?division=${encodeURIComponent(form.division)}`, getAuthHeader());
      setRegions(regRes.data || []);
      await fetchRolesForRegions(form.division, selectedRegions);
    } catch (err) {
      console.error('Error loading edit metadata', err);
    }
    setFormData({
      division: form.division,
      name: form.name,
      url: form.url,
      regions: selectedRegions,
      roles: selectedRoles,
    });
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

  const handleCancel = () => {
    setEditingId(null);
    setFormData({ division: 'NUCLEUS', name: '', url: '', regions: [], roles: [] });
    setRoles([]);
    fetchRegionsForDivision('NUCLEUS');
  };

  return (
    <div className="container">
      <div className="header admin-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage forms for all divisions</p>
        </div>
        <button onClick={handleLogout} className="glass-button admin-logout-btn"
          style={{ background: 'rgba(255, 77, 77, 0.1)', color: '#ff4d4d', borderColor: 'rgba(255, 77, 77, 0.2)' }}>
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

          {/* Division */}
          <div className="form-group">
            <label>Division</label>
            <div className="division-grid admin-division-grid">
              {DIVISIONS.map(d => (
                <div key={d}
                  className={`division-box ${formData.division === d ? 'active' : ''}`}
                  onClick={() => handleDivisionChange(d)}>
                  {d}
                </div>
              ))}
            </div>
          </div>

          {/* Region & Role — Multi-Select Dropdowns */}
          <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label htmlFor="region-select" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.5rem' }}>
                Region
                {formData.regions.length > 0 && (
                  <span style={{ background: '#6366f1', color: 'white', borderRadius: '999px', fontSize: '0.7rem', padding: '1px 7px', fontWeight: 700 }}>
                    {formData.regions.length}
                  </span>
                )}
              </label>
              <MultiSelectDropdown
                id="region-select"
                options={regions}
                selected={formData.regions}
                onChange={handleRegionsChange}
                placeholder={regions.length === 0 ? 'Loading regions...' : 'Select Regions'}
                disabled={regions.length === 0}
              />
            </div>
            <div>
              <label htmlFor="role-select" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.5rem' }}>
                Role
                {formData.roles.length > 0 && (
                  <span style={{ background: '#8b5cf6', color: 'white', borderRadius: '999px', fontSize: '0.7rem', padding: '1px 7px', fontWeight: 700 }}>
                    {formData.roles.length}
                  </span>
                )}
              </label>
              <MultiSelectDropdown
                id="role-select"
                options={roles}
                selected={formData.roles}
                onChange={handleRolesChange}
                placeholder={formData.regions.length === 0 ? 'Select a region first' : roles.length === 0 ? 'Loading roles...' : 'Select Roles'}
                disabled={formData.regions.length === 0 || roles.length === 0}
              />
            </div>
          </div>

          {/* Form Name */}
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

          {/* Form URL */}
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
              <button type="button" className="admin-cancel-btn"
                style={{ marginLeft: '1rem', background: 'transparent', color: 'var(--text-primary)' }}
                onClick={handleCancel}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Existing Forms */}
      <h2>Existing Forms</h2>
      <div className="grid admin-forms-grid" style={{ marginTop: '1.5rem' }}>
        {forms.map(form => {
          const formRegions = toArray(form.region);
          const formRoles = toArray(form.role);
          return (
            <div key={form.id} className="card glass-panel admin-form-card"
              style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
                <span className="badge">{form.division}</span>
                {formRegions.map(r => (
                  <span key={r} className="badge"
                    style={{ background: '#e0f2fe', color: '#0369a1', borderColor: '#bae6fd' }}>{r}</span>
                ))}
                {formRoles.map(r => (
                  <span key={r} className="badge"
                    style={{ background: '#f3e8ff', color: '#6b21a8', borderColor: '#e9d5ff' }}>{r}</span>
                ))}
              </div>
              <h3 className="card-title" style={{ marginTop: 0 }}>{form.name}</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', wordBreak: 'break-all', marginBottom: '1.5rem' }}>
                {form.url}
              </p>
              <div className="admin-card-actions" style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '1rem' }}>
                <button className="btn-primary admin-edit-btn"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', flex: 1 }}
                  onClick={() => handleEdit(form)}>
                  Edit
                </button>
                <button className="btn-danger admin-delete-btn" onClick={() => handleDelete(form.id)}>
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AdminPanel;
