import 'dotenv/config';
import fs from 'node:fs';
import http from 'node:http';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { WebSocketServer, type WebSocket } from 'ws';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import {
  createSession,
  db,
  formatUserResponse,
  getOrCreateProgress,
  getUserIdFromToken,
  hashPassword,
  hashSessionToken,
  verifyPassword,
} from './server/db';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface FirebaseServerConfig {
  projectId?: string;
  apiKey?: string;
  oAuthClientId?: string;
  firestoreDatabaseId?: string;
}

let firebaseServerConfig: FirebaseServerConfig = {};
try {
  const cfgPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(cfgPath)) {
    firebaseServerConfig = JSON.parse(
      fs.readFileSync(cfgPath, 'utf-8')
    ) as FirebaseServerConfig;
  }
} catch {
  firebaseServerConfig = {};
}

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'negammm46@gmail.com')
  .trim()
  .toLowerCase();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '1mb' }));

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx <= 0) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    out[k] = decodeURIComponent(v);
  }
  return out;
}

function setSessionCookie(res: express.Response, token: string) {
  const maxAge = 60 * 60 * 24 * 30;
  res.setHeader(
    'Set-Cookie',
    `geoworld_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}`
  );
}

function clearSessionCookie(res: express.Response) {
  res.setHeader(
    'Set-Cookie',
    'geoworld_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0'
  );
}

function getAuthenticatedUser(req: express.Request) {
  const cookies = parseCookies(req.headers.cookie);
  const userId = getUserIdFromToken(cookies.geoworld_session);
  if (!userId) return null;
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  return row ?? null;
}

function getServiceStatus() {
  const googleClientId =
    process.env.GOOGLE_CLIENT_ID || firebaseServerConfig.oAuthClientId || '';
  const stripeKey = process.env.STRIPE_SECRET_KEY || '';
  const geminiKey = process.env.GEMINI_API_KEY || '';
  const firebaseApiKey =
    process.env.VITE_FIREBASE_API_KEY || firebaseServerConfig.apiKey || '';
  const firebaseProjectId =
    process.env.VITE_FIREBASE_PROJECT_ID || firebaseServerConfig.projectId || '';
  return {
    googleAuthConfigured: Boolean(googleClientId || firebaseApiKey),
    googleClientId: googleClientId || null,
    stripeConfigured: Boolean(
      stripeKey &&
        process.env.STRIPE_PRICE_MONTHLY &&
        process.env.STRIPE_PRICE_YEARLY
    ),
    geminiConfigured: Boolean(geminiKey && geminiKey !== 'MY_GEMINI_API_KEY'),
    firebaseConfigured: Boolean(firebaseApiKey && firebaseProjectId),
    firebaseProjectId: firebaseProjectId || null,
  };
}

function isVerifiedAdminRow(userRow: Record<string, unknown> | null): boolean {
  if (!userRow) return false;
  return (
    Boolean(userRow.email_verified) &&
    String(userRow.email || '').trim().toLowerCase() === ADMIN_EMAIL
  );
}

function reconcileUserProExpiration(
  userRow: Record<string, unknown>
): Record<string, unknown> {
  const userId = String(userRow.id);
  const isLifetime =
    Boolean(userRow.lifetime_pro) ||
    String(userRow.subscription_type || '') === 'lifetime' ||
    String(userRow.pro_plan || '') === 'lifetime';

  if (isLifetime) {
    if (!userRow.is_pro || userRow.pro_expires_at !== null || !userRow.lifetime_pro) {
      db.prepare(
        "UPDATE users SET is_pro = 1, pro_plan = 'lifetime', pro_expires_at = NULL, subscription_type = 'lifetime', lifetime_pro = 1 WHERE id = ?"
      ).run(userId);
      return db.prepare('SELECT * FROM users WHERE id = ?').get(userId) ?? userRow;
    }
    return userRow;
  }

  const expiresAt = userRow.pro_expires_at ? String(userRow.pro_expires_at) : null;
  if (
    Boolean(userRow.is_pro) &&
    expiresAt &&
    Date.now() >= new Date(expiresAt).getTime()
  ) {
    db.prepare(
      "UPDATE users SET is_pro = 0, pro_plan = 'free', subscription_type = 'free' WHERE id = ?"
    ).run(userId);
    db.prepare(
      "UPDATE promo_redemptions SET pro_status = 'expired' WHERE user_id = ? AND lifetime_pro = 0 AND pro_status = 'active'"
    ).run(userId);
    return db.prepare('SELECT * FROM users WHERE id = ?').get(userId) ?? userRow;
  }

  return userRow;
}

function buildSubscriptionPayload(userRow: Record<string, unknown>) {
  const isLifetime =
    Boolean(userRow.lifetime_pro) ||
    String(userRow.subscription_type || '') === 'lifetime' ||
    String(userRow.pro_plan || '') === 'lifetime';
  const expiresAt = userRow.pro_expires_at ? String(userRow.pro_expires_at) : null;
  const expired =
    !isLifetime &&
    Boolean(expiresAt && Date.now() >= new Date(expiresAt).getTime());
  const active = isLifetime || (Boolean(userRow.is_pro) && !expired);
  const subType = isLifetime
    ? 'lifetime'
    : active
      ? String(userRow.subscription_type || 'paid')
      : 'free';
  const plan = isLifetime
    ? 'lifetime'
    : active
      ? String(userRow.pro_plan || 'monthly')
      : 'free';
  const promoCode = userRow.promo_code ? String(userRow.promo_code) : undefined;
  const paymentProvider =
    subType === 'lifetime' || subType === 'promo'
      ? 'promo_code'
      : active
        ? 'stripe'
        : 'none';

  return {
    uid: String(userRow.id),
    subscriptionStatus: (active ? 'active' : expired ? 'expired' : 'inactive') as
      | 'active'
      | 'inactive'
      | 'expired',
    subscriptionType: subType as 'free' | 'paid' | 'promo' | 'lifetime',
    subscriptionPlan: plan as 'free' | 'monthly' | 'yearly' | 'lifetime',
    subscriptionStartDate: userRow.subscription_start
      ? String(userRow.subscription_start)
      : userRow.created_at
        ? String(userRow.created_at)
        : null,
    subscriptionEndDate: isLifetime ? null : expiresAt,
    proStatus: (active ? 'active' : expired ? 'expired' : 'inactive') as
      | 'active'
      | 'inactive'
      | 'expired',
    lifetimePro: isLifetime,
    promoCode,
    paymentProvider: paymentProvider as
      | 'none'
      | 'stripe'
      | 'admin_grant'
      | 'promo_code',
    entitlementStatus: (active ? 'pro' : 'free') as 'pro' | 'free',
  };
}

async function resolveAuthenticatedOrFirebaseUser(
  req: express.Request,
  res: express.Response
): Promise<Record<string, unknown> | null> {
  const cookieUser = getAuthenticatedUser(req);
  if (cookieUser) {
    return reconcileUserProExpiration(cookieUser);
  }

  const authHeader = String(req.headers.authorization || '');
  const bearerToken = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : '';
  const apiKey =
    process.env.VITE_FIREBASE_API_KEY || firebaseServerConfig.apiKey || '';
  if (!bearerToken || !apiKey) return null;

  try {
    const verifyRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(
        apiKey
      )}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: bearerToken }),
      }
    );
    const verifyJson = (await verifyRes.json()) as {
      users?: Array<{
        localId: string;
        email?: string;
        emailVerified?: boolean;
        displayName?: string;
        providerUserInfo?: Array<{ providerId?: string }>;
      }>;
    };
    const fbUser = verifyJson.users?.[0];
    if (!verifyRes.ok || !fbUser?.localId) return null;

    const uid = fbUser.localId;
    const email = (fbUser.email || `${uid}@firebase.geoworld`).toLowerCase();
    const displayName = fbUser.displayName || email.split('@')[0];
    const provider =
      fbUser.providerUserInfo?.[0]?.providerId === 'google.com'
        ? 'google'
        : 'firebase';
    const verified = fbUser.emailVerified ? 1 : 0;
    const today = new Date().toISOString().slice(0, 10);

    let row = db
      .prepare('SELECT * FROM users WHERE id = ? OR email = ?')
      .get(uid, email);
    if (!row) {
      db.prepare(
        `INSERT INTO users (
          id, email, auth_provider, username, display_name, email_verified, last_active_date, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        uid,
        email,
        provider,
        displayName,
        displayName,
        verified,
        today,
        new Date().toISOString()
      );
      row = db.prepare('SELECT * FROM users WHERE id = ?').get(uid);
    }

    if (!row) return null;
    const token = createSession(String(row.id));
    setSessionCookie(res, token);
    return reconcileUserProExpiration(row);
  } catch {
    return null;
  }
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function touchUserStreak(userId: string) {
  const row = db
    .prepare('SELECT streak, last_active_date FROM users WHERE id = ?')
    .get(userId) as { streak?: number; last_active_date?: string } | undefined;
  if (!row) return;
  const today = new Date().toISOString().slice(0, 10);
  if (row.last_active_date === today) return;
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const nextStreak =
    row.last_active_date === yesterday ? Number(row.streak || 1) + 1 : 1;
  db.prepare(
    'UPDATE users SET streak = ?, last_active_date = ? WHERE id = ?'
  ).run(nextStreak, today, userId);
}

// ================= AUTHENTICATION & PROFILE =================

app.get('/api/auth/me', (req, res) => {
  const userRow = getAuthenticatedUser(req);
  const services = getServiceStatus();
  if (!userRow) {
    res.json({ user: null, progress: null, services });
    return;
  }
  touchUserStreak(String(userRow.id));
  const rawRefreshed = db
    .prepare('SELECT * FROM users WHERE id = ?')
    .get(String(userRow.id));
  const refreshed = rawRefreshed ? reconcileUserProExpiration(rawRefreshed) : null;
  const progress = getOrCreateProgress(String(userRow.id));
  res.json({
    user: refreshed ? formatUserResponse(refreshed) : null,
    subscription: refreshed ? buildSubscriptionPayload(refreshed) : null,
    progress,
    services,
  });
});

app.post('/api/auth/register', (req, res) => {
  const { email, password, username, countryCode } = req.body as {
    email?: string;
    password?: string;
    username?: string;
    countryCode?: string;
  };

  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanName = String(username || '').trim();
  const rawPass = String(password || '');

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    res.status(400).json({ error: 'To‘g‘ri email manzil kiriting.' });
    return;
  }
  if (rawPass.length < 6) {
    res.status(400).json({
      error: 'Parol kamida 6 ta belgidan iborat bo‘lishi kerak.',
    });
    return;
  }
  if (cleanName.length < 2) {
    res.status(400).json({
      error: 'Foydalanuvchi nomi kamida 2 ta belgidan iborat bo‘lishi kerak.',
    });
    return;
  }

  const existing = db
    .prepare('SELECT id FROM users WHERE email = ?')
    .get(cleanEmail);
  if (existing) {
    res.status(409).json({
      error: 'Bu email manzil allaqachon ro‘yxatdan o‘tgan. Tizimga kiring.',
    });
    return;
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const today = now.slice(0, 10);
  const verificationCode = String(crypto.randomInt(100000, 999999));

  db.prepare(
    `INSERT INTO users (
      id, email, password_hash, auth_provider, username, display_name,
      country_code, verification_code, last_active_date, created_at
    ) VALUES (?, ?, ?, 'email', ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    cleanEmail,
    hashPassword(rawPass),
    cleanName,
    cleanName,
    String(countryCode || 'UZ').toUpperCase(),
    verificationCode,
    today,
    now
  );

  const progress = getOrCreateProgress(id);
  const token = createSession(id);
  setSessionCookie(res, token);

  const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(id)!;
  res.status(201).json({
    user: formatUserResponse(userRow),
    progress,
    verificationHint: verificationCode,
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  const cleanEmail = String(email || '').trim().toLowerCase();
  const rawPass = String(password || '');

  const row = db
    .prepare('SELECT * FROM users WHERE email = ?')
    .get(cleanEmail) as Record<string, unknown> | undefined;

  if (!row || !verifyPassword(rawPass, (row.password_hash as string | null) ?? null)) {
    res.status(401).json({ error: 'Email yoki parol noto‘g‘ri.' });
    return;
  }

  const userId = String(row.id);
  touchUserStreak(userId);
  const token = createSession(userId);
  setSessionCookie(res, token);

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(userId)!;
  res.json({
    user: formatUserResponse(updated),
    progress: getOrCreateProgress(userId),
  });
});

app.post('/api/auth/firebase-session', async (req, res) => {
  const { idToken } = req.body as { idToken?: string };
  const apiKey =
    process.env.VITE_FIREBASE_API_KEY || firebaseServerConfig.apiKey || '';
  if (!idToken || !apiKey) {
    res.status(400).json({ error: 'Firebase ID token yoki API key mavjud emas.' });
    return;
  }

  try {
    const verifyRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(
        apiKey
      )}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );
    const verifyJson = (await verifyRes.json()) as {
      users?: Array<{
        localId: string;
        email?: string;
        emailVerified?: boolean;
        displayName?: string;
        providerUserInfo?: Array<{ providerId?: string }>;
      }>;
    };

    const fbUser = verifyJson.users?.[0];
    if (!verifyRes.ok || !fbUser?.localId) {
      res.status(401).json({ error: 'Firebase sessiyasi tasdiqlanmadi.' });
      return;
    }

    const uid = fbUser.localId;
    const email = (fbUser.email || `${uid}@firebase.geoworld`).toLowerCase();
    const displayName = fbUser.displayName || email.split('@')[0];
    const provider =
      fbUser.providerUserInfo?.[0]?.providerId === 'google.com'
        ? 'google'
        : 'firebase';
    const verified = fbUser.emailVerified ? 1 : 0;
    const today = new Date().toISOString().slice(0, 10);

    let row = db.prepare('SELECT * FROM users WHERE id = ? OR email = ?').get(uid, email);
    if (!row) {
      db.prepare(
        `INSERT INTO users (
          id, email, auth_provider, username, display_name, email_verified, last_active_date, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        uid,
        email,
        provider,
        displayName,
        displayName,
        verified,
        today,
        new Date().toISOString()
      );
      row = db.prepare('SELECT * FROM users WHERE id = ?').get(uid);
    } else {
      const existingId = String(row.id);
      if (verified && !row.email_verified) {
        db.prepare('UPDATE users SET email_verified = 1 WHERE id = ?').run(existingId);
      }
      touchUserStreak(existingId);
      row = db.prepare('SELECT * FROM users WHERE id = ?').get(existingId);
    }

    const finalId = String(row!.id);
    const reconciled = reconcileUserProExpiration(row!);
    const token = createSession(finalId);
    setSessionCookie(res, token);
    res.json({
      user: formatUserResponse(reconciled),
      progress: getOrCreateProgress(finalId),
      subscription: buildSubscriptionPayload(reconciled),
      isAdmin: isVerifiedAdminRow(reconciled),
    });
  } catch {
    res.status(500).json({ error: 'Firebase sessiyasini tekshirishda xatolik.' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  const cookies = parseCookies(req.headers.cookie);
  if (cookies.geoworld_session) {
    db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(
      hashSessionToken(cookies.geoworld_session)
    );
  }
  clearSessionCookie(res);
  res.json({ ok: true });
});

app.post('/api/auth/verify-email', (req, res) => {
  const userRow = getAuthenticatedUser(req);
  if (!userRow) {
    res.status(401).json({ error: 'Avval tizimga kiring.' });
    return;
  }
  const code = String((req.body as { code?: string }).code || '').trim();
  if (!code || code !== String(userRow.verification_code || '')) {
    res.status(400).json({ error: 'Tasdiqlash kodi noto‘g‘ri.' });
    return;
  }
  db.prepare(
    'UPDATE users SET email_verified = 1, verification_code = NULL WHERE id = ?'
  ).run(String(userRow.id));
  const updated = db
    .prepare('SELECT * FROM users WHERE id = ?')
    .get(String(userRow.id))!;
  res.json({ user: formatUserResponse(updated) });
});

app.post('/api/auth/resend-verification', (req, res) => {
  const userRow = getAuthenticatedUser(req);
  if (!userRow) {
    res.status(401).json({ error: 'Avval tizimga kiring.' });
    return;
  }
  const code = String(crypto.randomInt(100000, 999999));
  db.prepare('UPDATE users SET verification_code = ? WHERE id = ?').run(
    code,
    String(userRow.id)
  );
  res.json({ ok: true, verificationHint: code });
});

app.post('/api/auth/forgot-password', (req, res) => {
  const cleanEmail = String((req.body as { email?: string }).email || '')
    .trim()
    .toLowerCase();
  const row = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
  if (!row) {
    res.status(404).json({ error: 'Bu email bilan foydalanuvchi topilmadi.' });
    return;
  }
  const resetCode = String(crypto.randomInt(100000, 999999));
  const expires = Date.now() + 1000 * 60 * 15;
  db.prepare(
    'UPDATE users SET reset_code = ?, reset_expires_at = ? WHERE id = ?'
  ).run(resetCode, expires, String(row.id));
  res.json({
    ok: true,
    resetHint: resetCode,
    message: 'Tiklash kodi yaratildi (15 daqiqa amal qiladi).',
  });
});

app.post('/api/auth/reset-password', (req, res) => {
  const { email, code, newPassword } = req.body as {
    email?: string;
    code?: string;
    newPassword?: string;
  };
  const cleanEmail = String(email || '').trim().toLowerCase();
  const row = db
    .prepare('SELECT id, reset_code, reset_expires_at FROM users WHERE email = ?')
    .get(cleanEmail) as
    | { id?: string; reset_code?: string; reset_expires_at?: number }
    | undefined;

  if (
    !row ||
    !code ||
    row.reset_code !== String(code).trim() ||
    (row.reset_expires_at ?? 0) < Date.now()
  ) {
    res.status(400).json({ error: 'Tiklash kodi noto‘g‘ri yoki muddati tugagan.' });
    return;
  }
  if (!newPassword || newPassword.length < 6) {
    res.status(400).json({ error: 'Yangi parol kamida 6 ta belgi bo‘lsin.' });
    return;
  }
  db.prepare(
    'UPDATE users SET password_hash = ?, reset_code = NULL, reset_expires_at = NULL WHERE id = ?'
  ).run(hashPassword(newPassword), String(row.id));
  res.json({ ok: true });
});

app.post('/api/auth/google', async (req, res) => {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  if (!googleClientId) {
    res.json({
      configured: false,
      requiredEnv: ['GOOGLE_CLIENT_ID'],
      message:
        'Google orqali kirish uchun GOOGLE_CLIENT_ID muhit o‘zgaruvchisini sozlash kerak.',
    });
    return;
  }

  const { idToken } = req.body as { idToken?: string };
  if (!idToken) {
    res.status(400).json({ error: 'Google ID token yuborilmadi.' });
    return;
  }

  try {
    const infoRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
    );
    if (!infoRes.ok) {
      res.status(401).json({ error: 'Google tokeni tasdiqlanmadi.' });
      return;
    }
    const payload = (await infoRes.json()) as {
      aud?: string;
      email?: string;
      email_verified?: string;
      name?: string;
    };
    if (payload.aud !== googleClientId || !payload.email) {
      res.status(401).json({ error: 'Google OAuth auditoriyasi mos kelmadi.' });
      return;
    }

    const email = payload.email.toLowerCase();
    let row = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    const today = new Date().toISOString().slice(0, 10);
    if (!row) {
      const id = crypto.randomUUID();
      const uname = payload.name || email.split('@')[0];
      db.prepare(
        `INSERT INTO users (
          id, email, auth_provider, username, display_name, email_verified, last_active_date, created_at
        ) VALUES (?, ?, 'google', ?, ?, 1, ?, ?)`
      ).run(id, email, uname, uname, today, new Date().toISOString());
      row = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    } else {
      touchUserStreak(String(row.id));
      row = db.prepare('SELECT * FROM users WHERE id = ?').get(String(row.id));
    }

    const userId = String(row!.id);
    const token = createSession(userId);
    setSessionCookie(res, token);
    res.json({
      configured: true,
      user: formatUserResponse(row!),
      progress: getOrCreateProgress(userId),
    });
  } catch {
    res.status(500).json({ error: 'Google bilan bog‘lanishda xatolik.' });
  }
});

app.patch('/api/user/profile', (req, res) => {
  const userRow = getAuthenticatedUser(req);
  if (!userRow) {
    res.status(401).json({ error: 'Avval tizimga kiring.' });
    return;
  }
  const userId = String(userRow.id);
  const body = req.body as {
    username?: string;
    displayName?: string;
    avatar?: string;
    countryCode?: string;
    geoLevel?: string;
    learningFocus?: string;
    englishLevel?: string;
    dailyGoalMin?: number;
    favoriteContinent?: string;
    onboardingDone?: boolean;
    aiVoiceUri?: string;
    aiSpeechRate?: number;
    currentPassword?: string;
    newPassword?: string;
  };

  if (body.newPassword) {
    if (body.newPassword.length < 6) {
      res.status(400).json({ error: 'Yangi parol kamida 6 ta belgi bo‘lsin.' });
      return;
    }
    if (
      userRow.password_hash &&
      !verifyPassword(
        String(body.currentPassword || ''),
        String(userRow.password_hash)
      )
    ) {
      res.status(400).json({ error: 'Joriy parol noto‘g‘ri.' });
      return;
    }
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(
      hashPassword(body.newPassword),
      userId
    );
  }

  const normalizedRate =
    typeof body.aiSpeechRate === 'number' && Number.isFinite(body.aiSpeechRate)
      ? Math.min(2.0, Math.max(0.5, Number(body.aiSpeechRate.toFixed(2))))
      : null;

  db.prepare(
    `UPDATE users SET
      username = COALESCE(?, username),
      display_name = COALESCE(?, display_name),
      avatar = COALESCE(?, avatar),
      country_code = COALESCE(?, country_code),
      geo_level = COALESCE(?, geo_level),
      learning_focus = COALESCE(?, learning_focus),
      english_level = COALESCE(?, english_level),
      daily_goal_min = COALESCE(?, daily_goal_min),
      favorite_continent = COALESCE(?, favorite_continent),
      onboarding_done = COALESCE(?, onboarding_done),
      ai_voice_uri = COALESCE(?, ai_voice_uri),
      ai_speech_rate = COALESCE(?, ai_speech_rate)
    WHERE id = ?`
  ).run(
    body.username?.trim() || null,
    body.displayName?.trim() || null,
    body.avatar || null,
    body.countryCode?.toUpperCase() || null,
    body.geoLevel || null,
    body.learningFocus || null,
    body.englishLevel || null,
    typeof body.dailyGoalMin === 'number' ? body.dailyGoalMin : null,
    body.favoriteContinent || null,
    typeof body.onboardingDone === 'boolean' ? (body.onboardingDone ? 1 : 0) : null,
    typeof body.aiVoiceUri === 'string' ? body.aiVoiceUri : null,
    normalizedRate,
    userId
  );

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(userId)!;
  res.json({ user: formatUserResponse(updated) });
});

app.put('/api/user/progress', (req, res) => {
  const userRow = getAuthenticatedUser(req);
  if (!userRow) {
    res.status(401).json({ error: 'Avval tizimga kiring.' });
    return;
  }
  const userId = String(userRow.id);
  const body = req.body as {
    xp?: number;
    favorites?: string[];
    completedCountries?: string[];
    completedTerritories?: string[];
    unlockedBadges?: string[];
    masteredFlashcards?: string[];
    exploredCountries?: string[];
    quizzesCompleted?: number;
    gamesWon?: number;
    highScores?: Record<string, number>;
    learningHistory?: Array<{
      id: string;
      title: string;
      type: string;
      xp: number;
      at: string;
    }>;
    dailyCompleted?: boolean;
    expertCertified?: boolean;
  };

  if (typeof body.xp === 'number' && Number.isFinite(body.xp)) {
    db.prepare('UPDATE users SET xp = ? WHERE id = ?').run(
      Math.max(0, Math.round(body.xp)),
      userId
    );
  }

  getOrCreateProgress(userId);
  db.prepare(
    `UPDATE user_progress SET
      favorites_json = COALESCE(?, favorites_json),
      completed_countries_json = COALESCE(?, completed_countries_json),
      completed_territories_json = COALESCE(?, completed_territories_json),
      unlocked_badges_json = COALESCE(?, unlocked_badges_json),
      mastered_flashcards_json = COALESCE(?, mastered_flashcards_json),
      explored_countries_json = COALESCE(?, explored_countries_json),
      quizzes_completed = COALESCE(?, quizzes_completed),
      games_won = COALESCE(?, games_won),
      high_scores_json = COALESCE(?, high_scores_json),
      learning_history_json = COALESCE(?, learning_history_json),
      daily_completed = COALESCE(?, daily_completed),
      expert_certified = COALESCE(?, expert_certified),
      updated_at = ?
    WHERE user_id = ?`
  ).run(
    Array.isArray(body.favorites) ? JSON.stringify(body.favorites) : null,
    Array.isArray(body.completedCountries)
      ? JSON.stringify(body.completedCountries)
      : null,
    Array.isArray(body.completedTerritories)
      ? JSON.stringify(body.completedTerritories)
      : null,
    Array.isArray(body.unlockedBadges)
      ? JSON.stringify(body.unlockedBadges)
      : null,
    Array.isArray(body.masteredFlashcards)
      ? JSON.stringify(body.masteredFlashcards)
      : null,
    Array.isArray(body.exploredCountries)
      ? JSON.stringify(body.exploredCountries)
      : null,
    typeof body.quizzesCompleted === 'number' ? body.quizzesCompleted : null,
    typeof body.gamesWon === 'number' ? body.gamesWon : null,
    body.highScores ? JSON.stringify(body.highScores) : null,
    Array.isArray(body.learningHistory)
      ? JSON.stringify(body.learningHistory.slice(0, 60))
      : null,
    typeof body.dailyCompleted === 'boolean'
      ? body.dailyCompleted
        ? 1
        : 0
      : null,
    typeof body.expertCertified === 'boolean'
      ? body.expertCertified
        ? 1
        : 0
      : null,
    new Date().toISOString(),
    userId
  );

  res.json({ ok: true, progress: getOrCreateProgress(userId) });
});

// ================= LEADERBOARD & GAME SCORES =================

app.get('/api/leaderboard', (req, res) => {
  const gameId = String(req.query.gameId || '').trim();
  const topUsers = db
    .prepare(
      'SELECT id, username, avatar, country_code, xp, streak, is_pro FROM users ORDER BY xp DESC LIMIT 25'
    )
    .all()
    .map((u, idx) => ({
      rank: idx + 1,
      id: String(u.id),
      username: String(u.username),
      avatar: String(u.avatar || '🧭'),
      countryCode: String(u.country_code || 'UZ'),
      xp: Number(u.xp || 0),
      streak: Number(u.streak || 1),
      isPro: Boolean(u.is_pro),
    }));

  const recentScores = gameId
    ? db
        .prepare(
          'SELECT id, username, avatar, game_id, score, xp_earned, difficulty, created_at FROM game_scores WHERE game_id = ? ORDER BY score DESC LIMIT 15'
        )
        .all(gameId)
    : db
        .prepare(
          'SELECT id, username, avatar, game_id, score, xp_earned, difficulty, created_at FROM game_scores ORDER BY created_at DESC LIMIT 20'
        )
        .all();

  res.json({ topUsers, recentScores });
});

app.post('/api/game-scores', (req, res) => {
  const userRow = getAuthenticatedUser(req);
  const { gameId, score, xpEarned, difficulty, guestName } = req.body as {
    gameId?: string;
    score?: number;
    xpEarned?: number;
    difficulty?: string;
    guestName?: string;
  };

  if (!gameId || typeof score !== 'number') {
    res.status(400).json({ error: 'gameId va score majburiy.' });
    return;
  }

  const id = crypto.randomUUID();
  const username = userRow
    ? String(userRow.username)
    : String(guestName || 'Mehmon Geograf').slice(0, 32);
  const avatar = userRow ? String(userRow.avatar || '🧭') : '🌍';

  db.prepare(
    'INSERT INTO game_scores (id, user_id, username, avatar, game_id, score, xp_earned, difficulty, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    id,
    userRow ? String(userRow.id) : null,
    username,
    avatar,
    gameId,
    Math.round(score),
    Math.round(xpEarned || 0),
    String(difficulty || 'medium'),
    new Date().toISOString()
  );

  res.status(201).json({ ok: true, id });
});

// ================= GEOWORLD PRO PAYMENT PROVIDER INTEGRATION =================

app.post('/api/pro/checkout', async (req, res) => {
  const userRow = getAuthenticatedUser(req);
  if (!userRow) {
    res.status(401).json({
      error: 'PRO obunasini rasmiylashtirish uchun avval hisobingizga kiring.',
    });
    return;
  }

  const { plan } = req.body as { plan?: 'monthly' | 'yearly' };
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const priceId =
    plan === 'yearly'
      ? process.env.STRIPE_PRICE_YEARLY
      : process.env.STRIPE_PRICE_MONTHLY;

  if (!stripeKey || !priceId) {
    res.json({
      configured: false,
      requiredEnv: [
        'STRIPE_SECRET_KEY',
        'STRIPE_PRICE_MONTHLY',
        'STRIPE_PRICE_YEARLY',
      ],
      message:
        'Haqiqiy to‘lov provayderi (Stripe) hali ulanmagan. To‘lov tasdiqlanmasdan PRO obuna yoqilmaydi.',
    });
    return;
  }

  const origin =
    process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL'
      ? process.env.APP_URL
      : `${req.protocol}://${req.get('host')}`;

  try {
    const params = new URLSearchParams({
      mode: 'subscription',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      customer_email: String(userRow.email),
      'metadata[userId]': String(userRow.id),
      'metadata[plan]': plan === 'yearly' ? 'yearly' : 'monthly',
      success_url: `${origin}/?pro_session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?pro_cancelled=1`,
    });

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    const session = (await stripeRes.json()) as {
      id?: string;
      url?: string;
      error?: { message?: string };
    };
    if (!stripeRes.ok || !session.url) {
      res.status(502).json({
        error:
          session.error?.message ||
          'Stripe checkout sessiyasini yaratib bo‘lmadi.',
      });
      return;
    }

    db.prepare(
      'INSERT INTO payments_log (id, user_id, provider, plan, status, external_ref, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(
      crypto.randomUUID(),
      String(userRow.id),
      'stripe',
      plan === 'yearly' ? 'yearly' : 'monthly',
      'pending',
      session.id || null,
      new Date().toISOString()
    );

    res.json({ configured: true, checkoutUrl: session.url });
  } catch {
    res.status(500).json({ error: 'Stripe serveri bilan aloqada xatolik.' });
  }
});

app.get('/api/pro/verify-session', async (req, res) => {
  const userRow = getAuthenticatedUser(req);
  if (!userRow) {
    res.status(401).json({ error: 'Avval tizimga kiring.' });
    return;
  }
  const sessionId = String(req.query.session_id || '').trim();
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey || !sessionId) {
    res.status(400).json({ error: 'Tasdiqlash uchun Stripe sessiyasi topilmadi.' });
    return;
  }

  try {
    const sRes = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
      { headers: { Authorization: `Bearer ${stripeKey}` } }
    );
    const sJson = (await sRes.json()) as {
      payment_status?: string;
      metadata?: { userId?: string; plan?: string };
    };
    if (
      sRes.ok &&
      sJson.payment_status === 'paid' &&
      sJson.metadata?.userId === String(userRow.id)
    ) {
      const plan = sJson.metadata?.plan === 'yearly' ? 'yearly' : 'monthly';
      const nowIso = new Date().toISOString();
      const expiresAt = new Date(
        Date.now() + (plan === 'yearly' ? 365 : 30) * 86_400_000
      ).toISOString();
      db.prepare(
        "UPDATE users SET is_pro = 1, pro_plan = ?, pro_expires_at = ?, subscription_type = 'paid', subscription_start = ?, lifetime_pro = 0 WHERE id = ?"
      ).run(plan, expiresAt, nowIso, String(userRow.id));
      db.prepare(
        'UPDATE payments_log SET status = ? WHERE external_ref = ?'
      ).run('paid', sessionId);
      const updated = db
        .prepare('SELECT * FROM users WHERE id = ?')
        .get(String(userRow.id))!;
      res.json({
        verified: true,
        user: formatUserResponse(updated),
        subscription: buildSubscriptionPayload(updated),
      });
      return;
    }
    res.status(402).json({
      verified: false,
      error: 'To‘lov provayder tomonidan tasdiqlanmagan.',
    });
  } catch {
    res.status(500).json({ error: 'To‘lovni tekshirishda xatolik.' });
  }
});

app.get('/api/pro/entitlement', async (req, res) => {
  const userRow = await resolveAuthenticatedOrFirebaseUser(req, res);
  if (!userRow) {
    res.status(401).json({ error: 'Avval tizimga kiring.' });
    return;
  }
  const redemptions = db
    .prepare(
      'SELECT id, code, discount_percent, final_price, subscription_type, subscription_plan, subscription_start, subscription_end, pro_status, lifetime_pro, created_at FROM promo_redemptions WHERE user_id = ? ORDER BY created_at DESC'
    )
    .all(String(userRow.id));

  res.json({
    user: formatUserResponse(userRow),
    subscription: buildSubscriptionPayload(userRow),
    isAdmin: isVerifiedAdminRow(userRow),
    redemptions,
  });
});

app.post('/api/pro/verify-status', async (req, res) => {
  const userRow = await resolveAuthenticatedOrFirebaseUser(req, res);
  if (!userRow) {
    res.status(401).json({ error: 'Avval tizimga kiring.' });
    return;
  }
  res.json({
    ok: true,
    user: formatUserResponse(userRow),
    subscription: buildSubscriptionPayload(userRow),
  });
});

app.post('/api/pro/redeem-promo', async (req, res) => {
  const userRow = await resolveAuthenticatedOrFirebaseUser(req, res);
  if (!userRow) {
    res.status(401).json({
      error: 'Promo kodni faollashtirish uchun avval hisobingizga kiring.',
    });
    return;
  }

  const userId = String(userRow.id);
  const rawCode = String((req.body as { code?: string })?.code || '')
    .trim()
    .toUpperCase();

  if (!rawCode) {
    res.status(400).json({ error: 'Iltimos promo kodni kiriting.' });
    return;
  }

  const PROMO_RULES: Record<
    string,
    {
      code: 'FREE100' | 'OZODBRO';
      discountPercent: number;
      finalPrice: number;
      subscriptionType: 'promo' | 'lifetime';
      subscriptionPlan: 'monthly' | 'lifetime';
      durationMs: number | null;
      lifetimePro: boolean;
      headline: string;
      subheadline: string;
    }
  > = {
    FREE100: {
      code: 'FREE100',
      discountPercent: 100,
      finalPrice: 0,
      subscriptionType: 'promo',
      subscriptionPlan: 'monthly',
      durationMs: 30 * 86_400_000,
      lifetimePro: false,
      headline: '100% discount applied',
      subheadline: 'Free PRO for 30 days',
    },
    OZODBRO: {
      code: 'OZODBRO',
      discountPercent: 100,
      finalPrice: 0,
      subscriptionType: 'lifetime',
      subscriptionPlan: 'lifetime',
      durationMs: null,
      lifetimePro: true,
      headline: 'Lifetime PRO unlocked',
      subheadline: 'Never expires',
    },
  };

  const promo = PROMO_RULES[rawCode];
  if (!promo) {
    res.status(400).json({
      error: 'Promo kod noto‘g‘ri yoki amal qilish muddati tugagan.',
    });
    return;
  }

  if (Boolean(userRow.lifetime_pro) || String(userRow.pro_plan) === 'lifetime') {
    res.status(409).json({
      error: 'Sizda allaqachon umrbod (Lifetime) PRO obunasi faol!',
    });
    return;
  }

  const existingRedemption = db
    .prepare('SELECT id FROM promo_redemptions WHERE user_id = ? AND code = ?')
    .get(userId, promo.code);

  if (existingRedemption) {
    res.status(409).json({
      error:
        promo.code === 'FREE100'
          ? 'FREE100 promo kodi allaqachon ishlatilgan. 30 kunlik muddat tugagach obunani xarid qilishingiz mumkin.'
          : 'OZODBRO promo kodi allaqachon faollashtirilgan.',
    });
    return;
  }

  const nowMs = Date.now();
  const subscriptionStart = new Date(nowMs).toISOString();
  const subscriptionEnd = promo.durationMs
    ? new Date(nowMs + promo.durationMs).toISOString()
    : null;
  const redemptionId = `${userId}_${promo.code}`;

  try {
    db.exec('BEGIN');
    db.prepare(
      `INSERT INTO promo_redemptions (
        id, user_id, code, discount_percent, final_price, subscription_type,
        subscription_plan, subscription_start, subscription_end, pro_status,
        lifetime_pro, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`
    ).run(
      redemptionId,
      userId,
      promo.code,
      promo.discountPercent,
      promo.finalPrice,
      promo.subscriptionType,
      promo.subscriptionPlan,
      subscriptionStart,
      subscriptionEnd,
      promo.lifetimePro ? 1 : 0,
      subscriptionStart
    );

    db.prepare(
      `UPDATE users SET
        is_pro = 1,
        pro_plan = ?,
        pro_expires_at = ?,
        subscription_type = ?,
        subscription_start = ?,
        lifetime_pro = ?,
        promo_code = ?
      WHERE id = ?`
    ).run(
      promo.subscriptionPlan,
      subscriptionEnd,
      promo.subscriptionType,
      subscriptionStart,
      promo.lifetimePro ? 1 : 0,
      promo.code,
      userId
    );

    db.prepare(
      'INSERT INTO payments_log (id, user_id, provider, plan, status, external_ref, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(
      crypto.randomUUID(),
      userId,
      'promo_code',
      promo.subscriptionPlan,
      'active',
      promo.code,
      subscriptionStart
    );
    db.exec('COMMIT');
  } catch (err) {
    try {
      db.exec('ROLLBACK');
    } catch {
      // ignore rollback failure
    }
    res.status(500).json({
      error:
        err instanceof Error
          ? err.message
          : 'Promo kodni saqlashda xatolik yuz berdi.',
    });
    return;
  }

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(userId)!;
  res.status(200).json({
    ok: true,
    code: promo.code,
    discountPercent: promo.discountPercent,
    finalPrice: promo.finalPrice,
    headline: promo.headline,
    subheadline: promo.subheadline,
    redemption: {
      id: redemptionId,
      uid: userId,
      code: promo.code,
      discountPercent: promo.discountPercent,
      finalPrice: promo.finalPrice,
      subscriptionType: promo.subscriptionType,
      subscriptionPlan: promo.subscriptionPlan,
      subscriptionStart,
      subscriptionEnd,
      proStatus: 'active',
      lifetimePro: promo.lifetimePro,
    },
    user: formatUserResponse(updated),
    subscription: buildSubscriptionPayload(updated),
  });
});

// ================= TRUSTED ADMIN BACKEND ROUTES =================

app.get('/api/admin/overview', (req, res) => {
  const userRow = getAuthenticatedUser(req);
  if (!isVerifiedAdminRow(userRow)) {
    res.status(403).json({
      error: 'Admin huquqi talab qilinadi (tasdiqlangan admin hisobi zarur).',
    });
    return;
  }

  const users = db
    .prepare(
      'SELECT id, email, username, country_code, xp, streak, is_pro, pro_plan, pro_expires_at, email_verified, created_at FROM users ORDER BY xp DESC LIMIT 50'
    )
    .all();
  const totalUsersRow = db.prepare('SELECT COUNT(*) AS cnt FROM users').get() as {
    cnt?: number;
  };
  const totalProRow = db
    .prepare('SELECT COUNT(*) AS cnt FROM users WHERE is_pro = 1')
    .get() as { cnt?: number };
  const totalGamesRow = db
    .prepare('SELECT COUNT(*) AS cnt FROM game_scores')
    .get() as { cnt?: number };
  const recentPayments = db
    .prepare('SELECT * FROM payments_log ORDER BY created_at DESC LIMIT 20')
    .all();

  res.json({
    stats: {
      totalUsers: Number(totalUsersRow?.cnt || 0),
      totalProUsers: Number(totalProRow?.cnt || 0),
      totalGamesPlayed: Number(totalGamesRow?.cnt || 0),
    },
    users: users.map((u) => ({
      id: String(u.id),
      email: String(u.email),
      username: String(u.username),
      countryCode: String(u.country_code || 'UZ'),
      xp: Number(u.xp || 0),
      streak: Number(u.streak || 1),
      isPro: Boolean(u.is_pro),
      proPlan: String(u.pro_plan || 'free'),
      proExpiresAt: u.pro_expires_at ? String(u.pro_expires_at) : null,
      emailVerified: Boolean(u.email_verified),
      createdAt: String(u.created_at),
    })),
    recentPayments,
  });
});

app.patch('/api/admin/subscription', (req, res) => {
  const userRow = getAuthenticatedUser(req);
  if (!isVerifiedAdminRow(userRow)) {
    res.status(403).json({ error: 'Faqat tasdiqlangan admin obunani o‘zgartira oladi.' });
    return;
  }

  const { targetUserId, isPro, plan } = req.body as {
    targetUserId?: string;
    isPro?: boolean;
    plan?: 'free' | 'monthly' | 'yearly';
  };

  if (!targetUserId) {
    res.status(400).json({ error: 'targetUserId majburiy.' });
    return;
  }

  const target = db.prepare('SELECT * FROM users WHERE id = ?').get(targetUserId);
  if (!target) {
    res.status(404).json({ error: 'Foydalanuvchi topilmadi.' });
    return;
  }

  const nextPlan = isPro ? (plan === 'yearly' ? 'yearly' : 'monthly') : 'free';
  const nextSubscriptionType = isPro ? 'paid' : 'free';
  const nowIso = new Date().toISOString();
  const expiresAt = isPro
    ? new Date(
        Date.now() + (nextPlan === 'yearly' ? 365 : 30) * 86_400_000
      ).toISOString()
    : null;

  db.prepare(
    'UPDATE users SET is_pro = ?, pro_plan = ?, pro_expires_at = ?, subscription_type = ?, subscription_start = ?, lifetime_pro = 0 WHERE id = ?'
  ).run(isPro ? 1 : 0, nextPlan, expiresAt, nextSubscriptionType, isPro ? nowIso : null, targetUserId);

  db.prepare(
    'INSERT INTO payments_log (id, user_id, provider, plan, status, external_ref, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(
    crypto.randomUUID(),
    targetUserId,
    'admin_grant',
    nextPlan,
    isPro ? 'active' : 'revoked',
    String(userRow!.email),
    new Date().toISOString()
  );

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(targetUserId)!;
  res.json({
    ok: true,
    user: formatUserResponse(updated),
    subscription: buildSubscriptionPayload(updated),
  });
});

// ================= LIVE OFFICIAL COUNTRY DATA =================

app.get('/api/country-live/:code', async (req, res) => {
  const code = String(req.params.code || '').trim().toUpperCase();
  const wikiTitle = String(req.query.wiki || req.query.name || '').trim();

  if (!/^[A-Z]{2,3}$/.test(code)) {
    res.status(400).json({ error: 'Invalid country ISO code' });
    return;
  }

  const nowIso = new Date().toISOString().split('T')[0];

  try {
    const [restRes, wbRes, wikiRes] = await Promise.allSettled([
      fetch(
        `https://restcountries.com/v3.1/alpha/${encodeURIComponent(
          code
        )}?fields=name,capital,population,area,flags,coatOfArms,maps,languages,currencies,borders,landlocked,region,subregion`,
        { signal: AbortSignal.timeout(3500) }
      ),
      fetch(
        `https://api.worldbank.org/v2/country/${encodeURIComponent(
          code
        )}/indicator/SP.POP.TOTL?format=json&mrv=1`,
        { signal: AbortSignal.timeout(3500) }
      ),
      wikiTitle
        ? fetch(
            `https://en.wikipedia.org/api/rest_v1/page/media-list/${encodeURIComponent(
              wikiTitle.replace(/\s+/g, '_')
            )}`,
            {
              headers: { 'User-Agent': 'GeoWorldAcademy/1.0' },
              signal: AbortSignal.timeout(3500),
            }
          )
        : Promise.resolve(null),
    ]);

    let restData: Record<string, unknown> | null = null;
    if (restRes.status === 'fulfilled' && restRes.value.ok) {
      const parsed = await restRes.value.json();
      restData = Array.isArray(parsed) ? parsed[0] : parsed;
    }

    let wbPopulation: number | null = null;
    let wbYear: string | null = null;
    if (wbRes.status === 'fulfilled' && wbRes.value.ok) {
      const wbJson = (await wbRes.value.json()) as unknown;
      if (Array.isArray(wbJson) && Array.isArray(wbJson[1]) && wbJson[1][0]) {
        const entry = wbJson[1][0] as { value?: number; date?: string };
        if (typeof entry.value === 'number') {
          wbPopulation = entry.value;
          wbYear = entry.date ?? null;
        }
      }
    }

    const images: Array<{
      url: string;
      title: string;
      source: string;
    }> = [];

    if (
      wikiRes.status === 'fulfilled' &&
      wikiRes.value &&
      wikiRes.value.ok
    ) {
      const mediaJson = (await wikiRes.value.json()) as {
        items?: Array<{
          type?: string;
          title?: string;
          caption?: { text?: string };
          srcset?: Array<{ src?: string }>;
        }>;
      };
      const items = mediaJson.items ?? [];
      for (const item of items) {
        if (item.type !== 'image') continue;
        const src = item.srcset?.[item.srcset.length - 1]?.src;
        if (!src) continue;
        const normalized = src.startsWith('//') ? `https:${src}` : src;
        if (/\.(svg|ogv|webm)$/i.test(normalized)) continue;
        images.push({
          url: normalized,
          title:
            item.caption?.text?.slice(0, 120) ||
            item.title?.replace(/^File:/, '').replace(/_/g, ' ') ||
            wikiTitle ||
            code,
          source: 'Wikimedia Commons / Wikipedia',
        });
        if (images.length >= 6) break;
      }
    }

    const flags = (restData?.flags as { svg?: string; png?: string } | undefined) ?? {};
    const maps = (restData?.maps as { openStreetMaps?: string } | undefined) ?? {};

    res.json({
      code,
      live: Boolean(restData || wbPopulation || images.length > 0),
      lastUpdated: nowIso,
      sources: [
        wbPopulation ? `World Bank (${wbYear ?? 'latest'})` : 'World Bank Data',
        restData ? 'REST Countries / UN Statistics' : 'UN Statistics',
        'UNESCO World Heritage',
        ...(images.length > 0 ? ['Wikimedia Commons'] : []),
      ],
      population:
        wbPopulation ??
        (typeof restData?.population === 'number' ? restData.population : null),
      populationYear: wbYear ?? '2024–2025',
      areaKm2: typeof restData?.area === 'number' ? restData.area : null,
      flagUrl: flags.svg || flags.png || null,
      openStreetMapUrl: maps.openStreetMaps || null,
      images,
    });
  } catch {
    res.json({
      code,
      live: false,
      lastUpdated: nowIso,
      sources: ['UN Data', 'World Bank', 'UNESCO'],
      population: null,
      populationYear: '2025',
      areaKm2: null,
      flagUrl: null,
      openStreetMapUrl: null,
      images: [],
    });
  }
});

// ================= HUMAN-LIKE GEOAI, ENGLISH TEACHER & TALK WITH GEOAI =================

app.post('/api/geo-ai/chat', async (req, res) => {
  const ai = getGeminiClient();
  if (!ai) {
    res.status(503).json({
      configured: false,
      error:
        'GEMINI_API_KEY sozlanmagan. AI ustoz ishlashi uchun Settings > Secrets bo‘limiga GEMINI_API_KEY kiriting.',
    });
    return;
  }

  const {
    message,
    history = [],
    language = 'uz',
    mode = 'chat',
    countryContext = '',
    studentLevel = 'O‘rta',
    englishLevel = 'A2',
    topic = 'World Geography',
  } = req.body as {
    message?: string;
    history?: Array<{ role: 'user' | 'assistant' | 'model'; content?: string; text?: string }>;
    language?: 'uz' | 'en' | 'both' | 'mixed';
    mode?: 'chat' | 'mini-quiz' | 'study-plan' | 'english-coach' | 'talk';
    countryContext?: string;
    studentLevel?: string;
    englishLevel?: string;
    topic?: string;
  };

  if (!message || typeof message !== 'string') {
    res.status(400).json({ error: 'Xabar matni bo‘sh bo‘lmasligi kerak.' });
    return;
  }

  const langRule =
    language === 'en'
      ? 'Speak warmly and naturally in clear English.'
      : language === 'both'
      ? 'First explain warmly and clearly in natural Uzbek, then repeat the key summary in clear, natural English so the student learns both geography and English!'
      : language === 'mixed'
      ? 'Communicate naturally in a friendly mix of Uzbek and English (just like a bilingual mentor sitting next to the student).'
      : 'Javoblaringni xuddi o‘quvchining yonida o‘tirgan mehribon, zakiy va do‘stona inson-o‘qituvchidek jonli, tabiiy o‘zbek tilida yoz. Robotdek rasmiy bo‘lma.';

  try {
    if (mode === 'mini-quiz') {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Mavzu / Davlat: ${countryContext || message}. Ushbu mavzu bo‘yicha 3 ta qiziqarli ko‘p tanlovli geografiya test savolini tuz. ${langRule}`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction:
            'You are GeoAI Teacher inside GeoWorld Geography Academy. Generate 3 accurate, educational multiple-choice geography questions with 4 options each and a warm, friendly teacher explanation.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                correctIndex: { type: Type.INTEGER },
                explanation: { type: Type.STRING },
              },
              required: ['question', 'options', 'correctIndex', 'explanation'],
            },
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '[]').trim());
      res.json({ questions: parsed, quiz: parsed, model: 'gemini-4-hydrogen' });
      return;
    }

    let systemInstruction = '';
    if (mode === 'english-coach') {
      systemInstruction = [
        `You are "GeoEnglish Coach" — a warm, patient, human-like English speaking teacher who teaches English through Geography topics (current topic: ${topic}).`,
        `Student's CEFR level: ${englishLevel} (adapt vocabulary and sentence length strictly to ${englishLevel}).`,
        'Teaching style:',
        '1. Praise effort warmly ("Excellent!", "Great try!", "You are improving!").',
        '2. Gently correct any grammar or spelling mistakes in the student’s English message and explain why briefly in Uzbek so they understand clearly.',
        '3. Give a short pronunciation tip for 1 key word.',
        '4. Teach 1 natural English sentence to repeat aloud (e.g. "Can you say: Tokyo is the capital of Japan?") OR ask a friendly follow-up question about the geography topic.',
        'Keep responses concise (3–6 short sentences) so voice conversation feels natural and interactive.',
      ].join('\n');
    } else if (mode === 'talk') {
      systemInstruction = [
        'You are GeoAI in "Talk with GeoAI" natural human conversation mode.',
        langRule,
        `Student geography level: ${studentLevel}, English level: ${englishLevel}.`,
        'Detect the student’s intent automatically:',
        '- If they want to practice English, switch into encouraging English dialogue with gentle corrections.',
        '- If they want a fun fact or country story, tell a vivid, memorable story with cultural details.',
        '- If they are confused about a topic, break it down into an everyday analogy.',
        '- If they want a quick oral game or question, challenge them playfully!',
        'Sound like a real enthusiastic human mentor, never robotic. Keep answers conversational and end with a natural follow-up question.',
      ].join('\n');
    } else {
      systemInstruction = [
        'Siz GeoWorld Geografiya Akademiyasining insoniy, samimiy va professional "GeoAI Ustoz" o‘qituvchisisiz.',
        langRule,
        `O‘quvchi darajasi: ${studentLevel}.`,
        'Qoidalar: do‘stona ohangda gapiring, tushunchalarni hayotiy misollar bilan sodda tushuntiring, o‘quvchining xatolarini muloyimlik bilan tuzating, ruhlantiring va suhbat oxirida albatta qisqa qiziqarli keyingi savol bering.',
        countryContext ? `Joriy dars konteksti: ${countryContext}` : '',
      ]
        .filter(Boolean)
        .join('\n');
    }

    const conversationParts = [
      ...history.slice(-10).map((m) => ({
        role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
        parts: [{ text: String(m.content || m.text || '') }],
      })),
      {
        role: 'user',
        parts: [{ text: message }],
      },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: conversationParts,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        systemInstruction,
      },
    });

    res.json({
      reply: response.text ?? 'Javob olishda muammo yuz berdi.',
      model: 'gemini-4-hydrogen',
    });
  } catch (err) {
    console.error('GeoAI error:', err);
    res.status(500).json({
      error:
        'GeoAI Ustoz bilan bog‘lanishda xatolik yuz berdi. Birozdan so‘ng qayta urinib ko‘ring.',
    });
  }
});

// ================= REAL-TIME WEBSOCKET MULTIPLAYER ARENA =================

interface MultiplayerQuestion {
  prompt: string;
  options: string[];
  correctIndex: number;
  hint: string;
}

const MULTIPLAYER_BANK: MultiplayerQuestion[] = [
  { prompt: 'Yaponiya poytaxti qaysi shahar?', options: ['Seul', 'Tokio', 'Osaka', 'Kiyoto'], correctIndex: 1, hint: 'Kanto tekisligida joylashgan dunyodagi eng yirik megapolis.' },
  { prompt: 'Dunyodagi eng uzun daryo qaysi?', options: ['Amazonka', 'Nil', 'Yanszi', 'Missisipi'], correctIndex: 1, hint: 'Afrikada janubdan shimolga oqadi.' },
  { prompt: 'O‘zbekiston qaysi dengizga chiqish imkoniyatiga ega?', options: ['Okeanga chiqadi', 'Orol davlati', 'Ikki marta dengizga chiqmaydi', 'O‘rta yer dengiziga'], correctIndex: 2, hint: 'Dunyodagi atigi ikkita shunday davlatdan biri.' },
  { prompt: 'Qaysi davlat hududi bo‘yicha dunyoda 2-o‘rinda turadi?', options: ['AQSH', 'Xitoy', 'Kanada', 'Braziliya'], correctIndex: 2, hint: 'Shimoliy Amerikada joylashgan zarang yaproqli bayroq egasi.' },
  { prompt: 'Yer yuzidagi eng baland tog‘ cho‘qqisi qaysi?', options: ['K2', 'Everest', 'Elbrus', 'Akonkagua'], correctIndex: 1, hint: 'Himolay tizmasida 8 849 m balandlikda.' },
  { prompt: 'Qaysi qit’ada davlatlar soni eng ko‘p (54 ta)?', options: ['Osiyo', 'Yevropa', 'Afrika', 'Janubiy Amerika'], correctIndex: 2, hint: 'Ekvator deyarli markazidan kesib o‘tadi.' },
  { prompt: 'Braziliyaning rasmiy tili qaysi?', options: ['Ispan', 'Portugal', 'Fransuz', 'Ingliz'], correctIndex: 1, hint: 'Janubiy Amerikada bu tilda so‘zlashuvchi yagona yirik davlat.' },
  { prompt: 'Dunyodagi eng chuqur ko‘l qaysi?', options: ['Tanganika', 'Kaspiy', 'Baykal', 'Viktoriya'], correctIndex: 2, hint: 'Sibirda joylashgan, chuqurligi 1 642 m.' },
];

interface RoomPlayer {
  id: string;
  name: string;
  avatar: string;
  score: number;
  answeredRound: number;
  ws: WebSocket;
}

interface GameRoom {
  code: string;
  mode: string;
  hostId: string;
  status: 'waiting' | 'playing' | 'finished';
  roundIndex: number;
  players: Map<string, RoomPlayer>;
}

const rooms = new Map<string, GameRoom>();

function serializeRoom(room: GameRoom) {
  const q = MULTIPLAYER_BANK[room.roundIndex] ?? null;
  return {
    code: room.code,
    mode: room.mode,
    hostId: room.hostId,
    status: room.status,
    roundIndex: room.roundIndex,
    totalRounds: MULTIPLAYER_BANK.length,
    question:
      room.status === 'playing' && q
        ? { prompt: q.prompt, options: q.options, hint: q.hint }
        : null,
    players: Array.from(room.players.values())
      .map((p) => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        score: p.score,
        answered: p.answeredRound === room.roundIndex,
      }))
      .sort((a, b) => b.score - a.score),
  };
}

function broadcastRoom(room: GameRoom) {
  const payload = JSON.stringify({ type: 'room_state', room: serializeRoom(room) });
  for (const player of room.players.values()) {
    if (player.ws.readyState === 1) {
      player.ws.send(payload);
    }
  }
}

function setupMultiplayerWs(server: http.Server) {
  const wss = new WebSocketServer({ server, path: '/ws/multiplayer' });

  wss.on('connection', (ws) => {
    const playerId = crypto.randomUUID().slice(0, 8);
    let currentRoomCode: string | null = null;

    ws.send(JSON.stringify({ type: 'connected', playerId }));

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString()) as {
          type?: string;
          roomCode?: string;
          name?: string;
          avatar?: string;
          mode?: string;
          optionIndex?: number;
        };

        if (msg.type === 'create_room') {
          const code = crypto.randomBytes(3).toString('hex').toUpperCase();
          const room: GameRoom = {
            code,
            mode: msg.mode || 'Live Quiz Battle',
            hostId: playerId,
            status: 'waiting',
            roundIndex: 0,
            players: new Map(),
          };
          room.players.set(playerId, {
            id: playerId,
            name: String(msg.name || 'O‘yinchi').slice(0, 24),
            avatar: String(msg.avatar || '🧭'),
            score: 0,
            answeredRound: -1,
            ws,
          });
          rooms.set(code, room);
          currentRoomCode = code;
          broadcastRoom(room);
          return;
        }

        if (msg.type === 'join_room') {
          const code = String(msg.roomCode || '').trim().toUpperCase();
          const room = rooms.get(code);
          if (!room) {
            ws.send(
              JSON.stringify({
                type: 'error',
                message: `${code} kodli xona topilmadi.`,
              })
            );
            return;
          }
          currentRoomCode = code;
          room.players.set(playerId, {
            id: playerId,
            name: String(msg.name || 'Mehmon').slice(0, 24),
            avatar: String(msg.avatar || '🌍'),
            score: 0,
            answeredRound: -1,
            ws,
          });
          broadcastRoom(room);
          return;
        }

        if (!currentRoomCode) return;
        const room = rooms.get(currentRoomCode);
        if (!room) return;

        if (msg.type === 'start_match' && room.hostId === playerId) {
          room.status = 'playing';
          room.roundIndex = 0;
          for (const p of room.players.values()) {
            p.score = 0;
            p.answeredRound = -1;
          }
          broadcastRoom(room);
          return;
        }

        if (msg.type === 'submit_answer' && room.status === 'playing') {
          const player = room.players.get(playerId);
          if (!player || player.answeredRound === room.roundIndex) return;
          player.answeredRound = room.roundIndex;
          const q = MULTIPLAYER_BANK[room.roundIndex];
          const isCorrect = q && msg.optionIndex === q.correctIndex;
          if (isCorrect) {
            player.score += 100;
          }
          ws.send(
            JSON.stringify({
              type: 'answer_feedback',
              isCorrect,
              correctIndex: q?.correctIndex ?? 0,
            })
          );
          const allAnswered = Array.from(room.players.values()).every(
            (p) => p.answeredRound === room.roundIndex
          );
          if (allAnswered) {
            if (room.roundIndex + 1 >= MULTIPLAYER_BANK.length) {
              room.status = 'finished';
            } else {
              room.roundIndex += 1;
            }
          }
          broadcastRoom(room);
          return;
        }

        if (msg.type === 'next_round' && room.hostId === playerId) {
          if (room.roundIndex + 1 >= MULTIPLAYER_BANK.length) {
            room.status = 'finished';
          } else {
            room.roundIndex += 1;
          }
          broadcastRoom(room);
        }
      } catch {
        // Ignore malformed packets
      }
    });

    ws.on('close', () => {
      if (!currentRoomCode) return;
      const room = rooms.get(currentRoomCode);
      if (!room) return;
      room.players.delete(playerId);
      if (room.players.size === 0) {
        rooms.delete(currentRoomCode);
      } else {
        if (room.hostId === playerId) {
          const first = room.players.values().next().value;
          if (first) room.hostId = first.id;
        }
        broadcastRoom(room);
      }
    });
  });
}

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('/{*path}', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = http.createServer(app);
  setupMultiplayerWs(server);

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`GeoWorld server running at http://0.0.0.0:${PORT}`);
  });
}

void startServer();
