# Lessons learned — SwissRelocator

## 2026-03-10 — Audit module fiscal (OpenClaw Bot)

### Erreurs détectées et patterns à retenir

1. **IS sur CA vs bénéfice** : L'impôt sur les sociétés s'applique sur le bénéfice fiscal (CA - charges déductibles), JAMAIS sur le CA brut. Toujours vérifier l'assiette fiscale.

2. **Taux de change EUR/CHF** : Le CHF est plus fort que l'EUR (~0.94). Ne pas confondre EUR→CHF et CHF→EUR. Vérifier que la conversion réduit bien le montant quand on passe de EUR à CHF.

3. **Charges sociales suisses** : Ne pas se limiter aux cotisations fédérales (AVS/AI/APG/AC ~6.4%). Inclure obligatoirement : LPP (~5% chaque côté), LAA (~0.5% pro, ~1.3% non-pro), allocations familiales (1.2-2.45% selon canton). Total employeur réaliste : ~13-15%.

4. **Paramètres d'entrée inutilisés** : Si un paramètre est demandé en entrée (num_employees), il DOIT être utilisé dans le calcul. Sinon, le supprimer de l'API.

5. **Cohérence interne des données** : Quand un JSON contient un taux global ET un breakdown, la somme du breakdown DOIT correspondre exactement au taux global.

6. **Sécurité — messages d'erreur** : Ne jamais exposer `str(e)` dans une réponse HTTP. Logger l'exception côté serveur, retourner un message générique au client.

7. **CORS wildcards partielles** : FastAPI/Starlette ne supporte pas `https://*.domain.com` dans `allow_origins`. Utiliser `allow_origin_regex`.
