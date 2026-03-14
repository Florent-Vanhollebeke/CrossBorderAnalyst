# ============================================
# SwissRelocator - Market Scout Agent
# backend/app/agents/market_scout.py
# Analyse le marché immobilier commercial par ville
# ============================================

import logging
import os
import anthropic

logger = logging.getLogger(__name__)

MODEL = "claude-haiku-4-5-20251001"

SYSTEM_PROMPT = """Tu es un expert en immobilier commercial en Suisse et en France.
Tu analyses les marchés locatifs par ville et secteur d'activité.
Réponds en français, de manière concise et factuelle.
Si tu manques de données précises, indique-le clairement."""


class MarketScoutAgent:
    """Agent d'analyse du marché immobilier commercial."""

    def __init__(self):
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            logger.error("ANTHROPIC_API_KEY non définie — MarketScoutAgent non disponible")
            raise EnvironmentError(
                "ANTHROPIC_API_KEY manquante. Configurez la variable d'environnement."
            )
        self._client = anthropic.Anthropic(api_key=api_key)

    def analyze(self, city: str, surface: int, sector: str) -> dict:
        """
        Analyse le marché immobilier pour une ville, surface et secteur donnés.

        Returns:
            dict avec les clés : city, surface, sector, analysis, [error]
        """
        prompt = (
            f"Analyse le marché des bureaux commerciaux à {city} "
            f"pour une surface de {surface} m² dans le secteur {sector}. "
            f"Donne : niveau de tension du marché, fourchette de loyers typique, "
            f"tendance (hausse/stable/baisse), et 2-3 points clés pour un décideur."
        )

        try:
            message = self._client.messages.create(
                model=MODEL,
                max_tokens=512,
                system=SYSTEM_PROMPT,
                messages=[{"role": "user", "content": prompt}],
            )
            analysis = message.content[0].text
        except Exception as exc:
            logger.error(f"MarketScoutAgent error pour {city}: {exc}")
            return {
                "city": city,
                "surface": surface,
                "sector": sector,
                "analysis": "Analyse indisponible.",
                "error": str(exc),
            }

        return {
            "city": city,
            "surface": surface,
            "sector": sector,
            "analysis": analysis,
        }
