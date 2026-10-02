import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Editor, { type BeforeMount, type OnMount } from "@monaco-editor/react";
import {
  AlertTriangle,
  ArrowRight,
  Bookmark,
  CheckCircle2,
  Eye,
  Lightbulb,
  Play,
  RotateCcw,
  Save,
  UploadCloud,
  Wand2,
} from "lucide-react";
import type { ExecutionResult, ProblemDetail, ProblemSolution } from "@reactcode/shared";
import { api } from "../lib/api";
import { DIFFICULTY_COLOR, DIFFICULTY_LABEL } from "../lib/difficulty";
import { LivePreview } from "../components/LivePreview";
import { TestResultsPanel } from "../components/TestResultsPanel";
import { Markdown } from "../components/Markdown";

type MonacoEditor = Parameters<OnMount>[0];

// Monaco has no React type definitions here, so semantic checks would flag every
// import from "react". Keep syntax errors (the useful part) and switch semantic ones off.
const configureMonaco: BeforeMount = (monaco) => {
  const ts = monaco.languages.typescript;
  ts.typescriptDefaults.setCompilerOptions({
    jsx: ts.JsxEmit.ReactJSX,
    target: ts.ScriptTarget.ES2020,
    allowNonTsExtensions: true,
    esModuleInterop: true,
  });
  ts.typescriptDefaults.setDiagnosticsOptions({ noSemanticValidation: true, noSyntaxValidation: false });
};

const sectionTitle = "text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5";

export function ProblemWorkspacePage() {
  const { slug } = useParams<{ slug: string }>();
  // Keying by slug gives every problem a fresh workspace (code, results, hints).
  return <Workspace key={slug} slug={slug!} />;
}

function Workspace({ slug }: { slug: string }) {
  const queryClient = useQueryClient();
  const editorRef = useRef<MonacoEditor | null>(null);

  const { data: problem, isLoading, error } = useQuery({
    queryKey: ["problem", slug],
    queryFn: () => api.get<ProblemDetail>(`/problems/${slug}`),
  });

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

  const bookmarkMutation = useMutation({
    mutationFn: (bookmarked: boolean) => api.put(`/problems/${slug}/progress`, { bookmarked }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["problem", slug] });
      queryClient.invalidateQueries({ queryKey: ["problems"] });
    },
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
    if (!window.confirm("Reset your code to the original starter code? This cannot be undone.")) return;
    setCode(problem.starterCode);
    setPreviewVersion((v) => v + 1);
    setResult(null);
    saveNow(problem.starterCode);
  }

  async function handleViewSolution() {
    if (!window.confirm("Are you sure you want to view the solution? Try the hints first if you haven't.")) return;
    setSolution(await api.get<ProblemSolution>(`/problems/${slug}/solution`));
  }

  if (error) return <div className="p-8 text-red-400">Could not load this problem.</div>;
  if (isLoading || !problem || code === null) return <div className="p-8 text-slate-400">Loading problem...</div>;

  const pending = runMutation.isPending || submitMutation.isPending;
  const solvedNow = lastMode === "SUBMIT" && result?.status === "PASSED";

  return (
    <div className="lg:h-[calc(100vh-57px)] grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      {/* Problem description */}
      <div className="border-b lg:border-b-0 lg:border-r border-slate-800 overflow-auto p-6 space-y-6">
        <div>
          <p className="text-xs text-slate-500 mb-1">
            #{problem.order} · Level {problem.level}: {problem.category}
            {problem.estimatedMinutes ? ` · ~${problem.estimatedMinutes} min` : ""}
          </p>
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl font-semibold text-white">{problem.title}</h1>
            <button
              onClick={() => bookmarkMutation.mutate(!problem.bookmarked)}
              aria-pressed={problem.bookmarked}
              aria-label={problem.bookmarked ? "Remove bookmark" : "Bookmark this problem"}
              className="text-slate-500 hover:text-brand-500 shrink-0"
            >
              <Bookmark className={`w-5 h-5 ${problem.bookmarked ? "fill-brand-500 text-brand-500" : ""}`} />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
            <span className={`font-medium ${DIFFICULTY_COLOR[problem.difficulty]}`}>{DIFFICULTY_LABEL[problem.difficulty]}</span>
            {problem.problemType !== "BUILD" && (
              <span className="uppercase tracking-wide text-slate-400 border border-slate-700 rounded px-1.5">{problem.problemType}</span>
            )}
            {problem.status === "SOLVED" && (
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> Solved
              </span>
            )}
            {problem.tags.map((t) => (
              <span key={t} className="bg-slate-800 text-slate-400 rounded px-1.5 py-0.5">
                {t}
              </span>
            ))}
          </div>
        </div>

        {problem.prerequisites.length > 0 && (
          <section>
            <h2 className={sectionTitle}>Recommended first</h2>
            <ul className="flex flex-wrap gap-2 text-xs">
              {problem.prerequisites.map((p) => (
                <li
                  key={p.category}
                  className={`flex items-center gap-1 rounded px-2 py-0.5 border ${
                    p.met ? "border-emerald-900 text-emerald-400" : "border-amber-900 text-amber-400"
                  }`}
                >
                  {p.met ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                  {p.category}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h2 className={sectionTitle}>Description</h2>
          <Markdown>{problem.description}</Markdown>
        </section>

        <section>
          <h2 className={sectionTitle}>Requirements</h2>
          <ul className="space-y-1">
            {problem.requirements.map((r) => (
              <li key={r} className="text-sm text-slate-300 flex items-start gap-2">
                <span className="text-slate-600">•</span> {r}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className={sectionTitle}>Tests</h2>
          <ul className="space-y-1 text-sm text-slate-400">
            {problem.publicTests.map((t) => (
              <li key={t.id}>✓ {t.name}</li>
            ))}
            <li className="text-slate-600">+ hidden tests that run on Submit</li>
          </ul>
        </section>

        <section>
          <h2 className={sectionTitle}>
            <Lightbulb className="w-3.5 h-3.5" /> Hints
          </h2>
          <div className="space-y-2">
            {problem.hints.slice(0, revealedHints).map((h, i) => (
              <div key={i} className="text-sm text-slate-300 bg-slate-900 border border-slate-800 rounded px-3 py-2">
                <span className="text-slate-500 text-xs block mb-0.5">Hint {i + 1}</span>
                <Markdown>{h}</Markdown>
              </div>
            ))}
            {revealedHints < problem.hints.length && (
              <button onClick={() => setRevealedHints((n) => n + 1)} className="text-sm text-brand-500 hover:underline">
                Show hint {revealedHints + 1} of {problem.hints.length}
              </button>
            )}
          </div>
        </section>

        <section className="space-y-3">
          {!solution ? (
            <button
              onClick={handleViewSolution}
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white border border-slate-800 rounded px-3 py-1.5"
            >
              <Eye className="w-4 h-4" /> View Solution
            </button>
          ) : (
            <>
              <h2 className={sectionTitle}>Official solution</h2>
              <pre className="bg-slate-900 border border-slate-800 rounded p-3 text-xs text-slate-200 overflow-auto">
                {solution.solutionCode}
              </pre>
              <div>
                <h3 className="text-sm font-medium text-slate-200 mb-1">Why it works</h3>
                <Markdown>{solution.explanation}</Markdown>
              </div>
              {solution.commonMistakes.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-slate-200 mb-1">Common mistakes</h3>
                  <Markdown>{solution.commonMistakes.map((m) => `- ${m}`).join("\n")}</Markdown>
                </div>
              )}
              {solution.alternativeApproach && (
                <div>
                  <h3 className="text-sm font-medium text-slate-200 mb-1">Alternative approach</h3>
                  <Markdown>{solution.alternativeApproach}</Markdown>
                </div>
              )}
            </>
          )}
        </section>

        <div className="flex flex-wrap items-center justify-between gap-2">
          {problem.attempts > 0 && (
            <Link to={`/submissions?problem=${problem.slug}`} className="text-sm text-slate-400 hover:text-brand-500">
              Your submissions ({problem.attempts})
            </Link>
          )}
          {problem.nextProblem && (
            <Link
              to={`/problems/${problem.nextProblem.slug}`}
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-brand-500"
            >
              Next: {problem.nextProblem.title} <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Editor, preview, results */}
      <div className="grid grid-rows-[auto_minmax(420px,1fr)_minmax(200px,1fr)] lg:grid-rows-[auto_1fr_1fr] min-h-0">
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-slate-800 bg-slate-900 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={handleRun}
              disabled={pending}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" /> Run
            </button>
            <button
              onClick={handleSubmit}
              disabled={pending}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded bg-brand-600 hover:bg-brand-500 text-white disabled:opacity-50"
            >
              <UploadCloud className="w-3.5 h-3.5" /> Submit
            </button>
            <button
              onClick={() => editorRef.current?.getAction("editor.action.formatDocument")?.run()}
              className="flex items-center gap-1.5 text-sm px-2 py-1.5 rounded text-slate-400 hover:text-white"
            >
              <Wand2 className="w-3.5 h-3.5" /> Format
            </button>
            <button onClick={handleReset} className="flex items-center gap-1.5 text-sm px-2 py-1.5 rounded text-slate-400 hover:text-white">
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-slate-500" aria-live="polite">
            <Save className="w-3.5 h-3.5" />
            {saveState === "saving" ? "Saving..." : saveState === "saved" ? "Saved" : "Ctrl+S to save"}
          </span>
        </div>

        {problem.staleDraft && !staleDraftDismissed && (
          <div role="status" className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs bg-amber-950/40 border-b border-amber-900 text-amber-200">
            <span>This problem was updated since you last worked on it, so you're starting from the new starter code.</span>
            <span className="flex gap-3">
              <button
                className="underline hover:text-white"
                onClick={() => {
                  setCode(problem.staleDraft);
                  setPreviewVersion((v) => v + 1);
                  setStaleDraftDismissed(true);
                }}
              >
                Restore my previous draft
              </button>
              <button className="text-amber-400 hover:text-white" onClick={() => setStaleDraftDismissed(true)}>
                Dismiss
              </button>
            </span>
          </div>
        )}

        <div className="min-h-0 grid grid-cols-1 md:grid-cols-2">
          <div className="min-h-[300px]">
            <Editor
              height="100%"
              path={`file:///${slug}.tsx`}
              defaultLanguage="typescript"
              theme="vs-dark"
              value={code}
              onChange={onCodeChange}
              beforeMount={configureMonaco}
              onMount={onEditorMount}
              options={{
                fontSize: 13,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                tabSize: 2,
                automaticLayout: true,
              }}
            />
          </div>
          <LivePreview
            code={code}
            version={previewVersion}
            mockApi={problem.mockApi}
            previewProps={problem.environment.previewProps}
            noPreviewReason={
              problem.problemType === "TEST"
                ? "In this problem you write a test, which has no UI of its own. Use Run to grade it."
                : problem.type === "CUSTOM_HOOK"
                  ? "This problem asks for a custom hook, which has no UI of its own. Use Run to test it."
                  : null
            }
          />
        </div>

        <div className="border-t border-slate-800 min-h-0 overflow-auto">
          {solvedNow && problem.nextProblem && (
            <div className="flex items-center justify-between gap-2 px-4 py-2 bg-emerald-950/40 border-b border-emerald-900 text-sm">
              <span className="text-emerald-300">Solved! Ready for the next one?</span>
              <Link
                to={`/problems/${problem.nextProblem.slug}`}
                className="flex items-center gap-1 text-emerald-300 hover:text-white font-medium"
              >
                {problem.nextProblem.title} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
          <TestResultsPanel result={result} pending={pending} />
        </div>
      </div>
    </div>
  );
}
