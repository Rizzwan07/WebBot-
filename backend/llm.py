"""
LLM integration via Groq (llama-3.3-70b).

- detect_intent(): chat vs web search
- chat_direct(): casual conversation (no Exa)
- generate_answer(): grounded answer from search context and follows up
"""

import json
import re
import logging

from groq import AsyncGroq

from config import settings

logger = logging.getLogger(__name__)

# ─── Groq models ───
PRIMARY_MODEL = "llama-3.3-70b-versatile"
FALLBACK_MODEL = "llama-3.1-8b-instant"

_client: AsyncGroq | None = None

_CHAT_PATTERN = re.compile(
    r"^(hi+|hey+|hello+|howdy|yo|sup|hola|greetings|thanks|thank\s+you|thx|ty|ok|okay|cool|nice|awesome|great|wow|bye|goodbye|see\s+ya|see\s+you|good\s*morning|good\s*night|how\s+are\s+you|what's\s+up|whats\s+up|how\s+is\s+it\s+going|hows\s+it\s+going)[\s!.?]*$",
    re.IGNORECASE,
)


class LLMConfigError(ValueError):
    """Raised when no LLM provider is configured."""


class LLMAPIError(Exception):
    """Raised when all LLM models fail."""


def _get_client() -> AsyncGroq:
    """Initialize and cache the Groq client."""
    global _client
    if _client is None:
        if not settings.groq_api_key:
            raise LLMConfigError(
                "GROQ_API_KEY is not set. Add it to your .env file to enable AI answers."
            )
        _client = AsyncGroq(api_key=settings.groq_api_key)
    return _client


async def _generate_text(
    prompt: str,
    max_output_tokens: int | None = None,
) -> str:
    """Send a prompt to Groq and return text. Tries primary model, falls back to lighter model."""
    client = _get_client()

    for model in (PRIMARY_MODEL, FALLBACK_MODEL):
        try:
            kwargs = {
                "model": model,
                "messages": [{"role": "user", "content": prompt}],
            }
            if max_output_tokens is not None:
                kwargs["max_tokens"] = min(max_output_tokens, 8000)
            response = await client.chat.completions.create(**kwargs)
            text = response.choices[0].message.content
            if text and text.strip():
                return text.strip()
            raise LLMAPIError(f"Groq ({model}) returned empty response.")
        except LLMConfigError:
            raise
        except Exception as exc:
            last_exc = exc
            logger.warning("Groq model %s failed: %s", model, exc)
            continue

    raise LLMAPIError(f"All Groq models failed: {last_exc}") from last_exc


def _parse_json_object(text: str) -> dict:
    """Extract the first JSON object from model output."""
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("No JSON object in response")
    return json.loads(text[start : end + 1])


def _fallback_intent(message: str) -> dict:
    """Rule-based fallback when LLM can't classify intent."""
    text = message.strip()
    lower = text.lower()

    if _CHAT_PATTERN.match(text) or (len(text) <= 6 and lower.startswith("hi")):
        return {"intent": "chat", "search_query": ""}

    # Self-referential questions about the AI — no web search needed
    self_ref_patterns = (
        "who are you", "what are you", "what can you do",
        "what do you do", "how do you work", "tell me about yourself",
        "what is your name", "what's your name", "whats your name",
        "are you a bot", "are you ai", "are you an ai",
        "what are your capabilities", "help me", "can you help",
        "introduce yourself",
    )
    if any(p in lower for p in self_ref_patterns):
        return {"intent": "chat", "search_query": ""}

    search_signals = (
        "?", "what ", "who ", "when ", "where ", "why ", "how ",
        "latest", "news", "today", "current", "price of", "define ",
    )
    if any(s in lower for s in search_signals) or len(text.split()) >= 4:
        return {"intent": "search", "search_query": text}

    if len(text.split()) <= 2 and len(text) <= 12:
        return {"intent": "chat", "search_query": ""}

    return {"intent": "search", "search_query": text}


async def detect_intent(message: str) -> dict:
    """
    Decide how to handle the user message.

    Returns:
        intent: "chat" (direct LLM) or "search" (Exa → LLM)
        search_query: rewritten query for Exa when intent is search
    """
    # Fast path: regex catches obvious greetings without an LLM call
    fallback = _fallback_intent(message)
    if fallback["intent"] == "chat":
        return fallback

    # Ambiguous — let the LLM classify (handles self-referential questions,
    # edge cases, future variations without code changes)
    prompt = f"""You are the intent classifier for WebBot AI.
Your job is to classify the user's message into one of two categories: "chat" or "search".

Categories:
1. "chat": Casual conversation, greetings, saying thanks, apologies, small talk, jokes, opinions, or general questions about yourself or how you work (e.g. "who are you", "is this hardcoded"). No web facts or search is needed to answer.
2. "search": Factual questions, questions about news, current events, definitions, instructions, prices, or anything requiring current or external web information.

Rule: If the message is conversational, casual, or about you/how you work, classify it as "chat".

Reply ONLY with a raw JSON object:
{{
  "intent": "chat" or "search",
  "search_query": "rewritten search keywords if search, otherwise empty string"
}}

User message: {message}"""

    try:
        raw = await _generate_text(prompt, max_output_tokens=128)
        data = _parse_json_object(raw)
        intent = (data.get("intent") or "search").strip().lower()
        if intent not in ("chat", "search"):
            intent = "search"
        search_query = (data.get("search_query") or "").strip()
        if intent == "search" and not search_query:
            search_query = message
        return {"intent": intent, "search_query": search_query}
    except Exception:
        return fallback


def _format_history(history: list[dict]) -> str:
    if not history:
        return ""
    lines = []
    for msg in history:
        role = "User" if msg.get("role") == "user" else "Assistant"
        lines.append(f"{role}: {msg.get('content', '')}")
    return "\n".join(lines)


async def chat_direct(message: str, history: list | None = None) -> str:
    """Direct LLM reply for casual conversation (no Exa search)."""
    history_block = ""
    if history:
        formatted = _format_history(history)
        history_block = f"\nPrevious conversation:\n{formatted}\n\n"

    prompt = f"""You are WebBot AI, a friendly, warm, and helpful AI assistant.
The user is chatting casually. Respond in a friendly, engaging, and highly concise manner (1-2 sentences).
Do not include any links, citations, or search sources.
{history_block}User message: {message}

Friendly, concise reply:"""
    return await _generate_text(prompt, max_output_tokens=256)


def _build_answer_prompt(query: str, context: str, history: list | None = None) -> str:
    history_block = ""
    if history:
        formatted = _format_history(history)
        history_block = f"\nPrevious conversation:\n{formatted}\n\n"

    return f"""You are WebBot AI, a friendly and professional AI web research assistant.

Using the search context provided, write a comprehensive, well-structured answer to the user's question.
{history_block}

FORMATTING RULES:
1. Start with ONE concise intro sentence (max 2 lines) that frames the answer. Then go straight to the data.
2. For list/comparison questions:
   - Use a NUMBERED LIST.
   - Each item: **Bold Name** — detail 1; detail 2; detail 3.
   - Example: **NIT Trichy** — Total fees: ~Rs. 3.35 lakh; Average package: ~Rs. 16 LPA [1].
   - List ONLY what the search context supports. Do NOT invent entries.
3. For simple factual questions: give a concise 2-4 sentence answer.
4. After the main list, add a "**Notes and guidance**" section with 2-3 practical tips.
5. End with a conversational closing that offers to go deeper.

CONTENT RULES:
- Cite every fact using the source numbers you see in the context (e.g., [1], [2]).
- If a fact is not in the context, do NOT cite it.
- Use approximate ranges where exact data varies.
- Never cut off mid-sentence. Always complete your thoughts.
- Do NOT copy long passages. Synthesize into your own words.

Context:
{context}

Question: {query}

Answer:"""


def _truncate_context(context: str, max_chars: int = 6000) -> str:
    if len(context) <= max_chars:
        return context
    return context[:max_chars] + "\n\n[Context truncated due to length.]"


async def generate_answer(query: str, context: str, history: list | None = None) -> str:
    """Grounded answer from Exa context (web search path)."""
    from context import context_has_substance

    if not context_has_substance(context):
        return (
            "I could not find enough information in the search results "
            "to answer your question."
        )

    prompt = _build_answer_prompt(query, _truncate_context(context), history)
    answer = await _generate_text(prompt, max_output_tokens=8000)

    if _looks_like_link_only(answer):
        answer = await _generate_text(
            prompt + "\n\nWrite a full prose answer with [1] citations, not links only.",
            max_output_tokens=8000,
        )
    return answer


def _looks_like_link_only(text: str) -> bool:
    stripped = text.strip()
    if len(stripped) < 40:
        return True
    lines = [ln.strip() for ln in stripped.splitlines() if ln.strip()]
    if not lines:
        return True
    link_like = sum(
        1
        for ln in lines
        if ln.startswith("http") or (ln.startswith("[") and "](" in ln)
    )
    return link_like >= len(lines) and len(lines) <= 6


async def generate_follow_ups(query: str, answer: str, history: list | None = None) -> list[str]:
    """Generate 3 related follow-up questions based on the conversation."""
    history_block = ""
    if history:
        formatted = _format_history(history)
        history_block = f"\nPrevious conversation:\n{formatted}\n"

    prompt = f"""Based on this Q&A, suggest exactly 3 follow-up questions the user might ask next.
{history_block}
Question: {query}
Answer: {answer}

Rules:
- Return ONLY a JSON array of 3 strings
- Each question should be specific and actionable (under 80 chars)
- Questions should explore different useful angles: comparison, deeper detail, or related topic
- Make them sound natural, like what a real user would type
- Example good follow-ups: "Compare NIT Trichy vs VIT for MCA placements", "Which MCA colleges have the best ROI?", "What entrance exams are needed for top MCA programs?"

Response (JSON array only):"""

    try:
        raw = await _generate_text(prompt, max_output_tokens=256)
        raw = raw.strip()
        if raw.startswith("```"):
            raw = re.sub(r"^```(?:json)?\s*", "", raw)
            raw = re.sub(r"\s*```$", "", raw)
        start = raw.find("[")
        end = raw.rfind("]")
        if start == -1 or end == -1:
            return []
        questions = json.loads(raw[start : end + 1])
        if isinstance(questions, list):
            return [str(q).strip() for q in questions[:3] if q]
    except Exception as exc:
        logger.warning("generate_follow_ups failed: %s", exc)
    return []
