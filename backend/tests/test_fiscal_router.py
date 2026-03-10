# ============================================
# SwissRelocator — Tests TDD : fiscal_router
# backend/tests/test_fiscal_router.py
#
# Tests réécrit post-audit. Vérifient :
# - IS calculé sur le BÉNÉFICE (CA - charges), pas sur le CA
# - num_employees pris en compte dans les charges
# - Taux EUR/CHF correct (~0.94, pas 1.065)
# - Taux sociaux suisses complets (AVS/AI/APG/AC + LPP + LAA + AF)
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

@pytest.fixture
def payload_lyon():
    """Payload valide — Lyon, 0 employé pour simplifier."""
    return {
        "revenue_annual": 500_000,
        "salary_director": 80_000,
        "num_employees": 0,
        "city": "Lyon"
    }


@pytest.fixture
def payload_lyon_with_employees():
    """Payload valide — Lyon, 5 employés."""
    return {
        "revenue_annual": 500_000,
        "salary_director": 80_000,
        "num_employees": 5,
        "city": "Lyon"
    }


@pytest.fixture
def payload_geneve():
    """Payload valide — Genève, 0 employé."""
    return {
        "revenue_annual": 500_000,
        "salary_director": 80_000,
        "num_employees": 0,
        "city": "Geneve"
    }


# ============================================
# TEST 1 — Statut 200 pour chaque ville valide
# ============================================

@pytest.mark.parametrize("city", ["Lyon", "Geneve", "Lausanne", "Zurich", "Basel"])
def test_compare_fiscal_valid_cities(city):
    """POST avec chaque ville supportée retourne 200."""
    payload = {
        "revenue_annual": 400_000,
        "salary_director": 70_000,
        "num_employees": 4,
        "city": city
    }
    response = client.post("/api/v1/compare-fiscal", json=payload)
    assert response.status_code == 200, (
        f"Ville '{city}' → statut inattendu: {response.status_code} | {response.text}"
    )


# ============================================
# TEST 2 — Structure de la réponse
# ============================================

def test_compare_fiscal_response_structure(payload_lyon):
    """La réponse contient tous les champs attendus."""
    response = client.post("/api/v1/compare-fiscal", json=payload_lyon)
    assert response.status_code == 200

    data = response.json()
    required_fields = [
        "city", "country", "currency",
        "corporate_tax_rate", "corporate_tax_amount",
        "employer_social_charges_rate", "employer_social_charges_amount",
        "employee_social_charges_rate", "employee_social_charges_amount",
        "total_employer_cost", "net_result", "input"
    ]
    for field in required_fields:
        assert field in data, f"Champ manquant : {field}"


# ============================================
# TEST 3 — IS calculé sur le BÉNÉFICE, pas le CA
# ============================================

def test_corporate_tax_on_profit_not_revenue(payload_lyon):
    """Lyon : IS = 25% du bénéfice (CA - charges déductibles), PAS du CA."""
    response = client.post("/api/v1/compare-fiscal", json=payload_lyon)
    assert response.status_code == 200
    data = response.json()

    # Avec 0 employé et Lyon :
    # Charges patronales sur salaire dirigeant = 80_000 * 0.45 = 36_000
    # Coût total employeur = 80_000 + 36_000 = 116_000
    # Bénéfice avant IS = 500_000 - 116_000 = 384_000
    # IS = 384_000 * 0.25 = 96_000

    # L'IS ne doit PAS être 500_000 * 0.25 = 125_000
    wrong_is_on_revenue = 500_000 * 0.25  # 125_000
    assert abs(data["corporate_tax_amount"] - wrong_is_on_revenue) > 1000, (
        "BUG : l'IS semble calculé sur le CA au lieu du bénéfice !"
    )

    # L'IS doit être calculé sur le bénéfice
    expected_employer_charges = 80_000 * 0.45
    expected_employer_cost = 80_000 + expected_employer_charges  # 116_000
    expected_profit = 500_000 - expected_employer_cost  # 384_000
    expected_is = expected_profit * 0.25  # 96_000

    assert abs(data["corporate_tax_amount"] - expected_is) < 1.0, (
        f"IS Lyon attendu: {expected_is:.2f} (25% du bénéfice), "
        f"obtenu: {data['corporate_tax_amount']}"
    )


# ============================================
# TEST 4 — num_employees impacte le coût
# ============================================

def test_num_employees_increases_cost(payload_lyon, payload_lyon_with_employees):
    """Ajouter des employés doit augmenter le coût total employeur."""
    resp_0 = client.post("/api/v1/compare-fiscal", json=payload_lyon)
    resp_5 = client.post("/api/v1/compare-fiscal", json=payload_lyon_with_employees)

    assert resp_0.status_code == 200
    assert resp_5.status_code == 200

    cost_0 = resp_0.json()["total_employer_cost"]
    cost_5 = resp_5.json()["total_employer_cost"]

    assert cost_5 > cost_0, (
        f"Coût avec 5 employés ({cost_5}) devrait être > coût avec 0 ({cost_0}). "
        "num_employees est-il ignoré dans le calcul ?"
    )


# ============================================
# TEST 5 — Conversion EUR → CHF correcte
# ============================================

def test_eur_to_chf_conversion(payload_geneve):
    """Les montants suisses doivent être convertis avec EUR/CHF ~0.94."""
    response = client.post("/api/v1/compare-fiscal", json=payload_geneve)
    assert response.status_code == 200
    data = response.json()

    # Le CA en entrée est 500_000 EUR
    # Converti en CHF : 500_000 * 0.94 = 470_000
    revenue_local = data["input"]["revenue_annual"]

    # Le CHF est plus fort que l'EUR, donc le montant en CHF doit être < montant EUR
    assert revenue_local < 500_000, (
        f"CA converti en CHF ({revenue_local}) devrait être < 500_000 EUR. "
        "Le taux EUR/CHF est-il inversé ?"
    )

    # Vérification avec tolérance (le taux exact peut bouger)
    assert 450_000 < revenue_local < 490_000, (
        f"CA converti ({revenue_local} CHF) hors fourchette attendue 450k-490k "
        "(basé sur EUR/CHF ~0.94)"
    )


# ============================================
# TEST 6 — Charges patronales suisses réalistes
# ============================================

def test_swiss_employer_charges_realistic(payload_geneve):
    """Les charges patronales suisses doivent être ~13-15% (pas 6.5%)."""
    response = client.post("/api/v1/compare-fiscal", json=payload_geneve)
    assert response.status_code == 200
    data = response.json()

    rate = data["employer_social_charges_rate"]
    assert rate > 0.10, (
        f"Taux patronal suisse ({rate*100:.1f}%) trop bas. "
        "Inclure LPP, LAA et AF en plus d'AVS/AI/APG/AC."
    )
    assert rate < 0.20, (
        f"Taux patronal suisse ({rate*100:.1f}%) trop haut."
    )


# ============================================
# TEST 7 — Coût total employeur cohérent
# ============================================

def test_total_employer_cost_coherence(payload_lyon):
    """total_employer_cost = salaire dirigeant + charges patronales (+ employés si > 0)."""
    response = client.post("/api/v1/compare-fiscal", json=payload_lyon)
    assert response.status_code == 200
    data = response.json()

    # Avec 0 employé, le coût est juste salaire + charges sur ce salaire
    expected = data["input"]["salary_director"] + data["employer_social_charges_amount"]
    assert abs(data["total_employer_cost"] - expected) < 1.0, (
        f"Coût total attendu: {expected:.2f}, obtenu: {data['total_employer_cost']}"
    )


# ============================================
# TEST 8 — Résultat net = Bénéfice - IS
# ============================================

def test_net_result_formula(payload_lyon):
    """net_result = (CA - coût employeur) - IS sur ce bénéfice."""
    response = client.post("/api/v1/compare-fiscal", json=payload_lyon)
    assert response.status_code == 200
    data = response.json()

    profit_before_tax = data["input"]["revenue_annual"] - data["total_employer_cost"]
    expected_net = profit_before_tax - data["corporate_tax_amount"]

    assert abs(data["net_result"] - expected_net) < 1.0, (
        f"Résultat net attendu: {expected_net:.2f}, obtenu: {data['net_result']}"
    )


# ============================================
# TEST 9 — Ville invalide → 422
# ============================================

def test_compare_fiscal_invalid_city():
    """Une ville non supportée retourne 422 (validation Pydantic)."""
    payload = {
        "revenue_annual": 400_000,
        "salary_director": 70_000,
        "num_employees": 4,
        "city": "Paris"
    }
    response = client.post("/api/v1/compare-fiscal", json=payload)
    assert response.status_code == 422


# ============================================
# TEST 10 — Revenus négatifs → 422
# ============================================

def test_compare_fiscal_negative_revenue():
    """Un CA négatif est rejeté avec 422."""
    payload = {
        "revenue_annual": -10_000,
        "salary_director": 50_000,
        "num_employees": 2,
        "city": "Lyon"
    }
    response = client.post("/api/v1/compare-fiscal", json=payload)
    assert response.status_code == 422


# ============================================
# TEST 11 — Salaire > CA → résultat négatif accepté
# ============================================

def test_compare_fiscal_salary_exceeds_revenue():
    """Salaire > CA : résultat net négatif (cas valide, pas une erreur)."""
    payload = {
        "revenue_annual": 50_000,
        "salary_director": 100_000,
        "num_employees": 1,
        "city": "Lyon"
    }
    response = client.post("/api/v1/compare-fiscal", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["net_result"] < 0, "Résultat net doit être négatif quand salaire > CA"


# ============================================
# TEST 12 — Zurich a un IS plus bas que Lyon
# ============================================

def test_zurich_lower_tax_than_lyon():
    """Zurich (~12%) a un IS inférieur à Lyon (25%)."""
    base = {"revenue_annual": 500_000, "salary_director": 80_000, "num_employees": 0}

    resp_lyon = client.post("/api/v1/compare-fiscal", json={**base, "city": "Lyon"})
    resp_zurich = client.post("/api/v1/compare-fiscal", json={**base, "city": "Zurich"})

    assert resp_lyon.status_code == 200
    assert resp_zurich.status_code == 200

    assert resp_zurich.json()["corporate_tax_rate"] < resp_lyon.json()["corporate_tax_rate"]


# ============================================
# TEST 13 — Charges patronales FR >> CH
# ============================================

def test_france_higher_employer_charges_than_swiss():
    """Les charges patronales françaises (~45%) sont bien supérieures aux suisses (~13-15%)."""
    base = {"revenue_annual": 500_000, "salary_director": 80_000, "num_employees": 0}

    resp_lyon = client.post("/api/v1/compare-fiscal", json={**base, "city": "Lyon"})
    resp_geneve = client.post("/api/v1/compare-fiscal", json={**base, "city": "Geneve"})

    assert resp_lyon.status_code == 200
    assert resp_geneve.status_code == 200

    lyon_rate = resp_lyon.json()["employer_social_charges_rate"]
    geneve_rate = resp_geneve.json()["employer_social_charges_rate"]

    assert lyon_rate > geneve_rate * 2, (
        f"Charges FR ({lyon_rate*100:.1f}%) devraient être > 2× charges CH ({geneve_rate*100:.1f}%)"
    )
