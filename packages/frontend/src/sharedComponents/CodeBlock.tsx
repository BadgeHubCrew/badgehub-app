import React from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import { atomOneDark } from "react-syntax-highlighter/dist/cjs/styles/hljs";
import { atomOneLight } from "react-syntax-highlighter/dist/cjs/styles/hljs";
import { useIsDarkTheme } from "@hooks/useIsDarkTheme.ts";

interface CodeBlockProps {
  children: string;
  language?: string;
  wrapperClassName?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({
  children,
  language,
  wrapperClassName = "rounded overflow-hidden",
}) => {
  const isDark = useIsDarkTheme();
  return (
    <div className={wrapperClassName}>
      <SyntaxHighlighter
        language={language}
        style={isDark ? atomOneDark : atomOneLight}
        customStyle={{
          margin: 0,
          padding: "1rem",
          fontSize: "0.875rem",
          lineHeight: "1.25rem",
        }}
        showLineNumbers={false}
        wrapLines={true}
        wrapLongLines={true}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  );
};

export default CodeBlock;
