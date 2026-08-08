export const itemTypes = ["word", "phrase", "collocation", "sentence_pattern", "golden_expression"] as const;
export const usageStatuses = ["not_used", "partial", "forced", "wrong", "correct", "natural", "creative"] as const;
export const mistakeTypes = [
  "meaning_error",
  "collocation_error",
  "grammar_error",
  "word_form_error",
  "unnatural_expression",
  "underuse",
  "overuse"
] as const;

export type LearningItemType = (typeof itemTypes)[number];
export type UsageStatus = (typeof usageStatuses)[number];

// 同义/近义/可替换表达：词汇、短语或句式
export type Synonym = {
  text: string;
  type?: "word" | "phrase" | "sentence_pattern";
};

export type LearningItemInput = {
  expression: string;
  type: LearningItemType;
  meaning_cn: string;
  explanation_en: string;
  example_sentence: string;
  speaking_scenario: string;
  why_learn: string;
  topic?: string;
  difficulty_level: string;
  ai_value_score: number;
  speaking_usefulness_score: number;
  business_relevance_score: number;
  personal_relevance_score: number;
  synonyms?: Synonym[];
};

export type SessionPlan = {
  title: string;
  target_expressions: string[];
  sentence_drills: string[];
  scenario_tasks: string[];
  speaking_task_30s: string;
  speaking_task_90s: string;
  doubao_prompt: string;
};

export type AssessmentInput = {
  learning_item_id: number;
  usage_status: UsageStatus;
  usage_quality_score: number;
  mistake_type?: string;
  evidence_excerpt: string;
  better_expression: string;
  next_review_suggestion: string;
};
