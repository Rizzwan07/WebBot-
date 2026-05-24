import MessageBubble from "./MessageBubble";
import SourcesPanel from "./SourcesPanel";
import RelatedQuestions from "./RelatedQuestions";

const ChatBox = ({ messages, loading, onSearch }) => {
  return (
    <div className="space-y-10">
      {messages.map((msg) => {
        const isUser = msg.role === "user";

        return (
          <div key={msg.id} className="flex flex-col gap-4">
            {isUser ? (
              <h2 className="text-2xl font-semibold leading-tight text-textPrimary">
                {msg.content}
              </h2>
            ) : (
              <div className="flex flex-col gap-5">
                {Array.isArray(msg.sources) && msg.sources.length > 0 && (
                  <SourcesPanel sources={msg.sources} />
                )}
                <MessageBubble
                  role={msg.role}
                  content={msg.content}
                  sources={msg.sources}
                />
                {Array.isArray(msg.follow_up_questions) &&
                  msg.follow_up_questions.length > 0 && (
                    <RelatedQuestions
                      questions={msg.follow_up_questions}
                      onSearch={onSearch}
                    />
                  )}
              </div>
            )}
          </div>
        );
      })}

      {loading && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 text-accent font-medium text-sm">
            <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
            <span>Thinking...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBox;
