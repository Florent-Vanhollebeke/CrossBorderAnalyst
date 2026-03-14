# ============================================
# SwissRelocator — Tests TDD : core/exceptions
# backend/tests/test_exceptions.py
# ============================================

import sys
import os
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "app"))

from fastapi.testclient import TestClient
from fastapi import FastAPI
from core.exceptions import (
    SwissRelocatorError,
    ModelNotLoadedError,
    CityNotFoundError,
    RateLimitError,
    PDFGenerationError,
    register_exception_handlers,
)


# ============================================
# FIXTURES
# ============================================

@pytest.fixture
def app_with_handlers():
    """App FastAPI minimaliste avec les handlers enregistrés."""
    app = FastAPI()
    register_exception_handlers(app)

    @app.get("/base-error")
    def raise_base():
        raise SwissRelocatorError(detail="Erreur générique", status_code=400)

    @app.get("/model-not-loaded")
    def raise_model():
        raise ModelNotLoadedError()

    @app.get("/city-not-found")
    def raise_city():
        raise CityNotFoundError("Bern")

    @app.get("/rate-limit")
    def raise_rate():
        raise RateLimitError()

    @app.get("/pdf-error")
    def raise_pdf():
        raise PDFGenerationError()

    return TestClient(app)


# ============================================
# TESTS — HIÉRARCHIE DES EXCEPTIONS
# ============================================

class TestExceptionHierarchy:
    def test_model_not_loaded_is_swissrelocator_error(self):
        assert issubclass(ModelNotLoadedError, SwissRelocatorError)

    def test_city_not_found_is_swissrelocator_error(self):
        assert issubclass(CityNotFoundError, SwissRelocatorError)

    def test_rate_limit_is_swissrelocator_error(self):
        assert issubclass(RateLimitError, SwissRelocatorError)

    def test_pdf_generation_is_swissrelocator_error(self):
        assert issubclass(PDFGenerationError, SwissRelocatorError)

    def test_all_are_exceptions(self):
        assert issubclass(SwissRelocatorError, Exception)


# ============================================
# TESTS — STATUS CODES
# ============================================

class TestStatusCodes:
    def test_base_error_custom_status(self):
        err = SwissRelocatorError(detail="oops", status_code=422)
        assert err.status_code == 422

    def test_model_not_loaded_returns_503(self):
        err = ModelNotLoadedError()
        assert err.status_code == 503

    def test_city_not_found_returns_404(self):
        err = CityNotFoundError("TestCity")
        assert err.status_code == 404

    def test_rate_limit_returns_429(self):
        err = RateLimitError()
        assert err.status_code == 429

    def test_pdf_error_returns_500(self):
        err = PDFGenerationError()
        assert err.status_code == 500


# ============================================
# TESTS — MESSAGES
# ============================================

class TestErrorMessages:
    def test_city_not_found_includes_city_name(self):
        err = CityNotFoundError("Bern")
        assert "Bern" in err.detail

    def test_city_not_found_lists_supported_cities(self):
        err = CityNotFoundError("Anywhere")
        for city in ["Lyon", "Geneve", "Lausanne", "Zurich", "Basel"]:
            assert city in err.detail

    def test_model_not_loaded_has_default_message(self):
        err = ModelNotLoadedError()
        assert len(err.detail) > 0

    def test_model_not_loaded_custom_message(self):
        err = ModelNotLoadedError("XGBoost model file missing")
        assert "XGBoost model file missing" in err.detail

    def test_rate_limit_has_default_message(self):
        err = RateLimitError()
        assert "30" in err.detail  # mentionne la limite

    def test_rate_limit_custom_message(self):
        err = RateLimitError("Quota RAG dépassé")
        assert "RAG" in err.detail

    def test_pdf_error_has_default_message(self):
        err = PDFGenerationError()
        assert len(err.detail) > 0


# ============================================
# TESTS — HANDLERS HTTP (intégration FastAPI)
# ============================================

class TestHTTPHandlers:
    def test_base_error_returns_correct_status(self, app_with_handlers):
        resp = app_with_handlers.get("/base-error")
        assert resp.status_code == 400

    def test_base_error_json_has_error_key(self, app_with_handlers):
        resp = app_with_handlers.get("/base-error")
        body = resp.json()
        assert "error" in body
        assert "detail" in body
        assert "path" in body

    def test_model_not_loaded_http_503(self, app_with_handlers):
        resp = app_with_handlers.get("/model-not-loaded")
        assert resp.status_code == 503

    def test_city_not_found_http_404(self, app_with_handlers):
        resp = app_with_handlers.get("/city-not-found")
        assert resp.status_code == 404

    def test_city_not_found_body_contains_city(self, app_with_handlers):
        resp = app_with_handlers.get("/city-not-found")
        assert "Bern" in resp.json()["detail"]

    def test_rate_limit_http_429(self, app_with_handlers):
        resp = app_with_handlers.get("/rate-limit")
        assert resp.status_code == 429

    def test_pdf_error_http_500(self, app_with_handlers):
        resp = app_with_handlers.get("/pdf-error")
        assert resp.status_code == 500

    def test_error_response_includes_path(self, app_with_handlers):
        resp = app_with_handlers.get("/city-not-found")
        assert resp.json()["path"] == "/city-not-found"

    def test_error_response_includes_exception_class_name(self, app_with_handlers):
        resp = app_with_handlers.get("/model-not-loaded")
        assert resp.json()["error"] == "ModelNotLoadedError"
