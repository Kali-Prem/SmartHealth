"""Tests for Top-Level Endpoints, AI Copilot API and Input Validation Edge Cases."""

from fastapi import status


def test_healthz_endpoint(client):
    """Test /healthz liveness probe."""
    response = client.get("/healthz")
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["status"] == "ok"


def test_readyz_endpoint(client):
    """Test /readyz readiness probe."""
    response = client.get("/readyz")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["status"] in ["ready", "degraded"]
    assert data["database_connected"] is True


def test_ai_copilot_endpoint(client):
    """Test /api/v1/ai/copilot endpoint."""
    payload = {
        "query": "Which PHC needs emergency antivenom?",
        "language": "en",
        "context_centre_id": "phc_003",
    }
    response = client.post("/api/v1/ai/copilot", json=payload)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "reply" in data
    assert data["language"] == "en"
    assert "sources" in data


def test_ai_advisory_endpoint(client):
    """Test /api/v1/ai/advisory endpoint."""
    payload = {
        "disease": "dengue",
        "centre_id": "phc_001",
        "cases_count": 8,
        "language": "hi",
    }
    response = client.post("/api/v1/ai/advisory", json=payload)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["language"] == "hi"
    assert "title" in data
    assert "public_advisory_message" in data


def test_ai_voice_query_endpoint(client):
    """Test /api/v1/ai/voice-query endpoint."""
    payload = {
        "speech_transcript": "दवाइयों के स्टॉक की स्थिति बताएं",
        "language": "hi",
    }
    response = client.post("/api/v1/ai/voice-query", json=payload)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["language"] == "hi"
    assert len(data["reply"]) > 0


def test_bad_input_validation_error(client, staff_headers):
    """Test that invalid payload structure returns 422 Unprocessable Entity."""
    # Negative cases or missing required fields
    bad_report = {
        "centre_id": "phc_001",
        "disease": "invalid_disease_type",  # Invalid enum value
        "new_cases": -5,  # Must be >= 0
    }
    response = client.post("/api/v1/surveillance/report", json=bad_report, headers=staff_headers)
    assert response.status_code in [status.HTTP_422_UNPROCESSABLE_ENTITY, 422]
