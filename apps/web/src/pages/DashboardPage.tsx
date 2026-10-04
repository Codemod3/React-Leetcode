import { useQuery } from "@tanstack/react-query";
import type { DashboardStats } from "@reactcode/shared";
import { api } from "../lib/api";
import { DIFFICULTY_COLOR } from "../lib/difficulty";
import { Award, CheckCircle, Flame, Target } from "lucide-react";

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-[#262626] border border-[#333333] rounded-lg p-4 flex items-center justify-between">
      <div>
        <p className="text-xs text-[#8c8c8c] uppercase tracking-wider font-semibold">{label}</p>
        <p className="text-2xl font-bold text-white mt-1 tabular-nums tracking-tight">{value}</p>
      </div>
      {icon && <div className="p-2 bg-[#1e1e1e] rounded-lg border border-[#383838]">{icon}</div>}
    </div>
  );
}

export function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.get<DashboardStats>("/dashboard"),
  });

  if (isLoading || !data) {
    return <div className="p-8 text-[#8c8c8c] text-center">Loading dashboard...</div>;
  }

  const tiers = [
    { key: "beginner", label: "Beginner", color: DIFFICULTY_COLOR.BEGINNER },
    { key: "easy", label: "Easy", color: DIFFICULTY_COLOR.EASY },
    { key: "medium", label: "Medium", color: DIFFICULTY_COLOR.MEDIUM },
    { key: "hard", label: "Hard", color: DIFFICULTY_COLOR.HARD },
  ] as const;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#333333]">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Your Progress</h1>
          <p className="text-xs text-[#8c8c8c] mt-1">Practice stats and category mastery across React levels</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#ffa116] bg-[#ffa116]/10 border border-[#ffa116]/30 px-3 py-1.5 rounded-full font-semibold">
          <Flame className="w-4 h-4 fill-[#ffa116]" />
          <span>{data.currentStreak} Day Streak</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Solved"
          value={`${data.solved.total} / ${data.totalProblems.total}`}
          icon={<CheckCircle className="w-5 h-5 text-[#2cbb5d]" />}
        />
        <StatCard
          label="Completion"
          value={`${data.completionPercent}%`}
          icon={<Target className="w-5 h-5 text-[#ffa116]" />}
        />
        <StatCard
          label="Total Submissions"
          value={data.totalAttempts}
          icon={<Award className="w-5 h-5 text-[#00b8a3]" />}
        />
        <StatCard
          label="Current Streak"
          value={`${data.currentStreak} days`}
          icon={<Flame className="w-5 h-5 text-[#ffa116]" />}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {tiers.map((t) => (
          <div key={t.key} className="bg-[#262626] border border-[#333333] rounded-lg p-4">
            <p className={`text-xs uppercase font-bold tracking-wider ${t.color}`}>{t.label}</p>
            <p className="text-xl font-bold text-white mt-1 tabular-nums">
              {data.solved[t.key]} <span className="text-[#8c8c8c] text-xs font-normal">/ {data.totalProblems[t.key]}</span>
            </p>
          </div>
        ))}
      </div>

      <div className="bg-[#262626] border border-[#333333] rounded-lg p-5">
        <h2 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
          Learning Path Progress
        </h2>
        <div className="space-y-3">
          {data.categoryProgress.map((c) => {
            const percent = c.total ? Math.round((c.solved / c.total) * 100) : 0;
            return (
              <div key={c.category} className="flex items-center gap-3 text-xs">
                <span className="w-48 text-[#eff2f6] shrink-0 truncate font-medium">
                  <span className="text-[#8c8c8c] tabular-nums mr-2">Level {c.level}</span>
                  {c.category}
                </span>
                <div
                  className="flex-1 h-2 bg-[#1e1e1e] rounded-full overflow-hidden border border-[#333333]"
                  role="progressbar"
                  aria-label={c.category}
                  aria-valuenow={c.solved}
                  aria-valuemax={c.total}
                >
                  <div
                    className="h-full bg-[#ffa116] transition-all duration-300"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="text-[#8c8c8c] w-16 text-right tabular-nums">
                  {c.solved}/{c.total} ({percent}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
