const axios = require('axios');

// DeepSeek's API is OpenAI-compatible — same request/response shape, different base URL.
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
const MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

const client = axios.create({
  baseURL: DEEPSEEK_BASE_URL,
  headers: {
    'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    'Content-Type':  'application/json',
  },
  timeout: 60000,
});

// ── Shared helper ─────────────────────────────────────────────────────────────

async function chat(systemPrompt, userMessage, maxTokens = 2048) {
  const response = await client.post('/chat/completions', {
    model:       MODEL,
    max_tokens:  maxTokens,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userMessage },
    ],
  });

  const text = response.data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('DeepSeek returned an empty response.');
  return text;
}

// ── 1. Generate Curriculum ────────────────────────────────────────────────────

async function generateCurriculum({ topic, language, user }) {
  const system = `You are KrestLab's AI curriculum designer. You create personalised, 
structured coding curricula for developers. You respond ONLY with valid JSON.`;

  const prompt = `Create a complete learning curriculum for:
Topic: "${topic}"
Language: "${language}"
Student level: beginner (assume no prior knowledge of this specific topic)

Respond with this exact JSON structure (no markdown, no extra text):
{
  "topic": "string",
  "language": "string",
  "level": "beginner",
  "description": "2-sentence overview of what the student will achieve",
  "capstone": {
    "title": "string",
    "description": "string - the final project that proves mastery",
    "starterCode": "string - skeleton code with TODO comments",
    "solution": "string - full working solution"
  },
  "steps": [
    {
      "index": 0,
      "title": "string",
      "objective": "one sentence — what the student will be able to do after this step",
      "explanation": "string — 3-5 paragraph lesson explaining the concept clearly with analogies",
      "starterCode": "string — incomplete code with TODO comments the student must fill in",
      "solution": "string — complete working solution",
      "language": "${language}"
    }
  ]
}

Requirements:
- 6 to 10 steps, progressing logically from fundamentals to the capstone
- Each step builds on the previous
- starterCode should be genuinely incomplete but give clear hints via comments
- Keep explanations friendly, direct, and jargon-light
- The capstone project must use all concepts taught`;

  const raw = await chat(system, prompt, 4096);

  try {
    const clean = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch (e) {
    throw new Error('Failed to parse curriculum from AI. Please try again.');
  }
}

// ── 2. Expand a Step ──────────────────────────────────────────────────────────

async function expandStep({ step, language }) {
  const system = `You are KrestLab's AI tutor. You explain code concepts clearly and write 
excellent starter code with helpful TODO comments. Respond ONLY with valid JSON.`;

  const prompt = `Expand this curriculum step into a full lesson:
Step title: "${step.title}"
Objective: "${step.objective}"
Language: "${language}"

Respond with:
{
  "explanation": "string — a thorough, friendly explanation (4-6 paragraphs) with concrete examples",
  "starterCode": "string — runnable starter code with TODO sections for the student to complete"
}`;

  const raw = await chat(system, prompt, 2048);
  try {
    const clean = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return { explanation: raw, starterCode: step.starterCode || '' };
  }
}

// ── 3. Explain a Concept ─────────────────────────────────────────────────────

async function explainConcept({ topic, code, language, question }) {
  const system = `You are KrestLab's AI tutor — clear, encouraging, and direct. 
You explain code line-by-line when asked and always give concrete examples.`;

  const parts = [];
  if (topic)    parts.push(`Topic: ${topic}`);
  if (language) parts.push(`Language: ${language}`);
  if (question) parts.push(`Student question: ${question}`);
  if (code)     parts.push(`Student's current code:\n\`\`\`${language}\n${code}\n\`\`\``);

  const prompt = parts.join('\n\n') + '\n\nPlease explain clearly and helpfully.';

  return await chat(system, prompt, 1500);
}

// ── 4. Give a Hint ────────────────────────────────────────────────────────────

async function getHint({ code, language, context, question }) {
  const system = `You are KrestLab's AI tutor. Give a helpful hint that guides the student 
toward the solution WITHOUT giving the full answer. Be Socratic — ask a guiding question 
if appropriate. Keep hints under 150 words.`;

  const prompt = `The student is stuck.
Language: ${language}
Task context: ${context?.stepTitle || 'current exercise'}
Their question: ${question || 'I am stuck'}
Their current code:
\`\`\`${language}
${code || '(empty)'}
\`\`\`

Give one focused hint.`;

  return await chat(system, prompt, 400);
}

// ── 5. Review Code ────────────────────────────────────────────────────────────

async function reviewCode({ code, language, context }) {
  const system = `You are KrestLab's AI code reviewer. You give constructive, 
educational feedback. You celebrate what the student did well, identify bugs or 
improvements, and explain why — without just handing them the fixed code. 
Respond with valid JSON only.`;

  const prompt = `Review this student's code submission:
Language: ${language}
Step objective: ${context?.stepObjective || 'complete the exercise'}
Expected behaviour: ${context?.expectedOutput || 'see step description'}

Student code:
\`\`\`${language}
${code}
\`\`\`

Respond with:
{
  "passed": true/false,
  "score": 0-100,
  "summary": "one sentence overall verdict",
  "positives": ["what they did well"],
  "issues": [{"line": null_or_number, "description": "what's wrong", "hint": "nudge toward fix"}],
  "nextSuggestion": "one concrete thing to try next"
}`;

  const raw = await chat(system, prompt, 1200);
  try {
    const clean = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return { passed: false, score: 0, summary: raw, positives: [], issues: [], nextSuggestion: '' };
  }
}

module.exports = {
  generateCurriculum,
  expandStep,
  explainConcept,
  getHint,
  reviewCode,
};
