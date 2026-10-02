import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { ExecutionStatus, SubmissionDetail, SubmissionPage } from "@reactcode/shared";
import { api } from "../lib/api";

const STATUS: Record<ExecutionStatus, { label: string; className: string }> = {
  PASSED: { label: "Accepted", className: "text-emerald-400" },
  FAILED: { label: "Wrong Answer", className: "text-red-400" },
  COMPILE_ERROR: { label: "Compilation Error", className: "text-amber-400" },
  RUNTIME_ERROR: { label: "Runtime Error", className: "text-amber-400" },
  TIMEOUT: { label: "Time Limit Exceeded", className: "text-amber-400" },
};

function SubmissionCode({ id }: { id: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["submission", id],
    queryFn: () => api.get<SubmissionDetail>(`/submissions/${id}`),
  });
  if (isLoading || !data) return <p className="text-slate-500 text-sm px-3 py-2">Loading code...</p>;
  return (
    <div className="px-3 pb-3 space-y-2">
      {data.errorMessage && <p className="text-xs text-amber-300 font-mono whitespace-pre-wrap">{data.errorMessage}</p>}
      <pre aria-label="Submitted code" className="bg-slate-900 border border-slate-800 rounded p-3 text-xs text-slate-200 overflow-auto max-h-96">
        {data.code}
      </pre>
    </div>
  );
}

export function SubmissionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page") ?? "1");
  const problem = searchParams.get("problem");
  const [openId, setOpenId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["submissions", page, problem],
    queryFn: () => api.get<SubmissionPage>(`/submissions?page=${page}${problem ? `&problem=${encodeURIComponent(problem)}` : ""}`),
  });

  const goTo = (p: number) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(p));
    setSearchParams(next);
    setOpenId(null);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-end justify-between flex-wrap gap-2 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white mb-1">Submissions</h1>
          <p className="text-slate-400 text-sm">
            {problem ? (
              <>
                For <span className="text-slate-200">{data?.items[0]?.problem.title ?? problem}</span> ·{" "}
                <Link to="/submissions" className="text-brand-500 hover:underline">
                  show all
                </Link>
              </>
            ) : (
              "Everything you've submitted, newest first."
            )}
          </p>
        </div>
        {data && <p className="text-sm text-slate-400">{data.total} total</p>}
      </div>

      {isLoading && <p className="text-slate-500">Loading submissions...</p>}
      {error && <p className="text-red-400">Could not load submissions.</p>}
      {data && data.items.length === 0 && <p className="text-slate-500">No submissions yet. Solve a problem and press Submit.</p>}

      {data && data.items.length > 0 && (
        <div className="border border-slate-800 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 text-slate-400 text-left">
              <tr>
                <th className="px-3 py-2">Problem</th>
                <th className="px-3 py-2">Result</th>
                <th className="px-3 py-2 hidden sm:table-cell">Tests</th>
                <th className="px-3 py-2 hidden sm:table-cell">Time</th>
                <th className="px-3 py-2">Submitted</th>
                <th className="px-3 py-2">
                  <span className="sr-only">Code</span>
                </th>
              </tr>
            </thead>
            {data.items.map((s) => (
              <tbody key={s.id} className="border-t border-slate-800">
                <tr className="hover:bg-slate-900/60">
                  <td className="px-3 py-2.5">
                    <Link to={`/problems/${s.problem.slug}`} className="text-slate-200 hover:text-brand-500">
                      {s.problem.title}
                    </Link>
                  </td>
                  <td className={`px-3 py-2.5 font-medium ${STATUS[s.status].className}`}>{STATUS[s.status].label}</td>
                  <td className="px-3 py-2.5 text-slate-400 tabular-nums hidden sm:table-cell">
                    {s.testsPassed}/{s.totalTests}
                  </td>
                  <td className="px-3 py-2.5 text-slate-500 tabular-nums hidden sm:table-cell">{s.executionTimeMs ?? "–"}ms</td>
                  <td className="px-3 py-2.5 text-slate-500">{new Date(s.createdAt).toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-right">
                    <button
                      aria-expanded={openId === s.id}
                      onClick={() => setOpenId(openId === s.id ? null : s.id)}
                      className="text-brand-500 hover:underline text-xs"
                    >
                      {openId === s.id ? "Hide code" : "View code"}
                    </button>
                  </td>
                </tr>
                {openId === s.id && (
                  <tr>
                    <td colSpan={6}>
                      <SubmissionCode id={s.id} />
                    </td>
                  </tr>
                )}
              </tbody>
            ))}
          </table>
        </div>
      )}

      {data && data.totalPages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-center gap-3 mt-4 text-sm">
          <button disabled={page <= 1} onClick={() => goTo(page - 1)} className="text-slate-300 disabled:text-slate-600">
            Previous
          </button>
          <span className="text-slate-500">
            Page {data.page} of {data.totalPages}
          </span>
          <button disabled={page >= data.totalPages} onClick={() => goTo(page + 1)} className="text-slate-300 disabled:text-slate-600">
            Next
          </button>
        </nav>
      )}
    </div>
  );
}
