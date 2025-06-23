import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import './styles.css';
import { AuthProvider, useAuth } from './AuthContext.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import LoginPage from './LoginPage.jsx';
import ReportView from './ReportView.jsx';
import Dashboard from './Dashboard.jsx';
import UserApproval from './UserApproval.jsx';


function Layout({ children }) {
  const { logout, user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`layout ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className="sidebar">
        <button className="collapse-toggle" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? '→' : '←'}
        </button>
        {!collapsed && (
          <>
            <h2>Broker Wolf</h2>
            <nav className="sidebar-nav">
              <Link className="nav-link" to="/dashboard">📊 Dashboard</Link>
              <Link className="nav-link" to="/report/16da88e2-2721-44ae-a0f3-5706dcde7e98">Missing Transactions - TRX</Link>
              <Link className="nav-link" to="/report/24add57e-1b40-4a49-b586-ccc2dff4faad">Missing Transactions - BW</Link>
              <Link className="nav-link" to="/report/d5cd1b59-6416-4c1d-a021-2d7f9342b49b">Multi Trade</Link>
	      <Link className="nav-link" to="/report/abc12345-duplicate-or-missing-transactions">Duplicate or Missing Transactions</Link>
              {user?.email === 'victoria.davis@exprealty.net' && (
                <Link className="nav-link" to="/approve-users">🛡️ Approvals</Link>
              )}
            </nav>
            <button onClick={logout} className="logout-button">Logout</button>
          </>
        )}
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/report/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <ReportView />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/approve-users"
            element={
              <ProtectedRoute>
                <Layout>
                  <UserApproval />
                </Layout>
              </ProtectedRoute>
            }
          />
          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}