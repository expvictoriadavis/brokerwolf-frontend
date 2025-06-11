import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import './styles.css';
import { AuthProvider, useAuth } from './AuthContext.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import LoginPage from './LoginPage.jsx';
import ReportView from './ReportView.jsx';
import Dashboard from './Dashboard.jsx';

function Layout({ children }) {
  const { logout } = useAuth();

  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>Broker Wolf</h2>
        <nav className="sidebar-nav">
          <Link to="/dashboard">📊 Dashboard</Link>
          <Link to="/report/16da88e2-2721-44ae-a0f3-5706dcde7e98">Missing TRX</Link>
          <Link to="/report/24add57e-1b40-4a49-b586-ccc2dff4faad">Missing BW</Link>
          <Link to="/report/d5cd1b59-6416-4c1d-a021-2d7f9342b49b">Multi Trade</Link>
        </nav>
        <button onClick={logout} className="logout-button">Logout</button>
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
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout><Dashboard /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/report/:id" element={
            <ProtectedRoute>
              <Layout><ReportView /></Layout>
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
