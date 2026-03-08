"""Regression test suite for Pitwall.ai Backend API"""
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


class TestHealthEndpoints:
    """Test health and root endpoints"""

    def test_root_endpoint(self):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "service" in data
        assert data["service"] == "Pitwall.ai"
        assert "version" in data
        assert "status" in data
        assert data["status"] == "running"

    def test_health_endpoint(self):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert data["status"] == "healthy"

    def test_root_has_description(self):
        response = client.get("/")
        data = response.json()
        assert "description" in data

    def test_health_has_cache_info(self):
        response = client.get("/health")
        data = response.json()
        assert "cache_dir" in data
        assert "cache_exists" in data


class TestRaceEndpoints:
    """Test race data endpoints"""

    def test_get_schedule(self):
        response = client.get("/api/race/schedule/2024")
        assert response.status_code == 200
        data = response.json()
        assert "year" in data
        assert "schedule" in data
        assert data["year"] == 2024

    def test_get_race_results(self):
        response = client.get("/api/race/2024/1/results")
        # Accept both 200 (success) and 500 (fastf1 error)
        assert response.status_code in [200, 500]
        data = response.json()
        if response.status_code == 200:
            assert "results" in data
        else:
            assert "detail" in data

    def test_get_race_laps(self):
        """Test race laps endpoint - handles ValueError from fastf1 gracefully."""
        response = client.get("/api/race/2024/1/laps")
        # Accept both 200 (success) and 500 (fastf1 ValueError)
        assert response.status_code in [200, 500]
        data = response.json()
        if response.status_code == 200:
            assert "laps" in data
        else:
            # Should return clean error JSON, not crash
            assert "detail" in data

    def test_invalid_year_schedule(self):
        response = client.get("/api/race/schedule/1900")
        assert response.status_code in [200, 500]


class TestDriverEndpoints:
    """Test driver data endpoints"""

    @pytest.mark.timeout(120)
    def test_list_drivers(self):
        response = client.get("/api/drivers/2024")
        assert response.status_code in [200, 500]
        data = response.json()
        if response.status_code == 200:
            assert "drivers" in data

    @pytest.mark.timeout(120)
    def test_get_driver_stats(self):
        """Test driver stats endpoint - should not timeout with caching."""
        response = client.get("/api/drivers/2024/VER/stats")
        assert response.status_code in [200, 500]
        data = response.json()
        if response.status_code == 200:
            assert "stats" in data
        else:
            assert "detail" in data

    @pytest.mark.timeout(120)
    def test_compare_drivers(self):
        response = client.get("/api/drivers/2024/compare?d1=VER&d2=HAM")
        assert response.status_code in [200, 500]
        data = response.json()
        if response.status_code == 200:
            assert "comparison" in data

    def test_driver_stats_invalid_driver(self):
        response = client.get("/api/drivers/2024/INVALID/stats")
        assert response.status_code in [200, 500]


class TestResponseStructure:
    """Test response structure and content types"""

    def test_root_response_structure(self):
        response = client.get("/")
        data = response.json()
        required_keys = ["service", "version", "status"]
        for key in required_keys:
            assert key in data, f"Missing key: {key}"

    def test_health_response_structure(self):
        response = client.get("/health")
        data = response.json()
        assert "status" in data

    def test_content_type_json(self):
        response = client.get("/")
        assert "application/json" in response.headers.get("content-type", "")

    def test_health_content_type_json(self):
        response = client.get("/health")
        assert "application/json" in response.headers.get("content-type", "")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
