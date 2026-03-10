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

## 2026-03-10 — Audit module RAG (Gemini)

8. **Mocks hardcodes en production** : Ne jamais mettre de reponses mockees dans le code de production (ex: `if "Geneve" in question: answer = "..."`). Les mocks vont dans les tests uniquement.

9. **Cle API default "dummy"** : Ne jamais mettre de valeur par defaut bidon pour une cle API (`os.environ.get("KEY", "dummy")`). Verifier explicitement que la cle existe, sinon retourner un message clair.

10. **Tests 100% mockes = faux sentiment de securite** : Si tous les composants critiques sont mockes (FAISS, embeddings, LLM), les tests valident la plomberie mais pas le fonctionnement reel. Ajouter au minimum un test qui verifie le chargement reel de l'index.

11. **Imports relatifs vs absolus** : Dans ce projet, `app/` est la racine Python (uvicorn lance depuis `backend/app/`). Les imports doivent etre `from routers.x import ...` et non `from app.routers.x import ...`. Les tests ajoutent `sys.path.insert(0, "app")`.

12. **print() vs logging** : Toujours utiliser `logging.getLogger(__name__)` au lieu de `print()` pour les erreurs. Le logging structure est filtrable, configurable et ne pollue pas stdout.
