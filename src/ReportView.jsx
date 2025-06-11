import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchTasks } from './api';

const reportTitles = {
  '16da88e2-2721-44ae-a0f3-5706dcde7e98': 'Missing TRX',
  '24add57e-1b40-4a49-b586-ccc2dff4faad': 'Missing BW',
  'd5cd1b59-6416-4c1d-a021-2d7f9342b49b': 'Multi Trade',
};

export default function ReportView() {
  const { id } = useParams(); // report_id from URL
  const reportTitle = reportTitles[id] || 'Unknown Report';

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
      <h1>{reportTitle}</h1>

      {loading && <p>Loading tasks...</p>}
      {error && <p className="error">{error}</p>}

      <table className="task-table">
        <thead>
          <tr>
            <th>Status</th>
            <th>Agent</th>
            <th>Amount</th>
            <th>Imported</th>
          </tr>
        </thead>
        <tbody>
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <tr key={task.id}>
                <td>{task.status}</td>
                <td>{task.data_row?.MemberFullName || '—'}</td>
                <td>{task.data_row?.Amount || '—'}</td>
                <td>{task.imported_at?.split('T')[0] || '—'}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4">No tasks available for this report.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

