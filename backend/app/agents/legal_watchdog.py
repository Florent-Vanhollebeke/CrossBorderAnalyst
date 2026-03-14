# ============================================
# SwissRelocator - Legal Watchdog Agent
# backend/app/agents/legal_watchdog.py
# Vérifie les exigences légales d'implantation CH/FR
# ============================================

import logging
import os
import anthropic

logger = logging.getLogger(__name__)

MODEL = "claude-haiku-4-5-20251001"

SYSTEM_PROMPT = """Tu es un expert juridique spécialisé dans le droit des affaires suisse et français.
Tu informes les entreprises sur les obligations légales d'implantation (permis, TVA, droit du travail, formes juridiques).
Réponds en français. Sois précis sur les exigences, et indique toujours de consulter un avocat pour les décisions finales."""

CANTON_NAMES = {
    "ZH": "Zurich", "GE": "Genève", "VD": "Vaud",
    "BS": "Bâle-Ville", "BE": "Berne",
}


class LegalWatchdogAgent:
    """Agent de vérification des exigences légales."""

    def __init__(self):
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            logger.error("ANTHROPIC_API_KEY non définie — LegalWatchdogAgent non disponible")
            raise EnvironmentError(
                "ANTHROPIC_API_KEY manquante. Configurez la variable d'environnement."
            )
        self._client = anthropic.Anthropic(api_key=api_key)

    def check(self, country: str, canton: str | None) -> dict:
        """
        Retourne les exigences légales pour implanter une entreprise.

        Args:
            country: "CH" ou "FR"
            canton: code canton suisse (ex. "ZH", "GE") ou None pour la France

        Returns:
            dict avec les clés : country, canton, requirements, [error]
        """
        location = CANTON_NAMES.get(canton, canton) if canton else country
        prompt = (
            f"Quelles sont les principales exigences légales pour implanter une entreprise "
            f"{'dans le canton de ' + location if country == 'CH' else 'en France (Lyon)'} ? "
            f"Couvre : forme juridique recommandée, TVA, permis de travail pour dirigeants étrangers, "
            f"droit du travail local, délais administratifs typiques."
        )

        try:
            message = self._client.messages.create(
                model=MODEL,
                max_tokens=600,
                system=SYSTEM_PROMPT,
                messages=[{"role": "user", "content": prompt}],
            )
            requirements = message.content[0].text
        except Exception as exc:
            logger.error(f"LegalWatchdogAgent error pour {country}/{canton}: {exc}")
            return {
                "country": country,
                "canton": canton,
                "requirements": "Informations légales indisponibles.",
                "error": str(exc),
            }

        return {
            "country": country,
            "canton": canton,
            "requirements": requirements,
        }
