import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import CitationTooltip from "./CitationTooltip";

/**
 * Recursively walk React children and replace [N] citation markers
 * with interactive CitationTooltip components.
 * Adjacent citations like [1][2][3] are grouped into a single tooltip.
 */
function renderWithCitations(children, sources, depth = 0) {
  if (!sources || sources.length === 0) return children;
  if (depth > 10) return children;

  return React.Children.map(children, (child) => {
    if (typeof child === "string") {
      return splitCitations(child, sources);
    }

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
 * Split a text string by [N] citation patterns, grouping adjacent
 * citations (e.g. [1][2][3]) into a single CitationTooltip.
 */
function splitCitations(text, sources) {
  // Match groups of adjacent citations like [1][2][3] or single [1]
  const groupRegex = /(\[\d+\](?:\s*\[\d+\])*)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = groupRegex.exec(text)) !== null) {
    // Push text before the citation group
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    // Extract all individual citation IDs from the group
    const group = match[1];
    const idRegex = /\[(\d+)\]/g;
    const ids = [];
    const groupSources = [];
    let idMatch;

    while ((idMatch = idRegex.exec(group)) !== null) {
      const citationId = parseInt(idMatch[1], 10);
      const source = sources.find((s) => s.id === citationId);
      if (source) {
        ids.push(citationId);
        groupSources.push(source);
      }
    }

    parts.push(
      <CitationTooltip
        key={`cite-group-${match.index}-${ids.join("-")}`}
        ids={ids}
        sources={groupSources}
      />
    );

    lastIndex = groupRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

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
