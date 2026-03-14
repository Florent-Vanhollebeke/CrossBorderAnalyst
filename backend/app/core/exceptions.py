# ============================================
# SwissRelocator - Custom Exceptions
# backend/app/core/exceptions.py
# ============================================

from fastapi import Request
from fastapi.responses import JSONResponse


# ============================================
# EXCEPTIONS MÉTIER
# ============================================

class SwissRelocatorError(Exception):
    """Exception de base pour toutes les erreurs métier SwissRelocator."""

    def __init__(self, detail: str, status_code: int = 400):
        self.detail = detail
        self.status_code = status_code
        super().__init__(detail)


class ModelNotLoadedError(SwissRelocatorError):
    """Levée quand le modèle ML n'est pas disponible."""

    def __init__(self, detail: str = "Le modèle ML n'est pas disponible"):
        super().__init__(detail=detail, status_code=503)


class CityNotFoundError(SwissRelocatorError):
    """Levée quand la ville demandée n'est pas supportée."""

    def __init__(self, city: str):
        super().__init__(
            detail=f"Ville non supportée : '{city}'. Villes disponibles : Lyon, Geneve, Lausanne, Zurich, Basel",
            status_code=404,
        )


class RateLimitError(SwissRelocatorError):
    """Levée quand le quota de requêtes est dépassé."""

    def __init__(self, detail: str = "Trop de requêtes. Limite : 30 req/min par IP."):
        super().__init__(detail=detail, status_code=429)


class PDFGenerationError(SwissRelocatorError):
    """Levée quand la génération du PDF échoue."""

    def __init__(self, detail: str = "Erreur lors de la génération du rapport PDF"):
        super().__init__(detail=detail, status_code=500)


# ============================================
# HANDLERS FASTAPI
# ============================================

async def swissrelocator_exception_handler(
    request: Request, exc: SwissRelocatorError
) -> JSONResponse:
    """Handler générique pour toutes les SwissRelocatorError."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": type(exc).__name__,
            "detail": exc.detail,
            "path": str(request.url.path),
        },
    )


def register_exception_handlers(app) -> None:
    """Enregistre tous les handlers d'exceptions sur l'application FastAPI."""
    app.add_exception_handler(SwissRelocatorError, swissrelocator_exception_handler)
