import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { fetchPendingUsers, approveUser } from './api';

export default function UserApproval() {
  const { user } = useAuth();
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchPendingUsers();
        setPending(data.users || []);
      } catch (err) {
        console.error("Error loading pending users", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleApprove = async (email) => {
    setApproving(email);
    try {
      await approveUser(email);
      setPending(prev => prev.filter(u => u.email !== email));
    } catch (err) {
      alert("Approval failed");
      console.error(err);
    } finally {
      setApproving(null);
    }
  };

  if (!user || user.email !== "victoria.davis@exprealty.net") {
    return <p>Access denied.</p>;
  }

  return (
    <div>
      <h2>Pending User Approvals</h2>
      {loading ? (
        <p>Loading users...</p>
      ) : pending.length === 0 ? (
        <p>No users pending approval.</p>
      ) : (
        <ul>
          {pending.map((u) => (
            <li key={u.email}>
              {u.email}
              <button
                style={{ marginLeft: "10px" }}
                onClick={() => handleApprove(u.email)}
                disabled={approving === u.email}
              >
                {approving === u.email ? "Approving..." : "Approve"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
