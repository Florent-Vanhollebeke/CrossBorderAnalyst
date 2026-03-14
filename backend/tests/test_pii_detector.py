# ============================================
# SwissRelocator — Tests TDD : core/pii_detector
# backend/tests/test_pii_detector.py
# ============================================

import sys
import os
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "app"))

from core.pii_detector import PIIDetector


@pytest.fixture
def detector():
    return PIIDetector()


# ============================================
# TESTS — DÉTECTION EMAIL
# ============================================

class TestEmailDetection:
    def test_detects_simple_email(self, detector):
        assert "email" in detector.detect("Contact: john.doe@example.com")

    def test_detects_email_with_subdomain(self, detector):
        assert "email" in detector.detect("admin@mail.entreprise.ch")

    def test_no_false_positive_on_plain_text(self, detector):
        assert "email" not in detector.detect("Bonjour, comment allez-vous ?")

    def test_detects_multiple_emails(self, detector):
        text = "De: a@a.com, À: b@b.com"
        types = detector.detect(text)
        assert "email" in types


# ============================================
# TESTS — DÉTECTION TÉLÉPHONE CH/FR
# ============================================

class TestPhoneDetection:
    def test_detects_swiss_phone_format(self, detector):
        assert "phone" in detector.detect("+41 79 123 45 67")

    def test_detects_french_mobile(self, detector):
        assert "phone" in detector.detect("06 12 34 56 78")

    def test_detects_french_landline(self, detector):
        assert "phone" in detector.detect("01 23 45 67 89")

    def test_detects_international_format(self, detector):
        assert "phone" in detector.detect("+33 1 23 45 67 89")

    def test_no_false_positive_on_year(self, detector):
        assert "phone" not in detector.detect("En 2024, le chiffre d'affaires était de 1234.")


# ============================================
# TESTS — DÉTECTION IBAN
# ============================================

class TestIBANDetection:
    def test_detects_swiss_iban(self, detector):
        assert "iban" in detector.detect("IBAN: CH56 0483 5012 3456 7800 9")

    def test_detects_french_iban(self, detector):
        assert "iban" in detector.detect("FR76 3000 6000 0112 3456 7890 189")

    def test_detects_iban_without_spaces(self, detector):
        assert "iban" in detector.detect("CH5604835012345678009")

    def test_no_false_positive_on_code_postal(self, detector):
        assert "iban" not in detector.detect("NPA: 1200")


# ============================================
# TESTS — DÉTECTION N° AVS (Suisse)
# ============================================

class TestAVSDetection:
    def test_detects_avs_standard_format(self, detector):
        assert "avs" in detector.detect("N° AVS: 756.1234.5678.90")

    def test_detects_avs_without_label(self, detector):
        assert "avs" in detector.detect("756.9876.5432.10")

    def test_no_false_positive_on_phone(self, detector):
        # Un numéro de tél ne doit pas matcher AVS
        text = "Tél: 044.123.45.67"
        # Peut détecter phone mais pas avs
        types = detector.detect(text)
        assert "avs" not in types


# ============================================
# TESTS — DÉTECTION SIRET/SIREN (France)
# ============================================

class TestSIRETDetection:
    def test_detects_siret(self, detector):
        assert "siret" in detector.detect("SIRET: 732 829 320 00074")

    def test_detects_siren(self, detector):
        assert "siret" in detector.detect("SIREN 732829320")

    def test_detects_siret_without_spaces(self, detector):
        assert "siret" in detector.detect("73282932000074")


# ============================================
# TESTS — REDACT
# ============================================

class TestRedact:
    def test_redacts_email(self, detector):
        result = detector.redact("Email: john@example.com merci")
        assert "john@example.com" not in result
        assert "[EMAIL]" in result

    def test_redacts_phone(self, detector):
        result = detector.redact("Appelez le +41 79 123 45 67 svp")
        assert "+41 79 123 45 67" not in result
        assert "[PHONE]" in result

    def test_redacts_iban(self, detector):
        result = detector.redact("Virement vers CH56 0483 5012 3456 7800 9")
        assert "CH56" not in result
        assert "[IBAN]" in result

    def test_redacts_avs(self, detector):
        result = detector.redact("AVS 756.1234.5678.90 du candidat")
        assert "756.1234.5678.90" not in result
        assert "[AVS]" in result

    def test_redacts_siret(self, detector):
        result = detector.redact("SIRET 73282932000074 de la société")
        assert "73282932000074" not in result
        assert "[SIRET]" in result

    def test_text_without_pii_unchanged(self, detector):
        text = "Chiffre d'affaires annuel : 500 000 EUR"
        assert detector.redact(text) == text

    def test_redacts_multiple_pii_types_in_one_text(self, detector):
        text = "Contact john@doe.com, tél +41 79 000 00 00"
        result = detector.redact(text)
        assert "[EMAIL]" in result
        assert "[PHONE]" in result

    def test_redact_preserves_non_pii_content(self, detector):
        text = "Merci de contacter test@test.com pour plus d'infos."
        result = detector.redact(text)
        assert "Merci de contacter" in result
        assert "pour plus d'infos" in result


# ============================================
# TESTS — DETECT RETOURNE LISTE DE TYPES UNIQUES
# ============================================

class TestDetectReturnType:
    def test_returns_list(self, detector):
        result = detector.detect("Bonjour")
        assert isinstance(result, list)

    def test_returns_empty_list_when_no_pii(self, detector):
        result = detector.detect("Aucune donnée personnelle ici.")
        assert result == []

    def test_no_duplicate_types(self, detector):
        text = "a@a.com et b@b.com"
        result = detector.detect(text)
        assert result.count("email") == 1

    def test_multiple_types_detected(self, detector):
        text = "Email a@b.com, IBAN CH56 0483 5012 3456 7800 9"
        result = detector.detect(text)
        assert "email" in result
        assert "iban" in result
