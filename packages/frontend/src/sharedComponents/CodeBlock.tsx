import { useIsDarkTheme } from "@hooks/useIsDarkTheme.ts";
import type React from "react";
import bash from "react-syntax-highlighter/dist/esm/languages/hljs/bash.js";
import c from "react-syntax-highlighter/dist/esm/languages/hljs/c.js";
import cpp from "react-syntax-highlighter/dist/esm/languages/hljs/cpp.js";
import css from "react-syntax-highlighter/dist/esm/languages/hljs/css.js";
import go from "react-syntax-highlighter/dist/esm/languages/hljs/go.js";
import java from "react-syntax-highlighter/dist/esm/languages/hljs/java.js";
import javascript from "react-syntax-highlighter/dist/esm/languages/hljs/javascript.js";
import json from "react-syntax-highlighter/dist/esm/languages/hljs/json.js";
import less from "react-syntax-highlighter/dist/esm/languages/hljs/less.js";
import markdown from "react-syntax-highlighter/dist/esm/languages/hljs/markdown.js";
import php from "react-syntax-highlighter/dist/esm/languages/hljs/php.js";
import python from "react-syntax-highlighter/dist/esm/languages/hljs/python.js";
import ruby from "react-syntax-highlighter/dist/esm/languages/hljs/ruby.js";
import rust from "react-syntax-highlighter/dist/esm/languages/hljs/rust.js";
import scss from "react-syntax-highlighter/dist/esm/languages/hljs/scss.js";
import sql from "react-syntax-highlighter/dist/esm/languages/hljs/sql.js";
import typescript from "react-syntax-highlighter/dist/esm/languages/hljs/typescript.js";
import xml from "react-syntax-highlighter/dist/esm/languages/hljs/xml.js";
import yaml from "react-syntax-highlighter/dist/esm/languages/hljs/yaml.js";
import SyntaxHighlighter from "react-syntax-highlighter/dist/esm/light.js";
import atomOneDark from "react-syntax-highlighter/dist/esm/styles/hljs/atom-one-dark.js";
import atomOneLight from "react-syntax-highlighter/dist/esm/styles/hljs/atom-one-light.js";

// Explicit per-language registration on the "light" build instead of the
// default import, which bundles all ~190 hljs grammars regardless of use.
// javascript/typescript/xml/bash carry hljs aliases (jsx, tsx, html, sh)
// that resolve to these automatically; scss has no "sass" alias so it's
// registered a second time under that name.
SyntaxHighlighter.registerLanguage("bash", bash);
SyntaxHighlighter.registerLanguage("c", c);
SyntaxHighlighter.registerLanguage("cpp", cpp);
SyntaxHighlighter.registerLanguage("css", css);
SyntaxHighlighter.registerLanguage("go", go);
SyntaxHighlighter.registerLanguage("java", java);
SyntaxHighlighter.registerLanguage("javascript", javascript);
SyntaxHighlighter.registerLanguage("json", json);
SyntaxHighlighter.registerLanguage("less", less);
SyntaxHighlighter.registerLanguage("markdown", markdown);
SyntaxHighlighter.registerLanguage("php", php);
SyntaxHighlighter.registerLanguage("python", python);
SyntaxHighlighter.registerLanguage("ruby", ruby);
SyntaxHighlighter.registerLanguage("rust", rust);
SyntaxHighlighter.registerLanguage("scss", scss);
SyntaxHighlighter.registerLanguage("sass", scss);
SyntaxHighlighter.registerLanguage("sql", sql);
SyntaxHighlighter.registerLanguage("typescript", typescript);
SyntaxHighlighter.registerLanguage("xml", xml);
SyntaxHighlighter.registerLanguage("yaml", yaml);

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
