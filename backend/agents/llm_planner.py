import json
from groq import Groq
from dotenv import load_dotenv
import os

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

AGENT_REGISTRY = {
    "load_pdf": {"name": "Document Reader", "role": "Extracts PDF content", "color": "blue"},
    "analyze_document": {"name": "Insight Analyst", "role": "Deep analysis", "color": "purple"},
    "research_trends": {"name": "Trend Researcher", "role": "Web search", "color": "cyan"},
    "generate_workflow_image": {"name": "Visual Architect", "role": "Generates diagrams", "color": "pink"},
    "send_email": {"name": "Communication Agent", "role": "Sends emails", "color": "yellow"},
}

AVAILABLE_PLUGINS = """
- load_pdf: Loads the most recently uploaded PDF
- analyze_document: Deeply analyzes document text
- generate_workflow_image: Generates SVG workflow diagram AFTER analyze_document
- research_trends: Searches web for current trends AFTER analyze_document
- send_email: Sends email summary
"""

PLANNER_PROMPT = """You are a workflow planner for an AI agent system.
Given the user's query, decide which plugins should run, in order.

Available plugins:
{plugins}

Rules:
- If the task involves a PDF, ALWAYS include load_pdf first
- If user asks to summarize/analyze, include analyze_document
- generate_workflow_image should ALWAYS be included AFTER analyze_document
- research_trends runs AFTER analyze_document and BEFORE generate_workflow_image
- If user asks to email, include send_email last
- If nothing matches, return a single step with action "unknown_task"

Return ONLY valid JSON, no markdown:
{{
  "steps": [
    {{"step": 1, "action": "load_pdf"}},
    {{"step": 2, "action": "analyze_document"}}
  ]
}}

User query: "{query}"
"""


class LLMPlanner:
    def plan(self, query: str):
        try:
            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": PLANNER_PROMPT.format(
                    plugins=AVAILABLE_PLUGINS, query=query
                )}]
            )
            raw = completion.choices[0].message.content.strip()
            raw = raw.replace("```json", "").replace("```", "").strip()
            parsed = json.loads(raw)
            steps = parsed.get("steps", [])
            if not steps:
                steps = [{"step": 1, "action": "unknown_task"}]
            for i, step in enumerate(steps, start=1):
                step["step"] = i
            return steps
        except Exception:
            return self._fallback_plan(query)

    def _fallback_plan(self, query: str):
        query_lower = query.lower()
        steps = []
        step_id = 1

        if "pdf" in query_lower or "summarize" in query_lower or "analyze" in query_lower:
            steps.append({"step": step_id, "action": "load_pdf"})
            step_id += 1
            steps.append({"step": step_id, "action": "analyze_document"})
            step_id += 1
            steps.append({"step": step_id, "action": "research_trends"})
            step_id += 1
            steps.append({"step": step_id, "action": "generate_workflow_image"})
            step_id += 1

        if "email" in query_lower or "mail" in query_lower:
            steps.append({"step": step_id, "action": "send_email"})
            step_id += 1

        if not steps:
            steps.append({"step": 1, "action": "unknown_task"})

        return steps