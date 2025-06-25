import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { approveUser } from './api';

export default function UserApproval() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/users/all").then(r => r.json());
      setUsers(res || []);
    } catch (err) {
      console.error("Error loading users", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleApprove = async (email) => {
    setProcessing(email);
    try {
      await approveUser(email);
      await loadUsers();
    } catch (err) {
      alert("Approval failed");
      console.error(err);
    } finally {
      setProcessing(null);
    }
  };

  const handleReset = async (email) => {
    if (!window.confirm(`Reset password for ${email}? They will need to recreate their login.`)) return;
    setProcessing(email);
    try {
      const res = await fetch('/users/reset_password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        alert(`${email} reset. They can now recreate their login.`);
        await loadUsers();
      } else {
        alert("Reset failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Reset failed.");
    } finally {
      setProcessing(null);
    }
  };

  if (!user || user.email !== "victoria.davis@exprealty.net") {
    return <p>Access denied.</p>;
  }

  return (
    <div>
      <h2>User Management</h2>
      {loading ? (
        <p>Loading users...</p>
      ) : users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <table className="task-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Status</th>
              <th>Requested</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.email}>
                <td>{u.email}</td>
                <td>{u.approved ? "Approved" : "Pending"}</td>
                <td>{u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}</td>
                <td>
                  {!u.approved ? (
                    <button
                      onClick={() => handleApprove(u.email)}
                      disabled={processing === u.email}
                    >
                      {processing === u.email ? "Approving..." : "Approve"}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleReset(u.email)}
                      disabled={processing === u.email}
                      style={{ color: 'red' }}
                    >
                      {processing === u.email ? "Resetting..." : "Reset Password"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
