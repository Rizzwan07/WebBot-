import { useState, useRef, useEffect, useMemo } from "react";
import ChatBox from "./components/ChatBox";
import SearchBar from "./components/SearchBar";
import { PlusCircle, Trash2, Menu, X, Plus } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "/api";

function App() {
  const [threads, setThreads] = useState(() => [{ id: 1, title: null, messages: [] }]);
  const [activeId, setActiveId] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeThread = threads.find((t) => t.id === activeId) || null;
  const messages = useMemo(() => activeThread?.messages || [], [activeThread]);
  const isThreadActive = messages.length > 0;
  const messagesEndRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  // Interactive Live Tech Particle Network Background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    const resize = () => {
      if (!canvas) return;
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth || window.innerWidth;
        canvas.height = parent.clientHeight || window.innerHeight;
      } else {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    resize();
    window.addEventListener("resize", resize);
    const layoutTimeout = setTimeout(resize, 100);

    const particles = [];
    const particleCount = 45;

    // Measure active parent dimensions instead of total window width to avoid off-screen gaps
    const activeWidth = canvas.parentElement ? canvas.parentElement.clientWidth : window.innerWidth;
    const activeHeight = canvas.parentElement ? canvas.parentElement.clientHeight : window.innerHeight;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * (activeWidth || window.innerWidth),
        y: Math.random() * (activeHeight || window.innerHeight),
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 1,
      });
    }

    let mouse = { x: null, y: null, radius: 110 };
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    const container = canvas.parentElement;
    if (container) {
      container.addEventListener("mousemove", handleMouseMove);
      container.addEventListener("mouseleave", handleMouseLeave);
    }

    const draw = () => {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];

        p1.x += p1.vx;
        p1.y += p1.vy;

        if (p1.x < 0 || p1.x > canvas.width) {
          p1.vx *= -1;
          p1.x = Math.max(0, Math.min(canvas.width, p1.x));
        }
        if (p1.y < 0 || p1.y > canvas.height) {
          p1.vy *= -1;
          p1.y = Math.max(0, Math.min(canvas.height, p1.y));
        }

        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(28, 176, 160, 0.25)";
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(28, 176, 160, ${0.12 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }

        if (mouse.x !== null && mouse.y !== null) {
          const dx = p1.x - mouse.x;
          const dy = p1.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.radius) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(28, 176, 160, ${0.15 * (1 - dist / mouse.radius)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      clearTimeout(layoutTimeout);
      window.removeEventListener("resize", resize);
      if (container) {
        container.removeEventListener("mousemove", handleMouseMove);
        container.removeEventListener("mouseleave", handleMouseLeave);
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Coordinated fast canvas resize hook on layout shifts
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth || window.innerWidth;
      canvas.height = parent.clientHeight || window.innerHeight;
    }
  }, [messages.length, sidebarOpen]);

  const startNewThread = () => {
    const id = Date.now();
    setThreads((prev) => [...prev, { id, title: null, messages: [] }]);
    setActiveId(id);
    setError(null);
    setSidebarOpen(false);
  };

  const switchThread = (id) => {
    setActiveId(id);
    setError(null);
    setSidebarOpen(false);
  };

  const deleteThread = (e, id) => {
    e.stopPropagation();
    setThreads((prev) => prev.filter((t) => t.id !== id));
    if (activeId === id) {
      const remaining = threads.filter((t) => t.id !== id);
      if (remaining.length > 0) {
        setActiveId(remaining[remaining.length - 1].id);
      } else {
        startNewThread();
      }
    }
  };

  const handleSearch = async (query) => {
    const userMsg = { id: Date.now(), role: "user", content: query };

    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeId
          ? { ...t, title: t.title || query, messages: [...t.messages, userMsg] }
          : t
      )
    );
    setLoading(true);
    setError(null);

    const history = (activeThread?.messages || []).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, history }),
      });

      if (!response.ok) {
        let message = `Request failed (${response.status})`;
        try {
          const errData = await response.json();
          const detail = errData.detail;
          message = Array.isArray(detail)
            ? detail.map((e) => e.msg).join(", ")
            : detail || message;
        } catch {
          // Response wasn't JSON (e.g. 502 HTML page)
        }
        throw new Error(message);
      }

      const data = await response.json();

      const answer =
        data.answer?.trim() || "No answer was generated. Please try again.";

      const assistantMsg = {
        id: Date.now() + 1,
        role: "assistant",
        content: answer,
        sources: data.sources,
        follow_up_questions: data.follow_up_questions,
      };

      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeId
            ? { ...t, messages: [...t.messages, assistantMsg] }
            : t
        )
      );
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex bg-bgMain text-textPrimary h-screen w-full font-sans overflow-hidden">
      {/* Sidebar Backdrop Overlay on Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/35 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`w-60 bg-bgSidebar flex-col border-r border-borderLight p-4 min-h-0 md:flex transition-all duration-200 z-50 ${
        sidebarOpen 
          ? "flex fixed inset-y-0 left-0 shadow-2xl w-64" 
          : "hidden md:flex"
      }`}>
        <div className="flex items-center justify-between px-2 py-4 mb-4 select-none">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center text-white text-xs font-bold">
              W
            </div>
            <h1 className="text-lg font-semibold tracking-tight text-textPrimary">
              WebBot AI
            </h1>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg hover:bg-bgPanel text-textMuted hover:text-textPrimary md:hidden"
            title="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <button
          onClick={startNewThread}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-bgMain hover:bg-bgPanel border border-borderLight transition-colors shadow-sm mb-4"
        >
          <PlusCircle size={18} className="text-textMuted" />
          <span className="font-medium text-sm text-textPrimary">New Chat</span>
        </button>

        <div className="flex-1 overflow-y-auto space-y-0.5 hide-scrollbar">
          {threads.filter((t) => t.title).map((thread) => (
            <div key={thread.id} className="group relative">
              <button
                onClick={() => switchThread(thread.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  thread.id === activeId
                    ? "bg-accent/10 text-accent font-medium"
                    : "text-textMuted hover:bg-bgPanel hover:text-textPrimary"
                }`}
              >
                <span className="block truncate pr-6">
                  {thread.title}
                </span>
              </button>
              <button
                onClick={(e) => deleteThread(e, thread.id)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 text-textMuted hover:text-red-500 transition-all"
                title="Delete chat"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative h-full overflow-hidden bg-bgMain">
        
        {/* Subtle dynamic breathing dot pattern */}
        <div className="absolute inset-0 pointer-events-none bg-dot-pattern animate-pulse-soft" />
        
        {/* Interactive Neural Particle Canvas */}
        <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />

        {/* Dynamic Fixed Header Bar */}
        <header className="sticky top-0 left-0 right-0 z-30 bg-bgMain/60 backdrop-blur-md border-b border-borderLight/60 px-4 py-3.5 flex items-center justify-between select-none">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg hover:bg-bgPanel text-textMuted hover:text-textPrimary md:hidden transition-colors"
              title="Open menu"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center text-white text-[10px] font-bold md:hidden">
                W
              </div>
              <span className="font-semibold text-sm tracking-tight text-textPrimary">
                WebBot AI
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={startNewThread}
              className="p-1.5 rounded-lg hover:bg-bgPanel text-textMuted hover:text-textPrimary transition-colors"
              title="New Chat"
            >
              <Plus size={20} />
            </button>
          </div>
        </header>

        {/* Scrollable Thread Area */}
        <div className="flex-1 overflow-y-auto z-10">
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
            <div className="max-w-3xl mx-auto w-full px-4 py-8 pb-40">
              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                  <span className="font-medium">Error:</span> {error}
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
          <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-bgMain via-bgMain/95 to-transparent pt-12 pb-6 px-4 z-20">
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