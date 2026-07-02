import { Link, useLocation } from "react-router-dom";
import {
  Cpu, LayoutDashboard, FlaskConical,
  TrendingUp, Database, Menu, X
} from "lucide-react";
import { useState } from "react";

const NAV_LINKS = [
  { path: "/", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
  { path: "/research-lab", label: "Research Lab", icon: <FlaskConical size={16} /> },
  { path: "/model-lab", label: "Model Lab", icon: <Cpu size={16} /> },
  { path: "/evaluation-board", label: "Evaluation Board", icon: <TrendingUp size={16} /> },
];

function NavBar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-[1700px] mx-auto px-6 py-3 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
            <Cpu size={16} className="text-white" />
          </div>
          <span className="font-bold text-white text-lg">REOPS AI</span>
          <span className="text-xs px-2 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-400/20">
            AI
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${
                  isActive
                    ? "bg-white/10 text-white font-medium"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green-500/10 border border-green-400/20">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-green-400">System Online</span>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-xl hover:bg-white/10 transition text-white"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-black/60 backdrop-blur-xl">
          {NAV_LINKS.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-6 py-4 text-sm border-b border-white/5 transition ${
                  isActive
                    ? "text-white bg-white/5"
                    : "text-white/50 hover:text-white"
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}

export default NavBar;