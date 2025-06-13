import React, { useEffect, useState } from 'react';
import api from '../api';
import FilterPanel from '../components/FilterPanel';

export default function ReportTasks({ reportId }) {
  const [filters, setFilters] = useState({});
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const fetchTasks = async () => {
      const params = { ...filters };
      if (Array.isArray(params.status)) {
        params.status = [...params.status]; // ensures multiple query entries
      }
      const res = await api.get(`/report/${reportId}/tasks`, { params });
      setTasks(res.data.tasks);
    };

    fetchTasks();
  }, [filters]);

  return (
    <div className="p-4">
      <FilterPanel filters={filters} setFilters={setFilters} />
      <table className="mt-4 w-full border">
        <thead>
          <tr>
            <th>Status</th>
            <th>Assignee</th>
            <th>Agent</th>
            <th>Imported</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map(task => (
            <tr key={task.id}>
              <td>{task.status}</td>
              <td>{task.assignee_id || 'Unassigned'}</td>
              <td>{task.data_row?.agent}</td>
              <td>{task.imported_at?.slice(0, 10)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
