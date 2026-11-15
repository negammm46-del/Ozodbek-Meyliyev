import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
// Use Node 22 built-in SQLite via dynamic require so TypeScript checks cleanly across @types/node versions
const sqlite = require('node:sqlite') as {
  DatabaseSync: new (path: string) => {
    exec: (sql: string) => void;
    prepare: (sql: string) => {
      run: (...args: unknown[]) => { changes: number; lastInsertRowid: number | bigint };
      get: (...args: unknown[]) => Record<string, unknown> | undefined;
      all: (...args: unknown[]) => Array<Record<string, unknown>>;
    };
  };
};

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export const db = new sqlite.DatabaseSync(path.join(DATA_DIR, 'geoworld.db'));

db.exec(`
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    auth_provider TEXT NOT NULL DEFAULT 'email',
    username TEXT NOT NULL,
    display_name TEXT NOT NULL,
    avatar TEXT NOT NULL DEFAULT '🧭',
    country_code TEXT NOT NULL DEFAULT 'UZ',
    geo_level TEXT NOT NULL DEFAULT 'O‘rta',
    learning_focus TEXT NOT NULL DEFAULT 'Ikkalasi',
    english_level TEXT NOT NULL DEFAULT 'A2',
    daily_goal_min INTEGER NOT NULL DEFAULT 20,
    favorite_continent TEXT NOT NULL DEFAULT 'Osiyo',
    onboarding_done INTEGER NOT NULL DEFAULT 0,
    email_verified INTEGER NOT NULL DEFAULT 0,
    verification_code TEXT,
    reset_code TEXT,
    reset_expires_at INTEGER,
    is_pro INTEGER NOT NULL DEFAULT 0,
    pro_plan TEXT NOT NULL DEFAULT 'free',
    pro_expires_at TEXT,
    xp INTEGER NOT NULL DEFAULT 60,
    streak INTEGER NOT NULL DEFAULT 1,
    last_active_date TEXT,
    ai_voice_uri TEXT NOT NULL DEFAULT '',
    ai_speech_rate REAL NOT NULL DEFAULT 1.0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS user_progress (
    user_id TEXT PRIMARY KEY,
    favorites_json TEXT NOT NULL DEFAULT '["uzbekistan","japan"]',
    completed_countries_json TEXT NOT NULL DEFAULT '[]',
    completed_territories_json TEXT NOT NULL DEFAULT '[]',
    unlocked_badges_json TEXT NOT NULL DEFAULT '[]',
    mastered_flashcards_json TEXT NOT NULL DEFAULT '[]',
    explored_countries_json TEXT NOT NULL DEFAULT '["Uzbekistan"]',
    quizzes_completed INTEGER NOT NULL DEFAULT 0,
    games_won INTEGER NOT NULL DEFAULT 0,
    high_scores_json TEXT NOT NULL DEFAULT '{}',
    learning_history_json TEXT NOT NULL DEFAULT '[]',
    daily_completed INTEGER NOT NULL DEFAULT 0,
    expert_certified INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS game_scores (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    username TEXT NOT NULL,
    avatar TEXT NOT NULL DEFAULT '🌍',
    game_id TEXT NOT NULL,
    score INTEGER NOT NULL,
    xp_earned INTEGER NOT NULL,
    difficulty TEXT NOT NULL DEFAULT 'medium',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS payments_log (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    plan TEXT NOT NULL,
    status TEXT NOT NULL,
    external_ref TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS promo_redemptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    code TEXT NOT NULL,
    discount_percent INTEGER NOT NULL DEFAULT 100,
    final_price REAL NOT NULL DEFAULT 0,
    subscription_type TEXT NOT NULL,
    subscription_plan TEXT NOT NULL,
    subscription_start TEXT NOT NULL,
    subscription_end TEXT,
    pro_status TEXT NOT NULL DEFAULT 'active',
    lifetime_pro INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    UNIQUE(user_id, code),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

for (const alterSql of [
  "ALTER TABLE users ADD COLUMN ai_voice_uri TEXT NOT NULL DEFAULT ''",
  'ALTER TABLE users ADD COLUMN ai_speech_rate REAL NOT NULL DEFAULT 1.0',
  "ALTER TABLE users ADD COLUMN subscription_type TEXT NOT NULL DEFAULT 'free'",
  'ALTER TABLE users ADD COLUMN subscription_start TEXT',
  'ALTER TABLE users ADD COLUMN lifetime_pro INTEGER NOT NULL DEFAULT 0',
  'ALTER TABLE users ADD COLUMN promo_code TEXT',
]) {
  try {
    db.exec(alterSql);
  } catch {
    // Column already exists
  }
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string | null): boolean {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, originalHex] = storedHash.split(':');
  const derived = crypto.scryptSync(password, salt, 64);
  const original = Buffer.from(originalHex, 'hex');
  if (derived.length !== original.length) return false;
  return crypto.timingSafeEqual(derived, original);
}

export function hashSessionToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function createSession(userId: string): string {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashSessionToken(rawToken);
  const now = Date.now();
  const expiresAt = now + 1000 * 60 * 60 * 24 * 30; // 30 days
  db.prepare(
    'INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)'
  ).run(tokenHash, userId, expiresAt, now);
  return rawToken;
}

export function getUserIdFromToken(rawToken: string | undefined): string | null {
  if (!rawToken) return null;
  const tokenHash = hashSessionToken(rawToken);
  const row = db
    .prepare('SELECT user_id, expires_at FROM sessions WHERE token_hash = ?')
    .get(tokenHash) as { user_id?: string; expires_at?: number } | undefined;
  if (!row || !row.user_id) return null;
  if ((row.expires_at ?? 0) < Date.now()) {
    db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash);
    return null;
  }
  return row.user_id;
}

export function safeJsonParse<T>(raw: unknown, fallback: T): T {
  if (typeof raw !== 'string') return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function formatUserResponse(row: Record<string, unknown>) {
  const isLifetime =
    Boolean(row.lifetime_pro) ||
    String(row.subscription_type || '') === 'lifetime' ||
    String(row.pro_plan || '') === 'lifetime';
  const expiresAt = row.pro_expires_at ? String(row.pro_expires_at) : null;
  const isExpired =
    !isLifetime &&
    Boolean(expiresAt && Date.now() >= new Date(expiresAt).getTime());
  const isProActive = isLifetime || (Boolean(row.is_pro) && !isExpired);

  return {
    id: String(row.id),
    email: String(row.email),
    authProvider: String(row.auth_provider || 'email'),
    username: String(row.username),
    displayName: String(row.display_name),
    avatar: String(row.avatar || '🧭'),
    countryCode: String(row.country_code || 'UZ'),
    geoLevel: String(row.geo_level || 'O‘rta'),
    learningFocus: String(row.learning_focus || 'Ikkalasi'),
    englishLevel: String(row.english_level || 'A2'),
    dailyGoalMin: Number(row.daily_goal_min || 20),
    favoriteContinent: String(row.favorite_continent || 'Osiyo'),
    onboardingDone: Boolean(row.onboarding_done),
    emailVerified: Boolean(row.email_verified),
    isPro: isProActive,
    proStatus: (isProActive ? 'active' : isExpired ? 'expired' : 'inactive') as
      | 'active'
      | 'inactive'
      | 'expired',
    subscriptionType: (isLifetime
      ? 'lifetime'
      : isProActive
        ? String(row.subscription_type || 'paid')
        : 'free') as 'free' | 'paid' | 'promo' | 'lifetime',
    proPlan: isLifetime
      ? 'lifetime'
      : isProActive
        ? String(row.pro_plan || 'monthly')
        : 'free',
    subscriptionStart: row.subscription_start ? String(row.subscription_start) : null,
    proExpiresAt: isLifetime ? null : expiresAt,
    lifetimePro: isLifetime,
    promoCode: row.promo_code ? String(row.promo_code) : undefined,
    xp: Number(row.xp || 60),
    streak: Number(row.streak || 1),
    lastActiveDate: row.last_active_date ? String(row.last_active_date) : null,
    aiVoiceUri: typeof row.ai_voice_uri === 'string' ? row.ai_voice_uri : '',
    aiSpeechRate:
      typeof row.ai_speech_rate === 'number' && Number.isFinite(row.ai_speech_rate)
        ? row.ai_speech_rate
        : 1.0,
    createdAt: String(row.created_at),
  };
}

export function getOrCreateProgress(userId: string) {
  let row = db
    .prepare('SELECT * FROM user_progress WHERE user_id = ?')
    .get(userId);
  if (!row) {
    const now = new Date().toISOString();
    db.prepare(
      'INSERT INTO user_progress (user_id, updated_at) VALUES (?, ?)'
    ).run(userId, now);
    row = db.prepare('SELECT * FROM user_progress WHERE user_id = ?').get(userId);
  }
  const r = row ?? {};
  return {
    favorites: safeJsonParse<string[]>(r.favorites_json, ['uzbekistan', 'japan']),
    completedCountries: safeJsonParse<string[]>(r.completed_countries_json, []),
    completedTerritories: safeJsonParse<string[]>(r.completed_territories_json, []),
    unlockedBadges: safeJsonParse<string[]>(r.unlocked_badges_json, []),
    masteredFlashcards: safeJsonParse<string[]>(r.mastered_flashcards_json, []),
    exploredCountries: safeJsonParse<string[]>(r.explored_countries_json, ['Uzbekistan']),
    quizzesCompleted: Number(r.quizzes_completed || 0),
    gamesWon: Number(r.games_won || 0),
    highScores: safeJsonParse<Record<string, number>>(r.high_scores_json, {}),
    learningHistory: safeJsonParse<
      Array<{ id: string; title: string; type: string; xp: number; at: string }>
    >(r.learning_history_json, []),
    dailyCompleted: Boolean(r.daily_completed),
    expertCertified: Boolean(r.expert_certified),
  };
}
