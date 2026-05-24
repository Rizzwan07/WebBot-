
const SourcesPanel = ({ sources }) => {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2 text-textPrimary font-semibold text-sm">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-textMuted">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
        </svg>
        Sources
      </div>

      <div className="flex gap-2.5 overflow-x-auto pb-2 snap-x hide-scrollbar">
        {sources.map((source, idx) => {
          try {
            const domain = new URL(source.url).hostname.replace("www.", "");
            return (
              <a
                key={source.id || idx}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col gap-1.5 w-44 min-w-44 bg-bgPanel hover:bg-borderLight border border-borderLight rounded-xl p-3 select-none snap-start transition-colors"
              >
                <div className="truncate text-xs font-medium text-textPrimary">
                  {source.title}
                </div>
                <div className="flex items-center gap-1.5 mt-auto text-[11px] text-textMuted">
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${domain}&sz=16`}
                    alt=""
                    className="w-3.5 h-3.5 rounded-sm"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                  <span className="truncate">{domain}</span>
              <span className="ml-auto bg-accent/10 text-[10px] text-accent px-1.5 py-0.5 rounded-full font-mono font-semibold">
                {idx + 1}
              </span>
                </div>
              </a>
            );
          } catch {
            return null;
          }
        })}
      </div>
    </div>
  );
};

export default SourcesPanel;
