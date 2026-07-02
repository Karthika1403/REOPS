import { API_URL } from "../config";
import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Cpu,
  Database,
  Play,
  Loader,
  CheckCircle,
  ChevronRight,
  BarChart3,
  Sparkles,
  Layers,
  GitMerge,
  Zap,
  Info,
  TrendingUp,
  Award,
  X,
} from "lucide-react";

const EXPERIMENT_MODES = [
  {
    id: "single",
    icon: <Cpu size={24} />,
    title: "Single Model",
    subtitle: "Train one model and analyze its performance",
    color: "blue",
    tag: "Best for beginners",
  },
  {
    id: "compare",
    icon: <Layers size={24} />,
    title: "Compare Models",
    subtitle: "Run multiple models side-by-side to find the best one",
    color: "purple",
    tag: "Most popular",
  },
  {
    id: "ensemble",
    icon: <GitMerge size={24} />,
    title: "Ensemble",
    subtitle: "Combine multiple models to achieve higher accuracy",
    color: "cyan",
    tag: "Advanced",
  },
  {
    id: "optimize",
    icon: <Zap size={24} />,
    title: "Optimize",
    subtitle: "Apply feature selection and cross-validation for best results",
    color: "green",
    tag: "Pro",
  },
];

const COLOR_MAP = {
  blue: {
    bg: "bg-blue-500/20",
    border: "border-blue-400/40",
    text: "text-blue-400",
  },
  purple: {
    bg: "bg-purple-500/20",
    border: "border-purple-400/40",
    text: "text-purple-400",
  },
  cyan: {
    bg: "bg-cyan-500/20",
    border: "border-cyan-400/40",
    text: "text-cyan-400",
  },
  green: {
    bg: "bg-green-500/20",
    border: "border-green-400/40",
    text: "text-green-400",
  },
};

function Tooltip({ text }) {
  const [show, setShow] = useState(false);

  return (
    <span className="relative inline-block ml-1">
      <Info
        size={13}
        className="text-white/30 hover:text-white/60 cursor-help"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      />

      {show && (
        <span className="absolute left-5 top-0 z-50 w-48 p-2 rounded-xl bg-slate-800 border border-white/10 text-xs text-white/70 shadow-xl">
          {text}
        </span>
      )}
    </span>
  );
}

function MetricCard({ label, value, highlight }) {
  return (
    <div
      className={`p-4 rounded-2xl text-center border ${
        highlight
          ? "bg-purple-500/20 border-purple-400/30"
          : "bg-white/5 border-white/10"
      }`}
    >
      <div
        className={`text-2xl font-bold ${
          highlight ? "text-purple-300" : "text-white"
        }`}
      >
        {value}
      </div>

      <div className="text-xs text-white/40 mt-1 capitalize">
        {label.replaceAll("_", " ")}
      </div>
    </div>
  );
}

function ModelLab() {
  const [step, setStep] = useState(1);
  const [allDatasets, setAllDatasets] = useState({
    builtin: [],
    imported: [],
  });

  const [selectedDataset, setSelectedDataset] = useState(null);
  const [datasetColumns, setDatasetColumns] = useState(null);
  const [targetColumn, setTargetColumn] = useState(null);
  const [taskType, setTaskType] = useState(null);

  const [experimentMode, setExperimentMode] = useState(null);
  const [models, setModels] = useState([]);
  const [selectedModels, setSelectedModels] = useState([]);

  const [ensembleMethod, setEnsembleMethod] = useState("voting");
  const [useCV, setUseCV] = useState(true);
  const [cvFolds, setCvFolds] = useState(5);
  const [featureSelection, setFeatureSelection] = useState(null);

  const [training, setTraining] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Load datasets
  useEffect(() => {
    fetch(`${API_URL}/datasets/all`)
      .then((res) => res.json())
      .then((data) => setAllDatasets(data))
      .catch(console.error);
  }, []);

  // Load dataset columns
  useEffect(() => {
    if (!selectedDataset) return;

    fetch(`${API_URL}/models/dataset-columns/${selectedDataset}`)
      .then((res) => res.json())
      .then((data) => {
        setDatasetColumns(data);
        setTargetColumn(data.suggested_target);
      })
      .catch(console.error);
  }, [selectedDataset]);

  // Load model catalog
  useEffect(() => {
    if (!taskType) return;

    fetch(`${API_URL}/models/catalog?task=${taskType}`)
      .then((res) => res.json())
      .then((data) => setModels(data.models || []))
      .catch(console.error);
  }, [taskType]);

  // AI Suggestions
  const fetchAiSuggestions = async () => {
    if (!selectedDataset || !targetColumn || !taskType) return;

    setLoadingSuggestions(true);

    try {
      const res = await fetch(
        `${API_URL}/models/suggest?dataset_id=${selectedDataset}&target_column=${targetColumn}&task_type=${taskType}`
      );

      const data = await res.json();

      setAiSuggestions(data);

      if (data.suggestions?.length > 0) {
        setSelectedModels(
          data.suggestions.map((suggestion) => suggestion.model_id)
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

const toggleModel = (modelId) => {
  setSelectedModels((prev) =>
    prev.includes(modelId)
      ? prev.filter((id) => id !== modelId)
      : experimentMode === "single"
      ? [modelId]
      : [...prev, modelId]
  );
};

const handleTrain = async () => {
  setTraining(true);
  setError(null);
  setResults(null);

  try {
    let url = "";
    let body = {};

    if (experimentMode === "ensemble") {
      url = `${API_URL}/models/train-ensemble`;

      body = {
        dataset_id: selectedDataset,
        model_ids: selectedModels,
        target_column: taskType !== "clustering" ? targetColumn : null,
        task_type: taskType,
        ensemble_method: ensembleMethod,
        feature_selection: featureSelection,
      };
    } else if (experimentMode === "single") {
      url = `${API_URL}/models/train-multiple`;

      body = {
        dataset_id: selectedDataset,
        model_ids: selectedModels,
        target_column: taskType !== "clustering" ? targetColumn : null,
        task_type: taskType,
        use_cross_validation: false,
        feature_selection: featureSelection,
      };
    } else {
      url = `${API_URL}/models/train-multiple`;

      body = {
        dataset_id: selectedDataset,
        model_ids: selectedModels,
        target_column: taskType !== "clustering" ? targetColumn : null,
        task_type: taskType,
        use_cross_validation: useCV,
        cv_folds: cvFolds,
        feature_selection: featureSelection,
      };
    }

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (data.success) {
      setResults(data.runs);
      setStep(5);
    } else {
      setError(data.error || "Training failed.");
    }
  } catch (err) {
    console.error(err);
    setError("Unable to connect to the backend server.");
  } finally {
    setTraining(false);
  }
};

const allDatasetsList = [
  ...allDatasets.builtin.map((d) => ({ ...d })),
  ...allDatasets.imported.map((d) => ({ ...d })),
];

const STEPS = [
  "Dataset",
  "Target",
  "Mode",
  "Configure",
  "Results",
];

return (
  <div
    className="min-h-screen text-white"
    style={{
      background:
        "radial-gradient(ellipse at top,#0f0c29,#302b63,#24243e)",
    }}
  >
    <div className="max-w-[1300px] mx-auto px-6 py-10">

      {/* Step Indicator */}
      <div className="flex items-center gap-1 mb-8 overflow-x-auto">
        {STEPS.map((stepName, index) => (
          <div
            key={stepName}
            className="flex items-center gap-1 flex-shrink-0"
          >
            <div
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                step === index + 1
                  ? "bg-purple-500/30 border border-purple-400/40 text-purple-300"
                  : step > index + 1
                  ? "text-green-400"
                  : "text-white/20"
              }`}
            >
              {step > index + 1 ? "✓ " : `${index + 1}. `}
              {stepName}
            </div>

            {index < STEPS.length - 1 && (
              <ChevronRight
                size={12}
                className="text-white/20"
              />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-400/20 text-red-300 text-sm flex items-start gap-3">
          <X size={16} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

        {/* STEP 1: Dataset */}
        {step === 1 && (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Choose a Dataset</h1>
              <p className="text-white/40">Select from built-in datasets or your imported ones to begin your experiment.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allDatasetsList.map((ds, i) => (
                <button
                  key={i}
                  onClick={() => { setSelectedDataset(ds.id); setStep(2); }}
                  className="text-left p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-400/40 hover:bg-purple-500/5 transition group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition">
                      <Database size={18} className="text-purple-400" />
                    </div>
                    {ds.task_type && (
                      <span className={`text-xs px-2 py-1 rounded-lg ${
                        ds.task_type === "classification"
                          ? "bg-purple-500/20 text-purple-300"
                          : "bg-green-500/20 text-green-300"
                      }`}>
                        {ds.task_type}
                      </span>
                    )}
                  </div>
                  <p className="font-bold group-hover:text-purple-300 transition">{ds.name}</p>
                  <p className="text-xs text-white/30 mt-1">
                    {ds.n_rows?.toLocaleString()} rows · {ds.n_cols} features
                  </p>
                  {ds.description && (
                    <p className="text-xs text-white/40 mt-2 line-clamp-2">{ds.description}</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: Target + Task */}
        {step === 2 && datasetColumns && (
          <div className="max-w-2xl">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Define Your Goal</h1>
              <p className="text-white/40">Tell the system what you want to predict and what kind of problem this is.</p>
            </div>

            <div className="mb-6 p-5 rounded-2xl bg-white/5 border border-white/10">
              <label className="text-xs text-white/40 mb-2 block font-medium uppercase tracking-wider">
                Target Column
                <Tooltip text="This is the variable your model will learn to predict. Usually the last column in the dataset." />
              </label>
              <select
                value={targetColumn || ""}
                onChange={(e) => setTargetColumn(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 outline-none focus:border-purple-400 text-sm"
              >
                {datasetColumns.columns.map((col, i) => (
                  <option key={i} value={col}>{col} ({datasetColumns.dtypes[col]})</option>
                ))}
              </select>
            </div>

            {datasetColumns?.suggested_task && (
              <div className="mb-4 flex items-center gap-2 text-sm text-cyan-400">
                <Sparkles size={14} />
                AI recommends <span className="font-bold capitalize ml-1">{datasetColumns.suggested_task}</span>
              </div>
            )}

            <label className="text-xs text-white/40 mb-3 block font-medium uppercase tracking-wider">
              Task Type
              <Tooltip text="Classification predicts categories. Regression predicts numbers. Clustering finds hidden groups." />
            </label>
            <div className="grid grid-cols-3 gap-3 mb-8">
              {[
                { id: "classification", label: "Classification", desc: "Predict a category or label", icon: "🏷️" },
                { id: "regression", label: "Regression", desc: "Predict a number or quantity", icon: "📈" },
                { id: "clustering", label: "Clustering", desc: "Discover hidden groups in data", icon: "🔵" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setTaskType(t.id); setStep(3); }}
                  className={`p-4 rounded-2xl border transition text-left ${
                    datasetColumns?.suggested_task === t.id
                      ? "bg-cyan-500/20 border-cyan-400/40"
                      : "bg-white/5 border-white/10 hover:border-purple-400/40"
                  }`}
                >
                  <span className="text-2xl">{t.icon}</span>
                  <p className="font-bold text-sm mt-2">{t.label}</p>
                  <p className="text-xs text-white/30 mt-1">{t.desc}</p>
                  {datasetColumns?.suggested_task === t.id && (
                    <span className="text-xs text-cyan-400 mt-2 block">
                      ✦ Recommended
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: Experiment Mode */}
        {step === 3 && (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Choose Experiment Mode</h1>
              <p className="text-white/40">Select how you want to run your experiment. Start with Single Model if you are new.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
              {EXPERIMENT_MODES.map((mode) => {
                const colors = COLOR_MAP[mode.color];
                return (
                  <button
                    key={mode.id}
                    onClick={() => { setExperimentMode(mode.id); setStep(4); fetchAiSuggestions(); }}
                    className={`text-left p-6 rounded-2xl border transition-all hover:-translate-y-1 ${colors.bg} ${colors.border}`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center ${colors.text}`}>
                        {mode.icon}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-lg bg-white/10 ${colors.text}`}>
                        {mode.tag}
                      </span>
                    </div>
                    <p className="font-bold text-lg">{mode.title}</p>
                    <p className="text-sm text-white/50 mt-1">{mode.subtitle}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

{/* STEP 3: Experiment Mode */}
{step === 3 && (
  <div>
    <div className="mb-8">
      <h1 className="text-3xl font-bold mb-2">
        Choose Experiment Mode
      </h1>
      <p className="text-white/40">
        Select how you want to run your experiment. Start with Single Model if you are new.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
      {EXPERIMENT_MODES.map((mode) => {
        const colors = COLOR_MAP[mode.color];

        return (
          <button
            key={mode.id}
            onClick={() => {
              setExperimentMode(mode.id);
              setStep(4);

              setTimeout(() => {
                fetchAiSuggestions();
              }, 0);
            }}
            className={`text-left p-6 rounded-2xl border transition-all hover:-translate-y-1 ${colors.bg} ${colors.border}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center ${colors.text}`}
              >
                {mode.icon}
              </div>

              <span
                className={`text-xs px-2 py-1 rounded-lg bg-white/10 ${colors.text}`}
              >
                {mode.tag}
              </span>
            </div>

            <p className="font-bold text-lg">{mode.title}</p>

            <p className="text-sm text-white/50 mt-1">
              {mode.subtitle}
            </p>
          </button>
        );
      })}
    </div>
  </div>
)}

{/* STEP 4: Configure */}
{step === 4 && (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <div className="lg:col-span-2">

      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">
          Configure Experiment
        </h1>

        <p className="text-white/40 text-sm">
          {experimentMode === "single" &&
            "Pick one model to train."}

          {experimentMode === "compare" &&
            "Select 2 or more models to compare side by side."}

          {experimentMode === "ensemble" &&
            "Select models to combine into one powerful ensemble."}

          {experimentMode === "optimize" &&
            "Select models and configure optimization techniques."}
        </p>
      </div>

      {loadingSuggestions && (
        <div className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3 text-sm text-white/40">
          <Loader size={14} className="animate-spin text-purple-400" />
          AI is analyzing your dataset...
        </div>
      )}

      {aiSuggestions?.suggestions?.length > 0 && (
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-400/20">

          <p className="text-sm font-semibold flex items-center gap-2 mb-3">
            <Sparkles size={14} className="text-purple-400" />
            AI Recommendations for your dataset
          </p>

          <div className="space-y-2">
            {aiSuggestions.suggestions.map((suggestion, index) => (
              <div
                key={suggestion.model_id}
                className="flex items-start gap-3 text-xs"
              >
                <span className="text-purple-400 font-bold flex-shrink-0">
                  {index + 1}.
                </span>

                <div>
                  <span className="text-white font-medium">
                    {models.find(
                      (m) => m.id === suggestion.model_id
                    )?.name || suggestion.model_id}
                  </span>

                  <span className="text-white/40 ml-2">
                    — {suggestion.reason}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {aiSuggestions.ensemble_tip && (
            <p className="text-xs text-cyan-300 mt-3 pt-3 border-t border-white/10">
              {aiSuggestions.ensemble_tip}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {models.map((model) => {
          const isSelected = selectedModels.includes(model.id);
          const isSuggested = aiSuggestions?.suggestions?.some(
            (s) => s.model_id === model.id
          );

          return (
            <button
              key={model.id}
              onClick={() => toggleModel(model.id)}
              className={`text-left p-4 rounded-2xl border transition-all ${
                isSelected
                  ? "bg-purple-500/20 border-purple-400/50 ring-1 ring-purple-400/30"
                  : "bg-white/5 border-white/10 hover:border-purple-400/30"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-sm">
                  {model.name}
                </p>

                <div className="flex items-center gap-1">
                  {isSuggested && (
                    <Sparkles
                      size={12}
                      className="text-purple-400"
                    />
                  )}

                  {isSelected && (
                    <CheckCircle
                      size={14}
                      className="text-purple-400"
                    />
                  )}
                </div>
              </div>

              <p className="text-xs text-white/40">
                {model.description}
              </p>
            </button>
          );
        })}
      </div>

    </div>

    {/* Right Panel */}
    <div className="space-y-4">

      <div className="p-5 rounded-2xl bg-white/5 border border-white/10">

        <p className="text-sm font-semibold mb-3">
          Selected ({selectedModels.length})
        </p>

        {selectedModels.length === 0 ? (
          <p className="text-xs text-white/30">
            No models selected yet
          </p>
        ) : (
          <div className="space-y-2">
            {selectedModels.map((id) => (
              <div
                key={id}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-white/70">
                  {models.find((m) => m.id === id)?.name || id}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleModel(id);
                  }}
                  className="text-white/30 hover:text-red-400"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

              {experimentMode === "ensemble" && (
                <div className="p-5 rounded-2xl bg-cyan-500/5 border border-cyan-400/20">
                  <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <GitMerge size={14} className="text-cyan-400" />
                    Ensemble Method
                    <Tooltip text="Voting: each model votes. Stacking: a meta-model learns from all predictions." />
                  </p>
                  {[
                    { id: "voting", label: "Hard Voting", desc: "Majority vote wins" },
                    { id: "soft_voting", label: "Soft Voting", desc: "Weighted probability average" },
                    { id: "stacking", label: "Stacking", desc: "Meta-model learns from all (most powerful)" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setEnsembleMethod(m.id)}
                      className={`w-full text-left p-3 rounded-xl mb-2 border transition text-xs ${
                        ensembleMethod === m.id
                          ? "bg-cyan-500/20 border-cyan-400/40 text-cyan-300"
                          : "bg-white/5 border-white/10 text-white/50"
                      }`}
                    >
                      <p className="font-semibold">{m.label}</p>
                      <p className="text-white/30 mt-0.5">{m.desc}</p>
                    </button>
                  ))}
                </div>
              )}

              {(experimentMode === "optimize" || experimentMode === "compare") && (
  <div className="p-5 rounded-2xl bg-green-500/5 border border-green-400/20">
    <p className="text-sm font-semibold mb-3 flex items-center gap-2">
      <Zap size={14} className="text-green-400" />
      Optimization
    </p>

    <div className="flex items-center justify-between mb-3">
      <div>
        <p className="text-xs font-medium">
          Cross-Validation
          <Tooltip text="Trains on different data portions multiple times for more reliable accuracy." />
        </p>
        <p className="text-xs text-white/30">
          More reliable evaluation
        </p>
      </div>

      <button
        type="button"
        onClick={() => setUseCV((prev) => !prev)}
        className={`w-10 h-5 rounded-full transition relative ${
          useCV ? "bg-green-500" : "bg-white/20"
        }`}
      >
        <div
          className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${
            useCV ? "left-5" : "left-0.5"
          }`}
        />
      </button>
    </div>

    {useCV && (
      <div className="mb-4">
        <p className="text-xs text-white/40 mb-1">
          CV Folds: {cvFolds}
          <Tooltip text="Number of times data is split and trained. 5 is standard." />
        </p>

        <input
          type="range"
          min="3"
          max="10"
          value={cvFolds}
          onChange={(e) => setCvFolds(Number(e.target.value))}
          className="w-full accent-green-400"
        />
      </div>
    )}

    <div>
      <p className="text-xs font-medium mb-1">
        Feature Selection
        <Tooltip text="Selects only the most important features to reduce noise and improve accuracy." />
      </p>

      <select
        value={featureSelection ?? ""}
        onChange={(e) =>
          setFeatureSelection(
            e.target.value ? Number(e.target.value) : null
          )
        }
        className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/10 text-xs outline-none focus:border-green-400"
      >
        <option value="">Use all features</option>
        <option value="3">Top 3 features</option>
        <option value="5">Top 5 features</option>
        <option value="10">Top 10 features</option>
      </select>
    </div>
  </div>
)}

<button
  type="button"
  onClick={handleTrain}
  disabled={training || selectedModels.length === 0}
  className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition ${
    training || selectedModels.length === 0
      ? "bg-gray-600 cursor-not-allowed opacity-50"
      : "bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400"
  }`}
>
  {training ? (
    <>
      <Loader size={16} className="animate-spin" />
      Training {selectedModels.length} model
      {selectedModels.length > 1 ? "s" : ""}...
    </>
  ) : (
    <>
      <Play size={16} />
      Run Experiment
    </>
  )}
</button>

</div>
</div>
)}

        {/* STEP 5: Results */}
        {step === 5 && results && (
          <div>
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Experiment Results</h1>
                <p className="text-white/40 text-sm">
                  {results.length} model{results.length > 1 ? "s" : ""} trained
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setStep(4); setResults(null); }}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm"
                >
                  Adjust and Retrain
                </button>
                <Link
                  to="/evaluation-board"
                  className="px-4 py-2 rounded-xl bg-purple-500/20 border border-purple-400/30 hover:bg-purple-500/30 transition text-sm flex items-center gap-2"
                >
                  <TrendingUp size={14} /> View All Runs
                </Link>
              </div>
            </div>

            {results.length > 1 && (() => {
              const primaryKey = results[0].task_type === "classification" ? "accuracy" : "r2_score";
              const best = [...results].sort((a, b) =>
                (b.metrics[primaryKey] || 0) - (a.metrics[primaryKey] || 0)
              )[0];
              return (
                <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-400/20 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                    <Award size={24} className="text-yellow-400" />
                  </div>
                  <div>
                    <p className="font-bold text-yellow-300">Best Performing Model</p>
                    <p className="text-sm text-white/60 mt-0.5">
                      <span className="text-white font-medium">{best.model_name}</span>
                      {" "}achieved {primaryKey.replaceAll("_", " ")} of{" "}
                      <span className="text-yellow-300 font-bold">{best.metrics[primaryKey]}</span>
                    </p>
                  </div>
                </div>
              );
            })()}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {results.map((run, i) => {
                const primaryKey = run.task_type === "classification" ? "accuracy" : "r2_score";
                const isBest = results.length > 1 &&
                  run.metrics[primaryKey] === Math.max(...results.map(r => r.metrics[primaryKey] || 0));

                return (
                  <div
                    key={i}
                    className={`p-6 rounded-2xl border ${
                      isBest ? "bg-yellow-500/5 border-yellow-400/30" : "bg-white/5 border-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="font-bold text-lg">{run.model_name}</p>
                        <p className="text-xs text-white/30 mt-0.5">
                          {run.n_samples} samples · {run.n_features} features · {run.duration_seconds}s
                        </p>
                      </div>
                      {isBest && results.length > 1 && (
                        <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-yellow-500/20 text-yellow-300">
                          <Award size={12} /> Best
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      {Object.entries(run.metrics).map(([k, v], mi) => (
                        <MetricCard key={mi} label={k} value={v} highlight={k === primaryKey && isBest} />
                      ))}
                    </div>

                    {run.artifacts?.feature_importance && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <p className="text-xs text-white/40 mb-3 flex items-center gap-1">
                          <BarChart3 size={12} /> Feature Importance
                        </p>
                        <div className="space-y-2">
                          {Object.entries(run.artifacts.feature_importance).slice(0, 5).map(([feat, imp], fi) => (
                            <div key={fi}>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-white/60 truncate">{feat}</span>
                                <span className="text-white/40 ml-2">{(imp * 100).toFixed(1)}%</span>
                              </div>
                              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-purple-400 to-cyan-400 rounded-full"
                                  style={{ width: `${imp * 100}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {run.artifacts?.confusion_matrix && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <p className="text-xs text-white/40 mb-2">Confusion Matrix</p>
                        <div className="inline-block">
                          {run.artifacts.confusion_matrix.map((row, ri) => (
                            <div key={ri} className="flex">
                              {row.map((val, ci) => (
                                <div
                                  key={ci}
                                  className="w-10 h-10 flex items-center justify-center border border-white/10 text-xs"
                                  style={{
                                    backgroundColor: `rgba(168,85,247,${Math.min(val / Math.max(...row, 1), 1) * 0.6})`
                                  }}
                                >
                                  {val}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default ModelLab;