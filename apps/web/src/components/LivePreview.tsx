import { useEffect, useMemo, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { AlertCircle, Monitor, RotateCcw, Terminal } from "lucide-react";
import type { MockRoute } from "@reactcode/shared";
import { compilePreviewComponent, deserializePreviewProps, PreviewErrorBoundary } from "../lib/livePreview";

interface LivePreviewProps {
  code: string;
  version: number;
  mockApi: MockRoute[] | null;
  previewProps: unknown;
  noPreviewReason: string | null;
}

const MAX_LOG = 6;

function describeArg(arg: unknown): string {
  if (arg && typeof arg === "object" && "nativeEvent" in arg) return `<${(arg as { type?: string }).type ?? ""} event>`;
  try {
    return JSON.stringify(arg) ?? String(arg);
  } catch {
    return String(arg);
  }
}

export function LivePreview({ code, version, mockApi, previewProps, noPreviewReason }: LivePreviewProps) {
  const [renderError, setRenderError] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [manualReload, setManualReload] = useState(0);
  const mountRef = useRef<HTMLDivElement>(null);

  const compiled = useMemo(() => {
    if (noPreviewReason) return null;
    try {
      const onCall = (name: string, args: unknown[]) =>
        setLog((l) => [...l, `${name}(${args.map(describeArg).join(", ")})`].slice(-MAX_LOG));
      return {
        Component: compilePreviewComponent(code, mockApi),
        props: (deserializePreviewProps(previewProps ?? {}, onCall) ?? {}) as Record<string, unknown>,
        error: null,
      };
    } catch (err) {
      return { Component: null, props: {}, error: err instanceof Error ? err.message : String(err) };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, manualReload]);

  useEffect(() => {
    setRenderError(null);
    setLog([]);
    const container = mountRef.current;
    if (!container || !compiled?.Component) return;
    const { Component, props } = compiled;
    const host = document.createElement("div");
    container.appendChild(host);
    const root: Root = createRoot(host);
    root.render(
      <PreviewErrorBoundary onError={setRenderError}>
        <Component {...props} />
      </PreviewErrorBoundary>
    );
    return () => {
      setTimeout(() => {
        root.unmount();
        host.remove();
      });
    };
  }, [compiled]);

  const error = compiled?.error ?? renderError;

  return (
    <div className="h-full flex flex-col min-h-0 bg-[#262626] border-l border-[#333333]">
      {/* LeetCode styled pane header */}
      <div className="h-9 px-3 flex items-center justify-between border-b border-[#333333] bg-[#282828] text-xs shrink-0 select-none">
        <div className="flex items-center gap-1.5 text-white font-medium">
          <Monitor className="w-3.5 h-3.5 text-[#ffa116]" />
          <span>Live Preview</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setManualReload((v) => v + 1)}
            title="Reload Preview"
            className="p-1 rounded text-[#8c8c8c] hover:text-white hover:bg-[#333333] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Preview Canvas */}
      <div className="flex-1 overflow-auto p-4 bg-[#ffffff] text-[#111827] relative" data-testid="preview">
        {noPreviewReason ? (
          <div className="h-full flex items-center justify-center p-6 text-center text-[#6b7280] text-xs">
            {noPreviewReason}
          </div>
        ) : error ? (
          <div className="bg-[#fef2f2] border border-[#fecaca] rounded-lg p-3 text-xs text-[#991b1b] font-mono whitespace-pre-wrap flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#ef4444] mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Preview Error</p>
              {error}
            </div>
          </div>
        ) : (
          <div ref={mountRef} className="w-full h-full" />
        )}
      </div>

      {/* LeetCode styled Preview Console / Event log */}
      {log.length > 0 && (
        <div className="border-t border-[#333333] bg-[#1e1e1e] p-2 text-xs font-mono text-[#9ca3af] max-h-32 overflow-auto shrink-0">
          <div className="flex items-center gap-1 text-[11px] text-[#ffa116] font-semibold mb-1">
            <Terminal className="w-3 h-3" /> Preview Log:
          </div>
          <div className="space-y-0.5 text-[11px]">
            {log.map((entry, i) => (
              <div key={i} className="text-[#eff2f6] truncate font-mono">
                {entry}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
