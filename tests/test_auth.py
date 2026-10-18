"""Tests for Authentication, JWT tokens and RBAC."""

from fastapi import status


def test_login_success(client):
    """Test successful login with admin credentials."""
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "adminpassword123"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "district_admin"
    assert data["username"] == "admin"


def test_login_invalid_password(client):
    """Test login failure with wrong password."""
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "wrongpassword!"},
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "Incorrect username or password" in response.json()["detail"]


def test_login_nonexistent_user(client):
    """Test login failure with unknown username."""
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "nonexistent_doctor", "password": "anyPassword123"},
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_get_profile_authenticated(client, admin_headers):
    """Test retrieving user profile with valid JWT."""
    response = client.get("/api/v1/auth/me", headers=admin_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["username"] == "admin"
    assert data["role"] == "district_admin"


def test_get_profile_unauthenticated(client):
    """Test that missing authorization token returns 401."""
    response = client.get("/api/v1/auth/me")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_register_new_user_by_admin(client, admin_headers):
    """Test admin registering a new staff member."""
    new_user = {
        "username": "shirur_doctor",
        "email": "shirur.moic@smarthealth.gov.in",
        "full_name": "Dr. Rohit Sharma, MOIC",
        "password": "securepassword123",
        "role": "centre_staff",
        "centre_id": "phc_006",
        "district": "Pune",
    }
    response = client.post("/api/v1/auth/register", json=new_user, headers=admin_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["username"] == "shirur_doctor"
    assert data["role"] == "centre_staff"


def test_register_user_duplicate_error(client, admin_headers):
    """Test duplicate registration returns 400 Bad Request."""
    payload = {
        "username": "admin",
        "email": "duplicate@test.com",
        "full_name": "Duplicate Admin",
        "password": "password123",
        "role": "district_admin",
        "district": "Pune",
    }
    response = client.post("/api/v1/auth/register", json=payload, headers=admin_headers)
    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_register_user_forbidden_for_staff(client, staff_headers):
    """Test that centre_staff cannot register new users (RBAC check)."""
    payload = {
        "username": "unauthorized_user",
        "email": "unauth@test.com",
        "full_name": "Unauthorized User",
        "password": "password123",
        "role": "centre_staff",
    }
    response = client.post("/api/v1/auth/register", json=payload, headers=staff_headers)
    assert response.status_code == status.HTTP_403_FORBIDDEN
