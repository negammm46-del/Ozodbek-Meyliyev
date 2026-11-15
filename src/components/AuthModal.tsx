import { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Globe2,
  Lock,
  Mail,
  Settings,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';
import { ALL_SOVEREIGN_COUNTRIES } from '../data/sovereignStatesCatalog';
import { useAuth } from '../hooks/useAuth';
import { type ServiceStatus, type UserProfile, type UserProgress } from '../types/user';
import { soundEngine } from '../utils/sound';

type AuthMode = 'login' | 'register' | 'forgot';

interface AuthModalProps {
  initialMode?: AuthMode;
  services: ServiceStatus;
  pendingEmail?: string;
  onClose: () => void;
  onAuthenticated: (payload: {
    user: UserProfile;
    progress: UserProgress;
    isNewRegistration?: boolean;
    verificationHint?: string;
  }) => void;
}

export function AuthModal({
  initialMode = 'login',
  pendingEmail = '',
  onClose,
  onAuthenticated,
}: AuthModalProps) {
  const {
    firebaseConfig,
    signInGoogle,
    registerEmail,
    loginEmail,
    sendReset,
    formatAuthError,
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState(pendingEmail);
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [countryCode, setCountryCode] = useState('UZ');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  function emitAuthenticated(
    backendPayload: Record<string, unknown> | null,
    fallback: { uid: string; email: string; name: string; country: string },
    isNew?: boolean
  ) {
    const fallbackUser: UserProfile = {
      id: fallback.uid,
      email: fallback.email,
      authProvider: 'firebase',
      username: fallback.name,
      displayName: fallback.name,
      avatar: '🧭',
      countryCode: fallback.country,
      geoLevel: 'O‘rta',
      learningFocus: 'Ikkalasi',
      englishLevel: 'A2',
      dailyGoalMin: 20,
      favoriteContinent: 'Osiyo',
      onboardingDone: !isNew,
      emailVerified: false,
      isPro: false,
      proPlan: 'free',
      proExpiresAt: null,
      xp: 60,
      coins: 20,
      streak: 1,
      lastActiveDate: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
    };
    const fallbackProgress: UserProgress = {
      favorites: ['uzbekistan', 'japan'],
      completedCountries: [],
      completedTerritories: [],
      unlockedBadges: [],
      masteredFlashcards: [],
      exploredCountries: ['Uzbekistan'],
      quizzesCompleted: 0,
      gamesWon: 0,
      highScores: {},
      learningHistory: [],
      dailyCompleted: false,
      expertCertified: false,
    };

    const user = (backendPayload?.user as UserProfile) || fallbackUser;
    const progress = (backendPayload?.progress as UserProgress) || fallbackProgress;
    onAuthenticated({
      user,
      progress,
      isNewRegistration: isNew,
    });
  }

  async function handleGoogleSignIn() {
    soundEngine.playClick();
    setLoading(true);
    setError(null);
    setInfoMsg(null);
    try {
      const res = await signInGoogle();
      soundEngine.playSuccess();
      emitAuthenticated(
        res.backendPayload,
        {
          uid: res.firebaseUser.uid,
          email: res.firebaseUser.email || '',
          name: res.firebaseUser.displayName || 'GeoWorld Explorer',
          country: 'UZ',
        },
        res.isNew
      );
    } catch (err) {
      soundEngine.playError();
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfoMsg(null);
    try {
      const res = await loginEmail({ email, password });
      soundEngine.playSuccess();
      emitAuthenticated(res.backendPayload, {
        uid: res.firebaseUser.uid,
        email: res.firebaseUser.email || email,
        name: res.firebaseUser.displayName || email.split('@')[0],
        country: 'UZ',
      });
    } catch (err) {
      soundEngine.playError();
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfoMsg(null);
    try {
      const res = await registerEmail({ email, password, username, countryCode });
      soundEngine.playSuccess();
      emitAuthenticated(
        res.backendPayload,
        {
          uid: res.firebaseUser.uid,
          email: res.firebaseUser.email || email,
          name: username.trim() || email.split('@')[0],
          country: countryCode,
        },
        true
      );
    } catch (err) {
      soundEngine.playError();
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfoMsg(null);
    try {
      await sendReset(email);
      soundEngine.playSuccess();
      setInfoMsg(
        `Parolni tiklash havolasi ${email} manziliga yuborildi. Pochtangizni tekshiring.`
      );
    } catch (err) {
      soundEngine.playError();
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl max-h-[92vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          aria-label="Yopish"
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-600 to-indigo-600 flex items-center justify-center text-white">
            <Globe2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
              GeoWorld · Firebase Hisob
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ma’lumotlar Firebase Auth va Firestore bulut bazasida saqlanadi
            </p>
          </div>
        </div>

        {!firebaseConfig.configured && (
          <div className="mb-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
            <p className="font-bold flex items-center gap-1.5">
              <Settings className="w-4 h-4" />
              <span>Firebase konfiguratsiyasi topilmadi</span>
            </p>
            <p>
              <code className="font-mono">.env</code> fayliga{' '}
              <code className="font-mono">VITE_FIREBASE_API_KEY</code>,{' '}
              <code className="font-mono">VITE_FIREBASE_AUTH_DOMAIN</code>,{' '}
              <code className="font-mono">VITE_FIREBASE_PROJECT_ID</code> va{' '}
              <code className="font-mono">VITE_FIREBASE_APP_ID</code> kiriting.
            </p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 mb-5">
          {(
            [
              { id: 'login', label: 'Kirish' },
              { id: 'register', label: 'Ro‘yxatdan o‘tish' },
              { id: 'forgot', label: 'Parolni tiklash' },
            ] as Array<{ id: AuthMode; label: string }>
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setMode(t.id);
                setError(null);
                setInfoMsg(null);
              }}
              className={`py-2 px-2 rounded-lg text-xs font-semibold transition-colors ${
                mode === t.id
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {infoMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{infoMsg}</span>
          </div>
        )}

        {(mode === 'login' || mode === 'register') && (
          <div className="mb-4 space-y-2">
            <button
              type="button"
              disabled={loading || !firebaseConfig.configured}
              onClick={handleGoogleSignIn}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-sm font-semibold text-slate-800 dark:text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4 text-sky-600" />
              <span>Google orqali kirish (Firebase Auth)</span>
            </button>
          </div>
        )}

        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sizning@email.uz"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Parol
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !firebaseConfig.configured}
              className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold disabled:opacity-50"
            >
              {loading ? 'Kirilmoqda...' : 'Email orqali kirish'}
            </button>
          </form>
        )}

        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Foydalanuvchi nomi (Username)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Azizbek_Geo"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sizning@email.uz"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Parol (kamida 6 belgi)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Kamida 6 ta belgi"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Davlatingiz
              </label>
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
              >
                {ALL_SOVEREIGN_COUNTRIES.map((c) => (
                  <option key={c.iso2} value={c.iso2}>
                    {c.nameUz}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading || !firebaseConfig.configured}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-50"
            >
              {loading ? 'Yaratilmoqda...' : 'Ro‘yxatdan o‘tish va boshlash'}
            </button>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleRequestReset} className="space-y-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Firebase Authentication orqali pochtangizga parolni tiklash havolasi yuboriladi.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Ro‘yxatdan o‘tgan email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sizning@email.uz"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !firebaseConfig.configured}
              className="w-full py-2.5 rounded-xl bg-sky-600 text-white text-xs font-semibold disabled:opacity-50"
            >
              {loading ? 'Yuborilmoqda...' : 'Tiklash havolasini yuborish'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
