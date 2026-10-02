import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLogin, authErrorMessage } from "../hooks/useAuth";

export function LoginPage() {
  const [email, setEmail] = useState("demo@reactcode.dev");
  const [password, setPassword] = useState("demo12345");
  const login = useLogin();
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await login.mutateAsync({ email, password });
      navigate("/problems");
    } catch {
      /* error is rendered below via login.error */
    }
  }

  return (
    <div className="flex items-center justify-center h-full px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
        <h1 className="text-xl font-semibold text-white">Log in to ReactCode</h1>
        {login.isError && (
          <p className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded px-3 py-2">
            {authErrorMessage(login.error)}
          </p>
        )}
        <div>
          <label className="block text-sm text-slate-400 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white"
            required
          />
        </div>
        <button
          type="submit"
          disabled={login.isPending}
          className="w-full bg-brand-600 hover:bg-brand-500 text-white rounded-md py-2 text-sm font-medium disabled:opacity-50"
        >
          {login.isPending ? "Logging in..." : "Log in"}
        </button>
        <p className="text-sm text-slate-500">
          No account?{" "}
          <Link to="/register" className="text-brand-500 hover:underline">
            Register
          </Link>
        </p>
        <p className="text-xs text-slate-600">Seeded demo account: demo@reactcode.dev / demo12345</p>
      </form>
    </div>
  );
}
