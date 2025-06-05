import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ReportTasks from './pages/ReportTasks';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/report/:reportId" element={<ReportTasks />} />
      </Routes>
    </Router>
  );
}
