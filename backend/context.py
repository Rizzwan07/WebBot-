"""
Format Exa search results into a prompt-ready context block for Gemini.
"""

MAX_CONTENT_CHARS = 4000


def format_search_context(sources: list[dict]) -> str:
    """
    Format sources for the answer prompt.

    Example:
    [1]
    Title: ...
    Content: ...

    [2]
    ...
    """
    blocks: list[str] = []
    for source in sources:
        content = (source.get("content") or "").strip()
        if len(content) > MAX_CONTENT_CHARS:
            content = content[:MAX_CONTENT_CHARS] + "..."

        blocks.append(
            f"[{source['id']}]\n"
            f"Title: {source.get('title') or 'Untitled'}\n"
            f"Content: {content or 'No extract available.'}"
        )
    return "\n\n".join(blocks)


def context_has_substance(context: str, min_chars: int = 80) -> bool:
    """True if context has enough text for Gemini to summarize."""
    return len(context.strip()) >= min_chars
