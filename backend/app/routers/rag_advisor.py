import logging
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

from services.rag_fiscal import RAGService

logger = logging.getLogger(__name__)

router = APIRouter()


def get_rag_service():
    return RAGService()


class RAGRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000)
    filters: Optional[Dict[str, Any]] = None


class RAGResponse(BaseModel):
    answer: str
    sources: List[Dict[str, Any]]


@router.post("/ask", response_model=RAGResponse)
async def ask_advisor(request: RAGRequest, service: RAGService = Depends(get_rag_service)):
    try:
        answer, sources = service.ask(request.question, filters=request.filters)
        return RAGResponse(answer=answer, sources=sources)
    except Exception:
        logger.exception("Erreur lors de la requete RAG")
        raise HTTPException(status_code=500, detail="Erreur interne du service RAG")
