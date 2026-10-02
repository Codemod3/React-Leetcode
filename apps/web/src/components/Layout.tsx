import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Code2, History, LayoutDashboard, ListChecks, LogOut } from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { useLogout } from "../hooks/useAuth";

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          isActive ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800/60"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export function Layout() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <header className="border-b border-slate-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Code2 className="w-5 h-5 text-brand-500" />
            ReactCode
          </div>
          <nav className="flex items-center gap-1">
            <NavItem to="/problems">
              <span className="flex items-center gap-1.5">
                <ListChecks className="w-4 h-4" /> Problems
              </span>
            </NavItem>
            <NavItem to="/submissions">
              <span className="flex items-center gap-1.5">
                <History className="w-4 h-4" /> Submissions
              </span>
            </NavItem>
            <NavItem to="/dashboard">
              <span className="flex items-center gap-1.5">
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </span>
            </NavItem>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-slate-400">{user.username}</span>
              <button
                onClick={async () => {
                  await logout.mutateAsync();
                  navigate("/login");
                }}
                className="text-sm text-slate-400 hover:text-white flex items-center gap-1"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </>
          ) : (
            <NavLink to="/login" className="text-sm text-brand-500 hover:text-brand-600">
              Login
            </NavLink>
          )}
        </div>
      </header>
      <main className="flex-1 min-h-0">
        <Outlet />
      </main>
    </div>
  );
}
