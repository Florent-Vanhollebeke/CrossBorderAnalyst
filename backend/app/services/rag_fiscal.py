import io
import os
import pickle
import logging
import faiss
from dataclasses import dataclass
from pathlib import Path
from typing import List, Dict, Tuple, Any, Optional
from anthropic import Anthropic
from sentence_transformers import SentenceTransformer
from services.brave_search import BraveSearchService

logger = logging.getLogger(__name__)

RAG_DISTANCE_THRESHOLD = 0.65  # En dessous → RAG suffit ; au dessus → Brave appelé
# Embeddings normalisés (L2 dans [0,2]). Calibré sur l'index réel :
#   IN corpus  : TVA→0.53, impôt bénéfices→0.61  (< 0.65 ✓)
#   OUT corpus : BNS→0.68, taux hypothécaire→0.70 (> 0.65 ✓)


@dataclass
class _Chunk:
    """Local Chunk dataclass used to deserialize pickled Chunk objects."""
    id: str
    text: str
    metadata: dict


class _ChunkUnpickler(pickle.Unpickler):
    """Custom unpickler that maps __main__.Chunk to _Chunk (handles index rebuilt as script)."""

    def find_class(self, module, name):
        if name == "Chunk":
            return _Chunk
        return super().find_class(module, name)


class RAGService:
    def __init__(self):
        self.model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
        backend_dir = Path(__file__).resolve().parent.parent.parent
        self.faiss_dir = backend_dir / "app" / "data" / "faiss_index"
        self.index_path = self.faiss_dir / "index.faiss"
        self.meta_path = self.faiss_dir / "data.pkl"

        self.index = None
        self.chunks: List[Dict] = []
        self._load_index()
        self.brave = BraveSearchService()

    def _load_index(self):
        try:
            if self.index_path.exists() and self.meta_path.exists():
                self.index = faiss.read_index(str(self.index_path))
                with open(self.meta_path, "rb") as f:
                    data = _ChunkUnpickler(f).load()
                    self.chunks = data.get("chunks", [])
                logger.info("FAISS index loaded: %d chunks", len(self.chunks))
            else:
                missing = []
                if not self.index_path.exists():
                    missing.append(str(self.index_path))
                if not self.meta_path.exists():
                    missing.append(str(self.meta_path))
                logger.warning("FAISS index incomplete, missing: %s", ", ".join(missing))
        except Exception:
            logger.exception("Erreur chargement index FAISS")

    def _chunk_to_dict(self, chunk: Any) -> Dict:
        """Normalise un chunk (dataclass ou dict plat) en dict avec champs garantis."""
        if hasattr(chunk, 'metadata'):
            # _Chunk dataclass (désérialisé depuis pkl Chunk)
            meta = chunk.metadata or {}
            text = chunk.text or ''
        else:
            # Dict plat (index reconstruit avec index_faiss.py corrigé)
            meta = {k: v for k, v in chunk.items() if k not in ('text', 'id')}
            text = chunk.get('text', '')

        return {
            "text": text,
            "title": meta.get("description") or meta.get("source", "Source inconnue"),
            "canton": meta.get("canton"),
            "doc_type": meta.get("doc_type"),
            "source": meta.get("source"),
            **meta,
        }

    def search(self, query: str, top_k: int = 3, filters: Optional[Dict] = None) -> List[Dict]:
        if not self.index or not self.chunks:
            return []

        query_embedding = self.model.encode([query], normalize_embeddings=True)
        distances, indices = self.index.search(query_embedding, top_k * 5)

        results = []
        for i, idx in enumerate(indices[0]):
            if idx == -1:
                continue
            chunk = self.chunks[idx]
            chunk_dict = self._chunk_to_dict(chunk)

            if filters:
                match = all(chunk_dict.get(k) == v for k, v in filters.items())
                if not match:
                    continue

            chunk_dict["distance"] = float(distances[0][i])
            results.append(chunk_dict)

            if len(results) >= top_k:
                break

        return results

    def ask(self, question: str, filters: Optional[Dict] = None) -> Tuple[str, List[Dict], bool]:
        rag_sources = self.search(question, top_k=3, filters=filters)

        rag_is_sufficient = bool(rag_sources) and min(
            s["distance"] for s in rag_sources
        ) < RAG_DISTANCE_THRESHOLD

        if rag_is_sufficient:
            web_sources = []
        else:
            web_sources = self.brave.search(question, count=2)

        all_sources = rag_sources + web_sources

        if not all_sources:
            return (
                "Je n'ai pas trouve d'informations pertinentes dans la base documentaire "
                "locale pour repondre a votre question.",
                [],
                False,
            )

        # Construire le contexte en distinguant RAG et web
        context_parts = []
        for i, s in enumerate(rag_sources):
            context_parts.append(
                f"[Doc {i+1}: {s.get('title', s.get('source', 'Inconnu'))} — Canton {s.get('canton', 'N/A')}]\n{s.get('text', '')}"
            )
        for i, s in enumerate(web_sources):
            context_parts.append(
                f"[Source web — {s.get('title', 'Résultat web')}]\n{s.get('text', '')}"
            )
        context = "\n\n".join(context_parts)

        prompt = (
            "Vous etes un expert fiscal franco-suisse specialise dans la fiscalite des entreprises "
            "et l'immobilier commercial en France et en Suisse.\n\n"
            "Des sources documentaires officielles vous sont fournies ci-dessous. "
            "Priorite absolue aux informations dans ces sources. "
            "Si les sources ne couvrent pas completement la question, completez avec vos "
            "connaissances generales en fiscalite franco-suisse en le signalant clairement "
            "avec la mention '(connaissance generale)'.\n\n"
            "CONSIGNES DE FORME : repondez en texte brut uniquement. "
            "N'utilisez PAS de balises HTML (<strong>, <em>, etc.). "
            "Utilisez des tirets (-) pour les listes et des majuscules pour les titres.\n\n"
            f"SOURCES:\n{context}\n\n"
            f"QUESTION:\n{question}\n\n"
            "Repondez de maniere claire et structuree, en citant les chiffres precis quand disponibles."
        )

        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            logger.error("ANTHROPIC_API_KEY non configuree")
            return (
                "Le service de reponse IA n'est pas configure. "
                "Voici les sources pertinentes trouvees.",
                all_sources,
                rag_is_sufficient,
            )

        try:
            anthropic_client = Anthropic(api_key=api_key)
            response = anthropic_client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=1000,
                temperature=0.0,
                messages=[{"role": "user", "content": prompt}],
            )
            answer = response.content[0].text
        except Exception:
            logger.exception("Erreur appel API Anthropic")
            return (
                "Le service de reponse IA est temporairement indisponible. "
                "Voici les sources pertinentes trouvees.",
                all_sources,
                rag_is_sufficient,
            )

        return answer, all_sources, rag_is_sufficient
