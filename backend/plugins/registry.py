class PluginRegistry:
    def __init__(self):
        self.plugins = {}

    def register(self, name, func):
        self.plugins[name] = func

    def get(self, name):
        return self.plugins.get(name)

registry = PluginRegistry()