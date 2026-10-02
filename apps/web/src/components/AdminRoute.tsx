import { Navigate } from "react-router-dom";
import { useCurrentUser } from "../hooks/useAuth";

/** Client-side guard only, for UX. The API enforces admin access on every request. */
export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading, isError } = useCurrentUser();

  if (isLoading) return <div className="p-8 text-slate-400">Loading...</div>;
  if (isError || !user) return <Navigate to="/login" replace />;
  if (user.role !== "ADMIN") return <div className="p-8 text-slate-400">This area is for admins only.</div>;
  return <>{children}</>;
}
