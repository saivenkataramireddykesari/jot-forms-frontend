import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://jotforms-backend-1.onrender.com/api';



// ─────────────────────────────────────────────────────────────────────────────
// EmployeePortal Component
// ─────────────────────────────────────────────────────────────────────────────
function EmployeePortal() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [forms, setForms] = useState([]);
  const [activeForm, setActiveForm] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [authStep, setAuthStep] = useState('Initializing...');

  // ── Guard against React StrictMode double-invocation ──────────────────────
  const hasRun = useRef(false);

  useEffect(() => {
    // Prevent double execution in React StrictMode (dev)
    if (hasRun.current) return;
    hasRun.current = true;

    const rawData = searchParams.get('data');
    const plainId = searchParams.get('id');

    // ── Step 1: Handle Plain Text ID or Base64 Data ──────────────────────
    let tokenToUse = null;

    // Helper to check if string is likely Base64
    const isBase64 = (str) => {
      if (!str || str.length % 4 !== 0 && str.length % 4 !== 3 && str.length % 4 !== 2) return false;
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      if (!base64Regex.test(str)) return false;
      try {
        return btoa(atob(str)) === str || btoa(atob(str)).replace(/=/g, '') === str.replace(/=/g, '');
      } catch (err) {
        return false;
      }
    };

    if (plainId) {
      try {
        const encoded = btoa(unescape(encodeURIComponent(plainId)));
        validateToken(encoded, true); // true = cleanup URL on success
      } catch (e) { console.error(e); setLoading(false); }
    } else if (rawData) {
      if (isBase64(rawData)) {
        validateToken(rawData, true);
      } else {
        try {
          const encoded = btoa(unescape(encodeURIComponent(rawData)));
          validateToken(encoded, true);
        } catch (e) { console.error(e); setLoading(false); }
      }
    } else {
      // Check for existing session in localStorage
      const savedEmp = localStorage.getItem('emp_data');
      const savedJwt = localStorage.getItem('emp_jwt');
      
      if (savedEmp && savedJwt) {
        setEmployee(JSON.parse(savedEmp));
        setAuthStep('Restoring session...');
        fetchForms(JSON.parse(savedEmp).division);
      } else {
        setError('No access data found. Please use the link provided by your administrator.');
        setLoading(false);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Backend Validation ──────────────────────────────────────────────────────
  const validateToken = async (encodedToken, shouldCleanup = false) => {
    try {
      setAuthStep('Authenticating...');

      const res = await axios.post(`${API_URL}/employee/login`, {
        token: encodedToken,
      });

      const { employee, jwt_token } = res.data;

      localStorage.setItem('emp_jwt', jwt_token);
      localStorage.setItem('emp_data', JSON.stringify(employee));

      setEmployee(employee);
      
      // Clean URL only after successful login
      if (shouldCleanup) {
        navigate('/auth', { replace: true });
      }

      setAuthStep('Loading forms...');
      fetchForms(employee.division);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.detail || 'Invalid or expired token.';
      setError(msg);
      setLoading(false);
    }
  };

  // ── Fetch forms for this employee's division ────────────────────────────────
  const fetchForms = async (division) => {
    try {
      const jwt = localStorage.getItem('emp_jwt');
      const res = await axios.get(`${API_URL}/employee/forms?division=${division}`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      setForms(res.data);
      setLoading(false);
    } catch {
      setError('Failed to load forms for your division.');
      setLoading(false);
    }
  };

  // Append employee info to iframe URL for Jotform prefill
  const getIframeUrl = (url) => {
    if (!url) return '';
    try {
      const u = new URL(url);
      u.searchParams.set('employeeId', employee.employee_id);
      u.searchParams.set('division', employee.division);
      return u.toString();
    } catch {
      return url;
    }
  };

  // ── Loading Screen ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="login-container">
        <div className="glass-panel login-box">
          <div className="login-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <h2 style={{ marginBottom: '0.5rem' }}>Authenticating…</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{authStep}</p>

          {/* Loading bar */}
          <div style={{
            marginTop: '1.5rem', height: '3px', borderRadius: '2px',
            background: 'var(--border-color)', overflow: 'hidden'
          }}>
            <div style={{
              height: '100%', width: '40%', borderRadius: '2px',
              background: 'var(--primary-color)',
              animation: 'loadbar 1.2s ease-in-out infinite alternate'
            }} />
          </div>
          <style>{`
            @keyframes loadbar {
              from { transform: translateX(-100%); }
              to   { transform: translateX(300%); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  // ── Error Screen ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="login-container">
        <div className="glass-panel login-box" style={{ borderColor: 'var(--danger)' }}>
          <div className="login-icon" style={{ color: 'var(--danger)', background: 'rgba(239,68,68,0.1)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 style={{ marginBottom: '1rem' }}>Access Denied</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{error}</p>
        </div>
      </div>
    );
  }

  // ── Main Portal ─────────────────────────────────────────────────────────────
  if (activeForm) {
    return (
      <div className="fullscreen-form">
        <div className="fullscreen-header">
          <button className="back-button" onClick={() => setActiveForm(null)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Back to Forms</span>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{activeForm.name}</span>
            <span className="badge">{employee.division}</span>
          </div>
          <div style={{ width: 100 }}></div> {/* Spacer for balance */}
        </div>
        <iframe
          key={activeForm.id}
          src={getIframeUrl(activeForm.url)}
          title={activeForm.name}
          allow="camera; microphone; geolocation"
          style={{ flex: 1, width: '100%', border: 'none' }}
        />
      </div>
    );
  }

  return (
    <div className="employee-portal" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Top bar */}
      <div className="glass-panel employee-portal-header" style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '1rem 2rem', borderRadius: 0,
        borderLeft: 'none', borderRight: 'none', borderTop: 'none',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '8px',
            background: '#eff6ff', display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div>
            {/* <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Employee Portal</div> */}
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {employee.employee_id}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span className="badge">{employee.division.toUpperCase()} Division</span>
          {employee.region && <span className="badge" style={{ background: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' }}>{employee.region}</span>}
          {employee.role && <span className="badge" style={{ background: '#faf5ff', color: '#6b21a8', borderColor: '#e9d5ff' }}>{employee.role}</span>}
        </div>
      </div>

      {/* Body */}
      <div className="employee-portal-body" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Form List Container - fills screen on laptop */}
        <div className="container" style={{ overflowY: 'auto', padding: '2rem' }}>
          <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.875rem', marginBottom: '0.5rem' }}>Available Forms</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Select a form below to get started</p>
          </div>

          {forms.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '1rem', opacity: 0.5 }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <p>No forms have been assigned to your division yet.</p>
            </div>
          ) : (
            <div className="grid">
              {forms.map(form => (
                <button
                  key={form.id}
                  onClick={() => setActiveForm(form)}
                  className="glass-panel"
                  style={{
                    width: '100%', textAlign: 'left', padding: '1.5rem',
                    borderRadius: '12px', border: '1px solid var(--border-color)',
                    cursor: 'pointer', transition: 'all 0.2s ease',
                    background: 'white', color: 'var(--text-primary)',
                    display: 'flex', alignItems: 'center', gap: '1.25rem'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary-color)';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--shadow)';
                  }}
                >
                  <div style={{
                    width: 48, height: 48, borderRadius: '12px',
                    background: '#eff6ff', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)'
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>{form.name}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      Click to open and fill
                    </div>
                  </div>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: '#f8fafc', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)'
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EmployeePortal;
