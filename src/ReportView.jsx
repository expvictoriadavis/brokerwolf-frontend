import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  fetchTasks,
  fetchUsers,
  updateTaskNote,
  resolveTask,
  assignTask
} from './api';
import { useAuth } from './AuthContext';

const reportMetadata = {
  '16da88e2-2721-44ae-a0f3-5706dcde7e98': { name: 'Missing TRX', columns: [ /* ... */ ] },
  '24add57e-1b40-4a49-b586-ccc2dff4faad': { name: 'Missing BW', columns: [ /* ... */ ] },
  'd5cd1b59-6416-4c1d-a021-2d7f9342b49b': { name: 'Multi Trade', columns: [ /* ... */ ] }
};

export default function ReportView() {
  const { id } = useParams();
  const { user } = useAuth();
  const report = reportMetadata[id];
  const reportColumns = report?.columns || [];
  const reportTitle = report?.name || 'Unknown Report';

  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [newNoteText, setNewNoteText] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const tasksRes = await fetchTasks(id);
      const usersRes = await fetchUsers();
      setTasks(tasksRes.tasks || []);
      setUsers(usersRes || []);
      setLoading(false);
    };
    loadData();
  }, [id]);

  const openNoteModal = (task) => {
    setActiveTask(task);
    setNewNoteText('');
    setShowNoteModal(true);
  };

  const saveNoteToTask = async () => {
    if (!newNoteText.trim()) return;
    const note = {
      user: user?.email || 'anonymous',
      timestamp: new Date().toISOString(),
      message: newNoteText.trim()
    };
    await updateTaskNote(activeTask.id, note);
    setTasks(prev =>
      prev.map(t =>
        t.id === activeTask.id
          ? {
              ...t,
              notes: parseNotesToArray(t.notes).concat(note)
            }
          : t
      )
    );
    setShowNoteModal(false);
  };

  const parseNotesToArray = (notes) => {
    if (Array.isArray(notes)) return notes;
    try {
      return JSON.parse(notes || '[]');
    } catch {
      return [];
    }
  };

  const handleResolve = async (taskId) => {
    await resolveTask(taskId);
    setTasks(prev =>
      prev.map(t => t.id === taskId ? { ...t, resolved: true } : t)
    );
  };

  const handleAssign = async (taskId, assigneeId) => {
    await assignTask(taskId, assigneeId);
    setTasks(prev =>
      prev.map(t =>
        t.id === taskId
          ? { ...t, assignee_id: assigneeId, assigned_at: new Date().toISOString() }
          : t
      )
    );
  };

  return (
    <div>
      <h1>{reportTitle}</h1>
      {loading && <p>Loading...</p>}
      {!loading && (
        <table className="task-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Note</th>
              <th>Assignee</th>
              <th>Assigned At</th>
              <th>Action</th>
              {reportColumns.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <tr key={task.id}>
                  <td style={{ color: task.resolved ? 'green' : 'orange', fontWeight: 'bold' }}>
                    {task.resolved ? 'resolved' : 'open'}
                  </td>
                  <td>
                    <button onClick={() => openNoteModal(task)}>Add Note</button>
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
                  {reportColumns.map((col) => (
                    <td key={col}>{task.data_row?.[col] ?? '—'}</td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={reportColumns.length + 5}>No tasks available for this report.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {showNoteModal && activeTask && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>📝 Notes</h3>
            {parseNotesToArray(activeTask.notes).map((note, idx) => (
              <div key={idx} className="note-entry">
                <strong>{note.user}</strong> — {new Date(note.timestamp).toLocaleString()}
                <div>{note.message}</div>
              </div>
            ))}
            <textarea
              placeholder="Add a note..."
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
            />
            <div className="modal-actions">
              <button onClick={() => setShowNoteModal(false)}>Close</button>
              <button onClick={saveNoteToTask}>Save Note</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
