# ============================================
# SwissRelocator — Tests TDD : services/pdf_generator
# backend/tests/test_pdf_generator.py
# ============================================

import sys
import os
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "app"))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

# ============================================
# FIXTURES
# ============================================

FISCAL_PAYLOAD = {
    "revenue_annual": 500000,
    "salary_director": 80000,
    "num_employees": 2,
    "average_employee_salary": 50000,
    "city": "Zurich",
}


@pytest.fixture
def fiscal_results():
    """Génère des résultats fiscaux réels via l'API pour 5 villes."""
    cities = ["Lyon", "Geneve", "Lausanne", "Zurich", "Basel"]
    results = []
    for city in cities:
        payload = {**FISCAL_PAYLOAD, "city": city}
        resp = client.post("/api/v1/compare-fiscal", json=payload)
        assert resp.status_code == 200
        results.append(resp.json())
    return results


MINIMAL_RESULT = [
    {
        "city": "Lyon",
        "country": "FR",
        "currency": "EUR",
        "corporate_tax_rate": 0.25,
        "corporate_tax_amount": 23500,
        "employer_social_charges_rate": 0.45,
        "employer_social_charges_amount": 126000,
        "total_employer_cost": 406000,
        "net_result": 70500,
    },
    {
        "city": "Zurich",
        "country": "CH",
        "currency": "CHF",
        "corporate_tax_rate": 0.12,
        "corporate_tax_amount": 20610,
        "employer_social_charges_rate": 0.131,
        "employer_social_charges_amount": 34479,
        "total_employer_cost": 297679,
        "net_result": 151711,
    },
]


# ============================================
# TESTS — ENDPOINT /api/v1/generate-pdf/fiscal
# ============================================

class TestPDFEndpoint:
    def test_endpoint_exists(self):
        resp = client.post("/api/v1/generate-pdf/fiscal", json=MINIMAL_RESULT)
        assert resp.status_code != 404

    def test_endpoint_returns_200(self):
        resp = client.post("/api/v1/generate-pdf/fiscal", json=MINIMAL_RESULT)
        assert resp.status_code == 200

    def test_response_content_type_is_pdf(self):
        resp = client.post("/api/v1/generate-pdf/fiscal", json=MINIMAL_RESULT)
        assert "application/pdf" in resp.headers["content-type"]

    def test_response_body_is_not_empty(self):
        resp = client.post("/api/v1/generate-pdf/fiscal", json=MINIMAL_RESULT)
        assert len(resp.content) > 0

    def test_response_is_valid_pdf_magic_bytes(self):
        """Un PDF valide commence toujours par '%PDF'."""
        resp = client.post("/api/v1/generate-pdf/fiscal", json=MINIMAL_RESULT)
        assert resp.content[:4] == b"%PDF"

    def test_content_disposition_header(self):
        """Le header doit indiquer un téléchargement nommé."""
        resp = client.post("/api/v1/generate-pdf/fiscal", json=MINIMAL_RESULT)
        disposition = resp.headers.get("content-disposition", "")
        assert "attachment" in disposition
        assert ".pdf" in disposition

    def test_empty_results_returns_400(self):
        resp = client.post("/api/v1/generate-pdf/fiscal", json=[])
        assert resp.status_code == 400

    def test_single_city_result_works(self):
        resp = client.post("/api/v1/generate-pdf/fiscal", json=[MINIMAL_RESULT[0]])
        assert resp.status_code == 200

    def test_five_cities_result_works(self, fiscal_results):
        resp = client.post("/api/v1/generate-pdf/fiscal", json=fiscal_results)
        assert resp.status_code == 200
        assert resp.content[:4] == b"%PDF"

    def test_pdf_size_is_reasonable(self):
        """Un rapport PDF pour 2 villes doit peser entre 1 Ko et 500 Ko."""
        resp = client.post("/api/v1/generate-pdf/fiscal", json=MINIMAL_RESULT)
        size_kb = len(resp.content) / 1024
        assert 1 < size_kb < 500, f"Taille inattendue : {size_kb:.1f} Ko"


# ============================================
# TESTS — CLASSE PDFGenerator (unitaires)
# ============================================

class TestPDFGeneratorClass:
    @pytest.fixture
    def generator(self):
        from services.pdf_generator import PDFGenerator
        return PDFGenerator()

    def test_generate_fiscal_report_returns_bytes(self, generator):
        result = generator.generate_fiscal_report(MINIMAL_RESULT)
        assert isinstance(result, bytes)

    def test_generate_fiscal_report_starts_with_pdf_header(self, generator):
        result = generator.generate_fiscal_report(MINIMAL_RESULT)
        assert result[:4] == b"%PDF"

    def test_generate_accepts_single_result(self, generator):
        result = generator.generate_fiscal_report([MINIMAL_RESULT[0]])
        assert result[:4] == b"%PDF"

    def test_generate_accepts_five_results(self, generator):
        five = MINIMAL_RESULT * 2 + [MINIMAL_RESULT[0]]  # 5 éléments
        result = generator.generate_fiscal_report(five)
        assert isinstance(result, bytes)

    def test_generate_with_zero_values_does_not_crash(self, generator):
        zero_result = [{**MINIMAL_RESULT[0], "net_result": 0, "corporate_tax_amount": 0}]
        result = generator.generate_fiscal_report(zero_result)
        assert result[:4] == b"%PDF"

    def test_generate_with_negative_net_result_does_not_crash(self, generator):
        negative = [{**MINIMAL_RESULT[0], "net_result": -50000}]
        result = generator.generate_fiscal_report(negative)
        assert result[:4] == b"%PDF"
