//
// Backend API service for todo_frontend
// Handles auth (register, login) and all task CRUD operations; stores JWT in localStorage
//

const BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:3001";

// Store JWT token in localStorage
export function saveToken(token) {
  localStorage.setItem("jwt_token", token);
}

// Get JWT token from localStorage
export function getToken() {
  return localStorage.getItem("jwt_token");
}

// Clear JWT token
export function clearToken() {
  localStorage.removeItem("jwt_token");
}

// Attach auth header (if token exists)
function authHeaders(additional = {}) {
  const token = getToken();
  return token
    ? {
        ...additional,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      }
    : {
        ...additional,
        "Content-Type": "application/json",
      };
}

// PUBLIC_INTERFACE
export async function registerUser(email, password) {
  /** Register a new user. */
  const resp = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!resp.ok) {
    throw await resp.json();
  }
  return resp.json();
}

// PUBLIC_INTERFACE
export async function loginUser(email, password) {
  /** Login and get JWT token. */
  const body = new URLSearchParams({
    username: email,
    password,
  });

  const resp = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body,
  });

  if (!resp.ok) {
    throw await resp.json();
  }
  return resp.json();
}

// PUBLIC_INTERFACE
export async function getTasks({ completed, search, sort_by, sort_desc }) {
  /** Get current user's tasks, filtered and sorted. */
  let url = `${BASE_URL}/tasks/?`;
  const params = [];
  if (typeof completed === "boolean") {
    params.push(`completed=${completed}`);
  }
  if (search) {
    params.push(`search=${encodeURIComponent(search)}`);
  }
  if (sort_by) {
    params.push(`sort_by=${encodeURIComponent(sort_by)}`);
  }
  if (typeof sort_desc === "boolean") {
    params.push(`sort_desc=${sort_desc}`);
  }
  url += params.join("&");
  const resp = await fetch(url, {
    headers: authHeaders(),
  });
  if (!resp.ok) throw await resp.json();
  return resp.json();
}

// PUBLIC_INTERFACE
export async function createTask(task) {
  /** Create a new task (title [required], description?, due_date? ISO8601). */
  const resp = await fetch(`${BASE_URL}/tasks/`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(task),
  });
  if (!resp.ok) throw await resp.json();
  return resp.json();
}

// PUBLIC_INTERFACE
export async function updateTask(task_id, data) {
  /** Update fields for a task by ID. */
  const resp = await fetch(`${BASE_URL}/tasks/${task_id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!resp.ok) throw await resp.json();
  return resp.json();
}

// PUBLIC_INTERFACE
export async function deleteTask(task_id) {
  /** Delete a task by ID. */
  const resp = await fetch(`${BASE_URL}/tasks/${task_id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (resp.status !== 204) throw await resp.json();
  return true;
}

// PUBLIC_INTERFACE
export async function toggleTask(task_id) {
  /** Toggle completion of a task by ID. */
  const resp = await fetch(`${BASE_URL}/tasks/${task_id}/toggle`, {
    method: "PATCH",
    headers: authHeaders(),
  });
  if (!resp.ok) throw await resp.json();
  return resp.json();
}
