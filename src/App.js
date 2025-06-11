import React, { useEffect } from 'react';
import './styles.css';
import { fetchTasks } from './api';

function App() {
  useEffect(() => {
    // Replace 'your-report-id' with a real report ID when ready
    fetchTasks('your-report-id')
      .then(data => console.log('Fetched Tasks:', data))
      .catch(error => console.error('API Error:', error));
  }, []);

  return (
    <div className="app-container">
      <h1>Broker Wolf Exceptions Reports</h1>
      <p>Homepage is up and connected to the backend.</p>
    </div>
  );
}

export default App;
