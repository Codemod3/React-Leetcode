import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Bookmark, CheckCircle2, Circle, CircleDot, Search } from "lucide-react";
import { COLLECTIONS, DIFFICULTIES, type ProblemSummary } from "@reactcode/shared";
import { api } from "../lib/api";
import { DIFFICULTY_COLOR, DIFFICULTY_LABEL } from "../lib/difficulty";

type StatusFilter = "all" | "solved" | "unsolved" | "bookmarked";

const selectClass = "bg-slate-900 border border-slate-800 rounded-md px-2 py-1.5 text-sm text-slate-300";

function StatusIcon({ status }: { status: ProblemSummary["status"] }) {
  if (status === "SOLVED") return <CheckCircle2 className="w-4 h-4 text-emerald-500" aria-label="Solved" />;
  if (status === "ATTEMPTED") return <CircleDot className="w-4 h-4 text-amber-500" aria-label="Attempted" />;
  return <Circle className="w-4 h-4 text-slate-700" aria-label="Not started" />;
}

export function ProblemsListPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["problems"],
    queryFn: () => api.get<ProblemSummary[]>("/problems"),
  });

  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [collection, setCollection] = useState("all");

  const categories = useMemo(() => Array.from(new Set((data ?? []).map((p) => p.category))), [data]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data ?? []).filter(
      (p) =>
        (!q || p.title.toLowerCase().includes(q) || p.tags.some((t) => t.toLowerCase().includes(q))) &&
        (difficulty === "all" || p.difficulty === difficulty) &&
        (category === "all" || p.category === category) &&
        (collection === "all" || p.collections.includes(collection)) &&
        (status === "all" ||
          (status === "solved" && p.status === "SOLVED") ||
          (status === "unsolved" && p.status !== "SOLVED") ||
          (status === "bookmarked" && p.bookmarked))
    );
  }, [data, search, difficulty, category, status, collection]);

  const solvedCount = (data ?? []).filter((p) => p.status === "SOLVED").length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-end justify-between flex-wrap gap-2 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white mb-1">Problems</h1>
          <p className="text-slate-400 text-sm">Learn React by writing React — start at #1 and work your way up.</p>
        </div>
        {data && (
          <p className="text-sm text-slate-400">
            <span className="text-white font-medium">{solvedCount}</span> / {data.length} solved
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <label className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-2.5 top-2.5" />
          <span className="sr-only">Search problems</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or tag"
            className="w-full bg-slate-900 border border-slate-800 rounded-md pl-8 pr-3 py-1.5 text-sm text-white"
          />
        </label>
        <select aria-label="Difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className={selectClass}>
          <option value="all">All difficulties</option>
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>
              {DIFFICULTY_LABEL[d]}
            </option>
          ))}
        </select>
        <select aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value)} className={selectClass}>
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)} className={selectClass}>
          <option value="all">Any status</option>
          <option value="solved">Solved</option>
          <option value="unsolved">Unsolved</option>
          <option value="bookmarked">Bookmarked</option>
        </select>
        <select aria-label="Collection" value={collection} onChange={(e) => setCollection(e.target.value)} className={selectClass}>
          <option value="all">All collections</option>
          {Object.entries(COLLECTIONS).map(([slug, name]) => (
            <option key={slug} value={slug}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <p className="text-slate-500">Loading problems...</p>}
      {error && <p className="text-red-400">Could not load problems.</p>}

      {data && (
        <div className="border border-slate-800 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 text-slate-400 text-left">
              <tr>
                <th className="px-3 py-2 w-10">
                  <span className="sr-only">Status</span>
                </th>
                <th className="px-3 py-2 w-12">#</th>
                <th className="px-3 py-2">Problem</th>
                <th className="px-3 py-2">Difficulty</th>
                <th className="px-3 py-2 hidden sm:table-cell">Category</th>
                <th className="px-3 py-2 hidden sm:table-cell text-right">Attempts</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => (
                <tr key={p.id} className="border-t border-slate-800 hover:bg-slate-900/60">
                  <td className="px-3 py-2.5">
                    <StatusIcon status={p.status} />
                  </td>
                  <td className="px-3 py-2.5 text-slate-500 tabular-nums">{p.order}</td>
                  <td className="px-3 py-2.5">
                    <Link to={`/problems/${p.slug}`} className="text-slate-200 hover:text-brand-500 font-medium">
                      {p.title}
                    </Link>
                    {p.problemType !== "BUILD" && (
                      <span className="ml-2 text-[10px] uppercase tracking-wide text-slate-500 border border-slate-700 rounded px-1">
                        {p.problemType.toLowerCase()}
                      </span>
                    )}
                    {p.bookmarked && <Bookmark className="inline w-3.5 h-3.5 ml-1.5 text-brand-500" aria-label="Bookmarked" />}
                  </td>
                  <td className={`px-3 py-2.5 font-medium ${DIFFICULTY_COLOR[p.difficulty]}`}>{DIFFICULTY_LABEL[p.difficulty]}</td>
                  <td className="px-3 py-2.5 text-slate-400 hidden sm:table-cell">{p.category}</td>
                  <td className="px-3 py-2.5 text-slate-500 hidden sm:table-cell text-right tabular-nums">{p.attempts}</td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                    No problems match these filters.
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
