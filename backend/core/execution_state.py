import time
import uuid

executions = {}


def start_execution(query: str, steps: list) -> str:
    exec_id = str(uuid.uuid4())
    executions[exec_id] = {
        "id": exec_id,
        "query": query,
        "status": "running",
        "started_at": time.time(),
        "completed_at": None,
        "total_steps": len(steps),
        "current_step": 0,
        "steps": [
            {"step": s["step"], "action": s["action"], "status": "pending"}
            for s in steps
        ]
    }
    return exec_id


def update_step(exec_id: str, step_number: int, status: str, error: str = None):
    if exec_id not in executions:
        return
    exe = executions[exec_id]
    exe["current_step"] = step_number
    for s in exe["steps"]:
        if s["step"] == step_number:
            s["status"] = status
            if error:
                s["error"] = error


def complete_execution(exec_id: str, final_status: str):
    if exec_id not in executions:
        return
    executions[exec_id]["status"] = final_status
    executions[exec_id]["completed_at"] = time.time()


def get_execution(exec_id: str):
    return executions.get(exec_id)


def get_active_executions():
    return [e for e in executions.values() if e["status"] == "running"]


def get_recent_executions(limit: int = 10):
    all_exec = sorted(executions.values(),
                      key=lambda x: x["started_at"], reverse=True)
    return all_exec[:limit]


def get_execution_stats():
    all_exec = list(executions.values())
    completed = [e for e in all_exec if e["completed_at"]]
    return {
        "active": len([e for e in all_exec if e["status"] == "running"]),
        "completed_today": len([
            e for e in all_exec
            if e["status"] == "success" and
            e["started_at"] > time.time() - 86400
        ]),
        "total": len(all_exec),
        "avg_duration": round(
            sum((e["completed_at"] - e["started_at"]) for e in completed) /
            max(len(completed), 1), 2
        )
    }