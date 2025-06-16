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
      'BrokerWolfTransactionKeyNumeric',
      'Number',
      'TransactionKeyNumeric',
      'TransactionNumber',
      'Transaction2KeyNumeric',
      'Transaction2Number',
      'MemberKeyNumeric',
      'MemberFullName',
      'SourceSystemModificationTimestamp',
      'ClosePrice',
      'CloseDate',
      'StatusCode',
      'UnitsBuyer',
      'UnitsSeller',
      'IsBuyerAgent',
      'Percentage',
      'Amount'
    ]
  },
  '24add57e-1b40-4a49-b586-ccc2dff4faad': {
    name: 'Missing BW',
    columns: [
      'BrokerWolfTransactionKeyNumeric',
      'Number',
      'TransactionKeyNumeric',
      'TransactionNumber',
      'explanation',
      'Transaction2KeyNumeric',
      'Transaction2Number',
      'MemberKeyNumeric',
      'MemberFullName',
      'SourceSystemModificationTimestamp',
      'SalesPriceVolume',
      'ActualCloseDate',
      'LifecycleStatus',
      'UnitsBuyer',
      'UnitsSeller',
      'IsBuyerAgent',
      'CoAgentPercentage',
      'NCIBAS'
    ]
  },
  'd5cd1b59-6416-4c1d-a021-2d7f9342b49b': {
    name: 'Multi Trade',
    columns: [
      'BrokerWolfTransactionKeyNumeric',
      'Number',
      'ErrorType',
      'MemberKeyNumeric',
      'MemberFullName',
      'SourceSystemModificationTimestamp',
      'ClosePrice',
      'CloseDate',
      'StatusCode',
      'Subtrade',
      'UnitsBuyer',
      'UnitsSeller',
      'IsBuyerAgent',
      'Percentage',
      'Amount'
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

  const [showNoteModal, setShowNoteModal] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [newNoteText, setNewNoteText] = useState('');

  const [showTimeModal, setShowTimeModal] = useState(false);
  const [timeTask, setTimeTask] = useState(null);

  const [selectedAssignees, setSelectedAssignees] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [transactionFilter, setTransactionFilter] = useState('');

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

  const getDurationInDays = (start, end) => {
    if (!start || !end) return '—';
    const diff = (new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24);
    return `${diff.toFixed(1)} days`;
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
          ? { ...t, notes: parseNotesToArray(t.notes).concat(note) }
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
      prev.map(t => t.id === taskId ? { ...t, resolved: true, resolved_at: new Date().toISOString() } : t)
    );
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

  const filteredTasks = tasks.filter(task => {
    const status = getStatus(task);
    const transactionMatch = transactionFilter.trim()
      ? (task.data_row?.TransactionNumber || '').toString().includes(transactionFilter.trim())
      : true;
    const assigneeMatch = selectedAssignees.length === 0 || selectedAssignees.includes(task.assignee_id);
    const statusMatch = selectedStatuses.length === 0 || selectedStatuses.includes(status);
    return transactionMatch && assigneeMatch && statusMatch;
  });

  return (
    <div>
      <h1>{reportTitle}</h1>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '1em' }}>
        <div>
          <label>Assignees:</label><br />
          <select multiple value={selectedAssignees} onChange={(e) => {
            const values = Array.from(e.target.selectedOptions, opt => opt.value);
            setSelectedAssignees(values);
          }}>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name || u.email}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Status:</label><br />
          <select multiple value={selectedStatuses} onChange={(e) => {
            const values = Array.from(e.target.selectedOptions, opt => opt.value);
            setSelectedStatuses(values);
          }}>
            <option value="open">Open</option>
            <option value="in progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
        <div>
          <label>Transaction Number:</label><br />
          <input
            type="text"
            value={transactionFilter}
            onChange={e => setTransactionFilter(e.target.value)}
            placeholder="Search..."
          />
        </div>
      </div>

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
              <th>Time Metrics</th>
              {reportColumns.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task) => (
                <tr key={task.id}>
                  <td style={{ color: task.resolved ? 'green' : 'orange', fontWeight: 'bold' }}>
                    {getStatus(task)}
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
                  <td>
                    <button onClick={() => openTimeModal(task)}>View</button>
                  </td>
                  {reportColumns.map((col) => (
                    <td key={col}>{task.data_row?.[col] ?? '—'}</td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={reportColumns.length + 6}>No matching tasks.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {/* Note Modal */}
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

      {/* Time Metrics Modal */}
      {showTimeModal && timeTask && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>⏱ Time Metrics</h3>
            <ul>
              <li><strong>Time Open:</strong> {getDurationInDays(timeTask.imported_at, timeTask.assigned_at || timeTask.resolved_at)}</li>
              <li><strong>Time Assigned:</strong> {getDurationInDays(timeTask.assigned_at, timeTask.resolved_at)}</li>
              <li><strong>Total Time to Resolve:</strong> {getDurationInDays(timeTask.imported_at, timeTask.resolved_at)}</li>
            </ul>
            <div className="modal-actions">
              <button onClick={() => setShowTimeModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
