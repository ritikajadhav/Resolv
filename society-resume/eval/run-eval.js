/**
 * Text-to-SQL evaluation harness.
 *
 * Usage:  npm run eval:sql
 *
 * For every question it: generates SQL with the production prompt/guardrails,
 * executes it (read-only) in an isolated `resolv_eval` schema, runs the gold SQL
 * on the same data, and compares the result rows. Reports execution accuracy,
 * result accuracy, refusal accuracy, retry rate and latency.
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const { SCHEMA_DESCRIPTION, isSafeQuery } = require("../src/controllers/query.controller");
const { chatCompletion, cleanSQL, getAiConfig } = require("../src/services/aiClient");
const { SCHEMA_NAME, DDL, USERS, COMPLAINTS, NOTIFICATIONS, CASES } = require("./dataset");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Groq free tier is ~8k tokens/min and each prompt is ~1.8k tokens, so 429s are
// expected. Wait the time the API suggests and retry instead of failing the case.
const llm = async (args, attempts = 6) => {
  for (let i = 0; i < attempts; i++) {
    try {
      return await chatCompletion(args);
    } catch (err) {
      const m = /try again in ([\d.]+)s/i.exec(err.message);
      if (!/rate.?limit|429/i.test(err.message) || i === attempts - 1) throw err;
      const wait = Math.ceil((m ? parseFloat(m[1]) : 10) * 1000) + 1000;
      console.log(`   (rate limited, waiting ${Math.round(wait / 1000)}s...)`);
      await sleep(wait);
    }
  }
};

// ---------- seeding ----------
const seed = async (client) => {
  await client.query(`DROP SCHEMA IF EXISTS ${SCHEMA_NAME} CASCADE`);
  await client.query(`CREATE SCHEMA ${SCHEMA_NAME}`);
  // Only the eval schema is on the path: generated SQL can never touch real tables.
  await client.query(`SET search_path TO ${SCHEMA_NAME}`);
  await client.query(DDL);

  for (const [id, email, role] of USERS) {
    await client.query(
      `INSERT INTO "User"(id, email, password, role) VALUES ($1,$2,'x',$3)`,
      [id, email, role]
    );
  }
  for (const [id, title, desc, status, category, priority, location, userId, ageSql] of COMPLAINTS) {
    await client.query(
      `INSERT INTO "Complaint"(id,title,description,status,category,priority,location,"userId","createdAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,${ageSql})`,
      [id, title, desc, status, category, priority, location, userId]
    );
  }
  for (const [userId, title, body, isRead] of NOTIFICATIONS) {
    await client.query(
      `INSERT INTO "Notification"("userId", title, body, "isRead") VALUES ($1,$2,$3,$4)`,
      [userId, title, body, isRead]
    );
  }
};

// ---------- execution ----------
const runReadOnly = async (client, sql) => {
  await client.query("BEGIN READ ONLY");
  try {
    await client.query("SET LOCAL statement_timeout = 5000");
    const res = await client.query(sql);
    await client.query("COMMIT");
    return res.rows;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  }
};

// ---------- comparison ----------
const norm = (v) => {
  if (v === null || v === undefined) return "null";
  if (v instanceof Date) return v.toISOString();
  return String(v);
};
const toRows = (rows) => rows.map((r) => Object.values(r).map(norm));

// true if multiset `needle` is contained in multiset `hay`
const contains = (hay, needle) => {
  const counts = new Map();
  hay.forEach((v) => counts.set(v, (counts.get(v) || 0) + 1));
  for (const v of needle) {
    if (!counts.get(v)) return false;
    counts.set(v, counts.get(v) - 1);
  }
  return true;
};

/**
 * Generated rows match gold rows if there are the same number of rows and each
 * gold row's values appear in a distinct generated row. Extra columns (the prompt
 * intentionally adds context columns) and column aliases are ignored.
 */
const rowsMatch = (goldRows, genRows, ordered) => {
  if (goldRows.length !== genRows.length) {
    return { ok: false, reason: `row count ${genRows.length} vs expected ${goldRows.length}` };
  }
  if (ordered) {
    for (let i = 0; i < goldRows.length; i++) {
      if (!contains(genRows[i], goldRows[i])) return { ok: false, reason: `row ${i + 1} differs / wrong order` };
    }
    return { ok: true };
  }
  const used = new Set();
  for (const g of goldRows) {
    const idx = genRows.findIndex((r, i) => !used.has(i) && contains(r, g));
    if (idx === -1) return { ok: false, reason: `missing row [${g.join(", ")}]` };
    used.add(idx);
  }
  return { ok: true };
};

const sameRows = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ---------- generation (mirrors query.controller.js, incl. one retry) ----------
const generateAndRun = async (client, question) => {
  const raw = await llm({
    temperature: 0,
    messages: [
      { role: "system", content: SCHEMA_DESCRIPTION },
      { role: "user", content: question },
    ],
  });
  let sql = cleanSQL(raw);
  if (sql === "INVALID_QUERY") return { outcome: "invalid_query", sql };
  if (!isSafeQuery(sql)) return { outcome: "blocked", sql };

  try {
    return { outcome: "ok", sql, rows: await runReadOnly(client, sql), retried: false };
  } catch (err) {
    const fixedRaw = await llm({
      temperature: 0,
      messages: [
        { role: "system", content: SCHEMA_DESCRIPTION },
        { role: "user", content: question },
        { role: "assistant", content: sql },
        {
          role: "user",
          content: `That query failed with this PostgreSQL error: "${err.message}". Please fix the SQL and return only the corrected query. Remember: camelCase columns like "createdAt" and "userId" MUST be double-quoted.`,
        },
      ],
    });
    const fixed = cleanSQL(fixedRaw);
    if (!isSafeQuery(fixed)) return { outcome: "blocked", sql: fixed };
    try {
      return { outcome: "ok", sql: fixed, rows: await runReadOnly(client, fixed), retried: true };
    } catch (err2) {
      return { outcome: "exec_error", sql: fixed, error: err2.message, retried: true };
    }
  }
};

// ---------- main ----------
const main = async () => {
  const client = await pool.connect();
  const results = [];
  try {
    await seed(client);

    // Sanity-check the gold SQL against hard-coded expected values.
    const goldRowsById = {};
    for (const c of CASES.filter((c) => c.type !== "refuse")) {
      const rows = toRows(await runReadOnly(client, c.goldSql));
      goldRowsById[c.id] = rows;
      if (c.expected) {
        const ok = c.ordered
          ? sameRows(rows, c.expected)
          : sameRows([...rows].map(String).sort(), [...c.expected].map(String).sort());
        if (!ok) throw new Error(`Gold SQL for case ${c.id} disagrees with expected: ${JSON.stringify(rows)}`);
      }
    }
    console.log(`Gold SQL verified against dataset (${Object.keys(goldRowsById).length} cases).\n`);

    const cfg = getAiConfig();
    console.log(`Model: ${cfg.textModel} (${cfg.provider})\n`);

    for (const c of CASES) {
      const t0 = Date.now();
      let pass = false, reason = "", gen, llmError = false;
      try {
        gen = await generateAndRun(client, c.question);
        if (c.type === "refuse") {
          pass = gen.outcome === "invalid_query" || gen.outcome === "blocked";
          reason = pass ? "" : `executed: ${gen.sql}`;
        } else if (gen.outcome === "ok") {
          const m = rowsMatch(goldRowsById[c.id], toRows(gen.rows), c.ordered);
          pass = m.ok;
          reason = m.reason || "";
        } else {
          reason = gen.outcome === "exec_error" ? `SQL error: ${gen.error}` : gen.outcome;
        }
      } catch (err) {
        reason = `LLM error: ${err.message}`;
        llmError = true;
      }
      const ms = Date.now() - t0;
      results.push({ ...c, pass, llmError, reason, outcome: gen?.outcome, retried: !!gen?.retried, generatedSql: gen?.sql, ms });
      console.log(`${pass ? "PASS" : "FAIL"}  #${String(c.id).padStart(2)}  ${c.question}${pass ? "" : `\n        -> ${reason}\n        SQL: ${gen?.sql || "-"}`}`);
      await sleep(400); // be gentle with provider rate limits
    }
  } finally {
    await client.query(`DROP SCHEMA IF EXISTS ${SCHEMA_NAME} CASCADE`).catch(() => {});
    client.release();
    await pool.end();
  }

  // ---------- report ----------
  // Cases that failed due to provider errors (not the model's SQL) are excluded.
  const scored = results.filter((r) => !r.llmError);
  const answerable = scored.filter((r) => r.type !== "refuse");
  const refuse = scored.filter((r) => r.type === "refuse");
  const pct = (n, d) => (d ? `${((n / d) * 100).toFixed(1)}%` : "n/a");
  const executed = answerable.filter((r) => r.outcome === "ok");
  const correct = answerable.filter((r) => r.pass);
  const retried = answerable.filter((r) => r.retried);
  const avgMs = Math.round(results.reduce((s, r) => s + r.ms, 0) / results.length);

  console.log("\n================ SUMMARY ================");
  console.log(`Result accuracy (answerable): ${correct.length}/${answerable.length}  ${pct(correct.length, answerable.length)}`);
  console.log(`Execution rate (valid SQL):   ${executed.length}/${answerable.length}  ${pct(executed.length, answerable.length)}`);
  console.log(`Needed error-retry:           ${retried.length}/${answerable.length}`);
  console.log(`Refusal/safety accuracy:      ${refuse.filter((r) => r.pass).length}/${refuse.length}`);
  console.log(`Overall:                      ${results.filter((r) => r.pass).length}/${results.length}`);
  console.log(`Avg latency per question:     ${avgMs} ms`);

  const byTag = {};
  results.forEach((r) => {
    byTag[r.tag] = byTag[r.tag] || { p: 0, t: 0 };
    byTag[r.tag].t++;
    if (r.pass) byTag[r.tag].p++;
  });
  console.log("\nBy category:");
  Object.entries(byTag).forEach(([t, v]) => console.log(`  ${t.padEnd(18)} ${v.p}/${v.t}`));

  const outDir = path.join(__dirname, "results");
  fs.mkdirSync(outDir, { recursive: true });
  const file = path.join(outDir, `text-to-sql-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  fs.writeFileSync(file, JSON.stringify({ model: getAiConfig().textModel, results }, null, 2));
  console.log(`\nSaved detailed results to ${file}`);
};

main().catch((err) => {
  console.error("Eval failed:", err);
  process.exit(1);
});
