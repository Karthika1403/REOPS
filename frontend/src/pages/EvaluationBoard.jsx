import { API_URL } from "../config";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  Trash2,
  RefreshCw,
  BarChart3,
  Clock,
  Database,
  Cpu,
  Award,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

function EvaluationBoard() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRuns, setSelectedRuns] = useState([]);
  const [expandedRun, setExpandedRun] = useState(null);
  const [filterTask, setFilterTask] = useState("all");
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportResult, setReportResult] = useState(null);

  const fetchRuns = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/models/runs`);
      const data = await res.json();
      setRuns(data.runs || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  const handleDelete = async (runId, e) => {
    e.stopPropagation();

    if (!confirm("Delete this run?")) return;

    await fetch(`${API_URL}/models/runs/${runId}`, {
      method: "DELETE",
    });

    fetchRuns();
    setSelectedRuns((prev) => prev.filter((id) => id !== runId));
  };

  const toggleCompare = (runId, e) => {
    e.stopPropagation();

    setSelectedRuns((prev) =>
      prev.includes(runId)
        ? prev.filter((id) => id !== runId)
        : prev.length < 4
        ? [...prev, runId]
        : prev
    );
  };

  const handleGenerateReport = async () => {
    if (selectedRuns.length === 0) return;

    setGeneratingReport(true);
    setReportResult(null);

    try {
      const res = await fetch(`${API_URL}/reports/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          run_ids: selectedRuns,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setReportResult(data.report);
      } else {
        alert(`Report generation failed: ${data.error}`);
      }
    } finally {
      setGeneratingReport(false);
    }
  };

  const formatDate = (ts) => {
    return new Date(ts * 1000).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const taskColor = {
    classification: "purple",
    regression: "green",
    clustering: "cyan",
  };

  const filteredRuns =
    filterTask === "all"
      ? runs
      : runs.filter((r) => r.task_type === filterTask);

  const compareRuns = runs.filter((r) => selectedRuns.includes(r.id));

  const getPrimaryMetric = (run) => {
    if (run.task_type === "classification")
      return {
        key: "accuracy",
        value: run.metrics.accuracy,
      };

    if (run.task_type === "regression")
      return {
        key: "r2_score",
        value: run.metrics.r2_score,
      };

    if (run.task_type === "clustering")
      return {
        key: "silhouette_score",
        value: run.metrics.silhouette_score,
      };

    return null;
  };

  const bestRunId = (() => {
    if (filteredRuns.length === 0) return null;

    let best = filteredRuns[0];
    let bestMetric = getPrimaryMetric(best);

    for (const run of filteredRuns) {
      const metric = getPrimaryMetric(run);

      if (metric && bestMetric && metric.value > bestMetric.value) {
        best = run;
        bestMetric = metric;
      }
    }

    return best.id;
  })();

return (
  <div
    className="min-h-screen relative overflow-hidden text-white"
    style={{
      background:
        "radial-gradient(circle at center, #0f172a 0%, #020617 100%)",
    }}
  >
    <div className="relative z-10 max-w-[1300px] mx-auto px-6 py-10">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-8">

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center">
            <TrendingUp size={26} className="text-green-400" />
          </div>

          <div>
            <h1 className="text-3xl font-bold text-white">
              Evaluation Board
            </h1>

            <p className="text-slate-400 text-sm mt-1">
              {runs.length} Experiment{runs.length !== 1 ? "s" : ""} Available
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">

          <Link
            to="/model-lab"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/20 border border-purple-400/30 hover:bg-purple-500/30 transition"
          >
            <Cpu size={16} />
            <span>New Experiment</span>
          </Link>

          <button
            onClick={fetchRuns}
            disabled={loading}
            className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition disabled:opacity-50"
          >
            <RefreshCw
              size={18}
              className={loading ? "animate-spin" : ""}
            />
          </button>

        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-3 mb-8">
        {["all", "classification", "regression", "clustering"].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterTask(tab)}
            className={`px-4 py-2 rounded-xl capitalize text-sm font-medium transition ${
              filterTask === tab
                ? "bg-green-500/30 border border-green-400/40 text-green-300"
                : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

{selectedRuns.length > 0 && (
  <div className="mb-6 p-5 rounded-2xl bg-cyan-500/5 border border-cyan-400/20">
    <div className="flex items-center justify-between mb-4">
      <p className="text-sm font-semibold flex items-center gap-2">
        <BarChart3 size={16} className="text-cyan-400" />
        Comparing {selectedRuns.length} run
        {selectedRuns.length > 1 ? "s" : ""}
      </p>

      <div className="flex items-center gap-2">
        <button
          onClick={handleGenerateReport}
          disabled={generatingReport}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 transition text-sm font-medium disabled:opacity-50"
        >
          {generatingReport ? "Generating..." : "Generate Report"}
        </button>

        <button
          onClick={() => setSelectedRuns([])}
          className="text-xs text-white/40 hover:text-white"
        >
          Clear
        </button>
      </div>
    </div>

    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left p-2 text-white/40">Model</th>
            <th className="text-left p-2 text-white/40">Dataset</th>

            {compareRuns.length > 0 &&
              Object.keys(compareRuns[0].metrics || {}).map((metric) => (
                <th
                  key={metric}
                  className="text-left p-2 text-white/40 capitalize"
                >
                  {metric.replaceAll("_", " ")}
                </th>
              ))}
          </tr>
        </thead>

        <tbody>
          {compareRuns.map((run) => (
            <tr key={run.id} className="border-b border-white/5">
              <td className="p-2 font-medium">{run.model_name}</td>

              <td className="p-2 text-white/50">
                {run.dataset_id}
              </td>

              {Object.entries(run.metrics || {}).map(([key, value]) => (
                <td
                  key={key}
                  className="p-2 text-cyan-300 font-semibold"
                >
                  {value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)}

{reportResult && (
  <div className="mb-6 p-5 rounded-2xl bg-green-500/10 border border-green-400/20 flex items-center justify-between">
    <div>
      <p className="text-sm font-semibold text-green-300">
        Report generated successfully
      </p>
      <p className="text-xs text-white/40 mt-1">
        Includes: {reportResult.models_included.join(", ")}
      </p>
    </div>

    <a
      href={`${API_URL}/reports/${reportResult.id}/download`}
      download
      className="px-4 py-2 rounded-xl bg-green-500/20 border border-green-400/30 hover:bg-green-500/30 transition text-sm"
    >
      Download PDF
    </a>
  </div>
)}

<div className="space-y-3">
  {loading && (
    <p className="text-white/40 text-sm text-center py-12">
      Loading experiments...
    </p>
  )}

  {!loading && filteredRuns.length === 0 && (
    <div className="text-center py-16">
      <TrendingUp size={48} className="text-white/10 mx-auto mb-3" />
      <p className="text-white/40">No experiments yet.</p>

      <Link
        to="/model-lab"
        className="text-purple-400 text-sm mt-2 inline-block"
      >
        Run your first experiment
      </Link>
    </div>
  )}

  {filteredRuns.map((run) => {
    const isExpanded = expandedRun === run.id;
    const isSelected = selectedRuns.includes(run.id);
    const isBest = run.id === bestRunId && filteredRuns.length > 1;

    const colorClasses = {
      classification: {
        badge: "bg-purple-500/20 text-purple-300",
        icon: "bg-purple-500/20 text-purple-400",
      },
      regression: {
        badge: "bg-green-500/20 text-green-300",
        icon: "bg-green-500/20 text-green-400",
      },
      clustering: {
        badge: "bg-cyan-500/20 text-cyan-300",
        icon: "bg-cyan-500/20 text-cyan-400",
      },
    };

    const colors =
      colorClasses[run.task_type] || {
        badge: "bg-white/10 text-white",
        icon: "bg-white/10 text-white",
      };

    return (
      <div
        key={run.id}
        onClick={() => setExpandedRun(isExpanded ? null : run.id)}
        className={`p-5 rounded-2xl border cursor-pointer transition-all ${
          isSelected
            ? "bg-cyan-500/10 border-cyan-400/30"
            : isBest
            ? "bg-yellow-500/5 border-yellow-400/30"
            : "bg-slate-900/40 border-white/10 hover:border-white/20"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colors.icon}`}
            >
              <Cpu size={18} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-bold">{run.model_name}</p>

                {isBest && (
                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg bg-yellow-500/20 text-yellow-300">
                    <Award size={10} />
                    Best
                  </span>
                )}

                <span
                  className={`text-xs px-2 py-0.5 rounded-lg capitalize ${colors.badge}`}
                >
                  {run.task_type}
                </span>
              </div>

              <div className="flex items-center gap-3 mt-1.5 text-xs text-white/40">
                <span className="flex items-center gap-1">
                  <Database size={10} />
                  {run.dataset_id}
                </span>

                <span className="flex items-center gap-1">
                  <Clock size={10} />
                  {formatDate(run.created_at)}
                </span>

                <span>{run.duration_seconds}s</span>
              </div>

              <div className="flex gap-3 mt-3 flex-wrap">
                {Object.entries(run.metrics)
                  .slice(0, 4)
                  .map(([k, v]) => (
                    <div
                      key={k}
                      className="px-3 py-1.5 rounded-lg bg-white/5 text-xs"
                    >
                      <span className="text-white/40 capitalize">
                        {k.replaceAll("_", " ")}:
                      </span>{" "}
                      <span className="text-white font-semibold">{v}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={(e) => toggleCompare(run.id, e)}
              className={`px-3 py-1.5 rounded-lg text-xs transition ${
                isSelected
                  ? "bg-cyan-500/30 text-cyan-300"
                  : "bg-white/5 text-white/40 hover:text-white"
              }`}
            >
              {isSelected ? "Selected" : "Compare"}
            </button>

            <button
              onClick={(e) => handleDelete(run.id, e)}
              className="p-2 rounded-lg hover:bg-red-500/20 transition text-white/40 hover:text-red-400"
            >
              <Trash2 size={14} />
            </button>

            {isExpanded ? (
              <ChevronUp size={16} className="text-white/40" />
            ) : (
              <ChevronDown size={16} className="text-white/40" />
            )}
          </div>
        </div>

        {isExpanded && (
          <div className="mt-5 pt-5 border-t border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Hyperparameters */}
              <div>
                <p className="text-xs text-white/30 mb-2">
                  Hyperparameters
                </p>

                <div className="space-y-1">
                  {(!run.hyperparams ||
                    Object.keys(run.hyperparams).length === 0) ? (
                    <p className="text-xs text-white/30">
                      Default settings
                    </p>
                  ) : (
                    Object.entries(run.hyperparams).map(([key, value]) => (
                      <p
                        key={key}
                        className="text-xs text-white/60"
                      >
                        <span className="text-white/30 capitalize">
                          {key.replaceAll("_", " ")}:
                        </span>{" "}
                        {String(value)}
                      </p>
                    ))
                  )}
                </div>
              </div>

              {/* Dataset Info */}
              <div>
                <p className="text-xs text-white/30 mb-2">
                  Dataset Info
                </p>

                <p className="text-xs text-white/60">
                  {run.n_samples} samples · {run.n_features} features
                </p>

                {run.target_column && (
                  <p className="text-xs text-white/60 mt-1">
                    Target: {run.target_column}
                  </p>
                )}
              </div>
            </div>

            {/* Confusion Matrix */}
            {run.artifacts?.confusion_matrix && (
              <div className="mt-4">
                <p className="text-xs text-white/30 mb-2">
                  Confusion Matrix
                </p>

                <div className="inline-block rounded-lg overflow-hidden border border-white/10">
                  {run.artifacts.confusion_matrix.map((row, rowIndex) => {
                    const maxValue = Math.max(...row, 1);

                    return (
                      <div key={rowIndex} className="flex">
                        {row.map((value, colIndex) => (
                          <div
                            key={`${rowIndex}-${colIndex}`}
                            className="w-12 h-12 flex items-center justify-center border border-white/10 text-xs"
                            style={{
                              backgroundColor: `rgba(34,211,238,${
                                (value / maxValue) * 0.5
                              })`,
                            }}
                          >
                            {value}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  })}
</div>

      </div>
    </div>
  );
}

export default EvaluationBoard;