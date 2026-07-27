// react-syntax-highlighter ships no "types"/"exports" field, and
// @types/react-syntax-highlighter's deep-import declarations aren't loaded
// here since tsconfig's "types" array only lists "node"/"vite/client".
// These cover the "light" build subpaths CodeBlock.tsx imports directly
// to register only the languages it needs, instead of the default export
// which bundles every hljs grammar.
declare module "react-syntax-highlighter/dist/esm/light.js" {
  import type React from "react";

  interface LightSyntaxHighlighterProps {
    language?: string;
    style?: Record<string, unknown>;
    customStyle?: React.CSSProperties;
    showLineNumbers?: boolean;
    wrapLines?: boolean;
    wrapLongLines?: boolean;
    children: string;
  }

  export default class SyntaxHighlighter extends React.Component<LightSyntaxHighlighterProps> {
    static registerLanguage(name: string, language: unknown): void;
  }
}

declare module "react-syntax-highlighter/dist/esm/languages/hljs/*.js" {
  const language: unknown;
  export default language;
}

declare module "react-syntax-highlighter/dist/esm/styles/hljs/*.js" {
  const style: Record<string, unknown>;
  export default style;
}
