import { useEffect, useMemo, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { MockRoute } from "@reactcode/shared";
import { compilePreviewComponent, deserializePreviewProps, PreviewErrorBoundary } from "../lib/livePreview";

interface LivePreviewProps {
  code: string;
  version: number;
  mockApi: MockRoute[] | null;
  previewProps: unknown;
  /** Why there's nothing to render (custom hook, a test-writing problem...), if so. */
  noPreviewReason: string | null;
}

const MAX_LOG = 5;

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
  const mountRef = useRef<HTMLDivElement>(null);

  // Recompile only when the learner presses Run (version changes), not on every keystroke.
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
  }, [version]);

  // The learner's component renders in its own React root, so it doesn't inherit
  // ReactCode's router, query client, or any other context from the host page.
  useEffect(() => {
    setRenderError(null);
    setLog([]);
    const container = mountRef.current;
    if (!container || !compiled?.Component) return;
    const { Component, props } = compiled;
    // A fresh host element per root: StrictMode runs this effect twice, and two roots
    // must never share a container while the first one's deferred unmount is pending.
    const host = document.createElement("div");
    container.appendChild(host);
    const root: Root = createRoot(host);
    root.render(
      <PreviewErrorBoundary onError={setRenderError}>
        <Component {...props} />
      </PreviewErrorBoundary>
    );
    // Deferred so React isn't asked to unmount a root while it's still rendering.
    return () => {
      setTimeout(() => {
        root.unmount();
        host.remove();
      });
    };
  }, [compiled]);

  const error = compiled?.error ?? renderError;

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="px-3 py-1.5 text-xs font-medium text-slate-400 border-b border-slate-800 bg-slate-900">Preview</div>
      <div className="flex-1 overflow-auto p-4 bg-white text-slate-900" data-testid="preview">
        {noPreviewReason ? (
          <p className="text-xs text-slate-500">{noPreviewReason}</p>
        ) : (
          <>
            {error && <pre className="text-red-600 text-xs whitespace-pre-wrap font-mono">{error}</pre>}
            <div ref={mountRef} hidden={!!error} />
          </>
        )}
      </div>
      {log.length > 0 && (
        <div className="border-t border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-mono text-slate-400" aria-live="polite">
          <span className="text-slate-500">Preview log: </span>
          {log.map((entry, i) => (
            <div key={i}>{entry}</div>
          ))}
        </div>
      )}
    </div>
  );
}
