# ============================================
# SwissRelocator - Rate Limiter
# backend/app/core/rate_limiter.py
# Sliding window in-memory, sans dépendance externe
# ============================================

import re
import time
import logging
from collections import defaultdict, deque
from fastapi import Request
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)

# ============================================
# CONFIGURATION
# ============================================

RATE_LIMIT_REQUESTS = 30   # max requêtes par fenêtre
RATE_LIMIT_WINDOW = 60     # fenêtre en secondes
API_PREFIX = "/api/v1"     # seuls ces endpoints sont limités

# Stockage in-memory : {ip -> deque de timestamps}
_request_log: dict[str, deque] = defaultdict(deque)


# ============================================
# LOGIQUE SLIDING WINDOW
# ============================================

_IPV4_RE = re.compile(
    r"^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$"
)

# Proxies de confiance : accepter X-Forwarded-For uniquement depuis ces IPs
_TRUSTED_PROXIES: frozenset[str] = frozenset({"127.0.0.1", "::1"})


def _get_client_ip(request: Request) -> str:
    """
    Extrait l'IP réelle du client.
    N'utilise X-Forwarded-For que si la requête vient d'un proxy de confiance,
    et valide le format IPv4 pour éviter le spoofing.
    """
    direct_ip = request.client.host if request.client else "unknown"

    if direct_ip in _TRUSTED_PROXIES:
        forwarded_for = request.headers.get("X-Forwarded-For", "")
        candidate = forwarded_for.split(",")[0].strip()
        if _IPV4_RE.match(candidate):
            return candidate

    return direct_ip


def is_rate_limited(ip: str) -> bool:
    """
    Vérifie si l'IP a dépassé la limite.
    Nettoie les timestamps expirés avant de vérifier.
    Retourne True si la requête doit être bloquée.
    """
    now = time.time()
    window_start = now - RATE_LIMIT_WINDOW
    timestamps = _request_log[ip]

    # Supprimer les timestamps hors fenêtre
    while timestamps and timestamps[0] < window_start:
        timestamps.popleft()

    if len(timestamps) >= RATE_LIMIT_REQUESTS:
        return True

    # Enregistrer la requête courante
    timestamps.append(now)
    return False


# ============================================
# MIDDLEWARE FASTAPI
# ============================================

async def rate_limit_middleware(request: Request, call_next):
    """
    Middleware qui applique le rate limiting sur /api/v1/*.
    Les autres routes (docs, health racine) ne sont pas limitées.
    """
    if request.url.path.startswith(API_PREFIX):
        ip = _get_client_ip(request)

        if is_rate_limited(ip):
            logger.warning(f"Rate limit dépassé pour IP {ip[:8]}... sur {request.url.path}")
            return JSONResponse(
                status_code=429,
                content={
                    "error": "RateLimitError",
                    "detail": f"Trop de requêtes. Limite : {RATE_LIMIT_REQUESTS} req/{RATE_LIMIT_WINDOW}s par IP.",
                    "path": str(request.url.path),
                },
                headers={"Retry-After": str(RATE_LIMIT_WINDOW)},
            )

    return await call_next(request)
