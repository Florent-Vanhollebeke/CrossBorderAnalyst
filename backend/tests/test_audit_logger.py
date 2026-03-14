# ============================================
# SwissRelocator — Tests TDD : core/audit_logger
# backend/tests/test_audit_logger.py
# ============================================

import sys
import os
import json
import tempfile
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "app"))

from core.audit_logger import AuditLogger


@pytest.fixture
def tmp_log_file(tmp_path):
    """Fournit un fichier de log temporaire isolé pour chaque test."""
    return str(tmp_path / "audit_test.jsonl")


@pytest.fixture
def logger(tmp_log_file):
    return AuditLogger(log_path=tmp_log_file)


def _read_entries(path: str) -> list[dict]:
    """Lit toutes les entrées JSON d'un fichier JSONL."""
    entries = []
    with open(path) as f:
        for line in f:
            line = line.strip()
            if line:
                entries.append(json.loads(line))
    return entries


# ============================================
# TESTS — ÉCRITURE
# ============================================

class TestAuditLoggerWrite:
    def test_log_creates_file(self, logger, tmp_log_file):
        logger.log(endpoint="/api/v1/test", ip="192.168.1.1", params={}, status_code=200)
        assert os.path.exists(tmp_log_file)

    def test_log_writes_valid_json_line(self, logger, tmp_log_file):
        logger.log(endpoint="/api/v1/compare-fiscal", ip="10.0.0.1", params={}, status_code=200)
        entries = _read_entries(tmp_log_file)
        assert len(entries) == 1

    def test_log_multiple_entries_appends(self, logger, tmp_log_file):
        for i in range(5):
            logger.log(endpoint=f"/api/v1/endpoint{i}", ip="1.2.3.4", params={}, status_code=200)
        entries = _read_entries(tmp_log_file)
        assert len(entries) == 5


# ============================================
# TESTS — STRUCTURE DE L'ENTRÉE
# ============================================

class TestAuditEntryStructure:
    def test_entry_has_timestamp(self, logger, tmp_log_file):
        logger.log(endpoint="/test", ip="1.1.1.1", params={}, status_code=200)
        entry = _read_entries(tmp_log_file)[0]
        assert "timestamp" in entry

    def test_entry_has_endpoint(self, logger, tmp_log_file):
        logger.log(endpoint="/api/v1/predict-rent", ip="1.1.1.1", params={}, status_code=200)
        entry = _read_entries(tmp_log_file)[0]
        assert entry["endpoint"] == "/api/v1/predict-rent"

    def test_entry_has_status_code(self, logger, tmp_log_file):
        logger.log(endpoint="/test", ip="1.1.1.1", params={}, status_code=422)
        entry = _read_entries(tmp_log_file)[0]
        assert entry["status_code"] == 422

    def test_entry_has_ip_field(self, logger, tmp_log_file):
        logger.log(endpoint="/test", ip="192.168.1.100", params={}, status_code=200)
        entry = _read_entries(tmp_log_file)[0]
        assert "ip" in entry

    def test_entry_has_params_field(self, logger, tmp_log_file):
        logger.log(endpoint="/test", ip="1.1.1.1", params={"city": "Zurich"}, status_code=200)
        entry = _read_entries(tmp_log_file)[0]
        assert "params" in entry


# ============================================
# TESTS — MASQUAGE IP (RGPD)
# ============================================

class TestIPMasking:
    def test_ip_last_octet_masked(self, logger, tmp_log_file):
        logger.log(endpoint="/test", ip="192.168.1.42", params={}, status_code=200)
        entry = _read_entries(tmp_log_file)[0]
        assert entry["ip"] == "192.x.x.x"

    def test_ip_only_first_octet_kept(self, logger, tmp_log_file):
        logger.log(endpoint="/test", ip="10.20.30.40", params={}, status_code=200)
        entry = _read_entries(tmp_log_file)[0]
        assert entry["ip"] == "10.x.x.x"

    def test_unknown_ip_handled(self, logger, tmp_log_file):
        logger.log(endpoint="/test", ip="unknown", params={}, status_code=200)
        entry = _read_entries(tmp_log_file)[0]
        assert "ip" in entry  # ne doit pas crasher


# ============================================
# TESTS — MASQUAGE PII DANS LES PARAMS
# ============================================

class TestPIIRedactionInParams:
    def test_email_in_params_is_redacted(self, logger, tmp_log_file):
        logger.log(
            endpoint="/test",
            ip="1.1.1.1",
            params={"contact": "john@example.com"},
            status_code=200,
        )
        entry = _read_entries(tmp_log_file)[0]
        assert "john@example.com" not in json.dumps(entry["params"])

    def test_non_pii_params_preserved(self, logger, tmp_log_file):
        logger.log(
            endpoint="/test",
            ip="1.1.1.1",
            params={"city": "Zurich", "surface": 150},
            status_code=200,
        )
        entry = _read_entries(tmp_log_file)[0]
        assert entry["params"]["city"] == "Zurich"
        assert entry["params"]["surface"] == 150

    def test_nested_params_string_values_redacted(self, logger, tmp_log_file):
        logger.log(
            endpoint="/test",
            ip="1.1.1.1",
            params={"user": "contact@test.ch", "amount": 5000},
            status_code=200,
        )
        entry = _read_entries(tmp_log_file)[0]
        assert "contact@test.ch" not in json.dumps(entry["params"])
