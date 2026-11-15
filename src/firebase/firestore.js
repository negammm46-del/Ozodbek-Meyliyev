import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  OperationType,
  db,
  firebaseConfigured,
  handleFirestoreError,
} from './firebase.js';

function assertDb() {
  if (!firebaseConfigured || !db) {
    throw new Error('Firestore ulanmagan.');
  }
  return db;
}

/**
 * Creates user profile on first registration without overwriting existing progress on repeat login.
 * @param {import('firebase/auth').User} firebaseUser
 * @param {{ displayName?: string; country?: string }} [extra]
 */
export async function ensureUserProfile(firebaseUser, extra = {}) {
  const database = assertDb();
  const uid = firebaseUser.uid;
  const userPath = `users/${uid}`;
  const userRef = doc(database, 'users', uid);

  try {
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      const displayName = (
        extra.displayName ||
        firebaseUser.displayName ||
        firebaseUser.email?.split('@')[0] ||
        'GeoWorld Explorer'
      )
        .trim()
        .slice(0, 80);

      const newProfile = {
        uid,
        displayName,
        email: (firebaseUser.email || '').slice(0, 180),
        photoURL: (firebaseUser.photoURL || '').slice(0, 1000),
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        country: (extra.country || 'UZ').slice(0, 64),
        language: 'uz',
        level: 'O‘rta',
        englishLevel: 'A2',
        learningFocus: 'Ikkalasi',
        dailyGoalMin: 20,
        favoriteContinent: 'Osiyo',
        onboardingDone: false,
        xp: 60,
        coins: 20,
        streak: 1,
        totalLessonsCompleted: 0,
        totalGamesPlayed: 0,
        totalCorrectAnswers: 0,
        favorites: ['uzbekistan', 'japan'],
        proStatus: false,
        subscriptionPlan: 'free',
        achievements: [],
        settings: {
          theme: 'light',
          soundEnabled: true,
          aiVoiceUri: '',
          aiSpeechRate: 1.0,
        },
        role: 'student',
      };

      await setDoc(userRef, newProfile);

      // Initialize default learningProgress doc
      const progressRef = doc(database, 'users', uid, 'learningProgress', 'main');
      await setDoc(progressRef, {
        uid,
        currentStage: 1,
        completedCountries: [],
        completedTerritories: [],
        masteredFlashcards: [],
        exploredCountries: ['Uzbekistan'],
        quizScores: {},
        englishVocabProgress: 0,
        englishSpeakingProgress: 0,
        expertCertified: false,
        updatedAt: serverTimestamp(),
      });

      // Initialize PII-free public leaderboard entry
      const lbRef = doc(database, 'leaderboard', uid);
      await setDoc(lbRef, {
        uid,
        displayName,
        photoURL: (firebaseUser.photoURL || '').slice(0, 1000),
        country: (extra.country || 'UZ').slice(0, 64),
        xp: 60,
        streak: 1,
        totalGamesPlayed: 0,
        isPro: false,
        updatedAt: serverTimestamp(),
      });

      const createdSnap = await getDoc(userRef);
      return { profile: createdSnap.data(), isNew: true };
    }

    // Existing user: update only login timestamp, never overwrite progress
    await updateDoc(userRef, {
      lastLoginAt: serverTimestamp(),
    });
    const refreshed = await getDoc(userRef);
    return { profile: refreshed.data(), isNew: false };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
    return { profile: null, isNew: false };
  }
}

/**
 * Fetches user profile once.
 * @param {string} uid
 */
export async function getUserProfile(uid) {
  const database = assertDb();
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(database, 'users', uid));
    return snap.exists() ? snap.data() : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

/**
 * Subscribes to real-time updates for user profile.
 * @param {string} uid
 * @param {(data: Record<string, any> | null) => void} callback
 */
export function subscribeToUserProfile(uid, callback) {
  if (!db) return () => {};
  const path = `users/${uid}`;
  return onSnapshot(
    doc(db, 'users', uid),
    (snap) => {
      callback(snap.exists() ? snap.data() : null);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

/**
 * Subscribes to user's trusted subscription record (/subscriptions/{uid}).
 * @param {string} uid
 * @param {(data: Record<string, any> | null) => void} callback
 */
export function subscribeToSubscription(uid, callback) {
  if (!db) return () => {};
  const path = `subscriptions/${uid}`;
  return onSnapshot(
    doc(db, 'subscriptions', uid),
    (snap) => {
      callback(snap.exists() ? snap.data() : null);
    },
    () => {
      // Non-blocking if subscription document doesn't exist yet
      callback(null);
    }
  );
}

/**
 * Fetches user's own promo code redemption records from Firestore.
 * @param {string} uid
 */
export async function getUserPromoRedemptions(uid) {
  if (!db) return [];
  const path = 'promoRedemptions';
  try {
    const q = query(
      collection(db, 'promoRedemptions'),
      where('uid', '==', uid),
      limit(10)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch {
    return [];
  }
}

/**
 * Updates allowed profile or settings fields without touching proStatus or role.
 * @param {string} uid
 * @param {Record<string, any>} updates
 */
export async function updateUserProfileFields(uid, updates) {
  const database = assertDb();
  const path = `users/${uid}`;
  const allowedKeys = [
    'displayName',
    'photoURL',
    'country',
    'language',
    'level',
    'englishLevel',
    'learningFocus',
    'dailyGoalMin',
    'favoriteContinent',
    'onboardingDone',
    'settings',
    'favorites',
  ];
  /** @type {Record<string, any>} */
  const safePayload = { lastLoginAt: serverTimestamp() };
  for (const k of allowedKeys) {
    if (k in updates && updates[k] !== undefined) {
      safePayload[k] = updates[k];
    }
  }
  try {
    await updateDoc(doc(database, 'users', uid), safePayload);
    // Sync display fields to public leaderboard if changed
    if (
      'displayName' in safePayload ||
      'photoURL' in safePayload ||
      'country' in safePayload
    ) {
      const lbRef = doc(database, 'leaderboard', uid);
      const lbUpdate = {
        updatedAt: serverTimestamp(),
      };
      if (safePayload.displayName) lbUpdate.displayName = safePayload.displayName;
      if ('photoURL' in safePayload) lbUpdate.photoURL = safePayload.photoURL;
      if (safePayload.country) lbUpdate.country = safePayload.country;
      await updateDoc(lbRef, lbUpdate).catch(() => {});
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Fetches user's learning progress document.
 * @param {string} uid
 */
export async function getLearningProgress(uid) {
  const database = assertDb();
  const path = `users/${uid}/learningProgress/main`;
  try {
    const snap = await getDoc(
      doc(database, 'users', uid, 'learningProgress', 'main')
    );
    return snap.exists() ? snap.data() : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

/**
 * Saves learning progress document cleanly.
 * @param {string} uid
 * @param {Record<string, any>} progressData
 */
export async function saveLearningProgress(uid, progressData) {
  const database = assertDb();
  const path = `users/${uid}/learningProgress/main`;
  try {
    await setDoc(doc(database, 'users', uid, 'learningProgress', 'main'), {
      uid,
      currentStage: Math.min(5, Math.max(1, Number(progressData.currentStage || 1))),
      completedCountries: (progressData.completedCountries || []).slice(0, 250),
      completedTerritories: (progressData.completedTerritories || []).slice(0, 60),
      masteredFlashcards: (progressData.masteredFlashcards || []).slice(0, 300),
      exploredCountries: (progressData.exploredCountries || []).slice(0, 250),
      quizScores: progressData.quizScores || {},
      englishVocabProgress: Number(progressData.englishVocabProgress || 0),
      englishSpeakingProgress: Number(progressData.englishSpeakingProgress || 0),
      expertCertified: Boolean(progressData.expertCertified),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Atomically saves a completed game result, awards bounded XP/coins, and updates leaderboard.
 * @param {string} uid
 * @param {{ gameId: string; title: string; score: number; accuracy: number; duration: number; difficulty: 'easy' | 'medium' | 'hard'; xpEarned: number; won?: boolean }} result
 */
export async function recordGameResultTransaction(uid, result) {
  const database = assertDb();
  const safeXp = Math.min(250, Math.max(0, Math.round(result.xpEarned || 0)));
  const safeCoins = Math.min(50, Math.max(1, Math.round(safeXp / 4)));
  const resultId = `game_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const resultPath = `users/${uid}/gameResults/${resultId}`;

  try {
    await runTransaction(database, async (tx) => {
      const userRef = doc(database, 'users', uid);
      const lbRef = doc(database, 'leaderboard', uid);
      const resultRef = doc(database, 'users', uid, 'gameResults', resultId);

      const userSnap = await tx.get(userRef);
      const lbSnap = await tx.get(lbRef);

      if (!userSnap.exists()) {
        throw new Error('User profile does not exist for transaction.');
      }

      const uData = userSnap.data();
      const nextXp = Number(uData.xp || 0) + safeXp;
      const nextCoins = Number(uData.coins || 0) + safeCoins;
      const nextGames = Number(uData.totalGamesPlayed || 0) + 1;
      const nextCorrect =
        Number(uData.totalCorrectAnswers || 0) +
        (result.accuracy >= 50 ? 1 : 0);

      tx.set(resultRef, {
        uid,
        gameId: result.gameId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80),
        title: String(result.title || result.gameId).slice(0, 120),
        score: Math.max(0, Math.round(result.score || 0)),
        accuracy: Math.min(100, Math.max(0, Number(result.accuracy || 0))),
        duration: Math.max(0, Math.round(result.duration || 0)),
        difficulty: ['easy', 'medium', 'hard'].includes(result.difficulty)
          ? result.difficulty
          : 'medium',
        completedAt: serverTimestamp(),
        xpEarned: safeXp,
      });

      tx.update(userRef, {
        xp: nextXp,
        coins: nextCoins,
        totalGamesPlayed: nextGames,
        totalCorrectAnswers: nextCorrect,
        lastLoginAt: serverTimestamp(),
      });

      if (lbSnap.exists()) {
        tx.update(lbRef, {
          xp: nextXp,
          totalGamesPlayed: nextGames,
          updatedAt: serverTimestamp(),
        });
      }
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, resultPath);
  }
}

/**
 * Bounded XP award for lessons, quizzes, flashcards, or AI teacher interactions.
 * @param {string} uid
 * @param {number} xpAmount
 * @param {{ lessonsDelta?: number }} [opts]
 */
export async function awardUserXpTransaction(uid, xpAmount, opts = {}) {
  const database = assertDb();
  const safeXp = Math.min(250, Math.max(0, Math.round(xpAmount)));
  if (safeXp === 0) return;

  const userPath = `users/${uid}`;
  try {
    await runTransaction(database, async (tx) => {
      const userRef = doc(database, 'users', uid);
      const lbRef = doc(database, 'leaderboard', uid);
      const userSnap = await tx.get(userRef);
      const lbSnap = await tx.get(lbRef);
      if (!userSnap.exists()) return;

      const uData = userSnap.data();
      const nextXp = Number(uData.xp || 0) + safeXp;
      const nextCoins = Number(uData.coins || 0) + Math.min(40, Math.ceil(safeXp / 5));
      const nextLessons =
        Number(uData.totalLessonsCompleted || 0) + Number(opts.lessonsDelta || 0);

      tx.update(userRef, {
        xp: nextXp,
        coins: nextCoins,
        totalLessonsCompleted: nextLessons,
        lastLoginAt: serverTimestamp(),
      });

      if (lbSnap.exists()) {
        tx.update(lbRef, {
          xp: nextXp,
          updatedAt: serverTimestamp(),
        });
      }
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, userPath);
  }
}

/**
 * Paginated query for a user's completed game results.
 * @param {string} uid
 * @param {number} [pageSize]
 * @param {any} [lastDocSnap]
 */
export async function getUserGameResultsPage(uid, pageSize = 10, lastDocSnap = null) {
  const database = assertDb();
  const path = `users/${uid}/gameResults`;
  try {
    const colRef = collection(database, 'users', uid, 'gameResults');
    const q = lastDocSnap
      ? query(
          colRef,
          where('uid', '==', uid),
          orderBy('completedAt', 'desc'),
          startAfter(lastDocSnap),
          limit(pageSize)
        )
      : query(
          colRef,
          where('uid', '==', uid),
          orderBy('completedAt', 'desc'),
          limit(pageSize)
        );
    const snap = await getDocs(q);
    return {
      items: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
      lastDoc: snap.docs[snap.docs.length - 1] || null,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return { items: [], lastDoc: null };
  }
}

/**
 * Saves an unlocked achievement document + syncs array on users/{uid}.
 * @param {string} uid
 * @param {{ achievementId: string; title: string; xpReward?: number }} ach
 */
export async function unlockAchievementInFirestore(uid, ach) {
  const database = assertDb();
  const cleanId = ach.achievementId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
  const path = `users/${uid}/achievements/${cleanId}`;
  try {
    const achRef = doc(database, 'users', uid, 'achievements', cleanId);
    const existingSnap = await getDoc(achRef);
    if (!existingSnap.exists()) {
      await setDoc(achRef, {
        uid,
        achievementId: cleanId,
        title: ach.title.slice(0, 120),
        xpReward: Math.min(200, Math.max(0, Number(ach.xpReward || 25))),
        unlockedAt: serverTimestamp(),
      });
    }
    const userRef = doc(database, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const current = Array.isArray(userSnap.data().achievements)
        ? userSnap.data().achievements
        : [];
      if (!current.includes(cleanId)) {
        await updateDoc(userRef, {
          achievements: [...current, cleanId].slice(0, 60),
          lastLoginAt: serverTimestamp(),
        });
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Toggles a favorite country document in users/{uid}/favorites and updates array on users/{uid}.
 * @param {string} uid
 * @param {{ id: string; name: string; code: string }} country
 * @param {boolean} shouldAdd
 */
export async function toggleFavoriteInFirestore(uid, country, shouldAdd) {
  const database = assertDb();
  const cleanId = country.id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
  const path = `users/${uid}/favorites/${cleanId}`;
  try {
    const favRef = doc(database, 'users', uid, 'favorites', cleanId);
    if (shouldAdd) {
      await setDoc(favRef, {
        uid,
        countryId: cleanId,
        name: country.name.slice(0, 100),
        code: (country.code || 'UN').slice(0, 8),
        savedAt: serverTimestamp(),
      });
    } else {
      await deleteDoc(favRef);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Records today's daily challenge completion in users/{uid}/dailyChallenges/{dateId}.
 * @param {string} uid
 * @param {number} [xpEarned]
 */
export async function recordDailyChallengeInFirestore(uid, xpEarned = 40) {
  const database = assertDb();
  const dateId = new Date().toISOString().slice(0, 10);
  const path = `users/${uid}/dailyChallenges/${dateId}`;
  try {
    await setDoc(doc(database, 'users', uid, 'dailyChallenges', dateId), {
      uid,
      dateId,
      completed: true,
      xpEarned: Math.min(100, Math.max(0, xpEarned)),
      completedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Logs platform activity event.
 * @param {string} uid
 * @param {string} action
 * @param {string} detail
 */
export async function logActivityInFirestore(uid, action, detail) {
  if (!db) return;
  const logId = `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  try {
    await setDoc(doc(db, 'activityLogs', logId), {
      uid,
      action: action.slice(0, 100),
      detail: detail.slice(0, 300),
      createdAt: serverTimestamp(),
    });
  } catch {
    // Non-critical telemetry
  }
}

/**
 * Queries top users from PII-free /leaderboard collection.
 * @param {number} [topCount]
 */
export async function getLeaderboardFromFirestore(topCount = 20) {
  const database = assertDb();
  const path = 'leaderboard';
  try {
    const q = query(
      collection(database, 'leaderboard'),
      orderBy('xp', 'desc'),
      limit(topCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d, idx) => ({
      rank: idx + 1,
      ...d.data(),
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

// ================= ADMIN / PUBLIC CONTENT READS =================

export async function getPublicCountryLessons(maxItems = 50) {
  if (!db) return [];
  try {
    const snap = await getDocs(
      query(collection(db, 'publicCountries'), limit(maxItems))
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'publicCountries');
    return [];
  }
}

export async function getPublicQuizzes(maxItems = 50) {
  if (!db) return [];
  try {
    const snap = await getDocs(query(collection(db, 'quizzes'), limit(maxItems)));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'quizzes');
    return [];
  }
}
