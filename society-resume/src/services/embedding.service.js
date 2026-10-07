/**
 * Embedding service: local sentence embeddings + cosine-similarity retrieval.
 *
 * Used to shortlist likely duplicate complaints BEFORE calling the LLM, so the
 * LLM only confirms the top-K candidates instead of reading every open ticket.
 *
 * Runs fully in-process (no external API, no data leaves the server) using
 * all-MiniLM-L6-v2 (384-dim). The model is downloaded once on first use.
 * Vectors are persisted in Complaint.embedding (Postgres Float[]).
 */

const prisma = require("../../prisma/client");

const MODEL_NAME = process.env.EMBEDDING_MODEL || "Xenova/all-MiniLM-L6-v2";
const TOP_K = parseInt(process.env.DUPLICATE_TOP_K || "5", 10);
const SIM_THRESHOLD = parseFloat(process.env.DUPLICATE_SIM_THRESHOLD || "0.5");

let extractorPromise = null;

// @huggingface/transformers is ESM-only, so load it lazily with dynamic import.
const getExtractor = () => {
  if (!extractorPromise) {
    extractorPromise = import("@huggingface/transformers")
      .then(({ pipeline }) => pipeline("feature-extraction", MODEL_NAME))
      .catch((err) => {
        extractorPromise = null; // allow retry on next call
        throw err;
      });
  }
  return extractorPromise;
};

const complaintToText = ({ title, description, location }) =>
  `${title}. ${description}${location ? `. Location: ${location}` : ""}`;

/** Returns an L2-normalized embedding (number[]) for the given text. */
const embedText = async (text) => {
  const extractor = await getExtractor();
  const output = await extractor(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
};

// Vectors are normalized, so cosine similarity == dot product.
const cosineSimilarity = (a, b) => {
  if (!a || !b || a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
};

/**
 * Rank open complaints by similarity to the new embedding.
 * Lazily backfills embeddings for older complaints that don't have one yet.
 * Returns the top-K complaints (with `similarity`) above the threshold.
 */
const findSimilarComplaints = async (queryEmbedding, openComplaints) => {
  const scored = [];

  for (const c of openComplaints) {
    let vec = c.embedding;
    if (!vec || vec.length === 0) {
      vec = await embedText(complaintToText(c));
      await prisma.complaint
        .update({ where: { id: c.id }, data: { embedding: vec } })
        .catch((err) => console.error("Embedding backfill failed:", err.message));
    }
    scored.push({ ...c, similarity: cosineSimilarity(queryEmbedding, vec) });
  }

  return scored
    .filter((c) => c.similarity >= SIM_THRESHOLD)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, TOP_K);
};

module.exports = {
  embedText,
  complaintToText,
  cosineSimilarity,
  findSimilarComplaints,
};
