import { useState, useRef, useEffect } from "react";
import ChatBox from "./components/ChatBox";
import SearchBar from "./components/SearchBar";
import { PlusCircle } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8080";

function App() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isThreadActive = messages.length > 0;
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  const startNewThread = () => {
    setMessages([]);
    setError(null);
  };

  const handleSearch = async (query) => {
    const userMessage = {
      id: Date.now(),
      role: "user",
      content: query,
    };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();

      if (!response.ok) {
        const detail = data.detail;
        const message = Array.isArray(detail)
          ? detail.map((e) => e.msg).join(", ")
          : detail || "Request failed";
        throw new Error(message);
      }

      const answer =
        data.answer?.trim() || "No answer was generated. Please try again.";

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: answer,
          sources: data.sources,
          follow_up_questions: data.follow_up_questions,
        },
      ]);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex bg-bgMain text-textPrimary h-screen w-full font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 bg-bgSidebar flex flex-col border-r border-borderLight p-4 hidden md:flex">
        <div className="flex items-center gap-2.5 px-2 py-4 mb-4 select-none">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center text-white text-xs font-bold">
            W
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-textPrimary">
            WebBot AI
          </h1>
        </div>
        <button
          onClick={startNewThread}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-bgMain hover:bg-bgPanel border border-borderLight transition-colors shadow-sm"
        >
          <PlusCircle size={18} className="text-textMuted" />
          <span className="font-medium text-sm text-textPrimary">
            New Thread
          </span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative h-full">
        {/* Scrollable Thread Area */}
        <div className="flex-1 overflow-y-auto">
          {!isThreadActive ? (
            <div className="flex flex-col items-center justify-center h-full px-4 pt-10 pb-40">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-white text-lg font-bold mb-6">
                W
              </div>
              <h2 className="text-3xl font-semibold mb-2 tracking-tight text-textPrimary">
                What do you want to know?
              </h2>
              <p className="text-textMuted mb-8 text-sm">
                Search the web with AI-powered answers and citations.
              </p>
              <div className="w-full max-w-2xl">
                <SearchBar onSearch={handleSearch} loading={loading} />
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto w-full px-4 py-8 pb-32">
              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}
              <ChatBox
                messages={messages}
                loading={loading}
                onSearch={handleSearch}
              />
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Sticky Bottom Search Bar */}
        {isThreadActive && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-bgMain via-bgMain/95 to-transparent pt-12 pb-6 px-4">
            <div className="max-w-2xl mx-auto w-full">
              <SearchBar
                onSearch={handleSearch}
                loading={loading}
                isSticky={true}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
