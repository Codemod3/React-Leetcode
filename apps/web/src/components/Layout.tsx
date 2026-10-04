import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { History, LayoutDashboard, ListChecks, LogOut, Wrench } from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { useLogout } from "../hooks/useAuth";
import { LeetCodeLogo } from "./LeetCodeIcons";

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          isActive
            ? "text-white bg-[#323232]"
            : "text-[#9ca3af] hover:text-white hover:bg-[#282828]"
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
    <div className="min-h-screen flex flex-col bg-[#1a1a1a] text-[#eff2f6]">
      <header className="h-[50px] border-b border-[#333333] bg-[#262626] px-4 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-6">
          <NavLink to="/problems" className="flex items-center gap-2.5 text-white font-semibold text-base group">
            <LeetCodeLogo className="w-6 h-6 transition-transform group-hover:scale-105" />
            <span className="tracking-tight text-white font-bold">ReactCode</span>
          </NavLink>

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
            {user?.role === "ADMIN" && (
              <NavItem to="/admin">
                <span className="flex items-center gap-1.5">
                  <Wrench className="w-4 h-4" /> Admin
                </span>
              </NavItem>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-[#ffa116] text-[#1a1a1a] font-bold text-xs flex items-center justify-center">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs text-[#9ca3af] font-medium hidden sm:inline">{user.username}</span>
              <button
                onClick={async () => {
                  await logout.mutateAsync();
                  navigate("/login");
                }}
                className="text-xs text-[#9ca3af] hover:text-white flex items-center gap-1 px-2 py-1 rounded hover:bg-[#333333] transition-colors"
                title="Log out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <NavLink
              to="/login"
              className="text-xs bg-[#333333] hover:bg-[#3e3e3e] text-white px-3 py-1.5 rounded font-medium transition-colors"
            >
              Sign In
            </NavLink>
          )}
        </div>
      </header>

      <main className="flex-1 min-h-0 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
