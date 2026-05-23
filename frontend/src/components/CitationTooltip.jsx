import { useState, useRef } from "react";

const CitationTooltip = ({ id, source }) => {
  const [show, setShow] = useState(false);
  const timeoutRef = useRef(null);

  if (!source) {
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-bgPanel text-textMuted rounded-full mx-0.5 align-super">
        {id}
      </span>
    );
  }

  let domain;
  try {
    domain = new URL(source.url).hostname.replace("www.", "");
  } catch {
    domain = source.url;
  }

  const handleEnter = () => {
    clearTimeout(timeoutRef.current);
    setShow(true);
  };

  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setShow(false), 150);
  };

  return (
    <span className="relative inline-block">
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-accent/15 text-accent rounded-full hover:bg-accent/25 cursor-pointer transition-colors no-underline mx-0.5 align-super"
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        {id}
      </a>

      {show && (
        <div
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-bgMain border border-borderLight rounded-xl p-3 shadow-xl z-50"
          style={{ animation: "fadeIn 0.15s ease-out" }}
        >
          {/* Arrow */}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-bgMain border-r border-b border-borderLight rotate-45" />

          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block no-underline group"
          >
            <div className="flex items-center gap-2 mb-2">
              <img
                src={`https://www.google.com/s2/favicons?domain=${domain}&sz=16`}
                alt=""
                className="w-4 h-4 rounded-sm shrink-0"
              />
              <span className="text-xs text-textMuted truncate">{domain}</span>
              <span className="ml-auto bg-bgPanel text-[10px] text-textMuted px-1.5 py-0.5 rounded-full font-mono shrink-0">
                {id}
              </span>
            </div>
            <div className="text-sm font-medium text-textPrimary group-hover:text-accent line-clamp-2 leading-snug transition-colors">
              {source.title}
            </div>
            {source.content && (
              <div className="text-xs text-textMuted mt-1.5 line-clamp-2 leading-relaxed">
                {source.content.substring(0, 120)}
                {source.content.length > 120 ? "…" : ""}
              </div>
            )}
          </a>
        </div>
      )}
    </span>
  );
};

export default CitationTooltip;
