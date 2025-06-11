import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchTasks } from './api';

export default function ReportView() {
  const { id } = useParams(); // This is the report_id from the route
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetchTasks(id)
      .then((data) => {
        setTasks(data.tasks || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to load tasks.');
        setLoading(false);
      });
  }, [id]);

  return (
    <div>
      <h1>Report ID: {id}</h1>
      {loading && <p>Loading tasks...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && tasks.length === 0 && <p>No tasks found.</p>}

      {!loading && !error && tasks.length > 0 && (
        <ul className="task-list">
          {tasks.map((task) => (
            <li key={task.id}>
              <strong>{task.status}</strong>: {task.data_row?.MemberFullName || '(No name)'}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
