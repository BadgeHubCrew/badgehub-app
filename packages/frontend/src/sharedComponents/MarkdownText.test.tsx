import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import MarkdownText from "./MarkdownText";

describe("MarkdownText", () => {
  it("renders markdown content as HTML", () => {
    const markdownContent = "# Hello World\n\nThis is **bold** and *italic* text with a [link](https://example.com).";
    
    render(
      <MarkdownText>
        {markdownContent}
      </MarkdownText>
    );

    // Check that markdown is rendered as HTML
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Hello World");
    expect(screen.getByText("bold")).toBeInTheDocument();
    expect(screen.getByText("italic")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "link" })).toHaveAttribute("href", "https://example.com");
  });

  it("strips markdown when plainText is true", () => {
    const markdownContent = "# Hello World\n\nThis is **bold** and *italic* text with a [link](https://example.com).";
    
    render(
      <MarkdownText plainText>
        {markdownContent}
      </MarkdownText>
    );

    // Check that markdown is stripped and rendered as plain text
    const textContent = screen.getByText(/Hello World.*bold.*italic.*link/);
    expect(textContent).toBeInTheDocument();
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("handles empty content gracefully", () => {
    const { container } = render(
      <MarkdownText>
        {""}
      </MarkdownText>
    );

    expect(container.firstChild).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <MarkdownText className="custom-class">
        {"Test content"}
      </MarkdownText>
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });
});