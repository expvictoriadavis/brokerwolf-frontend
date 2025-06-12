import React, { useEffect, useState } from 'react';
import {
  fetchTasks,
  triggerImportData
} from './api';

export default function Dashboard() {
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [importSummary, setImportSummary] = useState(null);
  const [importing, setImporting] = useState(false);

  const reports = [
    { id: '16da88e2-2721-44ae-a0f3-5706dcde7e98', name: 'Missing TRX' },
    { id: '24add57e-1b40-4a49-b586-ccc2dff4faad', name: 'Missing BW' },
    { id: 'd5cd1b59-6416-4c1d-a021-2d7f9342b49b', name: 'Multi Trade' },
  ];

  const loadAllReports = async () => {
    setLoading(true);
    const results = {};
    for (const report of reports) {
      try {
        const data = await fetchTasks(report.id);
        const tasks = data.tasks || [];

        const assignedTasks = tasks.filter(t => t.assigned_at);
        const resolvedTasks = tasks.filter(t => t.status === 'resolved');
        const autoResolved = tasks.filter(t => t.status === 'resolved_by_import');
        const manualResolved = resolvedTasks.filter(
          t => t.resolved_note !== 'Auto-resolved due to data row not in import on '
        );

        const avgAssignTime = avgDuration(tasks, 'imported_at', 'assigned_at');
        const avgResolveTime = avgDuration(tasks, 'imported_at', 'resolved_at');

        results[report.id] = {
          name: report.name,
          total: tasks.length,
          avgAssignTime,
          avgResolveTime,
          autoResolved: autoResolved.length,
          manualResolved: manualResolved.length,
        };
      } catch (err) {
        console.error(`Error loading report ${report.name}:`, err);
      }
    }
    setMetrics(results);
    setLoading(false);
  };

  useEffect(() => {
    loadAllReports();
  }, []);

  const avgDuration = (rows, fromKey, toKey) => {
    const durations = rows
      .map(r => {
        const from = r[fromKey];
        const to = r[toKey];
        if (!from || !to) return null;
        const duration = (new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24);
        return duration > 0 ? duration : null;
      })
      .filter(Boolean);

    if (durations.length === 0) return 'N/A';
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    return `${avg.toFixed(1)} days`;
  };

  const handleImportReports = async () => {
    setImporting(true);
    setImportSummary(null);
    try {
      const importResult = await triggerImportData();
      setImportSummary(importResult);
      await loadAllReports();
    } catch (err) {
      console.error('Import error:', err);
      setImportSummary({ error: err.message });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div>
      <h1>Broker Wolf Exception Reports</h1>

      <button onClick={handleImportReports} disabled={importing} style={{ marginBottom: '20px' }}>
        {importing ? 'Pulling Reports...' : 'Pull New Reports'}
      </button>

      {importSummary?.results?.length > 0 && (
        <div style={{ background: '#eaf5ff', padding: '10px', marginBottom: '20px' }}>
          <strong>Import Summary:</strong>
          <ul>
            {importSummary.results.map((r, i) => (
              <li key={i}>{r.file}: {r.imported_rows} rows imported</li>
            ))}
          </ul>
        </div>
      )}

      {loading ? (
        <p>Loading metrics...</p>
      ) : (
        reports.map(r => {
          const m = metrics[r.id];
          if (!m) return <p key={r.id}>No data for {r.name}</p>;

          return (
            <div key={r.id} className="report-metrics">
              <h2>{m.name}</h2>
              <ul>
                <li>Total Tasks: {m.total}</li>
                <li>Avg Time to Assign: {m.avgAssignTime}</li>
                <li>Avg Time to Resolve: {m.avgResolveTime}</li>
                <li>Resolved by Import: {m.autoResolved}</li>
                <li>Resolved by Assignee: {m.manualResolved}</li>
              </ul>
            </div>
          );
        })
      )}
    </div>
  );
}

