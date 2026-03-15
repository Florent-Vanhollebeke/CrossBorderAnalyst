# ============================================
# SwissRelocator - API Backend Principal
# backend/app/main.py
# ============================================

from dotenv import load_dotenv
from pathlib import Path
load_dotenv(Path(__file__).resolve().parents[2] / ".env")  # charge SwissRelocator/.env en dev local

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import time
import logging

# Import des routers
from predict_rent_router import router as predict_rent_router
from routers.fiscal_router import router as fiscal_router
from routers.rag_advisor import router as rag_router
from routers.pdf_router import router as pdf_router
from routers.agents_router import router as agents_router

# Import des modules core
from core.exceptions import SwissRelocatorError, register_exception_handlers
from core.rate_limiter import rate_limit_middleware

# ============================================
# CONFIGURATION LOGGING
# ============================================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================
# LIFESPAN (startup/shutdown)
# ============================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestion du cycle de vie de l'application"""
    # Startup
    logger.info("🚀 Démarrage SwissRelocator API...")
    logger.info("✅ Modèle ML chargé")
    logger.info("✅ API prête")
    
    yield
    
    # Shutdown
    logger.info("👋 Arrêt SwissRelocator API...")

# ============================================
# APPLICATION FASTAPI
# ============================================

app = FastAPI(
    title="SwissRelocator API",
    description="""
## 🇨🇭 API de comparaison fiscale et immobilière France-Suisse

### Fonctionnalités:
- **🏢 Prédiction loyers** : ML model (R² = 0.763) pour estimer les loyers commerciaux
- **💰 Comparaison fiscale** : Calcul impôts société FR vs CH (GE, VD, ZH, BS)
- **👥 Charges sociales** : Comparaison coûts employeur
- **🤖 Conseiller IA** : RAG + Claude pour recommandations personnalisées

### Villes supportées:
- 🇫🇷 Lyon (France)
- 🇨🇭 Genève, Lausanne, Zürich, Basel (Suisse)

### Auteur:
Florent VANHOLLEBEKE - Chef de projet IA/Automatisation
""",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# ============================================
# MIDDLEWARE
# ============================================

# CORS pour le frontend Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://swissrelocator.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


# Rate limiting sur /api/v1/*
app.middleware("http")(rate_limit_middleware)


# Security headers
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# Middleware de logging des requêtes
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log toutes les requêtes avec leur temps de réponse"""
    start_time = time.time()
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    logger.info(
        f"{request.method} {request.url.path} - "
        f"{response.status_code} - {process_time:.3f}s"
    )
    
    # Ajouter le temps de traitement dans les headers
    response.headers["X-Process-Time"] = str(process_time)
    
    return response


# ============================================
# GESTIONNAIRE D'ERREURS
# ============================================

# Handlers pour les exceptions métier SwissRelocator
register_exception_handlers(app)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Gestionnaire global d'erreurs"""
    logger.error(f"Erreur non gérée: {exc}", exc_info=True)
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "Erreur interne du serveur",
            "detail": str(exc) if app.debug else "Une erreur s'est produite",
            "path": str(request.url.path)
        }
    )


# ============================================
# INCLUSION DES ROUTERS
# ============================================

# ML Predictions (loyers)
app.include_router(predict_rent_router)

# Comparaison fiscale FR/CH
app.include_router(fiscal_router)

# RAG Advisor
app.include_router(rag_router, prefix="/api/v1", tags=["RAG Advisor"])

# PDF Reports
app.include_router(pdf_router)

# AI Agents (MarketScout, LegalWatchdog)
app.include_router(agents_router)


# ============================================
# ENDPOINTS RACINE
# ============================================

@app.get("/", tags=["Root"])
async def root():
    """Page d'accueil de l'API"""
    return {
        "name": "SwissRelocator API",
        "version": "1.0.0",
        "description": "API de comparaison fiscale et immobilière France-Suisse",
        "documentation": "/docs",
        "endpoints": {
            "predict_rent": "/api/v1/predict-rent",
            "model_info": "/api/v1/model-info",
            "health": "/api/v1/health"
        }
    }


@app.get("/health", tags=["Health"])
async def health():
    """Health check global de l'API"""
    return {
        "status": "healthy",
        "api_version": "1.0.0",
        "services": {
            "ml_model": "operational",
            "rag_system": "operational",
            "database": "operational"
        }
    }


# ============================================
# POINT D'ENTRÉE
# ============================================

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Hot reload en dev
        log_level="info"
    )