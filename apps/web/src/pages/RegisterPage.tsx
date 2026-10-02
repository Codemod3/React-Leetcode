import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useRegister, authErrorMessage } from "../hooks/useAuth";

export function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const register = useRegister();
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await register.mutateAsync({ username, email, password });
      navigate("/problems");
    } catch {
      /* error is rendered below via register.error */
    }
  }

  return (
    <div className="flex items-center justify-center h-full px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
        <h1 className="text-xl font-semibold text-white">Create your account</h1>
        {register.isError && (
          <p className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded px-3 py-2">
            {authErrorMessage(register.error)}
          </p>
        )}
        <div>
          <label className="block text-sm text-slate-400 mb-1">Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            minLength={3}
            className="w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white"
            required
          />
        </div>
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
            minLength={8}
            className="w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white"
            required
          />
        </div>
        <button
          type="submit"
          disabled={register.isPending}
          className="w-full bg-brand-600 hover:bg-brand-500 text-white rounded-md py-2 text-sm font-medium disabled:opacity-50"
        >
          {register.isPending ? "Creating account..." : "Register"}
        </button>
        <p className="text-sm text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="text-brand-500 hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}
