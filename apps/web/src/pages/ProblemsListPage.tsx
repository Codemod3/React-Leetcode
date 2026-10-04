import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Check, Circle, Search, Shuffle } from "lucide-react";
import { COLLECTIONS, DIFFICULTIES, type ProblemSummary } from "@reactcode/shared";
import { api } from "../lib/api";
import { DIFFICULTY_COLOR, DIFFICULTY_LABEL } from "../lib/difficulty";
import { SolvedRing } from "../components/LeetCodeIcons";

type StatusFilter = "all" | "solved" | "unsolved";

const pillSelectClass =
  "bg-[#282828] hover:bg-[#323232] text-[#eff2f6] border border-[#3e3e3e] rounded-full px-3 py-1 text-xs cursor-pointer focus:outline-none focus:border-[#ffa116] transition-colors";

export function ProblemsListPage() {
  const navigate = useNavigate();
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
          (status === "unsolved" && p.status !== "SOLVED"))
    );
  }, [data, search, difficulty, category, status, collection]);

  const solvedCount = (data ?? []).filter((p) => p.status === "SOLVED").length;

  const handleShuffle = () => {
    if (!data || data.length === 0) return;
    const random = data[Math.floor(Math.random() * data.length)];
    navigate(`/problems/${random.slug}`);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-4">
      {/* Top Search & Actions Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-[#8c8c8c] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions by title or tag"
            className="w-full bg-[#262626] border border-[#383838] focus:border-[#ffa116] rounded-full pl-9 pr-4 py-1.5 text-xs text-[#eff2f6] placeholder-[#8c8c8c] outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-4">
          <SolvedRing solved={solvedCount} total={data?.length ?? 0} />
          <button
            onClick={handleShuffle}
            title="Pick Random Problem"
            className="p-1.5 rounded-md hover:bg-[#282828] text-[#8c8c8c] hover:text-[#ffa116] transition-colors"
          >
            <Shuffle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Dropdowns */}
      <div className="flex flex-wrap items-center gap-2 pt-1 pb-2">
        <select
          aria-label="Difficulty"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className={pillSelectClass}
        >
          <option value="all">Difficulty: All</option>
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>
              {DIFFICULTY_LABEL[d]}
            </option>
          ))}
        </select>

        <select
          aria-label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
          className={pillSelectClass}
        >
          <option value="all">Status: All</option>
          <option value="solved">Solved</option>
          <option value="unsolved">Unsolved</option>
        </select>

        <select
          aria-label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={pillSelectClass}
        >
          <option value="all">Category: All</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          aria-label="Collection"
          value={collection}
          onChange={(e) => setCollection(e.target.value)}
          className={pillSelectClass}
        >
          <option value="all">Collection: All</option>
          {Object.entries(COLLECTIONS).map(([slug, name]) => (
            <option key={slug} value={slug}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <p className="text-[#8c8c8c] text-sm py-8 text-center">Loading problems...</p>}
      {error && <p className="text-[#ff375f] text-sm py-8 text-center">Could not load problems.</p>}

      {/* Real Problems List (No dummy stars, no dummy frequency bars, no fake acceptance) */}
      {data && (
        <div className="space-y-1">
          {visible.map((p, idx) => {
            const isSolved = p.status === "SOLVED";

            return (
              <div
                key={p.id}
                className={`group flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                  idx % 2 === 0 ? "bg-[#222222]" : "bg-[#262626]"
                } hover:bg-[#2e2e2e]`}
              >
                {/* Left: Status & Problem Title */}
                <div className="flex items-center gap-3.5 min-w-0 pr-4">
                  <div className="w-4 h-4 flex items-center justify-center shrink-0">
                    {isSolved ? (
                      <Check className="w-4 h-4 text-[#2cbb5d] stroke-[2.5]" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-[#525252]" />
                    )}
                  </div>

                  <Link
                    to={`/problems/${p.slug}`}
                    className="text-sm font-medium text-[#eff2f6] group-hover:text-white truncate"
                  >
                    <span className="tabular-nums mr-1.5">{p.order}.</span>
                    <span>{p.title}</span>
                  </Link>

                  {p.problemType !== "BUILD" && (
                    <span className="text-[10px] uppercase font-semibold text-[#8c8c8c] bg-[#1a1a1a] border border-[#383838] rounded px-1.5 py-0.5">
                      {p.problemType.toLowerCase()}
                    </span>
                  )}
                </div>

                {/* Right: Category, Attempts, Difficulty */}
                <div className="flex items-center gap-6 shrink-0 text-xs">
                  <span className="text-[#8c8c8c] hidden md:inline truncate max-w-[120px]">
                    {p.category}
                  </span>

                  <span className="text-[#8c8c8c] tabular-nums hidden sm:inline w-16 text-right">
                    {p.attempts > 0 ? `${p.attempts} runs` : "0 runs"}
                  </span>

                  <span
                    className={`font-medium w-10 text-right ${DIFFICULTY_COLOR[p.difficulty]}`}
                  >
                    {DIFFICULTY_LABEL[p.difficulty]}
                  </span>
                </div>
              </div>
            );
          })}

          {visible.length === 0 && (
            <div className="py-12 text-center text-[#8c8c8c] text-sm bg-[#222222] rounded-lg">
              No problems match these filters.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
