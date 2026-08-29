import os
import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_merchant_pdf_report(merchant_data: dict, ml_output: dict) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0F172A'),
        fontName='Helvetica-Bold'
    )

    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#64748B')
    )

    h2_style = ParagraphStyle(
        'Heading2Custom',
        parent=styles['Heading2'],
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#1E293B'),
        fontName='Helvetica-Bold',
        spaceBefore=8,
        spaceAfter=4
    )

    body_style = ParagraphStyle(
        'BodyCustom',
        parent=styles['Normal'],
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#334155')
    )

    elements = []

    # Header
    elements.append(Paragraph("FINTRUST AI — FINANCIAL STRESS ASSESSMENT REPORT", subtitle_style))
    elements.append(Paragraph(f"Merchant Risk Audit: {merchant_data.get('name', 'Merchant')}", title_style))
    elements.append(Paragraph(f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')} | Reference ID: {merchant_data.get('id')}", subtitle_style))
    elements.append(Spacer(1, 10))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#CBD5E1'), spaceBefore=0, spaceAfter=12))

    # Profile Summary Table
    risk_band = ml_output.get("risk_band", "Low Risk")
    band_color = "#EF4444" if risk_band == "Critical" else ("#F59E0B" if risk_band == "Watchlist" else "#10B981")

    meta_data = [
        [
            Paragraph(f"<b>Merchant ID:</b> {merchant_data.get('id')}", body_style),
            Paragraph(f"<b>Sector:</b> {merchant_data.get('sector')}", body_style),
            Paragraph(f"<b>Region:</b> {merchant_data.get('region')}", body_style)
        ],
        [
            Paragraph(f"<b>Credit Limit:</b> ${merchant_data.get('base_credit_limit', 0):,.2f}", body_style),
            Paragraph(f"<b>Risk Score:</b> <font color='{band_color}'><b>{ml_output.get('risk_score')}/100</b></font>", body_style),
            Paragraph(f"<b>Risk Band:</b> <font color='{band_color}'><b>{risk_band}</b></font>", body_style)
        ]
    ]

    t_meta = Table(meta_data, colWidths=[180, 180, 180])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE')
    ]))
    elements.append(t_meta)
    elements.append(Spacer(1, 12))

    # Diagnostics Summary
    elements.append(Paragraph("System Diagnostic Flags", h2_style))
    anom = "FLAGGED (Unusual behavioral deviation)" if ml_output.get("anomaly_flag") else "Normal (Within baseline)"
    det = "FLAGGED (30-day slope decline)" if ml_output.get("deterioration_flag") else "Stable"

    diag_data = [
        [Paragraph("<b>Isolation Forest Anomaly:</b>", body_style), Paragraph(anom, body_style)],
        [Paragraph("<b>Time-Series Deterioration:</b>", body_style), Paragraph(det, body_style)]
    ]

    if ml_output.get("deterioration_reasons"):
        reasons_str = "<br/>".join([f"• {r}" for r in ml_output.get("deterioration_reasons")])
        diag_data.append([Paragraph("<b>Deterioration Signals:</b>", body_style), Paragraph(reasons_str, body_style)])

    t_diag = Table(diag_data, colWidths=[160, 380])
    t_diag.setStyle(TableStyle([
        ('PADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP')
    ]))
    elements.append(t_diag)
    elements.append(Spacer(1, 12))

    # SHAP Top Risk Drivers Table
    elements.append(Paragraph("SHAP Model Risk Drivers (Explainability Attribution)", h2_style))

    drivers_data = [["Risk Factor / Metric", "Current Value", "SHAP Impact Score", "Direction"]]
    for d in ml_output.get("top_drivers", []):
        drivers_data.append([
            d.get("label", ""),
            str(d.get("value", "")),
            f"{d.get('shap_impact', 0):+.3f}",
            d.get("risk_direction", "")
        ])

    t_drivers = Table(drivers_data, colWidths=[200, 100, 110, 130])
    t_drivers.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F172A')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('ALIGN', (2, 1), (2, -1), 'CENTER')
    ]))
    elements.append(t_drivers)
    elements.append(Spacer(1, 14))

    # Recommendation Box
    elements.append(Paragraph("Recommended Credit Policy Action", h2_style))
    if risk_band == "Critical":
        rec_text = "<b>CRITICAL ACTION REQUIRED:</b> Reduce credit exposure by 25%. Restructure repayment terms to weekly or daily automatic settlement. Freeze any credit limit increases until refund rate drops below 4% and reserve balance recovers."
    elif risk_band == "Watchlist":
        rec_text = "<b>WATCHLIST MONITORING:</b> Require bi-weekly financial reconciliation. Maintain existing credit limit but flag for early warning review."
    else:
        rec_text = "<b>MAINTAIN STANDARD CREDIT:</b> Merchant exhibits healthy repayment signals. Eligible for standard credit line renewal."

    rec_table = Table([[Paragraph(rec_text, body_style)]], colWidths=[540])
    rec_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, 0), colors.HexColor('#F1F5F9')),
        ('PADDING', (0, 0), (0, 0), 10),
        ('BOX', (0, 0), (0, 0), 1, colors.HexColor('#94A3B8'))
    ]))
    elements.append(rec_table)

    # Footer
    elements.append(Spacer(1, 20))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#CBD5E1'), spaceBefore=0, spaceAfter=8))
    elements.append(Paragraph("FinTrust AI Risk Radar • Confidential Commercial Credit Document • Strictly Grounded Inference Model", subtitle_style))

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()
