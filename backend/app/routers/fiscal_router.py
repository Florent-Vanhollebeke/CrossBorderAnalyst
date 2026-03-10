# ============================================
# SwissRelocator — Module de comparaison fiscale
# backend/app/routers/fiscal_router.py
# ============================================

import json
import logging
from pathlib import Path
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Literal

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["Fiscalité"])

# ============================================
# CHARGEMENT DES DONNÉES FISCALES
# ============================================

DATA_DIR = Path(__file__).parent.parent / "data"
FISCAL_RATES_PATH = DATA_DIR / "fiscal_rates.json"
SALARY_GRIDS_PATH = DATA_DIR / "salary_grids.json"

# Chargement au démarrage du module
try:
    with open(FISCAL_RATES_PATH, "r", encoding="utf-8") as f:
        FISCAL_RATES = json.load(f)["cities"]
except Exception as e:
    raise RuntimeError(f"[Fiscal] Impossible de charger fiscal_rates.json : {e}")

try:
    with open(SALARY_GRIDS_PATH, "r", encoding="utf-8") as f:
        salary_data = json.load(f)
        EUR_TO_CHF = salary_data["exchange_rates"]["EUR_to_CHF"]
        CHF_TO_EUR = salary_data["exchange_rates"]["CHF_to_EUR"]
except Exception as e:
    # Taux de repli si le fichier est absent (CHF plus fort que EUR)
    EUR_TO_CHF = 0.94
    CHF_TO_EUR = 1.064

# Villes supportées (clés du JSON)
SUPPORTED_CITIES = list(FISCAL_RATES.keys())


# ============================================
# SCHÉMAS PYDANTIC
# ============================================

class CompareFiscalRequest(BaseModel):
    """Paramètres d'entrée pour la comparaison fiscale."""

    revenue_annual: float = Field(
        ...,
        gt=0,
        description="Chiffre d'affaires annuel en EUR (doit être positif)"
    )
    salary_director: float = Field(
        ...,
        gt=0,
        description="Salaire annuel brut du dirigeant en EUR (doit être positif)"
    )
    num_employees: int = Field(
        ...,
        ge=0,
        le=10_000,
        description="Nombre de salariés (hors dirigeant)"
    )
    city: Literal["Lyon", "Geneve", "Lausanne", "Zurich", "Basel"] = Field(
        ...,
        description="Ville cible : Lyon, Geneve, Lausanne, Zurich ou Basel"
    )
    average_employee_salary: float = Field(
        default=0,
        ge=0,
        description="Salaire moyen annuel brut des employés en EUR (utilisé si num_employees > 0). Si 0, utilise le salaire du dirigeant."
    )


class CompareFiscalResponse(BaseModel):
    """Résultats de la comparaison fiscale pour une ville."""

    # Contexte
    city: str = Field(..., description="Ville analysée")
    country: str = Field(..., description="Pays (FR ou CH)")
    currency: str = Field(..., description="Devise locale (EUR ou CHF)")

    # IS — Impôt sur les sociétés
    corporate_tax_rate: float = Field(..., description="Taux IS effectif (ex: 0.25 = 25%)")
    corporate_tax_amount: float = Field(..., description="Montant IS sur le bénéfice (CA - charges)")

    # Charges sociales patronales
    employer_social_charges_rate: float = Field(..., description="Taux charges patronales")
    employer_social_charges_amount: float = Field(..., description="Montant charges patronales totales (dirigeant + employés)")

    # Charges sociales salariales
    employee_social_charges_rate: float = Field(..., description="Taux charges salariales")
    employee_social_charges_amount: float = Field(..., description="Montant charges salariales totales (dirigeant + employés)")

    # Coût total employeur
    total_employer_cost: float = Field(
        ...,
        description="Coût total employeur = salaires bruts (dirigeant + employés) + charges patronales"
    )

    # Résultat net estimé
    net_result: float = Field(
        ...,
        description="Résultat net = bénéfice avant IS - IS. Bénéfice = CA - coût total employeur."
    )

    # Récapitulatif des entrées (dans la devise locale)
    input: dict = Field(..., description="Paramètres d'entrée convertis dans la devise locale")


# ============================================
# FONCTIONS DE CALCUL
# ============================================

def convert_to_local_currency(amount_eur: float, currency: str) -> float:
    """Convertit un montant EUR vers la devise locale (CHF pour la Suisse)."""
    if currency == "CHF":
        return round(amount_eur * EUR_TO_CHF, 2)
    return round(amount_eur, 2)


def calculate_fiscal_comparison(request: CompareFiscalRequest) -> CompareFiscalResponse:
    """
    Calcule la comparaison fiscale complète pour une ville donnée.

    Logique corrigée :
    1. Convertir les montants dans la devise locale (EUR ou CHF)
    2. Calculer les charges sociales (dirigeant + employés)
    3. Calculer le coût total employeur (salaires + charges patronales)
    4. Calculer le bénéfice avant IS = CA - coût total employeur
    5. Calculer l'IS sur le bénéfice (PAS sur le CA)
    6. Résultat net = bénéfice - IS
    """
    rates = FISCAL_RATES[request.city]
    currency = rates["currency"]

    # --- Conversion dans la devise locale ---
    revenue_local = convert_to_local_currency(request.revenue_annual, currency)
    salary_director_local = convert_to_local_currency(request.salary_director, currency)

    # Salaire moyen employés : si non renseigné, on utilise le salaire dirigeant
    avg_employee_salary_eur = request.average_employee_salary or request.salary_director
    avg_employee_salary_local = convert_to_local_currency(avg_employee_salary_eur, currency)

    # --- Taux depuis le JSON ---
    tax_rate = rates["corporate_tax_rate"]
    employer_rate = rates["employer_social_charges_rate"]
    employee_rate = rates["employee_social_charges_rate"]

    # --- Masse salariale totale (dirigeant + employés) ---
    total_gross_salaries = salary_director_local + (avg_employee_salary_local * request.num_employees)

    # --- Charges sociales patronales sur la masse salariale totale ---
    employer_charges = round(total_gross_salaries * employer_rate, 2)

    # --- Charges sociales salariales sur la masse salariale totale ---
    employee_charges = round(total_gross_salaries * employee_rate, 2)

    # --- Coût total employeur = salaires bruts + charges patronales ---
    total_employer_cost = round(total_gross_salaries + employer_charges, 2)

    # --- Bénéfice avant IS = CA - coût total employeur ---
    # (les salaires et charges sont des charges déductibles)
    profit_before_tax = revenue_local - total_employer_cost

    # --- IS sur le bénéfice (pas sur le CA !) ---
    # Si le bénéfice est négatif, pas d'IS (report de déficit en réalité,
    # mais on simplifie à IS = 0 dans ce cas)
    corporate_tax_amount = round(max(0, profit_before_tax) * tax_rate, 2)

    # --- Résultat net = bénéfice avant IS - IS ---
    net_result = round(profit_before_tax - corporate_tax_amount, 2)

    return CompareFiscalResponse(
        city=request.city,
        country=rates["country"],
        currency=currency,
        corporate_tax_rate=tax_rate,
        corporate_tax_amount=corporate_tax_amount,
        employer_social_charges_rate=employer_rate,
        employer_social_charges_amount=employer_charges,
        employee_social_charges_rate=employee_rate,
        employee_social_charges_amount=employee_charges,
        total_employer_cost=total_employer_cost,
        net_result=net_result,
        input={
            "revenue_annual": revenue_local,
            "salary_director": salary_director_local,
            "num_employees": request.num_employees,
            "average_employee_salary": avg_employee_salary_local,
            "total_gross_salaries": total_gross_salaries,
            "original_currency": "EUR",
            "local_currency": currency,
            "eur_to_chf_rate": EUR_TO_CHF if currency == "CHF" else None
        }
    )


# ============================================
# ENDPOINT
# ============================================

@router.post("/compare-fiscal", response_model=CompareFiscalResponse)
async def compare_fiscal(request: CompareFiscalRequest):
    """
    Compare la fiscalité d'une implantation d'entreprise dans une ville donnée.

    **Villes supportées :** Lyon, Geneve, Lausanne, Zurich, Basel

    **Calculs effectués :**
    - IS (Impôt sur les Sociétés) sur le **bénéfice** : France 25%, CH ~12-14%
    - Charges patronales : France ~45%, Suisse ~13-15% (AVS/AI/APG/AC + LPP + LAA + AF)
    - Charges salariales : France ~22%, Suisse ~12.7%
    - Coût total employeur = salaires bruts (dirigeant + employés) + charges patronales
    - Bénéfice = CA - coût total employeur
    - Résultat net = bénéfice - IS

    **Note devise :** Les montants d'entrée sont en EUR.
    Pour les villes suisses, conversion en CHF au taux ~0.94.
    """
    try:
        return calculate_fiscal_comparison(request)
    except KeyError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Données fiscales manquantes pour la ville : {e}"
        )
    except Exception:
        logger.exception("Erreur lors du calcul fiscal")
        raise HTTPException(
            status_code=500,
            detail="Erreur interne lors du calcul fiscal"
        )
