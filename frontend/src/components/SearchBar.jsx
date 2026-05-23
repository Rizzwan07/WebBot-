import { useState } from "react";
import { ArrowRight } from "lucide-react";

const SearchBar = ({ onSearch, loading, isSticky = false }) => {
  const [query, setQuery] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || loading) return;
    onSearch(trimmed);
    setQuery("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative w-full bg-bgMain rounded-2xl border border-borderLight focus-within:border-accent/40 focus-within:ring-2 focus-within:ring-accent/10 transition-all shadow-sm flex flex-col"
    >
      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask anything..."
        disabled={loading}
        rows={1}
        className="w-full bg-transparent text-textPrimary placeholder:text-textMuted/60 py-4 px-5 resize-none outline-none disabled:opacity-60 overflow-hidden leading-relaxed block overflow-auto"
        style={{ minHeight: isSticky ? "52px" : "72px", maxHeight: "200px" }}
      />
      <div className="flex items-center justify-end px-3 pb-3 pt-0">
        <button
          type="submit"
          disabled={!query.trim() || loading}
          className="p-2 bg-accent hover:bg-accent/90 disabled:bg-bgPanel disabled:text-textMuted text-white rounded-full transition-colors flex items-center justify-center h-8 w-8"
        >
          <ArrowRight size={16} strokeWidth={2.5} />
        </button>
      </div>
    </form>
  );
};

export default SearchBar;
