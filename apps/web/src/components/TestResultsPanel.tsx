import { useState } from "react";
import { Check, CheckCircle2, Clock, X, XCircle, AlertTriangle, Terminal, Layers } from "lucide-react";
import type { ExecutionResult } from "@reactcode/shared";

interface TestResultsPanelProps {
  result: ExecutionResult | null;
  pending: boolean;
  publicTests?: { id: string; name: string }[];
}

export function TestResultsPanel({ result, pending, publicTests = [] }: TestResultsPanelProps) {
  const [activeTab, setActiveTab] = useState<"testcase" | "result">("result");
  const [selectedCaseIndex, setSelectedCaseIndex] = useState(0);

  // If result arrived, automatically switch to result tab
  return (
    <div className="h-full flex flex-col min-h-0 bg-[#262626] text-[#eff2f6]">
      {/* LeetCode Test Console Header Tabs */}
      <div className="h-9 px-3 flex items-center justify-between border-b border-[#333333] bg-[#282828] select-none shrink-0">
        <div className="flex items-center gap-2">
          {/* Testcase Tab */}
          <button
            onClick={() => setActiveTab("testcase")}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              activeTab === "testcase"
                ? "bg-[#333333] text-white"
                : "text-[#8c8c8c] hover:text-white hover:bg-[#303030]"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#00b8a3]" />
            <span>Testcase</span>
          </button>

          {/* Test Result Tab */}
          <button
            onClick={() => setActiveTab("result")}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              activeTab === "result"
                ? "bg-[#333333] text-white"
                : "text-[#8c8c8c] hover:text-white hover:bg-[#303030]"
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-[#ffa116]" />
            <span>Test Result</span>
            {result && (
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  result.status === "PASSED" ? "bg-[#2cbb5d]" : "bg-[#ff375f]"
                }`}
              />
            )}
          </button>
        </div>

        {result && (
          <span className="text-[11px] text-[#8c8c8c] tabular-nums hidden sm:inline">
            Runtime: <strong className="text-white font-medium">{result.executionTimeMs} ms</strong>
          </span>
        )}
      </div>

      {/* Panel Body */}
      <div className="flex-1 overflow-auto p-4 min-h-0">
        {pending ? (
          <div className="h-full flex flex-col items-center justify-center text-sm text-[#8c8c8c] gap-2">
            <Clock className="w-5 h-5 animate-spin text-[#ffa116]" />
            <span>Evaluating your React code...</span>
          </div>
        ) : activeTab === "testcase" ? (
          /* Testcase View */
          <div className="space-y-3">
            <div className="text-xs text-[#8c8c8c]">Public test specs:</div>
            <div className="flex flex-wrap gap-2">
              {publicTests.map((t, idx) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedCaseIndex(idx)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    selectedCaseIndex === idx
                      ? "bg-[#383838] text-white border border-[#ffa116]"
                      : "bg-[#2f2f2f] text-[#8c8c8c] hover:text-white hover:bg-[#353535]"
                  }`}
                >
                  Case {idx + 1}
                </button>
              ))}
            </div>

            {publicTests[selectedCaseIndex] && (
              <div className="bg-[#1e1e1e] border border-[#333333] rounded-lg p-3 space-y-2">
                <span className="text-xs text-[#8c8c8c] block">Assertion:</span>
                <p className="text-xs font-mono text-[#eff2f6]">{publicTests[selectedCaseIndex].name}</p>
              </div>
            )}
          </div>
        ) : !result ? (
          /* Empty State matching Image 2 */
          <div className="h-full flex items-center justify-center text-sm text-[#8c8c8c]">
            You must run your code first
          </div>
        ) : (
          /* Test Result View matching LeetCode */
          <div className="space-y-4">
            {/* Status Headline */}
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-[#333333]">
              <div className="flex items-center gap-2">
                {result.status === "PASSED" ? (
                  <span className="text-xl font-bold text-[#2cbb5d] flex items-center gap-1.5">
                    <Check className="w-5 h-5 stroke-[3]" /> Accepted
                  </span>
                ) : (
                  <span className="text-xl font-bold text-[#ff375f] flex items-center gap-1.5">
                    <X className="w-5 h-5 stroke-[3]" />
                    {result.status === "FAILED" ? "Wrong Answer" : result.status.replace(/_/g, " ")}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs text-[#8c8c8c]">
                <span>
                  Passed: <strong className="text-white">{result.testsPassed}</strong> / {result.totalTests}
                </span>
                <span>
                  Runtime: <strong className="text-[#00b8a3]">{result.executionTimeMs} ms</strong>
                </span>
              </div>
            </div>

            {/* Error Banner */}
            {result.error && (
              <div className="bg-[#2c1517] border border-[#521c21] rounded-lg p-3 text-xs text-[#ff8080] font-mono whitespace-pre-wrap flex gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-[#ff375f] mt-0.5" />
                <span className="break-all">{result.error.message}</span>
              </div>
            )}

            {/* Test Cases Results List */}
            <div className="space-y-2">
              {result.tests.map((t, idx) => (
                <div
                  key={t.id}
                  className={`border rounded-lg p-3 transition-colors ${
                    t.passed
                      ? "bg-[#1f2922] border-[#25462f]"
                      : "bg-[#2b1b1e] border-[#55272e]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {t.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-[#2cbb5d] shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-[#ff375f] shrink-0" />
                      )}
                      <span className="text-xs font-medium text-white">
                        Test #{idx + 1}: {t.name}
                      </span>
                    </div>
                    {t.hidden && (
                      <span className="text-[10px] text-[#8c8c8c] bg-[#1a1a1a] px-1.5 py-0.5 rounded border border-[#333333]">
                        hidden test
                      </span>
                    )}
                  </div>

                  {!t.passed && t.error && (
                    <div className="mt-2 text-xs font-mono text-[#ff8080] bg-[#1a1a1a] p-2 rounded border border-[#442226] whitespace-pre-wrap break-all">
                      {t.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
