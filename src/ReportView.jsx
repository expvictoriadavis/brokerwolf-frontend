import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Select from 'react-select';
import {
  fetchTasks,
  fetchUsers,
  addTaskNote,
  fetchTaskNotes,
  resolveTask,
  assignTask
} from './api';
import { useAuth } from './AuthContext';

const reportMetadata = {
  '16da88e2-2721-44ae-a0f3-5706dcde7e98': {
    name: 'Missing Transaction TRX',
    columns: [
      'BrokerWolfTransactionKeyNumeric', 'Number', 'TransactionKeyNumeric', 'TransactionNumber',
      'SourceColumn', 'MemberKeyNumeric', 'MemberFullName',
      'SourceSystemModificationTimestamp', 'ClosePrice', 'CloseDate', 'StatusCode',
      'UnitsBuyer', 'UnitsSeller', 'IsBuyerAgent', 'Percentage', 'Amount'
    ]
  },
  '24add57e-1b40-4a49-b586-ccc2dff4faad': {
    name: 'Missing Transaction BW',
    columns: [
      'BrokerWolfTransactionKeyNumeric', 'Number', 'TransactionKeyNumeric', 'TransactionNumber', 'SourceColumn', 'MemberKeyNumeric',
      'MemberFullName', 'SourceSystemModificationTimestamp', 'SalesPriceVolume',
      'ActualCloseDate', 'LifecycleStatus', 'UnitsBuyer', 'UnitsSeller',
      'IsBuyerAgent', 'CoAgentPercentage', 'NCIBAS'
    ]
  },
  'abc12345-duplicate-or-missing-transactions': {
    name: 'Duplicate or Missing Transactions',
    columns: [
      'ExceptionType',
      'BrokerWolfTransactionKeyNumeric',
      'Number',
      'TransactionNumber',
      'Transaction2Number',
      'TransactionKeyNumeric',
      'Transaction2KeyNumeric',
      'ListingId',
      'StreetNumber',
      'StreetName',
      'City',
      'StateOrProvince',
      'ClosePrice',
      'CloseDate',
      'StatusCode',
      'SourceSystemBrokerWolfTransactionKey'
    ]
  },
  'd5cd1b59-6416-4c1d-a021-2d7f9342b49b': {
    name: 'Multi Trade Transaction',
    columns: [
      'BrokerWolfTransactionKeyNumeric', 'Number', 'MemberKeyNumeric',
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
  const [filters, setFilters] = useState({
    status: ['open', 'in progress'],
    assignee: [],
    transaction: ''
  });
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

  const handleFilterChange = (type, value) => {
    setFilters(prev => ({ ...prev, [type]: value }));
  };

  const resetFilters = () => {
    setFilters({
      status: ['open', 'in progress'],
      assignee: [],
      transaction: ''
    });
  };

  const statusOptions = [
    { value: 'open', label: 'Open' },
    { value: 'in progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' }
  ];

  const assigneeOptions = users.map(u => ({
    value: u.id,
    label: u.name || u.email
  }));

  const applyFilters = (taskList) => {
    return taskList.filter(t => {
      const status = getStatus(t);
      const assignee = t.assignee_id;
      const transactionNumber = t.data_row?.TransactionNumber ?? "";

      const matchesStatus = filters.status.length === 0 || filters.status.includes(status);
      const matchesAssignee = filters.assignee.length === 0 || filters.assignee.includes(assignee);
      const matchesTransaction = String(transactionNumber).toLowerCase().includes(String(filters.transaction).toLowerCase());

      return matchesStatus && matchesAssignee && matchesTransaction;
    });
  };

  const handleAssign = async (taskId, assigneeId) => {
    try {
      await assignTask(taskId, assigneeId);
      setTasks(prev =>
        prev.map(t =>
          t.id === taskId
            ? {
                ...t,
                assignee_id: assigneeId || null,
                assigned_at: assigneeId ? new Date().toISOString() : null
              }
            : t
        )
      );
    } catch (err) {
      alert("Assign failed: " + err.message);
    }
  };

  const openTimeModal = (task) => {
    setTimeTask(task);
    setShowTimeModal(true);
  };

  const openNoteModal = async (task) => {
    setActiveTask(task);
    setNewNoteText('');
    const notesData = await fetchTaskNotes(task.id);
    setActiveTask(prev => ({ ...prev, notes: notesData }));
    setShowNoteModal(true);
  };

  const saveNoteToTask = async () => {
    if (!newNoteText.trim()) return;

    const note = {
      user: user?.email || 'anonymous',
      timestamp: new Date().toISOString(),
      message: newNoteText.trim()
    };

    await addTaskNote(activeTask.id, note);

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

  const filteredTasks = applyFilters(tasks).sort((a, b) => {
    const dateA = new Date(a.created_at);
    const dateB = new Date(b.created_at);
    return sortByDate === 'asc' ? dateA - dateB : dateB - dateA;
  });

  const getDuration = (start, end) => {
    if (!start || !end) return '—';
    const diff = new Date(end) - new Date(start);
    const days = diff / (1000 * 60 * 60 * 24);
    return `${days.toFixed(1)} days`;
  };

  const formatTimestamp = (timestamp) =>
    timestamp
      ? new Date(timestamp).toLocaleString('en-US', {
          year: '2-digit',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        })
      : '—';

  return (
    <div>
      <h1>{reportTitle}</h1>

      {/* Filters */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", alignItems: "flex-end" }}>
        <div style={{ minWidth: "200px" }}>
          <label>Status:</label>
          <Select
            options={statusOptions}
            isMulti
            menuPortalTarget={document.body}
            styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
            value={statusOptions.filter(opt => filters.status.includes(opt.value))}
            onChange={(selected) => handleFilterChange("status", selected.map(s => s.value))}
          />
        </div>
        <div style={{ minWidth: "250px" }}>
          <label>Assignee:</label>
          <Select
            options={assigneeOptions}
            isMulti
            menuPortalTarget={document.body}
            styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
            value={assigneeOptions.filter(opt => filters.assignee.includes(opt.value))}
            onChange={(selected) => handleFilterChange("assignee", selected.map(s => s.value))}
          />
        </div>
        <div style={{ minWidth: "250px" }}>
          <label>Transaction Number:</label>
          <div className="react-select__control" style={{
            display: 'flex',
            alignItems: 'center',
            border: '1px solid #ccc',
            borderRadius: '4px',
            padding: '6px 12px',
            height: '38px'
          }}>
            <input
              type="text"
              placeholder="Search..."
              value={filters.transaction}
              onChange={(e) => handleFilterChange("transaction", e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                width: '100%',
                fontSize: '14px',
                background: 'transparent',
                height: '100%'
              }}
            />
          </div>
        </div>
        <button onClick={resetFilters} style={{ height: '38px' }}>Reset</button>
      </div>

      {/* Table */}
      {!loading && (
        <table className="task-table">
          <thead>
            <tr>
              <th>Created</th>
              <th>Status</th>
              <th>Assignee</th>
              <th>Notes</th>
              <th>Actions</th>
              {reportColumns.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map(task => (
              <tr key={task.id}>
                <td>{task.created_at ? new Date(task.created_at).toLocaleDateString() : '—'}</td>
                <td>{getStatus(task)}</td>
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
                <td><button onClick={() => openNoteModal(task)}>View</button></td>
                <td>
                  <button onClick={() => openTimeModal(task)}>Time</button>
                  {!task.resolved && (
                    <button
                      onClick={async () => {
                        try {
                          await resolveTask(task.id);
                          setTasks(prev =>
                            prev.map(t =>
                              t.id === task.id
                                ? { ...t, resolved: true, resolved_at: new Date().toISOString() }
                                : t
                            )
                          );
                          alert("Task marked as resolved!");
                        } catch (err) {
                          alert("Failed to resolve task: " + err.message);
                        }
                      }}
                    >
                      Resolve
                    </button>
                  )}
                </td>

                {reportColumns.map((col) => {
                  let value = task.data_row?.[col];
                  if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T/)) {
                    value = new Date(value).toLocaleDateString();
                  }
                  return <td key={col}>{value ?? '—'}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Time Modal */}
      {showTimeModal && timeTask && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Time Metrics</h3>
            <p><strong>Created:</strong> {formatTimestamp(timeTask.created_at)}</p>
            <p><strong>Assigned:</strong> {formatTimestamp(timeTask.assigned_at)}</p>
            <p><strong>Resolved:</strong> {formatTimestamp(timeTask.resolved_at)}</p>
            <p><strong>Total Duration:</strong> {getDuration(timeTask.created_at, timeTask.resolved_at)}</p>
            <button onClick={() => setShowTimeModal(false)}>Close</button>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {showNoteModal && activeTask && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Notes</h3>
            <ul>
              {(activeTask.notes || []).map((note, index) => (
                <li key={index}>
                  <strong>{note.user}</strong> – {new Date(note.timestamp).toLocaleString()}
                  <div>{note.message}</div>
                </li>
              ))}
            </ul>
            <textarea
              placeholder="Add a note..."
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              rows={4}
              style={{ width: '100%', marginTop: '1rem' }}
            />
            <div className="modal-actions">
              <button onClick={saveNoteToTask}>Save</button>
              <button onClick={() => setShowNoteModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
