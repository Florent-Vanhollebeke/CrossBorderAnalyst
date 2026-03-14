# Fiscal Audit Trail — SwissRelocator

> **Objet :** Matrice de vérification des sources fiscales.
> Chaque taux implémenté dans le code est tracé jusqu'à sa source officielle et couvert par un test automatisé.
> Ce document constitue la "trace d'audit" au sens compliance du terme.

Dernière mise à jour : 2026-03

---

## Méthodologie

| Colonne | Contenu |
|---------|---------|
| **Source officielle** | Organisme, document, exercice fiscal |
| **Implémentation** | Fichier, valeur exacte dans le JSON/code |
| **Test de validation** | Fichier de test, cas qui vérifie la valeur |

---

## 1. France — Lyon

### 1.1 Impôt sur les Sociétés (IS)

| Source officielle | Implémentation | Test |
|---|---|---|
| DGFIP — Loi de finances 2024. IS taux normal : **25%**. Art. 219 CGI. | `fiscal_rates.json` → `Lyon.corporate_tax_rate = 0.25` | `test_fiscal_router.py` → `test_lyon_corporate_tax_25_percent` |

### 1.2 Charges patronales — France

| Cotisation | Source officielle | Taux | Implémentation | Test |
|---|---|---|---|---|
| Ensemble charges patronales (retraite, maladie, chômage, formation, prévoyance) | URSSAF — Tableau de bord cotisations 2025 | **~45%** (taux agrégé PME) | `fiscal_rates.json` → `Lyon.employer_social_charges_rate = 0.45` | `test_fiscal_router.py` → `test_lyon_employer_charges` |

### 1.3 Charges salariales — France

| Source officielle | Taux | Implémentation | Test |
|---|---|---|---|
| URSSAF — Cotisations salariales 2025 (maladie, retraite, chômage) | **~22%** (taux agrégé) | `fiscal_rates.json` → `Lyon.employee_social_charges_rate = 0.22` | `test_fiscal_router.py` → `test_lyon_employee_charges` |

---

## 2. Suisse — Cotisations fédérales communes (toutes villes CH)

> Ces taux sont identiques pour Genève, Lausanne, Zurich, Basel.
> Source : **OFAS (Office Fédéral des Assurances Sociales) — Taux de cotisation 2025**

| Cotisation | Taux total | Part employeur | Part salarié | Source |
|---|---|---|---|---|
| AVS (Assurance Vieillesse et Survivants) | 8.70% | **4.35%** | **4.35%** | OFAS — art. 8 LAVS |
| AI (Assurance Invalidité) | 1.40% | **0.70%** | **0.70%** | OFAS — art. 3 LAI |
| APG (Allocations pour perte de gain) | 0.50% | **0.25%** | **0.25%** | OFAS — ordonnance APG |
| AC (Assurance Chômage, jusqu'à CHF 148'200) | 2.20% | **1.10%** | **1.10%** | SECO — LACI art. 90a |
| LPP (Prévoyance professionnelle) | ~10% | **~5.00%** ⚠️ | **~5.00%** ⚠️ | LPP art. 16 — *approximation* (voir note) |
| LAA professionnelle (accidents pro) | ~0.50% | **0.50%** | — | LAA — tarif secteur tertiaire |
| LAA non-professionnelle (accidents non-pro) | ~1.30% | — | **1.30%** | LAA — tarif secteur tertiaire |

> ⚠️ **Note LPP :** Le taux LPP est une approximation pondérée (tranches d'âge 25-64 ans, salaire coordonné, répartition 50/50). Il varie selon : l'âge de l'assuré, le plan de prévoyance de l'entreprise, le salaire. La valeur de 5% est conservative et représentative d'une PME de services.

**Vérification interne :** `fiscal_rates.json` → chaque ville → `social_charges_breakdown._employer._total` et `._employee._total` doivent correspondre aux taux déclarés dans `employer_social_charges_rate` / `employee_social_charges_rate`.

---

## 3. Genève (GE)

### 3.1 IS effectif — Genève

| Composante | Taux | Source |
|---|---|---|
| IFD (Impôt Fédéral Direct) | ~8.50% | AFC fédérale — art. 68 LIFD |
| Impôt cantonal GE | ~5.50% (réduit) | AFC Genève — barème IS 2025 |
| **IS effectif total** | **~13.98%** | AFC Genève — simulateur fiscal entreprises |

| Implémentation | Test |
|---|---|
| `fiscal_rates.json` → `Geneve.corporate_tax_rate = 0.1398` | `test_fiscal_router.py` → `test_geneve_is_rate` |

### 3.2 Allocations familiales — GE

| Source | Taux | Implémentation |
|---|---|---|
| LGAF-GE — Art. 7 (CAF Genève) — 2025 | **2.45%** (à charge employeur) | `fiscal_rates.json` → `Geneve.social_charges_breakdown._employer.af_canton = 0.0245` |

### 3.3 Total charges — Genève

| | Taux total | Vérification |
|---|---|---|
| Charges patronales | **14.35%** | 4.35+0.70+0.25+1.10+5.00+0.50+2.45 = **14.35%** ✓ |
| Charges salariales | **12.70%** | 4.35+0.70+0.25+1.10+5.00+1.30 = **12.70%** ✓ |

---

## 4. Lausanne (VD)

### 4.1 IS effectif — Vaud

| Composante | Taux | Source |
|---|---|---|
| IFD | ~8.50% | AFC fédérale |
| Impôt cantonal VD | ~5.45% (réduit) | AFC Vaud — barème IS 2025 |
| **IS effectif total** | **~13.95%** | AFC Vaud — simulateur fiscal entreprises |

| Implémentation | Test |
|---|---|
| `fiscal_rates.json` → `Lausanne.corporate_tax_rate = 0.1395` | `test_fiscal_router.py` → `test_lausanne_is_rate` |

### 4.2 Allocations familiales — VD

| Source | Taux | Implémentation |
|---|---|---|
| LVLAFam VD — Art. 14 (CAF Vaud) — 2025 | **2.28%** | `fiscal_rates.json` → `Lausanne.social_charges_breakdown._employer.af_canton = 0.0228` |

### 4.3 Total charges — Lausanne

| | Taux total | Vérification |
|---|---|---|
| Charges patronales | **14.18%** | 4.35+0.70+0.25+1.10+5.00+0.50+2.28 = **14.18%** ✓ |
| Charges salariales | **12.70%** | 4.35+0.70+0.25+1.10+5.00+1.30 = **12.70%** ✓ |

---

## 5. Zurich (ZH)

### 5.1 IS effectif — Zurich

| Composante | Taux | Source |
|---|---|---|
| IFD | ~8.50% | AFC fédérale |
| Impôt cantonal ZH | ~3.46% (réduit) | Steueramt Zürich — barème IS 2025 |
| **IS effectif total** | **~11.96%** | Steueramt Zürich — simulateur fiscal |

> Zurich est le canton le plus attractif fiscalement des 4 couverts.

| Implémentation | Test |
|---|---|
| `fiscal_rates.json` → `Zurich.corporate_tax_rate = 0.1196` | `test_fiscal_router.py` → `test_zurich_is_rate` |

### 5.2 Allocations familiales — ZH

| Source | Taux | Implémentation |
|---|---|---|
| FamZG ZH — Kantonales Familienzulagengesetz — 2025 | **1.20%** | `fiscal_rates.json` → `Zurich.social_charges_breakdown._employer.af_canton = 0.0120` |

### 5.3 Total charges — Zurich

| | Taux total | Vérification |
|---|---|---|
| Charges patronales | **13.10%** | 4.35+0.70+0.25+1.10+5.00+0.50+1.20 = **13.10%** ✓ |
| Charges salariales | **12.70%** | 4.35+0.70+0.25+1.10+5.00+1.30 = **12.70%** ✓ |

---

## 6. Basel (BS)

### 6.1 IS effectif — Bâle-Ville

| Composante | Taux | Source |
|---|---|---|
| IFD | ~8.50% | AFC fédérale |
| Impôt cantonal BS | ~4.50% (réduit) | Steuerverwaltung Basel-Stadt — barème IS 2025 |
| **IS effectif total** | **~13.00%** | Steuerverwaltung Basel-Stadt |

| Implémentation | Test |
|---|---|
| `fiscal_rates.json` → `Basel.corporate_tax_rate = 0.13` | `test_fiscal_router.py` → `test_basel_is_rate` |

### 6.2 Allocations familiales — BS

| Source | Taux | Implémentation |
|---|---|---|
| Kantonales Familienzulagengesetz BS — 2025 | **1.30%** | `fiscal_rates.json` → `Basel.social_charges_breakdown._employer.af_canton = 0.0130` |

### 6.3 Total charges — Basel

| | Taux total | Vérification |
|---|---|---|
| Charges patronales | **13.20%** | 4.35+0.70+0.25+1.10+5.00+0.50+1.30 = **13.20%** ✓ |
| Charges salariales | **12.70%** | 4.35+0.70+0.25+1.10+5.00+1.30 = **12.70%** ✓ |

---

## 7. Taux de change EUR/CHF

| Paramètre | Valeur | Source | Implémentation |
|---|---|---|---|
| EUR → CHF | **0.94** | Cours de référence BNS (Banque Nationale Suisse) — moyenne 2025 | `salary_grids.json` → `exchange_rates.EUR_to_CHF = 0.94` |
| CHF → EUR | **1.064** | Inverse du taux BNS | `salary_grids.json` → `exchange_rates.CHF_to_EUR = 1.064` |

---

## 8. Récapitulatif comparatif

| Ville | Pays | IS effectif | Charges patronales | Charges salariales |
|---|---|---|---|---|
| Lyon | FR | **25.00%** | **45.00%** | **22.00%** |
| Genève | CH | **13.98%** | **14.35%** | **12.70%** |
| Lausanne | CH | **13.95%** | **14.18%** | **12.70%** |
| Basel | CH | **13.00%** | **13.20%** | **12.70%** |
| Zurich | CH | **11.96%** | **13.10%** | **12.70%** |

---

## 9. Limites et approximations déclarées

| Paramètre | Approximation | Impact |
|---|---|---|
| LPP | 5% par partie (fixe). Réel : 3.5% à 9% selon l'âge | Sous-estimation possible pour profils seniors |
| IS suisse | Taux effectif moyen (IFD + cantonal + communal). Réel : dépend du bénéfice imposable exact | Écart possible de ±0.5% |
| Charges patronales FR | 45% agrégé. Réel : varie selon secteur, taille, exonérations | Approximation haute — conservative |
| LAA | Tarif secteur tertiaire/bureaux. Réel : dépend du code NOGA de l'entreprise | Faible impact (<0.2%) |

---

*Document généré dans le cadre de la démarche "Privacy & Compliance by Design" de SwissRelocator.*
*Pour toute correction, ouvrir une issue avec la référence de source officielle mise à jour.*
