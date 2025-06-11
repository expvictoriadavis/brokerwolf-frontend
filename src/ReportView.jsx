import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchTasks, fetchUsers, updateTaskNote, resolveTask, assignTask } from './api';
import { useAuth } from './AuthContext';

const reportTitles = {
  '16da88e2-2721-44ae-a0f3-5706dcde7e98': 'Missing TRX',
  '24add57e-1b40-4a49-b586-ccc2dff4faad': 'Missing BW',
  'd5cd1b59-6416-4c1d-a021-2d7f9342b49b': 'Multi Trade',
};

export default function ReportView() {
  const { id } = useParams();
  const { user } = useAuth();
  const reportTitle = reportTitles[id] || 'Unknown Report';

  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noteUpdates, setNoteUpdates] = useState({});

  useEffect(() => {
    fetchTasks(id).then(data => setTasks(data.tasks || [])).finally(() => setLoading(false));
    fetchUsers().then(setUsers);
  }, [id]);

  const handleNoteChange = (taskId, text) => {
    setNoteUpdates(prev => ({ ...prev, [taskId]: text }));
  };

  const handleSaveNote = async (taskId) => {
    const message = noteUpdates[taskId]?.trim();
    if (!message) return;

    const note = {
      user: user?.username || 'anonymous',
      timestamp: new Date().toISOString(),
      message,
    };
    await updateTaskNote(taskId, note);
    setNoteUpdates(prev => ({ ...prev, [taskId]: '' }));
  };

  const handleResolve = async (taskId) => {
    await resolveTask(taskId);
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'resolved' } : t));
  };

  const handleAssign = async (taskId, assigneeId) => {
    await assignTask(taskId, assigneeId);
    setTasks(prev => prev.map(t => t.id === taskId ? {
      ...t,
      assignee_id: assigneeId,
      assigned_at: new Date().toISOString(),
    } : t));
  };

  return (
    <div>
      <h1>{reportTitle}</h1>
      {loading && <p>Loading...</p>}
      <table className="task-table">
        <thead>
          <tr>
            <th>Agent</th>
            <th>Status</th>
            <th>Note</th>
            <th>Assignee</th>
            <th>Assigned At</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map(task => (
            <tr key={task.id}>
              <td>{task.data_row?.MemberFullName || '—'}</td>
              <td>{task.status}</td>
              <td>
                <input
                  value={noteUpdates[task.id] || ''}
                  onChange={e => handleNoteChange(task.id, e.target.value)}
                  placeholder="Add note"
                />
                <button onClick={() => handleSaveNote(task.id)}>💾</button>
              </td>
              <td>
                <select
                  value={task.assignee_id || ''}
                  onChange={(e) => handleAssign(task.id, e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name || u.email}</option>
                  ))}
                </select>
              </td>
              <td>{task.assigned_at?.split('T')[0] || '—'}</td>
              <td>
                <button onClick={() => handleResolve(task.id)}>✔️ Resolve</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

