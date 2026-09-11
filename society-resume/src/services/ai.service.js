const { chatCompletion, extractJson } = require("./aiClient");

const aiRequest = async (systemPrompt, userMessage) => {
  return await chatCompletion({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
  });
};

// Feature 1: Auto-categorize a complaint
const categorizeComplaint = async (title, description) => {
  const systemPrompt = `
You are an assistant that categorizes housing society complaints.

Given a complaint title and description, return a JSON object with exactly two fields:
- "category": one of ["plumbing", "electrical", "security", "cleanliness", "noise", "structural", "elevator", "other"]
- "priority": one of ["low", "medium", "high"]

Priority rules:
- high: safety risk, affects many residents, or urgent (e.g. gas leak, broken elevator, flooding)
- medium: inconvenient but not urgent (e.g. flickering light, dirty hallway)
- low: minor issues (e.g. small cosmetic damage, suggestion)

Return ONLY the raw JSON object. No explanation, no markdown, no backticks.
`;

  const userMessage = `Title: ${title}\nDescription: ${description}`;
  const raw = await aiRequest(systemPrompt, userMessage);
  const parsed = extractJson(raw);
  return parsed || { category: "other", priority: "medium" };
};

// Feature 3: Duplicate detection (location-aware)
const checkDuplicate = async (newTitle, newDescription, newLocation, existingComplaints) => {
  if (!existingComplaints || existingComplaints.length === 0) return { isDuplicate: false, duplicateId: null };

  const systemPrompt = `
You are an assistant that detects duplicate housing society complaints.

Given a new complaint and a list of existing open complaints, determine if the new complaint is a duplicate.

Rules for flagging as duplicate:
- The issue must be clearly the same (e.g. both about water leaking, both about broken elevator)
- The location must also match (e.g. same flat number, same common area like lobby or parking)
- If the new complaint has no location and an existing one does, do NOT flag as duplicate
- If both have no location but the issue is identical, flag as duplicate
- Common area complaints (lobby, parking, rooftop) are duplicates only if they describe the exact same issue in the exact same area
- Different flat numbers = NOT a duplicate even if the issue is the same

Return a JSON object with exactly two fields:
- "isDuplicate": true or false
- "duplicateId": the id of the matching complaint, or null if no duplicate

Return ONLY the raw JSON object. No explanation, no markdown, no backticks.
`;

  const existingList = existingComplaints
    .map((c) => `ID: ${c.id} | Title: ${c.title} | Description: ${c.description} | Location: ${c.location || "not specified"}`)
    .join("\n");

  const userMessage = `New complaint:\nTitle: ${newTitle}\nDescription: ${newDescription}\nLocation: ${newLocation || "not specified"}\n\nExisting open complaints:\n${existingList}`;
  const raw = await aiRequest(systemPrompt, userMessage);
  const parsed = extractJson(raw);
  return parsed || { isDuplicate: false, duplicateId: null };
};

// Feature 4: Suggest admin response
const suggestResponse = async (title, description, category, priority) => {
  const systemPrompt = `
You are an assistant that helps housing society admins respond to resident complaints professionally.

Given a complaint, generate a short, professional, empathetic response an admin would send to the resident.
- Acknowledge the issue
- Mention it will be looked into
- Give a realistic timeframe based on priority (high: 24hrs, medium: 3 days, low: 1 week)
- Keep it under 3 sentences

Return ONLY the response text. No explanation, no markdown.
`;

  const userMessage = `Title: ${title}\nDescription: ${description}\nCategory: ${category}\nPriority: ${priority}`;
  return await aiRequest(systemPrompt, userMessage);
};

// Feature 5: Image analysis (vision) - human in the loop
const analyzeImage = async (imageBase64, mimeType, title, description) => {
  try {
    const raw = await chatCompletion({
      isVision: true,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are analyzing a photo submitted with a housing society complaint.

Complaint title: "${title}"
Complaint description: "${description}"

Look at the image and return a JSON object with exactly four fields:
- "aiTitle": a 2-5 words title for the complaint based on the image
- "aiDescription": a 1-2 sentence description of what you see in the image relevant to the complaint
- "suggestedCategory": one of ["plumbing", "electrical", "security", "cleanliness", "noise", "structural", "elevator", "other"]
- "confidence": one of ["high", "medium", "low"] based on how clearly the image supports the complaint

Return ONLY the raw JSON object. No explanation, no markdown, no backticks.`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
    });

    const parsed = extractJson(raw);
    return (
      parsed || {
        aiTitle: "Could not analyze image.",
        aiDescription: "Could not analyze image.",
        suggestedCategory: "other",
        confidence: "low",
      }
    );
  } catch (err) {
    console.error("Image analysis failed in AI client:", err.message);
    return {
      aiTitle: "Could not analyze image.",
      aiDescription: "Could not analyze image.",
      suggestedCategory: "other",
      confidence: "low",
    };
  }
};

module.exports = {
  categorizeComplaint,
  checkDuplicate,
  suggestResponse,
  analyzeImage,
};
