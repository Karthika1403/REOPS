import os
import importlib

def load_plugins():
    plugin_dir = os.path.dirname(__file__)
    for file in os.listdir(plugin_dir):
        if file.endswith(".py") and file not in [
            "__init__.py", "registry.py", "loader.py"
        ]:
            module_name = file[:-3]
            print(f"Loading: {module_name}")
            importlib.import_module(f"backend.plugins.{module_name}")