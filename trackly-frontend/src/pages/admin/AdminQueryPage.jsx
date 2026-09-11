import { useState, useRef, useEffect } from "react";
import api from "../../api/axios";
import AdminLayout from "../../components/AdminLayout";

const SUGGESTED_QUERIES = [
  "How many open complaints are there?",
  "How many complaints are in the plumbing category?",
  "Show me all resolved complaints",
  "How many users are registered?",
  "Which user has the most complaints?",
  "Show me complaints created this month",
];

const StatusBadge = ({ value }) => {
  const styles = {
    OPEN: { bg: "#FEE2E2", color: "#DC2626" },
    IN_PROGRESS: { bg: "#FEF3C7", color: "#D97706" },
    RESOLVED: { bg: "#D1FAE5", color: "#059669" },
    ADMIN: { bg: "#EDE9FE", color: "#7C3AED" },
    RESIDENT: { bg: "#E0F2FE", color: "#0284C7" },
  };
  const s = styles[value];
  if (!s) return <span>{value}</span>;
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        borderRadius: 999,
        padding: "2px 10px",
        fontSize: "0.72rem",
        fontWeight: 700,
        letterSpacing: "0.04em",
        display: "inline-block",
      }}
    >
      {value}
    </span>
  );
};

const ResultTable = ({ results }) => {
  const columns = Object.keys(results[0]);
  const STATUS_LIKE = ["status", "role"];
  const DATE_LIKE = ["createdat", "updatedat", "created_at", "updated_at"];

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#FAFAFA" }}>
            {columns.map((col) => (
              <th
                key={col}
                style={{
                  padding: "10px 16px",
                  textAlign: "left",
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  color: "#9CA3AF",
                  textTransform: "uppercase",
                  borderBottom: "1px solid #F3F4F6",
                  whiteSpace: "nowrap",
                }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {results.map((row, i) => (
            <tr
              key={i}
              style={{ borderBottom: i < results.length - 1 ? "1px solid #F9FAFB" : "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAFA")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {columns.map((col) => {
                const val = row[col];
                const colLower = col.toLowerCase();
                return (
                  <td
                    key={col}
                    style={{
                      padding: "11px 16px",
                      fontSize: "0.85rem",
                      color: "#374151",
                      whiteSpace: "nowrap",
                      maxWidth: 240,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {val === null || val === undefined ? (
                      <span style={{ color: "#D1D5DB" }}>—</span>
                    ) : STATUS_LIKE.includes(colLower) ? (
                      <StatusBadge value={String(val)} />
                    ) : DATE_LIKE.includes(colLower) ? (
                      new Date(val).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    ) : (
                      String(val)
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const InsightBlock = ({ insight, rowCount, results }) => {
  const resultColumns = results?.length > 0 ? Object.keys(results[0]) : [];
  const isSingleValue =
    resultColumns.length === 1 && results?.length === 1;

  return (
    <div
      style={{
        background: "#fff",
        border: "1.5px solid #E5E7EB",
        borderRadius: 20,
        padding: "24px 28px",
        marginBottom: 16,
        boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <svg width="16" height="16" fill="none" stroke="#0D9488" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <span
          style={{
            fontSize: "0.65rem",
            fontWeight: 700,
            letterSpacing: "0.12em",
            color: "#0D9488",
            textTransform: "uppercase",
          }}
        >
          AI Insight
        </span>
      </div>

      {/* Single value answer — big display */}
      {isSingleValue && (
        <p
          style={{
            fontSize: "2rem",
            fontWeight: 900,
            color: "#111827",
            letterSpacing: "-0.03em",
            lineHeight: 1.15,
            marginBottom: 12,
          }}
        >
          {String(Object.values(results[0])[0])}
        </p>
      )}

      {/* No results */}
      {rowCount === 0 && (
        <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "#6B7280", marginBottom: 8 }}>
          No results found.
        </p>
      )}

      {/* AI-generated summary */}
      {insight?.summary && (
        <p style={{ fontSize: "0.9rem", color: "#111827", lineHeight: 1.7, marginBottom: 6, fontWeight: 500 }}>
          {insight.summary}
        </p>
      )}

      {/* AI insight detail */}
      {insight?.insight && (
        <p style={{ fontSize: "0.85rem", color: "#6B7280", lineHeight: 1.7, marginBottom: 0 }}>
          {insight.insight}
        </p>
      )}

      {/* Recommendation */}
      {insight?.recommendation && (
        <div
          style={{
            marginTop: 14,
            padding: "10px 14px",
            background: "#F0FDFA",
            borderRadius: 10,
            borderLeft: "3px solid #0D9488",
          }}
        >
          <p style={{ margin: 0, fontSize: "0.82rem", color: "#0D7A6B", fontWeight: 600, lineHeight: 1.6 }}>
            💡 {insight.recommendation}
          </p>
        </div>
      )}

      {/* Fallback if no insight from backend */}
      {!insight && rowCount > 0 && !isSingleValue && (
        <p style={{ fontSize: "0.85rem", color: "#6B7280", lineHeight: 1.7 }}>
          Found <strong style={{ color: "#111827" }}>{rowCount}</strong> result{rowCount !== 1 ? "s" : ""}.
        </p>
      )}
    </div>
  );
};

export default function AdminQueryPage() {
  const [queryInput, setQueryInput] = useState("");
  const [queryLoading, setQueryLoading] = useState(false);
  const [history, setHistory] = useState([]); // { question, result, error }
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const hasHistory = history.length > 0;

  useEffect(() => {
    if (hasHistory) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [history]);

  const handleQuery = async (question) => {
    const q = (question || queryInput).trim();
    if (!q || queryLoading) return;
    setQueryInput("");
    setQueryLoading(true);

    try {
      const { data } = await api.post("/query", { question: q });
      setHistory((prev) => [...prev, { question: q, result: data, error: null }]);
    } catch (err) {
      setHistory((prev) => [
        ...prev,
        {
          question: q,
          result: null,
          error: err?.response?.data?.message || "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setQueryLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  return (
    <AdminLayout>
      <style>{`
        .query-chip:hover { border-color: #0D9488 !important; color: #0D9488 !important; }
        .ask-btn:hover:not(:disabled) { background: #0D9488 !important; }
        .sql-toggle:hover { color: #0D9488 !important; }
        .new-query-btn:hover { border-color: #0D9488 !important; color: #0D9488 !important; }
      `}</style>

      <div style={{ maxWidth: 800, margin: "0 auto", paddingBottom: 40 }}>

        {/* ── Hero (only before first query) ── */}
        {!hasHistory && !queryLoading && (
          <div style={{ textAlign: "center", paddingTop: "2rem", marginBottom: "2rem" }}>
            <h1
              style={{
                fontSize: "3.2rem",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                color: "#111827",
                lineHeight: 1.1,
                marginBottom: "0.75rem",
              }}
            >
              What can I help you
              <br />
              find today?
            </h1>
            <p style={{ color: "#6B7280", fontSize: "0.95rem", lineHeight: 1.6 }}>
              Query your society data instantly using natural language,
              <br />
              powered by AI.
            </p>
          </div>
        )}

        {/* ── Suggested chips (only before first query) ── */}
        {!hasHistory && !queryLoading && (
          <div style={{ marginBottom: 28 }}>
            <p
              style={{
                textAlign: "center",
                fontSize: "0.7rem",
                fontWeight: 700,
                letterSpacing: "0.12em",
                color: "#9CA3AF",
                marginBottom: 14,
                textTransform: "uppercase",
              }}
            >
              Suggested Insights
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
              {SUGGESTED_QUERIES.map((sq) => (
                <button
                  key={sq}
                  className="query-chip"
                  onClick={() => handleQuery(sq)}
                  style={{
                    background: "#fff",
                    border: "1.5px solid #E5E7EB",
                    borderRadius: 999,
                    padding: "8px 18px",
                    fontSize: "0.8rem",
                    color: "#374151",
                    cursor: "pointer",
                    fontWeight: 500,
                    transition: "all 0.15s",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                    fontFamily: "inherit",
                  }}
                >
                  {sq}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── History ── */}
        {history.map((entry, idx) => {
          const resultColumns =
            entry.result?.results?.length > 0
              ? Object.keys(entry.result.results[0])
              : [];
          const showTable =
            entry.result?.results?.length > 0 && resultColumns.length > 1;

          return (
            <div key={idx} style={{ marginBottom: 32 }}>
              {/* Question bubble */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
                <div
                  style={{
                    background: "#111827",
                    color: "#fff",
                    borderRadius: "18px 18px 4px 18px",
                    padding: "10px 18px",
                    fontSize: "0.9rem",
                    maxWidth: "75%",
                    lineHeight: 1.5,
                    fontWeight: 500,
                  }}
                >
                  {entry.question}
                </div>
              </div>

              {/* Error */}
              {entry.error && (
                <div
                  style={{
                    background: "#FEF2F2",
                    border: "1.5px solid #FECACA",
                    borderRadius: 16,
                    padding: "16px 20px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <svg width="16" height="16" fill="none" stroke="#EF4444" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", color: "#991B1B", textTransform: "uppercase" }}>
                      Error
                    </span>
                  </div>
                  <p style={{ color: "#7F1D1D", fontSize: "0.88rem", margin: 0 }}>{entry.error}</p>
                </div>
              )}

              {/* Result */}
              {entry.result && (
                <>
                  <InsightBlock
                    insight={entry.result.insight}
                    rowCount={entry.result.rowCount}
                    results={entry.result.results}
                  />

                  {showTable && (
                    <div
                      style={{
                        background: "#fff",
                        border: "1.5px solid #E5E7EB",
                        borderRadius: 20,
                        overflow: "hidden",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                        marginBottom: 12,
                      }}
                    >
                      <div
                        style={{
                          padding: "14px 20px",
                          borderBottom: "1px solid #F3F4F6",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <h3 style={{ fontWeight: 700, fontSize: "0.88rem", color: "#111827", margin: 0 }}>
                          Results
                        </h3>
                        <span
                          style={{
                            background: "#F0FDFA",
                            color: "#0D9488",
                            borderRadius: 999,
                            padding: "3px 12px",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                          }}
                        >
                          {entry.result.rowCount} row{entry.result.rowCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <ResultTable results={entry.result.results} />
                    </div>
                  )}

                  {/* SQL toggle */}
                  
                  
                </>
              )}
            </div>
          );
        })}

        {/* Loading indicator */}
        {queryLoading && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#6B7280", fontSize: "0.88rem", marginBottom: 28 }}>
            <svg
              style={{ color: "#0D9488", flexShrink: 0, animation: "spin 1s linear infinite" }}
              width="18" height="18" fill="none" viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }} />
              <path fill="currentColor" d="M4 12a8 8 0 018-8v8z" style={{ opacity: 0.75 }} />
            </svg>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            Generating query and fetching results...
          </div>
        )}

        <div ref={bottomRef} />

        {/* ── Persistent input bar ── */}
        <div
          style={{
            position: hasHistory ? "sticky" : "relative",
            bottom: hasHistory ? 24 : "auto",
            zIndex: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "#fff",
              border: "1.5px solid #E5E7EB",
              borderRadius: 999,
              boxShadow: hasHistory
                ? "0 8px 32px rgba(0,0,0,0.12)"
                : "0 4px 24px rgba(0,0,0,0.08)",
              padding: "6px 6px 6px 20px",
              transition: "box-shadow 0.2s",
            }}
          >
            <svg style={{ flexShrink: 0, color: "#9CA3AF" }} width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !queryLoading && handleQuery()}
              placeholder={hasHistory ? "Ask a follow-up question..." : "Ask a question about your data..."}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: "0.95rem",
                color: "#111827",
                background: "transparent",
                padding: "6px 0",
                fontFamily: "inherit",
              }}
            />
            <button
              className="ask-btn"
              onClick={() => handleQuery()}
              disabled={queryLoading || !queryInput.trim()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: queryLoading || !queryInput.trim() ? "#D1D5DB" : "#111827",
                color: "#fff",
                border: "none",
                borderRadius: 999,
                padding: "10px 22px",
                fontSize: "0.875rem",
                fontWeight: 700,
                cursor: queryLoading || !queryInput.trim() ? "not-allowed" : "pointer",
                transition: "background 0.2s",
                fontFamily: "inherit",
              }}
            >
              {queryLoading ? (
                <svg style={{ animation: "spin 1s linear infinite" }} width="16" height="16" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }} />
                  <path fill="currentColor" d="M4 12a8 8 0 018-8v8z" style={{ opacity: 0.75 }} />
                </svg>
              ) : (
                <>
                  Ask
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </div>

          {hasHistory && (
            <p style={{ textAlign: "center", fontSize: "0.72rem", color: "#9CA3AF", marginTop: 8 }}>
              Results are generated from live data — always verify critical decisions.
            </p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}