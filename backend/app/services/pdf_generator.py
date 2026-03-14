# ============================================
# SwissRelocator - Generateur de rapports PDF
# backend/app/services/pdf_generator.py
# Utilise fpdf2 (pure Python, pas de dependances systeme)
# Toutes les chaines sont en ASCII pur (compatibilite police Helvetica)
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


def _fmt(amount: float, currency: str) -> str:
    """Formate un montant avec separateur de milliers (ASCII pour compatibilite Helvetica)."""
    if currency == "CHF":
        return f"{amount:,.0f} CHF".replace(",", "'")
    return f"{amount:,.0f} EUR".replace(",", " ")


def _pct(rate: float) -> str:
    return f"{rate * 100:.1f}%"


# ============================================
# CLASSE PRINCIPALE
# ============================================

class PDFGenerator:
    """Genere des rapports PDF pour les simulations SwissRelocator."""

    def generate_fiscal_report(self, results: list[dict]) -> bytes:
        """
        Genere un rapport PDF de comparaison fiscale.

        Args:
            results: liste de dicts conformes au schema CompareFiscalResponse

        Returns:
            Contenu PDF en bytes
        """
        pdf = FPDF()
        pdf.set_auto_page_break(auto=True, margin=15)
        pdf.add_page()
        pdf.set_margins(20, 20, 20)

        self._add_header(pdf)
        self._add_summary_kpis(pdf, results)
        self._add_comparison_table(pdf, results)
        self._add_footer(pdf)

        return bytes(pdf.output())

    # ------------------------------------------
    # SECTIONS
    # ------------------------------------------

    def _add_header(self, pdf: FPDF) -> None:
        # Bande de titre
        pdf.set_fill_color(*BRAND_COLOR)
        pdf.rect(0, 0, 210, 28, style="F")

        pdf.set_y(8)
        pdf.set_font("Helvetica", "B", 18)
        pdf.set_text_color(255, 255, 255)
        pdf.cell(0, 10, "SwissRelocator", align="L")

        pdf.set_font("Helvetica", "", 10)
        pdf.set_text_color(220, 252, 231)
        pdf.cell(0, 6, "Rapport de comparaison fiscale France / Suisse",
                 new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="R")

        pdf.set_y(30)
        pdf.set_font("Helvetica", "", 8)
        pdf.set_text_color(*GRAY_COLOR)
        pdf.cell(0, 6, f"Genere le {datetime.now().strftime('%d/%m/%Y a %H:%M')}",
                 new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="R")
        pdf.ln(4)

    def _add_summary_kpis(self, pdf: FPDF, results: list[dict]) -> None:
        lyon = next((r for r in results if r.get("country") == "FR"), None)
        swiss = [r for r in results if r.get("country") == "CH"]
        if not lyon or not swiss:
            return

        best = max(swiss, key=lambda r: r["net_result"])
        savings = best["net_result"] * 1.064 - lyon["net_result"]

        pdf.set_font("Helvetica", "B", 12)
        pdf.set_text_color(*DARK_COLOR)
        pdf.cell(0, 8, "Resume executif", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.ln(2)

        box_w = 55
        box_h = 22
        gap = 5
        start_x = pdf.get_x()
        y = pdf.get_y()

        kpis = [
            ("Resultat net Lyon", _fmt(lyon["net_result"], lyon["currency"]), DARK_COLOR),
            (f"Resultat net {best['city']}", _fmt(best["net_result"], best["currency"]), BRAND_COLOR),
            ("Economie estimee", _fmt(abs(savings), "EUR"), BRAND_COLOR if savings > 0 else (220, 38, 38)),
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
        pdf.cell(0, 8, "Comparaison detaillee", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.ln(2)

        label_w = 40
        # Zone utile = 210mm - 2*20mm marges = 170mm
        col_w = (170 - label_w) // max(len(results), 1)
        row_h = 8
        cities = [r["city"] for r in results]
        currencies = [r["currency"] for r in results]

        pdf.set_fill_color(*BRAND_COLOR)
        pdf.set_text_color(255, 255, 255)
        pdf.set_font("Helvetica", "B", 8)
        pdf.cell(label_w, row_h, "", fill=True)
        for city, curr in zip(cities, currencies):
            pdf.cell(col_w, row_h, f"{city} ({curr})", fill=True, align="C")
        pdf.ln()

        rows = [
            ("IS (taux)", lambda r: _pct(r["corporate_tax_rate"])),
            ("IS (montant)", lambda r: _fmt(r["corporate_tax_amount"], r["currency"])),
            ("Charges patronales", lambda r: _fmt(r["employer_social_charges_amount"], r["currency"])),
            ("Cout total employeur", lambda r: _fmt(r["total_employer_cost"], r["currency"])),
            ("Resultat net", lambda r: _fmt(r["net_result"], r["currency"])),
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

    def _add_footer(self, pdf: FPDF) -> None:
        pdf.ln(10)
        pdf.set_draw_color(*BRAND_COLOR)
        pdf.line(20, pdf.get_y(), 190, pdf.get_y())
        pdf.ln(3)
        pdf.set_font("Helvetica", "", 7)
        pdf.set_text_color(*GRAY_COLOR)
        pdf.multi_cell(
            0, 4,
            "Rapport genere par SwissRelocator - Donnees indicatives uniquement. "
            "Les taux fiscaux peuvent evoluer. Consultez un expert-comptable pour toute decision.",
            align="C",
        )
