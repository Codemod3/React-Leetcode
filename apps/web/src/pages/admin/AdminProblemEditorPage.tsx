import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Editor from "@monaco-editor/react";
import { CheckCircle2, Plus, ShieldCheck, Trash2, XCircle } from "lucide-react";
import { DIFFICULTIES, type AdminProblem, type AdminProblemInput, type AdminProblemSummary, type VerificationReport } from "@reactcode/shared";
import { api, ApiError } from "../../lib/api";
import { DIFFICULTY_LABEL } from "../../lib/difficulty";
import { Markdown } from "../../components/Markdown";

const KINDS = ["BUILD", "DEBUG", "REFACTOR", "OPTIMIZE", "TEST"] as const;
const TYPES = ["COMPONENT", "HOOK", "API", "STATE", "REDUX", "CUSTOM_HOOK", "PERFORMANCE", "ARCHITECTURE"] as const;

const BLANK: AdminProblemInput = {
  slug: "",
  title: "",
  difficulty: "BEGINNER",
  category: "",
  level: 1,
  tags: [],
  type: "COMPONENT",
  problemType: "BUILD",
  estimatedMinutes: 10,
  description: "",
  requirements: [],
  hints: [],
  prerequisites: [],
  starterCode: `function App() {\n  // Write your solution here\n  return null;\n}\n\nexport default App;\n`,
  solutionCode: `function App() {\n  return <h1>Hello</h1>;\n}\n\nexport default App;\n`,
  explanation: "",
  commonMistakes: [],
  alternativeApproach: null,
  mockApi: null,
  tests: [
    { name: "renders the heading", code: `renderComponent();\nexpectText("Hello");`, hidden: false },
    { name: "uses an <h1>", code: `renderComponent();\nscreen.getByRole("heading", { level: 1, name: "Hello" });`, hidden: true },
  ],
  wrongSolutions: [],
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const lines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);
const commas = (s: string) => s.split(",").map((l) => l.trim()).filter(Boolean);

const inputClass = "w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white";
const monoClass = inputClass + " font-mono text-xs";

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-slate-300">{label}</span>
      {children}
      {hint && <span className="block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border border-slate-800 rounded-lg p-4 space-y-4">
      <h2 className="text-sm font-semibold text-slate-200">{title}</h2>
      {children}
    </section>
  );
}

function CodeField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <span className="text-xs font-medium text-slate-300">{label}</span>
      <div className="border border-slate-800 rounded-md overflow-hidden h-56" aria-label={label}>
        <Editor
          height="100%"
          defaultLanguage="typescript"
          path={`file:///admin/${label.replace(/\W+/g, "-")}.tsx`}
          theme="vs-dark"
          value={value}
          onChange={(v) => onChange(v ?? "")}
          beforeMount={(monaco) => {
            const ts = monaco.languages.typescript;
            ts.typescriptDefaults.setCompilerOptions({ jsx: ts.JsxEmit.ReactJSX, allowNonTsExtensions: true });
            ts.typescriptDefaults.setDiagnosticsOptions({ noSemanticValidation: true, noSyntaxValidation: false });
          }}
          options={{ fontSize: 12, minimap: { enabled: false }, scrollBeyondLastLine: false, tabSize: 2, automaticLayout: true }}
        />
      </div>
    </div>
  );
}

/** Keeps raw text for list-like fields so typing a trailing newline/comma isn't eaten. */
interface TextFields {
  tags: string;
  requirements: string;
  hints: string;
  prerequisites: string;
  commonMistakes: string;
  mockApi: string;
}

function toText(p: AdminProblemInput): TextFields {
  return {
    tags: p.tags.join(", "),
    requirements: p.requirements.join("\n"),
    hints: p.hints.join("\n"),
    prerequisites: p.prerequisites.join(", "),
    commonMistakes: p.commonMistakes.join("\n"),
    mockApi: p.mockApi ? JSON.stringify(p.mockApi, null, 2) : "",
  };
}

export function AdminProblemEditorPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  // A fresh editor per URL, so switching problems never keeps the previous form.
  return <ProblemEditor key={(id ?? "new") + searchParams.toString()} id={id} duplicate={searchParams.get("duplicate") === "1"} />;
}

function ProblemEditor({ id, duplicate }: { id?: string; duplicate: boolean }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = !id;

  const existing = useQuery({
    queryKey: ["admin-problem", id],
    queryFn: () => api.get<AdminProblem>(`/admin/problems/${id}`),
    enabled: !isNew,
  });
  const summaries = useQuery({ queryKey: ["admin-problems"], queryFn: () => api.get<AdminProblemSummary[]>("/admin/problems") });

  // Problems defined in code (and explicit duplicates) are saved as a new authored problem.
  const asCopy = !isNew && (duplicate || existing.data?.source === "bank");
  const editingId = !isNew && !asCopy ? id : null;

  const [form, setForm] = useState<AdminProblemInput | null>(isNew ? BLANK : null);
  const [text, setText] = useState<TextFields>(toText(BLANK));
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [report, setReport] = useState<VerificationReport | null>(null);
  const [problemErrors, setProblemErrors] = useState<string[]>([]);
  const [previewDescription, setPreviewDescription] = useState(false);

  useEffect(() => {
    if (!existing.data || form) return;
    const { id: _id, order: _order, source: _source, ...input } = existing.data;
    const loaded = asCopy ? { ...input, slug: `${input.slug}-copy`, title: `${input.title} (copy)` } : input;
    setForm(loaded);
    setText(toText(loaded));
  }, [existing.data, form, asCopy]);

  const set = <K extends keyof AdminProblemInput>(key: K, value: AdminProblemInput[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  /** Combines the form with its text fields; returns null (and shows errors) if they don't parse. */
  function collect(): AdminProblemInput | null {
    if (!form) return null;
    const errors: string[] = [];
    let mockApi: AdminProblemInput["mockApi"] = null;
    if (text.mockApi.trim()) {
      try {
        const parsed = JSON.parse(text.mockApi);
        if (!Array.isArray(parsed)) throw new Error("must be an array of routes");
        mockApi = parsed;
      } catch (err) {
        errors.push(`Mock API: invalid JSON (${err instanceof Error ? err.message : err})`);
      }
    }
    setProblemErrors(errors);
    if (errors.length) return null;
    return {
      ...form,
      tags: commas(text.tags),
      requirements: lines(text.requirements),
      hints: lines(text.hints),
      prerequisites: commas(text.prerequisites),
      commonMistakes: lines(text.commonMistakes),
      alternativeApproach: form.alternativeApproach?.trim() ? form.alternativeApproach : null,
      mockApi,
    };
  }

  const showError = (err: unknown) => {
    if (err instanceof ApiError) setProblemErrors([err.message, ...err.details]);
    else setProblemErrors(["Something went wrong."]);
  };

  const verify = useMutation({
    mutationFn: (input: AdminProblemInput) => api.post<VerificationReport>("/admin/problems/verify", input),
    onMutate: () => {
      setReport(null);
      setProblemErrors([]);
    },
    onSuccess: setReport,
    onError: showError,
  });

  const save = useMutation({
    mutationFn: (input: AdminProblemInput) =>
      editingId ? api.put<{ id: string }>(`/admin/problems/${editingId}`, input) : api.post<{ id: string }>("/admin/problems", input),
    onMutate: () => {
      setReport(null);
      setProblemErrors([]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-problems"] });
      queryClient.invalidateQueries({ queryKey: ["admin-problem"] });
      queryClient.invalidateQueries({ queryKey: ["problems"] });
      navigate("/admin");
    },
    onError: showError,
  });

  if (!isNew && existing.isError) return <div className="p-8 text-red-400">Could not load this problem.</div>;
  if (!form) return <div className="p-8 text-slate-400">Loading...</div>;

  const busy = verify.isPending || save.isPending;
  const categories = Array.from(new Set((summaries.data ?? []).map((p) => p.category)));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <Link to="/admin" className="text-sm text-slate-400 hover:text-white">
          ← All problems
        </Link>
        <h1 className="text-2xl font-semibold text-white mt-2">
          {editingId ? `Edit: ${existing.data?.title}` : asCopy ? "New problem (copy)" : "New problem"}
        </h1>
        <p className="text-sm text-slate-400">
          Saving runs the problem through the grader: the solution must pass every test, the starter code must fail, and each wrong solution must
          fail.
        </p>
      </div>

      <Section title="Basics">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Title">
            <input
              className={inputClass}
              value={form.title}
              onChange={(e) => {
                set("title", e.target.value);
                if (!slugTouched) set("slug", slugify(e.target.value));
              }}
            />
          </Field>
          <Field label="Slug" hint="Lowercase words separated by hyphens; used in the URL.">
            <input
              className={inputClass}
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set("slug", e.target.value);
              }}
            />
          </Field>
          <Field label="Difficulty">
            <select className={inputClass} value={form.difficulty} onChange={(e) => set("difficulty", e.target.value as AdminProblemInput["difficulty"])}>
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {DIFFICULTY_LABEL[d]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Category">
            <input className={inputClass} list="admin-categories" value={form.category} onChange={(e) => set("category", e.target.value)} />
            <datalist id="admin-categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <Field label="Level" hint="Learning level (1 = JSX ... 25 = Real-World).">
            <input type="number" min={1} max={99} className={inputClass} value={form.level} onChange={(e) => set("level", Number(e.target.value))} />
          </Field>
          <Field label="Estimated minutes">
            <input
              type="number"
              min={1}
              className={inputClass}
              value={form.estimatedMinutes ?? ""}
              onChange={(e) => set("estimatedMinutes", e.target.value ? Number(e.target.value) : null)}
            />
          </Field>
          <Field label="Kind">
            <select className={inputClass} value={form.problemType} onChange={(e) => set("problemType", e.target.value as AdminProblemInput["problemType"])}>
              {KINDS.map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          </Field>
          <Field label="Type" hint="CUSTOM_HOOK disables the visual preview.">
            <select className={inputClass} value={form.type} onChange={(e) => set("type", e.target.value as AdminProblemInput["type"])}>
              {TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Tags" hint="Comma-separated.">
            <input className={inputClass} value={text.tags} onChange={(e) => setText({ ...text, tags: e.target.value })} />
          </Field>
          <Field label="Prerequisites" hint="Comma-separated category names.">
            <input className={inputClass} value={text.prerequisites} onChange={(e) => setText({ ...text, prerequisites: e.target.value })} />
          </Field>
        </div>
      </Section>

      <Section title="What the learner sees">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-300">Description (Markdown)</span>
            <button type="button" className="text-xs text-brand-500 hover:underline" onClick={() => setPreviewDescription((p) => !p)}>
              {previewDescription ? "Edit" : "Preview"}
            </button>
          </div>
          {previewDescription ? (
            <div className="border border-slate-800 rounded-md p-3 min-h-[8rem]">
              <Markdown>{form.description || "_Nothing yet_"}</Markdown>
            </div>
          ) : (
            <textarea aria-label="Description" rows={7} className={inputClass} value={form.description} onChange={(e) => set("description", e.target.value)} />
          )}
        </div>
        <Field label="Requirements" hint="One per line.">
          <textarea rows={3} className={inputClass} value={text.requirements} onChange={(e) => setText({ ...text, requirements: e.target.value })} />
        </Field>
        <Field label="Hints" hint="One per line, 2–4, from vague to specific.">
          <textarea rows={3} className={inputClass} value={text.hints} onChange={(e) => setText({ ...text, hints: e.target.value })} />
        </Field>
        <CodeField label="Starter code" value={form.starterCode} onChange={(v) => set("starterCode", v)} />
      </Section>

      <Section title="Solution">
        <CodeField label="Official solution" value={form.solutionCode} onChange={(v) => set("solutionCode", v)} />
        <Field label="Explanation (Markdown)">
          <textarea rows={3} className={inputClass} value={form.explanation} onChange={(e) => set("explanation", e.target.value)} />
        </Field>
        <Field label="Common mistakes" hint="One per line.">
          <textarea rows={2} className={inputClass} value={text.commonMistakes} onChange={(e) => setText({ ...text, commonMistakes: e.target.value })} />
        </Field>
        <Field label="Alternative approach (optional)">
          <textarea rows={2} className={inputClass} value={form.alternativeApproach ?? ""} onChange={(e) => set("alternativeApproach", e.target.value)} />
        </Field>
      </Section>

      <Section title="Tests">
        <p className="text-xs text-slate-500">
          Test bodies run with <code>React</code>, <code>Component</code> (the default export), <code>renderComponent(props)</code>, <code>screen</code>,{" "}
          <code>fireEvent</code>, <code>userEvent</code>, <code>waitFor</code>, <code>expect</code>, <code>mockApi</code>, <code>assert</code>,{" "}
          <code>assertEqual</code>, <code>expectText</code> and more (see the README). Throw to fail. Hidden tests only run on Submit.
        </p>
        {form.tests.map((t, i) => (
          <div key={i} className="border border-slate-800 rounded-md p-3 space-y-2">
            <div className="flex items-center gap-3">
              <input
                aria-label={`Test ${i + 1} name`}
                className={inputClass}
                value={t.name}
                onChange={(e) => set("tests", form.tests.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
              />
              <label className="flex items-center gap-1.5 text-xs text-slate-300 shrink-0">
                <input type="checkbox" checked={t.hidden} onChange={(e) => set("tests", form.tests.map((x, j) => (j === i ? { ...x, hidden: e.target.checked } : x)))} />
                Hidden
              </label>
              <button
                type="button"
                aria-label={`Remove test ${i + 1}`}
                className="text-slate-500 hover:text-red-400"
                onClick={() => set("tests", form.tests.filter((_, j) => j !== i))}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <textarea
              aria-label={`Test ${i + 1} code`}
              rows={4}
              className={monoClass}
              value={t.code}
              onChange={(e) => set("tests", form.tests.map((x, j) => (j === i ? { ...x, code: e.target.value } : x)))}
            />
          </div>
        ))}
        <button
          type="button"
          className="flex items-center gap-1 text-sm text-brand-500 hover:underline"
          onClick={() => set("tests", [...form.tests, { name: "", code: "renderComponent();\n", hidden: true }])}
        >
          <Plus className="w-4 h-4" /> Add test
        </button>

        <Field label="Mock API (optional JSON)" hint='e.g. [{ "url": "/api/users", "response": [{ "id": 1, "name": "Ana" }] }] — also used by the preview.'>
          <textarea rows={4} className={monoClass} value={text.mockApi} onChange={(e) => setText({ ...text, mockApi: e.target.value })} />
        </Field>
      </Section>

      <Section title="Wrong solutions (never shown to learners)">
        <p className="text-xs text-slate-500">Plausible mistakes — hardcoded values, missing cleanup... Each one must fail your tests, which proves they aren't too weak.</p>
        {form.wrongSolutions.map((w, i) => (
          <div key={i} className="flex gap-2">
            <textarea
              aria-label={`Wrong solution ${i + 1}`}
              rows={4}
              className={monoClass}
              value={w}
              onChange={(e) => set("wrongSolutions", form.wrongSolutions.map((x, j) => (j === i ? e.target.value : x)))}
            />
            <button
              type="button"
              aria-label={`Remove wrong solution ${i + 1}`}
              className="text-slate-500 hover:text-red-400 self-start"
              onClick={() => set("wrongSolutions", form.wrongSolutions.filter((_, j) => j !== i))}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          className="flex items-center gap-1 text-sm text-brand-500 hover:underline"
          onClick={() => set("wrongSolutions", [...form.wrongSolutions, form.starterCode])}
        >
          <Plus className="w-4 h-4" /> Add wrong solution
        </button>
      </Section>

      <div className="sticky bottom-0 bg-slate-950 shadow-[0_-8px_16px_rgba(2,6,23,0.9)] border-t border-slate-800 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 space-y-3">
        {(problemErrors.length > 0 || report) && (
          <div role="status" className="text-sm space-y-1 max-h-48 overflow-auto">
            {report?.ok && (
              <p className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" /> Passed verification — ready to save.
              </p>
            )}
            {report && !report.ok && (
              <p className="flex items-center gap-1.5 text-red-400">
                <XCircle className="w-4 h-4" /> Verification found {report.issues.length} issue(s):
              </p>
            )}
            {[...(report?.issues ?? []), ...problemErrors].map((issue, i) => (
              <pre key={i} className="text-xs text-red-300 whitespace-pre-wrap font-mono">
                {issue}
              </pre>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              const input = collect();
              if (input) verify.mutate(input);
            }}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4" /> {verify.isPending ? "Verifying..." : "Verify"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              const input = collect();
              if (input) save.mutate(input);
            }}
            className="text-sm px-3 py-1.5 rounded bg-brand-600 hover:bg-brand-500 text-white disabled:opacity-50"
          >
            {save.isPending ? "Verifying and saving..." : editingId ? "Save changes" : "Create problem"}
          </button>
        </div>
      </div>
    </div>
  );
}
