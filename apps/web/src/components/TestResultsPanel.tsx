import { CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react";
import type { ExecutionResult } from "@reactcode/shared";

const statusCopy: Record<ExecutionResult["status"], { label: string; className: string }> = {
  PASSED: { label: "Accepted", className: "text-emerald-400" },
  FAILED: { label: "Wrong Answer", className: "text-red-400" },
  COMPILE_ERROR: { label: "Compilation Error", className: "text-amber-400" },
  RUNTIME_ERROR: { label: "Runtime Error", className: "text-amber-400" },
  TIMEOUT: { label: "Time Limit Exceeded", className: "text-amber-400" },
};

export function TestResultsPanel({ result, pending }: { result: ExecutionResult | null; pending: boolean }) {
  if (pending) {
    return (
      <div className="p-4 text-sm text-slate-400 flex items-center gap-2">
        <Clock className="w-4 h-4 animate-spin" /> Running your code...
      </div>
    );
  }

  if (!result) {
    return <div className="p-4 text-sm text-slate-500">Run your code to see results here.</div>;
  }

  const status = statusCopy[result.status];

  return (
    <div className="p-4 space-y-3 overflow-auto h-full">
      <div className={`flex items-center gap-2 font-semibold ${status.className}`}>
        {result.status === "PASSED" ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
        {status.label}
        {result.totalTests > 0 && (
          <span className="text-slate-400 text-sm font-normal">
            · {result.testsPassed} / {result.totalTests} tests passed · {result.executionTimeMs}ms
          </span>
        )}
      </div>

      {result.error && (
        <div className="bg-amber-950/40 border border-amber-900 rounded px-3 py-2 text-amber-300 text-xs font-mono whitespace-pre-wrap flex gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{result.error.message}</span>
        </div>
      )}

      <div className="space-y-1.5">
        {result.tests.map((t) => (
          <div
            key={t.id}
            className="flex items-start gap-2 text-sm border border-slate-800 rounded px-3 py-2 bg-slate-900"
          >
            {t.passed ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            )}
            <div className="min-w-0">
              <p className="text-slate-200">
                {t.name}
                {t.hidden && <span className="ml-2 text-xs text-slate-500">(hidden)</span>}
              </p>
              {!t.passed && t.error && (
                <p className="text-red-400 text-xs font-mono mt-1 whitespace-pre-wrap">{t.error}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
