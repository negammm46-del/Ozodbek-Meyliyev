import { useState } from 'react';
import {
  Award,
  Camera,
  CheckCircle2,
  Cloud,
  Crown,
  Flame,
  Heart,
  History,
  ImagePlus,
  Lock,
  LogOut,
  MailCheck,
  Save,
  Settings,
  Shield,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { ALL_SOVEREIGN_COUNTRIES } from '../data/sovereignStatesCatalog';
import { GEO_COUNTRIES } from '../data/geoWorldData';
import { useAuth } from '../hooks/useAuth';
import { changeUserPassword } from '../firebase/auth.js';
import { updateUserProfileFields } from '../firebase/firestore.js';
import {
  uploadEducationalMedia,
  uploadProfileAvatar,
} from '../firebase/storage.js';
import { type UserProfile, type UserProgress } from '../types/user';
import { CountryFlag } from './CountryFlag';
import { AiVoiceConfigPanel } from './AiVoiceConfigPanel';
import { soundEngine } from '../utils/sound';

const AVATARS = ['🧭', '🌍', '🏔️', '🚀', '🦉', '🦊', '🦁', '🐬', '🎓', '🗺️', '⚡', '🌟'];

interface ProfilePageProps {
  user: UserProfile | null;
  progress: UserProgress;
  isDark: boolean;
  soundEnabled: boolean;
  aiVoiceUri: string;
  aiSpeechRate: number;
  onUpdateAiVoice: (voiceUri: string, speechRate: number) => void;
  onToggleTheme: () => void;
  onToggleSound: () => void;
  onOpenAuth: () => void;
  onOpenPro: () => void;
  onOpenGeoAi: () => void;
  onOpenAdmin?: () => void;
  onUpdateUser: (user: UserProfile) => void;
  onLogout: () => void;
}

export function ProfilePage({
  user,
  progress,
  isDark,
  soundEnabled,
  aiVoiceUri,
  aiSpeechRate,
  onUpdateAiVoice,
  onToggleTheme,
  onToggleSound,
  onOpenAuth,
  onOpenPro,
  onOpenGeoAi,
  onOpenAdmin,
  onUpdateUser,
  onLogout,
}: ProfilePageProps) {
  const {
    firebaseUser,
    firestoreConnected,
    firebaseConfig,
    isAdmin,
    verifyEmail,
    formatAuthError,
  } = useAuth();

  const [username, setUsername] = useState(user?.username || '');
  const [avatar, setAvatar] = useState(user?.avatar || '🧭');
  const [countryCode, setCountryCode] = useState(user?.countryCode || 'UZ');
  const [geoLevel, setGeoLevel] = useState(user?.geoLevel || 'O‘rta');
  const [englishLevel, setEnglishLevel] = useState(user?.englishLevel || 'A2');
  const [dailyGoalMin, setDailyGoalMin] = useState(user?.dailyGoalMin || 20);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Firebase Verification & Password Security
  const [verifyHint, setVerifyHint] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Firebase Storage Uploads
  const [avatarPct, setAvatarPct] = useState<number | null>(null);
  const [mediaPct, setMediaPct] = useState<number | null>(null);
  const [mediaTitle, setMediaTitle] = useState('');
  const [uploadedGallery, setUploadedGallery] = useState<
    Array<{ title: string; url: string }>
  >([]);

  const firebaseConfigCard = (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-600 flex items-center justify-center shrink-0">
          <Cloud className="w-5 h-5" />
        </div>
        <div className="space-y-0.5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Firebase Cloud & Firestore Holati
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Loyiha: <span className="font-mono font-semibold">{firebaseConfig.projectId || 'Sozlanmagan'}</span> · Baza:{' '}
            <span className={firestoreConnected ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>
              {firestoreConnected ? 'Ulangan (Offline kesh faol)' : 'Ulanish tekshirilmoqda'}
            </span>
          </p>
        </div>
      </div>
      {isAdmin && onOpenAdmin && (
        <button
          type="button"
          onClick={onOpenAdmin}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shrink-0"
        >
          Admin Dashboard →
        </button>
      )}
    </section>
  );

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 mx-auto flex items-center justify-center">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            Shaxsiy profil va sozlamalar
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            O‘yin rekordlari, XP, kunlik seriya (streak) va yutuqlarni Firebase Firestore bulut bazasida saqlash uchun tizimga kiring. Quyida esa ilova va GeoAI ovoz sozlamalarini hoziroq moslashingiz mumkin.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onOpenAuth}
              className="px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold"
            >
              Kirish / Ro‘yxatdan o‘tish
            </button>
            <button
              type="button"
              onClick={onToggleTheme}
              className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            >
              Mavzu: {isDark ? 'Qorong‘i' : 'Yorug‘'}
            </button>
            <button
              type="button"
              onClick={onToggleSound}
              className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            >
              Tovushlar: {soundEnabled ? 'Yoqilgan' : 'O‘chirilgan'}
            </button>
          </div>
        </div>

        {firebaseConfigCard}

        <AiVoiceConfigPanel
          voiceUri={aiVoiceUri}
          speechRate={aiSpeechRate}
          onSaveConfig={onUpdateAiVoice}
          onOpenGeoAi={onOpenGeoAi}
        />
      </div>
    );
  }

  const favList = GEO_COUNTRIES.filter((c) => progress.favorites.includes(c.id));
  const isVerified = Boolean(firebaseUser?.emailVerified || user.emailVerified);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      if (firebaseUser) {
        await updateUserProfileFields(firebaseUser.uid, {
          displayName: username,
          country: countryCode,
          level: geoLevel,
          englishLevel,
          dailyGoalMin,
        });
      }

      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          displayName: username,
          avatar,
          countryCode,
          geoLevel,
          englishLevel,
          dailyGoalMin,
        }),
      });
      const data = await res.json();
      soundEngine.playSuccess();
      if (data.user) {
        onUpdateUser(data.user);
      } else if (user) {
        onUpdateUser({
          ...user,
          username,
          displayName: username,
          avatar,
          countryCode,
          geoLevel,
          englishLevel,
          dailyGoalMin,
        });
      }
      setMsg('Profil sozlamalari Firebase Firestore va server bazasida saqlandi.');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Saqlashda xatolik');
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !firebaseUser) return;
    setMsg(null);
    setAvatarPct(0);
    try {
      const { downloadUrl } = await uploadProfileAvatar(
        firebaseUser.uid,
        file,
        (pct) => setAvatarPct(pct)
      );
      soundEngine.playSuccess();
      if (user) {
        onUpdateUser({ ...user, photoURL: String(downloadUrl) });
      }
      setMsg('Profil rasmi Firebase Storage ga yuklandi!');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Rasm yuklanmadi');
    } finally {
      setAvatarPct(null);
    }
  }

  async function handleLearningMediaUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !firebaseUser) return;
    setMsg(null);
    setMediaPct(0);
    try {
      const title = mediaTitle.trim() || file.name;
      const { downloadUrl } = await uploadEducationalMedia(
        firebaseUser.uid,
        file,
        title,
        'learning',
        (pct) => setMediaPct(pct)
      );
      setUploadedGallery((prev) => [{ title, url: String(downloadUrl) }, ...prev]);
      setMediaTitle('');
      soundEngine.playSuccess();
      setMsg('O‘quv rasmi Firebase Storage ga yuklandi!');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Rasm yuklanmadi');
    } finally {
      setMediaPct(null);
    }
  }

  async function handleSendFirebaseVerification() {
    setVerifyHint(null);
    try {
      await verifyEmail();
      soundEngine.playSuccess();
      const targetEmail = firebaseUser?.email || user?.email || '';
      setVerifyHint(
        `Tasdiqlash havolasi ${targetEmail} manziliga yuborildi. Pochtangizni ochib havolani bosing.`
      );
    } catch (err) {
      setVerifyHint(formatAuthError(err));
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    try {
      if (firebaseUser) {
        await changeUserPassword(currentPassword, newPassword);
        soundEngine.playSuccess();
        setCurrentPassword('');
        setNewPassword('');
        setMsg('Parolingiz Firebase Auth orqali muvaffaqiyatli yangilandi.');
      }
    } catch (err) {
      setMsg(formatAuthError(err));
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Profile Banner */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-sky-100 to-indigo-100 dark:from-sky-950 dark:to-indigo-950 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-4xl shrink-0 overflow-hidden">
            {user.photoURL || firebaseUser?.photoURL ? (
              <img
                src={user.photoURL || firebaseUser?.photoURL || ''}
                alt={user.username}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{user.avatar}</span>
            )}
            {firebaseUser && (
              <label
                title="Firebase Storage ga rasm yuklash"
                className="absolute bottom-1 right-1 w-6 h-6 rounded-lg bg-slate-900/80 text-white flex items-center justify-center cursor-pointer hover:bg-sky-600"
              >
                <Camera className="w-3.5 h-3.5" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                {user.username}
              </h1>
              {user.isPro && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-xs font-bold">
                  <Crown className="w-3 h-3" />
                  PRO
                </span>
              )}
              <CountryFlag code={user.countryCode} name={user.countryCode} className="w-6 h-4" />
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {user.email} · {isVerified ? 'Email tasdiqlangan' : 'Email tasdiqlanmagan'} · Daraja: {user.geoLevel} · Ingliz tili: {user.englishLevel}
            </p>
            {avatarPct !== null && (
              <p className="text-xs font-mono text-sky-600 mt-1">
                Rasm yuklanmoqda: {avatarPct}%
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {!user.isPro && (
            <button
              type="button"
              onClick={onOpenPro}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold"
            >
              <Crown className="w-4 h-4" />
              <span>PRO ga o‘tish</span>
            </button>
          )}
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <LogOut className="w-4 h-4" />
            <span>Chiqish</span>
          </button>
        </div>
      </section>

      {firebaseConfigCard}

      {/* Personal Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Sparkles className="w-4 h-4 text-sky-600" />
            <span>Umumiy XP</span>
          </div>
          <p className="font-mono text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
            {user.xp}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Flame className="w-4 h-4 text-orange-500" />
            <span>Kunlik seriya (Streak)</span>
          </div>
          <p className="font-mono text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
            {user.streak} kun
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Yutilgan o‘yinlar</span>
          </div>
          <p className="font-mono text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
            {progress.gamesWon}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Award className="w-4 h-4 text-emerald-600" />
            <span>Yutuqlar (Nishonlar)</span>
          </div>
          <p className="font-mono text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
            {progress.unlockedBadges.length}
          </p>
        </div>
      </div>

      {msg && (
        <div className="p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 text-xs font-semibold text-sky-800 dark:text-sky-200">
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Profile Edit & Settings */}
        <form
          onSubmit={handleSaveProfile}
          className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4"
        >
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-sky-600" />
            <span>Profil va o‘quv sozlamalari</span>
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              Profil avatari
            </label>
            <div className="flex flex-wrap gap-2">
              {AVATARS.map((av) => (
                <button
                  key={av}
                  type="button"
                  onClick={() => setAvatar(av)}
                  className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center border ${
                    avatar === av
                      ? 'border-sky-600 bg-sky-50 dark:bg-sky-950'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Foydalanuvchi nomi
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Davlat
              </label>
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
              >
                {ALL_SOVEREIGN_COUNTRIES.map((c) => (
                  <option key={c.iso2} value={c.iso2}>
                    {c.nameUz}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Geografiya darajasi
              </label>
              <select
                value={geoLevel}
                onChange={(e) => setGeoLevel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
              >
                <option value="Boshlang‘ich">Boshlang‘ich</option>
                <option value="O‘rta">O‘rta</option>
                <option value="Yuqori">Yuqori</option>
                <option value="Olimpiada">Olimpiada</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Ingliz tili darajasi (CEFR)
              </label>
              <select
                value={englishLevel}
                onChange={(e) => setEnglishLevel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
              >
                {['A1', 'A2', 'B1', 'B2', 'C1'].map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onToggleTheme}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            >
              Mavzu: {isDark ? 'Qorong‘i' : 'Yorug‘'}
            </button>
            <button
              type="button"
              onClick={onToggleSound}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            >
              Tovushlar: {soundEnabled ? 'Yoqilgan' : 'O‘chirilgan'}
            </button>
            <select
              value={dailyGoalMin}
              onChange={(e) => setDailyGoalMin(Number(e.target.value))}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
            >
              {[10, 20, 30, 45].map((m) => (
                <option key={m} value={m}>
                  Kunlik maqsad: {m} daq
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saqlanmoqda...' : 'O‘zgarishlarni saqlash'}</span>
          </button>
        </form>

        {/* Security & Email Verification */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3">
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MailCheck className="w-5 h-5 text-emerald-600" />
              <span>Email tasdiqlash (Firebase Auth)</span>
            </h2>
            {isVerified ? (
              <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Email manzilingiz ({user.email}) tasdiqlangan.</span>
              </p>
            ) : (
              <div className="space-y-2.5">
                <p className="text-xs text-slate-500">
                  Hisobingizni to‘liq himoyalash uchun email tasdiqlash havolasini yuboring.
                </p>
                <button
                  type="button"
                  onClick={handleSendFirebaseVerification}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold"
                >
                  Tasdiqlash havolasini yuborish
                </button>
                {verifyHint && (
                  <p className="text-xs text-amber-700 dark:text-amber-300">{verifyHint}</p>
                )}
              </div>
            )}
          </div>

          <form
            onSubmit={handleChangePassword}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3"
          >
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-600" />
              <span>Hisob xavfsizligi (Parolni yangilash)</span>
            </h2>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Joriy parol"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
            />
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Yangi parol (kamida 6 belgi)"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
            >
              Parolni almashtirish
            </button>
          </form>
        </div>
      </div>

      {/* Firebase Storage Educational Media Upload */}
      {firebaseUser && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ImagePlus className="w-5 h-5 text-emerald-600" />
            <span>Mening O‘quv Rasmlarim (Firebase Storage)</span>
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={mediaTitle}
              onChange={(e) => setMediaTitle(e.target.value)}
              placeholder="Rasm mavzusi (masalan: Chimyon tog‘lari eslatmasi)"
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
            />
            <label className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer">
              <ImagePlus className="w-4 h-4" />
              <span>Rasm yuklash</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleLearningMediaUpload}
                className="hidden"
              />
            </label>
          </div>
          {mediaPct !== null && (
            <p className="text-xs font-mono text-sky-600">Yuklanmoqda: {mediaPct}%</p>
          )}
          {uploadedGallery.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {uploadedGallery.map((item, i) => (
                <div key={i} className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                  <img
                    src={item.url}
                    alt={item.title}
                    className="w-full h-28 object-cover"
                  />
                  <p className="p-2 text-[11px] font-semibold truncate">{item.title}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* AI Voice Configuration Panel */}
      <AiVoiceConfigPanel
        voiceUri={aiVoiceUri}
        speechRate={aiSpeechRate}
        onSaveConfig={onUpdateAiVoice}
        onOpenGeoAi={onOpenGeoAi}
      />

      {/* Saved Favorites & Learning History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3">
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500" />
            <span>Saqlangan sevimli davlatlar</span>
          </h2>
          {favList.length === 0 ? (
            <p className="text-xs text-slate-500">Hali sevimli davlatlar saqlanmagan.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {favList.map((c) => (
                <div
                  key={c.id}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                >
                  <CountryFlag code={c.code} name={c.name} className="w-5 h-3.5" />
                  <span>{c.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3">
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-5 h-5 text-sky-600" />
            <span>O‘quv tarixi</span>
          </h2>
          {progress.learningHistory.length === 0 ? (
            <p className="text-xs text-slate-500">
              O‘yinlar, viktorinalar va darslarni yakunlaganingiz sayin tarix bu yerda ko‘rinadi.
            </p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {progress.learningHistory.slice(0, 12).map((item, idx) => (
                <div
                  key={`${item.id}-${idx}`}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs"
                >
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{item.title}</p>
                    <p className="text-slate-500">{item.type} · {item.at.slice(0, 10)}</p>
                  </div>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    +{item.xp} XP
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
