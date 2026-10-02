import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Problem descriptions are authored by trusted admins, but react-markdown also never
// renders raw HTML, so this stays XSS-safe even if that changes.
export function Markdown({ children }: { children: string }) {
  return (
    <div className="text-sm text-slate-300 leading-relaxed space-y-3">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code: ({ children, className }) =>
            className ? (
              <code className={className}>{children}</code>
            ) : (
              <code className="px-1 py-0.5 rounded bg-slate-800 text-sky-300 text-[0.85em]">{children}</code>
            ),
          pre: ({ children }) => (
            <pre className="bg-slate-900 border border-slate-800 rounded p-3 overflow-auto text-xs text-slate-200 [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-slate-200">
              {children}
            </pre>
          ),
          ul: ({ children }) => <ul className="list-disc pl-5 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1">{children}</ol>,
          table: ({ children }) => <table className="text-xs border border-slate-800">{children}</table>,
          th: ({ children }) => <th className="border border-slate-800 px-2 py-1 text-left bg-slate-900">{children}</th>,
          td: ({ children }) => <td className="border border-slate-800 px-2 py-1">{children}</td>,
          strong: ({ children }) => <strong className="text-slate-100">{children}</strong>,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
