import { useCallback, useEffect, useRef, useState } from "react";

interface UseResizableOptions {
  initial: number; // percentage (0 - 100)
  min?: number;
  max?: number;
  storageKey?: string;
  direction?: "horizontal" | "vertical";
}

export function useResizable({
  initial,
  min = 20,
  max = 80,
  storageKey,
  direction = "horizontal",
}: UseResizableOptions) {
  const [size, setSize] = useState<number>(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= min && parsed <= max) {
          return parsed;
        }
      }
    }
    return initial;
  });

  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const startDragging = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const resetSize = useCallback(() => {
    setSize(initial);
    if (storageKey) {
      localStorage.setItem(storageKey, String(initial));
    }
  }, [initial, storageKey]);

  useEffect(() => {
    if (!isDragging) return;

    // Add class to body to prevent text selection and show resize cursor
    const activeClass = direction === "horizontal" ? "resizing-active" : "resizing-active-vertical";
    document.body.classList.add(activeClass);

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();

      let clientPos: number;
      let total: number;
      let start: number;

      if (direction === "horizontal") {
        clientPos = "touches" in e ? e.touches[0].clientX : e.clientX;
        total = rect.width;
        start = rect.left;
      } else {
        clientPos = "touches" in e ? e.touches[0].clientY : e.clientY;
        total = rect.height;
        start = rect.top;
      }

      if (total <= 0) return;

      const offset = clientPos - start;
      const pct = Math.min(Math.max((offset / total) * 100, min), max);
      setSize(pct);
    };

    const onPointerUp = () => {
      setIsDragging(false);
      document.body.classList.remove(activeClass);
      if (storageKey) {
        localStorage.setItem(storageKey, String(size));
      }
    };

    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("mouseup", onPointerUp);
    window.addEventListener("touchmove", onPointerMove);
    window.addEventListener("touchend", onPointerUp);

    return () => {
      document.body.classList.remove(activeClass);
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("mouseup", onPointerUp);
      window.removeEventListener("touchmove", onPointerMove);
      window.removeEventListener("touchend", onPointerUp);
    };
  }, [isDragging, direction, min, max, size, storageKey]);

  return {
    size,
    setSize,
    isDragging,
    startDragging,
    resetSize,
    containerRef,
  };
}
