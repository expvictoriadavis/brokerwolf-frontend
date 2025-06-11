import React, { useState, useEffect } from 'react';
import './styles.css';
import { fetchTasks } from './api';

const reports = [
  {
    id: '16da88e2-2721-44ae-a0f3-5706dcde7e98',
    name: 'Missing TRX',
  },
  {
    id: '24add57e-1b40-4a49-b586-ccc2dff4faad',
    name: 'Missing BW',
  },
  {
    id: 'd5cd1b59-6416-4c1d-a021-2d7f9342b49b',
    name: 'Multi Trade',
  },
];

function App() {
  const [selectedReportId, setSelectedReportId] = useState(reports[0].id);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const selectedReportName = reports.find(r => r.id === selectedReportId)?.name;

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchTasks(selectedReportId)
      .then((data) => {
        setTasks(data.tasks || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to load tasks.');
        setLoading(false);
      });
  }, [selectedReportId]);

  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>Broker Wolf</h2>
        <nav>
          {reports.map((report) => (
            <button
              key={report.id}
              className={report.id === selectedReportId ? 'nav-button active' : 'nav-button'}
              onClick={() => setSelectedReportId(report.id)}
            >
              {report.name}
            </button>
          ))}
        </nav>
      </aside>

      <main className="main-content">
        <h1>{selectedReportName} Tasks</h1>

        {loading && <p>Loading tasks...</p>}
        {error && <p className="error">{error}</p>}
        {!loading && !error && tasks.length === 0 && <p>No tasks found.</p>}

        {!loading && !error && tasks.length > 0 && (
          <ul className="task-list">
            {tasks.map((task) => (
              <li key={task.id}>
                <strong>{task.status}</strong>: {task.data_row?.id || '(no ID)'}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

export default App;
