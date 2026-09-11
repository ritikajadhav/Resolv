/**
 * Unified AI Client Adapter
 * 
 * Seamlessly toggles between:
 * 1. "groq"  - High-speed cloud inference via Groq LPUs (Default)
 * 2. "local" - 100% air-gapped, zero-data-leakage local inference via Ollama or vLLM
 * 
 * Both providers use the standard OpenAI-compatible `/chat/completions` endpoint.
 */

const getAiConfig = () => {
  const provider = (process.env.AI_PROVIDER || "groq").toLowerCase();

  if (provider === "local" || provider === "ollama") {
    return {
      provider: "local",
      baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1",
      textModel: process.env.LOCAL_TEXT_MODEL || "qwen2.5-coder:7b",
      visionModel: process.env.LOCAL_VISION_MODEL || "llama3.2-vision:11b",
      apiKey: process.env.LOCAL_API_KEY || "ollama",
    };
  }

  // Default: Cloud Groq LPU
  return {
    provider: "groq",
    baseURL: process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1",
    textModel: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
    visionModel: process.env.GROQ_VISION_MODEL || "qwen/qwen3.8-27b",
    apiKey: process.env.GROQ_API_KEY,
  };
};

/**
 * Execute a chat completion across the configured provider (Groq or local Ollama)
 */
const chatCompletion = async ({ messages, model, temperature = 0, isVision = false }) => {
  const config = getAiConfig();
  const selectedModel = model || (isVision ? config.visionModel : config.textModel);

  const res = await fetch(`${config.baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: selectedModel,
      temperature,
      messages,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`AI Provider (${config.provider}) error: ${JSON.stringify(data)}`);
  }

  return data.choices?.[0]?.message?.content?.trim() || "";
};

/**
 * Helper to extract JSON from model responses, stripping markdown code fences if present
 */
const extractJson = (text) => {
  if (!text) return null;
  const cleaned = text.replace(/```(?:json)?\s*([\s\S]*?)\s*```/i, "$1").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
};

/**
 * Helper to strip markdown SQL code fences from model responses
 */
const cleanSQL = (text) => {
  if (!text) return "";
  let sql = text.trim();
  sql = sql.replace(/```(?:sql)?\s*([\s\S]*?)\s*```/i, "$1").trim();
  return sql;
};

module.exports = {
  getAiConfig,
  chatCompletion,
  extractJson,
  cleanSQL,
};
