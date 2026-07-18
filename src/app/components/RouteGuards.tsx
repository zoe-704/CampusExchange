import { Navigate, Outlet } from "react-router";
import { useAuth } from "@/app/lib/auth";
import { Logo } from "./Logo";
import { Button } from "./ui/button";

function AuthLoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Logo size={64} />
    </div>
  );
}

function ProfileErrorScreen({ message }: { message: string }) {
  const { refreshProfile, signOut } = useAuth();
  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-8">
      <div className="max-w-sm text-center space-y-4">
        <Logo size={64} />
        <p className="text-gray-900 font-semibold">Couldn't load your account</p>
        <p className="text-sm text-gray-600">{message}</p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => refreshProfile()} className="bg-[#0A1E3C] hover:bg-[#050F1E]">
            Try again
          </Button>
          <Button variant="outline" onClick={() => signOut()}>
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}

export function RequireAuth() {
  const { user, initializing, profile, profileError } = useAuth();
  if (initializing) return <AuthLoadingScreen />;
  if (!user) return <Navigate to="/" replace />;
  if (!profile) {
    if (profileError) return <ProfileErrorScreen message={profileError} />;
    return <AuthLoadingScreen />;
  }
  return <Outlet />;
}

export function RedirectIfAuthed() {
  const { user, initializing } = useAuth();
  if (initializing) return <AuthLoadingScreen />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
