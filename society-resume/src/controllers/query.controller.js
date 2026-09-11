const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const SCHEMA_DESCRIPTION = `
You are a PostgreSQL expert that converts natural language questions into valid PostgreSQL queries.

=== EXACT SCHEMA ===

Table: "User"
- id: integer (primary key, auto increment)
- email: text (unique)
- role: text enum — exactly 'RESIDENT' or 'ADMIN' (never lowercase)
(password column exists but you must NEVER select or reference it)

Table: "Complaint"
- id: integer (primary key, auto increment)
- title: text (NOT NULL)
- description: text (NOT NULL)
- status: text enum — exactly 'OPEN', 'IN_PROGRESS', or 'RESOLVED' (never lowercase)
- image: text (NULLABLE)
- createdAt: timestamp with time zone (NOT NULL) — MUST always be quoted as "createdAt"
- userId: integer (NOT NULL, foreign key -> "User".id) — MUST always be quoted as "userId"
- category: text (NULLABLE — e.g. 'plumbing', 'noise', 'cleanliness', 'general', 'other')
- priority: text (NULLABLE — e.g. 'low', 'medium', 'high')
- urgencyScore: integer (NULLABLE) — MUST always be quoted as "urgencyScore"
- location: text (NULLABLE)

Table: "Notification"
- id: integer (primary key)
- userId: integer (foreign key -> "User".id) — MUST always be quoted as "userId"
- title: text
- body: text
- isRead: boolean — MUST always be quoted as "isRead"
- createdAt: timestamp — MUST always be quoted as "createdAt"

=== CAMELCASE COLUMNS — ALWAYS double-quote these or the query WILL fail ===
"createdAt", "userId", "urgencyScore", "isRead"

=== RULES ===
1. Only SELECT statements. Never INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE.
2. NEVER select or mention the password column.
3. Always double-quote table names: "User", "Complaint", "Notification"
4. Always double-quote camelCase columns: "createdAt", "userId", "urgencyScore", "isRead"
5. Use ILIKE for all text searches (category, title, description, priority, location)
6. For nullable columns (category, priority, image, urgencyScore, location), the WHERE clause must handle NULLs — use ILIKE which safely ignores NULLs, or add IS NOT NULL check when needed
7. Return ONLY the raw SQL — no markdown, no backticks, no comments, no explanation
8. If the question is completely unanswerable with this schema, return exactly: INVALID_QUERY

=== KEYWORD & NATURAL PHRASING SEARCH (CRITICAL) ===
When a user asks about an issue using conversational or multi-word terms (such as "ceiling leak", "broken elevator", "water dripping", "gym equipment", "trash overflowing"):
- DO NOT search for the entire multi-word phrase as a single rigid substring (e.g. NEVER write ILIKE '%ceiling leak%').
- Instead, break down the key terms and search across BOTH title and description:
  Example for "ceiling leak":
  WHERE ("Complaint".title ILIKE '%ceiling%' OR "Complaint".description ILIKE '%ceiling%')
    AND ("Complaint".title ILIKE '%leak%' OR "Complaint".description ILIKE '%leak%' OR "Complaint".title ILIKE '%drip%' OR "Complaint".description ILIKE '%drip%')
  Example for "gym equipment":
  WHERE ("Complaint".title ILIKE '%gym%' OR "Complaint".description ILIKE '%gym%' OR "Complaint".location ILIKE '%gym%' OR "Complaint".title ILIKE '%treadmill%' OR "Complaint".description ILIKE '%treadmill%')
- When the user asks for a specific attribute (e.g., "what is the location...", "who submitted...", "what status is..."), ALWAYS also SELECT "Complaint".id, "Complaint".title, and "Complaint".status alongside the requested attribute (e.g., "Complaint".location) so the user gets full context.
- Always ORDER BY "Complaint"."createdAt" DESC so the most recent complaints appear first.

=== DATE FILTERING — use these exact patterns ===

This month:
WHERE DATE_TRUNC('month', "createdAt") = DATE_TRUNC('month', NOW())

This week:
WHERE "createdAt" >= DATE_TRUNC('week', NOW())

Today:
WHERE "createdAt" >= CURRENT_DATE AND "createdAt" < CURRENT_DATE + INTERVAL '1 day'

Last 7 days:
WHERE "createdAt" >= NOW() - INTERVAL '7 days'

Last 30 days:
WHERE "createdAt" >= NOW() - INTERVAL '30 days'

Last month (previous calendar month):
WHERE DATE_TRUNC('month', "createdAt") = DATE_TRUNC('month', NOW() - INTERVAL '1 month')

SPECIFIC DATE WITHOUT YEAR: When the user says "12th March" or "March 12" with no year, 
generate: WHERE "createdAt"::date = '2026-03-12'
Use the current year always unless the user specifies otherwise. Today is ${new Date().toISOString().split('T')[0]}.

=== JOIN PATTERN — use when question asks about users/who ===
SELECT "User".id, "User".email, "User".role,
       "Complaint".id AS complaint_id, "Complaint".title, "Complaint".category,
       "Complaint".status, "Complaint"."createdAt"
FROM "Complaint"
JOIN "User" ON "Complaint"."userId" = "User".id
WHERE "Complaint".category ILIKE '%noise%'

=== AGGREGATION PATTERN ===
SELECT "User".email, COUNT("Complaint".id) AS complaint_count
FROM "User"
JOIN "Complaint" ON "Complaint"."userId" = "User".id
GROUP BY "User".id, "User".email
ORDER BY complaint_count DESC

=== MOST RECENT / LATEST / OLDEST PATTERN ===
SELECT "Complaint".id, "Complaint".title, "Complaint".category,
       "Complaint".status, "Complaint"."createdAt", "User".email
FROM "Complaint"
JOIN "User" ON "Complaint"."userId" = "User".id
WHERE "Complaint".category ILIKE '%plumbing%'
ORDER BY "Complaint"."createdAt" DESC
LIMIT 1

=== COMBINED EXAMPLE — filter + date + join ===
SELECT "User".email, "Complaint".title, "Complaint".category,
       "Complaint".status, "Complaint"."createdAt"
FROM "Complaint"
JOIN "User" ON "Complaint"."userId" = "User".id
WHERE "Complaint".category ILIKE '%noise%'
  AND DATE_TRUNC('month', "Complaint"."createdAt") = DATE_TRUNC('month', NOW())
ORDER BY "Complaint"."createdAt" DESC
`;

const INSIGHT_PROMPT = `
You are an intelligent admin assistant analyzing complaint/ticket data for a property management system.

Given a user's question and the raw database results, provide:
1. A concise 2-3 sentence insight that directly answers the question
2. Any notable patterns, anomalies, or actionable recommendations you notice
3. Keep it professional but conversational — like a smart colleague summarizing data for you

IMPORTANT: If rowCount is 0, your summary must ONLY say "No complaints were found matching this query." 
Do NOT speculate about why there are no results. Do NOT suggest data issues, collection problems, 
or any other explanation. Just state no results were found.

Format your response as JSON with this exact shape:
{
  "summary": "Direct answer to the question in 1-2 sentences",
  "insight": "Deeper observation or pattern noticed (1-2 sentences)",
  "recommendation": "Optional actionable recommendation if relevant, otherwise null"
}

Return ONLY the JSON. No markdown, no backticks, no explanation.
`;

const isSafeQuery = (sql) => {
  // Block destructive SQL keywords
  const forbidden = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|GRANT|REVOKE|CREATE|COPY|EXECUTE|DO|CALL|SET|VACUUM|REINDEX|CLUSTER|COMMENT|SECURITY|OWNER)\b/i;
  // Block password selection
  const selectsPassword = /SELECT[\s\S]*\bpassword\b[\s\S]*FROM/i;
  // Block dangerous PostgreSQL functions
  const dangerousFunctions = /\b(pg_read_file|pg_write_file|pg_sleep|pg_terminate_backend|pg_cancel_backend|lo_import|lo_export|dblink|copy_to|copy_from)\s*\(/i;
  // Block multiple statements (semicolons followed by more SQL)
  const multiStatement = /;\s*\S/;
  return !forbidden.test(sql) && !selectsPassword.test(sql) && !dangerousFunctions.test(sql) && !multiStatement.test(sql);
};

const { chatCompletion, cleanSQL, extractJson } = require("../services/aiClient");

const generateInsight = async (question, results, rowCount) => {
  try {
    const dataContext = `
User question: "${question}"
Row count: ${rowCount}
Results (first 20 rows): ${JSON.stringify(results.slice(0, 20), null, 2)}
`;

    const raw = await chatCompletion({
      temperature: 0.3,
      messages: [
        { role: "system", content: INSIGHT_PROMPT },
        { role: "user", content: dataContext },
      ],
    });

    return extractJson(raw);
  } catch (err) {
    console.error("Insight generation error:", err.message);
    return null;
  }
};

const naturalLanguageQuery = async (req, res) => {
  const { question } = req.body;

  if (!question || question.trim() === "") {
    return res.status(400).json({ message: "Question is required" });
  }

  try {
    // Step 1: Generate SQL from natural language
    let rawSQL;
    try {
      rawSQL = await chatCompletion({
        temperature: 0,
        messages: [
          { role: "system", content: SCHEMA_DESCRIPTION },
          { role: "user", content: question },
        ],
      });
    } catch (llmErr) {
      console.error("AI SQL generation error:", llmErr.message);
      return res.status(500).json({ message: "Failed to generate query from AI provider" });
    }

    const generatedSQL = cleanSQL(rawSQL);

    if (generatedSQL === "INVALID_QUERY") {
      return res.status(400).json({
        message: "This question cannot be answered with the available data.",
      });
    }

    if (!isSafeQuery(generatedSQL)) {
      return res.status(403).json({
        message: "Generated query was blocked for safety reasons.",
        generatedSQL,
      });
    }

    // Step 2: Execute SQL (with one auto-retry if it fails)
    console.log("[NL Query] Generated SQL:", generatedSQL);
    let result;
    let finalSQL = generatedSQL;

    try {
      result = await pool.query(generatedSQL);
    } catch (sqlErr) {
      console.error("[NL Query] SQL failed:", sqlErr.message);
      console.error("[NL Query] Failing SQL:", generatedSQL);

      // Retry: send the error back to LLM and ask it to fix the query
      try {
        console.log("[NL Query] Retrying with error context...");
        const rawFixedSQL = await chatCompletion({
          temperature: 0,
          messages: [
            { role: "system", content: SCHEMA_DESCRIPTION },
            { role: "user", content: question },
            { role: "assistant", content: generatedSQL },
            {
              role: "user",
              content: `That query failed with this PostgreSQL error: "${sqlErr.message}". Please fix the SQL and return only the corrected query. Remember: camelCase columns like "createdAt" and "userId" MUST be double-quoted.`,
            },
          ],
        });

        const fixedSQL = cleanSQL(rawFixedSQL);
        console.log("[NL Query] Retry SQL:", fixedSQL);

        if (!isSafeQuery(fixedSQL)) {
          return res.status(403).json({ message: "Generated query was blocked for safety reasons.", generatedSQL: fixedSQL });
        }

        result = await pool.query(fixedSQL);
        finalSQL = fixedSQL;
      } catch (retryErr) {
        console.error("[NL Query] Retry also failed:", retryErr.message);
        return res.status(400).json({
          message: `Unable to process this query. Try rephrasing your question.`,
          generatedSQL,
        });
      }
    }

    // Step 3: Generate AI insight from results (run in parallel isn't possible here
    // since we need results first, but we can still await it cleanly)
    const insight = await generateInsight(question, result.rows, result.rowCount);

    return res.status(200).json({
      question,
      generatedSQL: finalSQL,
      rowCount: result.rowCount,
      results: result.rows,
      insight, // { summary, insight, recommendation } or null
    });
  } catch (err) {
    console.error("Query error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = { naturalLanguageQuery };