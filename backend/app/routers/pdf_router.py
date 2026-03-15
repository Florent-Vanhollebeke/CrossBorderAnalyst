# ============================================
# SwissRelocator - Router PDF
# backend/app/routers/pdf_router.py
# ============================================

import logging
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field

from services.pdf_generator import PDFGenerator
from core.exceptions import PDFGenerationError

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["PDF Reports"])

_generator = PDFGenerator()


# ============================================
# SCHÉMAS
# ============================================

class FiscalResultItem(BaseModel):
    model_config = {"extra": "ignore"}

    city: str
    country: str
    currency: str
    corporate_tax_rate: float
    corporate_tax_amount: float
    employer_social_charges_rate: float
    employer_social_charges_amount: float
    total_employer_cost: float
    net_result: float


class ConfidenceRange(BaseModel):
    min_chf: float
    max_chf: float
    mae_chf: float


class ModelInfo(BaseModel):
    model_config = {"extra": "ignore"}
    model_type: str
    r2_score: float
    training_data: str
    last_updated: str


class RentResultItem(BaseModel):
    model_config = {"extra": "ignore"}

    city: str
    surface: float
    predicted_rent_chf: float
    predicted_rent_eur: float
    price_per_m2_chf: float
    confidence_range: ConfidenceRange
    model_info: ModelInfo
    property_type: str = "bureau"


class CombinedReportRequest(BaseModel):
    fiscal: list[FiscalResultItem]
    rent: RentResultItem
    city_rents: dict[str, float] = {}  # city -> loyer mensuel CHF
    lyon_zone: str = "centre"  # centre | periph | secondaire


# ============================================
# HELPERS
# ============================================

def _pdf_response(pdf_bytes: bytes, filename: str) -> Response:
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ============================================
# ENDPOINTS
# ============================================

@router.post("/generate-pdf/fiscal", summary="Rapport PDF comparaison fiscale")
async def generate_fiscal_pdf(results: list[FiscalResultItem]):
    if not results:
        raise HTTPException(status_code=400, detail="La liste de résultats ne peut pas être vide.")
    try:
        pdf_bytes = _generator.generate_fiscal_report([r.model_dump() for r in results])
    except Exception as exc:
        logger.error(f"Erreur PDF fiscal : {exc}", exc_info=True)
        raise PDFGenerationError()
    return _pdf_response(pdf_bytes, "crossborderanalyst_rapport_fiscal.pdf")


@router.post("/generate-pdf/rent", summary="Rapport PDF estimation de loyer")
async def generate_rent_pdf(rent: RentResultItem):
    try:
        pdf_bytes = _generator.generate_rent_report(rent.model_dump())
    except Exception as exc:
        logger.error(f"Erreur PDF loyer : {exc}", exc_info=True)
        raise PDFGenerationError()
    return _pdf_response(pdf_bytes, "crossborderanalyst_rapport_loyer.pdf")


@router.post("/generate-pdf/combined", summary="Rapport PDF analyse complète fiscal + loyer")
async def generate_combined_pdf(body: CombinedReportRequest):
    if not body.fiscal:
        raise HTTPException(status_code=400, detail="Les résultats fiscaux ne peuvent pas être vides.")
    try:
        pdf_bytes = _generator.generate_combined_report(
            [r.model_dump() for r in body.fiscal],
            body.rent.model_dump(),
            body.city_rents,
            lyon_zone=body.lyon_zone,
        )
    except Exception as exc:
        logger.error(f"Erreur PDF combiné : {exc}", exc_info=True)
        raise PDFGenerationError()
    return _pdf_response(pdf_bytes, "crossborderanalyst_analyse_complete.pdf")
