import React from "react";
import ReactMarkdown from "react-markdown";

interface MarkdownTextProps {
  children: string;
  className?: string;
}

/**
 * Render trusted project metadata as Markdown without enabling raw HTML.
 */
const MarkdownText: React.FC<MarkdownTextProps> = ({
  children,
  className = "",
}) => {
  return (
    <div className={`space-y-3 ${className}`.trim()}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="whitespace-pre-wrap leading-relaxed">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc space-y-1 pl-6">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal space-y-1 pl-6">{children}</ol>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="link link-primary"
            >
              {children}
            </a>
          ),
          code: ({ children }) => (
            <code className="rounded bg-base-300 px-1 py-0.5 font-mono text-sm">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="overflow-x-auto rounded-box bg-base-300 p-3 text-sm">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary pl-4 italic text-base-content/70">
              {children}
            </blockquote>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownText;
