import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminPanel from './AdminPanel';
import AdminLogin from './AdminLogin';
import EmployeePortal from './EmployeePortal';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Admin routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminPanel />} />

        {/* Employee route: /auth?data=<base64_employee_id> */}
        <Route path="/auth" element={<EmployeePortal />} />

        {/* Catch-all */}
        <Route path="*" element={
          <div className="login-container">
            <div className="glass-panel login-box">
              <div className="login-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <h2>Access Required</h2>
              <div style={{ color: 'red', marginTop: '1rem', fontSize: '1rem', background: '#222', padding: '10px' }}>
                <p>Debug Path: {window.location.pathname}</p>
                <p>Debug Search: {window.location.search}</p>
              </div>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.75rem', fontSize: '0.9rem' }}>
                Please use the secure link provided to you by your administrator.
              </p>
            </div>
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;
