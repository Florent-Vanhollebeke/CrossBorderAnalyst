# ============================================
# SwissRelocator - Chief Editor Agent
# backend/app/agents/chief_editor.py
# Contrôle qualité des réponses RAG avant diffusion
# ============================================

import logging
import os
import anthropic

logger = logging.getLogger(__name__)

MODEL = "claude-haiku-4-5-20251001"

SYSTEM_PROMPT = """Tu es rédacteur en chef d'une plateforme de conseil fiscal et immobilier.
Tu vérifies que les réponses générées par l'IA sont :
- Factuellement correctes (taux, chiffres, réglementation)
- Claires et compréhensibles pour un dirigeant d'entreprise non fiscaliste
- Sans affirmations trop absolues sur des sujets complexes

Réponds UNIQUEMENT par :
APPROVED: <explication courte>
ou
REJECTED: <raison du rejet et suggestion de correction>"""


class ChiefEditorAgent:
    """Agent de contrôle qualité des réponses générées par le RAG."""

    def __init__(self):
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            logger.error("ANTHROPIC_API_KEY non définie — ChiefEditorAgent non disponible")
            raise EnvironmentError(
                "ANTHROPIC_API_KEY manquante. Configurez la variable d'environnement."
            )
        self._client = anthropic.Anthropic(api_key=api_key)

    def review(self, content: str) -> dict:
        """
        Évalue la qualité d'un contenu généré par le RAG.

        Args:
            content: texte à évaluer

        Returns:
            dict avec les clés : approved (bool), feedback (str), [error]
        """
        if not content or not content.strip():
            return {"approved": False, "feedback": "Contenu vide — rien à évaluer."}

        prompt = f"Évalue ce contenu :\n\n{content}"

        try:
            message = self._client.messages.create(
                model=MODEL,
                max_tokens=256,
                system=SYSTEM_PROMPT,
                messages=[{"role": "user", "content": prompt}],
            )
            verdict = message.content[0].text.strip()
        except Exception as exc:
            logger.error(f"ChiefEditorAgent error : {exc}")
            return {
                "approved": False,
                "feedback": "Contrôle qualité indisponible.",
                "error": str(exc),
            }

        approved = verdict.upper().startswith("APPROVED")
        return {
            "approved": approved,
            "feedback": verdict,
        }
