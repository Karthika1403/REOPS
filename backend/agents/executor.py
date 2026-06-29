import time
from backend.plugins.registry import registry
from backend.core.execution_state import update_step


class ExecutorAgent:
    def execute(self, query, steps, exec_id=None):
        context = {}
        results = []
        for step in steps:
            action = step["action"]
            plugin = registry.get(action)

            if exec_id:
                update_step(exec_id, step["step"], "running")
                time.sleep(1.2)

            if not plugin:
                results.append({
                    "step": step["step"],
                    "action": action,
                    "status": "failed",
                    "error": f"Plugin '{action}' not found"
                })
                if exec_id:
                    update_step(exec_id, step["step"], "failed",
                               f"Plugin '{action}' not found")
                continue
            try:
                result = plugin(query, context)
                context[action] = result
                results.append({
                    "step": step["step"],
                    "action": action,
                    "status": "success",
                    "result": result
                })
                if exec_id:
                    update_step(exec_id, step["step"], "success")
            except Exception as e:
                results.append({
                    "step": step["step"],
                    "action": action,
                    "status": "failed",
                    "error": str(e)
                })
                if exec_id:
                    update_step(exec_id, step["step"], "failed", str(e))
        return results