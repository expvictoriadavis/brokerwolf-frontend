import React, { useEffect, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function UserApproval() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [approving, setApproving] = useState(null);

  const loadPending = async () => {
    const res = await fetch(`${API_BASE_URL}/users/pending`);
    const data = await res.json();
    setPendingUsers(data || []);
  };

  const handleApprove = async (email) => {
    setApproving(email);
    await fetch(`${API_BASE_URL}/users/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    await loadPending();
    setApproving(null);
  };

  useEffect(() => {
    loadPending();
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Pending User Approvals</h2>
      {pendingUsers.length === 0 ? (
        <p>No users awaiting approval.</p>
      ) : (
        <table border="1" cellPadding="10">
          <thead>
            <tr>
              <th>Email</th>
              <th>Requested At</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {pendingUsers.map(user => (
              <tr key={user.id}>
                <td>{user.email}</td>
                <td>{new Date(user.created_at).toLocaleString()}</td>
                <td>
                  <button
                    onClick={() => handleApprove(user.email)}
                    disabled={approving === user.email}
                  >
                    {approving === user.email ? 'Approving...' : 'Approve'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
