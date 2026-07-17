import { Navigate, Outlet } from "react-router";
import { useAuth } from "@/app/lib/auth";
import { Logo } from "./Logo";

function AuthLoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Logo size={64} />
    </div>
  );
}

export function RequireAuth() {
  const { user, initializing } = useAuth();
  if (initializing) return <AuthLoadingScreen />;
  if (!user) return <Navigate to="/" replace />;
  return <Outlet />;
}

export function RedirectIfAuthed() {
  const { user, initializing } = useAuth();
  if (initializing) return <AuthLoadingScreen />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
