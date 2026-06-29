import os
import json
import re
import anthropic
from backend.plugins.registry import registry
from dotenv import load_dotenv

load_dotenv()
client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

SVG_PROMPT = """Based on the following document analysis, create a clean, professional SVG diagram (viewBox="0 0 800 500") that visualizes the document's workflow or structure as a flowchart — showing the key stages/points as connected boxes with arrows, using a modern color palette (blues, purples, white text on colored boxes).

Return ONLY raw SVG code starting with <svg and ending with </svg>. No markdown fences, no explanation.

Analysis:
Summary: {summary}
Key Points: {key_points}
Suggested Improvements: {improvements}
"""

def generate_workflow_image(query, context):
    analysis = context.get("analyze_document")
    if not analysis:
        raise ValueError("analyze_document must run before generate_workflow_image")

    prompt = SVG_PROMPT.format(
        summary=analysis.get("summary", ""),
        key_points="; ".join(analysis.get("key_points", [])),
        improvements="; ".join(analysis.get("improvements", []))
    )

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}]
    )

    raw = message.content[0].text.strip()
    raw = raw.replace("```svg", "").replace("```", "").strip()

    # Safety: ensure it's actually SVG
    match = re.search(r"<svg.*?</svg>", raw, re.DOTALL)
    svg_code = match.group(0) if match else raw

    out_dir = "backend/uploads/generated"
    os.makedirs(out_dir, exist_ok=True)
    fname = "workflow_diagram.svg"
    fpath = os.path.join(out_dir, fname)
    with open(fpath, "w") as f:
        f.write(svg_code)

    return {
        "filename": fname,
        "url": f"/uploads/generated/{fname}"
    }

registry.register("generate_workflow_image", generate_workflow_image)