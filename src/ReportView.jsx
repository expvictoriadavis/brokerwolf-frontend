import React, { useEffect, useState, useRef } from 'react';
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

  const [selectedAssignees, setSelectedAssignees] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [transactionFilter, setTransactionFilter] = useState('');

  const [assigneeDropdownOpen, setAssigneeDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const assigneeRef = useRef();
  const statusRef = useRef();

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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!assigneeRef.current?.contains(e.target)) setAssigneeDropdownOpen(false);
      if (!statusRef.current?.contains(e.target)) setStatusDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getStatus = (task) => {
    if (task.resolved) return 'resolved';
    if (task.assignee_id) return 'in progress';
    return 'open';
  };

  const filteredTasks = tasks.filter((task) => {
    const status = getStatus(task);
    const matchesTransaction = transactionFilter
      ? (task.data_row?.TransactionNumber || '').toString().includes(transactionFilter)
      : true;
    const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(status);
    const matchesAssignee = selectedAssignees.length === 0 || selectedAssignees.includes(task.assignee_id);
    return matchesTransaction && matchesStatus && matchesAssignee;
  });

  const toggleSelection = (value, list, setList) => {
    setList((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  return (
    <div>
      <h1>{reportTitle}</h1>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '1em' }}>
        {/* Assignee Filter */}
        <div className="dropdown-container" ref={assigneeRef}>
          <div className="dropdown-header" onClick={() => setAssigneeDropdownOpen(prev => !prev)}>
            Assignee ▼
          </div>
          {assigneeDropdownOpen && (
            <div className="dropdown-menu">
              {users.map((u) => (
                <label key={u.id}>
                  <input
                    type="checkbox"
                    checked={selectedAssignees.includes(u.id)}
                    onChange={() => toggleSelection(u.id, selectedAssignees, setSelectedAssignees)}
                  />
                  {u.name || u.email}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Status Filter */}
        <div className="dropdown-container" ref={statusRef}>
          <div className="dropdown-header" onClick={() => setStatusDropdownOpen(prev => !prev)}>
            Status ▼
          </div>
          {statusDropdownOpen && (
            <div className="dropdown-menu">
              {['open', 'in progress', 'resolved'].map((status) => (
                <label key={status}>
                  <input
                    type="checkbox"
                    checked={selectedStatuses.includes(status)}
                    onChange={() => toggleSelection(status, selectedStatuses, setSelectedStatuses)}
                  />
                  {status}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Transaction Number */}
        <div>
          <label>Transaction #</label><br />
          <input
            type="text"
            placeholder="Search..."
            value={transactionFilter}
            onChange={(e) => setTransactionFilter(e.target.value)}
          />
        </div>
      </div>

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
                  <td><button>Add Note</button></td>
                  <td>{task.assignee_id || 'Unassigned'}</td>
                  <td>{task.assigned_at?.split('T')[0] || '—'}</td>
                  <td><button>✔️</button></td>
                  {reportColumns.map((col) => (
                    <td key={col}>{task.data_row?.[col] ?? '—'}</td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={reportColumns.length + 5}>No matching tasks</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
