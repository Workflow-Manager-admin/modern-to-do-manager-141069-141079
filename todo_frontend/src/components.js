import React, { useState, useEffect } from "react";
import {
  registerUser,
  loginUser,
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  toggleTask,
  clearToken,
  saveToken,
  getToken,
} from "./api";

// ---- Auth Context & Hooks ----

// PUBLIC_INTERFACE
const AuthContext = React.createContext();
export function useAuth() {
  return React.useContext(AuthContext);
}

// PUBLIC_INTERFACE
export function AuthProvider({ children }) {
  // Holds: { id, email }, or null if unauthenticated
  const [user, setUser] = useState(null);

  // Persist session (future: decode token, get info)
  useEffect(() => {
    const token = getToken();
    if (token) {
      // Minimal stateless: Don't parse token. Real apps should decode claims/user.
      // Assume successful login if token exists.
      setUser({ email: "(Session)", id: "" });
    }
  }, []);

  function login({ access_token, ...rest }) {
    saveToken(access_token);
    setUser({ email: rest.email || "(Authenticated)", id: rest.id || "" });
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ---- Layout Components ----

// PUBLIC_INTERFACE
export function Header({ onLogout }) {
  const { user } = useAuth();
  return (
    <header
      style={{
        background: "var(--bg-secondary)",
        borderBottom: "1.5px solid var(--border-color)",
        padding: "0 2rem",
        minHeight: 72,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontFamily: "inherit",
      }}
      role="banner"
    >
      <span style={{ fontWeight: 700, fontSize: 30, color: "var(--text-primary)" }}>
        📝 To-Do Manager
      </span>
      {user && (
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span
            style={{
              color: "var(--text-secondary)",
              fontSize: 18,
              marginRight: 4,
            }}
            title={user.email}
          >
            {user.email}
          </span>
          <button
            className="theme-toggle"
            style={{
              fontSize: 16,
              background: "var(--button-bg)",
              color: "var(--button-text)",
              border: "none",
              borderRadius: 6,
              padding: "10px 18px",
              cursor: "pointer",
              fontWeight: 600,
            }}
            onClick={onLogout}
          >
            Log out
          </button>
        </div>
      )}
    </header>
  );
}

// PUBLIC_INTERFACE
export function Sidebar({
  filters,
  setFilters,
  totalTasks,
  completedCount,
  pendingCount,
}) {
  function onChangeFilter(e) {
    const value = e.target.value;
    setFilters((f) => ({
      ...f,
      completed: value === "all" ? undefined : value === "completed",
    }));
  }
  function onSort(e) {
    const [sort_by, sort_dir] = e.target.value.split(":");
    setFilters((f) => ({
      ...f,
      sort_by,
      sort_desc: sort_dir === "desc",
    }));
  }

  return (
    <aside
      style={{
        width: 248,
        background: "var(--bg-secondary)",
        padding: "2rem 1rem 1rem 1.5rem",
        borderRight: "1.5px solid var(--border-color)",
        display: "flex",
        flexDirection: "column",
        gap: 32,
        minHeight: "calc(100vh - 72px)",
      }}
    >
      <div>
        <span style={{ fontWeight: 700, fontSize: 20 }}>Filters</span>
        <div style={{ margin: "12px 0" }}>
          <label style={{ display: "block", margin: ".5em 0" }}>
            <input
              type="radio"
              name="completedFilter"
              value="all"
              checked={filters.completed === undefined}
              onChange={onChangeFilter}
            />
            All tasks ({totalTasks})
          </label>
          <label style={{ display: "block", margin: ".5em 0" }}>
            <input
              type="radio"
              name="completedFilter"
              value="completed"
              checked={filters.completed === true}
              onChange={onChangeFilter}
            />
            Completed ({completedCount})
          </label>
          <label style={{ display: "block", margin: ".5em 0" }}>
            <input
              type="radio"
              name="completedFilter"
              value="pending"
              checked={filters.completed === false}
              onChange={onChangeFilter}
            />
            Pending ({pendingCount})
          </label>
        </div>
      </div>
      <div>
        <span style={{ fontWeight: 700, fontSize: 20 }}>Sort by</span>
        <select
          style={{
            width: "95%",
            padding: "0.6em",
            fontSize: 16,
            margin: "1em 0 .2em 0",
            border: "1px solid var(--border-color)",
            borderRadius: 6,
            background: "var(--bg-primary)",
            color: "var(--text-primary)",
          }}
          value={`${filters.sort_by || "created_at"}:${filters.sort_desc ? "desc" : "asc"}`}
          onChange={onSort}
        >
          <option value="created_at:desc">Newest first</option>
          <option value="created_at:asc">Oldest first</option>
          <option value="due_date:asc">Due date ↑</option>
          <option value="due_date:desc">Due date ↓</option>
        </select>
      </div>
    </aside>
  );
}

// ---- Authentication UI ----

// PUBLIC_INTERFACE
export function AuthForm({ onAuthSuccess }) {
  // User registration/login controller
  const [mode, setMode] = useState("login"); // or "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    try {
      if (mode === "login") {
        const resp = await loginUser(email, password);
        saveToken(resp.access_token);
        onAuthSuccess();
      } else {
        await registerUser(email, password);
        setMode("login");
        setErrorMsg("Registration successful, please log in!");
      }
    } catch (err) {
      setErrorMsg(
        (err?.detail && err.detail[0]?.msg) ||
          err?.msg ||
          "Authentication failed"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        margin: "100px auto",
        maxWidth: 350,
        padding: "2.5em 2em 2em 2.1em",
        background: "var(--bg-secondary)",
        borderRadius: 11,
        boxShadow: "0 2px 15px rgba(50,50,50,0.06)",
      }}
    >
      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ margin: 0, color: "var(--primary, #1976d2)" }}>
            {mode === "login" ? "Sign In" : "Register"}
          </h1>
          <p style={{ marginTop: 7, fontSize: 16, color: "var(--text-secondary)" }}>for To-Do Manager</p>
        </div>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          autoFocus
          style={{
            width: "100%",
            marginBottom: 14,
            padding: ".9em",
            border: "1px solid var(--border-color)",
            borderRadius: 6,
            fontSize: 15,
          }}
          disabled={loading}
        />
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          style={{
            width: "100%",
            marginBottom: 14,
            padding: ".9em",
            border: "1px solid var(--border-color)",
            borderRadius: 6,
            fontSize: 15,
          }}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "0.9em",
            fontWeight: 700,
            fontSize: 17,
            color: "#fff",
            background: "var(--primary,#1976d2)",
            border: "none",
            borderRadius: 9,
            cursor: "pointer",
            opacity: loading ? 0.7 : 1,
            transition: "opacity .1s",
            marginTop: 2,
          }}
        >
          {loading ? "Loading..." : mode === "login" ? "Login" : "Register"}
        </button>
        <div style={{ marginTop: 15, textAlign: "center" }}>
          <span style={{ color: "var(--text-secondary)" }}>
            {mode === "login"
              ? "Need an account? "
              : "Already registered? "}
          </span>
          <button
            type="button"
            style={{
              background: "none",
              border: "none",
              color: "var(--accent,#ff9800)",
              fontWeight: 700,
              fontSize: 15,
              padding: 0,
              cursor: "pointer",
              textDecoration: "underline",
            }}
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setErrorMsg("");
            }}
            disabled={loading}
          >
            {mode === "login" ? "Register" : "Login"}
          </button>
        </div>
        {errorMsg && (
          <p
            style={{
              background: "#fff0f1",
              color: "#e53935",
              fontWeight: "bold",
              textAlign: "center",
              borderRadius: 6,
              marginTop: 17,
              padding: ".7em",
              fontSize: 15.5,
            }}
          >
            {errorMsg}
          </p>
        )}
      </form>
    </div>
  );
}

// ---- Task manager view ----

function formatDate(dt) {
  if (!dt) return "";
  return new Date(dt).toLocaleDateString();
}

function TaskRow({ task, onEdit, onDelete, onToggleComplete }) {
  return (
    <div
      style={{
        padding: "1.2em 1em 1.2em .8em",
        display: "grid",
        gridTemplateColumns: "36px 1fr 130px 90px 50px",
        alignItems: "center",
        borderBottom: "1.1px solid var(--border-color)",
        background: task.completed
          ? "rgba(0,0,0,0.025)"
          : "var(--bg-primary)",
        opacity: task.completed ? 0.70 : 1,
        gap: 8,
      }}
    >
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggleComplete(task)}
        aria-label="Toggle complete"
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          textAlign: "left",
        }}
      >
        <span
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: task.completed
              ? "var(--text-secondary)"
              : "var(--primary, #1976d2)",
            textDecoration: task.completed ? "line-through" : "none",
            transition: "color .17s",
            whiteSpace: "pre-line",
          }}
        >
          {task.title}
        </span>
        {task.description && (
          <span
            style={{
              color: "var(--text-secondary)",
              fontSize: 16,
              marginTop: 2,
              wordBreak: "break-word",
            }}
          >
            {task.description}
          </span>
        )}
      </div>
      <div>
        <span
          style={{
            color: "#666",
            background: "#f3f6fa",
            padding: ".2em .7em",
            borderRadius: 8,
            fontSize: 14.5,
            fontWeight: 500,
            marginRight: 8,
          }}
          title="Due date"
        >
          {task.due_date ? "Due: " + formatDate(task.due_date) : ""}
        </span>
      </div>
      <div>
        <button
          style={{
            background: "none",
            border: "none",
            color: "var(--primary,#1976d2)",
            fontWeight: "bold",
            cursor: "pointer",
            marginRight: 16,
            fontSize: 16,
          }}
          onClick={() => onEdit(task)}
          aria-label="Edit"
        >
          Edit
        </button>
        <button
          style={{
            background: "none",
            border: "none",
            color: "#d32f2f",
            fontWeight: "bold",
            cursor: "pointer",
            fontSize: 16,
          }}
          onClick={() => onDelete(task)}
          aria-label="Delete"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
export function TaskManager() {
  const [tasks, setTasks] = useState([]);
  const [filters, setFilters] = useState({
    completed: undefined,
    sort_by: "created_at",
    sort_desc: true,
    search: "",
  });
  const [refresh, setRefresh] = useState(0);
  const [editingTask, setEditingTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function forceRefresh() {
    setRefresh((x) => x + 1);
  }

  useEffect(() => {
    setLoading(true);
    getTasks({ ...filters, search: filters.search || undefined })
      .then(setTasks)
      .catch((err) =>
        setError(
          (err && err.detail && err.detail[0]?.msg) ||
            err?.msg ||
            "Failed to fetch tasks"
        )
      )
      .finally(() => setLoading(false));
    // eslint-disable-next-line
  }, [filters, refresh]);

  const totalTasks = tasks.length;
  const completedCount = tasks.filter((t) => t.completed).length;
  const pendingCount = totalTasks - completedCount;

  function doCreateTask() {
    setEditingTask(null);
    setShowModal(true);
  }
  function doEditTask(task) {
    setEditingTask(task);
    setShowModal(true);
  }
  function doDeleteTask(task) {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    deleteTask(task.id).then(forceRefresh);
  }
  function doToggleComplete(task) {
    toggleTask(task.id).then(forceRefresh);
  }
  async function handleSaveTask(data) {
    if (editingTask) {
      await updateTask(editingTask.id, data);
    } else {
      await createTask(data);
    }
    setShowModal(false);
    forceRefresh();
  }
  function handleSearch(e) {
    setSearchVal(e.target.value);
    setFilters((f) => ({ ...f, search: e.target.value }));
  }

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--bg-primary)" }}>
      <Sidebar
        filters={filters}
        setFilters={setFilters}
        totalTasks={totalTasks}
        completedCount={completedCount}
        pendingCount={pendingCount}
      />
      <main
        style={{
          flex: 1,
          padding: "2.5em 2.6em 2em 2.7em",
          background: "var(--bg-primary)",
          minHeight: "calc(100vh - 72px)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 25,
            justifyContent: "space-between",
          }}
        >
          <input
            value={searchVal}
            onChange={handleSearch}
            placeholder="Search tasks..."
            style={{
              width: 240,
              padding: ".8em .9em",
              fontSize: 16,
              border: "1px solid var(--border-color)",
              borderRadius: 8,
              background: "var(--bg-secondary)",
              color: "var(--text-primary)",
            }}
          />
          <button
            style={{
              padding: ".9em 1.6em",
              background: "var(--accent,#ff9800)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 17,
              cursor: "pointer",
              marginLeft: 8,
            }}
            onClick={doCreateTask}
          >
            + New Task
          </button>
        </div>
        <div
          style={{
            borderRadius: 11,
            background: "var(--bg-secondary)",
            minHeight: "55vh",
            boxShadow: "0 2px 15px rgba(60,70,100,0.10)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {loading ? (
            <div style={{ padding: 48, textAlign: "center", color: "var(--text-secondary)" }}>
              Loading...
            </div>
          ) : error ? (
            <div style={{ padding: 48, textAlign: "center", color: "#f44336" }}>{error}</div>
          ) : tasks.length === 0 ? (
            <div style={{ padding: 60, textAlign: "center", color: "var(--text-secondary)", fontSize: 18 }}>
              No tasks found!
            </div>
          ) : (
            tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onEdit={doEditTask}
                onDelete={doDeleteTask}
                onToggleComplete={doToggleComplete}
              />
            ))
          )}
        </div>
        {showModal && (
          <TaskModal
            show={showModal}
            onClose={() => setShowModal(false)}
            onSave={handleSaveTask}
            editingTask={editingTask}
          />
        )}
      </main>
    </div>
  );
}

// PUBLIC_INTERFACE
function TaskModal({ show, onClose, onSave, editingTask }) {
  const [title, setTitle] = useState(editingTask ? editingTask.title : "");
  const [description, setDescription] = useState(
    editingTask ? editingTask.description || "" : ""
  );
  const [due_date, setDueDate] = useState(
    editingTask && editingTask.due_date
      ? editingTask.due_date.split("T")[0]
      : ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave({
        title,
        description: description || undefined,
        due_date: due_date ? new Date(due_date).toISOString() : null,
      });
      setTitle("");
      setDescription("");
      setDueDate("");
    } catch (err) {
      setError(
        (err?.detail && err.detail[0]?.msg) ||
          err?.msg ||
          "Unable to save task"
      );
    } finally {
      setSaving(false);
    }
  }

  if (!show) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(44,54,74,0.14)",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        style={{
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 6px 30px rgba(50,80,136,0.18)",
          minWidth: 320,
          maxWidth: 370,
          padding: "2.5em 2em 1.8em 2.2em",
        }}
      >
        <h2 style={{ marginTop: 0, color: "var(--primary,#1976d2)" }}>
          {editingTask ? "Edit task" : "New task"}
        </h2>
        <div>
          <input
            required
            style={{
              width: "100%",
              marginBottom: 11,
              padding: ".8em",
              border: "1px solid var(--border-color)",
              borderRadius: 7,
              fontSize: 15,
            }}
            placeholder="Title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={saving}
          />
        </div>
        <div>
          <textarea
            style={{
              width: "100%",
              minHeight: 62,
              resize: "vertical",
              marginBottom: 13,
              padding: ".8em",
              border: "1px solid var(--border-color)",
              borderRadius: 7,
              fontSize: 15,
            }}
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={saving}
          />
        </div>
        <div>
          <label>
            <small>Due date:</small>
            <input
              style={{
                width: "100%",
                marginTop: 7,
                marginBottom: 13,
                padding: ".8em",
                border: "1px solid var(--border-color)",
                borderRadius: 7,
                fontSize: 15,
              }}
              type="date"
              value={due_date}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={saving}
            />
          </label>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 20 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "0.7em 1.2em",
              background: "var(--border-color,#eee)",
              color: "#444",
              border: "none",
              borderRadius: 8,
              fontWeight: 500,
              cursor: "pointer",
              fontSize: 16,
            }}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{
              padding: "0.7em 1.7em",
              background: "var(--accent,#ff9800)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 17,
              cursor: "pointer",
              opacity: saving ? 0.8 : 1,
            }}
            disabled={saving}
          >
            {saving ? "Saving..." : editingTask ? "Save" : "Create"}
          </button>
        </div>
        {error && (
          <div
            style={{
              color: "#e53935",
              marginTop: 16,
              fontWeight: 600,
              fontSize: 15,
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}
      </form>
    </div>
  );
}
