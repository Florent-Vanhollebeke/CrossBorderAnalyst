# ============================================
# SwissRelocator — Configuration pytest globale
# backend/tests/conftest.py
# ============================================

import sys
import os
import pytest
from pathlib import Path

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "app"))

# ============================================
# ML MODEL AVAILABILITY
# ============================================

_MODEL_PATH = Path(__file__).parent.parent / "ml_models" / "immo_ch_model.pkl"
MODEL_AVAILABLE = _MODEL_PATH.exists()


def pytest_collection_modifyitems(config, items):
    """Skip ML-dependent tests automatically when model files are absent (e.g. CI)."""
    if MODEL_AVAILABLE:
        return
    skip = pytest.mark.skip(reason="ML model files not found (*.pkl gitignored). Run locally after training.")
    for item in items:
        if "predict_rent" in item.fspath.basename:
            item.add_marker(skip)


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
