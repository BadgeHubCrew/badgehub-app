import CodeBlock from "@sharedComponents/CodeBlock.tsx";
import { Markdown } from "@tanstack/markdown/react";
import type React from "react";

interface MarkdownTextProps {
  children: string;
  className?: string;
}

interface PreOverrideProps {
  "data-lang"?: string;
  children?: React.ReactNode;
}

interface ChildrenProps {
  children?: React.ReactNode;
}

interface AnchorProps {
  href?: string;
  children?: React.ReactNode;
}

// The fenced code block's <code> child isn't itself overridden with special
// handling, so its raw text sits at props.children of whatever element (ours
// or the default "code" tag) rendered it. Elements are plain objects until
// React renders them, so this can be read synchronously here.
const extractCodeText = (node: React.ReactNode): string => {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractCodeText).join("");
  if (
    node &&
    typeof node === "object" &&
    "props" in node &&
    node.props &&
    typeof node.props === "object" &&
    "children" in node.props
  ) {
    return extractCodeText(
      (node.props as { children?: React.ReactNode }).children
    );
  }
  return "";
};

/**
 * Render trusted project metadata as Markdown without enabling raw HTML.
 */
const MarkdownText: React.FC<MarkdownTextProps> = ({
  children,
  className = "",
}) => {
  return (
    <div className={`space-y-3 ${className}`.trim()}>
      <Markdown
        components={{
          h1: ({ children }: ChildrenProps) => (
            <h1 className="text-2xl font-bold">{children}</h1>
          ),
          h2: ({ children }: ChildrenProps) => (
            <h2 className="text-xl font-semibold">{children}</h2>
          ),
          h3: ({ children }: ChildrenProps) => (
            <h3 className="text-lg font-semibold">{children}</h3>
          ),
          p: ({ children }: ChildrenProps) => (
            <p className="leading-relaxed">{children}</p>
          ),
          ul: ({ children }: ChildrenProps) => (
            <ul className="list-disc space-y-1 pl-6">{children}</ul>
          ),
          ol: ({ children }: ChildrenProps) => (
            <ol className="list-decimal space-y-1 pl-6">{children}</ol>
          ),
          a: ({ href, children }: AnchorProps) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="link link-primary"
            >
              {children}
            </a>
          ),
          code: ({ children }: ChildrenProps) => (
            <code className="rounded bg-base-300 px-1 py-0.5 font-mono text-sm">
              {children}
            </code>
          ),
          pre: ({ "data-lang": lang, children }: PreOverrideProps) => (
            <CodeBlock
              language={lang}
              wrapperClassName="rounded-box overflow-hidden"
            >
              {extractCodeText(children)}
            </CodeBlock>
          ),
          blockquote: ({ children }: ChildrenProps) => (
            <blockquote className="border-l-4 border-primary pl-4 italic text-base-content/70">
              {children}
            </blockquote>
          ),
        }}
      >
        {children}
      </Markdown>
    </div>
  );
};

export default MarkdownText;
