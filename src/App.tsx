import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Toaster } from "sonner";
import { LoginForm } from "./components/LoginForm";
import { Dashboard } from "./components/Dashboard";

export default function App() {
  const [sessionToken, setSessionToken] = useState<string | null>(
    localStorage.getItem("dashboard_session")
  );

  const sessionData = useQuery(
    api.dashboard.validateSession,
    sessionToken ? { sessionToken } : "skip"
  );

  useEffect(() => {
    if (sessionToken && sessionData === null) {
      // Session is invalid, clear it
      localStorage.removeItem("dashboard_session");
      setSessionToken(null);
    }
  }, [sessionToken, sessionData]);

  const handleLogin = (token: string) => {
    localStorage.setItem("dashboard_session", token);
    setSessionToken(token);
  };

  const handleLogout = () => {
    localStorage.removeItem("dashboard_session");
    setSessionToken(null);
  };

  if (sessionToken && sessionData === undefined) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {sessionToken && sessionData ? (
        <Dashboard 
          sessionToken={sessionToken} 
          sessionData={sessionData}
          onLogout={handleLogout}
        />
      ) : (
        <LoginForm onLogin={handleLogin} />
      )}
      <Toaster theme="dark" />
    </div>
  );
}
