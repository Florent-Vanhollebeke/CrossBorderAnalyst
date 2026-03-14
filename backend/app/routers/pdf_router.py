# ============================================
# SwissRelocator - Router PDF
# backend/app/routers/pdf_router.py
# ============================================

import logging
from fastapi import APIRouter
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


# ============================================
# ENDPOINT
# ============================================

@router.post(
    "/generate-pdf/fiscal",
    summary="Générer un rapport PDF de comparaison fiscale",
    response_description="Fichier PDF binaire",
)
async def generate_fiscal_pdf(results: list[FiscalResultItem]):
    """
    Génère un rapport PDF de comparaison fiscale pour la liste de villes fournie.

    - Retourne un fichier PDF téléchargeable
    - Nécessite au moins 1 résultat en entrée
    """
    if not results:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="La liste de résultats ne peut pas être vide.")

    try:
        results_dicts = [r.model_dump() for r in results]
        pdf_bytes = _generator.generate_fiscal_report(results_dicts)
    except Exception as exc:
        logger.error(f"Erreur génération PDF : {exc}", exc_info=True)
        raise PDFGenerationError()

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": 'attachment; filename="swissrelocator_rapport_fiscal.pdf"',
        },
    )
