# SwissRelocator 🇨🇭

**Plateforme de comparaison fiscale et immobilière France-Suisse**

Application complète d'aide à la décision pour les entrepreneurs et entreprises souhaitant s'implanter en Suisse, avec prédiction ML des loyers commerciaux et simulation fiscale comparative.

---

## 🔒 Privacy by Design - Conformité RGPD/nLPD Suisse

**Architecture hybride respectueuse de la vie privée :**

SwissRelocator adopte une approche **Privacy by Design** conforme au RGPD européen et à la nLPD suisse (nouvelle Loi fédérale sur la protection des données) :

### Traitement local des données sensibles
- **Ollama (LLM local)** : Collecte des informations utilisateur et restitution des recommandations
- **Traitement on-premise** : Les données personnelles de l'utilisateur restent sur son infrastructure
- **Aucun tracking** : Pas de cookies tiers, pas d'analytics invasifs

### Minimisation de l'exposition externe
- **Claude 3.5 Sonnet (API Anthropic)** : Utilisé uniquement pour les recherches fiscales et tendances sectorielles
- **Données anonymisées** : Seuls les paramètres fiscaux agrégés sont transmis (CA, masse salariale, canton, secteur)
- **Sans identité** : Aucune information personnelle identifiable (nom, email, SIREN) n'est envoyée à l'API Claude

### Architecture de confidentialité

```
┌─────────────────────────────────────────────────────────────┐
│  UTILISATEUR                                                │
│  ├─ Informations personnelles (nom, entreprise, CA, etc.)  │
│  └─ Préférences et historique                              │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │   OLLAMA (LOCAL)     │  🔒 Données sensibles restent locales
        │   ├─ Collecte infos  │
        │   └─ Restitution AI  │
        └──────────┬───────────┘
                   │
                   │ Transmission paramètres fiscaux uniquement
                   │ (anonymes : CA, canton, nb employés)
                   ▼
        ┌──────────────────────┐
        │  CLAUDE API (Cloud)  │  ☁️ Recherches fiscales uniquement
        │  └─ Fiscal & trends  │     (sans données personnelles)
        └──────────┬───────────┘
                   │
                   │ Résultat fiscal agrégé
                   ▼
        ┌──────────────────────┐
        │   OLLAMA (LOCAL)     │  🔒 Restitution personnalisée
        │   └─ Formatage final │     avec contexte utilisateur
        └──────────────────────┘
```

### Conformité réglementaire
- ✅ **RGPD (EU)** : Minimisation des données, droit à l'oubli, transparence
- ✅ **nLPD (Suisse)** : Protection renforcée des données personnelles
- ✅ **Privacy by Default** : Paramètres par défaut les plus protecteurs
- ✅ **Data Residency** : Option de déploiement 100% on-premise disponible

### Avantages pour l'utilisateur
- **Confidentialité maximale** : Les données sensibles (chiffre d'affaires exact, informations d'entreprise) ne quittent pas l'infrastructure locale
- **Conformité native** : Architecture pensée pour les exigences suisses et européennes
- **Transparence totale** : L'utilisateur sait exactement quelles données sont traitées où
- **Souveraineté des données** : Possibilité de self-hosting complet (Ollama + API locale)

---

## Fonctionnalités principales

### 🏢 Prédiction de loyers commerciaux (ML)
- **Modèle XGBoost** entraîné sur données ImmoScout24 Suisse
- **Performance** : R² = 0.763, MAE = 1425 CHF
- **Villes supportées** : Genève, Lausanne, Zürich, Basel
- **Features** : 18 variables (surface, localisation, équipements, sans data leakage)
- **API REST** avec validation Pydantic

### 💰 Simulation fiscale comparative
- Comparaison impôt société **France vs Suisse** (GE, VD, ZH, BS)
- Calcul des **charges sociales** employeur FR/CH
- Simulation personnalisée selon le chiffre d'affaires et la masse salariale
- Prise en compte des spécificités cantonales suisses

### 🤖 Conseiller IA (RAG) - Privacy-First
- Système RAG (Retrieval Augmented Generation) avec **FAISS**
- Base de connaissances sur la fiscalité et l'immobilier CH/FR
- **Ollama (local)** pour l'interaction utilisateur et la restitution
- **Claude 3.5 Sonnet (API)** uniquement pour les recherches fiscales et tendances sectorielles (données anonymisées)
- Recherche sémantique dans 500+ documents

---

## Architecture technique

### Backend (Python)
- **Framework** : FastAPI 0.115.0
- **ML** : XGBoost, scikit-learn, pandas, numpy
- **RAG** : FAISS (Facebook AI Similarity Search), sentence-transformers
- **LLM** :
  - **Ollama (local)** : Interface utilisateur et restitution (Llama 3, Mistral, etc.)
  - **Claude 3.5 Sonnet API** : Recherches fiscales et tendances sectorielles (données anonymisées)
- **Scraping** : Extension navigateur JavaScript personnalisée (immo-scraper-extension)
- **API** : REST avec documentation OpenAPI automatique

### Frontend (TypeScript/React)
- **Framework** : Next.js 14 (App Router)
- **UI** : Tailwind CSS, Framer Motion, Lucide React
- **Forms** : React Hook Form + Zod validation
- **Charts** : Recharts
- **i18n** : next-intl (français/anglais)
- **Auth** : Supabase (SSR)

### Structure du projet
```
SwissRelocator/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI application principale
│   │   ├── predict_rent_router.py  # Endpoint prédiction ML
│   │   └── ...
│   ├── ml_models/
│   │   ├── immo_ch_model.pkl       # Modèle XGBoost entraîné
│   │   ├── immo_ch_scaler.pkl      # Scaler StandardScaler
│   │   └── immo_ch_features.txt    # Liste des 18 features
│   ├── ml_training/
│   │   ├── train_immo_ch.py        # Script d'entraînement
│   │   ├── predict_price.py        # Inférence locale
│   │   └── scraping_immoscout/     # Scraper Playwright
│   └── rag_system/
│       ├── index_faiss.py          # Indexation FAISS
│       ├── query_rag.py            # Requêtes RAG
│       └── data/                   # Base documentaire
├── frontend/
│   ├── app/                        # Next.js App Router
│   ├── components/                 # Composants React
│   ├── lib/
│   │   └── api.ts                  # Client API TypeScript
│   └── public/
└── README.md
```

---

## Installation et lancement

### Prérequis
- **Python** 3.11+
- **Node.js** 24.11.1+ (LTS)
- **Ollama** : LLM local (https://ollama.ai)
- **Git**

### Installation Ollama (LLM local)

```bash
# Linux/macOS
curl -fsSL https://ollama.ai/install.sh | sh

# Windows
# Télécharger depuis https://ollama.ai/download

# Lancer Ollama
ollama serve

# Télécharger un modèle (ex: Llama 3)
ollama pull llama3
# ou Mistral
ollama pull mistral
```

### Backend (FastAPI)

```bash
cd backend

# Créer environnement virtuel
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Installer dépendances
pip install -r requirements.txt

# Lancer l'API (mode développement)
cd app
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# API accessible sur http://localhost:8000
# Documentation : http://localhost:8000/docs
```

### Frontend (Next.js)

```bash
cd frontend

# Installer dépendances
npm install

# Lancer le serveur de développement
npm run dev

# Application accessible sur http://localhost:3000
```

### Entraînement du modèle ML

```bash
cd backend/ml_training

# Scraper les données ImmoScout24 (optionnel)
python scraping_immoscout/immoscout_scraper.py

# Entraîner le modèle
python train_immo_ch.py

# Modèle sauvegardé dans backend/ml_models/
```

### Indexation FAISS (RAG)

```bash
cd backend/rag_system

# Indexer la base documentaire
python index_faiss.py

# Index FAISS sauvegardé dans backend/rag_system/data/
```

---

## API REST

### Démonstration

Exemple de prédiction pour un bureau de 150m² à Lausanne :

![API Prediction Demo](docs/images/exemple_pred_lausanne.png)

### Endpoint : Prédiction de loyer

**POST** `/api/v1/predict-rent`

```json
{
  "city": "Geneve",
  "surface": 150,
  "latitude": 46.2044,
  "longitude": 6.1432,
  "pieces": 4,
  "etage": 3,
  "has_parking": true,
  "has_lift": true,
  "property_type": "bureau"
}
```

**Réponse** :
```json
{
  "predicted_rent_chf": 4250.50,
  "predicted_rent_eur": 3910.46,
  "price_per_m2_chf": 28.34,
  "confidence_range": {
    "min_chf": 2825.50,
    "max_chf": 5675.50,
    "mae_chf": 1425
  },
  "city": "Geneve",
  "surface": 150,
  "model_info": {
    "model_type": "XGBoost Regressor",
    "r2_score": 0.763,
    "training_data": "ImmoScout24 Suisse",
    "last_updated": "2025-12"
  }
}
```

### Autres endpoints

- **GET** `/api/v1/model-info` - Informations sur le modèle ML
- **GET** `/api/v1/health` - Health check API ML
- **GET** `/health` - Health check global
- **GET** `/docs` - Documentation OpenAPI interactive

---

## Modèle Machine Learning

### Méthodologie
- **Algorithme** : XGBoost Regressor (tree-based ensemble)
- **Features** : 18 variables sans data leakage
- **Preprocessing** : StandardScaler sur features numériques
- **Validation** : Train/test split 80/20

### Features utilisées (18)
1. **Géolocalisation** : latitude, longitude, distance_centre
2. **Ville** : ville_encoded (Basel=0, Centre=1, Geneve=2, Lausanne=3, Zurich=4)
3. **Surface** : surface, surface_log, surface_squared
4. **Pièces** : pieces_filled, pieces_unknown
5. **Étage** : etage_filled, etage_unknown, is_ground_floor, is_high_floor
6. **Type** : type_bien_encoded (bureau=0, commercial=1)
7. **Équipements** : has_parking_int, has_lift_int
8. **Interactions** : surface_ville, surface_distance

### Performance
- **R² score** : 0.763 (76.3% variance expliquée)
- **MAE** : 1425 CHF (erreur absolue moyenne)
- **Dataset** : ~2000 annonces ImmoScout24 (bureaux et commerces)
- **Période** : Données récentes (2024-2025)

### Correction data leakage (2025-12)
Suppression des features dérivées du target (`prix_m2`) :
- ❌ `prix_m2_distance` (contenait `prix_m2 = price / surface`)
- ❌ `is_premium_area` (basé sur `prix_m2`)
- ✅ Remplacé par `surface_distance` (interaction légitime)

---

## Technologies clés

### Machine Learning
- **XGBoost** : Gradient boosting optimisé
- **scikit-learn** : Preprocessing, metrics, pipelines
- **pandas/numpy** : Manipulation de données

### RAG & LLM
- **FAISS** : Recherche vectorielle ultra-rapide (Facebook AI)
- **sentence-transformers** : Embeddings multilingues
- **Ollama** : LLM local pour interaction utilisateur (Llama 3, Mistral, Mixtral)
- **Anthropic Claude 3.5 Sonnet** : Recherches fiscales et tendances sectorielles (données anonymisées)

### Web Scraping
- **Extension navigateur personnalisée** : JavaScript pour ImmoScout24 (immo-scraper-extension)
- Extraction automatique des annonces immobilières

### Backend API
- **FastAPI** : Framework moderne Python (async, OpenAPI)
- **Pydantic** : Validation de données avec types Python
- **uvicorn** : Serveur ASGI haute performance

### Frontend
- **Next.js 14** : React framework avec App Router
- **TypeScript** : Typage statique JavaScript
- **Tailwind CSS** : Utility-first CSS framework
- **Framer Motion** : Animations React déclaratives
- **Recharts** : Graphiques React responsives

---

## Déploiement

### Backend (suggéré : Render.com / Railway)
```bash
# Fichier Procfile
web: cd backend/app && uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Frontend (suggéré : Vercel)
```bash
# Configuration automatique Next.js
vercel --prod
```

### Variables d'environnement
```bash
# Backend
ANTHROPIC_API_KEY=sk-ant-...          # Pour recherches fiscales uniquement
OLLAMA_HOST=http://localhost:11434    # LLM local
DATABASE_URL=postgresql://...

# Frontend
NEXT_PUBLIC_API_URL=https://api.swissrelocator.com
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

---

## Roadmap

- [x] Modèle ML prédiction loyers (XGBoost)
- [x] API REST FastAPI
- [x] Système RAG avec FAISS (architecture OK, documents à alimenter)
- [x] Frontend Next.js 14 (landing, simulateur fiscal + loyer, dashboard résultats, i18n FR/EN)
- [x] Module simulation fiscale détaillée (audité et corrigé : IS sur bénéfice, charges CH réalistes)
- [x] Système d'authentification Supabase (login, register, PKCE, SSR cookies)
- [ ] Dashboard utilisateur avec historique
- [ ] Export PDF des comparaisons
- [ ] Intégration paiement (Stripe)
- [ ] Mode SaaS avec abonnements

---

## Methodology — Source Verification Matrix

Les taux fiscaux implémentés dans SwissRelocator sont tracés jusqu'à leur source officielle et couverts par des tests automatisés.

Chaque valeur suit une trace d'audit en 3 colonnes :
**Source officielle** (organisme + référence exacte) → **Implémentation** (fichier + valeur) → **Test de validation** (cas automatisé)

→ [docs/fiscal_audit_trail.md](docs/fiscal_audit_trail.md)

---

## Auteur

**Florent VANHOLLEBEKE**
Chef de projet IA/Automatisation

- LinkedIn : [linkedin.com/in/florentvanhollebeke](https://linkedin.com/in/florentvanhollebeke)
- GitHub : [github.com/florentvanhollebeke](https://github.com/florentvanhollebeke)

---

## Licence

Copyright © 2026 Florent VANHOLLEBEKE. Tous droits réservés.

Ce projet est actuellement en développement privé. Aucune licence open-source n'est accordée pour l'instant.

---

## Support

Pour toute question ou suggestion :
- Ouvrir une issue GitHub
- Contacter l'auteur via LinkedIn

---

**Made with ❤️ in Switzerland & France**
