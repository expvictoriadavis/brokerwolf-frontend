const API_BASE_URL = import.meta.env.VITE_API_URL;

export async function fetchTasks(reportId) {
  const res = await fetch(`${API_BASE_URL}/report/${reportId}/tasks`);
  if (!res.ok) throw new Error('Failed to fetch tasks');
  return await res.json();
}

export async function assignTask(taskId, assigneeId) {
  const res = await fetch(`${API_BASE_URL}/task/${taskId}/assign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assignee_id: assigneeId }),
  });
  if (!res.ok) throw new Error('Failed to assign task');
  return await res.json();
}

export async function updateTaskStatus(taskId, status) {
  const res = await fetch(`${API_BASE_URL}/task/${taskId}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update task status');
  return await res.json();
}

export async function resolveTask(taskId) {
  return await updateTaskStatus(taskId, "resolved");
}

export async function updateTaskNote(taskId, note) {
  const res = await fetch(`${API_BASE_URL}/task/${taskId}/note`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note }),
  });
  if (!res.ok) throw new Error('Failed to save note');
  return await res.json();
}

export async function fetchUsers() {
  const res = await fetch(`${API_BASE_URL}/users`);
  if (!res.ok) throw new Error('Failed to fetch users');
  return await res.json();
}

