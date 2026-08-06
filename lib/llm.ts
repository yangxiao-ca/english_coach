import OpenAI from "openai";
import { getAiSettings } from "./db";
import { AssessmentInput, LearningItemInput, SessionPlan } from "./types";

type AiProvider = "openai" | "deepseek" | "glm";

const providerDefaults: Record<AiProvider, { apiKeyEnv: string; baseURL?: string; model: string }> = {
  openai: {
    apiKeyEnv: "OPENAI_API_KEY",
    model: "gpt-4.1-mini"
  },
  deepseek: {
    apiKeyEnv: "DEEPSEEK_API_KEY",
    baseURL: "https://api.deepseek.com",
    model: "deepseek-v4-flash"
  },
  glm: {
    apiKeyEnv: "GLM_API_KEY",
    baseURL: "https://open.bigmodel.cn/api/paas/v4",
    model: "glm-5.2"
  }
};

function getProviderConfig() {
  const saved = getAiSettings();
  const configuredProvider = (saved.provider || process.env.AI_PROVIDER || "deepseek").toLowerCase() as AiProvider;
  const selected = providerDefaults[configuredProvider] ? configuredProvider : "deepseek";
  const defaults = providerDefaults[selected];
  const apiKey = saved.apiKey || process.env.AI_API_KEY || process.env[defaults.apiKeyEnv];
  if (!apiKey) {
    throw new Error(
      `Missing API key. Open Settings to configure ${selected}, or set AI_API_KEY / ${defaults.apiKeyEnv} in .env.local.`
    );
  }
  return {
    apiKey,
    baseURL: saved.baseURL || process.env.AI_BASE_URL || defaults.baseURL,
    model: saved.model || process.env.AI_MODEL || defaults.model
  };
}

function client() {
  const config = getProviderConfig();
  return new OpenAI({ apiKey: config.apiKey, baseURL: config.baseURL });
}

async function jsonCall<T>(system: string, user: string): Promise<T> {
  const config = getProviderConfig();
  const response = await client().chat.completions.create({
    model: config.model,
    temperature: 0.35,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user }
    ]
  });
  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("LLM returned an empty response.");
  return JSON.parse(content) as T;
}

const itemSchema = `
Return strict JSON only:
{
  "items": [
    {
      "expression": "string",
      "type": "word|phrase|collocation|sentence_pattern|golden_expression",
      "meaning_cn": "中文含义",
      "explanation_en": "short English explanation",
      "example_sentence": "natural spoken example",
      "speaking_scenario": "where the learner can say it",
      "why_learn": "why it improves speaking",
      "topic": "string",
      "difficulty_level": "A1|A2|B1|B2|C1|C2",
      "ai_value_score": 1-5,
      "speaking_usefulness_score": 1-5,
      "business_relevance_score": 1-5,
      "personal_relevance_score": 1-5
    }
  ]
}`;

export async function extractItemsFromMaterial(input: {
  title: string;
  topic: string;
  difficulty: string;
  purpose: string;
  content: string;
  extraRequirements?: string;
}) {
  const system = `You are an English speaking coach and curriculum designer. Extract high-leverage learning_items for spoken English, not isolated vocabulary trivia. Prefer reusable phrases, collocations, sentence patterns, and golden expressions.

Item mix policy:
- Do include some abstract social-science vocabulary that educated people regularly read in mainstream news and use in discussion — e.g. policy, institution, accountability, transparency, consensus, polarization, sustainability, paradigm, legitimacy, implication, perception, discourse, narrative, initiative, phenomenon, inequality. No fixed proportion required; just make sure such words are represented.
- Keep such abstract items relatively common: they must appear in mainstream news/newspapers and stay usable in everyday conversation, NOT rare academic or specialized jargon. If a word would only show up in academic papers, exclude it.
- For every abstract item, still provide a concrete everyday speaking scenario and a natural example sentence so the learner can actually use it in conversation.

${itemSchema}`;
  const user = `Material title: ${input.title}
Topic: ${input.topic}
Difficulty: ${input.difficulty}
Learner purpose: ${input.purpose}

Material:
${input.content}

${
  input.extraRequirements
    ? `Additional one-off requirements for this extraction (follow these strictly):\n${input.extraRequirements}\n\n`
    : ""
}Choose 8-15 items that are useful for speaking practice.`;
  const result = await jsonCall<{ items: LearningItemInput[] }>(system, user);
  return result.items;
}

export async function generateItems(input: {
  topic: string;
  difficulty: string;
  scenario: string;
  goal: string;
  count: number;
}) {
  const system = `You are an English speaking coach for adult learners who want higher-value spoken English.

Generate practical but non-basic learning_items for a learner to activate in conversation. The items should feel useful for real adult conversation, workplace discussion, interviews, meetings, opinions, storytelling, negotiation, and nuanced self-expression.

Difficulty policy:
- Respect the requested difficulty strictly.
- If the user asks for B1, generate solid B1-B2 items, not A1/A2 beginner items.
- If the user asks for B2, generate B2-C1 items.
- If the user asks for C1, generate C1 items with nuance, precision, and natural phrasing.
- Avoid overly simple textbook expressions such as "by the way", "make a decision", "I think", "very good", "have you ever", unless the user's requested difficulty is A1/A2.
- Prefer reusable sentence frames, collocations, discourse phrases, and golden expressions that help the learner sound more natural and articulate.
- Avoid rare, literary, slangy, or test-only expressions.

${itemSchema}`;
  const user = `Generate ${input.count} learning_items.
Topic: ${input.topic}
Difficulty: ${input.difficulty}
Speaking scenario: ${input.scenario}
Learner goal: ${input.goal}

Balance types across word, phrase, collocation, sentence_pattern, and golden_expression.

Prioritize expressions that are slightly above the learner's comfort zone but still usable in speaking. For each item, make why_learn specific and explain the speaking value.`;
  const result = await jsonCall<{ items: LearningItemInput[] }>(system, user);
  return result.items;
}

// Mode "items": classic expression-training coach (default).
const SESSION_SYSTEM_ITEMS = `You are a strict but encouraging English speaking teacher. Build today's small speaking practice package from target learning_items.

CRITICAL SCOPE RULE — use ONLY the provided items:
- target_expressions must be EXACTLY the expressions of the provided learning_items — never invent, substitute, add, or drop any of them.
- sentence_drills, scenario_tasks, speaking tasks and the Doubao prompt may use supporting words to frame examples, but must NOT introduce any new expression as something to learn. Every drill and task must revolve around exactly the provided expressions.
- Cover all provided expressions; if the provided list is short, go deeper on each one instead of adding new ones.

The Doubao prompt should make Doubao teach the learner expressions directly, not only role-play. It must clearly require Doubao to speak English only during coaching: all explanations, corrections, examples, encouragement, questions, and scenario practice must be in English. Do not let Doubao use Chinese during the practice.

It must ask Doubao to follow this flow:
1. Present each target expression with a simple English meaning and one natural full sentence.
2. Ask the learner to repeat the full sentence exactly.
3. Ask the learner to make 1-2 original sentences using the expression.
4. Correct the learner's sentence briefly in English and give a more natural version.
5. After all expressions, run a short scenario practice that encourages natural use of the expressions.
6. At the end, provide a clean transcript that the learner can paste back into this app for assessment.

Return JSON only:
{
  "title": "string",
  "target_expressions": ["string"],
  "sentence_drills": ["string"],
  "scenario_tasks": ["string"],
  "speaking_task_30s": "string",
  "speaking_task_90s": "string",
  "doubao_prompt": "Instruction the learner can copy into Doubao. It must require English-only coaching, teach ONLY the target_expressions listed above (no extra words to learn), full-sentence repetition, learner-created sentences, correction, then a short scenario practice and final transcript."
}`;

// Mode "scenario": everyday-life scenario coach (user's 6-step lesson structure).
const SESSION_SYSTEM_SCENARIO = `You are a friendly, patient English speaking coach for an intermediate learner who wants to improve spoken English for everyday life in the United States.

The learner's main goals:
- learning new, natural expressions, sentence patterns, and useful vocabulary;
- speaking more fluently in practical situations, such as returning products, making polite complaints, calling customer service, ordering food, and handling everyday matters;
- moving beyond basic phrases and using more flexible, natural English.

CRITICAL SCOPE RULE — teach ONLY the provided items:
- The 5-8 expressions taught in this session must come EXACTLY from the provided learning_items. Never invent, substitute, add, or drop any of them. If fewer than 5 items are provided, teach exactly those and go deeper on each.
- Drills, the role-play dialogue and the Doubao prompt may use supporting words to make the scenario natural, but must NOT introduce any new expression as something to learn.

Build the Doubao prompt with this lesson structure:
1. Choose one practical situation (use the requested scenario).
2. Teach 5-8 useful expressions and explain them briefly.
3. Let the learner repeat and make their own sentences.
4. Role-play the situation with the learner.
5. Correct mistakes gently. Explain the most important correction, but do not interrupt too often.
6. After the lesson, give a written review note with:
   - new phrases and vocabulary;
   - the learner's mistakes and corrected versions;
   - short explanations;
   - a model response;
   - a small practice task for next time.

Doubao must speak English only during coaching: all explanations, corrections, examples, encouragement, questions, and role-play must be in English. Speak clearly at a moderate speed. If the learner says "Please repeat," repeat the sentence more slowly. Encourage complete sentences, but give the learner time to think before responding.

Return JSON only:
{
  "title": "string",
  "target_expressions": ["string"],
  "sentence_drills": ["string"],
  "scenario_tasks": ["string"],
  "speaking_task_30s": "string",
  "speaking_task_90s": "string",
  "doubao_prompt": "Instruction the learner can copy into Doubao: a scenario coach following the 6-step structure above, teaching ONLY the target_expressions, English-only, role-play, and ending with a written review note."
}`;

function sessionUserPrompt(items: any[], mode: "items" | "scenario", scenario?: string) {
  if (mode === "scenario") {
    return `Target learning_items (the ONLY expressions to teach — these are the 5-8 expressions for step 2):
${JSON.stringify(items, null, 2)}

Today's practical situation to practice: ${scenario || "a common everyday situation in the United States"}

Build a complete session following the 6-step structure. scenario_tasks should contain the role-play setup; doubao_prompt must be the full coach instruction the learner can copy into Doubao.`;
  }
  return `Target learning_items (these are the ONLY expressions to learn today):
${JSON.stringify(items, null, 2)}

Create a compact but complete session. Use ONLY the expressions above as target_expressions — do NOT add, substitute, or rename any of them. Every drill, task, and the Doubao instruction must revolve around exactly these expressions.

Make the Doubao prompt practical and direct. The learner wants Doubao to guide the whole session in English only. The learner wants to learn these exact expressions immediately, including whole-sentence repetition and making their own sentences.`;
}

export async function generateSessionPlan(
  items: any[],
  opts: { mode?: "items" | "scenario"; scenario?: string } = {}
): Promise<SessionPlan> {
  const mode = opts.mode === "scenario" ? "scenario" : "items";
  const system = mode === "scenario" ? SESSION_SYSTEM_SCENARIO : SESSION_SYSTEM_ITEMS;
  const plan = await jsonCall<SessionPlan>(system, sessionUserPrompt(items, mode, opts.scenario));
  // Hard guarantee: target list is exactly the provided items, no matter what the model returns.
  plan.target_expressions = Array.from(new Set(items.map((item: any) => item.expression)));
  return plan;
}

export async function assessTranscript(items: any[], transcript: string) {
  const system = `You are an English speaking assessment teacher. Evaluate whether each target learning_item was activated in the transcript. Return JSON only:
{
  "assessments": [
    {
      "learning_item_id": number,
      "usage_status": "not_used|partial|forced|wrong|correct|natural|creative",
      "usage_quality_score": 1-5,
      "mistake_type": "meaning_error|collocation_error|grammar_error|word_form_error|unnatural_expression|underuse|overuse or empty string",
      "evidence_excerpt": "short quote from transcript, or empty if not_used",
      "better_expression": "more natural version",
      "next_review_suggestion": "specific Chinese suggestion"
    }
  ]
}

Rules:
- not_used: absent.
- partial: attempted but incomplete.
- forced: technically okay but awkwardly inserted.
- wrong: meaning or form is wrong.
- correct: understandable and appropriate.
- natural: fluent and idiomatic.
- creative: natural plus flexible adaptation.`;
  const user = `Target learning_items:
${JSON.stringify(items, null, 2)}

Transcript:
${transcript}

Assess every target item exactly once.`;
  const result = await jsonCall<{ assessments: AssessmentInput[] }>(system, user);
  return result.assessments;
}
