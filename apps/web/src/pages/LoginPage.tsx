import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLogin, authErrorMessage } from "../hooks/useAuth";
import { LeetCodeLogo } from "../components/LeetCodeIcons";

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
      /* error rendered below */
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-[#1a1a1a]">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm bg-[#262626] border border-[#333333] rounded-xl p-8 space-y-5 shadow-2xl"
      >
        <div className="flex flex-col items-center text-center space-y-2">
          <LeetCodeLogo className="w-10 h-10" />
          <h1 className="text-xl font-bold text-white tracking-tight">Sign in to ReactCode</h1>
          <p className="text-xs text-[#8c8c8c]">Practice React coding challenges with instant grading</p>
        </div>

        {login.isError && (
          <p className="text-xs text-[#ff8080] bg-[#2b1b1e] border border-[#55272e] rounded-lg p-3">
            {authErrorMessage(login.error)}
          </p>
        )}

        <div className="space-y-1">
          <label className="block text-xs font-semibold text-[#8c8c8c] uppercase tracking-wider">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg bg-[#1e1e1e] border border-[#383838] focus:border-[#ffa116] px-3.5 py-2 text-xs text-white outline-none transition-colors"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-semibold text-[#8c8c8c] uppercase tracking-wider">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg bg-[#1e1e1e] border border-[#383838] focus:border-[#ffa116] px-3.5 py-2 text-xs text-white outline-none transition-colors"
            required
          />
        </div>

        <button
          type="submit"
          disabled={login.isPending}
          className="w-full bg-[#ffa116] hover:bg-[#ea8e08] active:bg-[#d47f07] text-[#1a1a1a] font-bold rounded-lg py-2.5 text-xs transition-colors disabled:opacity-50 tracking-wide"
        >
          {login.isPending ? "Signing in..." : "Sign In"}
        </button>

        <p className="text-xs text-center text-[#8c8c8c]">
          Don't have an account?{" "}
          <Link to="/register" className="text-[#ffa116] hover:underline font-medium">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}
