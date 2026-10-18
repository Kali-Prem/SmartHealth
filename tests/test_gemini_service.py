"""Tests for Gemini Service, Caching, Multilingual Output, and Failure Paths."""

import pytest

from backend.app.services.gemini_service import GeminiService


@pytest.mark.asyncio
async def test_gemini_copilot_english_fallback():
    """Test Gemini copilot intelligent rule-based fallback in English."""
    service = GeminiService()
    # Force offline client
    service._client = None

    response = await service.ask_copilot(
        "What is the protocol for dengue outbreak in Baramati?", language="en"
    )
    assert response["language"] == "en"
    assert (
        "IDSP" in response["reply"]
        or "Dengue" in response["reply"]
        or "Protocol" in response["reply"]
    )
    assert len(response["suggested_actions"]) > 0
    assert response["cached"] is False


@pytest.mark.asyncio
async def test_gemini_copilot_hindi_multilingual():
    """Test Gemini copilot generating Devanagari Hindi responses."""
    service = GeminiService()
    service._client = None

    response = await service.ask_copilot("डेंगू बुखार से बचाव के दिशा-निर्देश क्या हैं?", language="hi")
    assert response["language"] == "hi"
    # Ensure Devanagari characters are present
    assert any("\u0900" <= c <= "\u097f" for c in response["reply"])
    assert len(response["suggested_actions"]) > 0


@pytest.mark.asyncio
async def test_gemini_caching_behavior():
    """Test that repeated queries return cached response with cached=True."""
    service = GeminiService()
    query = "Unique test query about cold chain temperature compliance"

    # First call: cache miss
    first_resp = await service.ask_copilot(query, language="en")
    assert first_resp["cached"] is False

    # Second call: cache hit
    second_resp = await service.ask_copilot(query, language="en")
    assert second_resp["cached"] is True
    assert second_resp["reply"] == first_resp["reply"]


@pytest.mark.asyncio
async def test_gemini_api_exception_fallback():
    """Test that when Gemini API throws an exception, system falls back safely without crashing."""
    service = GeminiService()

    class FaultyClient:
        class Models:
            def generate_content(self, *args, **kwargs):
                raise RuntimeError("Google Gemini API 503 Service Unavailable")

        models = Models()

    service._client = FaultyClient()

    # Should not raise exception
    response = await service.ask_copilot("Acute antivenom shortage", language="en")
    assert response is not None
    assert "reply" in response
    assert len(response["reply"]) > 20


@pytest.mark.asyncio
async def test_gemini_generate_outbreak_advisory():
    """Test generating structured bilingual outbreak advisory."""
    service = GeminiService()
    service._client = None

    advisory_en = await service.generate_outbreak_advisory(
        disease="dengue",
        centre_name="Wagholi PHC",
        cases_count=14,
        language="en",
    )
    assert "title" in advisory_en
    assert "Wagholi" in advisory_en["title"]
    assert len(advisory_en["clinical_management"]) > 0
    assert len(advisory_en["containment_protocol"]) > 0
    assert len(advisory_en["public_advisory_message"]) > 0

    advisory_hi = await service.generate_outbreak_advisory(
        disease="dengue",
        centre_name="वाघोली पीएचसी",
        cases_count=14,
        language="hi",
    )
    assert advisory_hi["language"] == "hi"
    assert any("\u0900" <= c <= "\u097f" for c in advisory_hi["title"])
