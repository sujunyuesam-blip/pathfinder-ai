import React from "react";
import ReactMarkdown from "react-markdown";

export default function ContentDisplay({ content, title }) {
  if (!content) return null;

  return (
    <div className="prose prose-slate max-w-none">
      {title && <h1 className="text-2xl font-bold text-slate-800 mb-6 border-b pb-4">{title}</h1>}
      <ReactMarkdown
        components={{
          h1: ({ children }) => <h1 className="text-2xl font-bold text-slate-800 mt-8 mb-4 border-b border-slate-200 pb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-semibold text-slate-700 mt-6 mb-3">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-medium text-slate-600 mt-4 mb-2">{children}</h3>,
          p: ({ children }) => <p className="text-slate-600 leading-relaxed mb-3">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 mb-4 text-slate-600">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1 mb-4 text-slate-600">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          strong: ({ children }) => <strong className="text-slate-800 font-semibold">{children}</strong>,
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border border-slate-200 rounded-lg overflow-hidden">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-slate-50">{children}</thead>,
          th: ({ children }) => <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700 border-b border-slate-200">{children}</th>,
          td: ({ children }) => <td className="px-4 py-2 text-sm text-slate-600 border-b border-slate-100">{children}</td>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-slate-300 pl-4 py-1 my-4 bg-slate-50 rounded-r-lg text-slate-600 italic">
              {children}
            </blockquote>
          ),
          code: ({ inline, children }) => {
            if (inline) {
              return <code className="px-1.5 py-0.5 bg-slate-100 rounded text-sm text-slate-700 font-mono">{children}</code>;
            }
            return (
              <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 overflow-x-auto my-4">
                <code className="text-sm font-mono">{children}</code>
              </pre>
            );
          },
          hr: () => <hr className="my-6 border-slate-200" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}