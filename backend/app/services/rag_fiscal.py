import os
import pickle
import logging
import faiss
from pathlib import Path
from typing import List, Dict, Tuple, Any, Optional
from anthropic import Anthropic
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)


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

    def _load_index(self):
        try:
            if self.index_path.exists() and self.meta_path.exists():
                self.index = faiss.read_index(str(self.index_path))
                with open(self.meta_path, "rb") as f:
                    data = pickle.load(f)
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

    def search(self, query: str, top_k: int = 3, filters: Optional[Dict] = None) -> List[Dict]:
        if not self.index or not self.chunks:
            return []

        query_embedding = self.model.encode([query])
        distances, indices = self.index.search(query_embedding, top_k * 5)

        results = []
        for i, idx in enumerate(indices[0]):
            if idx == -1:
                continue
            chunk = self.chunks[idx]

            text = chunk.text if hasattr(chunk, 'text') else chunk.get('text', '')
            metadata = chunk.metadata if hasattr(chunk, 'metadata') else chunk.get('metadata', {})

            if filters:
                match = all(metadata.get(k) == v for k, v in filters.items())
                if not match:
                    continue

            results.append({
                "text": text,
                "distance": float(distances[0][i]),
                **metadata,
            })

            if len(results) >= top_k:
                break

        return results

    def ask(self, question: str, filters: Optional[Dict] = None) -> Tuple[str, List[Dict]]:
        sources = self.search(question, top_k=3, filters=filters)

        if not sources:
            return (
                "Je n'ai pas trouve d'informations pertinentes dans la base documentaire "
                "locale pour repondre a votre question.",
                [],
            )

        context = "\n\n".join(
            f"Source: {s.get('source', 'Unknown')} (Canton: {s.get('canton', 'N/A')})\n{s.get('text', '')}"
            for s in sources
        )

        prompt = (
            "Vous etes un expert fiscal franco-suisse. "
            "Utilisez UNIQUEMENT le contexte suivant pour repondre a la question. "
            "Si le contexte ne contient pas l'information, dites-le honnetement.\n\n"
            f"CONTEXTE:\n{context}\n\n"
            f"QUESTION:\n{question}"
        )

        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            logger.error("ANTHROPIC_API_KEY non configuree")
            return (
                "Le service de reponse IA n'est pas configure. "
                "Voici les sources pertinentes trouvees.",
                sources,
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
                sources,
            )

        return answer, sources
