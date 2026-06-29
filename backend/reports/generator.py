import os
import time
import json
import uuid
import numpy as np
from groq import Groq
from dotenv import load_dotenv
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, KeepTogether
)
from reportlab.pdfgen import canvas as pdfcanvas
from reportlab.platypus import BaseDocTemplate, Frame, PageTemplate

from backend.models.training import get_run

load_dotenv()
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

REPORTS_DIR = "backend/reports/storage"
REPORTS_METADATA = "backend/reports/metadata.json"

# ── Color Palette ──────────────────────────────────────────────
PRIMARY     = colors.HexColor("#1e1b4b")   # deep indigo
ACCENT      = colors.HexColor("#7c3aed")   # purple
ACCENT2     = colors.HexColor("#0ea5e9")   # sky blue
SUCCESS     = colors.HexColor("#059669")   # emerald
WARNING     = colors.HexColor("#d97706")   # amber
LIGHT_BG    = colors.HexColor("#f8f7ff")   # near-white purple tint
BORDER      = colors.HexColor("#e2e0ff")   # light purple border
TEXT_MAIN   = colors.HexColor("#1e1b4b")   # primary text
TEXT_MUTED  = colors.HexColor("#6b7280")   # secondary text
WHITE       = colors.white


REPORT_PROMPT = """You are a senior machine learning researcher writing a formal academic research report.

Based on the experiment data below, write a comprehensive, publication-quality report.
Be analytical, specific with numbers, and use precise ML terminology.
Do not invent data — only use what is provided.

EXPERIMENT DATA:
{run_data}

Write the report in this EXACT structure (use these exact section titles in ALL CAPS):

ABSTRACT
Write 3-4 sentences summarizing the research objective, methodology, key findings, and main conclusion.

RESEARCH OBJECTIVE
Explain what problem this experiment is solving. What is the research question? Why does it matter in the context of machine learning?

DATASET ANALYSIS
Describe the dataset(s) used: size, feature count, target variable, class distribution if classification, and why this dataset is suitable for the task.

METHODOLOGY
Detail the experimental setup: which models were selected and why, what hyperparameters were used, how the data was split (train/test), and what evaluation strategy was applied (cross-validation if used).

EXPERIMENTAL RESULTS
Present all results analytically. Compare models across all metrics with specific numbers. Identify patterns — which model excels at precision vs recall, which trades interpretability for accuracy, etc.

STATISTICAL ANALYSIS
Analyze the significance of the results. Discuss variance, overfitting risk, generalization, and what the metrics tell us about model behavior on this specific dataset.

BEST MODEL JUSTIFICATION
Make a clear, evidence-based argument for the recommended model. Acknowledge tradeoffs honestly. Discuss when an alternative model might be preferred.

LIMITATIONS AND FUTURE WORK
Identify at least 3 limitations of this experiment (data size, feature engineering, hyperparameter search, class imbalance, etc.) and propose concrete next steps to improve results.

CONCLUSION
Summarize the key takeaway. What did this experiment prove or disprove? What is the practical implication?
"""


def _load_reports_metadata():
    if not os.path.exists(REPORTS_METADATA):
        return {}
    with open(REPORTS_METADATA, "r") as f:
        return json.load(f)


def _save_reports_metadata(data):
    os.makedirs(os.path.dirname(REPORTS_METADATA), exist_ok=True)
    with open(REPORTS_METADATA, "w") as f:
        json.dump(data, f, indent=2, default=str)


def _format_run_data(runs: list) -> str:
    lines = []
    for i, run in enumerate(runs, 1):
        lines.append(f"\n{'='*50}")
        lines.append(f"EXPERIMENT {i}: {run['model_name']}")
        lines.append(f"{'='*50}")
        lines.append(f"Task Type: {run['task_type']}")
        lines.append(f"Dataset: {run['dataset_id']}")
        lines.append(f"Samples: {run['n_samples']} | Features: {run['n_features']}")
        if run.get('target_column'):
            lines.append(f"Target Variable: {run['target_column']}")
        if run.get('hyperparams'):
            lines.append(f"Hyperparameters: {json.dumps(run['hyperparams'], indent=2)}")
        lines.append(f"Performance Metrics:")
        for k, v in run.get('metrics', {}).items():
            lines.append(f"  - {k}: {v}")
        if run.get('cv_folds'):
            lines.append(f"Cross-Validation: {run['cv_folds']}-fold")
        if run.get('feature_selection'):
            lines.append(f"Feature Selection: Top {run['feature_selection']} features")
        lines.append(f"Training Duration: {run.get('duration_seconds', 'N/A')}s")
        if run.get('artifacts', {}).get('feature_importance'):
            fi = run['artifacts']['feature_importance']
            top3 = list(fi.items())[:3]
            lines.append(f"Top Features: {', '.join([f'{k}({v:.3f})' for k,v in top3])}")
    return "\n".join(lines)


def _get_best_run(runs: list) -> dict:
    if not runs:
        return None
    task = runs[0].get('task_type', 'classification')
    key = 'accuracy' if task == 'classification' else 'r2_score' if task == 'regression' else 'silhouette_score'
    return max(runs, key=lambda r: r.get('metrics', {}).get(key, 0))


def generate_report_text(run_ids: list) -> dict:
    runs = []
    for rid in run_ids:
        run = get_run(rid)
        if run:
            runs.append(run)

    if not runs:
        raise ValueError("No valid runs found for the given IDs")

    run_data_text = _format_run_data(runs)

    completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        max_tokens=3000,
        messages=[{"role": "user", "content": REPORT_PROMPT.format(run_data=run_data_text)}]
    )
    report_text = completion.choices[0].message.content.strip()

    return {"report_text": report_text, "runs": runs}


def _make_styles():
    styles = getSampleStyleSheet()

    new_styles = [
        ParagraphStyle("RTitle", parent=styles["Normal"], fontSize=26, leading=32,
            textColor=PRIMARY, fontName="Helvetica-Bold", alignment=TA_LEFT, spaceAfter=6),
        ParagraphStyle("RSubtitle", parent=styles["Normal"], fontSize=11,
            textColor=TEXT_MUTED, fontName="Helvetica", alignment=TA_LEFT, spaceAfter=4),
        ParagraphStyle("RMeta", parent=styles["Normal"], fontSize=9,
            textColor=TEXT_MUTED, fontName="Helvetica", spaceAfter=2),
        ParagraphStyle("RSectionHeader", parent=styles["Normal"], fontSize=13, leading=18,
            textColor=WHITE, fontName="Helvetica-Bold"),
        ParagraphStyle("RSubHeader", parent=styles["Normal"], fontSize=11, leading=14,
            textColor=ACCENT, fontName="Helvetica-Bold", spaceBefore=12, spaceAfter=6),
        ParagraphStyle("RBody", parent=styles["Normal"], fontSize=10, leading=16,
            textColor=TEXT_MAIN, fontName="Helvetica", spaceAfter=8, alignment=TA_JUSTIFY),
        ParagraphStyle("RAbstract", parent=styles["Normal"], fontSize=10, leading=16,
            textColor=TEXT_MAIN, fontName="Helvetica-Oblique", spaceAfter=8,
            alignment=TA_JUSTIFY, leftIndent=12, rightIndent=12),
        ParagraphStyle("RTableHeader", parent=styles["Normal"], fontSize=9,
            textColor=WHITE, fontName="Helvetica-Bold", alignment=TA_CENTER),
        ParagraphStyle("RTableCell", parent=styles["Normal"], fontSize=9,
            textColor=TEXT_MAIN, fontName="Helvetica", alignment=TA_CENTER),
        ParagraphStyle("RCaption", parent=styles["Normal"], fontSize=8,
            textColor=TEXT_MUTED, fontName="Helvetica-Oblique",
            alignment=TA_CENTER, spaceAfter=12, spaceBefore=4),
        ParagraphStyle("RBullet", parent=styles["Normal"], fontSize=10, leading=15,
            textColor=TEXT_MAIN, fontName="Helvetica", spaceAfter=4,
            leftIndent=16, bulletIndent=0),
        ParagraphStyle("RFooter", parent=styles["Normal"], fontSize=8,
            textColor=TEXT_MUTED, fontName="Helvetica", alignment=TA_CENTER),
    ]

    for s in new_styles:
        try:
            styles.add(s)
        except Exception:
            pass

    return styles

def _section_block(title: str, styles) -> list:
    """Returns a colored section header block."""
    header_table = Table(
        [[Paragraph(title, styles["RSectionHeader"])]],
        colWidths=[6.5 * inch]
    )
    header_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), ACCENT),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("ROUNDEDCORNERS", [4, 4, 4, 4]),
    ]))
    return [Spacer(1, 14), header_table, Spacer(1, 8)]


def _parse_sections(report_text: str, styles) -> list:
    """Parse AI-generated text into formatted PDF elements."""
    elements = []

    SECTION_TITLES = [
        "ABSTRACT", "RESEARCH OBJECTIVE", "DATASET ANALYSIS",
        "METHODOLOGY", "EXPERIMENTAL RESULTS", "STATISTICAL ANALYSIS",
        "BEST MODEL JUSTIFICATION", "LIMITATIONS AND FUTURE WORK", "CONCLUSION"
    ]

    paragraphs = report_text.split("\n\n")
    current_section = None
    is_abstract = False

    for block in paragraphs:
        block = block.strip()
        if not block:
            continue

        lines = block.split("\n")
        first_line = lines[0].strip()

        # Check if this is a section header
        matched_section = None
        for title in SECTION_TITLES:
            if first_line.upper() == title or first_line.upper().startswith(title):
                matched_section = title
                break

        if matched_section:
            current_section = matched_section
            is_abstract = matched_section == "ABSTRACT"
            elements.extend(_section_block(matched_section, styles))

            # Remaining lines after the header
            remaining = "\n".join(lines[1:]).strip()
            if remaining:
                style = styles["RAbstract"] if is_abstract else styles["RBody"]
                elements.append(Paragraph(remaining.replace("\n", " "), style))
        else:
            # Body content
            style = styles["RAbstract"] if is_abstract else styles["RBody"]

            # Detect bullet points
            if block.startswith("- ") or block.startswith("* ") or block.startswith("• "):
                for line in lines:
                    line = line.strip().lstrip("-*• ").strip()
                    if line:
                        elements.append(Paragraph(f"• {line}", styles["RBullet"]))
            else:
                elements.append(Paragraph(block.replace("\n", " "), style))

    return elements


def _build_metrics_table(runs: list, styles) -> list:
    """Build a comprehensive metrics comparison table."""
    elements = []
    elements.extend(_section_block("PERFORMANCE METRICS SUMMARY", styles))

    if not runs:
        return elements

    # Collect all metric keys
    all_keys = set()
    for run in runs:
        all_keys.update(run.get('metrics', {}).keys())
    metric_keys = sorted(all_keys)

    # Header row
    header = ["Model", "Dataset", "Task"] + [k.replace("_", " ").title() for k in metric_keys] + ["Time (s)"]
    table_data = [header]

    best_run = _get_best_run(runs)

    for run in runs:
        row = [
            run.get('model_name', '-'),
            run.get('dataset_id', '-'),
            run.get('task_type', '-').title(),
        ]
        for k in metric_keys:
            val = run.get('metrics', {}).get(k, '-')
            row.append(f"{val:.4f}" if isinstance(val, float) else str(val))
        row.append(str(run.get('duration_seconds', '-')))
        table_data.append(row)

    col_count = len(header)
    col_widths = [1.4*inch, 1.0*inch, 0.9*inch] + [0.85*inch] * len(metric_keys) + [0.6*inch]
    # Clamp total width
    total = sum(col_widths)
    max_w = 6.5 * inch
    if total > max_w:
        scale = max_w / total
        col_widths = [w * scale for w in col_widths]

    table = Table(table_data, colWidths=col_widths, repeatRows=1)

    row_styles = [
        ("BACKGROUND", (0, 0), (-1, 0), ACCENT),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
    ]

    # Highlight best run
    for i, run in enumerate(runs, 1):
        if run == best_run:
            row_styles.append(("BACKGROUND", (0, i), (-1, i), colors.HexColor("#f0fdf4")))
            row_styles.append(("TEXTCOLOR", (0, i), (0, i), SUCCESS))
            row_styles.append(("FONTNAME", (0, i), (0, i), "Helvetica-Bold"))

    table.setStyle(TableStyle(row_styles))
    elements.append(table)
    elements.append(Paragraph(
        "Table 1: Comprehensive performance metrics for all experiments. Highlighted row indicates best-performing model.",
        styles["RCaption"]
    ))
    return elements


def _build_experiment_cards(runs: list, styles) -> list:
    """Build individual experiment detail cards."""
    elements = []
    elements.extend(_section_block("EXPERIMENT CONFIGURATIONS", styles))

    for i, run in enumerate(runs, 1):
        # Card header
        card_header = Table(
            [[Paragraph(f"Experiment {i}: {run.get('model_name', 'Unknown')}", styles["RSubHeader"])]],
            colWidths=[6.5 * inch]
        )
        card_header.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BG),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ("LINEBELOW", (0, 0), (-1, -1), 1, BORDER),
        ]))

        config_rows = [
            ["Dataset", run.get('dataset_id', '-'), "Task Type", run.get('task_type', '-').title()],
            ["Samples", str(run.get('n_samples', '-')), "Features", str(run.get('n_features', '-'))],
            ["Target Column", str(run.get('target_column', 'N/A')), "Training Time", f"{run.get('duration_seconds', '-')}s"],
        ]
        if run.get('cv_folds'):
            config_rows.append(["Cross-Validation", f"{run['cv_folds']}-fold CV", "Feature Selection", str(run.get('feature_selection', 'All features'))])
        if run.get('hyperparams'):
            for k, v in list(run['hyperparams'].items())[:4]:
                config_rows.append([k.replace("_", " ").title(), str(v), "", ""])

        config_table = Table(
            config_rows,
            colWidths=[1.5*inch, 1.75*inch, 1.5*inch, 1.75*inch]
        )
        config_table.setStyle(TableStyle([
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("TEXTCOLOR", (0, 0), (0, -1), ACCENT),
            ("TEXTCOLOR", (2, 0), (2, -1), ACCENT),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("ROWBACKGROUNDS", (0, 0), (-1, -1), [WHITE, LIGHT_BG]),
            ("GRID", (0, 0), (-1, -1), 0.3, BORDER),
        ]))

        # Feature importance mini-table
        fi_elements = []
        fi = run.get('artifacts', {}).get('feature_importance', {})
        if fi:
            fi_header = Paragraph("Top Feature Importances", styles["RSubHeader"])
            fi_rows = [["Feature", "Importance", "Relative Weight"]]
            top_fi = list(fi.items())[:6]
            max_imp = top_fi[0][1] if top_fi else 1
            for feat, imp in top_fi:
                bar_len = int((imp / max_imp) * 20)
                bar = "█" * bar_len + "░" * (20 - bar_len)
                fi_rows.append([feat, f"{imp:.4f}", bar])

            fi_table = Table(fi_rows, colWidths=[2.0*inch, 1.0*inch, 3.5*inch])
            fi_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), ACCENT2),
                ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("FONTNAME", (2, 1), (2, -1), "Courier"),
                ("TEXTCOLOR", (2, 1), (2, -1), SUCCESS),
                ("ALIGN", (1, 0), (1, -1), "CENTER"),
                ("GRID", (0, 0), (-1, -1), 0.3, BORDER),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ]))
            fi_elements = [Spacer(1, 6), fi_header, fi_table,
                          Paragraph("Table: Feature importance scores (higher = more influential)", styles["RCaption"])]

        elements.append(KeepTogether([
            card_header,
            Spacer(1, 4),
            config_table,
            *fi_elements,
            Spacer(1, 12),
        ]))

    return elements


def _build_cover_page(runs: list, report_id: str, styles) -> list:
    """Build a professional cover page."""
    elements = []

    # Top accent bar
    top_bar = Table([[""]], colWidths=[6.5*inch], rowHeights=[8])
    top_bar.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), ACCENT),
    ]))
    elements.append(top_bar)
    elements.append(Spacer(1, 0.6*inch))

    # Logo text
    elements.append(Paragraph("REPOS AI", ParagraphStyle(
        "Logo", fontName="Helvetica-Bold", fontSize=11,
        textColor=ACCENT, spaceAfter=4
    )))
    elements.append(Paragraph("Research Platform", ParagraphStyle(
        "LogoSub", fontName="Helvetica", fontSize=9,
        textColor=TEXT_MUTED, spaceAfter=40
    )))

    # Title
    elements.append(Paragraph(
        "Machine Learning Experiment Report",
        ParagraphStyle("CoverTitle", fontName="Helvetica-Bold", fontSize=28,
                      textColor=PRIMARY, leading=34, spaceAfter=12)
    ))

    # Subtitle line
    task_type = runs[0].get('task_type', 'experiment').title() if runs else "Experiment"
    dataset = runs[0].get('dataset_id', 'Unknown') if runs else "Unknown"
    models_list = ", ".join(set(r.get('model_name', '') for r in runs))

    elements.append(HRFlowable(width="100%", thickness=2, color=ACCENT, spaceAfter=16))

    # Meta info table
    meta_rows = [
        ["Dataset", dataset],
        ["Task Type", task_type],
        ["Models Evaluated", models_list],
        ["Experiments", str(len(runs))],
        ["Report Date", time.strftime("%B %d, %Y")],
        ["Report ID", report_id[:8].upper()],
        ["Generated By", "Repos AI Research Platform"],
        ["Author", "Karthika S"],
    ]

    meta_table = Table(meta_rows, colWidths=[1.8*inch, 4.7*inch])
    meta_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("TEXTCOLOR", (0, 0), (0, -1), ACCENT),
        ("TEXTCOLOR", (1, 0), (1, -1), TEXT_MAIN),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("LINEBELOW", (0, -1), (-1, -1), 0.5, BORDER),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [WHITE, LIGHT_BG]),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 0.4*inch))

    # Best model highlight box
    best = _get_best_run(runs)
    if best:
        task = best.get('task_type', 'classification')
        pk = 'accuracy' if task == 'classification' else 'r2_score' if task == 'regression' else 'silhouette_score'
        best_val = best.get('metrics', {}).get(pk, 'N/A')
        highlight_data = [[
            Paragraph("Best Performing Model", ParagraphStyle("BHL", fontName="Helvetica-Bold", fontSize=9, textColor=TEXT_MUTED)),
            Paragraph(best.get('model_name', '-'), ParagraphStyle("BHV", fontName="Helvetica-Bold", fontSize=14, textColor=SUCCESS)),
            Paragraph(pk.replace("_", " ").title(), ParagraphStyle("BHL2", fontName="Helvetica", fontSize=9, textColor=TEXT_MUTED)),
            Paragraph(f"{best_val:.4f}" if isinstance(best_val, float) else str(best_val),
                     ParagraphStyle("BHV2", fontName="Helvetica-Bold", fontSize=14, textColor=ACCENT)),
        ]]
        hl_table = Table(highlight_data, colWidths=[1.8*inch, 2.0*inch, 1.4*inch, 1.3*inch])
        hl_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BG),
            ("TOPPADDING", (0, 0), (-1, -1), 12),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
            ("LEFTPADDING", (0, 0), (-1, -1), 12),
            ("LINEABOVE", (0, 0), (-1, 0), 2, ACCENT),
            ("LINEBEFORE", (0, 0), (0, -1), 2, ACCENT),
        ]))
        elements.append(hl_table)

    elements.append(Spacer(1, 0.6*inch))
    elements.append(HRFlowable(width="100%", thickness=1, color=BORDER))
    elements.append(Spacer(1, 0.1*inch))
    elements.append(Paragraph(
        "This report was generated automatically by the Repos AI Research Platform. "
        "All metrics are computed from actual experimental runs using scikit-learn. "
        "Results should be validated on held-out test data before production deployment.",
        ParagraphStyle("Disclaimer", fontName="Helvetica-Oblique", fontSize=8,
                      textColor=TEXT_MUTED, leading=12, alignment=TA_JUSTIFY)
    ))

    elements.append(PageBreak())
    return elements


def render_pdf(report_text: str, runs: list, report_id: str) -> str:
    os.makedirs(REPORTS_DIR, exist_ok=True)
    pdf_path = os.path.join(REPORTS_DIR, f"{report_id}.pdf")

    # Page numbers via canvas
    page_num = [0]

    def add_page_number(canvas, doc):
        page_num[0] += 1
        canvas.saveState()
        # Header bar
        canvas.setFillColor(PRIMARY)
        canvas.rect(0.5*inch, 10.5*inch, 7.5*inch, 0.25*inch, fill=1, stroke=0)
        canvas.setFillColor(WHITE)
        canvas.setFont("Helvetica-Bold", 7)
        canvas.drawString(0.6*inch, 10.57*inch, "REPOS AI — MACHINE LEARNING EXPERIMENT REPORT")
        canvas.drawRightString(8.0*inch, 10.57*inch, time.strftime("%B %d, %Y"))
        # Footer
        canvas.setFillColor(TEXT_MUTED.hexval() if hasattr(TEXT_MUTED, 'hexval') else "#6b7280")
        canvas.setFillColor(colors.HexColor("#6b7280"))
        canvas.setFont("Helvetica", 7)
        canvas.drawString(0.75*inch, 0.4*inch, f"Repos AI Research Platform  |  Report ID: {report_id[:8].upper()}")
        canvas.drawRightString(7.75*inch, 0.4*inch, f"Page {page_num[0]}")
        canvas.setStrokeColor(BORDER)
        canvas.line(0.75*inch, 0.55*inch, 7.75*inch, 0.55*inch)
        canvas.restoreState()

    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        topMargin=0.9*inch,
        bottomMargin=0.75*inch,
        leftMargin=0.75*inch,
        rightMargin=0.75*inch,
        title="ML Experiment Report — Repos AI",
        author="Karthika S",
        subject="Machine Learning Research Report",
        creator="Repos AI Research Platform"
    )

    styles = _make_styles()
    elements = []

    # 1. Cover page
    elements.extend(_build_cover_page(runs, report_id, styles))

    # 2. Table of contents (static, since we know sections)
    elements.extend(_section_block("TABLE OF CONTENTS", styles))
    toc_items = [
        ("1", "Abstract"),
        ("2", "Research Objective"),
        ("3", "Dataset Analysis"),
        ("4", "Methodology"),
        ("5", "Experimental Results"),
        ("6", "Statistical Analysis"),
        ("7", "Best Model Justification"),
        ("8", "Limitations and Future Work"),
        ("9", "Conclusion"),
        ("10", "Performance Metrics Summary"),
        ("11", "Experiment Configurations"),
    ]
    toc_data = [[f"{n}.", title] for n, title in toc_items]
    toc_table = Table(toc_data, colWidths=[0.4*inch, 6.1*inch])
    toc_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("TEXTCOLOR", (0, 0), (0, -1), ACCENT),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LINEBELOW", (0, 0), (-1, -1), 0.3, BORDER),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [WHITE, LIGHT_BG]),
    ]))
    elements.append(toc_table)
    elements.append(PageBreak())

    # 3. AI-generated narrative sections
    elements.extend(_parse_sections(report_text, styles))
    elements.append(PageBreak())

    # 4. Metrics table
    elements.extend(_build_metrics_table(runs, styles))
    elements.append(Spacer(1, 0.2*inch))

    # 5. Experiment configuration cards
    elements.extend(_build_experiment_cards(runs, styles))

    # 6. Final note
    elements.append(Spacer(1, 0.3*inch))
    elements.append(HRFlowable(width="100%", thickness=1, color=BORDER))
    elements.append(Spacer(1, 8))
    elements.append(Paragraph(
        f"End of Report  |  Generated by Repos AI Research Platform  |  "
        f"{time.strftime('%B %d, %Y at %H:%M')}  |  "
        f"Report ID: {report_id[:8].upper()}",
        styles["RFooter"]
    ))

    doc.build(elements, onFirstPage=add_page_number, onLaterPages=add_page_number)
    return pdf_path


def create_report(run_ids: list) -> dict:
    result = generate_report_text(run_ids)
    report_id = str(uuid.uuid4())
    pdf_path = render_pdf(result["report_text"], result["runs"], report_id)

    record = {
        "id": report_id,
        "run_ids": run_ids,
        "report_text": result["report_text"],
        "pdf_path": pdf_path,
        "models_included": [r["model_name"] for r in result["runs"]],
        "created_at": time.time()
    }

    metadata = _load_reports_metadata()
    metadata[report_id] = record
    _save_reports_metadata(metadata)
    return record


def get_all_reports():
    metadata = _load_reports_metadata()
    return sorted(metadata.values(), key=lambda r: r["created_at"], reverse=True)


def get_report(report_id: str):
    metadata = _load_reports_metadata()
    return metadata.get(report_id)