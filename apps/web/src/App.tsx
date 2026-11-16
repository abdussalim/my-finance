import { Routes, Route } from "react-router";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { PinSetup } from "./pages/PinSetup";
import { PinLogin } from "./pages/PinLogin";
import { AppShell } from "./components/layout/AppShell";
import { Dashboard } from "./pages/Dashboard";
import { Projects } from "./pages/Projects";
import { Transactions } from "./pages/Transactions";
import { Debts } from "./pages/Debts";
import { Settings } from "./pages/Settings";

function AppRoutes() {
  const { isSetup, isLoggedIn, loading } = useAuth();

  if (loading) {
    return (
      <div
        className="flex items-center justify-center min-h-dvh bg-[#08090E]"
        role="status"
        aria-label="Memuat aplikasi…"
      >
        <div
          className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(99,102,241,0.5)]"
          aria-hidden="true"
        />
      </div>
    );
  }

  if (!isSetup) {
    return <PinSetup />;
  }

  if (!isLoggedIn) {
    return <PinLogin />;
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/debts" element={<Debts />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </AppShell>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
