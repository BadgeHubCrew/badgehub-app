import React from "react";
import ReactMarkdown from "react-markdown";
import SyntaxHighlighter from "react-syntax-highlighter";
import { atomOneDark } from "react-syntax-highlighter/dist/cjs/styles/hljs";
import { atomOneLight } from "react-syntax-highlighter/dist/cjs/styles/hljs";
import { useIsDarkTheme } from "@hooks/useIsDarkTheme.ts";

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
  const isDark = useIsDarkTheme();
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
          p: ({ children }) => <p className="leading-relaxed">{children}</p>,
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
          code: ({ className: codeClassName, children }) => {
            const languageMatch = /language-(\w+)/.exec(codeClassName || "");
            if (!languageMatch) {
              return (
                <code className="rounded bg-base-300 px-1 py-0.5 font-mono text-sm">
                  {children}
                </code>
              );
            }
            return (
              <div className="rounded-box overflow-hidden">
                <SyntaxHighlighter
                  language={languageMatch[1]}
                  style={isDark ? atomOneDark : atomOneLight}
                  customStyle={{
                    margin: 0,
                    padding: "0.75rem",
                    fontSize: "0.875rem",
                  }}
                  wrapLongLines={true}
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              </div>
            );
          },
          pre: ({ children }) => <>{children}</>,
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
