# Règles de travail

## Partie 1 — Règles globales (tous projets)

### Orchestration du travail

1. **Mode Plan par défaut**
   - Passer en mode plan pour TOUTE tâche non triviale (3+ étapes ou décisions d'architecture).
   - Si quelque chose dérape : STOP, on re-planifie immédiatement — on ne s'entête pas.
   - Utiliser le mode plan aussi pour les étapes de vérification, pas seulement pour construire.
   - Écrire des specs détaillées en amont pour réduire l'ambiguïté.

2. **Boucle d'auto-amélioration**
   - Après TOUTE correction de l'utilisateur : mettre à jour `tasks/lessons.md` avec le pattern rencontré.
   - Écrire des règles pour toi-même qui empêchent de refaire la même erreur.
   - Itérer sans relâche sur ces leçons jusqu'à ce que le taux d'erreur baisse.
   - Relire `tasks/lessons.md` en début de chaque session avant de toucher au code.

3. **Vérification avant de déclarer "terminé"**
   - Ne jamais marquer une tâche comme terminée sans prouver qu'elle fonctionne.
   - Comparer le comportement entre `main` et tes modifications quand c'est pertinent.
   - Se demander : "Est-ce qu'un développeur senior validerait ça ?"
   - Lancer les tests, vérifier les logs, démontrer que ça marche.

4. **Rechercher l'élégance (avec mesure)**
   - Pour les changements non triviaux : pause — "Y a-t-il une façon plus élégante ?"
   - Si un fix semble hacky : "Sachant tout ce que je sais maintenant, quelle serait la solution élégante ?"
   - Ne pas faire ça pour les corrections simples et évidentes — pas de sur-ingénierie.
   - Challenger son propre travail avant de le présenter.

5. **Résolution autonome des bugs**
   - Quand on te donne un rapport de bug : corrige-le directement. Pas de questions superflues.
   - Pointer les logs, erreurs, tests en échec — puis les résoudre.
   - Zéro changement de contexte requis côté utilisateur.
   - Aller corriger les tests CI qui échouent sans qu'on te le demande.

### Gestion des tâches et mémoire

* **Initialisation :** Si le dossier `tasks/` ou les fichiers `todo.md` / `lessons.md` n'existent pas, les créer immédiatement au premier lancement. Ne pas demander, le faire.
* **Cycle de travail :**
    - *Planifier d'abord :* écrire le plan dans `tasks/todo.md` avec des items cochables.
    - *Valider le plan :* vérifier avec l'utilisateur avant de commencer l'implémentation.
    - *Suivre la progression :* cocher les items au fur et à mesure.
    - *Expliquer les changements :* résumé de haut niveau à chaque étape.
    - *Documenter les résultats :* ajouter une section review dans `tasks/todo.md`.
    - *Capturer les leçons :* mettre à jour `tasks/lessons.md` après chaque correction.

### Développement — TDD obligatoire

* **Règle d'or du TDD :**
    - Écrire le test en premier, le présenter pour validation, et attendre le feu vert avant d'écrire le code de production.
    - **Ne JAMAIS fournir le test et l'implémentation dans la même réponse.**
    - Cycle strict : Rouge → Vert → Refactor. Toujours.
    - Un test doit être lisible comme une spécification : nommer clairement ce qu'il vérifie.
    - Si un bug apparaît : écrire d'abord le test qui le reproduit, puis corriger.
* **Pragmatisme TDD :**
    - Tester le comportement, pas l'implémentation.
    - Pas de tests pour les getters/setters triviaux ou le boilerplate évident.
    - Privilégier les tests d'intégration pour les flux critiques (API, flux de données).
    - Tests unitaires pour la logique métier.
    - Ne pas tomber dans le piège de la couverture à 100% — tester ce qui a de la valeur.

### Sécurité applicative — Réflexe permanent

* **État d'esprit :**
    - Tout input est hostile. Données utilisateur, paramètres d'URL, headers, corps de requête, fichiers uploadés, webhooks entrants : ne jamais faire confiance.
    - Avant d'écrire un endpoint ou un traitement de données, se demander : "Comment un attaquant pourrait-il abuser de ça ?"
* **Injections — Tolérance zéro :**
    - *SQL Injection :* requêtes paramétrées obligatoires. Jamais de concaténation de strings dans une requête SQL. Jamais.
    - *XSS (Cross-Site Scripting) :* échapper systématiquement tout output HTML. Utiliser les mécanismes d'échappement natifs du framework.
    - *Command Injection :* ne jamais passer d'input utilisateur dans un exec, system, shell_exec ou équivalent. Si c'est absolument nécessaire, whitelist stricte.
    - *Path Traversal :* valider et assainir tout chemin de fichier. Interdire `../` et les chemins absolus venant de l'utilisateur.
    - *LDAP / NoSQL / Header Injection :* même principe — paramétrer, échapper, valider.
* **Authentification et autorisations :**
    - Vérifier les autorisations côté serveur à chaque requête. Ne jamais se fier au front-end pour contrôler l'accès.
    - Principe du moindre privilège : chaque composant n'accède qu'à ce dont il a strictement besoin.
    - Les tokens et secrets ne vont jamais dans le code source, les logs ou le front-end.
* **Validation des données :**
    - Valider en entrée (type, format, longueur, plage) ET en sortie (échappement).
    - Utiliser des schémas de validation explicites (JSON Schema, Zod, Pydantic, selon la stack).
    - Rejeter ce qui ne correspond pas au schéma attendu plutôt qu'essayer de le "nettoyer".
* **Dépendances et configuration :**
    - Ne pas introduire de dépendance sans vérifier sa réputation et sa maintenance.
    - Pas de secrets en dur dans le code — utiliser des variables d'environnement ou un gestionnaire de secrets.
    - Les messages d'erreur exposés à l'utilisateur ne doivent jamais révéler la stack, les chemins internes ou la structure de la base.
* **En cas de doute :**
    - Si tu hésites sur la sécurité d'un pattern : choisis l'option la plus restrictive et signale-le à l'utilisateur.
    - Mieux vaut un faux positif qu'une faille en production.

### Principes fondamentaux

* **Simplicité d'abord :** chaque changement doit être aussi simple que possible. Impact minimal sur le code existant.
* **Pas de paresse :** trouver les causes racines. Pas de corrections temporaires. Standards de développeur senior.
* **Impact minimal :** les changements ne touchent que ce qui est nécessaire. Ne pas introduire de complexité inutile.
* **Respecter l'existant :** comprendre l'architecture avant de modifier. Ne pas réinventer ce qui fonctionne.
