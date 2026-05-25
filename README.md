# WebBot AI

A Perplexity-style AI web search chatbot with live citations, multi-thread conversations, inline source tooltips, and an interactive particle animation background.

**Stack:** FastAPI + React (Vite) + Groq (llama-3.3-70b) + Exa AI + LangGraph + Tailwind CSS v4

**Live Demo:** [https://webbot-five.vercel.app](https://webbot-five.vercel.app)

---

## Quick Start

### 1. Prerequisites
- Python 3.10+
- Node.js 18+
- API keys: [Groq](https://console.groq.com/keys) (free) and [Exa AI](https://exa.ai) (free)

### 2. Clone & Configure
```bash
git clone https://github.com/Rizzwan07/WebBot-.git
cd webbot-ai
```

Create a `.env` file in the project root:
```env
# Backend
API_HOST=0.0.0.0
API_PORT=8080
DEBUG=True

# LLM Configuration (Groq — llama-3.3-70b)
# Get your free key at: https://console.groq.com/keys
GROQ_API_KEY=your_groq_api_key_here

# Web Search Configuration (Exa AI)
EXA_API_KEY=your_exa_api_key_here

# Frontend Configuration (Vite)
VITE_API_URL=http://127.0.0.1:8080
```

### 3. Start Backend
```bash
cd backend

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start server
uvicorn main:app --reload --port 8080
```

Backend runs at **http://localhost:8080**

### 4. Start Frontend (separate terminal)
```bash
cd frontend

# Install dependencies
npm install

# Start dev server
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
- **Deployment:** Frontend on Vercel (static), Backend runs separately

---

## Deployment

### Frontend (Vercel)
The frontend is deployed on Vercel and automatically rebuilds on every push to `main`.

**Deploy your own:**
1. Fork this repository
2. Import to [Vercel](https://vercel.com/new)
3. Set root directory to `frontend`
4. Deploy!

### Backend (Local/Server)
The Python FastAPI backend needs to be deployed separately. Options:

**Local Development:**
```bash
cd backend
uvicorn main:app --reload --port 8080
```

**Production Deployment Options:**
- **Railway** - Easiest Python hosting, automatic deploys from GitHub
- **Render** - Good free tier, simple setup
- **Fly.io** - More control and flexibility
- **AWS/GCP/Azure** - Traditional cloud platforms

After deploying the backend, update the `VITE_API_URL` environment variable in your Vercel project settings to point to your deployed backend URL.

---

## Environment Variables

### Backend Variables
Set these in your `.env` file or deployment platform:
- `GROQ_API_KEY` - Your Groq API key (required)
- `EXA_API_KEY` - Your Exa AI API key (required)
- `API_HOST` - Host address (default: `0.0.0.0`)
- `API_PORT` - Port number (default: `8080`)
- `DEBUG` - Debug mode (default: `True`)

### Frontend Variables
- `VITE_API_URL` - Backend API URL (default: `http://127.0.0.1:8080`)

---

## Project Structure

```
webbot-ai/
├── backend/          # FastAPI backend
│   ├── main.py       # FastAPI app & routes
│   ├── graph.py      # LangGraph pipeline
│   ├── llm.py        # Groq LLM interactions
│   ├── search.py     # Exa AI search
│   ├── context.py    # Context builder
│   ├── config.py     # Settings & env vars
│   └── requirements.txt
├── frontend/         # React frontend
│   ├── src/
│   │   ├── App.jsx           # Main app component
│   │   ├── components/       # React components
│   │   └── index.css         # Tailwind styles
│   ├── package.json
│   └── vite.config.js
├── .env             # Environment variables (not in git)
└── README.md        # This file
```

---

## Troubleshooting

### Backend won't start
**Error:** `ValidationError: Extra inputs are not permitted`
- **Fix:** Make sure your `.env` only contains backend variables, or the Settings class is configured to ignore extra fields

**Error:** `Missing API keys`
- **Fix:** Verify `GROQ_API_KEY` and `EXA_API_KEY` are set in your `.env` file

### Frontend can't connect to backend
**Error:** `Failed to fetch` or CORS errors
- **Fix:** Check that backend is running on port 8080
- **Fix:** Verify `VITE_API_URL` matches your backend URL
- **Fix:** Check CORS origins in `backend/main.py`

### API rate limits
- Groq free tier: 30 requests/minute
- Exa AI free tier: 1000 searches/month
- Consider upgrading if you hit limits

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## License

MIT License - feel free to use this project for your own purposes!
