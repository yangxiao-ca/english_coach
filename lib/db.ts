import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { AssessmentInput, LearningItemInput, SessionPlan, UsageStatus } from "./types";

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "english-coach.db");

let db: Database.Database | null = null;

export function getDb() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!db) {
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    migrate(db);
  }
  return db;
}

function migrate(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS learning_materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      topic TEXT,
      difficulty TEXT,
      purpose TEXT,
      content TEXT NOT NULL,
      source_type TEXT NOT NULL DEFAULT 'user_input',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS learning_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      expression TEXT NOT NULL,
      type TEXT NOT NULL,
      meaning_cn TEXT NOT NULL,
      explanation_en TEXT NOT NULL,
      example_sentence TEXT NOT NULL,
      speaking_scenario TEXT NOT NULL,
      why_learn TEXT NOT NULL,
      source_material_id INTEGER,
      topic TEXT,
      difficulty_level TEXT,
      ai_value_score INTEGER NOT NULL DEFAULT 3,
      speaking_usefulness_score INTEGER NOT NULL DEFAULT 3,
      business_relevance_score INTEGER NOT NULL DEFAULT 3,
      personal_relevance_score INTEGER NOT NULL DEFAULT 3,
      study_priority TEXT NOT NULL DEFAULT '一般学习',
      familiarity_level TEXT NOT NULL DEFAULT '完全陌生',
      synonyms TEXT,
      status TEXT NOT NULL DEFAULT 'candidate',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(source_material_id) REFERENCES learning_materials(id)
    );

    CREATE TABLE IF NOT EXISTS study_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      plan_json TEXT NOT NULL,
      target_item_ids TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'planned',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS practice_transcripts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      study_session_id INTEGER NOT NULL,
      transcript_text TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(study_session_id) REFERENCES study_sessions(id)
    );

    CREATE TABLE IF NOT EXISTS item_assessments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      study_session_id INTEGER NOT NULL,
      practice_transcript_id INTEGER NOT NULL,
      learning_item_id INTEGER NOT NULL,
      usage_status TEXT NOT NULL,
      usage_quality_score INTEGER NOT NULL,
      mistake_type TEXT,
      evidence_excerpt TEXT,
      better_expression TEXT,
      next_review_suggestion TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(study_session_id) REFERENCES study_sessions(id),
      FOREIGN KEY(practice_transcript_id) REFERENCES practice_transcripts(id),
      FOREIGN KEY(learning_item_id) REFERENCES learning_items(id)
    );

    CREATE TABLE IF NOT EXISTS review_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      learning_item_id INTEGER NOT NULL UNIQUE,
      mastery_level INTEGER NOT NULL DEFAULT 0,
      speaking_activation_level INTEGER NOT NULL DEFAULT 0,
      review_count INTEGER NOT NULL DEFAULT 0,
      wrong_count INTEGER NOT NULL DEFAULT 0,
      natural_use_count INTEGER NOT NULL DEFAULT 0,
      current_interval_days INTEGER NOT NULL DEFAULT 1,
      last_practiced_at TEXT,
      next_review_at TEXT,
      next_action TEXT NOT NULL DEFAULT 'new',
      FOREIGN KEY(learning_item_id) REFERENCES learning_items(id)
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  ensureColumn(database, "learning_items", "study_priority", "TEXT NOT NULL DEFAULT '一般学习'");
  ensureColumn(database, "learning_items", "familiarity_level", "TEXT NOT NULL DEFAULT '完全陌生'");
  ensureColumn(database, "learning_items", "synonyms", "TEXT");
  renameColumnIfExists(database, "review_schedules", "status", "next_action");
}

function renameColumnIfExists(database: Database.Database, table: string, from: string, to: string) {
  const columns = database.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (columns.some((item) => item.name === from) && !columns.some((item) => item.name === to)) {
    database.exec(`ALTER TABLE ${table} RENAME COLUMN ${from} TO ${to}`);
  }
}

function ensureColumn(database: Database.Database, table: string, column: string, definition: string) {
  const columns = database.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (!columns.some((item) => item.name === column)) {
    database.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

export function getSetting(key: string) {
  const row = getDb().prepare("SELECT value FROM app_settings WHERE key = ?").get(key) as { value: string } | undefined;
  return row?.value;
}

export function getAiSettings() {
  return {
    provider: getSetting("ai.provider") || "",
    apiKey: getSetting("ai.api_key") || "",
    model: getSetting("ai.model") || "",
    baseURL: getSetting("ai.base_url") || ""
  };
}

export function saveAiSettings(input: { provider: string; apiKey?: string; model: string; baseURL: string }) {
  const stmt = getDb().prepare(`
    INSERT INTO app_settings (key, value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
  `);
  const tx = getDb().transaction(() => {
    stmt.run("ai.provider", input.provider);
    if (input.apiKey) stmt.run("ai.api_key", input.apiKey);
    stmt.run("ai.model", input.model);
    stmt.run("ai.base_url", input.baseURL);
  });
  tx();
}

export function insertMaterial(input: {
  title: string;
  topic?: string;
  difficulty?: string;
  purpose?: string;
  content: string;
  source_type?: string;
}) {
  const result = getDb()
    .prepare(
      `INSERT INTO learning_materials (title, topic, difficulty, purpose, content, source_type)
       VALUES (@title, @topic, @difficulty, @purpose, @content, @source_type)`
    )
    .run({ ...input, source_type: input.source_type ?? "user_input" });
  return Number(result.lastInsertRowid);
}

export function insertLearningItems(items: LearningItemInput[], status: string, sourceMaterialId?: number | null, fallbackTopic?: string) {
  const stmt = getDb().prepare(`
    INSERT INTO learning_items (
      expression, type, meaning_cn, explanation_en, example_sentence, speaking_scenario, why_learn,
      source_material_id, topic, difficulty_level, ai_value_score, speaking_usefulness_score,
      business_relevance_score, personal_relevance_score, synonyms, status
    ) VALUES (
      @expression, @type, @meaning_cn, @explanation_en, @example_sentence, @speaking_scenario, @why_learn,
      @source_material_id, @topic, @difficulty_level, @ai_value_score, @speaking_usefulness_score,
      @business_relevance_score, @personal_relevance_score, @synonyms, @status
    )
  `);

  const rows = items.map((item) => ({
    ...item,
    source_material_id: sourceMaterialId ?? null,
    topic: item.topic ?? fallbackTopic ?? "",
    synonyms: item.synonyms?.length ? JSON.stringify(item.synonyms) : null,
    status
  }));

  const tx = getDb().transaction(() => rows.forEach((row) => stmt.run(row)));
  tx();
}

export function listItems(filters: Record<string, string | undefined> = {}) {
  const where: string[] = [];
  const params: Record<string, string> = {};
  for (const key of ["type", "topic", "difficulty_level", "status"] as const) {
    if (filters[key]) {
      where.push(`li.${key} = @${key}`);
      params[key] = filters[key]!;
    }
  }
  if (filters.library_scope === "1" && !filters.status) {
    where.push("li.status IN ('active', 'today', 'mastered')");
  }
  for (const key of ["study_priority", "familiarity_level"] as const) {
    if (filters[key]) {
      where.push(`li.${key} = @${key}`);
      params[key] = filters[key]!;
    }
  }
  for (const key of [
    "ai_value_score",
    "speaking_usefulness_score",
    "business_relevance_score",
    "personal_relevance_score"
  ] as const) {
    if (filters[key]) {
      where.push(`li.${key} >= @${key}`);
      params[key] = filters[key]!;
    }
  }
  if (filters.last_studied === "unlearned") {
    where.push("rs.last_practiced_at IS NULL");
  } else if (filters.last_studied === "today") {
    where.push("date(rs.last_practiced_at) = date('now')");
  } else if (filters.last_studied) {
    where.push("date(rs.last_practiced_at) <= date('now', @last_studied_modifier)");
    params.last_studied_modifier = `-${filters.last_studied} day`;
  }
  if (filters.next_review_at === "due") where.push(`(rs.next_review_at IS NULL OR date(rs.next_review_at) <= date('now'))`);
  if (filters.speaking_activation_level) {
    where.push("rs.speaking_activation_level >= @speaking_activation_level");
    params.speaking_activation_level = filters.speaking_activation_level;
  }
  const sql = `
    SELECT li.*, rs.mastery_level, rs.speaking_activation_level, rs.review_count, rs.last_practiced_at, rs.next_review_at, rs.next_action AS review_status
    FROM learning_items li
    LEFT JOIN review_schedules rs ON rs.learning_item_id = li.id
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY li.created_at DESC, li.id DESC
  `;
  return getDb().prepare(sql).all(params);
}

export function getItemStatusCounts() {
  const rows = getDb().prepare("SELECT status, count(*) AS count FROM learning_items GROUP BY status").all() as Array<{
    status: string;
    count: number;
  }>;
  return rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = row.count;
    return acc;
  }, {});
}

export function getDashboardStats() {
  const statusCounts = getItemStatusCounts();
  const todaySession = getTodayStudySession();
  const due = getDb()
    .prepare(
      `SELECT count(*) AS c
       FROM learning_items li
       JOIN review_schedules rs ON rs.learning_item_id = li.id
       WHERE li.status = 'active'
       AND (rs.next_review_at IS NULL OR date(rs.next_review_at) <= date('now'))`
    )
    .get() as { c: number };
  const transcripts = getDb()
    .prepare("SELECT count(*) AS c, max(created_at) AS last FROM practice_transcripts")
    .get() as { c: number; last: string | null };
  return {
    candidates: (statusCounts.candidate || 0) + (statusCounts.later || 0),
    active: statusCounts.active || 0,
    today: statusCounts.today || 0,
    mastered: statusCounts.mastered || 0,
    total: Object.values(statusCounts).reduce((a, b) => a + b, 0),
    todaySessionExists: !!todaySession,
    todaySessionId: todaySession?.id ?? null,
    dueCount: due.c,
    transcriptCount: transcripts.c,
    lastTranscriptAt: transcripts.last
  };
}

export function activateCandidateItems() {
  const database = getDb();
  const candidates = database.prepare("SELECT id FROM learning_items WHERE status IN ('candidate', 'later')").all() as Array<{ id: number }>;
  const tx = database.transaction(() => {
    const update = database.prepare("UPDATE learning_items SET status = 'active' WHERE id = ?");
    for (const candidate of candidates) {
      update.run(candidate.id);
      ensureReviewSchedule(candidate.id);
    }
  });
  tx();
  return candidates.length;
}

export function updateItemStatus(id: number, status: string) {
  getDb().prepare("UPDATE learning_items SET status = ? WHERE id = ?").run(status, id);
  if (status === "active" || status === "today") ensureReviewSchedule(id);
}

export function deleteItem(id: number) {
  getDb().prepare("DELETE FROM review_schedules WHERE learning_item_id = ?").run(id);
  getDb().prepare("DELETE FROM learning_items WHERE id = ?").run(id);
}

export function updateItem(id: number, patch: Record<string, unknown>) {
  const allowed = [
    "expression",
    "type",
    "meaning_cn",
    "explanation_en",
    "example_sentence",
    "speaking_scenario",
    "why_learn",
    "topic",
    "difficulty_level",
    "study_priority",
    "familiarity_level",
    "synonyms",
    "status"
  ];
  const keys = Object.keys(patch).filter((key) => allowed.includes(key));
  if (!keys.length) return;
  const sql = `UPDATE learning_items SET ${keys.map((key) => `${key} = @${key}`).join(", ")} WHERE id = @id`;
  getDb().prepare(sql).run({ ...patch, id });
}

export function ensureReviewSchedule(itemId: number) {
  getDb()
    .prepare(
      `      INSERT OR IGNORE INTO review_schedules
       (learning_item_id, next_review_at, next_action)
       VALUES (?, date('now'), 'new')`
    )
    .run(itemId);
}

export function getDueSessionItems(limit = 8) {
  const database = getDb();
  // Auto-generation source: due-review items first, then newest active items.
  // Staged (status='today') items are deliberately NOT included here — they are
  // user-curated on the page and committed via selected_ai/regenerate, so
  // historical leftovers never leak into auto-generation.
  const due = database
    .prepare(
      `SELECT li.*, rs.next_review_at, rs.mastery_level, rs.speaking_activation_level
       FROM learning_items li
       JOIN review_schedules rs ON rs.learning_item_id = li.id
       WHERE li.status = 'active'
       AND (rs.next_review_at IS NULL OR date(rs.next_review_at) <= date('now'))
       ORDER BY rs.next_review_at ASC, rs.wrong_count DESC
       LIMIT ?`
    )
    .all(limit);
  if (due.length >= limit) return due;
  const fresh = database
    .prepare(
      `SELECT li.*, rs.next_review_at, rs.mastery_level, rs.speaking_activation_level
       FROM learning_items li
       LEFT JOIN review_schedules rs ON rs.learning_item_id = li.id
       WHERE li.status = 'active' AND li.id NOT IN (${due.map(() => "?").join(",") || "0"})
       ORDER BY li.created_at DESC
       LIMIT ?`
    )
    .all(...due.map((item: any) => item.id), limit - due.length);
  return [...due, ...fresh];
}

export function createStudySession(plan: SessionPlan, itemIds: number[]) {
  const existing = getTodayStudySession();
  let sessionId: number;
  if (existing) {
    getDb()
      .prepare("UPDATE study_sessions SET title = ?, plan_json = ?, target_item_ids = ?, status = 'planned' WHERE id = ?")
      .run(plan.title, JSON.stringify(plan), JSON.stringify(itemIds), existing.id);
    sessionId = Number(existing.id);
  } else {
    const result = getDb()
      .prepare("INSERT INTO study_sessions (title, plan_json, target_item_ids) VALUES (?, ?, ?)")
      .run(plan.title, JSON.stringify(plan), JSON.stringify(itemIds));
    sessionId = Number(result.lastInsertRowid);
  }
  if (itemIds.length) {
    getDb()
      .prepare(`UPDATE learning_items SET status = 'active' WHERE status = 'today' AND id IN (${itemIds.map(() => "?").join(",")})`)
      .run(...itemIds);
  }
  return sessionId;
}

export function getTodayStudySession() {
  return getDb()
    .prepare("SELECT * FROM study_sessions WHERE date(created_at) = date('now') ORDER BY id DESC LIMIT 1")
    .get() as any;
}

export function getAllStagedTodayIds(): number[] {
  const rows = getDb().prepare("SELECT id FROM learning_items WHERE status = 'today'").all() as Array<{ id: number }>;
  return rows.map((row) => row.id);
}

/**
 * Single source of truth for "what I study today":
 * - session.target_item_ids  => committed items (authoritative)
 * - learning_items.status='today' items NOT yet in the session => pending staged additions
 */
export function getTodayItems(): { session: any | null; committed: any[]; pending: any[] } {
  const session = getTodayStudySession();
  if (!session) {
    return { session: null, committed: [], pending: getItemsByIds(getAllStagedTodayIds()) };
  }
  const committedIds: number[] = JSON.parse(session.target_item_ids || "[]").map((id: any) => Number(id));
  const committed = getItemsByIds(committedIds);
  const committedSet = new Set(committedIds.map((id) => Number(id)));
  const pending = getItemsByIds(getAllStagedTodayIds().filter((id) => !committedSet.has(Number(id))));
  return { session, committed, pending };
}

/**
 * Append staged (status='today') items to the existing today session WITHOUT regenerating the plan.
 * Flips the appended items back to 'active' and keeps target_expressions roughly in sync.
 * Returns null if there is no today session (caller should generate one first).
 */
export function appendToTodaySession(itemIds: number[]): { session: any; items: any[] } | null {
  const database = getDb();
  const session = getTodayStudySession();
  if (!session) return null;
  const existingIds: number[] = JSON.parse(session.target_item_ids || "[]").map((id: any) => Number(id));
  const existingSet = new Set(existingIds);
  const added = itemIds.filter((id) => !existingSet.has(Number(id)));
  if (!added.length) {
    const updated = getStudySession(session.id);
    return { session: updated, items: getItemsByIds(existingIds) };
  }
  const newIds = [...existingIds, ...added];
  const plan = JSON.parse(session.plan_json || "{}");
  if (added.length) {
    const addedItems = getItemsByIds(added) as any[];
    plan.target_expressions = Array.from(new Set([...(plan.target_expressions || []), ...addedItems.map((item) => item.expression)]));
  }
  database
    .prepare("UPDATE study_sessions SET target_item_ids = ?, plan_json = ? WHERE id = ?")
    .run(JSON.stringify(newIds), JSON.stringify(plan), session.id);
  database
    .prepare(`UPDATE learning_items SET status = 'active' WHERE status = 'today' AND id IN (${added.map(() => "?").join(",")})`)
    .run(...added);
  const updated = getStudySession(session.id);
  return { session: updated, items: getItemsByIds(newIds) };
}

/**
 * Remove items from today's session binding and send them back to the staged
 * ("待加入") pool so the user can re-add them. Keeps the plan's target_expressions
 * roughly in sync by pruning expressions of the removed items.
 */
export function detachFromTodaySession(itemIds: number[]): { session: any; committed: any[]; pending: any[] } | null {
  const database = getDb();
  const session = getTodayStudySession();
  if (!session) return null;
  const existingIds: number[] = JSON.parse(session.target_item_ids || "[]").map((id: any) => Number(id));
  const removeSet = new Set(itemIds.map((id) => Number(id)));
  const removedExisting = existingIds.filter((id) => removeSet.has(Number(id)));
  const newIds = existingIds.filter((id) => !removeSet.has(Number(id)));
  const plan = JSON.parse(session.plan_json || "{}");
  if (removedExisting.length) {
    const removedItems = getItemsByIds(removedExisting) as any[];
    const removedExpr = new Set(removedItems.map((item) => item.expression));
    if (Array.isArray(plan.target_expressions)) {
      plan.target_expressions = plan.target_expressions.filter((e: string) => !removedExpr.has(e));
    }
  }
  database
    .prepare("UPDATE study_sessions SET target_item_ids = ?, plan_json = ? WHERE id = ?")
    .run(JSON.stringify(newIds), JSON.stringify(plan), session.id);
  if (itemIds.length) {
    database
      .prepare(`UPDATE learning_items SET status = 'today' WHERE id IN (${itemIds.map(() => "?").join(",")})`)
      .run(...itemIds);
  }
  const updated = getStudySession(session.id);
  const committedSet = new Set(newIds.map((id) => Number(id)));
  const pending = getItemsByIds(getAllStagedTodayIds().filter((id) => !committedSet.has(Number(id))));
  return { session: updated, committed: getItemsByIds(newIds), pending };
}

/**
 * Clear the AI-generated content for today: delete the today session and return
 * its committed items to the staged ("待加入") pool so the user can regenerate.
 */
export function clearTodaySession(): void {
  const database = getDb();
  const session = getTodayStudySession();
  if (!session) return;
  const committedIds: number[] = JSON.parse(session.target_item_ids || "[]").map((id: any) => Number(id));
  database.prepare("DELETE FROM study_sessions WHERE id = ?").run(session.id);
  if (committedIds.length) {
    database
      .prepare(`UPDATE learning_items SET status = 'today' WHERE id IN (${committedIds.map(() => "?").join(",")})`)
      .run(...committedIds);
  }
}

export function updateStudySessionPlan(id: number, plan: SessionPlan) {
  getDb().prepare("UPDATE study_sessions SET title = ?, plan_json = ? WHERE id = ?").run(plan.title, JSON.stringify(plan), id);
}

export function listStudySessions() {
  return getDb()
    .prepare("SELECT id, title, status, created_at FROM study_sessions ORDER BY created_at DESC, id DESC")
    .all();
}

export function getStudySession(id: number) {
  return getDb().prepare("SELECT * FROM study_sessions WHERE id = ?").get(id) as any;
}

export function getItemsByIds(ids: number[]) {
  if (!ids.length) return [];
  return getDb()
    .prepare(`SELECT * FROM learning_items WHERE id IN (${ids.map(() => "?").join(",")})`)
    .all(...ids);
}

export function saveTranscriptAndAssessments(sessionId: number, transcript: string, assessments: AssessmentInput[]) {
  const database = getDb();
  const tx = database.transaction(() => {
    const transcriptResult = database
      .prepare("INSERT INTO practice_transcripts (study_session_id, transcript_text) VALUES (?, ?)")
      .run(sessionId, transcript);
    const transcriptId = Number(transcriptResult.lastInsertRowid);
    const stmt = database.prepare(`
      INSERT INTO item_assessments (
        study_session_id, practice_transcript_id, learning_item_id, usage_status, usage_quality_score,
        mistake_type, evidence_excerpt, better_expression, next_review_suggestion
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const assessment of assessments) {
      stmt.run(
        sessionId,
        transcriptId,
        assessment.learning_item_id,
        assessment.usage_status,
        assessment.usage_quality_score,
        assessment.mistake_type ?? "",
        assessment.evidence_excerpt,
        assessment.better_expression,
        assessment.next_review_suggestion
      );
      applyReviewRule(assessment.learning_item_id, assessment.usage_status);
    }
    database.prepare("UPDATE study_sessions SET status = 'assessed' WHERE id = ?").run(sessionId);
    return transcriptId;
  });
  return tx();
}

function applyReviewRule(itemId: number, usageStatus: UsageStatus) {
  const rule: Record<UsageStatus, { days: number; nextAction: string; mastery: number; activation: number; wrong: number; natural: number; practiced: number }> = {
    not_used: { days: 1, nextAction: "practice", mastery: 0, activation: -1, wrong: 0, natural: 0, practiced: 0 },
    partial: { days: 2, nextAction: "practice", mastery: 0, activation: 0, wrong: 0, natural: 0, practiced: 1 },
    forced: { days: 3, nextAction: "change_scenario", mastery: 0, activation: 0, wrong: 0, natural: 0, practiced: 1 },
    wrong: { days: 1, nextAction: "correction", mastery: -1, activation: -1, wrong: 1, natural: 0, practiced: 1 },
    correct: { days: 7, nextAction: "review", mastery: 1, activation: 1, wrong: 0, natural: 0, practiced: 1 },
    natural: { days: 14, nextAction: "active", mastery: 2, activation: 2, wrong: 0, natural: 1, practiced: 1 },
    creative: { days: 30, nextAction: "mastered", mastery: 3, activation: 3, wrong: 0, natural: 1, practiced: 1 }
  };
  const selected = rule[usageStatus];
  ensureReviewSchedule(itemId);
  getDb()
    .prepare(
      `UPDATE review_schedules
       SET review_count = review_count + 1,
           wrong_count = wrong_count + @wrong,
           natural_use_count = natural_use_count + @natural,
           mastery_level = max(0, mastery_level + @mastery),
           speaking_activation_level = max(0, speaking_activation_level + @activation),
           current_interval_days = @days,
           last_practiced_at = CASE WHEN @practiced = 1 THEN datetime('now') ELSE last_practiced_at END,
           next_review_at = date('now', @modifier),
           next_action = @nextAction
       WHERE learning_item_id = @itemId`
    )
    .run({ ...selected, modifier: `+${selected.days} days`, itemId });
  if (usageStatus === "creative") getDb().prepare("UPDATE learning_items SET status = 'mastered' WHERE id = ?").run(itemId);
}

export function getLatestAssessmentReport() {
  const session = getDb()
    .prepare("SELECT * FROM study_sessions WHERE status = 'assessed' ORDER BY id DESC LIMIT 1")
    .get() as any;
  if (!session) return null;
  const rows = getDb()
    .prepare(
      `SELECT ia.*, li.expression, li.type, rs.next_review_at, rs.next_action AS review_status
       FROM item_assessments ia
       JOIN learning_items li ON li.id = ia.learning_item_id
       LEFT JOIN review_schedules rs ON rs.learning_item_id = li.id
       WHERE ia.study_session_id = ?
       ORDER BY ia.id ASC`
    )
    .all(session.id);
  return { session, assessments: rows };
}

export function listAssessmentDates() {
  return getDb()
    .prepare(
      `SELECT date(created_at) AS date, count(*) AS count
       FROM item_assessments
       GROUP BY date(created_at)
       ORDER BY date DESC`
    )
    .all();
}

export function getAssessmentReportByDate(date?: string) {
  const dates = listAssessmentDates() as Array<{ date: string; count: number }>;
  const selectedDate = date || dates[0]?.date;
  if (!selectedDate) return { dates, selectedDate: "", sessions: [] };

  const sessions = getDb()
    .prepare(
      `SELECT DISTINCT ss.*
       FROM study_sessions ss
       JOIN item_assessments ia ON ia.study_session_id = ss.id
       WHERE date(ia.created_at) = date(?)
       ORDER BY ss.id DESC`
    )
    .all(selectedDate) as any[];

  const sessionReports = sessions.map((session) => {
    const assessments = getDb()
      .prepare(
        `SELECT ia.*, li.expression, li.type, rs.next_review_at, rs.next_action AS review_status
         FROM item_assessments ia
         JOIN learning_items li ON li.id = ia.learning_item_id
         LEFT JOIN review_schedules rs ON rs.learning_item_id = li.id
         WHERE ia.study_session_id = ? AND date(ia.created_at) = date(?)
         ORDER BY ia.id ASC`
      )
      .all(session.id, selectedDate);
    return { session, assessments };
  });

  return { dates, selectedDate, sessions: sessionReports };
}
