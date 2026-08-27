import { useState } from "react";
import Card from "../common/Card";
import { sessionApi } from "../../services/api";

export default function KnowledgeBasePanel({ sessionId }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [searchError, setSearchError] = useState(null);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files?.[0] ?? null);
    setUploadStatus(null);
  };

  const handleUpload = async () => {
    if (!selectedFile || !sessionId) return;

    setIsUploading(true);
    setUploadStatus(null);

    try {
      const { data } = await sessionApi.uploadDocs(sessionId, selectedFile);

      setUploadStatus({
        ok: true,
        text: `${data.filename} — ${data.chunks_indexed} chunks indexed`,
      });

      setSelectedFile(null);
    } catch (err) {
      setUploadStatus({
        ok: false,
        text: err?.response?.data?.detail || err.message || "Upload failed",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !sessionId) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      const { data } = await sessionApi.query(
        sessionId,
        searchQuery.trim()
      );

      setSearchResults(data.results ?? []);
    } catch (err) {
      setSearchError(
        err?.response?.data?.detail ||
          err.message ||
          "Search failed"
      );

      setSearchResults(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
   <Card title="Knowledge Base" accent="teal">
      <div className="space-y-5">

        {/* Upload */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Upload a support doc (.txt)
          </label>

          <div className="flex items-center gap-3">
            <label className="cursor-pointer rounded-lg border border-[#7DD3C7] bg-white px-4 py-2 text-sm font-medium text-[#0F766E] transition hover:bg-[#ECFEFF]">
              Choose File
              <input
                type="file"
                accept=".txt"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            <span className="text-sm text-gray-500">
              {selectedFile ? selectedFile.name : "No file chosen"}
            </span>

            <button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="ml-auto rounded-lg bg-[#14B8A6] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0D9488] disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
            >
              {isUploading ? "Uploading..." : "Upload"}
            </button>
          </div>

          {uploadStatus && (
            <p
              className={`mt-3 text-sm ${
                uploadStatus.ok
                  ? "text-emerald-600"
                  : "text-red-500"
              }`}
            >
              {uploadStatus.ok ? "✓ " : "✗ "}
              {uploadStatus.text}
            </p>
          )}
        </div>

        {/* Search */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Search the knowledge base
          </label>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="e.g. refund policy"
              className="flex-1 rounded-lg border border-[#C7ECE8] bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
            />

            <button
              onClick={handleSearch}
              disabled={!searchQuery.trim() || isSearching}
              className="rounded-lg bg-[#14B8A6] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0D9488] disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
            >
              {isSearching ? "..." : "Search"}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="mt-4">
          {searchError && (
            <p className="text-sm text-red-500">
              {searchError}
            </p>
          )}

          {!searchError && searchResults === null && (
            <p className="text-sm italic text-[#0F766E]">
              No knowledge suggestions for this turn.
            </p>
          )}

          {!searchError && searchResults?.length === 0 && (
            <p className="text-sm italic text-gray-500">
              No results found.
            </p>
          )}

          {!searchError && searchResults?.length > 0 && (
            <div className="space-y-3">
              {searchResults.map((r, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-[#C7ECE8] bg-white p-4 shadow-sm"
                >
                  <p className="text-sm leading-6 text-gray-700">
                    {r.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </Card>
  );
}