import { API_URL } from "../config";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import {
  Sparkles,
  TrendingUp,
  Layers,
  Cpu,
  FlaskConical,
  Database,
  Upload,
  Search,
  Eye,
  X,
  Loader,
} from "lucide-react";

function ResearchLab() {
  const [builtinDatasets, setBuiltinDatasets] = useState([]);
  const [importedDatasets, setImportedDatasets] = useState([]);
  const [activeTab, setActiveTab] = useState("builtin");
  const [openmlQuery, setOpenmlQuery] = useState("");
  const [openmlResults, setOpenmlResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [importingId, setImportingId] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [topicSuggestions, setTopicSuggestions] = useState([]);

  const fetchDatasets = async () => {
    const res = await fetch(`${API_URL}/datasets/all`);
    const data = await res.json();

    setBuiltinDatasets(data.builtin || []);
    setImportedDatasets(data.imported || []);
  };

  useEffect(() => {
    fetchDatasets();

    fetch(`${API_URL}/datasets/openml/suggestions`)
      .then((res) => res.json())
      .then((data) => setTopicSuggestions(data.topics || []));
  }, []);

  const handleOpenmlSearch = async () => {
    setSearching(true);

    try {
      const res = await fetch(
        `${API_URL}/datasets/openml/search?q=${encodeURIComponent(openmlQuery)}`
      );

      const data = await res.json();

      if (Array.isArray(data.results)) {
        setOpenmlResults(data.results);
      } else {
        setOpenmlResults([]);
        alert(
          `OpenML search failed: ${
            data.results?.error || JSON.stringify(data.results)
          }`
        );
      }
    } catch (err) {
      console.error(err);
      setOpenmlResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleOpenmlImport = async (openmlId) => {
    setImportingId(openmlId);

    try {
      const res = await fetch(`${API_URL}/datasets/openml/import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          openml_id: openmlId,
        }),
      });

      const data = await res.json();

      if (data.success) {
        fetchDatasets();
        setActiveTab("imported");
      } else {
        alert(`Import failed: ${data.error}`);
      }
    } finally {
      setImportingId(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await fetch(`${API_URL}/datasets/upload-csv`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setSelectedFile(null);
        fetchDatasets();
        setActiveTab("imported");
      } else {
        alert(`Upload failed: ${data.error}`);
      }
    } finally {
      setUploading(false);
    }
  };

const handlePreview = async (datasetId) => {
  setPreviewLoading(true);
  setPreviewData(null);

  try {
    const res = await fetch(`${API_URL}/datasets/${datasetId}/preview`);
    const data = await res.json();
    setPreviewData(data);
  } finally {
    setPreviewLoading(false);
  }
};
  return (
    <div
      className="min-h-screen relative overflow-hidden text-white"
      style={{ background: "radial-gradient(circle at center,#0f172a 0%,#020617 100%)" }}
    >
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 py-10">

        {/* Hero */}
        <div className="text-center py-12 mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-400/20 mb-6">
            <FlaskConical size={14} className="text-cyan-400" />
            <span className="text-xs text-cyan-300">FlowOps Research Lab</span>
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-white to-purple-400 bg-clip-text text-transparent">
            Your ML Playground
          </h1>
          <p className="text-white/50 text-lg max-w-xl mx-auto mb-8">
            Upload datasets, train any machine learning model, compare results,
            and generate research reports — all in one place.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              to="/model-lab"
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 transition font-medium flex items-center gap-2"
            >
              <Cpu size={16} /> Start Experimenting
            </Link>
            <Link
              to="/evaluation-board"
              className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition flex items-center gap-2"
            >
              <TrendingUp size={16} /> View Results
            </Link>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-12">
          {[
            { label: "Built-in Datasets", value: builtinDatasets.length, icon: <Database size={18} className="text-cyan-400" /> },
            { label: "ML Models Available", value: "23", icon: <Cpu size={18} className="text-purple-400" /> },
            { label: "My Datasets", value: importedDatasets.length, icon: <FlaskConical size={18} className="text-green-400" /> },
          ].map((stat, i) => (
            <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
              <div className="flex justify-center mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs text-white/40 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: "builtin", label: `Built-in (${builtinDatasets.length})` },
            { id: "openml", label: "Search OpenML" },
            { id: "upload", label: "Upload CSV" },
            { id: "imported", label: `My Datasets (${importedDatasets.length})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-sm transition ${
                activeTab === tab.id
                  ? "bg-cyan-500/30 border border-cyan-400/40 text-cyan-300"
                  : "bg-white/5 border border-white/10 text-white/50 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Builtin datasets */}
        {activeTab === "builtin" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {builtinDatasets.map((ds, i) => (
              <div key={i} className="p-5 rounded-2xl bg-slate-900/40 border border-cyan-500/20 hover:border-cyan-400/40 transition">
                <div className="flex items-center justify-between mb-2">
                  <Database size={18} className="text-cyan-400" />
                  <span className={`text-xs px-2 py-1 rounded-lg ${
                    ds.task_type === "classification"
                      ? "bg-purple-500/20 text-purple-300"
                      : "bg-green-500/20 text-green-300"
                  }`}>
                    {ds.task_type}
                  </span>
                </div>
                <h3 className="font-bold mt-2">{ds.name}</h3>
                <p className="text-xs text-white/40 mt-1">{ds.description}</p>
                <div className="flex gap-3 mt-3 text-xs text-white/30">
                  <span>{ds.n_rows} rows</span>
                  <span>{ds.n_cols} features</span>
                </div>
                <button
                  onClick={() => handlePreview(ds.id)}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-cyan-500/10 border border-cyan-400/20 hover:bg-cyan-500/20 transition text-sm"
                >
                  <Eye size={14} /> Preview
                </button>
              </div>
            ))}
          </div>
        )}

        {/* OpenML Search */}
{activeTab === "openml" && (
  <div>
    <div className="mb-8 text-center">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/20 mb-4">
        <Sparkles size={14} className="text-cyan-400" />
        <span className="text-xs text-cyan-300">
          Search 20,000+ public research datasets
        </span>
      </div>

      <div className="flex gap-3 max-w-2xl mx-auto">
        <div className="flex-1 flex items-center gap-3 px-5 py-4 rounded-2xl bg-black/30 border border-white/10 focus-within:border-cyan-400 transition">
          <Search size={20} className="text-white/30" />

          <input
            type="text"
            value={openmlQuery}
            onChange={(e) => setOpenmlQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleOpenmlSearch();
            }}
            placeholder="Try 'heart disease', 'iris', 'titanic'..."
            className="flex-1 bg-transparent outline-none text-base placeholder:text-white/30"
          />
        </div>

        <button
          onClick={handleOpenmlSearch}
          disabled={searching}
          className="px-6 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 transition font-medium disabled:opacity-50 flex items-center justify-center"
        >
          {searching ? (
            <Loader size={18} className="animate-spin" />
          ) : (
            "Search"
          )}
        </button>
      </div>
    </div>

    {!searching &&
      openmlResults.length === 0 &&
      topicSuggestions.length > 0 && (
        <div className="max-w-3xl mx-auto mb-10">
          <p className="text-xs text-white/30 text-center mb-3 flex items-center justify-center gap-2">
            <TrendingUp size={12} />
            Popular research topics
          </p>

          <div className="flex flex-wrap justify-center gap-2">
            {topicSuggestions.map((topic, index) => (
              <button
                key={index}
                onClick={() => {
                  setOpenmlQuery(topic);

                  fetch(
                    `${API_URL}/datasets/openml/search?q=${encodeURIComponent(
                      topic
                    )}`
                  )
                    .then((res) => res.json())
                    .then((data) => {
                      setOpenmlResults(data.results || []);
                    });
                }}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-400/40 hover:bg-cyan-500/10 transition text-sm text-white/70 hover:text-cyan-300 capitalize"
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      )}

    {searching && (
      <div className="text-center py-16">
        <Loader
          size={32}
          className="mx-auto mb-3 text-cyan-400 animate-spin"
        />
        <p className="text-sm text-white/40">
          Searching OpenML catalog...
        </p>
      </div>
    )}
  </div>
)}
           {/* OpenML Results */}
{!searching && openmlResults.length > 0 && (
  <div>
    <p className="text-xs text-white/30 mb-4 flex items-center gap-2">
      <Layers size={12} />
      {openmlResults.length} dataset{openmlResults.length > 1 ? "s" : ""} found
    </p>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {openmlResults.map((ds, index) => (
        <div
          key={ds.openml_id || index}
          className="group p-5 rounded-2xl bg-gradient-to-br from-slate-900/60 to-slate-900/20 border border-white/10 hover:border-cyan-400/40 transition-all duration-300 hover:-translate-y-1"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <Database size={18} className="text-cyan-400" />
            </div>

            {ds.task_type && (
              <span
                className={`text-xs px-2.5 py-1 rounded-lg font-medium ${
                  ds.task_type === "classification"
                    ? "bg-purple-500/20 text-purple-300"
                    : ds.task_type === "regression"
                    ? "bg-green-500/20 text-green-300"
                    : "bg-cyan-500/20 text-cyan-300"
                }`}
              >
                {ds.task_type}
              </span>
            )}
          </div>

          <h3 className="font-bold text-white truncate group-hover:text-cyan-300 transition">
            {ds.name}
          </h3>

          <div className="flex flex-wrap gap-4 mt-3 text-xs text-white/40">
            <span className="flex items-center gap-1">
              <Layers size={10} />
              {(ds.n_rows ?? 0).toLocaleString()} rows
            </span>

            <span>{ds.n_cols ?? 0} features</span>

            {ds.n_classes ? (
              <span>{ds.n_classes} classes</span>
            ) : null}
          </div>

          <button
            onClick={() => handleOpenmlImport(ds.openml_id)}
            disabled={importingId === ds.openml_id}
            className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-green-500/20 hover:border-green-400/30 transition disabled:opacity-50"
          >
            {importingId === ds.openml_id ? (
              <>
                <Loader size={14} className="animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload size={14} />
                Import Dataset
              </>
            )}
          </button>
        </div>
      ))}
    </div>
  </div>
)}

{/* No Results */}
{!searching && openmlQuery.trim() !== "" && openmlResults.length === 0 && (
  <div className="text-center py-16">
    <Database size={48} className="mx-auto mb-3 text-white/10" />

    <p className="text-white/40">
      No datasets found for{" "}
      <span className="font-semibold">"{openmlQuery}"</span>
    </p>

    <p className="mt-1 text-sm text-white/20">
      Try a broader keyword or select one of the suggested topics above.
    </p>
  </div>
)}

        {/* Upload */}
        {activeTab === "upload" && (
          <div className="max-w-xl mx-auto text-center py-12">
            <Upload size={48} className="text-white/20 mx-auto mb-4" />
            <label className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500/20 border border-cyan-400/30 hover:bg-cyan-500/30 transition cursor-pointer text-sm mb-4">
              {selectedFile ? selectedFile.name : "Choose CSV File"}
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => setSelectedFile(e.target.files[0])}
              />
            </label>
            {selectedFile && (
              <div>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="block mx-auto px-6 py-2 rounded-xl bg-green-500/20 border border-green-400/30 hover:bg-green-500/30 transition text-sm disabled:opacity-50"
                >
                  {uploading ? "Uploading..." : "Upload Dataset"}
                </button>
              </div>
            )}
            <p className="text-white/30 text-xs mt-4">CSV files only · max 200,000 rows</p>
          </div>
        )}

        {/* Imported datasets */}
        {activeTab === "imported" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {importedDatasets.map((ds, i) => (
              <div key={i} className="p-5 rounded-2xl bg-slate-900/40 border border-white/10 hover:border-cyan-400/30 transition">
                <div className="flex items-center justify-between mb-2">
                  <Database size={18} className="text-green-400" />
                  <span className="text-xs px-2 py-1 rounded-lg bg-white/5 text-white/40">{ds.source}</span>
                </div>
                <h3 className="font-bold mt-2 truncate">{ds.name}</h3>
                <div className="flex gap-3 mt-3 text-xs text-white/30">
                  <span>{ds.n_rows} rows</span>
                  <span>{ds.n_cols} cols</span>
                </div>
                <button
                  onClick={() => handlePreview(ds.id)}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-cyan-500/10 border border-cyan-400/20 hover:bg-cyan-500/20 transition text-sm"
                >
                  <Eye size={14} /> Preview
                </button>
              </div>
            ))}
            {importedDatasets.length === 0 && (
              <p className="text-white/30 text-sm col-span-3 text-center py-8">
                No imported datasets yet. Import from OpenML or upload a CSV.
              </p>
            )}
          </div>
        )}

      </div>

      {/* Preview modal */}
      {(previewData || previewLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl max-h-[85vh] overflow-y-auto bg-slate-900 border border-cyan-500/30 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">
                {previewLoading ? "Loading..." : previewData?.name}
              </h2>
              <button onClick={() => setPreviewData(null)} className="p-2 rounded-xl hover:bg-white/10 transition">
                <X size={20} />
              </button>
            </div>

            {previewLoading && (
              <p className="text-white/40 text-center py-12">Loading preview...</p>
            )}

            {previewData && !previewData.error && (
              <div>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-400/20 text-center">
                    <div className="text-xl font-bold text-cyan-300">{previewData.shape.rows}</div>
                    <div className="text-xs text-white/40">Rows</div>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-400/20 text-center">
                    <div className="text-xl font-bold text-purple-300">{previewData.shape.cols}</div>
                    <div className="text-xs text-white/40">Columns</div>
                  </div>
                  <div className="p-3 rounded-xl bg-green-500/10 border border-green-400/20 text-center">
                    <div className="text-xl font-bold text-green-300">
                      {Object.values(previewData.missing_values).reduce((a, b) => a + b, 0)}
                    </div>
                    <div className="text-xs text-white/40">Missing Values</div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/10">
                        {previewData.columns.map((col, i) => (
                          <th key={i} className="text-left p-2 text-cyan-300 whitespace-nowrap">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.head.map((row, ri) => (
                        <tr key={ri} className="border-b border-white/5">
                          {previewData.columns.map((col, ci) => (
                            <td key={ci} className="p-2 text-white/60 whitespace-nowrap">{String(row[col])}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default ResearchLab;
