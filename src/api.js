const API_BASE_URL = import.meta.env.VITE_API_URL;

export async function fetchTasks(reportId) {
  let path = "";
  if (reportId === "16da88e2-2721-44ae-a0f3-5706dcde7e98") {
  path = "/records/missing_trx";
} else if (reportId === "24add57e-1b40-4a49-b586-ccc2dff4faad") {
  path = "/records/missing_bw";
} else if (reportId === "d5cd1b59-6416-4c1d-a021-2d7f9342b49b") {
  path = "/records/multi_trade";
} else if (reportId === "abc12345-duplicate-or-missing-transactions") {
  path = "/records/bw_ses"; // ✅ Add this new backend route
} else {
  throw new Error("Unknown report ID");
}

  const res = await fetch(`${API_BASE_URL}${path}`);
  if (!res.ok) throw new Error("Failed to fetch tasks");
  const data = await res.json();
  return { tasks: data.rows };
}

export async function assignTask(taskId, assigneeId) {
  const res = await fetch(`${API_BASE_URL}/task/${taskId}/assign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ assignee_id: assigneeId }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    console.error("❌ Assign failed:", error);
    throw new Error(error?.detail || "Failed to assign task");
  }

  return await res.json();
}

export async function fetchUsers() {
  const res = await fetch(`${API_BASE_URL}/users`);
  if (!res.ok) throw new Error("Failed to fetch users");
  return await res.json();
}

export async function resolveTask(taskId) {
  const res = await fetch(`${API_BASE_URL}/task/${taskId}/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "resolved" }),
  });
  if (!res.ok) throw new Error("Failed to resolve task");
  return await res.json();
}

export async function fetchTaskNotes(taskId) {
  const res = await fetch(`${API_BASE_URL}/task/${taskId}/notes`);
  if (!res.ok) throw new Error("Failed to fetch notes");
  return await res.json();
}

export async function addTaskNote(taskId, note) {
  const res = await fetch(`${API_BASE_URL}/task/${taskId}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(note),
  });
  if (!res.ok) throw new Error("Failed to add note");
  return await res.json();
}

export async function fetchPendingUsers() {
  const res = await fetch(`${API_BASE_URL}/users/pending`);
  if (!res.ok) throw new Error("Failed to load pending users");
  return await res.json();
}

export async function approveUser(email) {
  const res = await fetch(`${API_BASE_URL}/users/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error("Approval failed");
  return await res.json();
}

export async function triggerImportData() {
  const res = await fetch(`${API_BASE_URL}/import_data`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to trigger import");
  return await res.json();
}
export async function fetchImportSummary() {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/import_summary`);
  if (!res.ok) throw new Error("Failed to load import summary");
  return await res.json();
}
export async function fetchAllTasks() {
  const res = await fetch(`${API_BASE_URL}/records/all`);
  if (!res.ok) throw new Error("Failed to fetch all records");
  return await res.json();
}
export async function fetchAgentMetrics() {
  const res = await fetch(`${API_BASE_URL}/metrics/agents`);
  if (!res.ok) throw new Error("Failed to load agent metrics");
  return await res.json();
}

