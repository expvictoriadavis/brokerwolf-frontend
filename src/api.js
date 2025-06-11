// src/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://brokerwolf-backend.onrender.com';

export async function fetchTasks(reportId) {
  const response = await fetch(`${API_BASE_URL}/report/${reportId}/tasks`);
  if (!response.ok) throw new Error('Failed to fetch tasks');
  return response.json();
}
