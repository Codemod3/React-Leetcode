import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { ExecutionStatus, SubmissionDetail, SubmissionPage } from "@reactcode/shared";
import { api } from "../lib/api";
import { CheckCircle2, ChevronLeft, ChevronRight, XCircle } from "lucide-react";

const STATUS: Record<ExecutionStatus, { label: string; className: string; icon: "check" | "x" }> = {
  PASSED: { label: "Accepted", className: "text-[#2cbb5d]", icon: "check" },
  FAILED: { label: "Wrong Answer", className: "text-[#ff375f]", icon: "x" },
  COMPILE_ERROR: { label: "Compile Error", className: "text-[#ffc01e]", icon: "x" },
  RUNTIME_ERROR: { label: "Runtime Error", className: "text-[#ffc01e]", icon: "x" },
  TIMEOUT: { label: "Time Limit Exceeded", className: "text-[#ffc01e]", icon: "x" },
};

function SubmissionCode({ id }: { id: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["submission", id],
    queryFn: () => api.get<SubmissionDetail>(`/submissions/${id}`),
  });
  if (isLoading || !data) return <p className="text-[#8c8c8c] text-xs px-4 py-3">Loading submitted code...</p>;
  return (
    <div className="px-4 pb-4 pt-1 space-y-2 bg-[#1e1e1e]">
      {data.errorMessage && (
        <p className="text-xs text-[#ff8080] bg-[#2b1b1e] border border-[#55272e] rounded p-2.5 font-mono whitespace-pre-wrap">
          {data.errorMessage}
        </p>
      )}
      <pre aria-label="Submitted code" className="bg-[#181818] border border-[#333333] rounded-lg p-3 text-xs font-mono text-[#eff2f6] overflow-auto max-h-96">
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-2 pb-4 border-b border-[#333333]">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Submissions</h1>
          <p className="text-xs text-[#8c8c8c] mt-1">
            {problem ? (
              <>
                Filtered for <span className="text-white font-medium">{data?.items[0]?.problem.title ?? problem}</span> ·{" "}
                <Link to="/submissions" className="text-[#ffa116] hover:underline">
                  Show all
                </Link>
              </>
            ) : (
              "Complete log of submitted runs, newest first."
            )}
          </p>
        </div>
        {data && <p className="text-xs text-[#8c8c8c]">{data.total} total records</p>}
      </div>

      {isLoading && <p className="text-[#8c8c8c] text-sm text-center py-8">Loading submissions...</p>}
      {error && <p className="text-[#ff375f] text-sm text-center py-8">Could not load submissions.</p>}
      {data && data.items.length === 0 && (
        <div className="text-center py-12 bg-[#262626] rounded-lg border border-[#333333] text-[#8c8c8c] text-sm">
          No submissions found. Solve a problem and click <strong className="text-[#2cbb5d]">Submit</strong>.
        </div>
      )}

      {data && data.items.length > 0 && (
        <div className="border border-[#333333] rounded-lg overflow-hidden bg-[#262626]">
          <table className="w-full text-xs">
            <thead className="bg-[#282828] text-[#8c8c8c] border-b border-[#333333] text-left">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Problem</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
                <th className="px-4 py-2.5 font-semibold hidden sm:table-cell">Tests Passed</th>
                <th className="px-4 py-2.5 font-semibold hidden sm:table-cell">Runtime</th>
                <th className="px-4 py-2.5 font-semibold">Date</th>
                <th className="px-4 py-2.5 text-right font-semibold">Code</th>
              </tr>
            </thead>
            {data.items.map((s) => {
              const statusCfg = STATUS[s.status];
              return (
                <tbody key={s.id} className="border-t border-[#333333]">
                  <tr className="hover:bg-[#2e2e2e] transition-colors">
                    <td className="px-4 py-3">
                      <Link to={`/problems/${s.problem.slug}`} className="text-white hover:text-[#ffa116] font-medium">
                        {s.problem.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 font-semibold ${statusCfg.className}`}>
                        {statusCfg.icon === "check" ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5" />
                        )}
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#eff2f6] tabular-nums hidden sm:table-cell">
                      {s.testsPassed} / {s.totalTests}
                    </td>
                    <td className="px-4 py-3 text-[#00b8a3] tabular-nums hidden sm:table-cell">
                      {s.executionTimeMs ?? "–"} ms
                    </td>
                    <td className="px-4 py-3 text-[#8c8c8c]">{new Date(s.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setOpenId(openId === s.id ? null : s.id)}
                        className="text-[#ffa116] hover:underline font-medium"
                      >
                        {openId === s.id ? "Hide" : "View"}
                      </button>
                    </td>
                  </tr>
                  {openId === s.id && (
                    <tr>
                      <td colSpan={6} className="p-0 border-t border-[#383838]">
                        <SubmissionCode id={s.id} />
                      </td>
                    </tr>
                  )}
                </tbody>
              );
            })}
          </table>
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-2 text-xs">
          <button
            disabled={page <= 1}
            onClick={() => goTo(page - 1)}
            className="flex items-center gap-1 px-3 py-1.5 rounded bg-[#282828] text-white hover:bg-[#333] disabled:opacity-40 disabled:hover:bg-[#282828]"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Previous
          </button>
          <span className="text-[#8c8c8c]">
            Page {data.page} of {data.totalPages}
          </span>
          <button
            disabled={page >= data.totalPages}
            onClick={() => goTo(page + 1)}
            className="flex items-center gap-1 px-3 py-1.5 rounded bg-[#282828] text-white hover:bg-[#333] disabled:opacity-40 disabled:hover:bg-[#282828]"
          >
            Next <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
