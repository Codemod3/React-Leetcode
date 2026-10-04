import React from "react";

export function LeetCodeLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M16.102 17.93l-2.697 2.607c-.466.467-1.111.662-1.823.662s-1.357-.195-1.824-.662l-4.332-4.363c-.467-.467-.702-1.15-.702-1.863s.235-1.357.702-1.824l4.319-4.38c.467-.467 1.125-.645 1.837-.645s1.357.195 1.823.662l2.697 2.606c.514.515 1.365.497 1.9-.038.535-.536.553-1.387.039-1.901l-2.609-2.636a5.214 5.214 0 0 0-3.79-1.579c-1.444 0-2.809.562-3.824 1.579L3.48 10.7c-1.015 1.016-1.579 2.38-1.579 3.824s.564 2.808 1.579 3.823l4.332 4.363c1.015 1.016 2.38 1.579 3.824 1.579s2.809-.563 3.824-1.579l2.609-2.636c.514-.514.496-1.365-.039-1.9-.535-.536-1.386-.554-1.9-.039l-.028-.025z"
        fill="#FFA116"
      />
      <path
        d="M10.802 12.308h10.42c.745 0 1.35-.605 1.35-1.35s-.605-1.35-1.35-1.35h-10.42c-.745 0-1.35.605-1.35 1.35s.605 1.35 1.35 1.35z"
        fill="#EFF2F6"
      />
    </svg>
  );
}

export function SolvedRing({ solved, total }: { solved: number; total: number }) {
  const percent = total > 0 ? (solved / total) * 100 : 0;
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex items-center gap-2 text-xs text-lc-muted">
      <div className="relative w-5 h-5 flex items-center justify-center">
        <svg className="w-5 h-5 -rotate-90" viewBox="0 0 24 24">
          <circle
            cx="12"
            cy="12"
            r={radius}
            stroke="#383838"
            strokeWidth="2.5"
            fill="transparent"
          />
          <circle
            cx="12"
            cy="12"
            r={radius}
            stroke="#2cbb5d"
            strokeWidth="2.5"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>
      </div>
      <span>
        <strong className="text-white font-semibold">{solved}</strong>/{total} Solved
      </span>
    </div>
  );
}

