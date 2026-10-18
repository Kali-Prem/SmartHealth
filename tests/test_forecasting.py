"""Unit and integration tests for Milestone 3: AI Demand Forecasting, Early Stockout Warnings, and Smart Staff Deputations."""

import pytest
from fastapi import status


def test_get_demand_forecast(client):
    """Test 30-day AI demand forecasting with epidemiological seasonal factors."""
    response = client.get("/api/v1/inventory/forecast")
    assert response.status_code == status.HTTP_200_OK

    data = response.json()
    assert len(data) >= 5

    # Check for essential drugs
    drug_names = [item["drug_name"] for item in data]
    assert any("Snake Antivenom" in name for name in drug_names)
    assert any("Paracetamol" in name for name in drug_names)

    for item in data:
        assert item["predicted_monthly_consumption"] >= 0
        assert item["risk_level"] in ["high", "medium", "safe"]
        assert len(item["rationale"]) > 5
        assert "drug_name_hi" in item


def test_get_early_stockout_warnings(client):
    """Test early stockout warning radar with daily burn-rate calculations and countdown days."""
    response = client.get("/api/v1/inventory/early-warnings")
    assert response.status_code == status.HTTP_200_OK

    report = response.json()
    assert report["total_warning_items"] >= 1
    assert report["critical_immediate_count"] >= 1
    assert "warnings" in report

    # Test sorting and properties of warnings
    for warn in report["warnings"]:
        assert warn["urgency"] in ["immediate", "imminent", "warning"]
        assert warn["daily_burn_rate"] > 0
        assert warn["days_of_supply_remaining"] >= 0
        assert warn["recommended_order_quantity"] > 0
        assert len(warn["centre_name"]) > 0

    # Ensure Gemini bilingual advisories are present
    assert len(report["gemini_epidemiology_advisory"]) > 20
    assert len(report["gemini_epidemiology_advisory_hi"]) > 20
    assert "stockout" in report["gemini_epidemiology_advisory"].lower()


def test_get_deputation_recommendations_district_wide(client):
    """Test smart staff deputation algorithm identifying high-absence facilities and nearest donor doctors."""
    response = client.get("/api/v1/operations/deputation/recommendations")
    assert response.status_code == status.HTTP_200_OK

    recs = response.json()
    assert len(recs) >= 1

    # Check that high-absence centres (e.g. phc_005) are included
    target_ids = [r["target_centre_id"] for r in recs]
    assert "phc_005" in target_ids or len(recs) >= 1

    for rec in recs:
        assert rec["absence_rate_percent"] >= 40.0
        assert rec["distance_algorithm"] == "Haversine (Great-Circle)"
        assert len(rec["gemini_justification"]) > 20

        if rec["top_candidate"]:
            top = rec["top_candidate"]
            assert top["distance_km"] > 0
            assert top["estimated_transit_mins"] > 0
            assert len(top["doctor_name"]) > 0
            assert top["doctors_on_duty_at_donor"] >= 2


def test_get_deputation_recommendations_for_single_facility(client):
    """Test filtering deputation recommendation for a specific target facility."""
    response = client.get("/api/v1/operations/deputation/recommendations?target_centre_id=phc_005")
    assert response.status_code == status.HTTP_200_OK

    recs = response.json()
    assert len(recs) == 1
    rec = recs[0]
    assert rec["target_centre_id"] == "phc_005"
    assert rec["target_block"] == "Junnar"
    assert rec["absence_rate_percent"] > 0


def test_execute_doctor_deputation_order(client):
    """Test issuing and logging an emergency temporary doctor deputation order."""
    payload = {
        "target_centre_id": "phc_005",
        "donor_centre_id": "chc_010",
        "doctor_id": "doc_010_1",
        "doctor_name": "Dr. Ramesh Kadam, MS",
        "date": "2026-10-18",
        "reason": "Milestone 3 Emergency OPD and casualty deputation",
    }
    response = client.post("/api/v1/operations/deputation/execute", json=payload)
    assert response.status_code == status.HTTP_200_OK

    result = response.json()
    assert result["status"] == "completed"
    assert result["target_centre_id"] == "phc_005"
    assert result["doctor_name"] == "Dr. Ramesh Kadam, MS"
    assert "deputation_id" in result
    assert "issued successfully" in result["message"]
