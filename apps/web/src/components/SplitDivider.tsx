import React from "react";

interface SplitDividerProps {
  direction?: "horizontal" | "vertical";
  onMouseDown: (e: React.MouseEvent) => void;
  onTouchStart?: (e: React.TouchEvent) => void;
  onDoubleClick?: () => void;
  isDragging?: boolean;
  className?: string;
}

export function SplitDivider({
  direction = "horizontal",
  onMouseDown,
  onTouchStart,
  onDoubleClick,
  isDragging = false,
  className = "",
}: SplitDividerProps) {
  const isHorizontal = direction === "horizontal";

  return (
    <div
      role="separator"
      aria-orientation={isHorizontal ? "vertical" : "horizontal"}
      tabIndex={0}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onDoubleClick={onDoubleClick}
      title="Drag to resize, double click to reset"
      className={`group relative flex items-center justify-center select-none transition-colors duration-150 z-20 ${
        isHorizontal
          ? "w-[6px] cursor-col-resize hover:bg-[#383838] active:bg-[#ffa116]"
          : "h-[6px] cursor-row-resize hover:bg-[#383838] active:bg-[#ffa116]"
      } ${isDragging ? "bg-[#ffa116]" : "bg-[#1a1a1a]"} ${className}`}
    >
      {/* Subtle visual grip dots */}
      <div
        className={`pointer-events-none rounded-full transition-colors ${
          isHorizontal
            ? "w-[2px] h-6 bg-[#3e3e3e] group-hover:bg-[#ffa116]"
            : "h-[2px] w-6 bg-[#3e3e3e] group-hover:bg-[#ffa116]"
        } ${isDragging ? "bg-[#ffa116]" : ""}`}
      />
    </div>
  );
}
