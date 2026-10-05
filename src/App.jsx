import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminPanel from './AdminPanel';
import AdminLogin from './AdminLogin';
import EmployeePortal from './EmployeePortal';
import './index.css';

// Main Application Component - Triggering fresh build
function App() {
  useEffect(() => {
    // 1. Disable Right-Click Context Menu
    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    // 2. Disable Keyboard Shortcuts (Print, Save, Copy, DevTools, View Source, PrintScreen)
    const handleKeyDown = (e) => {
      // Disable PrintScreen key
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        e.preventDefault();
        try {
          navigator.clipboard.writeText('');
        } catch (_) {}
      }

      // Disable Ctrl+P / Cmd+P (Print)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
      }

      // Disable Ctrl+S / Cmd+S (Save)
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
      }

      // Disable Ctrl+U / Cmd+U (View Source)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
      }

      // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (DevTools)
      if (
        e.key === 'F12' ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c'))
      ) {
        e.preventDefault();
      }
    };

    // 3. Disable Copy & Dragging
    const handleCopy = (e) => e.preventDefault();
    const handleDrag = (e) => e.preventDefault();

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('dragstart', handleDrag);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('dragstart', handleDrag);
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/login" replace />} />

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
