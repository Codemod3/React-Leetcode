import { Navigate } from "react-router-dom";
import { useCurrentUser } from "../hooks/useAuth";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoading, isError } = useCurrentUser();

  if (isLoading) {
    return <div className="p-8 text-slate-400">Loading...</div>;
  }
  if (isError) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
