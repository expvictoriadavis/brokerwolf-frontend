const API_BASE_URL = import.meta.env.VITE_API_URL;

export async function fetchTasks(reportId) {
  let path = "";
  if (reportId === "16da88e2-2721-44ae-a0f3-5706dcde7e98") {
    path = "/records/missing_trx";
  } else if (reportId === "24add57e-1b40-4a49-b586-ccc2dff4faad") {
    path = "/records/missing_bw";
  } else if (reportId === "d5cd1b59-6416-4c1d-a021-2d7f9342b49b") {
    path = "/records/multi_trade";
  } else {
    throw new Error("Unknown report ID");
  }

  const res = await fetch(`${API_BASE_URL}${path}`);
  if (!res.ok) throw new Error('Failed to fetch tasks');
  const data = await res.json();
  return { tasks: data.rows };
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

export async function triggerImportData() {
  const res = await fetch(`${API_BASE_URL}/import_data`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to trigger import');
  return await res.json();
}

// ✅ New: For user approval flow
export async function fetchPendingUsers() {
  const res = await fetch(`${API_BASE_URL}/pending_users`);
  if (!res.ok) throw new Error("Failed to load pending users");
  return await res.json();
}

export async function approveUser(email) {
  const res = await fetch(`${API_BASE_URL}/approve_user`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });
  if (!res.ok) throw new Error("Approval failed");
  return await res.json();
}


