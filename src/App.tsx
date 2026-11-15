/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { AnimatePresence, motion } from 'motion/react';
import {
  Award,
  BookOpen,
  Bot,
  Compass,
  Crown,
  Flame,
  Gamepad2,
  Globe2,
  GraduationCap,
  Home,
  Languages,
  LogIn,
  Map as MapIcon,
  Menu,
  Moon,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  Trophy,
  User,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { GEO_COUNTRIES, GEO_FLASHCARDS, type GeoCountry } from './data/geoWorldData';
import {
  type LearningHistoryEntry,
  type ServiceStatus,
  type UserProfile,
  type UserProgress,
} from './types/user';
import { useAuth } from './hooks/useAuth';
import {
  awardUserXpTransaction,
  logActivityInFirestore,
  recordDailyChallengeInFirestore,
  recordGameResultTransaction,
  saveLearningProgress,
  toggleFavoriteInFirestore,
  unlockAchievementInFirestore,
  updateUserProfileFields,
} from './firebase/firestore.js';
import { HomePage, type NavSection } from './components/HomePage';
import { InteractiveMapPage } from './components/InteractiveMapPage';
import { CountryExplorerPage } from './components/CountryExplorerPage';
import { QuizPage } from './components/QuizPage';
import { LearningModePage } from './components/LearningModePage';
import { AcademyPage } from './components/AcademyPage';
import { GeoAITeacherPage } from './components/GeoAITeacherPage';
import { DictionaryPage } from './components/DictionaryPage';
import { GameCenterPage } from './components/GameCenterPage';
import { type GameDifficulty } from './components/GamePlayEngine';
import { EnglishTeacherPage } from './components/EnglishTeacherPage';
import { ProModePage } from './components/ProModePage';
import { ProfilePage } from './components/ProfilePage';
import { AdminDashboardPage } from './components/AdminDashboardPage';
import { AuthModal } from './components/AuthModal';
import { OnboardingModal } from './components/OnboardingModal';
import { CountryFlag } from './components/CountryFlag';
import { soundEngine } from './utils/sound';

const NAV_ITEMS: Array<{
  id: NavSection;
  label: string;
  icon: typeof Home;
  badge?: string;
}> = [
  { id: 'home', label: 'Bosh sahifa', icon: Home },
  { id: 'academy', label: '5 Bosqichli Akademiya', icon: GraduationCap },
  { id: 'games', label: 'O‘yin markazi (45+)', icon: Gamepad2 },
  { id: 'geo-ai', label: 'GeoAI Ustoz', icon: Bot },
  { id: 'english-ai', label: 'AI Ingliz tili', icon: Languages },
  { id: 'pro', label: 'GEOWORLD PRO', icon: Crown, badge: 'PRO' },
  { id: 'dictionary', label: 'Geografik lug‘at', icon: BookOpen },
  { id: 'map', label: 'Interaktiv xarita', icon: MapIcon },
  { id: 'explorer', label: 'Davlatlar katalogi', icon: Compass },
  { id: 'quiz', label: 'Viktorina', icon: Trophy },
  { id: 'learn', label: 'Ta’lim rejimi', icon: Sparkles },
  { id: 'profile', label: 'Profil & Sozlamalar', icon: User },
];

export default function App() {
  const {
    firebaseUser,
    firestoreProfile,
    firestoreProgress,
    subscription,
    isAdmin,
    logout: firebaseLogout,
  } = useAuth();

  const [activeSection, setActiveSection] = useState<NavSection>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const visibleNavItems = useMemo(
    () =>
      isAdmin
        ? [
            ...NAV_ITEMS,
            {
              id: 'admin' as NavSection,
              label: 'Admin Panel',
              icon: ShieldCheck,
              badge: 'ADMIN',
            },
          ]
        : NAV_ITEMS,
    [isAdmin]
  );

  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('geoworld_theme') === 'dark';
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('geoworld_sound');
    return saved === null ? true : saved === 'true';
  });

  const [aiVoiceUri, setAiVoiceUri] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('geoworld_ai_voice_uri') || '';
  });

  const [aiSpeechRate, setAiSpeechRate] = useState<number>(() => {
    if (typeof window === 'undefined') return 1.0;
    const saved = Number(localStorage.getItem('geoworld_ai_speech_rate'));
    return Number.isFinite(saved) && saved >= 0.5 && saved <= 2.0 ? saved : 1.0;
  });

  const [user, setUser] = useState<UserProfile | null>(null);
  const [services, setServices] = useState<ServiceStatus>({
    googleAuthConfigured: false,
    googleClientId: null,
    stripeConfigured: false,
    geminiConfigured: true,
  });
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [verificationHint, setVerificationHint] = useState<string | undefined>();
  const [proVerifyBanner, setProVerifyBanner] = useState<string | null>(null);
  const [xpToast, setXpToast] = useState<{
    id: number;
    amount: number;
    label: string;
  } | null>(null);
  const [levelUpBanner, setLevelUpBanner] = useState<number | null>(null);
  const [badgeBanner, setBadgeBanner] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const [xp, setXp] = useState<number>(() => {
    const saved = Number(localStorage.getItem('geoworld_xp'));
    return Number.isFinite(saved) && saved > 0 ? saved : 60;
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem('geoworld_favs') || '[]');
      return Array.isArray(parsed) ? parsed : ['uzbekistan', 'japan'];
    } catch {
      return ['uzbekistan', 'japan'];
    }
  });

  const [masteredFlashcards, setMasteredFlashcards] = useState<string[]>(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem('geoworld_cards') || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [exploredCountries, setExploredCountries] = useState<string[]>(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem('geoworld_explored') || '[]');
      return Array.isArray(parsed) ? parsed : ['Uzbekistan'];
    } catch {
      return ['Uzbekistan'];
    }
  });

  const [quizzesCompleted, setQuizzesCompleted] = useState<number>(() => {
    const saved = Number(localStorage.getItem('geoworld_quizzes'));
    return Number.isFinite(saved) && saved > 0 ? saved : 0;
  });

  const [gamesWon, setGamesWon] = useState<number>(() => {
    const saved = Number(localStorage.getItem('geoworld_games_won'));
    return Number.isFinite(saved) && saved > 0 ? saved : 0;
  });

  const [highScores, setHighScores] = useState<Record<string, number>>(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem('geoworld_high_scores') || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  });

  const [learningHistory, setLearningHistory] = useState<LearningHistoryEntry[]>(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem('geoworld_history') || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [dailyCompleted, setDailyCompleted] = useState<boolean>(() => {
    return localStorage.getItem('geoworld_daily') === 'true';
  });

  const [unlockedBadges, setUnlockedBadges] = useState<string[]>(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem('geoworld_badges') || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [explorerCountry, setExplorerCountry] = useState<GeoCountry>(
    GEO_COUNTRIES[0]
  );
  const [globalSearch, setGlobalSearch] = useState('');
  const [geoAiPrompt, setGeoAiPrompt] = useState<string | null>(null);

  const [completedCountries, setCompletedCountries] = useState<string[]>(() => {
    try {
      const parsed = JSON.parse(
        localStorage.getItem('geoworld_academy_countries') || '[]'
      );
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [completedTerritories, setCompletedTerritories] = useState<string[]>(() => {
    try {
      const parsed = JSON.parse(
        localStorage.getItem('geoworld_academy_territories') || '[]'
      );
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [expertCertified, setExpertCertified] = useState<boolean>(() => {
    return localStorage.getItem('geoworld_expert_cert') === 'true';
  });

  const applyServerProgress = useCallback((u: UserProfile, p: UserProgress) => {
    setUser(u);
    setXp(u.xp);
    if (typeof u.aiVoiceUri === 'string') {
      setAiVoiceUri(u.aiVoiceUri);
      localStorage.setItem('geoworld_ai_voice_uri', u.aiVoiceUri);
    }
    if (
      typeof u.aiSpeechRate === 'number' &&
      Number.isFinite(u.aiSpeechRate) &&
      u.aiSpeechRate >= 0.5 &&
      u.aiSpeechRate <= 2.0
    ) {
      setAiSpeechRate(u.aiSpeechRate);
      localStorage.setItem('geoworld_ai_speech_rate', String(u.aiSpeechRate));
    }
    setFavorites(p.favorites);
    setCompletedCountries(p.completedCountries);
    setCompletedTerritories(p.completedTerritories);
    setUnlockedBadges(p.unlockedBadges);
    setMasteredFlashcards(p.masteredFlashcards);
    setExploredCountries(p.exploredCountries);
    setQuizzesCompleted(p.quizzesCompleted);
    setGamesWon(p.gamesWon);
    setHighScores(p.highScores);
    setLearningHistory(p.learningHistory);
    setDailyCompleted(p.dailyCompleted);
    setExpertCertified(p.expertCertified);
  }, []);

  // Hydrate authenticated session & check Stripe PRO callback on boot
  useEffect(() => {
    let active = true;
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then(async (data) => {
        if (!active) return;
        if (data.services) setServices(data.services);
        if (data.user && data.progress) {
          applyServerProgress(data.user, data.progress);
        }

        const params = new URLSearchParams(window.location.search);
        const sessionId = params.get('pro_session_id');
        if (sessionId && data.user) {
          const vr = await fetch(
            `/api/pro/verify-session?session_id=${encodeURIComponent(sessionId)}`
          );
          const vd = await vr.json();
          if (vr.ok && vd.verified && vd.user) {
            setUser(vd.user);
            setProVerifyBanner('GEOWORLD PRO obunangiz muvaffaqiyatli faollashtirildi!');
            window.history.replaceState({}, '', '/');
          }
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [applyServerProgress]);

  // Hydrate client state from Firebase Firestore when authenticated (without overwriting existing progress)
  const hydratedFirebaseUidRef = useRef<string | null>(null);
  useEffect(() => {
    if (!firebaseUser) {
      hydratedFirebaseUidRef.current = null;
      return;
    }

    const p = firestoreProfile as Record<string, unknown> | null;
    const isLifetimeSub =
      Boolean(subscription?.lifetimePro) ||
      subscription?.subscriptionType === 'lifetime' ||
      subscription?.subscriptionPlan === 'lifetime';
    const isSubExpired =
      !isLifetimeSub &&
      Boolean(
        subscription?.subscriptionEndDate &&
          Date.now() >= new Date(subscription.subscriptionEndDate).getTime()
      );
    const isSubPro =
      isLifetimeSub ||
      (subscription?.entitlementStatus === 'pro' &&
        subscription?.subscriptionStatus === 'active' &&
        !isSubExpired);

    if (p) {
      const profileSettings = (p.settings || {}) as Record<string, unknown>;
      const isInitialHydration = hydratedFirebaseUidRef.current !== firebaseUser.uid;
      hydratedFirebaseUidRef.current = firebaseUser.uid;

      const mergedUser: UserProfile = {
        id: firebaseUser.uid,
        email: String(p.email || firebaseUser.email || ''),
        authProvider:
          firebaseUser.providerData[0]?.providerId === 'google.com'
            ? 'google'
            : 'firebase',
        username: String(
          p.displayName ||
            firebaseUser.displayName ||
            firebaseUser.email?.split('@')[0] ||
            'Geograf'
        ),
        displayName: String(
          p.displayName || firebaseUser.displayName || 'Geograf'
        ),
        avatar: String(user?.avatar || '🧭'),
        countryCode: String(p.country || 'UZ'),
        geoLevel: String(p.level || 'O‘rta'),
        learningFocus: String(p.learningFocus || 'Ikkalasi'),
        englishLevel: String(p.englishLevel || 'A2'),
        dailyGoalMin: Number(p.dailyGoalMin || 20),
        favoriteContinent: String(p.favoriteContinent || 'Osiyo'),
        onboardingDone: Boolean(p.onboardingDone ?? true),
        emailVerified: Boolean(firebaseUser.emailVerified),
        isPro: Boolean(isSubPro || (!isSubExpired && p.proStatus)),
        proStatus: isSubPro ? 'active' : isSubExpired ? 'expired' : 'inactive',
        subscriptionType: isLifetimeSub
          ? 'lifetime'
          : subscription?.subscriptionType || (isSubPro ? 'paid' : 'free'),
        proPlan: isLifetimeSub
          ? 'lifetime'
          : String(
              subscription?.subscriptionPlan || p.subscriptionPlan || 'free'
            ),
        subscriptionStart: subscription?.subscriptionStartDate || null,
        proExpiresAt: isLifetimeSub
          ? null
          : subscription?.subscriptionEndDate || null,
        lifetimePro: isLifetimeSub,
        promoCode: subscription?.promoCode,
        xp: typeof p.xp === 'number' ? p.xp : xp,
        coins: typeof p.coins === 'number' ? p.coins : 20,
        photoURL: String(p.photoURL || firebaseUser.photoURL || ''),
        streak: typeof p.streak === 'number' ? p.streak : 1,
        lastActiveDate: new Date().toISOString().slice(0, 10),
        aiVoiceUri:
          typeof profileSettings.aiVoiceUri === 'string'
            ? profileSettings.aiVoiceUri
            : aiVoiceUri,
        aiSpeechRate:
          typeof profileSettings.aiSpeechRate === 'number'
            ? profileSettings.aiSpeechRate
            : aiSpeechRate,
        role: isAdmin ? 'admin' : 'student',
        createdAt: new Date().toISOString(),
      };

      setUser(mergedUser);

      if (isInitialHydration) {
        if (typeof p.xp === 'number') setXp(p.xp);
        if (Array.isArray(p.favorites)) setFavorites(p.favorites as string[]);
        if (Array.isArray(p.achievements)) {
          setUnlockedBadges((prev) =>
            Array.from(new Set([...prev, ...(p.achievements as string[])]))
          );
        }
        if (typeof profileSettings.aiVoiceUri === 'string') {
          setAiVoiceUri(profileSettings.aiVoiceUri);
        }
        if (typeof profileSettings.aiSpeechRate === 'number') {
          setAiSpeechRate(profileSettings.aiSpeechRate);
        }
      }
    }

    const lp = firestoreProgress as Record<string, unknown> | null;
    if (lp && hydratedFirebaseUidRef.current === firebaseUser.uid) {
      if (Array.isArray(lp.completedCountries)) {
        setCompletedCountries((prev) =>
          Array.from(new Set([...prev, ...(lp.completedCountries as string[])]))
        );
      }
      if (Array.isArray(lp.completedTerritories)) {
        setCompletedTerritories((prev) =>
          Array.from(new Set([...prev, ...(lp.completedTerritories as string[])]))
        );
      }
      if (Array.isArray(lp.masteredFlashcards)) {
        setMasteredFlashcards((prev) =>
          Array.from(new Set([...prev, ...(lp.masteredFlashcards as string[])]))
        );
      }
      if (Array.isArray(lp.exploredCountries)) {
        setExploredCountries((prev) =>
          Array.from(new Set([...prev, ...(lp.exploredCountries as string[])]))
        );
      }
      if (lp.expertCertified === true) {
        setExpertCertified(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUser, firestoreProfile, firestoreProgress, subscription, isAdmin]);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('geoworld_theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    soundEngine.setEnabled(soundEnabled);
    localStorage.setItem('geoworld_sound', String(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('geoworld_xp', String(xp));
  }, [xp]);
  useEffect(() => {
    localStorage.setItem('geoworld_favs', JSON.stringify(favorites));
  }, [favorites]);
  useEffect(() => {
    localStorage.setItem('geoworld_cards', JSON.stringify(masteredFlashcards));
  }, [masteredFlashcards]);
  useEffect(() => {
    localStorage.setItem('geoworld_explored', JSON.stringify(exploredCountries));
  }, [exploredCountries]);
  useEffect(() => {
    localStorage.setItem('geoworld_quizzes', String(quizzesCompleted));
  }, [quizzesCompleted]);
  useEffect(() => {
    localStorage.setItem('geoworld_games_won', String(gamesWon));
  }, [gamesWon]);
  useEffect(() => {
    localStorage.setItem('geoworld_high_scores', JSON.stringify(highScores));
  }, [highScores]);
  useEffect(() => {
    localStorage.setItem('geoworld_history', JSON.stringify(learningHistory));
  }, [learningHistory]);
  useEffect(() => {
    localStorage.setItem('geoworld_daily', String(dailyCompleted));
  }, [dailyCompleted]);
  useEffect(() => {
    localStorage.setItem('geoworld_badges', JSON.stringify(unlockedBadges));
  }, [unlockedBadges]);
  useEffect(() => {
    localStorage.setItem(
      'geoworld_academy_countries',
      JSON.stringify(completedCountries)
    );
  }, [completedCountries]);
  useEffect(() => {
    localStorage.setItem(
      'geoworld_academy_territories',
      JSON.stringify(completedTerritories)
    );
  }, [completedTerritories]);
  useEffect(() => {
    localStorage.setItem('geoworld_expert_cert', String(expertCertified));
  }, [expertCertified]);

  // Debounced sync to SQLite + Firestore learningProgress when logged in
  const syncTimerRef = useRef<number | null>(null);
  useEffect(() => {
    if (!user && !firebaseUser) return;
    if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current);
    syncTimerRef.current = window.setTimeout(() => {
      if (user) {
        fetch('/api/user/progress', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            xp,
            favorites,
            completedCountries,
            completedTerritories,
            unlockedBadges,
            masteredFlashcards,
            exploredCountries,
            quizzesCompleted,
            gamesWon,
            highScores,
            learningHistory,
            dailyCompleted,
            expertCertified,
          }),
        }).catch(() => {});
      }

      if (firebaseUser && hydratedFirebaseUidRef.current === firebaseUser.uid) {
        void saveLearningProgress(firebaseUser.uid, {
          currentStage: expertCertified
            ? 5
            : completedCountries.length > 0
              ? 2
              : 1,
          completedCountries,
          completedTerritories,
          masteredFlashcards,
          exploredCountries,
          quizScores: highScores,
          expertCertified,
        }).catch(() => {});
      }
    }, 750);
    return () => {
      if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current);
    };
  }, [
    user,
    firebaseUser,
    xp,
    favorites,
    completedCountries,
    completedTerritories,
    unlockedBadges,
    masteredFlashcards,
    exploredCountries,
    quizzesCompleted,
    gamesWon,
    highScores,
    learningHistory,
    dailyCompleted,
    expertCertified,
  ]);

  const BADGE_TITLES: Record<string, string> = {
    'first-quiz': 'Ilk Viktorina Qahramoni',
    'geo-champion': 'Geografiya Chempioni (300+ XP)',
    'map-explorer': 'Xarita Tadqiqotchisi',
    'flashcard-pro': 'Kartochka Ustasi',
    'daily-streak': 'Kunlik Faol O‘quvchi',
    'flag-master': 'Bayroq Bilimdoni',
    'first-win': 'Birinchi O‘yin G‘olibligi',
  };

  const unlockBadge = useCallback(
    (badgeId: string) => {
      setUnlockedBadges((prev) => {
        if (prev.includes(badgeId)) return prev;
        soundEngine.playSuccess();
        const title = BADGE_TITLES[badgeId] || badgeId;
        setBadgeBanner({
          id: badgeId,
          title,
        });
        if (firebaseUser) {
          void unlockAchievementInFirestore(firebaseUser.uid, {
            achievementId: badgeId,
            title,
            xpReward: 25,
          }).catch(() => {});
        }
        return [...prev, badgeId];
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [firebaseUser]
  );

  useEffect(() => {
    if (xp >= 300) unlockBadge('geo-champion');
    if (exploredCountries.length >= 5) unlockBadge('map-explorer');
    if (masteredFlashcards.length >= 6) unlockBadge('flashcard-pro');
  }, [xp, exploredCountries.length, masteredFlashcards.length, unlockBadge]);

  const appendHistory = useCallback((title: string, type: string, gainedXp: number) => {
    setLearningHistory((prev) =>
      [
        {
          id: `${Date.now()}`,
          title,
          type,
          xp: gainedXp,
          at: new Date().toISOString(),
        },
        ...prev,
      ].slice(0, 60)
    );
  }, []);

  const triggerXpFeedback = useCallback(
    (prevXp: number, amt: number, label: string) => {
      if (amt <= 0) return;
      const nextXp = prevXp + amt;
      setXpToast({ id: Date.now(), amount: amt, label });
      const oldLevel = Math.floor(prevXp / 150) + 1;
      const newLevel = Math.floor(nextXp / 150) + 1;
      if (newLevel > oldLevel) {
        setLevelUpBanner(newLevel);
        soundEngine.playSuccess();
        try {
          confetti({ particleCount: 70, spread: 65, origin: { y: 0.78 } });
        } catch {
          // ignore confetti environment errors
        }
      }
    },
    []
  );

  useEffect(() => {
    if (!xpToast) return;
    const t = window.setTimeout(() => setXpToast(null), 2600);
    return () => window.clearTimeout(t);
  }, [xpToast]);

  useEffect(() => {
    if (!levelUpBanner) return;
    const t = window.setTimeout(() => setLevelUpBanner(null), 4200);
    return () => window.clearTimeout(t);
  }, [levelUpBanner]);

  useEffect(() => {
    if (!badgeBanner) return;
    const t = window.setTimeout(() => setBadgeBanner(null), 4000);
    return () => window.clearTimeout(t);
  }, [badgeBanner]);

  const awardXp = useCallback(
    (amt: number, label = 'O‘quv faolligi') => {
      setXp((prev) => {
        triggerXpFeedback(prev, amt, label);
        return prev + amt;
      });
      setUser((u) => (u ? { ...u, xp: u.xp + amt } : u));
      appendHistory(label, 'Mashg‘ulot', amt);
      if (firebaseUser) {
        const isLesson = label.includes('Akademiya') || label.includes('Hudud');
        void awardUserXpTransaction(firebaseUser.uid, amt, {
          lessonsDelta: isLesson ? 1 : 0,
        }).catch(() => {});
      }
    },
    [appendHistory, firebaseUser, triggerXpFeedback]
  );

  const globalSearchResults = useMemo(() => {
    const q = globalSearch.trim().toLowerCase();
    if (!q) return [];
    return GEO_COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.capital.toLowerCase().includes(q) ||
        c.continent.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [globalSearch]);

  function handleToggleFavorite(id: string) {
    const shouldAdd = !favorites.includes(id);
    const nextFavs = shouldAdd
      ? [...favorites, id]
      : favorites.filter((item) => item !== id);
    setFavorites(nextFavs);

    if (firebaseUser) {
      const country = GEO_COUNTRIES.find((c) => c.id === id);
      void toggleFavoriteInFirestore(
        firebaseUser.uid,
        {
          id,
          name: country?.name || id,
          code: country?.code || 'UN',
        },
        shouldAdd
      ).catch(() => {});
      void updateUserProfileFields(firebaseUser.uid, {
        favorites: nextFavs,
      }).catch(() => {});
    }
  }

  function handleOpenCountryInExplorer(country: GeoCountry) {
    setExplorerCountry(country);
    setActiveSection('explorer');
    setGlobalSearch('');
    setMobileMenuOpen(false);
  }

  function handleRecordMapVisit(atlasName: string) {
    setExploredCountries((prev) =>
      prev.includes(atlasName) ? prev : [...prev, atlasName]
    );
  }

  function handleMasterFlashcard(id: string) {
    if (!masteredFlashcards.includes(id)) {
      setMasteredFlashcards((prev) => [...prev, id]);
      awardXp(15, 'Kartochka o‘zlashtirildi');
    }
  }

  function handleCompleteDailyChallenge() {
    if (!dailyCompleted) {
      setDailyCompleted(true);
      awardXp(40, 'Kunlik vazifa');
      unlockBadge('daily-streak');
      if (firebaseUser) {
        void recordDailyChallengeInFirestore(firebaseUser.uid, 40).catch(() => {});
        void logActivityInFirestore(
          firebaseUser.uid,
          'Kunlik vazifa',
          'Kunlik geografiya vazifasi bajarildi (+40 XP)'
        );
      }
    }
  }

  function handleFinishQuiz(payload: {
    earnedXp: number;
    correctCount: number;
    totalQuestions: number;
    category: string;
  }) {
    awardXp(payload.earnedXp, `Viktorina: ${payload.category}`);
    setQuizzesCompleted((prev) => prev + 1);
    unlockBadge('first-quiz');
    if (
      payload.category === 'Bayroqlar' &&
      payload.totalQuestions > 0 &&
      payload.correctCount / payload.totalQuestions >= 0.8
    ) {
      unlockBadge('flag-master');
    }
    if (firebaseUser) {
      void logActivityInFirestore(
        firebaseUser.uid,
        'Viktorina yakunlandi',
        `${payload.category}: ${payload.correctCount}/${payload.totalQuestions}`
      );
    }
  }

  const handleRecordGameResult = useCallback(
    (payload: {
      gameId: string;
      titleUz: string;
      score: number;
      xpEarned: number;
      won: boolean;
      difficulty: GameDifficulty;
    }) => {
      setXp((prev) => {
        triggerXpFeedback(prev, payload.xpEarned, payload.titleUz);
        return prev + payload.xpEarned;
      });
      setUser((u) => (u ? { ...u, xp: u.xp + payload.xpEarned } : u));
      if (payload.won) {
        setGamesWon((w) => w + 1);
        unlockBadge('first-win');
      }
      setHighScores((prev) => ({
        ...prev,
        [payload.gameId]: Math.max(prev[payload.gameId] || 0, payload.score),
      }));
      appendHistory(
        `O‘yin: ${payload.titleUz} (${payload.score} ball)`,
        payload.difficulty,
        payload.xpEarned
      );

      fetch('/api/game-scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: payload.gameId,
          score: payload.score,
          xpEarned: payload.xpEarned,
          difficulty: payload.difficulty,
        }),
      }).catch(() => {});

      if (firebaseUser) {
        const fsDiff =
          payload.difficulty === 'Oson'
            ? 'easy'
            : payload.difficulty === 'Qiyin'
              ? 'hard'
              : 'medium';
        void recordGameResultTransaction(firebaseUser.uid, {
          gameId: payload.gameId,
          title: payload.titleUz,
          score: payload.score,
          accuracy: payload.won ? 100 : 45,
          duration: 45,
          difficulty: fsDiff,
          xpEarned: payload.xpEarned,
          won: payload.won,
        }).catch(() => {});
        void logActivityInFirestore(
          firebaseUser.uid,
          'O‘yin natijasi',
          `${payload.titleUz}: ${payload.score} ball (${payload.difficulty})`
        );
      }
    },
    [appendHistory, firebaseUser, triggerXpFeedback, unlockBadge]
  );

  function handleCompleteAcademyCountry(iso2: string) {
    if (!completedCountries.includes(iso2)) {
      setCompletedCountries((prev) => [...prev, iso2]);
      awardXp(50, `Akademiya darsi (${iso2})`);
    }
  }

  function handleCompleteAcademyTerritory(id: string) {
    if (!completedTerritories.includes(id)) {
      setCompletedTerritories((prev) => [...prev, id]);
      awardXp(35, `Hudud darsi (${id})`);
    }
  }

  function handleOpenGeoAiWithPrompt(prompt: string) {
    setGeoAiPrompt(prompt);
    setActiveSection('geo-ai');
  }

  const handleUpdateAiVoice = useCallback(
    (voiceUri: string, speechRate: number) => {
      const clampedRate = Math.min(2.0, Math.max(0.5, Number(speechRate.toFixed(2))));
      setAiVoiceUri(voiceUri);
      setAiSpeechRate(clampedRate);
      localStorage.setItem('geoworld_ai_voice_uri', voiceUri);
      localStorage.setItem('geoworld_ai_speech_rate', String(clampedRate));
      if (user) {
        setUser((u) =>
          u ? { ...u, aiVoiceUri: voiceUri, aiSpeechRate: clampedRate } : u
        );
        fetch('/api/user/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            aiVoiceUri: voiceUri,
            aiSpeechRate: clampedRate,
          }),
        }).catch(() => {});
      }
      if (firebaseUser) {
        void updateUserProfileFields(firebaseUser.uid, {
          settings: {
            theme: isDark ? 'dark' : 'light',
            soundEnabled,
            aiVoiceUri: voiceUri,
            aiSpeechRate: clampedRate,
          },
        }).catch(() => {});
      }
    },
    [firebaseUser, isDark, soundEnabled, user]
  );

  async function handleLogout() {
    await Promise.all([
      firebaseLogout().catch(() => {}),
      fetch('/api/auth/logout', { method: 'POST' }).catch(() => {}),
    ]);
    setUser(null);
    setActiveSection('home');
  }

  const currentProgress: UserProgress = {
    favorites,
    completedCountries,
    completedTerritories,
    unlockedBadges,
    masteredFlashcards,
    exploredCountries,
    quizzesCompleted,
    gamesWon,
    highScores,
    learningHistory,
    dailyCompleted,
    expertCertified,
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-30">
        <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-600 via-emerald-500 to-indigo-600 flex items-center justify-center text-white shrink-0">
            <Globe2 className="w-5 h-5" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
            GeoWorld
          </span>
        </div>

        <nav
          aria-label="Asosiy navigatsiya"
          className="flex-1 p-3.5 space-y-1 overflow-y-auto"
        >
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setActiveSection(item.id);
                }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap ${
                  active
                    ? item.id === 'pro'
                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                      : 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      item.id === 'pro' ? 'text-amber-500' : ''
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.badge && (
                  <span className="px-1.5 py-0.5 rounded-md bg-amber-400 text-slate-950 text-[10px] font-extrabold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              <span>Sizning balingiz</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <p className="font-mono text-xl font-bold text-slate-900 dark:text-white tabular-nums">
              {xp} XP
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {unlockedBadges.length} ta nishon · {gamesWon} ta g‘alaba
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-72 max-w-[82vw] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col z-10">
            <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-600 to-indigo-600 flex items-center justify-center text-white">
                  <Globe2 className="w-5 h-5" />
                </div>
                <span className="font-display text-lg font-bold">GeoWorld</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Menyuni yopish"
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const active = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setActiveSection(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      active
                        ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </span>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 rounded-md bg-amber-400 text-slate-950 text-[10px] font-extrabold">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content Shell */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 h-16 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Menyuni ochish"
              className="lg:hidden p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="relative w-full max-w-md">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Davlat yoki poytaxtni tezkor qidirish..."
                aria-label="Global qidiruv"
                className="w-full pl-9 pr-8 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-sky-600"
              />
              {globalSearch && (
                <button
                  type="button"
                  onClick={() => setGlobalSearch('')}
                  aria-label="Tozalash"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {globalSearchResults.length > 0 && (
                <div className="absolute z-40 left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden">
                  {globalSearchResults.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        handleOpenCountryInExplorer(c);
                      }}
                      className="w-full px-3.5 py-2.5 text-left flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 border-b last:border-b-0 border-slate-100 dark:border-slate-800"
                    >
                      <CountryFlag
                        code={c.code}
                        name={c.name}
                        className="w-7 h-5"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {c.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {c.capital} · {c.continent}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setSoundEnabled((prev) => !prev)}
              aria-label={soundEnabled ? 'Ovozni o‘chirish' : 'Ovozni yoqish'}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={soundEnabled ? 'Ovoz yoqilgan' : 'Ovoz o‘chirilgan'}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setIsDark((prev) => !prev);
              }}
              aria-label={isDark ? 'Yorug‘ rejim' : 'Qorong‘i rejim'}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={isDark ? 'Yorug‘ rejim' : 'Qorong‘i rejim'}
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 font-mono text-xs font-bold text-sky-700 dark:text-sky-300 tabular-nums">
              {xp} XP
            </span>

            {user ? (
              <button
                type="button"
                onClick={() => setActiveSection('profile')}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold hover:border-sky-500 transition-colors"
              >
                <span className="text-base">{user.avatar}</span>
                <span className="hidden sm:inline max-w-24 truncate">
                  {user.username}
                </span>
                <span className="inline-flex items-center gap-0.5 text-orange-500 font-mono tabular-nums">
                  <Flame className="w-3.5 h-3.5" />
                  {user.streak}
                </span>
                {user.isPro && <Crown className="w-3.5 h-3.5 text-amber-500" />}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Kirish</span>
              </button>
            )}
          </div>
        </header>

        {proVerifyBanner && (
          <div className="bg-amber-50 dark:bg-amber-950/60 border-b border-amber-300 dark:border-amber-700 px-6 py-2.5 text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center justify-between">
            <span>{proVerifyBanner}</span>
            <button
              type="button"
              onClick={() => setProVerifyBanner(null)}
              className="underline"
            >
              Yopish
            </button>
          </div>
        )}

        <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-8 py-8">
          {activeSection === 'home' && (
            <HomePage
              xp={xp}
              masteredFlashcards={masteredFlashcards.length}
              totalFlashcards={GEO_FLASHCARDS.length}
              quizzesCompleted={quizzesCompleted}
              favorites={favorites}
              dailyCompleted={dailyCompleted}
              isDark={isDark}
              onCompleteDailyChallenge={handleCompleteDailyChallenge}
              onToggleFavorite={handleToggleFavorite}
              onNavigate={(sec) => setActiveSection(sec)}
              onOpenCountryInExplorer={handleOpenCountryInExplorer}
            />
          )}

          {activeSection === 'games' && (
            <GameCenterPage
              user={user}
              progress={currentProgress}
              isDark={isDark}
              onOpenPro={() => setActiveSection('pro')}
              onRecordGameResult={handleRecordGameResult}
              onAwardXp={awardXp}
            />
          )}

          {activeSection === 'pro' && (
            <ProModePage
              user={user}
              services={services}
              onOpenAuth={() => setAuthModalOpen(true)}
              onNavigate={(sec) => setActiveSection(sec)}
              onUserUpdated={(updatedUser) => setUser(updatedUser)}
            />
          )}

          {activeSection === 'english-ai' && (
            <EnglishTeacherPage
              initialLevel={user?.englishLevel || 'A2'}
              geminiConfigured={services.geminiConfigured}
              onAwardXp={awardXp}
              onUpdateEnglishLevel={(lvl) => {
                  if (user) {
                    setUser((u) => (u ? { ...u, englishLevel: lvl } : u));
                    fetch('/api/user/profile', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ englishLevel: lvl }),
                    }).catch(() => {});
                  }
                  if (firebaseUser) {
                    void updateUserProfileFields(firebaseUser.uid, {
                      englishLevel: lvl,
                    }).catch(() => {});
                  }
              }}
            />
          )}

          {activeSection === 'profile' && (
            <ProfilePage
              user={user}
              progress={currentProgress}
              isDark={isDark}
              soundEnabled={soundEnabled}
              aiVoiceUri={aiVoiceUri}
              aiSpeechRate={aiSpeechRate}
              onUpdateAiVoice={handleUpdateAiVoice}
              onToggleTheme={() => setIsDark((p) => !p)}
              onToggleSound={() => setSoundEnabled((p) => !p)}
              onOpenAuth={() => setAuthModalOpen(true)}
              onOpenPro={() => setActiveSection('pro')}
              onOpenGeoAi={() => setActiveSection('geo-ai')}
              onUpdateUser={(u) => setUser(u)}
              onLogout={handleLogout}
            />
          )}

          {activeSection === 'map' && (
            <InteractiveMapPage
              favorites={favorites}
              exploredAtlasCountries={exploredCountries}
              onRecordMapVisit={handleRecordMapVisit}
              onToggleFavorite={handleToggleFavorite}
              onOpenCountryInExplorer={handleOpenCountryInExplorer}
            />
          )}

          {activeSection === 'explorer' && (
            <CountryExplorerPage
              selectedCountry={explorerCountry}
              onSelectCountry={setExplorerCountry}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
            />
          )}

          {activeSection === 'quiz' && (
            <QuizPage
              xp={xp}
              unlockedBadges={unlockedBadges}
              onFinishQuiz={handleFinishQuiz}
            />
          )}

          {activeSection === 'academy' && (
            <AcademyPage
              completedCountries={completedCountries}
              completedTerritories={completedTerritories}
              expertCertified={expertCertified}
              onCompleteCountry={handleCompleteAcademyCountry}
              onCompleteTerritory={handleCompleteAcademyTerritory}
              onUnlockCertificate={() => setExpertCertified(true)}
              onAwardXp={(amt) => awardXp(amt, '5 Bosqichli Akademiya')}
              onAskGeoAI={handleOpenGeoAiWithPrompt}
            />
          )}

          {activeSection === 'geo-ai' && (
            <GeoAITeacherPage
              initialPrompt={geoAiPrompt}
              studentLevel={user?.geoLevel || 'O‘rta'}
              englishLevel={user?.englishLevel || 'A2'}
              geminiConfigured={services.geminiConfigured}
              aiVoiceUri={aiVoiceUri}
              aiSpeechRate={aiSpeechRate}
              onChangeSpeechRate={(rate) => handleUpdateAiVoice(aiVoiceUri, rate)}
              onOpenVoiceSettings={() => setActiveSection('profile')}
              onClearInitialPrompt={() => setGeoAiPrompt(null)}
              onAwardXp={awardXp}
            />
          )}

          {activeSection === 'dictionary' && (
            <DictionaryPage onAwardXp={(amt) => awardXp(amt, 'Geografik lug‘at')} />
          )}

          {activeSection === 'learn' && (
            <LearningModePage
              masteredIds={masteredFlashcards}
              onMasterFlashcard={handleMasterFlashcard}
            />
          )}

          {activeSection === 'admin' && (
            <AdminDashboardPage onOpenAuth={() => setAuthModalOpen(true)} />
          )}
        </main>

        <footer className="border-t border-slate-200 dark:border-slate-800 py-6 px-4 sm:px-8 text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>GeoWorld Ultra Premium — Interaktiv geografiya va ingliz tili akademiyasi</p>
          <div className="flex flex-wrap items-center gap-4">
            {NAV_ITEMS.slice(0, 6).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setActiveSection(item.id);
                }}
                className="hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>
        </footer>
      </div>

      {authModalOpen && (
        <AuthModal
          services={services}
          onClose={() => setAuthModalOpen(false)}
          onAuthenticated={(payload) => {
            applyServerProgress(payload.user, payload.progress);
            setVerificationHint(payload.verificationHint);
            setAuthModalOpen(false);
          }}
        />
      )}

      {user && !user.onboardingDone && (
        <OnboardingModal
          user={user}
          verificationHint={verificationHint}
          onComplete={(updated) => {
            setUser(updated);
            setVerificationHint(undefined);
          }}
        />
      )}

      {/* Animated Gamification Notifications (XP, Level-Up, Achievements) */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2.5 pointer-events-none">
        <AnimatePresence>
          {levelUpBanner !== null && (
            <motion.div
              key={`lvl-${levelUpBanner}`}
              initial={{ opacity: 0, y: 20, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.94 }}
              className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-xl border border-amber-300"
            >
              <Crown className="w-5 h-5 shrink-0" />
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider">
                  Yangi Daraja (Level Up)!
                </p>
                <p className="text-sm font-bold">
                  Tabriklaymiz! Siz {levelUpBanner}-darajaga ko‘tarildingiz!
                </p>
              </div>
            </motion.div>
          )}

          {badgeBanner && (
            <motion.div
              key={`badge-${badgeBanner.id}`}
              initial={{ opacity: 0, x: 24, scale: 0.94 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24 }}
              className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl bg-indigo-600 text-white shadow-xl border border-indigo-400"
            >
              <Award className="w-5 h-5 text-amber-300 shrink-0" />
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-200">
                  Yangi yutuq ochildi
                </p>
                <p className="text-xs sm:text-sm font-bold">{badgeBanner.title}</p>
              </div>
            </motion.div>
          )}

          {xpToast && (
            <motion.div
              key={xpToast.id}
              initial={{ opacity: 0, y: 14, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg border border-slate-700 dark:border-slate-200 text-xs font-bold"
            >
              <Sparkles className="w-4 h-4 text-amber-400 dark:text-amber-500 shrink-0" />
              <span className="font-mono tabular-nums text-emerald-400 dark:text-emerald-600">
                +{xpToast.amount} XP
              </span>
              <span className="max-w-44 truncate opacity-90">{xpToast.label}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
