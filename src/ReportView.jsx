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
  '16da88e2-2721-44ae-a0f3-5706dcde7e98': {
    name: 'Missing TRX',
    columns: [
      'BrokerWolfTransactionKeyNumeric', 'Number', 'TransactionKeyNumeric', 'TransactionNumber',
      'Transaction2KeyNumeric', 'Transaction2Number', 'MemberKeyNumeric', 'MemberFullName',
      'SourceSystemModificationTimestamp', 'ClosePrice', 'CloseDate', 'StatusCode',
      'UnitsBuyer', 'UnitsSeller', 'IsBuyerAgent', 'Percentage', 'Amount'
    ]
  },
  '24add57e-1b40-4a49-b586-ccc2dff4faad': {
    name: 'Missing BW',
    columns: [
      'BrokerWolfTransactionKeyNumeric', 'Number', 'TransactionKeyNumeric', 'TransactionNumber',
      'explanation', 'Transaction2KeyNumeric', 'Transaction2Number', 'MemberKeyNumeric',
      'MemberFullName', 'SourceSystemModificationTimestamp', 'SalesPriceVolume',
      'ActualCloseDate', 'LifecycleStatus', 'UnitsBuyer', 'UnitsSeller',
      'IsBuyerAgent', 'CoAgentPercentage', 'NCIBAS'
    ]
  },
  'd5cd1b59-6416-4c1d-a021-2d7f9342b49b': {
    name: 'Multi Trade',
    columns: [
      'BrokerWolfTransactionKeyNumeric', 'Number', 'ErrorType', 'MemberKeyNumeric',
      'MemberFullName', 'SourceSystemModificationTimestamp', 'ClosePrice', 'CloseDate',
      'StatusCode', 'Subtrade', 'UnitsBuyer', 'UnitsSeller', 'IsBuyerAgent',
      'Percentage', 'Amount'
    ]
  }
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
  const [sortByDate, setSortByDate] = useState('desc');
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [timeTask, setTimeTask] = useState(null);
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

  const getStatus = (task) => {
    if (task.resolved) return 'resolved';
    if (task.assignee_id) return 'in progress';
    return 'open';
  };

  const getDuration = (start, end) => {
    if (!start || !end) return '—';
    const diff = new Date(end) - new Date(start);
    return `${(diff / (1000 * 60 * 60 * 24)).toFixed(1)} days`;
  };

  const toggleSortByDate = () => {
    setSortByDate(prev => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const handleAssign = async (taskId, assigneeId) => {
    await assignTask(taskId, assigneeId);
    setTasks(prev =>
      prev.map(t =>
        t.id === taskId
          ? {
              ...t,
              assignee_id: assigneeId,
              assigned_at: assigneeId ? new Date().toISOString() : null
            }
          : t
      )
    );
  };

  const openTimeModal = (task) => {
    setTimeTask(task);
    setShowTimeModal(true);
  };

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
          ? { ...t, notes: [...(t.notes || []), note] }
          : t
      )
    );

    setShowNoteModal(false);
    setNewNoteText('');
  };

  const filteredTasks = tasks.sort((a, b) => {
    const dateA = new Date(a.created_at);
    const dateB = new Date(b.created_at);
    return sortByDate === 'asc' ? dateA - dateB : dateB - dateA;
  });

  return (
    <div>
      <h1>{reportTitle}</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="task-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Note</th>
              <th>Assignee</th>
              <th>Assigned At</th>
              <th>Action</th>
              <th>Time Metrics</th>
              <th style={{ cursor: 'pointer' }} onClick={toggleSortByDate}>
                Created Date {sortByDate === 'asc' ? '↑' : '↓'}
              </th>
              {reportColumns.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task) => (
                <tr key={task.id}>
                  <td>{getStatus(task)}</td>
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
                  <td><button onClick={() => resolveTask(task.id)}>✔️ Resolve</button></td>
                  <td><button onClick={() => openTimeModal(task)}>View</button></td>
                  <td>
                    {task.created_at
                      ? new Date(task.created_at).toLocaleString('en-US', {
                          month: '2-digit',
                          day: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false
                        })
                      : '—'}
                  </td>
                  {reportColumns.map((col) => (
                    <td key={col}>{task.data_row?.[col] ?? '—'}</td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={reportColumns.length + 7}>No matching tasks</td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {/* Time Metrics Modal */}
      {showTimeModal && timeTask && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '600px', padding: '20px' }}>
            <h3>⏱ Time Metrics</h3>
            <ul>
              <li><strong>Created → Assigned:</strong> {getDuration(timeTask.created_at, timeTask.assigned_at)}</li>
              <li><strong>Assigned → Resolved:</strong> {getDuration(timeTask.assigned_at, timeTask.resolved_at)}</li>
              <li><strong>Created → Resolved:</strong> {getDuration(timeTask.created_at, timeTask.resolved_at)}</li>
            </ul>
            <div className="modal-actions">
              <button onClick={() => setShowTimeModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Notes Modal */}
      {showNoteModal && activeTask && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '600px', padding: '20px' }}>
            <h3>📝 Notes</h3>

            {Array.isArray(activeTask.notes) && activeTask.notes.length > 0 ? (
              <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem' }}>
                {activeTask.notes.map((note, index) => (
                  <div key={index} style={{ backgroundColor: '#f1f1f1', padding: '10px', marginBottom: '8px', borderRadius: '5px' }}>
                    <strong>{note.user || 'anonymous'}</strong> —{' '}
                    {note.timestamp
                      ? new Date(note.timestamp).toLocaleString()
                      : 'No timestamp'}
                    <div>{note.message}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No notes yet.</p>
            )}

            <textarea
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              placeholder="Add a note..."
              rows={4}
              style={{ width: '100%', padding: '8px' }}
            />
            <div className="modal-actions" style={{ marginTop: '1rem' }}>
              <button onClick={() => setShowNoteModal(false)}>Close</button>
              <button onClick={saveNoteToTask} style={{ marginLeft: '10px' }}>Save Note</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
