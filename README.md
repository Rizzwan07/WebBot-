# WebBot AI

A Perplexity-style AI web search chatbot powered by FastAPI, Streamlit, Gemini 2.5 Flash, and Exa AI.

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
3. Install frontend dependencies: `pip install -r frontend/requirements.txt`

## Running Locally

**Backend:**
```bash
cd backend
uvicorn main:app --reload
```

**Frontend:**
```bash
cd frontend
streamlit run app.py
```
