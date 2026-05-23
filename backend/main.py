from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

from graph import run_search_pipeline
from llm import LLMAPIError, LLMConfigError
from search import SearchAPIError, SearchConfigError

app = FastAPI(title="WebBot AI API", description="Backend for the WebBot AI Chatbot")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8080",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models ---


class ChatRequest(BaseModel):
    """Request model for user queries."""

    query: str = Field(..., min_length=1, description="User search question")

    @field_validator("query")
    @classmethod
    def query_not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Query cannot be empty.")
        return value


class SourceResponse(BaseModel):
    """A single cited web source."""

    id: int
    title: str
    url: str
    content: str


class ChatResponse(BaseModel):
    """Search results with Groq-generated answer."""

    query: str
    answer: str
    sources: list[SourceResponse] = Field(default_factory=list)
    follow_up_questions: list[str] = Field(default_factory=list)


# --- API Routes ---


@app.get("/")
async def root():
    """Health check endpoint to verify the backend is running."""
    return {"message": "WebBot AI Backend Running"}


@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Intent → chat (direct LLM) or search (Exa → LLM with citations).
    """
    try:
        result = await run_search_pipeline(request.query)
    except (SearchConfigError, LLMConfigError) as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except (SearchAPIError, LLMAPIError) as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return ChatResponse(
        query=result["query"],
        answer=result["answer"],
        sources=[SourceResponse(**source) for source in result["sources"]],
        follow_up_questions=result.get("follow_up_questions", []),
    )
