# ============================================
# SwissRelocator — Tests TDD : core/rate_limiter
# backend/tests/test_rate_limiter.py
# ============================================

import sys
import os
import time
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "app"))

from fastapi.testclient import TestClient
from fastapi import FastAPI
from core.rate_limiter import (
    is_rate_limited,
    rate_limit_middleware,
    RATE_LIMIT_REQUESTS,
    RATE_LIMIT_WINDOW,
    _request_log,
)


# ============================================
# HELPERS
# ============================================

def _reset_ip(ip: str):
    """Vide le log de requêtes pour une IP donnée (isolation des tests)."""
    _request_log.pop(ip, None)


@pytest.fixture(autouse=True)
def isolate_ip():
    """Chaque test utilise une IP unique pour éviter les interférences."""
    yield
    # Nettoyage post-test
    for key in list(_request_log.keys()):
        if key.startswith("test_"):
            _request_log.pop(key, None)


@pytest.fixture
def app_with_limiter():
    """App FastAPI minimaliste avec le middleware de rate limiting."""
    app = FastAPI()
    app.middleware("http")(rate_limit_middleware)

    @app.get("/api/v1/ping")
    def ping():
        return {"ok": True}

    @app.get("/health")
    def health():
        return {"status": "ok"}

    return TestClient(app, raise_server_exceptions=False)


# ============================================
# TESTS — LOGIQUE SLIDING WINDOW
# ============================================

class TestSlidingWindow:
    def test_first_request_not_limited(self):
        ip = "test_first_request"
        _reset_ip(ip)
        assert is_rate_limited(ip) is False

    def test_requests_below_limit_not_blocked(self):
        ip = "test_below_limit"
        _reset_ip(ip)
        for _ in range(RATE_LIMIT_REQUESTS - 1):
            assert is_rate_limited(ip) is False

    def test_exactly_at_limit_is_blocked(self):
        ip = "test_at_limit"
        _reset_ip(ip)
        # Consomme toutes les requêtes autorisées
        for _ in range(RATE_LIMIT_REQUESTS):
            is_rate_limited(ip)
        # La suivante doit être bloquée
        assert is_rate_limited(ip) is True

    def test_different_ips_are_independent(self):
        ip_a = "test_ip_a"
        ip_b = "test_ip_b"
        _reset_ip(ip_a)
        _reset_ip(ip_b)
        # ip_a atteint la limite
        for _ in range(RATE_LIMIT_REQUESTS):
            is_rate_limited(ip_a)
        assert is_rate_limited(ip_a) is True
        # ip_b n'est pas affectée
        assert is_rate_limited(ip_b) is False

    def test_expired_timestamps_are_cleaned(self):
        ip = "test_expiry"
        _reset_ip(ip)
        # Injecte des timestamps anciens (hors fenêtre)
        old_time = time.time() - RATE_LIMIT_WINDOW - 1
        from collections import deque
        _request_log[ip] = deque([old_time] * RATE_LIMIT_REQUESTS)
        # La fenêtre a expiré — ne doit pas être bloqué
        assert is_rate_limited(ip) is False

    def test_mixed_old_and_recent_timestamps(self):
        ip = "test_mixed"
        _reset_ip(ip)
        old_time = time.time() - RATE_LIMIT_WINDOW - 1
        from collections import deque
        # 29 anciens + on va en ajouter 1 récent = 1 au total → pas bloqué
        _request_log[ip] = deque([old_time] * (RATE_LIMIT_REQUESTS - 1))
        assert is_rate_limited(ip) is False  # ajoute le 1er récent → 1 total

    def test_request_count_increments_correctly(self):
        ip = "test_count"
        _reset_ip(ip)
        for i in range(5):
            is_rate_limited(ip)
        assert len(_request_log[ip]) == 5


# ============================================
# TESTS — MIDDLEWARE HTTP
# ============================================

class TestMiddlewareHTTP:
    def test_api_endpoint_accessible_normally(self, app_with_limiter):
        resp = app_with_limiter.get("/api/v1/ping")
        assert resp.status_code == 200

    def test_non_api_endpoint_not_rate_limited(self, app_with_limiter):
        """Les endpoints hors /api/v1 ne sont pas limités."""
        # /health n'est pas sous /api/v1 → jamais rate-limité
        for _ in range(RATE_LIMIT_REQUESTS + 5):
            resp = app_with_limiter.get("/health")
            assert resp.status_code == 200

    def test_rate_limit_returns_429(self, app_with_limiter):
        """Après la limite, l'API doit retourner 429."""
        # TestClient utilise "testclient" comme IP par défaut
        # On s'assure que le quota est épuisé
        for _ in range(RATE_LIMIT_REQUESTS):
            app_with_limiter.get("/api/v1/ping")
        resp = app_with_limiter.get("/api/v1/ping")
        assert resp.status_code == 429

    def test_rate_limit_response_body(self, app_with_limiter):
        """Le corps de la réponse 429 doit contenir error et detail."""
        for _ in range(RATE_LIMIT_REQUESTS):
            app_with_limiter.get("/api/v1/ping")
        resp = app_with_limiter.get("/api/v1/ping")
        body = resp.json()
        assert "error" in body
        assert body["error"] == "RateLimitError"
        assert "detail" in body

    def test_rate_limit_response_has_retry_after_header(self, app_with_limiter):
        """La réponse 429 doit inclure le header Retry-After."""
        for _ in range(RATE_LIMIT_REQUESTS):
            app_with_limiter.get("/api/v1/ping")
        resp = app_with_limiter.get("/api/v1/ping")
        assert "retry-after" in resp.headers

    def test_rate_limit_threshold_is_correct(self, app_with_limiter):
        """La 30e requête passe, la 31e est bloquée."""
        # Réinitialise l'IP du testclient
        _reset_ip("testclient")
        for i in range(RATE_LIMIT_REQUESTS):
            resp = app_with_limiter.get("/api/v1/ping")
            assert resp.status_code == 200, f"Requête {i+1} devrait passer"
        # La 31e est bloquée
        resp = app_with_limiter.get("/api/v1/ping")
        assert resp.status_code == 429
