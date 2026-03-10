# ============================================
# SwissRelocator - Tests API Predict Rent
# backend/tests/test_predict_rent.py
# ============================================

import sys
import os
import pytest

# Ajout du répertoire app au path pour les imports bare (predict_rent_router, etc.)
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "app"))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


# ============================================
# FIXTURES
# ============================================

@pytest.fixture
def valid_payload_geneve():
    return {"city": "Geneve", "surface": 80.0}


@pytest.fixture
def valid_payload_with_all_options():
    return {
        "city": "Zurich",
        "surface": 120.0,
        "latitude": 47.38,
        "longitude": 8.55,
        "pieces": 5.0,
        "etage": 3,
        "has_parking": True,
        "has_lift": True,
        "property_type": "bureau",
    }


# ============================================
# TEST 1 - POST /api/v1/predict-rent : 4 villes valides
# ============================================

@pytest.mark.parametrize("city", ["Geneve", "Lausanne", "Zurich", "Basel"])
def test_predict_rent_valid_cities(city):
    """Vérifie que chaque ville supportée retourne 200 et un loyer positif."""
    payload = {"city": city, "surface": 100.0}
    response = client.post("/api/v1/predict-rent", json=payload)

    assert response.status_code == 200, (
        f"Ville '{city}' → statut inattendu: {response.status_code} | {response.text}"
    )

    data = response.json()
    assert "predicted_rent_chf" in data, "Champ predicted_rent_chf manquant"
    assert data["predicted_rent_chf"] > 0, (
        f"Ville '{city}' → loyer prédit non positif: {data['predicted_rent_chf']}"
    )


# ============================================
# TEST 2 - POST /api/v1/predict-rent : ville invalide → 422
# ============================================

def test_predict_rent_invalid_city():
    """Une ville non supportée doit retourner 422 (validation Pydantic)."""
    payload = {"city": "Paris", "surface": 80.0}
    response = client.post("/api/v1/predict-rent", json=payload)

    assert response.status_code == 422, (
        f"Ville invalide → statut attendu 422, obtenu: {response.status_code}"
    )


# ============================================
# TEST 3 - POST /api/v1/predict-rent : surface négative → 422
# ============================================

def test_predict_rent_negative_surface():
    """Une surface négative doit être rejetée avec 422."""
    payload = {"city": "Geneve", "surface": -50.0}
    response = client.post("/api/v1/predict-rent", json=payload)

    assert response.status_code == 422, (
        f"Surface négative → statut attendu 422, obtenu: {response.status_code}"
    )


def test_predict_rent_zero_surface():
    """Une surface nulle (≤ 5) doit aussi être rejetée avec 422 (gt=5)."""
    payload = {"city": "Lausanne", "surface": 0.0}
    response = client.post("/api/v1/predict-rent", json=payload)

    assert response.status_code == 422, (
        f"Surface nulle → statut attendu 422, obtenu: {response.status_code}"
    )


# ============================================
# TEST 4 - GET /api/v1/health : model_loaded = true
# ============================================

def test_health_check():
    """L'endpoint health doit retourner 200 avec model_loaded = True."""
    response = client.get("/api/v1/health")

    assert response.status_code == 200, (
        f"Health check → statut inattendu: {response.status_code}"
    )

    data = response.json()
    assert data.get("model_loaded") is True, (
        f"model_loaded attendu True, obtenu: {data.get('model_loaded')}"
    )


# ============================================
# TEST 5 - GET /api/v1/model-info : features_count = 18
# ============================================

def test_model_info_features_count():
    """Le modèle doit exposer exactement 18 features."""
    response = client.get("/api/v1/model-info")

    assert response.status_code == 200, (
        f"model-info → statut inattendu: {response.status_code}"
    )

    data = response.json()
    assert data.get("features_count") == 18, (
        f"features_count attendu 18, obtenu: {data.get('features_count')}"
    )


# ============================================
# TEST 6 - POST /api/v1/predict-rent : tous les paramètres optionnels
# ============================================

def test_predict_rent_all_optional_params(valid_payload_with_all_options):
    """Vérifie que la prédiction fonctionne avec tous les paramètres optionnels."""
    response = client.post("/api/v1/predict-rent", json=valid_payload_with_all_options)

    assert response.status_code == 200, (
        f"Payload complet → statut inattendu: {response.status_code} | {response.text}"
    )

    data = response.json()
    assert data["predicted_rent_chf"] > 0, (
        f"Loyer prédit non positif avec paramètres optionnels: {data['predicted_rent_chf']}"
    )
    assert "confidence_range" in data, "Champ confidence_range manquant"
    assert data["confidence_range"]["min_chf"] >= 0, "min_chf ne peut pas être négatif"
    assert data["confidence_range"]["max_chf"] > data["confidence_range"]["min_chf"], (
        "max_chf doit être supérieur à min_chf"
    )
    assert data["city"] == "Zurich", f"Ville retournée inattendue: {data['city']}"


# ============================================
# TESTS BONUS - Normalisation des noms de ville
# ============================================

@pytest.mark.parametrize("city_alias", ["genève", "geneva", "genf", "zürich", "Bâle"])
def test_predict_rent_city_aliases(city_alias):
    """Les alias de villes (accents, autres langues) doivent être acceptés."""
    payload = {"city": city_alias, "surface": 60.0}
    response = client.post("/api/v1/predict-rent", json=payload)

    assert response.status_code == 200, (
        f"Alias '{city_alias}' → statut inattendu: {response.status_code} | {response.text}"
    )
    assert response.json()["predicted_rent_chf"] > 0
