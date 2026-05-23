import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import CitationTooltip from "./CitationTooltip";

/**
 * Recursively walk React children and replace [N] citation markers
 * with interactive CitationTooltip components.
 * Max depth guard prevents stack overflow on unexpected element structures.
 */
function renderWithCitations(children, sources, depth = 0) {
  if (!sources || sources.length === 0) return children;
  if (depth > 10) return children; // Bug #3: max-depth guard

  return React.Children.map(children, (child) => {
    if (typeof child === "string") {
      return splitCitations(child, sources);
    }

    // Bug #4: use != null instead of truthy check for children
    if (React.isValidElement(child) && child.props.children != null) {
      return React.cloneElement(child, {
        ...child.props,
        children: renderWithCitations(child.props.children, sources, depth + 1),
      });
    }

    return child;
  });
}

/**
 * Split a text string by [N] citation patterns and return an array
 * of text segments and CitationTooltip components.
 */
function splitCitations(text, sources) {
  const regex = /\[(\d+)\]/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const citationId = parseInt(match[1], 10);
    const source = sources.find((s) => s.id === citationId);

    parts.push(
      <CitationTooltip
        key={`cite-${match.index}-${citationId}`}
        id={citationId}
        source={source}
      />
    );

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

// Bug #18: Extended to cover headings and blockquote too
function createCitationComponents(sources) {
  const wrap =
    (Tag) =>
    ({ children, ...props }) => (
      <Tag {...props}>{renderWithCitations(children, sources)}</Tag>
    );

  return {
    p: wrap("p"),
    li: wrap("li"),
    td: wrap("td"),
    strong: wrap("strong"),
    em: wrap("em"),
    h1: wrap("h1"),
    h2: wrap("h2"),
    h3: wrap("h3"),
    h4: wrap("h4"),
    h5: wrap("h5"),
    h6: wrap("h6"),
    blockquote: wrap("blockquote"),
  };
}

const MessageBubble = ({ role, content, sources }) => {
  if (role === "user") return null;

  // Bug #19: Memoize to avoid recreating wrappers on every render
  const citationComponents = useMemo(
    () => createCitationComponents(sources || []),
    [sources]
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-textPrimary font-semibold text-sm">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-textMuted">
          <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" />
        </svg>
        Answer
      </div>

      <div className="prose prose-slate max-w-none text-textPrimary leading-relaxed prose-p:my-2.5 prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-headings:text-textPrimary">
        <ReactMarkdown components={citationComponents}>
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default MessageBubble;
