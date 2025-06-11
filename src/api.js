const API_BASE_URL = import.meta.env.VITE_API_URL;

// GET tasks by report ID
export async function fetchTasks(reportId) {
  const response = await fetch(`${API_BASE_URL}/report/${reportId}/tasks`);
  if (!response.ok) throw new Error('Failed to fetch tasks');
  return await response.json();
}

// POST to assign a task
export async function assignTask(taskId, assigneeId) {
  const response = await fetch(`${API_BASE_URL}/task/${taskId}/assign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assignee_id: assigneeId }),
  });
  if (!response.ok) throw new Error('Failed to assign task');
  return await response.json();
}

// POST to update task status
export async function updateTaskStatus(taskId, status) {
  const response = await fetch(`${API_BASE_URL}/task/${taskId}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error('Failed to update task status');
  return await response.json();
}

// GET sample test data from Supabase for debugging
export async function fetchTestData(reportId) {
  const response = await fetch(`${API_BASE_URL}/report/${reportId}/tasks`);
  if (!response.ok) throw new Error('Failed to fetch test data');
  return await response.json();
}
