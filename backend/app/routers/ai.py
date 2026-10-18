"""Gemini AI Assistant, Outbreak Advisory and Multilingual Copilot API Endpoints."""

from typing import Any

from fastapi import APIRouter, Depends

from backend.app.database import DatabaseClient, get_db
from backend.app.models.ai import (
    AIAdvisoryRequest,
    AIAdvisoryResponse,
    AIChatRequest,
    AIChatResponse,
    AIVoiceQueryRequest,
    AIVoiceQueryResponse,
)
from backend.app.services.gemini_service import GeminiService, get_gemini_service

router = APIRouter(prefix="/ai", tags=["AI Copilot & Advisories"])


async def _build_live_district_context(
    db: DatabaseClient, centre_id: str | None = None
) -> dict[str, Any]:
    """Compile live telemetry, stockouts, and outbreaks to ground LLM reasoning.

    Uses filtered Firestore queries and strict limits instead of full collection scans.
    """
    centres = await db.query_documents("centres", limit=25)
    alerts = await db.query_documents(
        "outbreak_alerts",
        filters=[("status", "in", ["active", "under_investigation"])],
        limit=10,
    )
    critical_stock_docs = await db.query_documents(
        "inventory",
        filters=[("current_stock", "<=", 0)],
        limit=20,
    )

    critical_stockouts = [
        f"{i.get('drug_name')} at {i.get('centre_id')}" for i in critical_stock_docs
    ]

    active_outbreaks = [
        f"{a.get('disease')} at {a.get('centre_name')} ({a.get('current_cases_7d')} cases in 7 days)"
        for a in alerts
    ]

    context: dict[str, Any] = {
        "district": "Pune District, Maharashtra",
        "total_active_centres": len(centres),
        "critical_active_outbreaks": active_outbreaks,
        "critical_medicine_stockouts": critical_stockouts,
    }

    if centre_id:
        target_c = await db.get_document("centres", centre_id)
        if target_c:
            context["focused_facility"] = {
                "name": target_c.get("name"),
                "block": target_c.get("block"),
                "status": target_c.get("operational_status"),
                "in_charge": target_c.get("in_charge_doctor"),
                "cold_chain_temp": target_c.get("infrastructure", {}).get(
                    "cold_chain_temperature_c"
                ),
            }

    return context


@router.post("/copilot", response_model=AIChatResponse)
async def ask_copilot(
    payload: AIChatRequest,
    gemini_svc: GeminiService = Depends(get_gemini_service),
    db: DatabaseClient = Depends(get_db),
) -> AIChatResponse:
    """Natural language query to Gemini Copilot grounded with live district health telemetry."""
    context = await _build_live_district_context(db, payload.context_centre_id)
    result = await gemini_svc.ask_copilot(
        query=payload.query,
        language=payload.language,
        district_context=context,
    )
    return AIChatResponse(**result)


@router.post("/advisory", response_model=AIAdvisoryResponse)
async def generate_outbreak_advisory(
    payload: AIAdvisoryRequest,
    gemini_svc: GeminiService = Depends(get_gemini_service),
    db: DatabaseClient = Depends(get_db),
) -> AIAdvisoryResponse:
    """Generate structured outbreak containment protocol and bilingual public advisory."""
    centre = await db.get_document("centres", payload.centre_id)
    centre_name = centre.get("name", "Local Health Facility") if centre else "Local Health Facility"

    advisory_dict = await gemini_svc.generate_outbreak_advisory(
        disease=payload.disease,
        centre_name=centre_name,
        cases_count=payload.cases_count,
        language=payload.language,
    )
    return AIAdvisoryResponse(**advisory_dict)


@router.post("/voice-query", response_model=AIVoiceQueryResponse)
async def process_voice_query(
    payload: AIVoiceQueryRequest,
    gemini_svc: GeminiService = Depends(get_gemini_service),
    db: DatabaseClient = Depends(get_db),
) -> AIVoiceQueryResponse:
    """Process natural language transcribed audio input in Hindi or English."""
    context = await _build_live_district_context(db, payload.context_centre_id)
    chat_result = await gemini_svc.ask_copilot(
        query=payload.speech_transcript,
        language=payload.language,
        district_context=context,
    )

    return AIVoiceQueryResponse(
        transcript_received=payload.speech_transcript,
        reply=chat_result["reply"],
        language=payload.language,
        suggested_actions=chat_result.get("suggested_actions", []),
    )
