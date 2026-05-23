import React from "react";
import ReactMarkdown from "react-markdown";
import CitationTooltip from "./CitationTooltip";

/**
 * Recursively walk React children and replace [N] citation markers
 * with interactive CitationTooltip components.
 */
function renderWithCitations(children, sources) {
  if (!sources || sources.length === 0) return children;

  return React.Children.map(children, (child) => {
    if (typeof child === "string") {
      return splitCitations(child, sources);
    }

    if (React.isValidElement(child) && child.props.children) {
      return React.cloneElement(child, {
        ...child.props,
        children: renderWithCitations(child.props.children, sources),
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

function getCitationComponents(sources) {
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
  };
}

const MessageBubble = ({ role, content, sources }) => {
  if (role === "user") return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-textPrimary font-semibold text-sm">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-textMuted">
          <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" />
        </svg>
        Answer
      </div>

      <div className="prose prose-slate max-w-none text-textPrimary leading-relaxed prose-p:my-2.5 prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-headings:text-textPrimary">
        <ReactMarkdown components={getCitationComponents(sources || [])}>
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default MessageBubble;
