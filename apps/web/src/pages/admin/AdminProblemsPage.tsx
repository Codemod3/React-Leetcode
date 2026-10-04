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
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-[#ffa116] hover:bg-[#ea8e08] text-[#1a1a1a] font-bold transition-colors"
        >
          <Plus className="w-4 h-4" /> New problem
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <label className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-[#8c8c8c] absolute left-2.5 top-2.5" />
          <span className="sr-only">Search problems</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, slug or category"
            className="w-full bg-[#262626] border border-[#383838] focus:border-[#ffa116] rounded-md pl-8 pr-3 py-1.5 text-xs text-white outline-none"
          />
        </label>
        <select
          aria-label="Source"
          value={source}
          onChange={(e) => setSource(e.target.value as typeof source)}
          className="bg-[#262626] border border-[#383838] focus:border-[#ffa116] rounded-md px-2 py-1.5 text-xs text-[#eff2f6] outline-none"
        >
          <option value="all">All sources</option>
          <option value="admin">Authored here</option>
          <option value="bank">From code</option>
        </select>
      </div>

      {isLoading && <p className="text-[#8c8c8c]">Loading problems...</p>}
      {error && <p className="text-[#ff375f]">Could not load problems.</p>}
      {remove.isError && (
        <p role="alert" className="text-[#ff375f] text-xs mb-3">
          {remove.error instanceof ApiError ? remove.error.message : "Delete failed."}
        </p>
      )}

      {data && (
        <div className="border border-[#333333] rounded-lg overflow-x-auto bg-[#262626]">
          <table className="w-full text-xs">
            <thead className="bg-[#282828] text-[#8c8c8c] text-left border-b border-[#333333]">
              <tr>
                <th className="px-3 py-2.5 w-12 font-semibold">#</th>
                <th className="px-3 py-2.5 font-semibold">Problem</th>
                <th className="px-3 py-2.5 font-semibold">Difficulty</th>
                <th className="px-3 py-2.5 hidden sm:table-cell font-semibold">Category</th>
                <th className="px-3 py-2.5 font-semibold">Source</th>
                <th className="px-3 py-2.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => (
                <tr key={p.id} className="border-t border-[#333333] hover:bg-[#2e2e2e] transition-colors">
                  <td className="px-3 py-2.5 text-[#8c8c8c] tabular-nums">{p.order}</td>
                  <td className="px-3 py-2.5">
                    <span className="text-white font-medium">{p.title}</span>
                    <span className="block text-[11px] text-[#8c8c8c]">{p.slug}</span>
                  </td>
                  <td className={`px-3 py-2.5 font-medium ${DIFFICULTY_COLOR[p.difficulty]}`}>{DIFFICULTY_LABEL[p.difficulty]}</td>
                  <td className="px-3 py-2.5 text-[#8c8c8c] hidden sm:table-cell">{p.category}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`text-[10px] uppercase tracking-wide rounded px-1.5 py-0.5 border ${
                        p.source === "admin" ? "border-[#ffa116] text-[#ffa116] bg-[#ffa116]/10" : "border-[#3e3e3e] text-[#8c8c8c]"
                      }`}
                    >
                      {p.source === "admin" ? "authored" : "code"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap space-x-3">
                    {p.source === "admin" ? (
                      <>
                        <Link to={`/admin/problems/${p.id}`} className="text-[#ffa116] hover:underline font-medium">
                          Edit<span className="sr-only"> {p.title}</span>
                        </Link>
                        <button
                          className="text-[#ff375f] hover:underline"
                          disabled={remove.isPending}
                          onClick={() => {
                            if (window.confirm(`Delete "${p.title}"? Learners' progress on it will be removed too.`)) remove.mutate(p.id);
                          }}
                        >
                          Delete<span className="sr-only"> {p.title}</span>
                        </button>
                      </>
                    ) : (
                      <Link to={`/admin/problems/${p.id}?duplicate=1`} className="text-[#8c8c8c] hover:text-[#ffa116]">
                        Duplicate<span className="sr-only"> {p.title}</span>
                      </Link>
                    )}
                    <Link to={`/problems/${p.slug}`} className="text-[#8c8c8c] hover:text-[#ffa116]">
                      Open<span className="sr-only"> {p.title}</span>
                    </Link>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-[#8c8c8c]">
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
