import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import MarkdownText from "./MarkdownText";

describe("MarkdownText", () => {
  it("renders markdown content as HTML", () => {
    const markdownContent =
      "# Hello World\n\nThis is **bold** and *italic* text with a [link](https://example.com).";

    render(<MarkdownText>{markdownContent}</MarkdownText>);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Hello World"
    );
    expect(screen.getByText("bold")).toBeInTheDocument();
    expect(screen.getByText("italic")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "link" })).toHaveAttribute(
      "href",
      "https://example.com"
    );
    expect(screen.getByRole("link", { name: "link" })).toHaveAttribute(
      "target",
      "_blank"
    );
  });

  it("does not render raw HTML", () => {
    const { container } = render(
      <MarkdownText>{"<script>alert('unsafe')</script>"}</MarkdownText>
    );

    expect(container.querySelector("script")).not.toBeInTheDocument();
    expect(screen.getByText(/script.*unsafe.*script/i)).toBeInTheDocument();
  });

  it("uses standard Markdown wrapping for soft line breaks", () => {
    const { container } = render(
      <MarkdownText>{"First line\nsecond line"}</MarkdownText>
    );

    expect(container.querySelector("p")).not.toHaveClass("whitespace-pre-wrap");
    expect(screen.getByText(/First line\s+second line/)).toBeInTheDocument();
  });

  it("renders fenced code blocks with syntax highlighting", () => {
    const { container } = render(
      <MarkdownText>{"```ts\nconst ready = true;\n```"}</MarkdownText>
    );

    // Syntax highlighting splits the code into separate tokens.
    expect(screen.getByText("const")).toBeInTheDocument();
    expect(screen.getByText("ready")).toBeInTheDocument();
    expect(screen.getByText("true")).toBeInTheDocument();
    expect(container.querySelector("pre code")).toBeInTheDocument();
  });

  it("renders fenced code blocks without a language as a block, not inline", () => {
    const { container } = render(
      <MarkdownText>{"```\nplain block\n```"}</MarkdownText>
    );

    expect(container.querySelector("pre code")).toBeInTheDocument();
    expect(screen.getByText(/plain block/)).toBeInTheDocument();
  });

  it("handles empty content gracefully", () => {
    const { container } = render(<MarkdownText>{""}</MarkdownText>);

    expect(container.firstChild).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <MarkdownText className="custom-class">{"Test content"}</MarkdownText>
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });
});
