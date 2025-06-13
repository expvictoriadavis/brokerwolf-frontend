import React, { useEffect, useState } from 'react';
import { fetchTasks, triggerImportData } from './api';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const reports = [
  { id: '16da88e2-2721-44ae-a0f3-5706dcde7e98', name: 'Missing TRX' },
  { id: '24add57e-1b40-4a49-b586-ccc2dff4faad', name: 'Missing BW' },
  { id: 'd5cd1b59-6416-4c1d-a021-2d7f9342b49b', name: 'Multi Trade' },
];

export default function Dashboard() {
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [importSummary, setImportSummary] = useState(null);
  const [importing, setImporting] = useState(false);
  const [lastImportTime, setLastImportTime] = useState(null);

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
          t => !t.resolved_note?.startsWith('Auto-resolved')
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
          open: tasks.length - autoResolved.length - manualResolved.length,
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
      setLastImportTime(new Date().toISOString());
      await loadAllReports();
    } catch (err) {
      console.error('Import error:', err);
      setImportSummary({ error: err.message });
    } finally {
      setImporting(false);
    }
  };

  const renderChart = (reportId) => {
    const data = metrics[reportId];
    if (!data || data.total === 0) return null;

    const open = data.open;
    const resolved = data.manualResolved + data.autoResolved;

    return (
      <Doughnut
        data={{
          labels: ['Open', 'Resolved'],
          datasets: [
            {
              data: [open, resolved],
              backgroundColor: ['#facc15', '#4ade80'],
              borderColor: ['#eab308', '#22c55e'],
              borderWidth: 1,
            },
          ],
        }}
        options={{ plugins: { legend: { position: 'bottom' } } }}
      />
    );
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Broker Wolf Exception Reports</h1>
        <button onClick={handleImportReports} disabled={importing} style={{ padding: '10px 20px' }}>
          {importing ? 'Pulling Reports...' : 'Pull Reports'}
        </button>
      </div>

      {lastImportTime && (
        <p style={{ fontStyle: 'italic', fontSize: '14px', color: '#555' }}>
          Last import: {new Date(lastImportTime).toLocaleString()}
        </p>
      )}

      {importSummary?.results?.length > 0 && (
        <div style={{ background: '#eaf5ff', padding: '10px', margin: '15px 0' }}>
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
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
          {reports.map(r => {
            const m = metrics[r.id];
            return (
              <div
                key={r.id}
                style={{
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  padding: '16px',
                  width: '320px',
                  backgroundColor: '#fff',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                }}
              >
                <h2>{r.name}</h2>
                {m ? (
                  <>
                    <ul style={{ paddingLeft: '16px' }}>
                      <li><strong>Total Tasks:</strong> {m.total}</li>
                      <li><strong>Avg Time to Assign:</strong> {m.avgAssignTime}</li>
                      <li><strong>Avg Time to Resolve:</strong> {m.avgResolveTime}</li>
                      <li><strong>Resolved by Import:</strong> {m.autoResolved}</li>
                      <li><strong>Resolved by Assignee:</strong> {m.manualResolved}</li>
                      <li><strong>Completion:</strong> {m.total > 0 ? `${Math.round(((m.manualResolved + m.autoResolved) / m.total) * 100)}%` : '0%'}</li>
                    </ul>
                    <div style={{ maxWidth: '220px', margin: '0 auto' }}>
                      {renderChart(r.id)}
                    </div>
                  </>
                ) : (
                  <p>No data for {r.name}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

