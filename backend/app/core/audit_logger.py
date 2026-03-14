# ============================================
# SwissRelocator - Audit Logger (RGPD / nLPD)
# backend/app/core/audit_logger.py
# Logger de conformité : pas de PII, IP masquée
# ============================================

import json
import logging
import os
from datetime import datetime, timezone
from pathlib import Path

from core.pii_detector import PIIDetector

logger = logging.getLogger(__name__)
_detector = PIIDetector()

DEFAULT_LOG_PATH = os.path.join(
    os.path.dirname(__file__), "..", "..", "..", "logs", "audit.jsonl"
)


class AuditLogger:
    """
    Enregistre les appels API de manière conforme RGPD :
    - IP réduite au premier octet (192.x.x.x)
    - Params filtrés via PIIDetector.redact()
    - Sortie : JSON Lines (une entrée par ligne)
    """

    def __init__(self, log_path: str = DEFAULT_LOG_PATH):
        self._log_path = log_path
        Path(self._log_path).parent.mkdir(parents=True, exist_ok=True)

    def log(
        self,
        endpoint: str,
        ip: str,
        params: dict,
        status_code: int,
    ) -> None:
        """Enregistre un appel API dans le fichier d'audit."""
        entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "endpoint": endpoint,
            "ip": self._mask_ip(ip),
            "params": self._redact_params(params),
            "status_code": status_code,
        }

        try:
            with open(self._log_path, "a", encoding="utf-8") as f:
                f.write(json.dumps(entry, ensure_ascii=False) + "\n")
        except OSError as exc:
            logger.error(f"Impossible d'écrire dans le fichier d'audit : {exc}")

    # ------------------------------------------
    # HELPERS PRIVÉS
    # ------------------------------------------

    @staticmethod
    def _mask_ip(ip: str) -> str:
        """Conserve uniquement le premier octet de l'IP."""
        parts = ip.split(".")
        if len(parts) == 4:
            return f"{parts[0]}.x.x.x"
        return "x.x.x.x"

    @staticmethod
    def _redact_params(params: dict) -> dict:
        """Redacte les valeurs string contenant des PII."""
        clean: dict = {}
        for key, value in params.items():
            if isinstance(value, str):
                clean[key] = _detector.redact(value)
            else:
                clean[key] = value
        return clean
