import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Calendar, BookOpen, Zap, RefreshCw,
  Loader, Send, MessageSquare, Clock,
  Sparkles, AlertCircle, ExternalLink,
  TrendingUp, Users, Award, ChevronRight,
  FlaskConical, Brain
} from "lucide-react";
import ParticleUniverse from "../components/Effects/ParticleUniverse";
const API = import.meta.env.VITE_API_URL || 'https://reops-ai.onrender.com';
import { API_URL } from '../config';
// ─── Welcome Hero ─────────────────────────────────────────────
function WelcomeHero() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const hour = time.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="w-full rounded-3xl border border-white/10 overflow-hidden relative"
      style={{ background: "linear-gradient(135deg,#0A1628 0%,#0D1F3C 50%,#0A1628 100%)" }}>

      {/* Subtle gradient accent */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 80% 50%,rgba(0,212,255,0.05) 0%,transparent 60%)" }} />

      <div className="relative px-8 py-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs text-cyan-400 font-medium tracking-wider uppercase">
              Repos AI — Research Platform
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {greeting}, Researcher
          </h1>
          <p className="text-white/50 text-sm max-w-lg leading-relaxed">
            Your intelligent ML research companion — experiment with 23 models,
            explore 20,000+ datasets, track breakthroughs, and publish findings.
            Everything a researcher needs, in one platform.
          </p>
        </div>

        <div className="hidden lg:flex flex-col items-end gap-3">
          <div className="text-right">
            <p className="text-2xl font-bold text-white tabular-nums">
              {time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </p>
            <p className="text-xs text-white/40">
              {time.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/model-lab"
              className="px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-400/30 hover:bg-cyan-500/30 transition text-sm text-cyan-300 font-medium">
              Start Experiment
            </Link>
            <Link to="/research-lab"
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm text-white/60">
              Browse Datasets
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Conference Pulse ─────────────────────────────────────────
function ConferencePulse() {
  const [conferences, setConferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchConferences = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/research-frontiers`);
      const data = await res.json();
      if (data.conferences?.length > 0) {
        setConferences(data.conferences);
        setLastUpdated(new Date());
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConferences(); }, []);

  const statusConfig = {
    deadline_soon: { color: "text-red-400", bg: "bg-red-500/10 border-red-400/20", badge: "Deadline Soon" },
    upcoming: { color: "text-green-400", bg: "bg-green-500/10 border-green-400/20", badge: "Upcoming" },
  };

  const fieldColors = {
    "NLP": "bg-blue-500/20 text-blue-300",
    "CV": "bg-purple-500/20 text-purple-300",
    "ML": "bg-cyan-500/20 text-cyan-300",
    "AI": "bg-green-500/20 text-green-300",
    "RL": "bg-orange-500/20 text-orange-300",
  };

  return (
    <div className="w-full rounded-3xl border border-white/10 overflow-hidden"
      style={{ background: "linear-gradient(135deg,#0A1628 0%,#0D1F3C 100%)" }}>

      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <Calendar size={18} className="text-amber-400" />
          </div>
          <div>
            <h2 className="font-bold text-white">Conference Pulse</h2>
            <p className="text-xs text-white/40">Upcoming AI/ML conferences with deadlines</p>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-lg bg-green-500/10 border border-green-400/20 text-green-400">
            Live
          </span>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-white/20">
              {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button onClick={fetchConferences} disabled={loading}
            className="p-1.5 rounded-lg hover:bg-white/10 transition">
            <RefreshCw size={14} className={`text-white/40 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="p-6">
        {loading && conferences.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-10">
            <Loader size={24} className="animate-spin text-amber-400" />
            <p className="text-white/40 text-sm">Searching for upcoming conferences...</p>
          </div>
        )}

        {!loading && conferences.length === 0 && (
          <div className="text-center py-10">
            <AlertCircle size={32} className="text-white/20 mx-auto mb-2" />
            <p className="text-white/40 text-sm">Could not fetch conferences. Check connection.</p>
            <button onClick={fetchConferences} className="text-amber-400 text-sm mt-2 hover:underline">
              Retry
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {conferences.map((conf, i) => {
            const status = statusConfig[conf.status] || statusConfig.upcoming;
            return (
              <div key={i} className={`p-5 rounded-2xl border transition hover:-translate-y-0.5 ${status.bg}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-white">{conf.shortname}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-lg bg-white/10 ${status.color} font-medium`}>
                        {status.badge}
                      </span>
                    </div>
                    <p className="text-xs text-white/50 mt-0.5">{conf.name}</p>
                  </div>
                  {conf.url && (
                    <a href={conf.url} target="_blank" rel="noopener noreferrer"
                      className="p-1 rounded-lg hover:bg-white/10 transition text-white/30 hover:text-white">
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-white/60">
                    <Calendar size={11} className="text-white/30" />
                    {conf.date}
                    {conf.location && <span className="text-white/30">· {conf.location}</span>}
                  </div>
                  {conf.deadline && (
                    <div className="flex items-center gap-2 text-xs">
                      <Clock size={11} className="text-red-400" />
                      <span className="text-red-400 font-medium">Deadline: {conf.deadline}</span>
                    </div>
                  )}
                  {conf.topic && (
                    <div className="text-xs text-white/40 flex items-center gap-1">
                      <span>Focus:</span>
                      <span className={`px-1.5 py-0.5 rounded-lg ${fieldColors[conf.topic] || "bg-white/10 text-white/50"}`}>
                        {conf.topic}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Research Frontiers ───────────────────────────────────────
function ResearchFrontiers() {
  const [frontiers, setFrontiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchFrontiers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/research-frontiers`);
      const data = await res.json();
      if (data.frontiers?.length > 0) {
        setFrontiers(data.frontiers);
        setLastUpdated(new Date());
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFrontiers(); }, []);

  const fieldConfig = {
    "AI":  { color: "text-green-400",  bg: "bg-green-500/10  border-green-400/20"  },
    "ML":  { color: "text-cyan-400",   bg: "bg-cyan-500/10   border-cyan-400/20"   },
    "DL":  { color: "text-purple-400", bg: "bg-purple-500/10 border-purple-400/20" },
    "NLP": { color: "text-blue-400",   bg: "bg-blue-500/10   border-blue-400/20"   },
    "CV":  { color: "text-pink-400",   bg: "bg-pink-500/10   border-pink-400/20"   },
    "RL":  { color: "text-orange-400", bg: "bg-orange-500/10 border-orange-400/20" },
  };

  const impactConfig = {
    high:   { label: "High Impact", color: "text-amber-400",  bg: "bg-amber-500/10  border-amber-400/20"  },
    medium: { label: "Notable",     color: "text-white/50",   bg: "bg-white/5       border-white/10"      },
  };

  return (
    <div className="w-full rounded-3xl border border-white/10 overflow-hidden"
      style={{ background: "linear-gradient(135deg,#0A1628 0%,#0D1F3C 100%)" }}>

      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <Brain size={18} className="text-purple-400" />
          </div>
          <div>
            <h2 className="font-bold text-white">Research Frontiers</h2>
            <p className="text-xs text-white/40">
              Latest breakthroughs in AI · ML · DL — updated daily
            </p>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-lg bg-purple-500/10 border border-purple-400/20 text-purple-400">
            Daily
          </span>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-white/20">{lastUpdated.toLocaleTimeString()}</span>
          )}
          <button onClick={fetchFrontiers} disabled={loading}
            className="p-1.5 rounded-lg hover:bg-white/10 transition">
            <RefreshCw size={14} className={`text-white/40 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="p-6">
        {loading && frontiers.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-10">
            <Loader size={24} className="animate-spin text-purple-400" />
            <p className="text-white/40 text-sm">Fetching latest research breakthroughs...</p>
          </div>
        )}

        {!loading && frontiers.length === 0 && (
          <div className="text-center py-10">
            <AlertCircle size={32} className="text-white/20 mx-auto mb-2" />
            <p className="text-white/40 text-sm">Could not fetch research feed.</p>
            <button onClick={fetchFrontiers} className="text-purple-400 text-sm mt-2 hover:underline">
              Retry
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {frontiers.map((item, i) => {
            const field = fieldConfig[item.field] || fieldConfig["AI"];
            const impact = impactConfig[item.impact] || impactConfig.medium;
            return (
              <div key={i}
                className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all hover:-translate-y-0.5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-lg border font-medium ${field.bg} ${field.color}`}>
                    {item.field}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-lg border ${impact.bg} ${impact.color}`}>
                    {impact.label}
                  </span>
                </div>

                <div>
                  <p className="font-bold text-white text-sm leading-snug">{item.title}</p>
                  {item.date && (
                    <p className="text-xs text-white/30 mt-0.5 flex items-center gap-1">
                      <Clock size={10} /> {item.date}
                    </p>
                  )}
                </div>

                <p className="text-xs text-white/60 leading-relaxed">{item.achievement}</p>

                <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                  <Users size={12} className="text-white/30 flex-shrink-0" />
                  <p className="text-xs text-white/40 truncate">{item.authors}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Research Assistant ───────────────────────────────────────
function ResearchAssistant() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Welcome to Repos AI Research Assistant. I can help you with research questions, explain ML concepts, suggest models, review your experiments, or find relevant papers. What would you like to explore?"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text) => {
    const query = text || input;
    if (!query.trim() || loading) return;

    const userMsg = { role: "user", text: query };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
     const res = await fetch(`${import.meta.env.VITE_API_URL}/research-assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          history: newMessages.slice(-8)
        })
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        role: "assistant",
        text: data.response || "Could not generate a response."
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        text: "Connection failed. Make sure the backend is running on port 8000."
      }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "What is the difference between Random Forest and Gradient Boosting?",
    "Which model performed best in my experiments?",
    "Explain transformer architecture",
    "What should I try to improve accuracy?",
    "Latest trends in large language models",
    "Suggest a model for image classification"
  ];

  const formatText = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.*)/gm, '• $1')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className="w-full rounded-3xl border border-white/10 overflow-hidden"
      style={{ background: "linear-gradient(135deg,#0A1628 0%,#0D1F3C 100%)" }}>

      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 flex items-center justify-center">
            <MessageSquare size={18} className="text-cyan-400" />
          </div>
          <div>
            <h2 className="font-bold text-white">Research Assistant</h2>
            <p className="text-xs text-white/40">
              Ask anything — concepts, papers, models, your experiments
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green-500/10 border border-green-400/20">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-green-400">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="h-80 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                <Brain size={14} className="text-cyan-400" />
              </div>
            )}
            <div
              className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-cyan-500/20 text-white border border-cyan-400/20 rounded-br-sm"
                  : "bg-white/5 text-white/80 border border-white/10 rounded-bl-sm"
              }`}
              dangerouslySetInnerHTML={{ __html: formatText(msg.text) }}
            />
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-7 h-7 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
              <Brain size={14} className="text-cyan-400" />
            </div>
            <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-2">
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
              <span className="text-xs text-white/40">Researching...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length === 1 && (
        <div className="px-6 pb-4">
          <p className="text-xs text-white/30 mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => sendMessage(s)}
                className="text-xs px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-400/30 hover:text-cyan-300 text-white/50 transition text-left"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-white/10 flex gap-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && sendMessage()}
          placeholder="Ask about ML concepts, your experiments, papers..."
          className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-cyan-400 transition text-sm text-white placeholder:text-white/30"
        />
        <button
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          className="px-4 py-3 rounded-xl bg-cyan-500/20 border border-cyan-400/30 hover:bg-cyan-500/30 transition disabled:opacity-40 flex items-center gap-2"
        >
          <Send size={16} className="text-cyan-400" />
        </button>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────
function Dashboard() {
  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 20% 20%,#0D1F3C 0%,#050B18 60%,#0A0A1A 100%)" }}
    >
      <ParticleUniverse />

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] rounded-full blur-[200px] opacity-8 pointer-events-none"
        style={{ background: "radial-gradient(circle,#00D4FF,#7C3AED)" }} />

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 py-8 space-y-6">

        {/* 1. Welcome */}
        <WelcomeHero />

        {/* 2. Conference Pulse — full width */}
        <ConferencePulse />

        {/* 3. Research Frontiers — full width */}
        <ResearchFrontiers />

        {/* 4. Research Assistant — full width */}
        <div className="pb-10">
          <ResearchAssistant />
        </div>

      </div>
    </div>
  );
}

export default Dashboard;