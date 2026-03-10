# Tasks — SwissRelocator

## Fait : Module fiscal_router.py (v1 par OpenClaw)

- [x] Étape 1 — Alimenter `fiscal_rates.json` et `salary_grids.json`
- [x] Étape 2 — Écrire les tests TDD (`test_fiscal_router.py`)
- [x] Étape 3 — Implémenter `routers/fiscal_router.py`
- [x] Étape 4 — Intégrer dans `main.py`

## Fait : Audit & corrections module fiscal (P0 + P1 + P2) ✓

### P0 — Bugs critiques
- [x] Fix 1 — `salary_grids.json` : EUR_to_CHF corrigé (0.94, pas 1.065)
- [x] Fix 2 — `fiscal_rates.json` : AVS 4.35%, breakdown cohérent avec headline
- [x] Fix 3 — `fiscal_rates.json` : ajout LPP ~5%, LAA ~0.5%/1.3%, AF par canton
- [x] Fix 4 — `fiscal_router.py` : IS calculé sur le bénéfice (CA - charges)
- [x] Fix 5 — `fiscal_router.py` : num_employees + average_employee_salary pris en compte

### P1 — Sécurité & qualité
- [x] Fix 6 — Message HTTP 500 générique (plus de str(e) exposé)
- [x] Fix 7 — CORS : `allow_origin_regex` au lieu de wildcard partielle

### Tests
- [x] Fix 8 — 17 tests réécrits (IS sur bénéfice, num_employees, EUR/CHF, charges réalistes)
- [x] Fix 9 — 17/17 tests passent ✓

## Fait

- [x] `tests/test_predict_rent.py` — 6 cas + bonus aliases
- [x] `requirements.txt` — ajout pytest + httpx
- [x] `CLAUDE.md` — règles de travail
