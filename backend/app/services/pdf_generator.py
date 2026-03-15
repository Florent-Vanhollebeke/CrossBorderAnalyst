# ============================================
# CrossBorder Analyst - Générateur de rapports PDF
# backend/app/services/pdf_generator.py
# Utilise fpdf2 (pure Python, pas de dépendances système)
# Helvetica core font — supporte Latin-1 / Windows-1252 (accents FR/DE/IT)
# ============================================

from datetime import datetime
from fpdf import FPDF
from fpdf.enums import XPos, YPos

# ============================================
# CONSTANTES
# ============================================

BRAND_COLOR = (16, 185, 129)   # emerald-500
DARK_COLOR  = (17,  24,  39)   # gray-900
GRAY_COLOR  = (107, 114, 128)  # gray-500
LIGHT_GRAY  = (249, 250, 251)  # gray-50
BLUE_COLOR  = (59, 130, 246)   # blue-500

CHF_TO_EUR  = 1.064

# Noms de villes en français
CITY_FR = {
    "Basel":    "Bâle",
    "Geneve":   "Genève",
    "Lausanne": "Lausanne",
    "Zurich":   "Zurich",
    "Lyon":     "Lyon",
}


def _city_fr(city: str) -> str:
    return CITY_FR.get(city, city)


def _fmt(amount: float, currency: str) -> str:
    """Formate un montant avec séparateur de milliers."""
    if currency == "CHF":
        return f"{amount:,.0f} CHF".replace(",", "'")
    return f"{amount:,.0f} EUR".replace(",", "\u202f")


def _pct(rate: float) -> str:
    return f"{rate * 100:.1f}%"


# ============================================
# CLASSE PRINCIPALE
# ============================================

class PDFGenerator:
    """Génère des rapports PDF pour les analyses CrossBorder Analyst."""

    # ------------------------------------------
    # RAPPORTS PUBLICS
    # ------------------------------------------

    def generate_fiscal_report(self, results: list[dict]) -> bytes:
        """Rapport PDF de comparaison fiscale seule."""
        pdf = FPDF()
        pdf.set_auto_page_break(auto=True, margin=15)
        pdf.add_page()
        pdf.set_margins(20, 20, 20)

        self._add_header(pdf, "Rapport de comparaison fiscale France / Suisse")
        self._add_summary_kpis(pdf, results)
        self._add_comparison_table(pdf, results)
        self._add_footer(pdf)

        return bytes(pdf.output())

    def generate_rent_report(self, rent: dict) -> bytes:
        """Rapport PDF d'estimation de loyer seul."""
        pdf = FPDF()
        pdf.set_auto_page_break(auto=True, margin=15)
        pdf.add_page()
        pdf.set_margins(20, 20, 20)

        self._add_header(pdf, "Rapport d'estimation de loyer commercial")
        self._add_rent_section(pdf, rent)
        self._add_footer(pdf)

        return bytes(pdf.output())

    def generate_combined_report(self, fiscal_results: list[dict], rent: dict, city_rents: dict | None = None) -> bytes:
        """Rapport PDF complet : fiscal + loyer + synthèse coût annuel total."""
        pdf = FPDF()
        pdf.set_auto_page_break(auto=True, margin=15)
        pdf.add_page()
        pdf.set_margins(20, 20, 20)

        self._add_header(pdf, "Analyse complète d'implantation France / Suisse")
        self._add_summary_kpis(pdf, fiscal_results)
        self._add_comparison_table(pdf, fiscal_results)
        pdf.ln(4)
        self._add_rent_section(pdf, rent)
        pdf.ln(4)
        self._add_total_cost_synthesis(pdf, fiscal_results, rent, city_rents or {})
        self._add_footer(pdf)

        return bytes(pdf.output())

    # ------------------------------------------
    # SECTIONS COMMUNES
    # ------------------------------------------

    def _add_header(self, pdf: FPDF, subtitle: str) -> None:
        pdf.set_fill_color(*BRAND_COLOR)
        pdf.rect(0, 0, 210, 28, style="F")

        pdf.set_y(8)
        pdf.set_font("Helvetica", "B", 18)
        pdf.set_text_color(255, 255, 255)
        pdf.cell(0, 10, "CrossBorder Analyst", align="L")

        pdf.set_font("Helvetica", "", 10)
        pdf.set_text_color(220, 252, 231)
        pdf.cell(0, 6, subtitle, new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="R")

        pdf.set_y(30)
        pdf.set_font("Helvetica", "", 8)
        pdf.set_text_color(*GRAY_COLOR)
        pdf.cell(0, 6, f"Généré le {datetime.now().strftime('%d/%m/%Y à %H:%M')}",
                 new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="R")
        pdf.ln(4)

    def _add_footer(self, pdf: FPDF) -> None:
        pdf.ln(10)
        pdf.set_draw_color(*BRAND_COLOR)
        pdf.line(20, pdf.get_y(), 190, pdf.get_y())
        pdf.ln(3)
        pdf.set_font("Helvetica", "", 7)
        pdf.set_text_color(*GRAY_COLOR)
        pdf.multi_cell(
            0, 4,
            "Rapport généré par CrossBorder Analyst. Données fournies à titre indicatif. "
            "Les législations et taux fiscaux étant sujets à évolution, ce document ne remplace pas "
            "l'avis d'une fiduciaire ou d'un conseiller fiscal qualifié.",
            align="C",
        )

    # ------------------------------------------
    # SECTION FISCALE
    # ------------------------------------------

    def _add_summary_kpis(self, pdf: FPDF, results: list[dict]) -> None:
        lyon = next((r for r in results if r.get("country") == "FR"), None)
        swiss = [r for r in results if r.get("country") == "CH"]
        if not lyon or not swiss:
            return

        best = max(swiss, key=lambda r: r["net_result"])
        savings = best["net_result"] * CHF_TO_EUR - lyon["net_result"]

        pdf.set_font("Helvetica", "B", 12)
        pdf.set_text_color(*DARK_COLOR)
        pdf.cell(0, 8, "Résumé exécutif", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.ln(2)

        box_w = 55
        box_h = 22
        gap = 5
        start_x = pdf.get_x()
        y = pdf.get_y()

        kpis = [
            ("Résultat net Lyon", _fmt(lyon["net_result"], lyon["currency"]), DARK_COLOR),
            (f"Résultat net {_city_fr(best['city'])}", _fmt(best["net_result"], best["currency"]), BRAND_COLOR),
            ("Économie estimée", _fmt(abs(savings), "EUR"), BRAND_COLOR if savings > 0 else (220, 38, 38)),
        ]

        for i, (label, value, color) in enumerate(kpis):
            x = start_x + i * (box_w + gap)
            pdf.set_xy(x, y)
            pdf.set_fill_color(248, 250, 252)
            pdf.rect(x, y, box_w, box_h, style="FD")

            pdf.set_xy(x + 3, y + 3)
            pdf.set_font("Helvetica", "", 7)
            pdf.set_text_color(*GRAY_COLOR)
            pdf.cell(box_w - 6, 5, label)

            pdf.set_xy(x + 3, y + 9)
            pdf.set_font("Helvetica", "B", 11)
            pdf.set_text_color(*color)
            pdf.cell(box_w - 6, 8, value)

        pdf.set_y(y + box_h + 8)

    def _add_comparison_table(self, pdf: FPDF, results: list[dict]) -> None:
        pdf.set_font("Helvetica", "B", 12)
        pdf.set_text_color(*DARK_COLOR)
        pdf.cell(0, 8, "Comparaison fiscale détaillée", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.ln(2)

        label_w = 40
        col_w = (170 - label_w) // max(len(results), 1)
        row_h = 8
        currencies = [r["currency"] for r in results]

        pdf.set_fill_color(*BRAND_COLOR)
        pdf.set_text_color(255, 255, 255)
        pdf.set_font("Helvetica", "B", 8)
        pdf.cell(label_w, row_h, "", fill=True)
        for r, curr in zip(results, currencies):
            pdf.cell(col_w, row_h, f"{_city_fr(r['city'])} ({curr})", fill=True, align="C")
        pdf.ln()

        rows = [
            ("IS (taux)", lambda r: _pct(r["corporate_tax_rate"])),
            ("IS (montant)", lambda r: _fmt(r["corporate_tax_amount"], r["currency"])),
            ("Charges patronales", lambda r: _fmt(r["employer_social_charges_amount"], r["currency"])),
            ("Coût total employeur", lambda r: _fmt(r["total_employer_cost"], r["currency"])),
            ("Résultat net", lambda r: _fmt(r["net_result"], r["currency"])),
        ]

        for idx, (label, getter) in enumerate(rows):
            fill = idx % 2 == 0
            pdf.set_fill_color(*LIGHT_GRAY) if fill else pdf.set_fill_color(255, 255, 255)
            pdf.set_text_color(*DARK_COLOR)

            is_last = idx == len(rows) - 1
            if is_last:
                pdf.set_font("Helvetica", "B", 8)
                pdf.set_text_color(*BRAND_COLOR)
            else:
                pdf.set_font("Helvetica", "", 8)

            pdf.cell(label_w, row_h, label, fill=True)
            for r in results:
                pdf.cell(col_w, row_h, getter(r), fill=True, align="R")
            pdf.ln()

    # ------------------------------------------
    # SECTION LOYER
    # ------------------------------------------

    def _add_rent_section(self, pdf: FPDF, rent: dict) -> None:
        pdf.set_font("Helvetica", "B", 12)
        pdf.set_text_color(*DARK_COLOR)
        pdf.cell(0, 8, "Estimation du loyer commercial", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.ln(2)

        # KPI principal
        box_w = 170
        box_h = 26
        y = pdf.get_y()
        x = pdf.get_x()

        pdf.set_fill_color(240, 253, 244)  # emerald-50
        pdf.rect(x, y, box_w, box_h, style="FD")

        pdf.set_xy(x + 6, y + 4)
        pdf.set_font("Helvetica", "", 8)
        pdf.set_text_color(*GRAY_COLOR)
        city = _city_fr(rent.get("city", ""))
        surface = rent.get("surface", "")
        prop_type = rent.get("property_type", "bureau")
        pdf.cell(0, 5, f"Loyer estimé — {city} — {surface} m² ({prop_type})")

        pdf.set_xy(x + 6, y + 11)
        pdf.set_font("Helvetica", "B", 16)
        pdf.set_text_color(*BRAND_COLOR)
        chf = rent.get("predicted_rent_chf", 0)
        eur = rent.get("predicted_rent_eur", 0)
        pdf.cell(80, 10, f"{chf:,.0f} CHF/mois".replace(",", "'"))

        pdf.set_xy(x + 90, y + 14)
        pdf.set_font("Helvetica", "", 10)
        pdf.set_text_color(*GRAY_COLOR)
        pdf.cell(0, 6, f"~ {eur:,.0f} EUR/mois".replace(",", "\u202f"))

        pdf.set_y(y + box_h + 6)

        # Grille détails
        row_h = 7
        col1 = 85
        col2 = 85

        details = [
            ("Prix au m²", f"{rent.get('price_per_m2_chf', 0):.1f} CHF/m²"),
            ("Loyer annuel", f"{chf * 12:,.0f} CHF/an".replace(",", "'")),
        ]
        conf = rent.get("confidence_range", {})
        if conf:
            details.append(("Fourchette basse", f"{conf.get('min_chf', 0):,.0f} CHF/mois".replace(",", "'")))
            details.append(("Fourchette haute", f"{conf.get('max_chf', 0):,.0f} CHF/mois".replace(",", "'")))

        for i, (label, value) in enumerate(details):
            fill = i % 2 == 0
            pdf.set_fill_color(*LIGHT_GRAY) if fill else pdf.set_fill_color(255, 255, 255)
            pdf.set_font("Helvetica", "", 8)
            pdf.set_text_color(*GRAY_COLOR)
            pdf.cell(col1, row_h, label, fill=True)
            pdf.set_font("Helvetica", "B", 8)
            pdf.set_text_color(*DARK_COLOR)
            pdf.cell(col2, row_h, value, fill=True, align="R", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        # Modèle info
        model = rent.get("model_info", {})
        if model:
            pdf.ln(3)
            pdf.set_font("Helvetica", "", 7)
            pdf.set_text_color(*GRAY_COLOR)
            r2 = model.get("r2_score", 0)
            mtype = model.get("model_type", "")
            data = model.get("training_data", "")
            pdf.cell(0, 5, f"Modèle : {mtype} | R²={r2:.3f} | Données : {data}",
                     new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    # ------------------------------------------
    # SECTION SYNTHÈSE COÛT TOTAL (rapport combiné)
    # ------------------------------------------

    def _add_total_cost_synthesis(self, pdf: FPDF, fiscal_results: list[dict], rent: dict, city_rents: dict) -> None:
        """Synthèse : coût total annuel = loyer annuel + coût employeur, par ville."""
        pdf.set_font("Helvetica", "B", 12)
        pdf.set_text_color(*DARK_COLOR)
        pdf.cell(0, 8, "Synthèse : Coût total annuel d'implantation", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.ln(1)
        pdf.set_font("Helvetica", "", 8)
        pdf.set_text_color(*GRAY_COLOR)
        pdf.cell(0, 5, "(Coût employeur annuel + loyer annuel estimé par ville)",
                 new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.ln(3)

        # Loyer de référence (ville simulée) — fallback si city_rents absent
        fallback_chf = rent.get("predicted_rent_chf", 0)
        fallback_eur = rent.get("predicted_rent_eur", 0)
        rent_chf_annual = fallback_chf * 12
        rent_eur_annual = fallback_eur * 12

        label_w = 55
        col_w = (170 - label_w) // max(len(fiscal_results), 1)
        row_h = 8

        # Header
        pdf.set_fill_color(*DARK_COLOR)
        pdf.set_text_color(255, 255, 255)
        pdf.set_font("Helvetica", "B", 8)
        pdf.cell(label_w, row_h, "Poste", fill=True)
        for r in fiscal_results:
            pdf.cell(col_w, row_h, _city_fr(r["city"]), fill=True, align="C")
        pdf.ln()

        def _city_rent_annual(r: dict) -> float:
            """Loyer annuel pour une ville : city_rents si dispo, sinon fallback."""
            city = r.get("city", "")
            if r["currency"] == "CHF":
                return city_rents.get(city, fallback_chf) * 12
            else:
                # Lyon (EUR) : pas de modèle suisse → fallback converti
                return rent_eur_annual

        # Loyer annuel row
        pdf.set_fill_color(*LIGHT_GRAY)
        pdf.set_text_color(*DARK_COLOR)
        pdf.set_font("Helvetica", "", 8)
        pdf.cell(label_w, row_h, "Loyer annuel", fill=True)
        for r in fiscal_results:
            pdf.cell(col_w, row_h, _fmt(_city_rent_annual(r), r["currency"]), fill=True, align="R")
        pdf.ln()

        # Coût employeur row
        pdf.set_fill_color(255, 255, 255)
        pdf.cell(label_w, row_h, "Coût total employeur", fill=True)
        for r in fiscal_results:
            pdf.cell(col_w, row_h, _fmt(r["total_employer_cost"], r["currency"]), fill=True, align="R")
        pdf.ln()

        # Total row
        pdf.set_fill_color(240, 253, 244)
        pdf.set_font("Helvetica", "B", 8)
        pdf.set_text_color(*BRAND_COLOR)
        pdf.cell(label_w, row_h, "Total charges annuelles", fill=True)
        for r in fiscal_results:
            total = r["total_employer_cost"] + _city_rent_annual(r)
            pdf.cell(col_w, row_h, _fmt(total, r["currency"]), fill=True, align="R")
        pdf.ln()

        # Résultat net après loyer row
        pdf.set_fill_color(16, 185, 129)
        pdf.set_text_color(255, 255, 255)
        pdf.cell(label_w, row_h, "Résultat net après loyer", fill=True)
        for r in fiscal_results:
            net_after_rent = r["net_result"] - _city_rent_annual(r)
            pdf.cell(col_w, row_h, _fmt(net_after_rent, r["currency"]), fill=True, align="R")
        pdf.ln()
