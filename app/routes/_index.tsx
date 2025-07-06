import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { LoginForm } from "~/components/LoginForm";
import { Dashboard } from "~/components/Dashboard";

export default function Index() {
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Load session from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("dashboard_session");
      setSessionToken(token);
    }
  }, []);

  const sessionData = useQuery(
    api.dashboard.validateSession,
    sessionToken ? { sessionToken } : "skip"
  );

  useEffect(() => {
    if (sessionToken && sessionData === null && typeof window !== "undefined") {
      // Session is invalid, clear it
      localStorage.removeItem("dashboard_session");
      setSessionToken(null);
    }
  }, [sessionToken, sessionData]);

  const handleLogin = (token: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("dashboard_session", token);
      setSessionToken(token);
    }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("dashboard_session");
      setSessionToken(null);
    }
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
    </div>
  );
}
