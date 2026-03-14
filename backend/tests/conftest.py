# ============================================
# SwissRelocator — Configuration pytest globale
# backend/tests/conftest.py
# ============================================

import sys
import os
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "app"))


@pytest.fixture(autouse=True)
def reset_rate_limiter():
    """
    Réinitialise l'état global du rate limiter avant chaque test.
    Évite que les tests qui font beaucoup de requêtes ne polluent les suivants
    en épuisant le quota de l'IP "testclient".
    """
    from core.rate_limiter import _request_log
    _request_log.clear()
    yield
    _request_log.clear()
