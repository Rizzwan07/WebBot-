"""
Exa AI web search integration.

search_web() is called by the LangGraph search node.
"""

from exa_py import AsyncExa

from config import settings


class SearchConfigError(ValueError):
    """Raised when search is not configured (e.g. missing API key)."""


class SearchAPIError(Exception):
    """Raised when the Exa API request fails."""

_exa_client: AsyncExa | None = None

DEFAULT_NUM_RESULTS = 8


def _get_exa_client() -> AsyncExa:
    global _exa_client
    if _exa_client is None:
        if not settings.exa_api_key:
            raise SearchConfigError(
                "EXA_API_KEY is not set. Add it to your .env file to enable web search."
            )
        _exa_client = AsyncExa(api_key=settings.exa_api_key)
    return _exa_client


def _extract_content(item) -> str:
    """Pull text, highlights, or summary from an Exa result."""
    text = getattr(item, "text", None) or ""
    if isinstance(text, str) and text.strip():
        return text.strip()

    highlights = getattr(item, "highlights", None)
    if highlights:
        if isinstance(highlights, list):
            joined = "\n".join(str(h).strip() for h in highlights if h)
            if joined.strip():
                return joined.strip()

    summary = getattr(item, "summary", None) or ""
    if isinstance(summary, str) and summary.strip():
        return summary.strip()

    return ""


async def search_web(query: str, num_results: int = DEFAULT_NUM_RESULTS) -> list[dict]:
    """
    Search the web with Exa AI.

    Returns dicts with: title, url, content (text/highlights/summary).
    """
    client = _get_exa_client()

    try:
        response = await client.search(
            query,
            num_results=num_results,
            type="auto",
            contents={
                "text": {"maxCharacters": 6000},
                "highlights": {
                    "maxCharacters": 3500,
                    "numSentences": 8,
                },
            },
        )
    except SearchConfigError:
        raise
    except Exception as exc:
        raise SearchAPIError(f"Exa search failed: {exc}") from exc

    results: list[dict] = []
    for item in response.results:
        results.append(
            {
                "title": getattr(item, "title", None) or "Untitled",
                "url": getattr(item, "url", "") or "",
                "content": _extract_content(item),
            }
        )

    return results
