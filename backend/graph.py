"""
LangGraph workflow for WebBot AI.

User query
    → intent detection
        → chat  → direct LLM (Groq)
        → search → Exa → format context → LLM answer → follow-ups
"""

import re
import logging
from typing import TypedDict

from langgraph.graph import END, START, StateGraph

from context import context_has_substance, format_search_context
from llm import chat_direct, detect_intent, generate_answer, generate_follow_ups
from search import search_web

logger = logging.getLogger(__name__)


class Source(TypedDict):
    id: int
    title: str
    url: str
    content: str


class WorkflowState(TypedDict, total=False):
    query: str
    intent: str  # "chat" | "search"
    search_query: str
    search_results: list[dict]
    sources: list[Source]
    context: str
    answer: str
    follow_up_questions: list[str]


async def query_node(state: WorkflowState) -> dict:
    raw = state.get("query", "")
    cleaned = re.sub(r"\s+", " ", raw.strip())
    if not cleaned:
        raise ValueError("Query cannot be empty.")
    if len(cleaned) > 500:
        raise ValueError("Query is too long (max 500 characters).")
    return {"query": cleaned}


async def intent_node(state: WorkflowState) -> dict:
    """Detect: casual chat (direct LLM) vs needs web search (Exa → LLM)."""
    result = await detect_intent(state["query"])
    return {
        "intent": result["intent"],
        "search_query": result["search_query"],
    }


async def search_node(state: WorkflowState) -> dict:
    """Exa web search — skipped for chat intent."""
    if state.get("intent") != "search":
        return {"search_results": []}
    query = state.get("search_query") or state["query"]
    results = await search_web(query)
    return {"search_results": results}


async def context_builder_node(state: WorkflowState) -> dict:
    """Format Exa results for the answer prompt — skipped for chat."""
    if state.get("intent") != "search":
        return {"sources": [], "context": ""}

    sources: list[Source] = []
    for index, hit in enumerate(state.get("search_results", []), start=1):
        sources.append(
            {
                "id": index,
                "title": hit.get("title") or "Untitled",
                "url": hit.get("url") or "",
                "content": hit.get("content") or "",
            }
        )
    return {
        "sources": sources,
        "context": format_search_context(sources),
    }


async def generate_node(state: WorkflowState) -> dict:
    """Direct LLM for chat, or grounded LLM answer after Exa search."""
    if state.get("intent") == "chat":
        try:
            answer = await chat_direct(state["query"])
            return {"answer": answer}
        except Exception:
            return {"answer": "Hey there! 👋 I'm WebBot AI. Ask me anything and I'll search the web for you!"}

    context = state.get("context", "")
    if not context_has_substance(context):
        return {
            "answer": (
                "I searched the web but could not extract enough text to "
                "answer. Try rephrasing your question."
            ),
        }

    try:
        answer = await generate_answer(state["query"], context)
        if not answer or not answer.strip():
            return {"answer": "I found some sources but couldn't generate a clear answer. Try rephrasing your question."}
        return {"answer": answer}
    except Exception as exc:
        logger.exception("generate_answer failed: %s", exc)
        err_str = str(exc)
        if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
            return {"answer": "I'm experiencing high demand right now. Please wait a few seconds and try again. 🔄"}
        return {"answer": "I found some sources but ran into an issue generating an answer. Please try again."}


async def followup_node(state: WorkflowState) -> dict:
    """Generate follow-up questions after the answer is ready."""
    if state.get("intent") == "chat":
        return {"follow_up_questions": []}

    query = state.get("query", "")
    answer = state.get("answer", "")
    questions = await generate_follow_ups(query, answer)
    return {"follow_up_questions": questions}


_graph = StateGraph(WorkflowState)
_graph.add_node("query", query_node)
_graph.add_node("intent", intent_node)
_graph.add_node("search", search_node)
_graph.add_node("context_builder", context_builder_node)
_graph.add_node("generate", generate_node)
_graph.add_node("followup", followup_node)
_graph.add_edge(START, "query")
_graph.add_edge("query", "intent")
_graph.add_edge("intent", "search")
_graph.add_edge("search", "context_builder")
_graph.add_edge("context_builder", "generate")
_graph.add_edge("generate", "followup")
_graph.add_edge("followup", END)

chat_pipeline = _graph.compile()


async def run_search_pipeline(user_query: str) -> dict:
    result = await chat_pipeline.ainvoke({"query": user_query})
    return {
        "query": result.get("query", user_query),
        "sources": result.get("sources", []),
        "answer": result.get("answer", ""),
        "context": result.get("context", ""),
        "follow_up_questions": result.get("follow_up_questions", []),
    }
