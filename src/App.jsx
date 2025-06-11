import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './styles.css';
import { AuthProvider, useAuth } from './AuthContext.jsx';
import ProtectedRoute from './ProtectedRoute';
import LoginPage from './LoginPage';
import ReportView from './ReportView'; // You’ll rename your current task display component to this
import Dashboard from './Dashboard';   // We'll add this next

function Layout({ children }) {
  const { logout } = useAuth();
  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>Broker Wolf</h2>
        <nav>
          <a href="/report/1">Missing TRX</a>
          <a href="/report/2">Missing BW</a>
          <a href="/report/3">Multi Trade</a>
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
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

