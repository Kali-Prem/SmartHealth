"""AI Gemini Assistant and Multilingual Copilot Models."""

from pydantic import BaseModel, Field


class AIChatRequest(BaseModel):
    """District Administrator natural language query payload."""

    query: str = Field(
        ..., min_length=2, max_length=1000, description="Natural language question or command"
    )
    language: str = Field(default="en", description="'en' for English, 'hi' for Hindi")
    context_centre_id: str | None = Field(default=None, description="Optional PHC context filter")
    user_role: str | None = Field(default="district_admin")


class AIChatResponse(BaseModel):
    """Gemini Copilot response with grounded sources and recommended actions."""

    reply: str
    language: str
    sources: list[str] = Field(default_factory=list)
    suggested_actions: list[str] = Field(default_factory=list)
    cached: bool = False
    processing_time_ms: float = 0.0


class AIAdvisoryRequest(BaseModel):
    """Generate localized outbreak public health advisory."""

    disease: str = Field(..., min_length=2, max_length=50)
    centre_id: str
    cases_count: int = Field(ge=1)
    language: str = Field(default="en")


class AIAdvisoryResponse(BaseModel):
    """Structured clinical & administrative containment protocol."""

    title: str
    summary: str
    clinical_management: list[str]
    containment_protocol: list[str]
    public_advisory_message: str
    language: str


class AIVoiceQueryRequest(BaseModel):
    """Voice query payload transcribed by browser Web Speech API."""

    speech_transcript: str = Field(..., min_length=1, max_length=1000)
    language: str = Field(default="en")
    context_centre_id: str | None = None


class AIVoiceQueryResponse(BaseModel):
    """Processed voice query reply."""

    transcript_received: str
    reply: str
    language: str
    suggested_actions: list[str] = Field(default_factory=list)
