import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Bot, X, RefreshCw, FileText, Brain,
  Globe, Image, Mail, Cpu, ArrowRight,
  Circle, Sparkles
} from "lucide-react";

const ICONS = {
  FileText: FileText,
  Brain: Brain,
  Globe: Globe,
  Image: Image,
  Mail: Mail,
};

const COLOR_MAP = {
  blue: { bg: "bg-blue-500/20", border: "border-blue-400/30", text: "text-blue-400", glow: "rgba(59,130,246,.4)" },
  purple: { bg: "bg-purple-500/20", border: "border-purple-400/30", text: "text-purple-400", glow: "rgba(168,85,247,.4)" },
  cyan: { bg: "bg-cyan-500/20", border: "border-cyan-400/30", text: "text-cyan-400", glow: "rgba(34,211,238,.4)" },
  pink: { bg: "bg-pink-500/20", border: "border-pink-400/30", text: "text-pink-400", glow: "rgba(236,72,153,.4)" },
  yellow: { bg: "bg-yellow-500/20", border: "border-yellow-400/30", text: "text-yellow-400", glow: "rgba(234,179,8,.4)" },
};

function AgentNetwork() {
  const [expanded, setExpanded] = useState(false);
  const [agents, setAgents] = useState([]);
  const [orchestrator, setOrchestrator] = useState(null);
  const pollRef = useRef(null);

  const fetchAgents = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/agents`);
      const data = await res.json();
      setAgents(data.agents || []);
      setOrchestrator(data.orchestrator);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAgents();
    pollRef.current = setInterval(fetchAgents, 1500);
    return () => clearInterval(pollRef.current);
  }, []);

  const activeAgents = agents.filter(a => a.status === "active");

  // Collapsed card
  if (!expanded) {
    return (
      <div
        id="agentNetwork"
        onClick={() => setExpanded(true)}
        className="
          w-full max-w-[320px] min-h-[220px]
          bg-slate-900/40 backdrop-blur-xl
          border border-cyan-500/20 rounded-3xl p-6
          text-white hover:scale-105 hover:border-green-400/50
          transition-all duration-300 cursor-pointer
          shadow-[0_0_30px_rgba(34,211,238,.08)]
        "
      >
        <div className="flex items-center justify-between">
          <Bot size={32} className="text-green-400" />
          {activeAgents.length > 0 && (
            <span className="flex h-3 w-3">
              <span className="animate-ping absolute h-3 w-3 rounded-full bg-green-400 opacity-75" />
              <span className="relative rounded-full h-3 w-3 bg-green-500" />
            </span>
          )}
        </div>

        <h2 className="mt-3 text-lg font-bold">Agent Network</h2>
        <p className="text-slate-400 text-sm mt-2">
          {activeAgents.length > 0 ? "Agents working..." : "Autonomous AI Agents"}
        </p>

       <div className="space-y-1.5 mt-4 text-sm">
  {[...agents].sort((a, b) => (b.status === "active") - (a.status === "active")).slice(0, 3).map((agent, i) => (
    <div key={i} className="flex items-center gap-2">
      <Circle
        size={8}
        className={agent.status === "active" ? "text-green-400 fill-green-400 animate-pulse" : "text-white/20 fill-white/20"}
      />
      <span className={agent.status === "active" ? "text-green-300" : "text-white/40"}>
        {agent.name}
      </span>
    </div>
  ))}
</div>

        <p className="text-white/30 text-xs mt-3">Click to expand</p>
      </div>
    );
  }

  // Expanded modal — node graph view
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="
        w-full max-w-4xl max-h-[90vh] overflow-y-auto
        bg-slate-900 border border-green-500/30
        rounded-3xl text-white
        shadow-[0_0_80px_rgba(34,197,94,.15)]
      ">

        {/* Header */}
        <div className="sticky top-0 z-10 bg-slate-900 border-b border-white/10 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-green-500/20 flex items-center justify-center">
              <Bot size={22} className="text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Agent Network</h2>
              <p className="text-slate-400 text-sm">
                {activeAgents.length > 0
                  ? `${activeAgents.length} agent${activeAgents.length > 1 ? "s" : ""} currently working`
                  : "5 specialized agents · Orchestrated by LLM Planner"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchAgents}
              className="p-2 rounded-xl hover:bg-white/10 transition text-white/60"
            >
              <RefreshCw size={16} />
            </button>
            <button
              onClick={() => setExpanded(false)}
              className="p-2 rounded-xl hover:bg-white/10 transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-8">

          {/* Orchestrator node */}
          <div className="flex justify-center mb-12 relative">
            <div className={`
              relative px-6 py-4 rounded-2xl border-2
              ${orchestrator?.status === "active"
                ? "bg-green-500/20 border-green-400/50"
                : "bg-white/5 border-white/20"}
              flex items-center gap-3 z-10
            `}
            style={{
              boxShadow: orchestrator?.status === "active"
                ? "0 0 40px rgba(34,197,94,.3)"
                : "none"
            }}
            >
              <div className="relative">
                <Cpu size={24} className={orchestrator?.status === "active" ? "text-green-400" : "text-white/50"} />
                {orchestrator?.status === "active" && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute h-2.5 w-2.5 rounded-full bg-green-400 opacity-75" />
                    <span className="relative rounded-full h-2.5 w-2.5 bg-green-500" />
                  </span>
                )}
              </div>
              <div>
                <p className="font-bold text-sm">{orchestrator?.name || "LLM Planner"}</p>
                <p className="text-xs text-white/40">{orchestrator?.role}</p>
              </div>
            </div>

            {/* Connecting lines down to agents */}
            <svg className="absolute top-full left-1/2 -translate-x-1/2 w-full h-12 pointer-events-none" style={{ maxWidth: "800px" }}>
              <line x1="50%" y1="0" x2="10%" y2="100%" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
              <line x1="50%" y1="0" x2="30%" y2="100%" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
              <line x1="50%" y1="0" x2="50%" y2="100%" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
              <line x1="50%" y1="0" x2="70%" y2="100%" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
              <line x1="50%" y1="0" x2="90%" y2="100%" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
            </svg>
          </div>

          {/* Agent grid */}
          <div className="grid grid-cols-5 gap-4 mb-8">
            {agents.map((agent, i) => {
              const Icon = ICONS[agent.icon] || Bot;
              const colors = COLOR_MAP[agent.color] || COLOR_MAP.blue;
              const isActive = agent.status === "active";

              return (
                <div
                  key={agent.id}
                  className={`
                    relative p-4 rounded-2xl border flex flex-col items-center text-center
                    transition-all duration-500
                    ${isActive
                      ? `${colors.bg} ${colors.border} scale-105`
                      : "bg-black/20 border-white/10"}
                  `}
                  style={{
                    boxShadow: isActive ? `0 0 30px ${colors.glow}` : "none"
                  }}
                >
                  {isActive && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
                      <span className="animate-ping absolute h-3 w-3 rounded-full bg-green-400 opacity-75" />
                      <span className="relative rounded-full h-3 w-3 bg-green-500" />
                    </span>
                  )}

                  <div className={`
                    w-12 h-12 rounded-xl flex items-center justify-center mb-3
                    ${isActive ? colors.bg : "bg-white/5"}
                  `}>
                    <Icon size={20} className={isActive ? colors.text : "text-white/30"} />
                  </div>

                  <p className={`text-xs font-bold ${isActive ? "text-white" : "text-white/50"}`}>
                    {agent.name}
                  </p>
                  <p className="text-[10px] text-white/30 mt-1 leading-tight">
                    {agent.role}
                  </p>

                  {isActive && (
                    <div className="mt-2 flex items-center gap-1">
                      <Sparkles size={10} className="text-green-400 animate-pulse" />
                      <span className="text-[10px] text-green-400">Working</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pipeline flow explanation */}
          <div className="p-5 rounded-2xl bg-black/20 border border-white/10">
            <p className="text-xs text-white/40 mb-3 font-medium">
              Typical Pipeline Flow
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {["Document Reader", "Insight Analyst", "Trend Researcher", "Visual Architect"].map((name, i, arr) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/60">
                    {name}
                  </span>
                  {i < arr.length - 1 && (
                    <ArrowRight size={12} className="text-white/20" />
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-white/30 mt-3">
              The LLM Planner dynamically decides which agents to invoke based on your query — not every mission uses all 5 agents.
            </p>
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
}

export default AgentNetwork;