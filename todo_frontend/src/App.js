import React, { useState } from "react";
import "./App.css";
import { AuthProvider, AuthForm, Header, TaskManager, useAuth } from "./components";

// PUBLIC_INTERFACE
function App() {
  // For minimal demo: light theme only, but preserve toggling for accessibility
  const [theme, setTheme] = useState("light");
  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // If logged-in: show main UI, otherwise auth form
  return (
    <AuthProvider>
      <MainApp theme={theme} setTheme={setTheme} />
    </AuthProvider>
  );
}

function MainApp({ theme, setTheme }) {
  const { user, logout } = useAuth();
  const [authKey, setAuthKey] = useState(Math.random()); // to re-mount on logout

  // On logout, clear key to reset AuthForm and state
  function handleLogout() {
    logout();
    setAuthKey(Math.random());
  }

  if (!user) {
    return (
      <div className="App" data-theme={theme} style={{ minHeight: "100vh" }}>
        <div style={{ position: "absolute", top: 22, right: 28, zIndex: 30 }}>
          <button
            className="theme-toggle"
            onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? "🌙 Dark" : "☀️ Light"}
          </button>
        </div>
        <AuthForm key={authKey} onAuthSuccess={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="App" data-theme={theme}>
      <Header onLogout={handleLogout} />
      <TaskManager />
    </div>
  );
}

export default App;
