import { useState, useRef } from "react";
import { ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Perplexity-style citation tooltip.
 *
 * Accepts an array of sources (grouped adjacent citations like [1][2][3])
 * and shows a single badge. On hover, a popup appears with < > navigation
 * to browse all sources in the group.
 */
const CitationTooltip = ({ ids, sources }) => {
  // Filter to only valid sources
  const validSources = (sources || []).filter(Boolean);

  const [show, setShow] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const timeoutRef = useRef(null);

  // Clamp activeIndex to valid range
  const safeActiveIndex = Math.min(activeIndex, Math.max(0, validSources.length - 1));

  if (validSources.length === 0) {
    return (
      <span className="inline-flex items-center justify-center h-[18px] min-w-[18px] px-1 text-[9px] font-bold bg-bgPanel text-textMuted rounded-full mx-[1.5px] leading-none align-middle">
        {ids.join(",")}
      </span>
    );
  }

  const handleEnter = () => {
    clearTimeout(timeoutRef.current);
    setShow(true);
  };

  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setShow(false), 250);
  };

  const goNext = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveIndex((i) => (i + 1) % validSources.length);
  };

  const goPrev = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveIndex((i) => (i - 1 + validSources.length) % validSources.length);
  };

  const activeSource = validSources[safeActiveIndex];
  let domain = "";
  try {
    if (activeSource.url) {
      domain = new URL(activeSource.url).hostname.replace("www.", "");
    }
  } catch {
    domain = "";
  }

  // Badge label: single number or grouped count
  const badgeLabel =
    ids.length === 1 ? String(ids[0]) : ids.join(",");

  return (
    <span className="relative inline-block">
      <span
        className="inline-flex items-center justify-center h-[18px] min-w-[18px] px-1 text-[9px] font-bold bg-accent/15 text-accent rounded-full hover:bg-accent/25 cursor-pointer transition-colors no-underline mx-[1.5px] leading-none align-middle select-none"
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        {badgeLabel}
      </span>

      {show && (
        <div
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-80 bg-bgMain border border-borderLight rounded-xl p-3 shadow-xl z-50"
          style={{ animation: "fadeIn 0.15s ease-out" }}
        >
          {/* Arrow */}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-bgMain border-r border-b border-borderLight rotate-45" />

          {/* Navigation header — only show if multiple sources */}
          {validSources.length > 1 && (
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-borderLight">
              <button
                onClick={goPrev}
                className="p-0.5 rounded hover:bg-bgPanel transition-colors text-textMuted hover:text-textPrimary"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-[10px] text-textMuted font-medium">
                {safeActiveIndex + 1} / {validSources.length}
              </span>
              <button
                onClick={goNext}
                className="p-0.5 rounded hover:bg-bgPanel transition-colors text-textMuted hover:text-textPrimary"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}

          {/* Source card */}
          <a
            href={activeSource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block no-underline group"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <img
                src={`https://www.google.com/s2/favicons?domain=${domain}&sz=16`}
                alt=""
                className="w-4 h-4 rounded-sm shrink-0"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
              <span className="text-xs text-textMuted truncate group-hover:underline">
                {domain}
              </span>
              <ExternalLink
                size={12}
                className="text-textMuted group-hover:text-accent shrink-0 transition-colors"
              />
              <span className="ml-auto bg-bgPanel text-[10px] text-textMuted px-1.5 py-0.5 rounded-full font-mono shrink-0">
                {ids[safeActiveIndex] ?? ids[0]}
              </span>
            </div>
            <div className="text-sm font-medium text-textPrimary group-hover:text-accent line-clamp-2 leading-snug transition-colors">
              {activeSource.title}
            </div>
            {activeSource.content && (
              <div className="text-xs text-textMuted mt-1.5 line-clamp-2 leading-relaxed">
                {activeSource.content.substring(0, 150)}
                {activeSource.content.length > 150 ? "…" : ""}
              </div>
            )}
          </a>

          {/* Source dots indicator */}
          {validSources.length > 1 && (
            <div className="flex items-center justify-center gap-1 mt-2 pt-2 border-t border-borderLight">
              {validSources.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setActiveIndex(i);
                  }}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i === safeActiveIndex
                      ? "bg-accent"
                      : "bg-bgPanel hover:bg-textMuted/30"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </span>
  );
};

export default CitationTooltip;