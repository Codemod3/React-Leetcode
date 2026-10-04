import type { Difficulty } from "@reactcode/shared";

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  BEGINNER: "Easy",
  EASY: "Easy",
  MEDIUM: "Med.",
  HARD: "Hard",
};

export const DIFFICULTY_FULL_LABEL: Record<Difficulty, string> = {
  BEGINNER: "Beginner",
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
};

export const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  BEGINNER: "text-[#00b8a3]",
  EASY: "text-[#00b8a3]",
  MEDIUM: "text-[#ffc01e]",
  HARD: "text-[#ff375f]",
};

export const DIFFICULTY_PILL: Record<Difficulty, string> = {
  BEGINNER: "bg-[#00b8a3]/10 text-[#00b8a3] border border-[#00b8a3]/20",
  EASY: "bg-[#00b8a3]/10 text-[#00b8a3] border border-[#00b8a3]/20",
  MEDIUM: "bg-[#ffc01e]/10 text-[#ffc01e] border border-[#ffc01e]/20",
  HARD: "bg-[#ff375f]/10 text-[#ff375f] border border-[#ff375f]/20",
};

