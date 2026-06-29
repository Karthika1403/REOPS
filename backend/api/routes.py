from fastapi import APIRouter, UploadFile, File
import shutil
import os
import time
from pydantic import BaseModel
from backend.agents.llm_planner import AGENT_REGISTRY
from backend.datasets.registry import TOPIC_SUGGESTIONS
from backend.memory.store import (
    save_to_memory, get_memory,
    delete_memory, clear_all_memory, get_memory_stats
)
from backend.agents.executor import ExecutorAgent
from backend.agents.llm_planner import LLMPlanner
from backend.rag.embedder import (
    index_document, search_documents,
    get_all_documents, delete_document
)
from backend.core.execution_state import (
    start_execution, complete_execution,
    get_active_executions, get_recent_executions,
    get_execution_stats, get_execution
)
from backend.datasets.service import (
    list_builtin_datasets, search_openml,
    import_openml_dataset, save_uploaded_dataset,
    get_dataset_preview, list_all_datasets
)
from backend.models.registry import get_model_catalog_summary, get_models_by_task
from backend.models.training import (
    get_dataset_columns, train_model, get_run, get_all_runs, delete_run
)
from fastapi.responses import FileResponse
from backend.reports.generator import create_report, get_all_reports, get_report
from backend.models.advanced_training import (
    train_multiple_models, train_ensemble, get_ai_suggestions
)
from backend.models.training import get_all_runs
from backend.rag.embedder import get_all_documents
router = APIRouter()


class QueryRequest(BaseModel):
    query: str


@router.get("/")
def root():
    return {"message": "FlowOps AI is running 🚀"}


# ✅ MAIN WORKFLOW API
@router.post("/execute")
def execute_workflow(request: dict):
    try:
        query = request.get("query")

        planner = LLMPlanner()
        steps = planner.plan(query)

        exec_id = start_execution(query, steps)

        executor = ExecutorAgent()
        results = executor.execute(query, steps, exec_id=exec_id)

        final_status = "success" if all(
            r.get("status") == "success" for r in results
        ) else "partial" if any(
            r.get("status") == "success" for r in results
        ) else "failed"

        complete_execution(exec_id, final_status)

        save_to_memory(query, steps, results)

        return {
            "exec_id": exec_id,
            "query": query,
            "steps": steps,
            "execution": results
        }

    except Exception as e:
        return {"error": str(e)}


@router.get("/history")
def get_history():
    return get_memory()


@router.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    upload_dir = "backend/uploads"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        index_result = index_document(file_path, file.filename)
        return {
            "message": "PDF uploaded and indexed successfully",
            "file_path": file_path,
            "index": index_result
        }
    except Exception as e:
        return {
            "message": "PDF uploaded but indexing failed",
            "file_path": file_path,
            "error": str(e)
        }


@router.get("/documents")
def list_documents():
    docs = get_all_documents()
    return {"documents": docs, "total": len(docs)}


@router.delete("/documents/{filename}")
def remove_document(filename: str):
    success = delete_document(filename)
    return {"success": success, "filename": filename}


@router.post("/documents/search")
def search_docs(request: dict):
    query = request.get("query", "")
    results = search_documents(query, n_results=5)
    return {"results": results, "query": query}


@router.post("/documents/reindex/{filename}")
async def reindex_document(filename: str):
    file_path = os.path.join("backend/uploads", filename)
    if not os.path.exists(file_path):
        return {"error": "File not found"}
    result = index_document(file_path, filename)
    return {"success": True, "index": result}


@router.delete("/memory/{memory_id}")
def remove_memory(memory_id: str):
    success = delete_memory(memory_id)
    return {"success": success}


@router.delete("/memory")
def clear_memory():
    success = clear_all_memory()
    return {"success": success}


@router.get("/memory/stats")
def memory_stats():
    return get_memory_stats()


# ✅ EXECUTION NEXUS ROUTES
@router.get("/executions/active")
def active_executions():
    return {"executions": get_active_executions()}


@router.get("/executions/recent")
def recent_executions():
    return {"executions": get_recent_executions()}


@router.get("/executions/stats")
def execution_stats():
    return get_execution_stats()


@router.get("/executions/{exec_id}")
def execution_detail(exec_id: str):
    exe = get_execution(exec_id)
    if not exe:
        return {"error": "Execution not found"}
    return exe

@router.get("/agents")
def get_agents():
    active = get_active_executions()
    
    # Determine which agent is currently active
    busy_actions = set()
    for exe in active:
        for step in exe["steps"]:
            if step["status"] == "running":
                busy_actions.add(step["action"])

    agents = []
    for action, meta in AGENT_REGISTRY.items():
        agents.append({
            "id": action,
            "name": meta["name"],
            "role": meta["role"],
            "icon": meta["icon"],
            "color": meta["color"],
            "status": "active" if action in busy_actions else "idle"
        })

    return {
        "agents": agents,
        "orchestrator": {
            "name": "LLM Planner",
            "role": "Decides which agents to invoke and in what order",
            "status": "active" if active else "idle"
        }
    }
@router.get("/datasets/builtin")
def get_builtin_datasets():
    return {"datasets": list_builtin_datasets()}


@router.get("/datasets/openml/search")
def openml_search(q: str = ""):
    return {"results": search_openml(q)}


@router.post("/datasets/openml/import")
def openml_import(request: dict):
    openml_id = request.get("openml_id")
    try:
        result = import_openml_dataset(openml_id)
        return {"success": True, "dataset": result}
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.post("/datasets/upload-csv")
async def upload_dataset(file: UploadFile = File(...)):
    upload_dir = "backend/datasets/storage"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        result = save_uploaded_dataset(file_path, file.filename)
        return {"success": True, "dataset": result}
    except Exception as e:
        os.remove(file_path)
        return {"success": False, "error": str(e)}


@router.get("/datasets/all")
def all_datasets():
    return list_all_datasets()


@router.get("/datasets/{dataset_id}/preview")
def dataset_preview(dataset_id: str):
    try:
        return get_dataset_preview(dataset_id)
    except Exception as e:
        return {"error": str(e)}
    
@router.get("/datasets/openml/suggestions")
def openml_suggestions():
    return {"topics": list(TOPIC_SUGGESTIONS.keys())}



@router.get("/models/catalog")
def model_catalog(task: str = None):
    if task:
        filtered = get_models_by_task(task)
        return {"models": [
            {
                "id": k,
                "name": v["name"],
                "task": v["task"],
                "description": v["description"],
                "params": v["params"]
            }
            for k, v in filtered.items()
        ]}
    return {"models": get_model_catalog_summary()}


@router.get("/models/dataset-columns/{dataset_id}")
def dataset_columns(dataset_id: str):
    try:
        return get_dataset_columns(dataset_id)
    except Exception as e:
        return {"error": str(e)}


@router.post("/models/train")
def run_training(request: dict):
    try:
        dataset_id = request.get("dataset_id")
        model_id = request.get("model_id")
        target_column = request.get("target_column")
        hyperparams = request.get("hyperparams", {})

        result = train_model(dataset_id, model_id, target_column, hyperparams)
        return {"success": True, "run": result}
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.get("/models/runs")
def list_runs():
    return {"runs": get_all_runs()}


@router.get("/models/runs/{run_id}")
def run_detail(run_id: str):
    run = get_run(run_id)
    if not run:
        return {"error": "Run not found"}
    return run


@router.delete("/models/runs/{run_id}")
def remove_run(run_id: str):
    success = delete_run(run_id)
    return {"success": success}



@router.post("/reports/generate")
def generate_report(request: dict):
    try:
        run_ids = request.get("run_ids", [])
        if not run_ids:
            return {"success": False, "error": "No runs selected"}
        report = create_report(run_ids)
        return {"success": True, "report": report}
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.get("/reports/all")
def list_reports():
    return {"reports": get_all_reports()}


@router.get("/reports/{report_id}/download")
def download_report(report_id: str):
    report = get_report(report_id)
    if not report:
        return {"error": "Report not found"}
    return FileResponse(
        report["pdf_path"],
        media_type="application/pdf",
        filename=f"flowops_report_{report_id[:8]}.pdf"
    )


@router.post("/models/train-multiple")
def run_multiple_training(request: dict):
    try:
        result = train_multiple_models(
            dataset_id=request.get("dataset_id"),
            model_ids=request.get("model_ids", []),
            target_column=request.get("target_column"),
            task_type=request.get("task_type"),
            hyperparams_map=request.get("hyperparams_map", {}),
            use_cross_validation=request.get("use_cross_validation", True),
            feature_selection=request.get("feature_selection"),
            cv_folds=request.get("cv_folds", 5)
        )
        return {"success": True, **result}
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.post("/models/train-ensemble")
def run_ensemble_training(request: dict):
    try:
        result = train_ensemble(
            dataset_id=request.get("dataset_id"),
            model_ids=request.get("model_ids", []),
            target_column=request.get("target_column"),
            task_type=request.get("task_type"),
            ensemble_method=request.get("ensemble_method", "voting"),
            feature_selection=request.get("feature_selection")
        )
        return {"success": True, **result}
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.get("/models/suggest")
def suggest_models(dataset_id: str, target_column: str, task_type: str):
    return get_ai_suggestions(dataset_id, target_column, task_type)



@router.get("/research-feed")
def research_feed():
    from groq import Groq
    from dotenv import load_dotenv
    from ddgs import DDGS
    import json as json_lib
    from datetime import datetime
    load_dotenv()
    client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

    current_year = datetime.now().year
    current_month = datetime.now().strftime("%B %Y")

    try:
        results = []
        with DDGS() as ddgs:
            for r in ddgs.text(
                f"AI ML conference {current_year} call for papers deadline upcoming site:paperswithcode.com OR site:aideadlin.es OR site:mlconf.com OR site:neurips.cc OR site:icml.cc OR site:iclr.cc",
                max_results=12,
                timelimit="m"
            ):
                results.append(r.get("body", "") + " " + r.get("title", ""))

        with DDGS() as ddgs:
            for r in ddgs.text(
                f"machine learning conference submission deadline {current_year} upcoming",
                max_results=8,
                timelimit="m"
            ):
                results.append(r.get("body", "") + " " + r.get("title", ""))

        snippets = "\n".join(results)[:5000]
        today = datetime.now().strftime("%B %d, %Y")

        prompt = f"""Today is {today}. Extract ONLY real upcoming AI/ML/DL conferences that have NOT yet happened — meaning their event date OR submission deadline is still in the future from today.

Focus on: NeurIPS {current_year}, ICML {current_year}, ICLR {current_year+1}, CVPR {current_year}, EMNLP {current_year}, ACL {current_year}, AAAI {current_year+1}, ECCV {current_year}, ICCV {current_year}, SIGKDD {current_year}, IJCAI {current_year} or any other upcoming major AI/ML conferences.

Search data:
{snippets}

Return ONLY valid JSON, no markdown:
{{
  "conferences": [
    {{
      "name": "Full conference name",
      "shortname": "ICLR",
      "date": "Exact Month Year of the conference event",
      "location": "City Country or Virtual",
      "deadline": "Paper submission deadline e.g. October 1 {current_year}",
      "topic": "NLP or CV or ML or AI or RL",
      "url": "official website url",
      "status": "upcoming"
    }}
  ]
}}

CRITICAL: Only include conferences where the event date is AFTER {today}. Maximum 6. If unsure about a date, skip it."""

        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}]
        )
        raw = completion.choices[0].message.content.strip()
        raw = raw.replace("```json", "").replace("```", "").strip()
        return json_lib.loads(raw)
    except Exception as e:
        return {"conferences": [], "error": str(e)}


@router.get("/research-frontiers")
def research_frontiers():
    from groq import Groq
    from dotenv import load_dotenv
    from ddgs import DDGS
    import json as json_lib
    from datetime import datetime
    load_dotenv()
    client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

    today = datetime.now().strftime("%B %d, %Y")
    current_year = datetime.now().year

    try:
        results = []
        # Search for very recent papers — last 3 months
        with DDGS() as ddgs:
            for r in ddgs.text(
                f"AI ML deep learning breakthrough research paper {current_year}",
                max_results=10,
                timelimit="m"  # past month
            ):
                results.append(r.get("body", "") + " " + r.get("title", ""))

        with DDGS() as ddgs:
            for r in ddgs.text(
                f"new AI model released {current_year} state of the art benchmark",
                max_results=8,
                timelimit="m"
            ):
                results.append(r.get("body", "") + " " + r.get("title", ""))

        with DDGS() as ddgs:
            for r in ddgs.text(
                "large language model multimodal computer vision NLP breakthrough 2025 2026",
                max_results=8,
                timelimit="m"
            ):
                results.append(r.get("body", "") + " " + r.get("title", ""))

        snippets = "\n".join(results)[:5000]

        prompt = f"""Today is {today}. Based on these real search results, identify 6 of the most significant and RECENT AI/ML/DL research breakthroughs or model releases from the past 3 months only.

For each item identify:
- What exactly was achieved (be specific — accuracy numbers, benchmark names, capability)
- Who did it (specific researchers, labs, or organizations like Google DeepMind, Meta AI, OpenAI, Mistral, Anthropic, MIT, Stanford, etc.)
- Which specific field it belongs to
- Approximate date if mentioned

Search results:
{snippets}

Return ONLY valid JSON, no markdown:
{{
  "frontiers": [
    {{
      "title": "Specific paper/model name",
      "achievement": "Precise one sentence — what was achieved with specific numbers or capabilities",
      "authors": "Specific researchers or organization name",
      "field": "AI or ML or DL or NLP or CV or RL or Multimodal",
      "impact": "high or medium",
      "date": "Month Year"
    }}
  ]
}}

CRITICAL: Only include items from {current_year}. Be specific about achievements — avoid vague descriptions. Maximum 6 items."""

        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}]
        )
        raw = completion.choices[0].message.content.strip()
        raw = raw.replace("```json", "").replace("```", "").strip()
        return json_lib.loads(raw)
    except Exception as e:
        return {"frontiers": [], "error": str(e)}

@router.post("/research-assistant")
def research_assistant(request: dict):
    from groq import Groq
    from dotenv import load_dotenv
    from ddgs import DDGS
    import json as json_lib
    load_dotenv()
    client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

    query = request.get("query", "")
    history = request.get("history", [])

    runs = get_all_runs()
    docs = get_all_documents()
    mem_stats = get_memory_stats()

    # Web search for research questions
    web_context = ""
    research_keywords = ["paper", "conference", "model", "algorithm", "technique",
                        "research", "state of the art", "sota", "benchmark", "dataset",
                        "transformer", "diffusion", "llm", "reinforcement", "neural"]
    needs_web = any(kw in query.lower() for kw in research_keywords)

    if needs_web:
        try:
            results = []
            with DDGS() as ddgs:
                for r in ddgs.text(query + " AI ML research 2025", max_results=5):
                    results.append(r.get("body", ""))
            web_context = "\n".join(results)[:2000]
        except Exception:
            pass

    system_prompt = f"""You are an expert AI/ML Research Assistant integrated into Repos AI — a research platform for machine learning experimentation.

You have two capabilities:
1. Answer general AI/ML/DL research questions with depth and accuracy
2. Provide insights about the researcher's own experimental data

RESEARCHER'S DATA:
- Experiments run: {len(runs)}
- Best experiments: {chr(10).join([f"  {r['model_name']} on {r['dataset_id']}: accuracy={r['metrics'].get('accuracy', r['metrics'].get('r2_score', 'N/A'))}" for r in runs[:5]])}
- Documents uploaded: {[d['filename'] for d in docs[:5]]}
- Workflow success rate: {round(mem_stats.get('success', 0) / max(mem_stats.get('total', 1), 1) * 100, 1)}%

{f"CURRENT WEB RESEARCH CONTEXT:{chr(10)}{web_context}" if web_context else ""}

INSTRUCTIONS:
- For general research questions (papers, algorithms, techniques, comparisons): give expert, detailed answers
- For questions about their experiments: reference their actual data specifically
- For "what should I try": suggest specific models/techniques based on their current experiments
- Always be specific, never vague
- Use markdown formatting for clarity (bold key terms, bullet points for lists)
- Keep responses concise but complete — max 4 paragraphs"""

    messages = []
    for msg in history[-6:]:
        messages.append({"role": msg["role"], "content": msg["text"]})
    messages.append({"role": "user", "content": query})

    completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "system", "content": system_prompt}] + messages
    )
    return {"response": completion.choices[0].message.content}
@router.get("/recent-experiments")
def recent_experiments():
    try:
        runs = get_all_runs()
        recent = runs[:5]
        summary = []
        for r in recent:
            primary_metric = None
            if r.get("metrics"):
                if "accuracy" in r["metrics"]:
                    primary_metric = {"name": "Accuracy", "value": r["metrics"]["accuracy"]}
                elif "r2_score" in r["metrics"]:
                    primary_metric = {"name": "R² Score", "value": r["metrics"]["r2_score"]}
                elif "silhouette_score" in r["metrics"]:
                    primary_metric = {"name": "Silhouette", "value": r["metrics"]["silhouette_score"]}
            summary.append({
                "model_name": r.get("model_name"),
                "dataset_id": r.get("dataset_id"),
                "task_type": r.get("task_type"),
                "primary_metric": primary_metric,
                "duration": r.get("duration_seconds"),
                "created_at": r.get("created_at")
            })
        return {"experiments": summary}
    except Exception as e:
        return {"experiments": [], "error": str(e)}