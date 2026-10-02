import { useQuery } from "@tanstack/react-query";
import type { DashboardStats } from "@reactcode/shared";
import { api } from "../lib/api";
import { DIFFICULTY_COLOR } from "../lib/difficulty";

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
      <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-semibold text-white mt-1 tabular-nums">{value}</p>
    </div>
  );
}

export function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.get<DashboardStats>("/dashboard"),
  });

  if (isLoading || !data) return <div className="p-8 text-slate-400">Loading dashboard...</div>;

  const tiers = [
    { key: "beginner", label: "Beginner", color: DIFFICULTY_COLOR.BEGINNER },
    { key: "easy", label: "Easy", color: DIFFICULTY_COLOR.EASY },
    { key: "medium", label: "Medium", color: DIFFICULTY_COLOR.MEDIUM },
    { key: "hard", label: "Hard", color: DIFFICULTY_COLOR.HARD },
  ] as const;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <h1 className="text-2xl font-semibold text-white">Your Progress</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Solved" value={`${data.solved.total} / ${data.totalProblems.total}`} />
        <StatCard label="Completion" value={`${data.completionPercent}%`} />
        <StatCard label="Total Submissions" value={data.totalAttempts} />
        <StatCard label="Current Streak" value={data.currentStreak} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {tiers.map((t) => (
          <div key={t.key} className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <p className={`text-xs uppercase tracking-wide ${t.color}`}>{t.label}</p>
            <p className="text-lg font-semibold text-white mt-1 tabular-nums">
              {data.solved[t.key]} <span className="text-slate-500 text-sm">/ {data.totalProblems[t.key]}</span>
            </p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">Learning path</h2>
        <div className="space-y-2">
          {data.categoryProgress.map((c) => (
            <div key={c.category} className="flex items-center gap-3">
              <span className="w-48 text-sm text-slate-400 shrink-0 truncate">
                <span className="text-slate-600 tabular-nums">{String(c.level).padStart(2, "0")}</span> {c.category}
              </span>
              <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden" role="progressbar" aria-label={c.category} aria-valuenow={c.solved} aria-valuemax={c.total}>
                <div className="h-full bg-brand-500" style={{ width: `${c.total ? (c.solved / c.total) * 100 : 0}%` }} />
              </div>
              <span className="text-sm text-slate-500 w-14 text-right tabular-nums">
                {c.solved}/{c.total}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
