"""Tests for Disease Surveillance, Outbreak Detection and IDSP threshold logic."""

from fastapi import status


def test_get_surveillance_summary(client):
    """Test retrieving district surveillance summary."""
    response = client.get("/api/v1/surveillance/summary")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "total_active_alerts" in data
    assert "district_case_trend_7d" in data
    assert len(data["district_case_trend_7d"]) == 7
    assert "disease_distribution" in data


def test_submit_syndromic_report(client, staff_headers):
    """Test submitting syndromic report from a health centre."""
    report = {
        "centre_id": "phc_004",
        "disease": "malaria",
        "new_cases": 4,
        "inpatient_admissions": 1,
        "deaths": 0,
        "reporting_date": "2026-10-18",
        "notes": "Suspected cases from migrant labour colony",
    }
    response = client.post("/api/v1/surveillance/report", json=report, headers=staff_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["disease"] == "malaria"
    assert data["new_cases"] == 4
    assert data["reported_by"] == "wagholi_moic"


def test_outbreak_threshold_breach_generates_alert(client, staff_headers):
    """Test that a surge of cases breaches threshold and creates an OutbreakAlert."""
    # Submit several high case reports to trigger anomaly threshold
    for i in range(3):
        report = {
            "centre_id": "phc_005",
            "disease": "cholera",
            "new_cases": 12,
            "inpatient_admissions": 4,
            "deaths": 0,
            "reporting_date": f"2026-10-1{5 + i}",
        }
        client.post("/api/v1/surveillance/report", json=report, headers=staff_headers)

    # Check alerts
    response = client.get("/api/v1/surveillance/alerts")
    assert response.status_code == status.HTTP_200_OK
    alerts = response.json()
    cholera_alert = next(
        (a for a in alerts if a["disease"] == "cholera" and a["centre_id"] == "phc_005"), None
    )
    assert cholera_alert is not None
    assert cholera_alert["severity"] in ["high", "outbreak"]
    assert "advisory_en" in cholera_alert
    assert "advisory_hi" in cholera_alert


def test_update_alert_status(client, admin_headers):
    """Test updating alert status to contained."""
    # Find an active alert
    alerts = client.get("/api/v1/surveillance/alerts").json()
    assert len(alerts) > 0
    target_alert_id = alerts[0]["id"]

    update_payload = {
        "status": "contained",
        "investigation_notes": "Rapid response team conducted superchlorination. Zero new cases.",
    }
    response = client.patch(
        f"/api/v1/surveillance/alerts/{target_alert_id}",
        json=update_payload,
        headers=admin_headers,
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["status"] == "contained"
