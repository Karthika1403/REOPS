from backend.plugins.registry import registry
from backend.config.config import EMAIL, PASSWORD
import smtplib
from email.mime.text import MIMEText


def format_analysis_email(analysis: dict) -> str:
    if not analysis:
        return "No analysis data available."

    lines = []
    lines.append("FLOWOPS AI — DOCUMENT ANALYSIS SUMMARY")
    lines.append("=" * 50)
    lines.append("")

    if analysis.get("summary"):
        lines.append("SUMMARY")
        lines.append(analysis["summary"])
        lines.append("")

    if analysis.get("key_points"):
        lines.append("KEY POINTS")
        for kp in analysis["key_points"]:
            lines.append(f"  • {kp}")
        lines.append("")

    if analysis.get("issues_found"):
        lines.append("ISSUES FOUND")
        for issue in analysis["issues_found"]:
            lines.append(f"  • {issue}")
        lines.append("")

    if analysis.get("improvements"):
        lines.append("SUGGESTED IMPROVEMENTS")
        for imp in analysis["improvements"]:
            lines.append(f"  • {imp}")
        lines.append("")

    return "\n".join(lines)


def send_email(query, context):
    try:
        analysis = context.get("analyze_document")

        if isinstance(analysis, dict):
            content = format_analysis_email(analysis)
        else:
            content = "No document analysis available. Run 'analyze this pdf' first."

        msg = MIMEText(content)
        msg["Subject"] = "FlowOps AI — Document Analysis Summary"
        msg["From"] = EMAIL
        msg["To"] = EMAIL

        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(EMAIL, PASSWORD)
        server.send_message(msg)
        server.quit()

        return {"status": "sent", "preview": content[:200]}

    except Exception as e:
        return {"status": "failed", "error": str(e)}


registry.register("send_email", send_email)