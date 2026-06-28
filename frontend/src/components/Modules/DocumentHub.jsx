import { useState, useEffect } from "react";
import {
  FileText, Upload, Search, Trash2,
  CheckCircle, Clock, RefreshCw, X, Eye
} from "lucide-react";

function DocumentHub() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [activeTab, setActiveTab] = useState("docs");

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/documents`);
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadMsg("");
    const formData = new FormData();
    formData.append("file", selectedFile);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL ||'http://127.0.0.1:8000'}/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setUploadMsg(data.message);
      setSelectedFile(null);
      fetchDocuments();
    } catch {
      setUploadMsg("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (filename) => {
    if (!confirm(`Delete ${filename}?`)) return;
    await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/documents/${filename}`, {
      method: "DELETE",
    });
    fetchDocuments();
  };

  const handleReindex = async (filename) => {
    await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/documents/reindex/${filename}`, {
      method: "POST",
    });
    fetchDocuments();
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchResults([]);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/documents/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      });
      const data = await res.json();
      setSearchResults(data.results || []);
      setActiveTab("search");
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (ts) =>
    new Date(ts * 1000).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric"
    });

  // Collapsed card view
  if (!expanded) {
    return (
      <div
        onClick={() => setExpanded(true)}
        className="
          w-full max-w-[320px] min-h-[220px]
          bg-slate-900/40 backdrop-blur-xl
          border border-cyan-500/20 rounded-3xl p-6
          text-white hover:scale-105 hover:border-cyan-400/50
          transition-all duration-300 cursor-pointer
          shadow-[0_0_30px_rgba(34,211,238,.08)]
        "
      >
        <FileText size={32} className="text-cyan-400" />
        <h2 className="mt-3 text-lg font-bold">Document Hub</h2>
        <p className="text-slate-400 text-sm mt-2">
          PDF Uploads & Knowledge Sources
        </p>
        <div className="text-cyan-300 font-semibold mt-4">
          {documents.length} Documents
        </div>
        <div className="flex gap-2 mt-3">
          {documents.slice(0, 3).map((d, i) => (
            <div
              key={i}
              className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/20 flex items-center justify-center"
            >
              <FileText size={14} className="text-cyan-400" />
            </div>
          ))}
          {documents.length > 3 && (
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-xs text-white/60">
              +{documents.length - 3}
            </div>
          )}
        </div>
        <p className="text-white/30 text-xs mt-3">Click to expand</p>
      </div>
    );
  }

  // Expanded full view
  return (
    <div className="
      fixed inset-0 z-50 flex items-center justify-center
      bg-black/60 backdrop-blur-sm p-4
    ">
      <div className="
        w-full max-w-3xl max-h-[90vh] overflow-y-auto
        bg-slate-900 border border-cyan-500/30
        rounded-3xl p-6 text-white
        shadow-[0_0_60px_rgba(34,211,238,.15)]
      ">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FileText size={28} className="text-cyan-400" />
            <div>
              <h2 className="text-xl font-bold">Document Hub</h2>
              <p className="text-slate-400 text-sm">
                {documents.length} documents · {documents.filter(d => d.indexed).length} indexed
              </p>
            </div>
          </div>
          <button
            onClick={() => setExpanded(false)}
            className="p-2 rounded-xl hover:bg-white/10 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Upload section */}
        <div className="mb-6 p-4 rounded-2xl bg-black/30 border border-white/10">
          <div className="flex gap-3 flex-wrap">
            <label className="
              flex items-center gap-2 px-4 py-2 rounded-xl
              bg-cyan-500/20 border border-cyan-400/30
              hover:bg-cyan-500/30 transition cursor-pointer text-sm
            ">
              <Upload size={16} />
              {selectedFile ? selectedFile.name : "Select PDF"}
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => setSelectedFile(e.target.files[0])}
              />
            </label>

            {selectedFile && (
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="
                  flex items-center gap-2 px-4 py-2 rounded-xl
                  bg-green-500/20 border border-green-400/30
                  hover:bg-green-500/30 transition text-sm
                  disabled:opacity-50
                "
              >
                <Upload size={16} />
                {uploading ? "Uploading..." : "Upload & Index"}
              </button>
            )}

            <button
              onClick={fetchDocuments}
              className="
                flex items-center gap-2 px-4 py-2 rounded-xl
                bg-white/10 border border-white/10
                hover:bg-white/20 transition text-sm
              "
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>

          {uploadMsg && (
            <p className="text-green-400 text-sm mt-3">{uploadMsg}</p>
          )}
        </div>

        {/* Search */}
        <div className="mb-6 flex gap-3">
          <div className="flex-1 flex items-center gap-2 px-4 py-2 rounded-xl bg-black/30 border border-white/10">
            <Search size={16} className="text-white/40" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search across all documents semantically..."
              className="bg-transparent outline-none flex-1 text-sm"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(""); setSearchResults([]); setActiveTab("docs"); }}>
                <X size={14} className="text-white/40 hover:text-white" />
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            disabled={searching}
            className="
              px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-400/30
              hover:bg-cyan-500/30 transition text-sm disabled:opacity-50
            "
          >
            {searching ? "Searching..." : "Search"}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {["docs", "search"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-xl text-sm transition ${
                activeTab === tab
                  ? "bg-cyan-500/30 border border-cyan-400/40 text-cyan-300"
                  : "bg-white/5 border border-white/10 text-white/50 hover:text-white"
              }`}
            >
              {tab === "docs" ? `Documents (${documents.length})` : `Results (${searchResults.length})`}
            </button>
          ))}
        </div>

        {/* Documents list */}
        {activeTab === "docs" && (
          <div className="space-y-3">
            {loading && (
              <p className="text-white/40 text-sm text-center py-8">Loading...</p>
            )}
            {!loading && documents.length === 0 && (
              <div className="text-center py-12">
                <FileText size={48} className="text-white/20 mx-auto mb-3" />
                <p className="text-white/40">No documents yet. Upload a PDF to get started.</p>
              </div>
            )}
            {documents.map((doc, i) => (
              <div
                key={i}
                className="
                  flex items-center gap-4 p-4 rounded-2xl
                  bg-black/20 border border-white/10
                  hover:border-cyan-400/20 transition
                "
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                  <FileText size={18} className="text-cyan-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{doc.filename}</p>
                  <div className="flex gap-3 mt-1 text-xs text-white/40">
                    <span>{formatSize(doc.size)}</span>
                    <span>{formatDate(doc.modified)}</span>
                    <span>{doc.chunks} chunks</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {doc.indexed ? (
                    <span className="flex items-center gap-1 text-xs text-green-400">
                      <CheckCircle size={12} /> Indexed
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-yellow-400">
                      <Clock size={12} /> Not indexed
                    </span>
                  )}

                  <button
                    onClick={() => handleReindex(doc.filename)}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition text-white/40 hover:text-white"
                    title="Re-index"
                  >
                    <RefreshCw size={14} />
                  </button>

                  <button
                    onClick={() => handleDelete(doc.filename)}
                    className="p-1.5 rounded-lg hover:bg-red-500/20 transition text-white/40 hover:text-red-400"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Search results */}
   {activeTab === "search" && (
  <div className="space-y-4">
    {searchResults.length === 0 && (
      <p className="text-white/40 text-sm text-center py-8">
        No results found. Try a different query.
      </p>
    )}
    {searchResults.map((r, i) => (
      <div
        key={i}
        className="p-5 rounded-2xl bg-black/20 border border-white/10 hover:border-cyan-400/20 transition"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText size={14} className="text-cyan-400" />
            <span className="text-xs text-cyan-400 font-medium">
              {r.filename}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-16 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                style={{ width: `${r.score}%` }}
              />
            </div>
            <span className="text-xs text-white/40">
              {r.score}% match
            </span>
          </div>
        </div>

        {/* Cleaned and formatted content */}
        <div className="space-y-2">
          {r.text
            .split(/\n/)
            .map(line => line.trim())
            .filter(line => line.length > 2)
            .slice(0, 6)
            .map((line, li) => {
              // Section headers (ALL CAPS or numbered)
              const isHeader = /^[A-Z\s\d.]{6,}$/.test(line) ||
                /^\d+\./.test(line) ||
                line.endsWith(":")

              // Bullet points
              const isBullet = line.startsWith("•") ||
                line.startsWith("-") ||
                line.startsWith("*")

              if (isHeader) {
                return (
                  <p key={li} className="text-sm font-semibold text-white mt-2">
                    {line.replace(/[💻⚙🧱🌐🎤🧍📅🧠]/g, "").trim()}
                  </p>
                )
              }
              if (isBullet) {
                return (
                  <div key={li} className="flex items-start gap-2 ml-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
                    <p className="text-sm text-white/70">
                      {line.replace(/^[•\-*]\s*/, "").trim()}
                    </p>
                  </div>
                )
              }
              return (
                <p key={li} className="text-sm text-white/60 leading-relaxed">
                  {line}
                </p>
              )
            })}
        </div>

        {/* Show more toggle */}
        <details className="mt-3">
          <summary className="text-xs text-cyan-400/60 cursor-pointer hover:text-cyan-400 transition">
            Show full excerpt
          </summary>
          <div className="mt-3 pt-3 border-t border-white/10 space-y-1">
            {r.text
              .split(/\n/)
              .map(line => line.trim())
              .filter(line => line.length > 2)
              .map((line, li) => (
                <p key={li} className="text-xs text-white/50 leading-relaxed">
                  {line}
                </p>
              ))}
          </div>
        </details>

      </div>
    ))}

    {/* Summary bar */}
    {searchResults.length > 0 && (
      <div className="mt-2 p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/10 flex items-center justify-between">
        <span className="text-xs text-white/40">
          Found {searchResults.length} relevant sections across your documents
        </span>
        <span className="text-xs text-cyan-400">
          Sorted by relevance
        </span>
      </div>
    )}
  </div>
)}

      </div>
    </div>
  );
}

export default DocumentHub;