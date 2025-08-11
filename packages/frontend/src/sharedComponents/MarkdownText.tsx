import React from "react";
import ReactMarkdown from "react-markdown";

interface MarkdownTextProps {
  children: string;
  className?: string;
  /**
   * Whether to strip markdown for plain text display (useful for previews)
   */
  plainText?: boolean;
}

/**
 * Component for rendering markdown text with consistent styling.
 * Can be used for both full markdown rendering and plain text extraction.
 */
const MarkdownText: React.FC<MarkdownTextProps> = ({
  children,
  className = "",
  plainText = false,
}) => {
  if (plainText) {
    // Strip markdown syntax for plain text display (e.g., in cards)
    const plainContent = children
      .replace(/#+\s/g, "") // Remove headers
      .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold
      .replace(/\*(.*?)\*/g, "$1") // Remove italic
      .replace(/`(.*?)`/g, "$1") // Remove inline code
      .replace(/\[(.*?)\]\(.*?\)/g, "$1") // Remove links but keep text
      .replace(/^\s*[-*+]\s/gm, "") // Remove list markers
      .replace(/^\s*\d+\.\s/gm, "") // Remove numbered list markers
      .replace(/\n\s*\n/g, " ") // Replace double newlines with space
      .replace(/\n/g, " ") // Replace single newlines with space
      .trim();

    return <span className={className}>{plainContent}</span>;
  }

  return (
    <div className={className}>
      <ReactMarkdown
        components={{
          // Customize link rendering to open in new tab and style appropriately
          a: ({ href, children, ...props }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="link link-primary"
              {...props}
            >
              {children}
            </a>
          ),
          // Customize code block styling
          code: ({ className, children, ...props }) => {
            const isInline = !className;
            return (
              <code
                className={
                  isInline
                    ? "bg-base-300 px-1 py-0.5 rounded text-sm font-mono"
                    : "block bg-base-300 p-3 rounded text-sm font-mono overflow-x-auto"
                }
                {...props}
              >
                {children}
              </code>
            );
          },
          // Customize blockquote styling
          blockquote: ({ children, ...props }) => (
            <blockquote
              className="border-l-4 border-primary pl-4 italic text-base-content/70"
              {...props}
            >
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
