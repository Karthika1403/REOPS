import os
import json
import anthropic
from backend.plugins.registry import registry
from dotenv import load_dotenv
load_dotenv()
client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

ANALYSIS_PROMPT = """You are analyzing a document on behalf of the user.
Return ONLY valid JSON, no markdown fences, no preamble, with this exact shape:

{{
  "summary": "2-4 sentence high-level overview",
  "key_points": ["point 1", "point 2", "..."],
  "issues_found": ["issue or weakness 1", "issue 2", "..."],
  "improvements": ["concrete suggestion 1", "suggestion 2", "..."],
  "confidence_notes": "any caveats about what couldn't be assessed"
}}

Document text:
{text}
"""

def analyze_document(query, context):
    text = context.get("load_pdf", {}).get("text", "")
    if not text:
        raise ValueError("No document text available to analyze")

    # Truncate very long docs to stay within context limits
    truncated = text[:12000]

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1500,
        messages=[
            {"role": "user", "content": ANALYSIS_PROMPT.format(text=truncated)}
        ]
    )

    raw = message.content[0].text.strip()
    raw = raw.replace("```json", "").replace("```", "").strip()

    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        parsed = {
            "summary": raw,
            "key_points": [],
            "issues_found": [],
            "improvements": [],
            "confidence_notes": "Response could not be parsed as structured JSON."
        }

    return parsed

registry.register("analyze_document", analyze_document)