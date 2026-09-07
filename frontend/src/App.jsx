import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Journal from "./pages/Journal.jsx";
import History from "./pages/History.jsx";
import Insights from "./pages/Insights.jsx";
import GrowthTimeline from "./pages/GrowthTimeline.jsx";
import Privacy from "./pages/Privacy.jsx";
import Settings from "./pages/Settings.jsx";

function AppShell({ children }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppShell>
              <Dashboard />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/journal/:journalId"
        element={
          <ProtectedRoute>
            <AppShell>
              <Journal />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <AppShell>
              <History />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/insights"
        element={
          <ProtectedRoute>
            <AppShell>
              <Insights />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/growth"
        element={
          <ProtectedRoute>
            <AppShell>
              <GrowthTimeline />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/privacy"
        element={
          <ProtectedRoute>
            <AppShell>
              <Privacy />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <AppShell>
              <Settings />
            </AppShell>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
