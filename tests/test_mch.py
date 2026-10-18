"""Tests for Maternal & Child Health (MCH) and Immunization tracking."""

from fastapi import status


def test_get_mch_summary(client):
    """Test retrieving district MCH performance indicators."""
    response = client.get("/api/v1/mch/summary")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["total_pregnant_women_tracked"] > 0
    assert data["district_institutional_delivery_percent"] > 0
    assert "block_immunization_rankings" in data
    assert "high_priority_centres" in data


def test_record_maternal_cohort(client):
    """Test submitting monthly maternal cohort metrics."""
    cohort = {
        "centre_id": "phc_004",
        "reporting_month": "2026-10",
        "anc_registered_total": 50,
        "anc_first_trimester": 42,
        "anc_four_plus_visits": 38,
        "high_risk_pregnancies_identified": 6,
        "severe_anaemia_cases": 2,
        "hypertensive_disorders_cases": 1,
        "institutional_deliveries": 22,
        "home_deliveries": 0,
        "c_section_deliveries": 3,
        "maternal_deaths": 0,
    }
    response = client.post("/api/v1/mch/cohort", json=cohort)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["institutional_delivery_rate_percent"] == 100.0
    assert data["early_registration_rate_percent"] == 84.0


def test_get_immunization_cohort(client):
    """Test retrieving facility immunization antigen coverage and dropouts."""
    response = client.get("/api/v1/mch/immunization/phc_001")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["centre_id"] == "phc_001"
    assert "antigens" in data
    assert len(data["antigens"]) >= 6
    # Verify antigen fields
    first_antigen = data["antigens"][0]
    assert "antigen" in first_antigen
    assert "coverage_percent" in first_antigen
    assert "dropout_rate_percent" in first_antigen
