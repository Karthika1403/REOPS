import json
import os
import time

MEMORY_FILE = "backend/memory/data.json"


def save_to_memory(query, steps, execution):
    summary = None
    key_points = []
    improvements = []
    topic = None

    for step in execution:
        if step.get("action") == "analyze_document":
            result = step.get("result", {})
            if isinstance(result, dict):
                summary = result.get("summary")
                key_points = result.get("key_points", [])
                improvements = result.get("improvements", [])
        if step.get("action") == "research_trends":
            result = step.get("result", {})
            if isinstance(result, dict):
                topic = result.get("topic")

    data = {
        "id": str(int(time.time() * 1000)),
        "timestamp": time.time(),
        "query": query,
        "steps": steps,
        "execution": execution,
        "status": "success" if all(
            s.get("status") == "success" for s in execution
        ) else "failed",
        "step_count": len(steps),
        "plugins_used": [s.get("action") for s in execution],
        "insights": {
            "summary": summary,
            "key_points": key_points[:3],
            "improvements": improvements[:3],
            "topic": topic
        }
    }

    os.makedirs(os.path.dirname(MEMORY_FILE), exist_ok=True)
    if not os.path.exists(MEMORY_FILE):
        with open(MEMORY_FILE, "w") as f:
            json.dump([], f)

    with open(MEMORY_FILE, "r") as f:
        existing = json.load(f)

    existing.append(data)
    if len(existing) > 100:
        existing = existing[-100:]

    with open(MEMORY_FILE, "w") as f:
        json.dump(existing, f, indent=4)


def get_memory():
    if not os.path.exists(MEMORY_FILE):
        return []
    with open(MEMORY_FILE, "r") as f:
        data = json.load(f)
    return list(reversed(data))


def delete_memory(memory_id: str) -> bool:
    if not os.path.exists(MEMORY_FILE):
        return False
    with open(MEMORY_FILE, "r") as f:
        data = json.load(f)
    filtered = [m for m in data if m.get("id") != memory_id]
    with open(MEMORY_FILE, "w") as f:
        json.dump(filtered, f, indent=4)
    return len(filtered) < len(data)


def clear_all_memory() -> bool:
    with open(MEMORY_FILE, "w") as f:
        json.dump([], f)
    return True


def get_memory_stats():
    if not os.path.exists(MEMORY_FILE):
        return {"total": 0, "success": 0, "failed": 0, "plugins": {}}
    with open(MEMORY_FILE, "r") as f:
        data = json.load(f)
    plugin_counts = {}
    topics = []
    for m in data:
        for p in m.get("plugins_used", []):
            plugin_counts[p] = plugin_counts.get(p, 0) + 1
        topic = m.get("insights", {}).get("topic")
        if topic and topic not in topics:
            topics.append(topic)
    return {
        "total": len(data),
        "success": sum(1 for m in data if m.get("status") == "success"),
        "failed": sum(1 for m in data if m.get("status") == "failed"),
        "plugins": plugin_counts,
        "topics": topics[-5:]
    }