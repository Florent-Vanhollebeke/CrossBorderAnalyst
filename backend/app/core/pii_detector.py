# ============================================
# SwissRelocator - PII Detector
# backend/app/core/pii_detector.py
# Détecte et masque les données personnelles (RGPD / nLPD)
# ============================================

import re
from dataclasses import dataclass, field


@dataclass
class _Pattern:
    pii_type: str
    regex: re.Pattern
    placeholder: str = ""  # calculé depuis pii_type si vide


class PIIDetector:
    """
    Détecte et masque les données personnelles (PII) dans un texte.

    Types supportés :
    - email          : adresses e-mail
    - phone          : téléphones CH (+41) et FR (06/07/01-09)
    - iban           : IBAN CH et FR
    - avs            : numéros AVS suisses (756.xxxx.xxxx.xx)
    - siret          : SIRET (14 chiffres) et SIREN (9 chiffres) français
    """

    _PATTERNS: list[_Pattern] = [
        _Pattern(
            pii_type="email",
            regex=re.compile(
                r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}",
                re.IGNORECASE,
            ),
            placeholder="[EMAIL]",
        ),
        # IBAN traité AVANT téléphone : évite que le regex phone matche l'intérieur d'un IBAN
        _Pattern(
            pii_type="iban",
            regex=re.compile(
                r"\b(?:CH|FR)\d{2}[\s]?(?:\d{4}[\s]?){3,6}\d{1,4}\b",
                re.IGNORECASE,
            ),
            placeholder="[IBAN]",
        ),
        _Pattern(
            pii_type="phone",
            regex=re.compile(
                r"(?:"
                r"\+41[\s\-]?\d{2}[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}"  # +41 79 123 45 67
                r"|(?:\+33|0033)[\s\-]?\d[\s\-]?\d{2}[\s\-]?\d{2}[\s\-]?\d{2}[\s\-]?\d{2}"  # +33 / 0033
                r"|0[1-9](?:[\s\-]?\d{2}){4}"  # 06 12 34 56 78 / 01 23 45 67 89
                r")"
            ),
            placeholder="[PHONE]",
        ),
        _Pattern(
            pii_type="avs",
            regex=re.compile(
                r"\b756\.?\d{4}\.?\d{4}\.?\d{2}\b"
            ),
            placeholder="[AVS]",
        ),
        _Pattern(
            pii_type="siret",
            regex=re.compile(
                r"\b\d{3}[\s\-]?\d{3}[\s\-]?\d{3}[\s\-]?\d{5}\b"  # SIRET 14 chiffres
                r"|\b\d{3}[\s\-]?\d{3}[\s\-]?\d{3}\b"              # SIREN 9 chiffres
            ),
            placeholder="[SIRET]",
        ),
    ]

    def detect(self, text: str) -> list[str]:
        """
        Retourne la liste des types de PII détectés dans le texte.
        Chaque type n'apparaît qu'une seule fois.
        """
        found: set[str] = set()
        for pattern in self._PATTERNS:
            if pattern.regex.search(text):
                found.add(pattern.pii_type)
        return list(found)

    def redact(self, text: str) -> str:
        """
        Remplace toutes les occurrences de PII dans le texte par des placeholders.
        """
        result = text
        for pattern in self._PATTERNS:
            placeholder = pattern.placeholder or f"[{pattern.pii_type.upper()}]"
            result = pattern.regex.sub(placeholder, result)
        return result
