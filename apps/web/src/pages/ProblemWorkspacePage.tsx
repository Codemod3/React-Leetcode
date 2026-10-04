import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Editor, { type BeforeMount, type OnMount } from "@monaco-editor/react";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Code2,
  FileText,
  History,
  Layers,
  Lightbulb,
  Maximize2,
  Play,
  RotateCcw,
  Save,
  Shuffle,
  UploadCloud,
  Wand2,
} from "lucide-react";
import type { ExecutionResult, ProblemDetail, ProblemSolution, ProblemSummary } from "@reactcode/shared";
import { api } from "../lib/api";
import { DIFFICULTY_FULL_LABEL, DIFFICULTY_PILL } from "../lib/difficulty";
import { LivePreview } from "../components/LivePreview";
import { TestResultsPanel } from "../components/TestResultsPanel";
import { Markdown } from "../components/Markdown";
import { useResizable } from "../hooks/useResizable";
import { SplitDivider } from "../components/SplitDivider";

type MonacoEditor = Parameters<OnMount>[0];

const configureMonaco: BeforeMount = (monaco) => {
  const ts = monaco.languages.typescript;
  ts.typescriptDefaults.setCompilerOptions({
    jsx: ts.JsxEmit.ReactJSX,
    target: ts.ScriptTarget.ES2020,
    allowNonTsExtensions: true,
    esModuleInterop: true,
  });
  ts.typescriptDefaults.setDiagnosticsOptions({ noSemanticValidation: true, noSyntaxValidation: false });

  // Custom LeetCode dark theme
  monaco.editor.defineTheme("leetcode-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "", background: "1e1e1e" },
      { token: "comment", foreground: "6a9955" },
      { token: "keyword", foreground: "569cd6" },
      { token: "string", foreground: "ce9178" },
      { token: "type", foreground: "4ec9b0" },
      { token: "function", foreground: "dcdcaa" },
    ],
    colors: {
      "editor.background": "#1e1e1e",
      "editor.lineHighlightBackground": "#282828",
      "editorLineNumber.foreground": "#5c5c5c",
      "editorLineNumber.activeForeground": "#eff2f6",
      "editorGutter.background": "#1e1e1e",
    },
  });
};

export function ProblemWorkspacePage() {
  const { slug } = useParams<{ slug: string }>();
  return <Workspace key={slug} slug={slug!} />;
}

function Workspace({ slug }: { slug: string }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const editorRef = useRef<MonacoEditor | null>(null);

  // Split resizers
  // 1. Horizontal: Left (Problem info) vs Right (Code, Preview, Console)
  const leftSplit = useResizable({
    initial: 44,
    min: 24,
    max: 70,
    storageKey: "rc-split-left-width",
    direction: "horizontal",
  });

  // 2. Vertical: Top (Editor + Preview) vs Bottom (Console)
  const verticalSplit = useResizable({
    initial: 62,
    min: 25,
    max: 82,
    storageKey: "rc-split-top-height",
    direction: "vertical",
  });

  // 3. Horizontal: Code Editor vs Live Preview
  const editorSplit = useResizable({
    initial: 52,
    min: 28,
    max: 75,
    storageKey: "rc-split-editor-width",
    direction: "horizontal",
  });

  // Problem queries
  const { data: problem, isLoading, error } = useQuery({
    queryKey: ["problem", slug],
    queryFn: () => api.get<ProblemDetail>(`/problems/${slug}`),
  });

  const { data: allProblems } = useQuery({
    queryKey: ["problems"],
    queryFn: () => api.get<ProblemSummary[]>("/problems"),
  });

  const [activeLeftTab, setActiveLeftTab] = useState<"description" | "editorial" | "submissions">("description");
  const [code, setCode] = useState<string | null>(null);
  const [previewVersion, setPreviewVersion] = useState(0);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [lastMode, setLastMode] = useState<"RUN" | "SUBMIT" | null>(null);
  const [revealedHints, setRevealedHints] = useState(0);
  const [solution, setSolution] = useState<ProblemSolution | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [staleDraftDismissed, setStaleDraftDismissed] = useState(false);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const codeRef = useRef<string | null>(null);
  codeRef.current = code;

  useEffect(() => {
    if (problem && code === null) {
      setCode(problem.savedCode ?? problem.starterCode);
      setPreviewVersion((v) => v + 1);
    }
  }, [problem, code]);

  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
  }, []);

  const saveMutation = useMutation({
    mutationFn: (newCode: string) => api.put(`/problems/${slug}/progress`, { code: newCode }),
    onSuccess: () => setSaveState("saved"),
  });

  const runMutation = useMutation({
    mutationFn: (newCode: string) => api.post<ExecutionResult>(`/problems/${slug}/run`, { code: newCode }),
    onSuccess: (r) => {
      setResult(r);
      setLastMode("RUN");
    },
  });

  const submitMutation = useMutation({
    mutationFn: (newCode: string) =>
      api.post<{ submissionId: string; result: ExecutionResult }>(`/problems/${slug}/submit`, { code: newCode }),
    onSuccess: ({ result: r }) => {
      setResult(r);
      setLastMode("SUBMIT");
      queryClient.invalidateQueries({ queryKey: ["problems"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["problem", slug] });
    },
  });

  function saveNow(value: string) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveState("saving");
    saveMutation.mutate(value);
  }

  function onCodeChange(value: string | undefined) {
    const next = value ?? "";
    setCode(next);
    setSaveState("idle");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveNow(next), 1000);
  }

  const onEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (codeRef.current !== null) saveNow(codeRef.current);
    });
  };

  function handleRun() {
    if (code === null) return;
    setPreviewVersion((v) => v + 1);
    runMutation.mutate(code);
  }

  function handleSubmit() {
    if (code === null) return;
    setPreviewVersion((v) => v + 1);
    submitMutation.mutate(code);
  }

  function handleReset() {
    if (!problem) return;
    if (!window.confirm("Reset code to the original starter code? This cannot be undone.")) return;
    setCode(problem.starterCode);
    setPreviewVersion((v) => v + 1);
    setResult(null);
    saveNow(problem.starterCode);
  }

  async function handleLoadEditorial() {
    setActiveLeftTab("editorial");
    if (!solution) {
      const res = await api.get<ProblemSolution>(`/problems/${slug}/solution`);
      setSolution(res);
    }
  }

  // Navigation between previous and next problem
  const currentIndex = allProblems ? allProblems.findIndex((p) => p.slug === slug) : -1;
  const prevProblem = currentIndex > 0 && allProblems ? allProblems[currentIndex - 1] : null;
  const nextProblem =
    currentIndex >= 0 && allProblems && currentIndex < allProblems.length - 1
      ? allProblems[currentIndex + 1]
      : null;

  const handleShuffle = () => {
    if (!allProblems || allProblems.length === 0) return;
    const random = allProblems[Math.floor(Math.random() * allProblems.length)];
    navigate(`/problems/${random.slug}`);
  };

  if (error) return <div className="p-8 text-[#ff375f] text-center">Could not load this problem.</div>;
  if (isLoading || !problem || code === null) {
    return (
      <div className="h-[calc(100vh-50px)] flex items-center justify-center bg-[#1a1a1a] text-[#8c8c8c]">
        Loading workspace...
      </div>
    );
  }

  const pending = runMutation.isPending || submitMutation.isPending;

  return (
    <div
      className={`h-[calc(100vh-50px)] flex flex-col bg-[#1a1a1a] overflow-hidden ${
        leftSplit.isDragging || verticalSplit.isDragging || editorSplit.isDragging ? "select-none" : ""
      }`}
    >
      {/* 1. Authentic LeetCode Top Action Bar */}
      <div className="h-11 px-3 border-b border-[#333333] bg-[#282828] flex items-center justify-between shrink-0 text-xs">
        {/* Left: Problem Navigator */}
        <div className="flex items-center gap-2">
          <Link
            to="/problems"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[#eff2f6] hover:bg-[#333333] transition-colors font-medium"
            title="Back to Problem List"
          >
            <Layers className="w-4 h-4 text-[#ffa116]" />
            <span className="hidden sm:inline">Problem List</span>
          </Link>

          <div className="flex items-center border-l border-[#3e3e3e] pl-2 gap-0.5">
            <button
              disabled={!prevProblem}
              onClick={() => prevProblem && navigate(`/problems/${prevProblem.slug}`)}
              title={prevProblem ? `Previous: ${prevProblem.title}` : "No previous problem"}
              className="p-1 rounded text-[#8c8c8c] hover:text-white hover:bg-[#333333] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={!nextProblem}
              onClick={() => nextProblem && navigate(`/problems/${nextProblem.slug}`)}
              title={nextProblem ? `Next: ${nextProblem.title}` : "No next problem"}
              className="p-1 rounded text-[#8c8c8c] hover:text-white hover:bg-[#333333] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleShuffle}
              title="Random Problem"
              className="p-1 rounded text-[#8c8c8c] hover:text-[#ffa116] hover:bg-[#333333] transition-colors"
            >
              <Shuffle className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Center: Run & Submit Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Run Button */}
          <button
            onClick={handleRun}
            disabled={pending}
            title="Run Code (public tests)"
            className="px-3.5 py-1.5 rounded-md bg-[#333333] hover:bg-[#3d3d3d] active:bg-[#444] text-[#eff2f6] font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 text-[#ffa116] fill-[#ffa116]" />
            <span>Run</span>
          </button>

          {/* Submit Button (LeetCode Green) */}
          <button
            onClick={handleSubmit}
            disabled={pending}
            title="Submit Solution (public + hidden tests)"
            className="px-4 py-1.5 rounded-md bg-[#2cbb5d] hover:bg-[#26a350] active:bg-[#208a43] text-white font-semibold flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
          >
            <UploadCloud className="w-4 h-4 stroke-[2.5]" />
            <span>Submit</span>
          </button>

          {/* Format Document Button */}
          <button
            onClick={() => editorRef.current?.getAction("editor.action.formatDocument")?.run()}
            title="Format Code"
            className="p-1.5 rounded text-[#8c8c8c] hover:text-white hover:bg-[#333333] transition-colors"
          >
            <Wand2 className="w-3.5 h-3.5" />
          </button>

          {/* Reset Code Button */}
          <button
            onClick={handleReset}
            title="Reset to Starter Code"
            className="p-1.5 rounded text-[#8c8c8c] hover:text-white hover:bg-[#333333] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Auto Save Status */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[11px] text-[#8c8c8c]">
            <Save className="w-3 h-3" />
            <span>{saveState === "saving" ? "Saving..." : saveState === "saved" ? "Saved" : "Auto"}</span>
          </span>
        </div>
      </div>

      {/* Stale Draft Alert */}
      {problem.staleDraft && !staleDraftDismissed && (
        <div className="flex items-center justify-between px-4 py-1.5 text-xs bg-[#2b1f14] border-b border-[#5e3814] text-[#ffc01e]">
          <span>This problem was updated; starting from latest starter code.</span>
          <div className="flex items-center gap-3">
            <button
              className="underline hover:text-white"
              onClick={() => {
                setCode(problem.staleDraft);
                setPreviewVersion((v) => v + 1);
                setStaleDraftDismissed(true);
              }}
            >
              Restore previous draft
            </button>
            <button onClick={() => setStaleDraftDismissed(true)} className="text-[#8c8c8c] hover:text-white">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* 2. Main Resizable 3-Way Layout Container */}
      <div
        ref={leftSplit.containerRef}
        className="flex-1 flex flex-row min-h-0 p-1.5 gap-0 overflow-hidden relative"
      >
        {/* LEFT PANE: Description / Editorial / Submissions */}
        <div
          style={{ width: `${leftSplit.size}%` }}
          className="h-full flex flex-col bg-[#262626] rounded-lg border border-[#333333] overflow-hidden min-w-[200px]"
        >
          {/* Tabs Bar */}
          <div className="h-9 px-2 flex items-center justify-between border-b border-[#333333] bg-[#282828] shrink-0 text-xs">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveLeftTab("description")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-medium transition-colors ${
                  activeLeftTab === "description"
                    ? "bg-[#333333] text-white"
                    : "text-[#8c8c8c] hover:text-white hover:bg-[#303030]"
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-[#ffa116]" />
                <span>Description</span>
              </button>

              <button
                onClick={handleLoadEditorial}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-medium transition-colors ${
                  activeLeftTab === "editorial"
                    ? "bg-[#333333] text-white"
                    : "text-[#8c8c8c] hover:text-white hover:bg-[#303030]"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-[#00b8a3]" />
                <span>Editorial</span>
              </button>

              <button
                onClick={() => setActiveLeftTab("submissions")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-medium transition-colors ${
                  activeLeftTab === "submissions"
                    ? "bg-[#333333] text-white"
                    : "text-[#8c8c8c] hover:text-white hover:bg-[#303030]"
                }`}
              >
                <History className="w-3.5 h-3.5 text-[#ffc01e]" />
                <span>Submissions</span>
              </button>
            </div>

            <button
              onClick={leftSplit.resetSize}
              title="Reset Pane Width (Double click splitter)"
              className="p-1 rounded text-[#8c8c8c] hover:text-white hover:bg-[#333333]"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Left Tab Body */}
          <div className="flex-1 overflow-auto p-5 text-sm space-y-6 text-[#eff2f6] select-text">
            {activeLeftTab === "description" && (
              <>
                {/* Title & Solved Status */}
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <h1 className="text-xl font-bold text-white tracking-tight">
                      {problem.order}. {problem.title}
                    </h1>
                    {problem.status === "SOLVED" && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-[#2cbb5d] bg-[#2cbb5d]/10 border border-[#2cbb5d]/20 px-2 py-0.5 rounded-full shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" /> Solved
                      </span>
                    )}
                  </div>

                  {/* Real Tags and Difficulty */}
                  <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
                    <span className={`px-2.5 py-0.5 rounded-full font-medium ${DIFFICULTY_PILL[problem.difficulty]}`}>
                      {DIFFICULTY_FULL_LABEL[problem.difficulty]}
                    </span>

                    {problem.tags.map((t) => (
                      <span
                        key={t}
                        className="bg-[#2f2f2f] text-[#9ca3af] px-2.5 py-0.5 rounded-full border border-[#3e3e3e] text-xs"
                      >
                        {t}
                      </span>
                    ))}

                    {problem.problemType !== "BUILD" && (
                      <span className="text-[10px] uppercase font-semibold text-[#8c8c8c] border border-[#383838] bg-[#1f1f1f] rounded px-1.5 py-0.5">
                        {problem.problemType}
                      </span>
                    )}
                  </div>
                </div>

                {/* Markdown Description */}
                <div className="text-sm text-[#eff2f6] leading-relaxed">
                  <Markdown>{problem.description}</Markdown>
                </div>

                {/* Requirements */}
                {problem.requirements && problem.requirements.length > 0 && (
                  <div className="space-y-2">
                    <h2 className="text-xs font-semibold text-[#8c8c8c] uppercase tracking-wider">
                      Requirements:
                    </h2>
                    <ul className="space-y-1.5 text-xs text-[#eff2f6]">
                      {problem.requirements.map((req, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-[#ffa116] font-bold">•</span>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Hints Collapsible */}
                {problem.hints && problem.hints.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-[#333333]">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[#ffa116]">
                      <Lightbulb className="w-3.5 h-3.5" />
                      <span>Hints ({problem.hints.length})</span>
                    </div>

                    <div className="space-y-2">
                      {problem.hints.slice(0, revealedHints).map((h, i) => (
                        <div key={i} className="p-3 bg-[#1e1e1e] border border-[#333333] rounded-lg text-xs space-y-1">
                          <span className="text-[#ffa116] font-semibold block">Hint {i + 1}</span>
                          <Markdown>{h}</Markdown>
                        </div>
                      ))}

                      {revealedHints < problem.hints.length && (
                        <button
                          onClick={() => setRevealedHints((n) => n + 1)}
                          className="text-xs text-[#ffa116] hover:underline flex items-center gap-1 font-medium"
                        >
                          Show Hint {revealedHints + 1} of {problem.hints.length} →
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Real Problem Navigation Footer */}
                {problem.nextProblem && (
                  <div className="pt-6 border-t border-[#333333] flex items-center justify-between text-xs text-[#8c8c8c]">
                    <span>Ready for the next challenge?</span>
                    <Link
                      to={`/problems/${problem.nextProblem.slug}`}
                      className="flex items-center gap-1.5 text-[#ffa116] hover:underline font-medium"
                    >
                      Next: {problem.nextProblem.title} <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </>
            )}

            {/* Editorial / Solutions Tab */}
            {activeLeftTab === "editorial" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#333333]">
                  <h2 className="text-base font-semibold text-white">Official Solution</h2>
                  <span className="text-xs text-[#8c8c8c]">React 18 + TS</span>
                </div>

                {!solution ? (
                  <div className="py-8 text-center text-[#8c8c8c] text-xs">
                    Loading editorial solution...
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-xs font-semibold text-[#ffa116] uppercase tracking-wider">
                        Solution Code
                      </h3>
                      <pre className="bg-[#1e1e1e] border border-[#333333] rounded-lg p-3 text-xs font-mono text-[#eff2f6] overflow-auto max-h-80">
                        {solution.solutionCode}
                      </pre>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-xs font-semibold text-[#00b8a3] uppercase tracking-wider">
                        Why it works
                      </h3>
                      <div className="text-xs text-[#eff2f6] leading-relaxed">
                        <Markdown>{solution.explanation}</Markdown>
                      </div>
                    </div>

                    {solution.commonMistakes.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-xs font-semibold text-[#ff375f] uppercase tracking-wider">
                          Common Pitfalls
                        </h3>
                        <ul className="space-y-1 text-xs text-[#eff2f6]">
                          {solution.commonMistakes.map((m, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-[#ff375f]">✕</span>
                              <span>{m}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Submissions Tab */}
            {activeLeftTab === "submissions" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#333333]">
                  <h2 className="text-base font-semibold text-white">Your Submissions</h2>
                  <Link
                    to={`/submissions?problem=${slug}`}
                    className="text-xs text-[#ffa116] hover:underline"
                  >
                    View all in full page →
                  </Link>
                </div>

                {problem.attempts === 0 ? (
                  <div className="py-8 text-center text-xs text-[#8c8c8c]">
                    No submissions yet. Write code and hit <strong className="text-[#2cbb5d]">Submit</strong>!
                  </div>
                ) : (
                  <div className="p-3 bg-[#1e1e1e] border border-[#333333] rounded-lg text-xs space-y-1">
                    <p className="text-white font-medium">Attempts recorded: {problem.attempts}</p>
                    <p className="text-[#8c8c8c]">
                      Status: {problem.status === "SOLVED" ? "Accepted ✓" : "Attempted"}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* SPLIT DIVIDER 1: Horizontal Left vs Right */}
        <SplitDivider
          direction="horizontal"
          onMouseDown={leftSplit.startDragging}
          onDoubleClick={leftSplit.resetSize}
          isDragging={leftSplit.isDragging}
        />

        {/* RIGHT PANE: Code Editor + Live Preview (Top) & Console (Bottom) */}
        <div
          ref={verticalSplit.containerRef}
          style={{ width: `${100 - leftSplit.size}%` }}
          className="h-full flex flex-col min-w-[300px] overflow-hidden"
        >
          {/* TOP AREA: Split between Code Editor and Live Preview */}
          <div
            ref={editorSplit.containerRef}
            style={{ height: `${verticalSplit.size}%` }}
            className="flex flex-row min-h-[140px] overflow-hidden"
          >
            {/* CODE EDITOR CARD */}
            <div
              style={{ width: `${editorSplit.size}%` }}
              className="h-full flex flex-col bg-[#262626] rounded-lg border border-[#333333] overflow-hidden min-w-[180px]"
            >
              {/* Code Tab Header */}
              <div className="h-9 px-3 flex items-center justify-between border-b border-[#333333] bg-[#282828] text-xs shrink-0 select-none">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-[#2cbb5d] font-semibold">
                    <Code2 className="w-4 h-4" />
                    <span className="text-white">Code</span>
                  </div>
                  <span className="text-[11px] text-[#8c8c8c] bg-[#1e1e1e] px-2 py-0.5 rounded border border-[#383838]">
                    TypeScript (React 18)
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[#8c8c8c]">
                  <button
                    onClick={() => editorRef.current?.getAction("editor.action.formatDocument")?.run()}
                    title="Format Document (Shift+Alt+F)"
                    className="p-1 rounded hover:text-white hover:bg-[#333333] transition-colors"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleReset}
                    title="Reset to Template"
                    className="p-1 rounded hover:text-white hover:bg-[#333333] transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Monaco Editor Container */}
              <div className="flex-1 min-h-0 bg-[#1e1e1e]">
                <Editor
                  height="100%"
                  path={`file:///${slug}.tsx`}
                  defaultLanguage="typescript"
                  theme="leetcode-dark"
                  value={code}
                  onChange={onCodeChange}
                  beforeMount={configureMonaco}
                  onMount={onEditorMount}
                  options={{
                    fontSize: 13,
                    fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    tabSize: 2,
                    lineNumbersMinChars: 3,
                    automaticLayout: true,
                    renderLineHighlight: "all",
                    padding: { top: 8, bottom: 8 },
                  }}
                />
              </div>
            </div>

            {/* SPLIT DIVIDER 3: Horizontal Editor vs Live Preview */}
            <SplitDivider
              direction="horizontal"
              onMouseDown={editorSplit.startDragging}
              onDoubleClick={editorSplit.resetSize}
              isDragging={editorSplit.isDragging}
            />

            {/* LIVE PREVIEW CARD */}
            <div
              style={{ width: `${100 - editorSplit.size}%` }}
              className="h-full flex flex-col rounded-lg overflow-hidden min-w-[150px]"
            >
              <LivePreview
                code={code}
                version={previewVersion}
                mockApi={problem.mockApi}
                previewProps={problem.environment.previewProps}
                noPreviewReason={
                  problem.problemType === "TEST"
                    ? "This is a test-writing problem. No UI preview. Use Run to evaluate."
                    : problem.type === "CUSTOM_HOOK"
                      ? "This is a custom hook problem. No UI preview. Use Run to test it."
                      : null
                }
              />
            </div>
          </div>

          {/* SPLIT DIVIDER 2: Vertical Editor/Preview vs Bottom Console */}
          <SplitDivider
            direction="vertical"
            onMouseDown={verticalSplit.startDragging}
            onDoubleClick={verticalSplit.resetSize}
            isDragging={verticalSplit.isDragging}
          />

          {/* BOTTOM AREA: Test Console (Testcase & Test Result) */}
          <div
            style={{ height: `${100 - verticalSplit.size}%` }}
            className="flex-1 rounded-lg border border-[#333333] overflow-hidden min-h-[90px]"
          >
            <TestResultsPanel
              result={result}
              pending={pending}
              publicTests={problem.publicTests}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
