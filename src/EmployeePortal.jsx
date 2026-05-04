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

    // ── Step 1: Validate param exists ─────────────────────────────────────
    if (!rawData) {
      setError('No access data found in URL. Please use the link provided by your administrator.');
      setLoading(false);
      return;
    }

    // ── Step 2: Pass token directly to backend (Assuming already Base64) ──
    const encodedToken = rawData;
    validateToken(encodedToken);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Backend Validation ──────────────────────────────────────────────────────
  const validateToken = async (encodedToken) => {
    try {
      setAuthStep('Authenticating...');

      // POST to /api/employee/login with the Base64 token
      // Backend will decode it, look up employee_id, return JWT + division
      const res = await axios.post(`${API_URL}/employee/login`, {
        token: encodedToken,
      });

      const { employee, jwt_token } = res.data;

      // ── Step 5: Store session ──────────────────────────────────────────
      localStorage.setItem('emp_jwt', jwt_token);
      localStorage.setItem('emp_data', JSON.stringify(employee));

      setEmployee(employee);
      setAuthStep('Loading forms...');
      fetchForms(employee.division);
    } catch (err) {
      // ── Step 6: Failure → show error ──────────────────────────────────
      const msg = err.response?.data?.error || 'Invalid or expired token.';
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
            background: 'rgba(99,102,241,0.2)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Employee Portal</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {employee.employee_id}
            </div>
          </div>
        </div>
        <span className="badge">{employee.division.toUpperCase()} Division</span>
      </div>

      {/* Body */}
      <div className="employee-portal-body" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Sidebar */}
        <div className="employee-portal-sidebar" style={{
          width: 280, minWidth: 240, borderRight: '1px solid var(--border-color)',
          padding: '1.5rem 1rem', overflowY: 'auto',
          background: 'rgba(15,23,42,0.4)'
        }}>
          <p style={{
            fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em',
            color: 'var(--text-secondary)', textTransform: 'uppercase',
            marginBottom: '1rem', paddingLeft: '0.5rem'
          }}>
            Available Forms ({forms.length})
          </p>

          {forms.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              No forms assigned to your division yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {forms.map(form => {
                const isActive = activeForm?.id === form.id;
                return (
                  <button
                    key={form.id}
                    onClick={() => setActiveForm(form)}
                    style={{
                      width: '100%', textAlign: 'left', padding: '0.85rem 1rem',
                      borderRadius: '10px', border: 'none', cursor: 'pointer',
                      transition: 'all 0.2s ease', fontFamily: 'inherit',
                      background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
                      color: isActive ? '#a5b4fc' : 'var(--text-secondary)',
                      borderLeft: isActive ? '3px solid var(--primary-color)' : '3px solid transparent',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{form.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* iframe panel */}
        <div className="employee-portal-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {activeForm ? (
            <>
              <div style={{
                padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)',
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                background: 'rgba(15,23,42,0.3)'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="var(--primary-color)" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <span style={{ fontWeight: 600 }}>{activeForm.name}</span>
                <span className="badge" style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>
                  {employee.division}
                </span>
              </div>
              <iframe
                key={activeForm.id}
                src={getIframeUrl(activeForm.url)}
                title={activeForm.name}
                allow="camera; microphone; geolocation"
                style={{ flex: 1, width: '100%', border: 'none' }}
              />
            </>
          ) : (
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexDirection: 'column', gap: '1rem',
              color: 'var(--text-secondary)'
            }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.5" opacity="0.3">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <p style={{ fontSize: '0.95rem' }}>Select a form from the sidebar to open it</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EmployeePortal;
