
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
  const [sortByDate, setSortByDate] = useState('desc');
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [timeTask, setTimeTask] = useState(null);

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

  const toggleSortByDate = () => {
    setSortByDate(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const filteredTasks = tasks.sort((a, b) => {
    const dateA = new Date(a.imported_at);
    const dateB = new Date(b.imported_at);
    return sortByDate === 'asc' ? dateA - dateB : dateB - dateA;
  });

  const openTimeModal = (task) => {
    setTimeTask(task);
    setShowTimeModal(true);
  };

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
                  <td><button>Add Note</button></td>
                  <td>{task.assignee_id || 'Unassigned'}</td>
                  <td>{task.assigned_at?.split('T')[0] || '—'}</td>
                  <td><button>✔️</button></td>
                  <td><button onClick={() => openTimeModal(task)}>View</button></td>
                  <td>{new Date(task.imported_at).toLocaleDateString()}</td>
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
