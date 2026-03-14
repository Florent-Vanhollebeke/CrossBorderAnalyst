"""
BraveSearchService — Recherche web avec hard limit plan gratuit.
Compteur mensuel stocké dans data/brave_usage.json.
Limite : 1900 req/mois (plan gratuit Brave = 2000, 100 de marge).
"""

import json
import logging
import os
from datetime import datetime
from pathlib import Path

import httpx

logger = logging.getLogger(__name__)

FREE_PLAN_LIMIT = 900  # $5 gratuits/mois ÷ $5/1000 req = 1000 req max, 900 avec marge
USAGE_FILE = Path(__file__).resolve().parent.parent / "data" / "brave_usage.json"


def _load_usage() -> dict[str, int | str]:
    try:
        if USAGE_FILE.exists():
            data = json.loads(USAGE_FILE.read_text())
            return {"month": str(data.get("month", "")), "count": int(data.get("count", 0))}
    except Exception:
        pass
    return {"month": "", "count": 0}


def _save_usage(usage: dict) -> None:
    try:
        USAGE_FILE.parent.mkdir(parents=True, exist_ok=True)
        USAGE_FILE.write_text(json.dumps(usage))
    except Exception:
        logger.warning("Impossible de sauvegarder brave_usage.json")


def _current_month() -> str:
    return datetime.utcnow().strftime("%Y-%m")


class BraveSearchService:
    """
    Wrapper Brave Search API avec compteur mensuel.
    Désactivé si BRAVE_API_KEY absent ou limite atteinte.
    """

    def __init__(self):
        self.api_key = os.environ.get("BRAVE_API_KEY", "")
        self.enabled = bool(self.api_key)
        if not self.enabled:
            logger.info("BRAVE_API_KEY non configurée — recherche web désactivée")

    def _check_and_increment(self) -> bool:
        """Retourne True si la requête peut passer, incrémente le compteur."""
        usage = _load_usage()
        month = _current_month()

        if usage.get("month") != month:
            usage = {"month": month, "count": 0}

        count = int(usage["count"])
        if count >= FREE_PLAN_LIMIT:
            logger.warning(
                "Brave Search : limite mensuelle atteinte (%d/%d)",
                count,
                FREE_PLAN_LIMIT,
            )
            return False

        usage["count"] = count + 1
        _save_usage(usage)
        logger.debug("Brave Search : %d/%d requêtes ce mois", count + 1, FREE_PLAN_LIMIT)
        return True

    def get_usage(self) -> dict:
        """Retourne le nombre de requêtes utilisées ce mois."""
        usage = _load_usage()
        if usage.get("month") != _current_month():
            return {"month": _current_month(), "count": 0, "limit": FREE_PLAN_LIMIT}
        return {**usage, "limit": FREE_PLAN_LIMIT}

    def search(self, query: str, count: int = 3) -> list[dict]:
        """
        Lance une recherche Brave.
        Retourne [] si désactivé, limite atteinte ou erreur réseau.
        """
        if not self.enabled:
            return []

        if not self._check_and_increment():
            return []

        try:
            with httpx.Client(timeout=5.0) as client:
                resp = client.get(
                    "https://api.search.brave.com/res/v1/web/search",
                    headers={
                        "X-Subscription-Token": self.api_key,
                        "Accept": "application/json",
                    },
                    params={"q": query, "count": count, "search_lang": "fr"},
                )
                resp.raise_for_status()

            results = resp.json().get("web", {}).get("results", [])
            return [
                {
                    "title": r.get("title", ""),
                    "text": r.get("description", ""),
                    "url": r.get("url", ""),
                    "source": "brave_web",
                    "doc_type": "web",
                    "canton": None,
                }
                for r in results
                if r.get("description")
            ]

        except httpx.TimeoutException:
            logger.warning("Brave Search : timeout")
            return []
        except Exception:
            logger.exception("Brave Search : erreur inattendue")
            return []
