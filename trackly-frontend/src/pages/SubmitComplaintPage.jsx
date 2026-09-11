import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";

const categories = [
  { id: "electrical", label: "ELECTRICAL", icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )},
  { id: "plumbing", label: "PLUMBING", icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  )},
  { id: "security", label: "SECURITY", icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )},
  { id: "cleanliness", label: "CLEANLINESS", icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )},
  { id: "noise", label: "NOISE", icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5L6 9H3v6h3l5 4V5zm4.5 3.5a4 4 0 010 5m2.5-7a7 7 0 010 9" />
    </svg>
  )},

  { id: "structural", label: "STRUCTURAL", icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10l9-7 9 7v11H3z" />
    </svg>
  )},

  { id: "elevator", label: "ELEVATOR", icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m-4-4l4 4 4-4" />
    </svg>
  )},

  

  
  { id: "other", label: "OTHER", icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
    </svg>
  )},
];

const confidenceColor = {
  high: { bg: "#D1FAE5", text: "#065F46" },
  medium: { bg: "#FEF3C7", text: "#92400E" },
  low: { bg: "#FEE2E2", text: "#991B1B" },
};

export default function SubmitComplaintPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef();
  const [form, setForm] = useState({ title: "", description: "", location: "", category: "" });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiDescSuggestion, setAiDescSuggestion] = useState(null);
  const [aiTitleSuggestion, setAiTitleSuggestion] = useState(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const handleImageUpload = async (file) => {
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setAnalyzing(true);
    setAnalysis(null);
    setAiDescSuggestion(null);
    setAiTitleSuggestion(null);

    const titleFilled = form.title.trim() !== "";
    const descFilled = form.description.trim() !== "";

    try {
      const formData = new FormData();
      formData.append("title", form.title || "Complaint");
      formData.append("description", form.description || "Issue reported");
      formData.append("image", file);
      const { data } = await api.post("/resident/complaints/analyze", formData);
      setAnalysis(data.analysis);

      if (!titleFilled && !descFilled) {
        setForm((prev) => ({
          ...prev,
          title: data.analysis.aiTitle,
          description: data.analysis.aiDescription,
          category: data.analysis.suggestedCategory,
        }));
      } else {
        if (!titleFilled) setAiTitleSuggestion(data.analysis.aiTitle);
        if (!descFilled) {
          setForm((prev) => ({ ...prev, description: data.analysis.aiDescription }));
        } else {
          setAiDescSuggestion(data.analysis.aiDescription);
        }
        if (!form.category) setForm((prev) => ({ ...prev, category: data.analysis.suggestedCategory }));
      }
    } catch {
      setError("Image analysis failed. You can still submit manually.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) handleImageUpload(file);
  };

  const submitMutation = useMutation({
  mutationFn: () => {
    const formData = new FormData();
    formData.append("title", form.title);
    formData.append("description", form.description);
    formData.append("location", form.location);
    if (form.category) formData.append("confirmedCategory", form.category);
    if (imageFile) formData.append("image", imageFile);

    return api.post("/resident/complaints", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  onSuccess: () => {
    queryClient.invalidateQueries(["myComplaints"]);
    navigate("/dashboard");
  },
  onError: (err) => {
    const msg = err.response?.data?.message;
    const dupId = err.response?.data?.duplicateId;
    setError(dupId ? `${msg} (Complaint #${dupId})` : msg || "Submission failed.");
  },
});

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    submitMutation.mutate();
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F5F6F6", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Navbar */}
      <nav className="bg-white border-b sticky top-0 z-12" style={{ borderColor: "#E8EAED" }}>
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate("/dashboard")}
            className="font-black text-xl tracking-tight"
            style={{ color: "#111827", letterSpacing: "-0.04em", background: "none", border: "none", cursor: "pointer" }}
          >
            Resolv
          </button>
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="#9CA3AF" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search records..."
                className="pl-9 pr-4 py-2 text-sm rounded-full outline-none"
                style={{ backgroundColor: "#F3F4F6", border: "1px solid #E5E7EB", color: "#374151", width: "200px" }}
              />
            </div>
            <button className="p-2 rounded-full" style={{ backgroundColor: "#F3F4F6" }}>
              <svg className="w-5 h-5" fill="none" stroke="#374151" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <button
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: "#374151" }}
            >
              R
            </button>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-10">

        {/* Page Header */}
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#0D9488", letterSpacing: "0.15em" }}>
            NEW SUBMISSION
          </p>
          <h1 className="font-black mb-2" style={{ color: "#111827", fontSize: "2.5rem", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            File Complaint
          </h1>
          <p className="text-sm" style={{ color: "#6B7280" }}>
            Submit your request with AI-assisted scanning for faster resolution.
          </p>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl flex items-center gap-3 text-sm" style={{ backgroundColor: "#FEE2E2", color: "#991B1B", border: "1px solid #FECACA" }}>
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">

          {/* LEFT — Drop Zone */}
          <div className="lg:col-span-2 space-y-4">
            {/* Upload area */}
            <div
              className="relative rounded-4xl overflow-hidden cursor-pointer transition-all"
              style={{
                border: dragOver ? "2px dashed #0D9488" : "2px dashed #D1D5DB",
                backgroundColor: dragOver ? "#F0FDFA" : imagePreview ? "#000" : "#E8EAED",
                minHeight: "380px",
                backgroundImage: !imagePreview ? "linear-gradient(135deg, #E2E4E7 0%, #D4D6DA 50%, #C8CACD 100%)" : undefined,
              }}
              onClick={() => fileInputRef.current.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full object-cover" style={{ maxHeight: "380px" }} />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  {/* Silk-like shimmer overlay */}
                  
<img alt="soft minimalist abstract background with organic fluid shapes" class="absolute inset-0 w-full h-full object-cover opacity-10 group-hover:scale-105 transition-transform duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0rPymj8dYMD36bApG-j9xMqq1N4jFQyhvnYh4A9-BvSTy1k-2c-9wCAn8WiYa-qPxdIdPRD8p7LJ-hseyCy7KhiL49Y1gdcYgIWvYNNbrOt2rG_w2odShGfwcqZtMF7eib2Ao546v9thCqw1mzugRFMdccuFxGH0Fb9Cncbq7EhI_NWyw7ST9MY0El3JBQEhwjKI9Lri_jXlAy6lB5aICcf27B6PrgxDpQbK5jfDZ1HZRZH6uM4dQ1euojrJA9ba86Gdw9wphVy8"/>
                  <div class="absolute inset-0 bg-white/15 rounded-xl"></div>
                  {/* Camera icon */}
                  <div className="relative z-10 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-7 h-7" fill="none" stroke="#374151" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {/* Plus badge */}
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: "#0D9488" }}>
                      +
                    </div>
                  </div>

                  <div className="relative z-10 text-center px-8">
                    <p className="font-bold text-lg mb-1" style={{ color: "#111827" }}>Drop visual evidence here</p>
                    <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>
                      AI will automatically scan your image to<br />
                      categorize and extract key details for the report.
                    </p>
                  </div>

                  <div className="relative z-10 flex items-center gap-3">
                    
                    <button
                      type="button"
                      className="px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-all"
                      style={{ backgroundColor: "#0D9488", boxShadow: "0 2px 12px rgba(13,148,136,0.3)" }}
                      onClick={(e) => { e.stopPropagation(); fileInputRef.current.click(); }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#0b7a70"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#0D9488"}
                    >
                      Select Files
                    </button>
                  </div>
                </div>
              )}

              {/* Analyzing overlay */}
              {analyzing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                  <svg className="animate-spin w-8 h-8 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  <p className="text-white text-sm font-semibold">AI is analyzing your image…</p>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImageUpload(e.target.files?.[0])}
            />

            {/* AI Feature tags */}
           

            {/* AI analysis result */}
            {analysis && !analyzing && (
              <div className="rounded-2xl p-4 space-y-2" style={{ backgroundColor: "#F0FDFA", border: "1px solid #99F6E4" }}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold" style={{ color: "#0D9488" }}>✦ AI Analysis Complete</span>
                  {analysis.confidence && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: confidenceColor[analysis.confidence]?.bg, color: confidenceColor[analysis.confidence]?.text }}>
                      {analysis.confidence} confidence
                    </span>
                  )}
                </div>
                {analysis.urgencyScore && (
                  <p className="text-xs" style={{ color: "#374151" }}>🔥 Urgency Score: <strong>{analysis.urgencyScore}/10</strong></p>
                )}
              </div>
            )}
          </div>

          {/* RIGHT — Form + What happens next */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid #E5E7EB" }}>
              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#6B7280", letterSpacing: "0.1em" }}>
                    TITLE OF ISSUE
                  </label>
                  <input
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Water leakage in hallway"
                    className="w-full px-4 py-3 rounded-2xl text-sm outline-none transition-all"
                    style={{ backgroundColor: "#F9FAFB", border: "1.5px solid #E5E7EB", color: "#111827" }}
                    onFocus={(e) => e.target.style.borderColor = "#0D9488"}
                    onBlur={(e) => e.target.style.borderColor = "#E5E7EB"}
                  />
                  {aiTitleSuggestion && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="text-xs" style={{ color: "#6B7280" }}>AI suggests:</span>
                      <button
                        type="button"
                        onClick={() => { setForm((p) => ({ ...p, title: aiTitleSuggestion })); setAiTitleSuggestion(null); }}
                        className="text-xs px-2.5 py-1 rounded-2xl transition"
                        style={{ backgroundColor: "#F0FDFA", color: "#0D9488", border: "1px solid #99F6E4" }}
                      >
                        ✨ {aiTitleSuggestion}
                      </button>
                      <button type="button" onClick={() => setAiTitleSuggestion(null)} className="text-xs" style={{ color: "#9CA3AF" }}>✕</button>
                    </div>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#6B7280", letterSpacing: "0.1em" }}>
                    CATEGORY
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setForm({ ...form, category: cat.id })}
                        className="flex flex-col items-center gap-1 p-2.5 rounded-2xl transition-all"
                        style={{
                          backgroundColor: form.category === cat.id ? "#0D9488" : "#F9FAFB",
                          color: form.category === cat.id ? "white" : "#6B7280",
                          border: form.category === cat.id ? "1.5px solid #0D9488" : "1.5px solid #E5E7EB",
                          minWidth: "60px",
                        }}
                      >
                        {cat.icon}
                        <span className="text-xs font-semibold" style={{ letterSpacing: "0.04em", fontSize: "0.6rem" }}>{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#6B7280", letterSpacing: "0.1em" }}>
                    BRIEF DESCRIPTION
                    {analysis && !aiDescSuggestion && (
                      <span className="ml-2 normal-case font-normal" style={{ color: "#0D9488" }}>(AI-filled)</span>
                    )}
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Provide essential details..."
                    className="w-full px-4 py-3 rounded-2xl text-sm outline-none transition-all resize-none"
                    style={{ backgroundColor: "#F9FAFB", border: "1.5px solid #E5E7EB", color: "#111827" }}
                    onFocus={(e) => e.target.style.borderColor = "#0D9488"}
                    onBlur={(e) => e.target.style.borderColor = "#E5E7EB"}
                  />
                  {aiDescSuggestion && (
                    <div className="mt-1.5 p-3 rounded-2xl" style={{ backgroundColor: "#F0FDFA", border: "1px solid #99F6E4" }}>
                      <p className="text-xs mb-2" style={{ color: "#374151" }}>{aiDescSuggestion}</p>
                      <div className="flex gap-3">
                        <button type="button"
                          onClick={() => { setForm((p) => ({ ...p, description: aiDescSuggestion })); setAiDescSuggestion(null); }}
                          className="text-xs font-semibold" style={{ color: "#0D9488" }}>
                          ✓ Use this
                        </button>
                        <button type="button" onClick={() => setAiDescSuggestion(null)} className="text-xs" style={{ color: "#9CA3AF" }}>
                          ✕ Dismiss
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {/* Location */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#6B7280", letterSpacing: "0.1em" }}>
                    LOCATION DETAILS*
                  </label>
                  <div className="relative">
                    <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="#9CA3AF" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <input
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      placeholder="Flat number, floor, or specific area"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm outline-none transition-all"
                      style={{ backgroundColor: "#F9FAFB", border: "1.5px solid #E5E7EB", color: "#111827" }}
                      onFocus={(e) => e.target.style.borderColor = "#0D9488"}
                      onBlur={(e) => e.target.style.borderColor = "#E5E7EB"}
                    />
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitMutation.isPending || analyzing}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-white text-sm transition-all"
                  style={{
                    backgroundColor: submitMutation.isPending || analyzing ? "#9CA3AF" : "#0D9488",
                    boxShadow: submitMutation.isPending || analyzing ? "none" : "0 4px 16px rgba(13,148,136,0.3)",
                    cursor: submitMutation.isPending || analyzing ? "not-allowed" : "pointer",
                  }}
                  onMouseEnter={(e) => { if (!submitMutation.isPending && !analyzing) e.currentTarget.style.backgroundColor = "#0b7a70"; }}
                  onMouseLeave={(e) => { if (!submitMutation.isPending && !analyzing) e.currentTarget.style.backgroundColor = "#0D9488"; }}
                >
                  {submitMutation.isPending ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Submitting…
                    </>
                  ) : (
                    <>
                      Submit Complaint
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </button>

                <p className="text-center text-xs" style={{ color: "#9CA3AF" }}>
                  By submitting, you agree to our terms of processing.
                </p>
              </form>
            </div>

            {/* What happens next */}
            <div className="bg-white rounded-2xl p-5" style={{ border: "1px solid #E5E7EB" }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: "#0D9488" }}>
                  i
                </div>
                <span className="text-sm font-bold" style={{ color: "#111827" }}>What happens next?</span>
              </div>
              <div className="space-y-2.5">
                {[
                  "AI classifies and routes your complaint within minutes.",
                  "You'll receive a tracking link via email and dashboard.",
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5"
                      style={{ backgroundColor: "#E5E7EB", color: "#6B7280", fontSize: "0.65rem" }}
                    >
                      {i + 1}
                    </div>
                    <p className="text-sm" style={{ color: "#6B7280" }}>{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t mt-8" style={{ borderColor: "#E5E7EB", backgroundColor: "#F9FAFB" }}>
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-black text-sm tracking-tight block" style={{ color: "#111827", letterSpacing: "-0.03em" }}>Resolv</span>
            <span className="text-xs" style={{ color: "#9CA3AF" }}>© 2024 Resolv Editorial Systems. All rights reserved.</span>
          </div>
          <div className="flex gap-6">
            {["Privacy Policy", "Terms of Service", "Accessibility Statement", "Support"].map((l) => (
              <a key={l} href="#" className="text-xs transition-colors" style={{ color: "#9CA3AF" }}
                onMouseEnter={(e) => e.target.style.color = "#374151"}
                onMouseLeave={(e) => e.target.style.color = "#9CA3AF"}
              >{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
