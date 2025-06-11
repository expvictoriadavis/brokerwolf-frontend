import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchTasks } from './api';

const reportMetadata = {
  '16da88e2-2721-44ae-a0f3-5706dcde7e98': {
    name: 'Missing TRX',
    columns: [
      'BrokerWolfTransactionKeyNumeric',
      'Number',
      'TransactionKeyNumeric',
      'TransactionNumber',
      'Transaction2KeyNumeric',
      'Transaction2Number',
      'MemberKeyNumeric',
      'MemberFullName',
      'SourceSystemModificationTimestamp',
      'ClosePrice',
      'CloseDate',
      'StatusCode',
      'UnitsBuyer',
      'UnitsSeller',
      'IsBuyerAgent',
      'Percentage',
      'Amount'
    ]
  },
  '24add57e-1b40-4a49-b586-ccc2dff4faad': {
    name: 'Missing BW',
    columns: [
      'BrokerWolfTransactionKeyNumeric',
      'Number',
      'TransactionKeyNumeric',
      'TransactionNumber',
      'explanation',
      'Transaction2KeyNumeric',
      'Transaction2Number',
      'MemberKeyNumeric',
      'MemberFullName',
      'SourceSystemModificationTimestamp',
      'SalesPriceVolume',
      'ActualCloseDate',
      'LifecycleStatus',
      'UnitsBuyer',
      'UnitsSeller',
      'IsBuyerAgent',
      'CoAgentPercentage',
      'NCIBAS'
    ]
  },
  'd5cd1b59-6416-4c1d-a021-2d7f9342b49b': {
    name: 'Multi Trade',
    columns: [
      'BrokerWolfTransactionKeyNumeric',
      'Number',
      'ErrorType',
      'MemberKeyNumeric',
      'MemberFullName',
      'SourceSystemModificationTimestamp',
      'ClosePrice',
      'CloseDate',
      'StatusCode',
      'Subtrade',
      'UnitsBuyer',
      'UnitsSeller',
      'IsBuyerAgent',
      'Percentage',
      'Amount'
    ]
  }
};

export default function ReportView() {
  const { id } = useParams();
  const report = reportMetadata[id];
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

  if (!report) {
    return <p className="error">Unknown report ID</p>;
  }

  return (
    <div>
      <h1>{report.name}</h1>

      {loading && <p>Loading tasks...</p>}
      {error && <p className="error">{error}</p>}

      <table className="task-table">
        <thead>
          <tr>
            {report.columns.map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <tr key={task.id}>
                {report.columns.map((col) => (
                  <td key={col}>
                    {task.data_row?.[col] !== undefined ? task.data_row[col] : '—'}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={report.columns.length}>No tasks available for this report.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
