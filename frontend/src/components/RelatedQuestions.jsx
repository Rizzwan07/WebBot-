import { Plus } from "lucide-react";

const RelatedQuestions = ({ questions, onSearch }) => {
  if (!questions || questions.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 mt-2 border-t border-borderLight pt-5">
      <div className="flex items-center gap-2 text-textPrimary font-semibold text-sm mb-1">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-textMuted">
          <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Related
      </div>

      <div className="flex flex-col">
        {questions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => onSearch && onSearch(q)}
            className="flex items-center justify-between gap-4 text-left w-full text-textPrimary hover:bg-bgPanel px-3 py-3 rounded-xl transition-colors group border-b border-borderLight last:border-b-0"
          >
            <span className="text-sm leading-relaxed">{q}</span>
            <Plus
              size={16}
              className="text-textMuted group-hover:text-accent shrink-0 transition-colors"
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export default RelatedQuestions;
