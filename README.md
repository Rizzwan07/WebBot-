# WebBot AI

A Perplexity-style AI web search chatbot powered by FastAPI, React, Groq (llama-3.3-70b), and Exa AI.

## Features
* Live web search
* Natural language AI responses
* Inline citations
* References section
* Suggested follow-up questions
* Chat-style interface

## Setup

1. Copy `.env.example` to `.env` and fill in your API keys.
2. Install backend dependencies: `pip install -r backend/requirements.txt`
3. Install frontend dependencies: `cd frontend && npm install`

## Running Locally

**Backend:**
```bash
cd backend
uvicorn main:app --reload
```

**Frontend:**
```bash
cd frontend
npm run dev
```

### 2. Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8080
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

## Architecture

```
User Query → Intent Detection (regex + LLM)
  → Chat  → Direct Groq response
  → Search → Exa web search → Context builder → Groq answer + follow-ups
```

## Tech Stack

- **Frontend:** React + Vite + Tailwind CSS v4
- **Backend:** FastAPI + LangGraph
- **LLM:** Groq (llama-3.3-70b-versatile)
- **Search:** Exa AI
