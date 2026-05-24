# WebBot AI

A Perplexity-style AI web search chatbot with live citations, multi-thread conversations, inline source tooltips, and a particle animation background.

**Stack:** FastAPI + React (Vite) + Groq (llama-3.3-70b) + Exa AI + LangGraph + Tailwind CSS v4

---

## Quick Start

### 1. Prerequisites
- Python 3.10+
- Node.js 18+
- API keys: [Groq](https://console.groq.com) and [Exa](https://exa.ai)

### 2. Clone & configure
```bash
git clone <repo> && cd webbot-ai
cp .env.example .env
# Edit .env — add GROQ_API_KEY and EXA_API_KEY
```

### 3. Start backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8080
```

### 4. Start frontend (separate terminal)
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** and start chatting.

---

## UI Features

| Feature | Details |
|---------|---------|
| **Neural particle canvas** | 45 floating teal nodes connected by dynamic webs, follows mouse cursor |
| **Responsive sidebar** | Desktop: fixed side panel · Mobile: sliding drawer with backdrop overlay |
| **Mobile header bar** | Sticky frosted glass header (`backdrop-blur-md`) with hamburger menu |
| **Multi-chat threads** | Sidebar shows chat history, new/switch/delete via trash icon |
| **Breathing dot pattern** | Subtle background dots that pulse opacity on a 10s cycle |
| **Sticky search bar** | Bottom-anchored input when thread is active |
| **Inline citation tooltips** | Hover `[N]` badges to see source URL, title, and preview |
| **Sources panel** | Horizontal scrollable source cards with favicons |
| **Related questions** | 3 clickable follow-up suggestions after each answer |
| **Conversation history** | Prior Q&A sent as context so follow-ups understand references |

## Architecture

```
POST /chat {query, history}
       │
       ▼
┌──────────────────┐
│   query_node     │  Clean & validate input (max 500 chars)
└────────┬─────────┘
         ▼
┌──────────────────┐
│   intent_node    │  Regex fast-path → LLM classifier → "chat" or "search"
└────────┬─────────┘
         ▼
┌──────────────────┐
│   search_node    │  If "search": fetch 4 results from Exa AI
└────────┬─────────┘
         ▼
┌──────────────────────┐
│   context_builder    │  Format results into structured source list
└────────┬─────────────┘
         ▼
┌──────────────────┐
│   generate_node  │  "chat" → direct Groq · "search" → grounded answer w/ [N] citations
└────────┬─────────┘
         ▼
┌──────────────────┐
│   followup_node  │  Generate 3 follow-up questions
└────────┬─────────┘
         ▼
    JSON response {answer, sources, follow_up_questions}
```

### Intent detection

```
User message → Greeting regex? ──Yes──► "chat"
                   │ No
                   ▼
             Self-ref patterns? ──Yes──► "chat"
                   │ No
                   ▼
             LLM classifier ──► "chat" or "search"
```

### Conversation history

Prior Q&A is injected into the LLM's system prompt so follow-ups like *"how much do they pay"* understand *"they"* refers to the previously mentioned company. Sent as `{role, content}[]` in the POST body.

---

## Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS v4, ReactMarkdown, Lucide icons, HTML5 Canvas
- **Backend:** FastAPI, LangGraph, Pydantic v2
- **LLM:** Groq — `llama-3.3-70b-versatile` (primary), `llama-3.1-8b-instant` (fallback)
- **Search:** Exa AI — 4 results, 400 chars text + 300 chars highlights per result
