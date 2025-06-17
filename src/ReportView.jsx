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
      'Transaction2KeyNumeric', 'Transaction2Number', 'MemberKeyNumeric', 'MemberFullName',
      'SourceSystemModificationTimestamp', 'ClosePrice', 'CloseDate', 'StatusCode',
      'UnitsBuyer', 'UnitsSeller', 'IsBuyerAgent', 'Percentage', 'Amount'
    ]
  },
  '24add57e-1b40-4a49-b586-ccc2dff4faad': {
    name: 'Missing Transaction BW',
    columns: [
      'BrokerWolfTransactionKeyNumeric', 'Number', 'TransactionKeyNumeric', 'TransactionNumber',
      'explanation', 'Transaction2KeyNumeric', 'Transaction2Number', 'MemberKeyNumeric',
      'MemberFullName', 'SourceSystemModificationTimestamp', 'SalesPriceVolume',
      'ActualCloseDate', 'LifecycleStatus', 'UnitsBuyer', 'UnitsSeller',
      'IsBuyerAgent', 'CoAgentPercentage', 'NCIBAS'
    ]
  },
  'd5cd1b59-6416-4c1d-a021-2d7f9342b49b': {
    name: 'Multi Trade Transaction',
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
  const [filters, setFilters] = useState({ status: [], assignee: [], transaction: "" });
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
    setFilters(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const resetFilters = () => {
    setFilters({ status: [], assignee: [], transaction: "" });
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

  return (
    <div>
      <h1>{reportTitle}</h1>
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
          <div className="react-select__control" style={{ display: 'flex', alignItems: 'center', border: '1px solid #ccc', borderRadius: '4px', padding: '6px 12px', height: '38px' }}>
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
                background: 'transparent'
              }}
            />
          </div>
        </div>
        <button onClick={resetFilters} style={{ height: '38px' }}>Reset</button>
      </div>
)}
    </div>
  );
}