import { initializeApp } from 'firebase-admin/app';
import {
  FieldValue,
  Timestamp,
  getFirestore,
} from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';

const app = initializeApp();
const DATABASE_ID =
  'ai-studio-dunyogeografiyas-b3df44ca-64f3-4c2d-9f7f-8d0c85277f7d';
const db = getFirestore(app, DATABASE_ID);

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

interface PromoDefinition {
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

const PROMO_CATALOG: Record<string, PromoDefinition> = {
  FREE100: {
    code: 'FREE100',
    discountPercent: 100,
    finalPrice: 0,
    subscriptionType: 'promo',
    subscriptionPlan: 'monthly',
    durationMs: THIRTY_DAYS_MS,
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

export const redeemPromoCode = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError(
      'unauthenticated',
      'Promo kodni faollashtirish uchun tizimga kiring.'
    );
  }

  const rawCode = String((request.data as { code?: string })?.code || '')
    .trim()
    .toUpperCase();

  const promo = PROMO_CATALOG[rawCode];
  if (!promo) {
    throw new HttpsError(
      'invalid-argument',
      'Promo kod noto‘g‘ri yoki mavjud emas.'
    );
  }

  const redemptionId = `${uid}_${promo.code}`;
  const nowMs = Date.now();
  const startTs = Timestamp.fromMillis(nowMs);
  const endMs = promo.durationMs ? nowMs + promo.durationMs : null;
  const endTs = endMs ? Timestamp.fromMillis(endMs) : null;
  const startIso = new Date(nowMs).toISOString();
  const endIso = endMs ? new Date(endMs).toISOString() : null;

  await db.runTransaction(async (tx) => {
    const subRef = db.collection('subscriptions').doc(uid);
    const redemptionRef = db.collection('promoRedemptions').doc(redemptionId);
    const userRef = db.collection('users').doc(uid);
    const lbRef = db.collection('leaderboard').doc(uid);

    const [subSnap, redemptionSnap, userSnap, lbSnap] = await Promise.all([
      tx.get(subRef),
      tx.get(redemptionRef),
      tx.get(userRef),
      tx.get(lbRef),
    ]);

    const currentSub = subSnap.exists ? subSnap.data() : null;
    if (currentSub?.lifetimePro === true) {
      throw new HttpsError(
        'already-exists',
        'Sizda allaqachon umrbod (Lifetime) PRO obunasi faol.'
      );
    }

    if (promo.code === 'FREE100' && redemptionSnap.exists) {
      throw new HttpsError(
        'already-exists',
        'FREE100 promo kodi har bir foydalanuvchi uchun faqat bir marta amal qiladi.'
      );
    }

    tx.set(redemptionRef, {
      redemptionId,
      uid,
      code: promo.code,
      discountPercent: promo.discountPercent,
      finalPrice: promo.finalPrice,
      subscriptionType: promo.subscriptionType,
      subscriptionPlan: promo.subscriptionPlan,
      subscriptionStart: startTs,
      subscriptionEnd: endTs,
      proStatus: 'active',
      lifetimePro: promo.lifetimePro,
      redeemedAt: FieldValue.serverTimestamp(),
    });

    tx.set(subRef, {
      uid,
      subscriptionStatus: 'active',
      subscriptionType: promo.subscriptionType,
      subscriptionPlan: promo.subscriptionPlan,
      subscriptionStartDate: startIso,
      subscriptionEndDate: endIso,
      proStatus: 'active',
      lifetimePro: promo.lifetimePro,
      promoCode: promo.code,
      paymentProvider: 'promo_code',
      entitlementStatus: 'pro',
      updatedAt: FieldValue.serverTimestamp(),
    });

    if (userSnap.exists) {
      tx.update(userRef, {
        proStatus: true,
        subscriptionPlan: promo.subscriptionPlan,
        lastLoginAt: FieldValue.serverTimestamp(),
      });
    }

    if (lbSnap.exists) {
      tx.update(lbRef, {
        isPro: true,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  });

  await db
    .collection('activityLogs')
    .add({
      uid,
      action: 'Promo kod faollashtirildi',
      detail: `${promo.code} (${promo.subscriptionType})`,
      createdAt: FieldValue.serverTimestamp(),
    })
    .catch(() => {});

  return {
    ok: true,
    code: promo.code,
    discountPercent: promo.discountPercent,
    finalPrice: promo.finalPrice,
    headline: promo.headline,
    subheadline: promo.subheadline,
    subscription: {
      uid,
      subscriptionStatus: 'active',
      subscriptionType: promo.subscriptionType,
      subscriptionPlan: promo.subscriptionPlan,
      subscriptionStartDate: startIso,
      subscriptionEndDate: endIso,
      proStatus: 'active',
      lifetimePro: promo.lifetimePro,
      promoCode: promo.code,
      paymentProvider: 'promo_code',
      entitlementStatus: 'pro',
    },
  };
});

export const verifyProStatus = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Autentifikatsiya talab qilinadi.');
  }

  const subRef = db.collection('subscriptions').doc(uid);
  const subSnap = await subRef.get();
  if (!subSnap.exists) {
    return {
      isPro: false,
      proStatus: 'inactive',
      subscriptionType: 'free',
      subscriptionPlan: 'free',
      lifetimePro: false,
      subscriptionEndDate: null,
    };
  }

  const data = subSnap.data() || {};
  if (data.lifetimePro === true || data.subscriptionType === 'lifetime') {
    return {
      isPro: true,
      proStatus: 'active',
      subscriptionType: 'lifetime',
      subscriptionPlan: 'lifetime',
      lifetimePro: true,
      subscriptionEndDate: null,
    };
  }

  const endIso =
    typeof data.subscriptionEndDate === 'string' ? data.subscriptionEndDate : null;
  const expired = Boolean(endIso && Date.now() >= new Date(endIso).getTime());

  if (expired && data.proStatus === 'active') {
    await db.runTransaction(async (tx) => {
      tx.update(subRef, {
        subscriptionStatus: 'expired',
        proStatus: 'expired',
        entitlementStatus: 'free',
        subscriptionPlan: 'free',
        updatedAt: FieldValue.serverTimestamp(),
      });
      const userRef = db.collection('users').doc(uid);
      const userSnap = await tx.get(userRef);
      if (userSnap.exists) {
        tx.update(userRef, {
          proStatus: false,
          subscriptionPlan: 'free',
        });
      }
      const lbRef = db.collection('leaderboard').doc(uid);
      const lbSnap = await tx.get(lbRef);
      if (lbSnap.exists) {
        tx.update(lbRef, { isPro: false });
      }
    });
  }

  const active = data.entitlementStatus === 'pro' && !expired;
  return {
    isPro: active,
    proStatus: expired ? 'expired' : active ? 'active' : 'inactive',
    subscriptionType: active ? data.subscriptionType || 'paid' : 'free',
    subscriptionPlan: active ? data.subscriptionPlan || 'monthly' : 'free',
    lifetimePro: false,
    subscriptionEndDate: endIso,
  };
});

export const expirePromotionalSubscriptions = onSchedule(
  'every 60 minutes',
  async () => {
    const nowIso = new Date().toISOString();
    const snap = await db
      .collection('subscriptions')
      .where('subscriptionType', '==', 'promo')
      .where('proStatus', '==', 'active')
      .limit(200)
      .get();

    const batch = db.batch();
    let count = 0;

    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      if (data.lifetimePro === true) continue;
      const endIso =
        typeof data.subscriptionEndDate === 'string'
          ? data.subscriptionEndDate
          : null;
      if (!endIso || endIso > nowIso) continue;

      batch.update(docSnap.ref, {
        subscriptionStatus: 'expired',
        proStatus: 'expired',
        entitlementStatus: 'free',
        subscriptionPlan: 'free',
        updatedAt: FieldValue.serverTimestamp(),
      });
      batch.update(db.collection('users').doc(docSnap.id), {
        proStatus: false,
        subscriptionPlan: 'free',
      });
      batch.update(db.collection('leaderboard').doc(docSnap.id), {
        isPro: false,
      });
      count += 1;
    }

    if (count > 0) {
      await batch.commit();
    }
  }
);
