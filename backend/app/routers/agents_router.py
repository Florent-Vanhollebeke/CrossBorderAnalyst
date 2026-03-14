# ============================================
# SwissRelocator - Router Agents IA
# backend/app/routers/agents_router.py
# ============================================

import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Literal

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/agents", tags=["AI Agents"])

# Lazy init — les agents lèvent EnvironmentError si la clé API manque
_market_scout = None
_legal_watchdog = None


def _get_market_scout():
    global _market_scout
    if _market_scout is None:
        from agents.market_scout import MarketScoutAgent
        _market_scout = MarketScoutAgent()
    return _market_scout


def _get_legal_watchdog():
    global _legal_watchdog
    if _legal_watchdog is None:
        from agents.legal_watchdog import LegalWatchdogAgent
        _legal_watchdog = LegalWatchdogAgent()
    return _legal_watchdog


# ============================================
# SCHÉMAS
# ============================================

SUPPORTED_CITIES = Literal["Lyon", "Geneve", "Lausanne", "Zurich", "Basel"]
SUPPORTED_CANTONS = Literal["GE", "VD", "ZH", "BS", "BE"]


class MarketAnalysisRequest(BaseModel):
    city: SUPPORTED_CITIES = Field(..., description="Ville à analyser")
    surface: int = Field(..., gt=0, le=10000, description="Surface en m²")
    sector: str = Field(..., min_length=2, max_length=100, description="Secteur d'activité")


class MarketAnalysisResponse(BaseModel):
    city: str
    surface: int
    sector: str
    analysis: str


class LegalCheckRequest(BaseModel):
    country: Literal["CH", "FR"] = Field(..., description="Pays cible")
    canton: SUPPORTED_CANTONS | None = Field(
        None, description="Code canton suisse (GE, VD, ZH, BS, BE) — requis si country=CH"
    )


class LegalCheckResponse(BaseModel):
    country: str
    canton: str | None
    requirements: str


# ============================================
# ENDPOINTS
# ============================================

@router.post(
    "/market-analysis",
    response_model=MarketAnalysisResponse,
    summary="Analyse du marché immobilier commercial",
)
async def market_analysis(request: MarketAnalysisRequest):
    """
    Analyse le marché des bureaux commerciaux dans une ville donnée.

    Retourne : tension du marché, fourchette de loyers, tendance, points clés.
    Nécessite la variable d'environnement **ANTHROPIC_API_KEY**.
    """
    try:
        agent = _get_market_scout()
    except EnvironmentError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    result = agent.analyze(
        city=request.city,
        surface=request.surface,
        sector=request.sector,
    )

    if "error" in result:
        logger.error(f"MarketScout error: {result['error']}")
        raise HTTPException(status_code=502, detail="Analyse de marché indisponible.")

    return MarketAnalysisResponse(**result)


@router.post(
    "/legal-check",
    response_model=LegalCheckResponse,
    summary="Vérification des exigences légales d'implantation",
)
async def legal_check(request: LegalCheckRequest):
    """
    Retourne les exigences légales pour implanter une entreprise en France ou en Suisse.

    Couvre : forme juridique, TVA, permis de travail, droit du travail, délais administratifs.
    Nécessite la variable d'environnement **ANTHROPIC_API_KEY**.
    """
    if request.country == "CH" and not request.canton:
        raise HTTPException(
            status_code=400,
            detail="Le champ 'canton' est requis pour country=CH.",
        )

    try:
        agent = _get_legal_watchdog()
    except EnvironmentError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    result = agent.check(country=request.country, canton=request.canton)

    if "error" in result:
        logger.error(f"LegalWatchdog error: {result['error']}")
        raise HTTPException(status_code=502, detail="Vérification légale indisponible.")

    return LegalCheckResponse(**result)
