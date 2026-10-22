import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { KipLoader } from "./kip-loader"; // <-- Import here

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <KipLoader />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
