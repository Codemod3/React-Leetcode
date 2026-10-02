import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import type { AdminProblemSummary } from "@reactcode/shared";
import { api, ApiError } from "../../lib/api";
import { DIFFICULTY_COLOR, DIFFICULTY_LABEL } from "../../lib/difficulty";

export function AdminProblemsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [source, setSource] = useState<"all" | "bank" | "admin">("all");

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-problems"],
    queryFn: () => api.get<AdminProblemSummary[]>("/admin/problems"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/problems/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-problems"] });
      queryClient.invalidateQueries({ queryKey: ["problems"] });
    },
  });

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data ?? []).filter(
      (p) =>
        (source === "all" || p.source === source) &&
        (!q || p.title.toLowerCase().includes(q) || p.slug.includes(q) || p.category.toLowerCase().includes(q))
    );
  }, [data, search, source]);

  const adminCount = (data ?? []).filter((p) => p.source === "admin").length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-end justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white mb-1">Manage problems</h1>
          <p className="text-slate-400 text-sm">
            {data ? `${data.length} problems · ${adminCount} authored here` : "Loading..."} · Problems defined in code are read-only; duplicate one to start from it.
          </p>
        </div>
        <Link
          to="/admin/problems/new"
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded bg-brand-600 hover:bg-brand-500 text-white"
        >
          <Plus className="w-4 h-4" /> New problem
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <label className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-2.5 top-2.5" />
          <span className="sr-only">Search problems</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, slug or category"
            className="w-full bg-slate-900 border border-slate-800 rounded-md pl-8 pr-3 py-1.5 text-sm text-white"
          />
        </label>
        <select
          aria-label="Source"
          value={source}
          onChange={(e) => setSource(e.target.value as typeof source)}
          className="bg-slate-900 border border-slate-800 rounded-md px-2 py-1.5 text-sm text-slate-300"
        >
          <option value="all">All sources</option>
          <option value="admin">Authored here</option>
          <option value="bank">From code</option>
        </select>
      </div>

      {isLoading && <p className="text-slate-500">Loading problems...</p>}
      {error && <p className="text-red-400">Could not load problems.</p>}
      {remove.isError && (
        <p role="alert" className="text-red-400 text-sm mb-3">
          {remove.error instanceof ApiError ? remove.error.message : "Delete failed."}
        </p>
      )}

      {data && (
        <div className="border border-slate-800 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 text-slate-400 text-left">
              <tr>
                <th className="px-3 py-2 w-12">#</th>
                <th className="px-3 py-2">Problem</th>
                <th className="px-3 py-2">Difficulty</th>
                <th className="px-3 py-2 hidden sm:table-cell">Category</th>
                <th className="px-3 py-2">Source</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => (
                <tr key={p.id} className="border-t border-slate-800 hover:bg-slate-900/60">
                  <td className="px-3 py-2.5 text-slate-500 tabular-nums">{p.order}</td>
                  <td className="px-3 py-2.5">
                    <span className="text-slate-200 font-medium">{p.title}</span>
                    <span className="block text-xs text-slate-500">{p.slug}</span>
                  </td>
                  <td className={`px-3 py-2.5 font-medium ${DIFFICULTY_COLOR[p.difficulty]}`}>{DIFFICULTY_LABEL[p.difficulty]}</td>
                  <td className="px-3 py-2.5 text-slate-400 hidden sm:table-cell">{p.category}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`text-[10px] uppercase tracking-wide rounded px-1.5 py-0.5 border ${
                        p.source === "admin" ? "border-brand-500 text-brand-500" : "border-slate-700 text-slate-500"
                      }`}
                    >
                      {p.source === "admin" ? "authored" : "code"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap space-x-3">
                    {p.source === "admin" ? (
                      <>
                        <Link to={`/admin/problems/${p.id}`} className="text-brand-500 hover:underline">
                          Edit<span className="sr-only"> {p.title}</span>
                        </Link>
                        <button
                          className="text-red-400 hover:underline"
                          disabled={remove.isPending}
                          onClick={() => {
                            if (window.confirm(`Delete "${p.title}"? Learners' progress on it will be removed too.`)) remove.mutate(p.id);
                          }}
                        >
                          Delete<span className="sr-only"> {p.title}</span>
                        </button>
                      </>
                    ) : (
                      <Link to={`/admin/problems/${p.id}?duplicate=1`} className="text-slate-400 hover:text-brand-500">
                        Duplicate<span className="sr-only"> {p.title}</span>
                      </Link>
                    )}
                    <Link to={`/problems/${p.slug}`} className="text-slate-400 hover:text-brand-500">
                      Open<span className="sr-only"> {p.title}</span>
                    </Link>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                    No problems match.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
