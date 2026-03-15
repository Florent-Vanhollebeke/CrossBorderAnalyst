# CrossBorder Analyst

**Cross-border fiscal & real estate intelligence for France-Switzerland implantation decisions**

A professional-grade analysis tool that combines ML-powered commercial rent prediction, multi-canton fiscal comparison, and RAG-based advisory to support cross-border implantation decisions between France and Switzerland.

---

## Key Features

- **Fiscal comparison engine** — Corporate tax, VAT, social charges across Lyon vs Geneva, Lausanne, Zurich, Basel
- **ML rent prediction** — XGBoost model trained on 1,200+ Swiss commercial listings (R² 0.86)
- **RAG fiscal advisor** — FAISS-indexed official tax documentation + Brave Search fallback for real-time queries
- **AI agents** — MarketScout (market analysis) + LegalWatchdog (legal requirements by country/canton)
- **PDF report generation** — Professional deliverable-ready output
- **Trilingual interface** — FR / EN / DE
- **Auth + security** — Supabase auth, rate limiting, PII detection, audit logging

---

## Tech Stack

**Next.js · FastAPI · XGBoost · FAISS · CrewAI · Supabase · Docker**

---

## Architecture

### Privacy by Design — RGPD / nLPD Compliant

CrossBorder Analyst adopts a **Privacy by Design** approach compliant with the EU GDPR and the Swiss nLPD (Federal Act on Data Protection):

```
┌─────────────────────────────────────────────────────────────┐
│  CLIENT DATA                                                │
│  ├─ Business parameters (revenue, headcount, canton)       │
│  └─ Preferences and session history                        │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │   LOCAL PROCESSING   │  🔒 Sensitive data stays local
        │   ├─ Input collect   │
        │   └─ Result display  │
        └──────────┬───────────┘
                   │
                   │ Anonymized fiscal params only
                   │ (revenue, canton, headcount)
                   ▼
        ┌──────────────────────┐
        │  CLAUDE API (Cloud)  │  ☁️ Fiscal research only
        │  └─ Fiscal & trends  │     (no PII transmitted)
        └──────────┬───────────┘
                   │
                   │ Aggregated fiscal result
                   ▼
        ┌──────────────────────┐
        │   RAG + FAISS        │  🔒 Official document retrieval
        │   └─ Advisory output │
        └──────────────────────┘
```

**Compliance:**
- RGPD (EU) — data minimisation, right to erasure, transparency
- nLPD (Switzerland) — enhanced personal data protection
- Privacy by Default — most protective settings out of the box
- Data Residency — full on-premise deployment option available

---

## Backend (Python / FastAPI)

- **Framework**: FastAPI 0.115+
- **ML**: XGBoost, scikit-learn, pandas, numpy
- **RAG**: FAISS (Facebook AI Similarity Search), sentence-transformers
- **LLM**: Claude API (Anthropic) for fiscal research and advisory (anonymized data only)
- **Search**: Brave Search API fallback for real-time fiscal queries
- **API**: REST with automatic OpenAPI documentation

## Frontend (TypeScript / Next.js)

- **Framework**: Next.js 14 (App Router)
- **UI**: Tailwind CSS, Lucide React
- **i18n**: next-intl (FR / EN / DE)
- **Auth**: Supabase (SSR + PKCE)
- **Charts**: Recharts

---

## ML Model — Rent Prediction

- **Algorithm**: XGBoost Regressor (tree-based ensemble)
- **Training data**: 1,200+ Swiss commercial listings (ImmoScout24)
- **R² score**: 0.86 (86% variance explained)
- **Features**: 18 variables — surface, location, equipment, property type (no data leakage)
- **Cities**: Geneva, Lausanne, Zurich, Basel
- **Validation**: Train/test split 80/20, StandardScaler preprocessing

---

## Project Structure

```
CrossBorderAnalyst/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI application
│   │   ├── predict_rent_router.py  # ML prediction endpoint
│   │   └── ...
│   ├── ml_models/
│   │   ├── immo_ch_model.pkl       # Trained XGBoost model
│   │   ├── immo_ch_scaler.pkl      # StandardScaler
│   │   └── immo_ch_features.txt    # 18 feature definitions
│   └── rag_system/
│       ├── index_faiss.py          # FAISS indexing
│       ├── query_rag.py            # RAG queries
│       └── data/                   # Official fiscal document base
├── frontend/
│   ├── app/                        # Next.js App Router
│   ├── components/                 # React components
│   ├── messages/                   # i18n translations (FR/EN/DE)
│   └── lib/
│       └── api.ts                  # TypeScript API client
└── README.md
```

---

## Installation

### Prerequisites

- Python 3.11+
- Node.js 20+ (LTS)
- Git

### Backend (FastAPI)

```bash
cd backend

python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

pip install -r requirements.txt

cd app
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
# API: http://localhost:8000
# Docs: http://localhost:8000/docs
```

### Frontend (Next.js)

```bash
cd frontend

npm install
npm run dev
# App: http://localhost:3000
```

---

## API — Key Endpoints

### Rent Prediction

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

**Response:**
```json
{
  "predicted_rent_chf": 4250.50,
  "predicted_rent_eur": 3910.46,
  "price_per_m2_chf": 28.34,
  "confidence_range": { "min_chf": 2825.50, "max_chf": 5675.50, "mae_chf": 1425 },
  "model_info": { "model_type": "XGBoost Regressor", "r2_score": 0.86 }
}
```

### Other Endpoints

- **POST** `/api/v1/compare-fiscal` — Multi-canton fiscal comparison
- **POST** `/api/v1/generate-pdf/combined` — PDF report generation
- **GET** `/api/v1/health` — Health check
- **GET** `/docs` — Interactive OpenAPI documentation

---

## Environment Variables

```bash
# Backend
ANTHROPIC_API_KEY=sk-ant-...
BRAVE_API_KEY=...
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...

# Frontend
NEXT_PUBLIC_API_URL=https://api.crossborderanalyst.ch
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

---

## Source Verification

All fiscal rates implemented in CrossBorder Analyst are traced to their official source and covered by automated tests.

→ [docs/fiscal_audit_trail.md](docs/fiscal_audit_trail.md)

---

## Author

**Florent VANHOLLEBEKE** — AI / Automation Project Lead

- LinkedIn: [linkedin.com/in/florentvanhollebeke](https://linkedin.com/in/florentvanhollebeke)
- GitHub: [github.com/florentvanhollebeke](https://github.com/florentvanhollebeke)
- Domain: [crossborderanalyst.ch](https://crossborderanalyst.ch)

---

## Licence

Copyright © 2026 Florent VANHOLLEBEKE. All rights reserved.

This project is currently in private development. No open-source licence is granted at this time.
