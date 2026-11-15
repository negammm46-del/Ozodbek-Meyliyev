import { useEffect, useState } from 'react';
import {
  Activity,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Crown,
  Gamepad2,
  Globe2,
  ImagePlus,
  Lock,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Trophy,
  Users,
} from 'lucide-react';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import {
  OperationType,
  db,
  handleFirestoreError,
} from '../firebase/firebase.js';
import { uploadEducationalMedia } from '../firebase/storage.js';
import { soundEngine } from '../utils/sound';

interface AdminUserRow {
  id: string;
  email: string;
  username: string;
  countryCode: string;
  xp: number;
  streak: number;
  isPro: boolean;
  proPlan: string;
  proExpiresAt: string | null;
  emailVerified: boolean;
}

interface CountryLessonDoc {
  id: string;
  nameUz: string;
  capitalUz: string;
  continent: string;
  summaryUz: string;
  imageUrl: string;
}

interface QuizDoc {
  id: string;
  title: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  options: string[];
  correctIndex: number;
}

interface GameConfigDoc {
  gameId: string;
  enabled: boolean;
  featured: boolean;
  xpMultiplier: number;
}

interface ActivityDoc {
  id: string;
  uid: string;
  action: string;
  detail: string;
}

type AdminTab =
  | 'overview'
  | 'countries'
  | 'media'
  | 'quizzes'
  | 'games'
  | 'activity';

export function AdminDashboardPage({
  onOpenAuth,
}: {
  onOpenAuth: () => void;
}) {
  const { firebaseUser, isAdmin, firebaseConfig } = useAuth();
  const [tab, setTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Backend trusted overview state
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProUsers: 0,
    totalGamesPlayed: 0,
  });
  const [users, setUsers] = useState<AdminUserRow[]>([]);

  // Firestore collections
  const [countries, setCountries] = useState<CountryLessonDoc[]>([]);
  const [quizzes, setQuizzes] = useState<QuizDoc[]>([]);
  const [gameConfigs, setGameConfigs] = useState<GameConfigDoc[]>([]);
  const [activities, setActivities] = useState<ActivityDoc[]>([]);

  // Country form
  const [cId, setCId] = useState('');
  const [cName, setCName] = useState('');
  const [cCapital, setCCapital] = useState('');
  const [cContinent, setCContinent] = useState('Osiyo');
  const [cSummary, setCSummary] = useState('');
  const [cImage, setCImage] = useState('');

  // Quiz form
  const [qTitle, setQTitle] = useState('');
  const [qCategory, setQCategory] = useState('Poytaxtlar');
  const [qDifficulty, setQDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [qQuestion, setQQuestion] = useState('');
  const [qOpt0, setQOpt0] = useState('');
  const [qOpt1, setQOpt1] = useState('');
  const [qOpt2, setQOpt2] = useState('');
  const [qOpt3, setQOpt3] = useState('');
  const [qCorrect, setQCorrect] = useState(0);

  // Game config form
  const [gId, setGId] = useState('map-find-country');
  const [gEnabled, setGEnabled] = useState(true);
  const [gFeatured, setGFeatured] = useState(true);
  const [gMult, setGMult] = useState(1.0);

  // Media upload
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  async function loadAdminData() {
    setLoading(true);
    setError(null);
    try {
      const ovRes = await fetch('/api/admin/overview');
      const ovJson = await ovRes.json();
      if (ovRes.ok) {
        setStats(ovJson.stats || { totalUsers: 0, totalProUsers: 0, totalGamesPlayed: 0 });
        setUsers(ovJson.users || []);
      }

      if (db) {
        const [cSnap, qSnap, gSnap, aSnap] = await Promise.all([
          getDocs(query(collection(db, 'publicCountries'), limit(30))),
          getDocs(query(collection(db, 'quizzes'), limit(30))),
          getDocs(query(collection(db, 'gamesConfig'), limit(30))),
          getDocs(
            query(
              collection(db, 'activityLogs'),
              orderBy('createdAt', 'desc'),
              limit(25)
            )
          ).catch(() => null),
        ]);

        setCountries(
          cSnap.docs.map((d) => d.data() as CountryLessonDoc)
        );
        setQuizzes(qSnap.docs.map((d) => d.data() as QuizDoc));
        setGameConfigs(gSnap.docs.map((d) => d.data() as GameConfigDoc));
        if (aSnap) {
          setActivities(
            aSnap.docs.map((d) => ({
              id: d.id,
              ...(d.data() as Omit<ActivityDoc, 'id'>),
            }))
          );
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Admin ma’lumotlarini yuklashda xatolik.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAdmin) {
      void loadAdminData();
    }
  }, [isAdmin]);

  if (!firebaseUser) {
    return (
      <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-4">
        <Lock className="w-10 h-10 text-amber-500 mx-auto" />
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
          Admin Panel (Himoyalangan hudud)
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Platformani boshqarish uchun avval admin hisobingiz bilan tizimga kiring.
        </p>
        <button
          type="button"
          onClick={onOpenAuth}
          className="px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold"
        >
          Tizimga kirish
        </button>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900 rounded-2xl p-8 text-center space-y-3">
        <ShieldCheck className="w-10 h-10 text-rose-500 mx-auto" />
        <h1 className="font-display text-xl font-bold text-slate-900 dark:text-white">
          Ruxsat berilmadi (403)
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Ushbu bo‘lim faqat tasdiqlangan administratorlar uchun ochiq. Admin huquqlari backend va Firestore Security Rules orqali tekshiriladi.
        </p>
      </div>
    );
  }

  async function handleToggleUserPro(u: AdminUserRow) {
    setError(null);
    setNotice(null);
    try {
      const res = await fetch('/api/admin/subscription', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: u.id,
          isPro: !u.isPro,
          plan: !u.isPro ? 'yearly' : 'free',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Yangilanmadi');

      if (db) {
        const subRef = doc(db, 'subscriptions', u.id);
        await setDoc(subRef, {
          uid: u.id,
          subscriptionStatus: !u.isPro ? 'active' : 'inactive',
          subscriptionPlan: !u.isPro ? 'yearly' : 'free',
          subscriptionStartDate: new Date().toISOString(),
          subscriptionEndDate: !u.isPro
            ? new Date(Date.now() + 365 * 86_400_000).toISOString()
            : '',
          paymentProvider: !u.isPro ? 'admin_grant' : 'none',
          entitlementStatus: !u.isPro ? 'pro' : 'free',
          updatedAt: serverTimestamp(),
        }).catch(() => {});
      }

      soundEngine.playSuccess();
      setNotice(`${u.username} obunasi yangilandi.`);
      void loadAdminData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xatolik');
    }
  }

  async function handleSaveCountry(e: React.FormEvent) {
    e.preventDefault();
    if (!db) return;
    const cleanId = cId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    if (!cleanId) return;
    const path = `publicCountries/${cleanId}`;
    try {
      await setDoc(doc(db, 'publicCountries', cleanId), {
        id: cleanId,
        nameUz: cName.trim(),
        capitalUz: cCapital.trim(),
        continent: cContinent,
        summaryUz: cSummary.trim(),
        imageUrl: cImage.trim(),
        updatedAt: serverTimestamp(),
      });
      soundEngine.playSuccess();
      setNotice(`${cName} darsi Firestore ga saqlandi.`);
      setCId('');
      setCName('');
      setCCapital('');
      setCSummary('');
      setCImage('');
      void loadAdminData();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  async function handleSaveQuiz(e: React.FormEvent) {
    e.preventDefault();
    if (!db) return;
    const qId = `quiz_${Date.now()}`;
    const path = `quizzes/${qId}`;
    const options = [qOpt0, qOpt1, qOpt2, qOpt3].map((s) => s.trim()).filter(Boolean);
    if (options.length < 2) {
      setError('Kamida 2 ta javob variantini kiriting.');
      return;
    }
    try {
      await setDoc(doc(db, 'quizzes', qId), {
        id: qId,
        title: qTitle.trim(),
        category: qCategory,
        difficulty: qDifficulty,
        question: qQuestion.trim(),
        options,
        correctIndex: Math.min(qCorrect, options.length - 1),
        updatedAt: serverTimestamp(),
      });
      soundEngine.playSuccess();
      setNotice('Yangi viktorina Firestore ga qo‘shildi!');
      setQTitle('');
      setQQuestion('');
      setQOpt0('');
      setQOpt1('');
      setQOpt2('');
      setQOpt3('');
      void loadAdminData();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  async function handleSaveGameConfig(e: React.FormEvent) {
    e.preventDefault();
    if (!db) return;
    const cleanId = gId.trim().replace(/[^a-zA-Z0-9_-]/g, '-');
    const path = `gamesConfig/${cleanId}`;
    try {
      await setDoc(doc(db, 'gamesConfig', cleanId), {
        gameId: cleanId,
        enabled: gEnabled,
        featured: gFeatured,
        xpMultiplier: Number(gMult),
        updatedAt: serverTimestamp(),
      });
      soundEngine.playSuccess();
      setNotice(`${cleanId} o‘yin sozlamasi saqlandi.`);
      void loadAdminData();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  async function handleAdminMediaUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !firebaseUser) return;
    setError(null);
    setUploadPct(0);
    try {
      const res = await uploadEducationalMedia(
        firebaseUser.uid,
        file,
        uploadTitle || file.name,
        'admin-lesson',
        (pct) => setUploadPct(pct)
      );
      setUploadedUrl(res.downloadUrl);
      setCImage(res.downloadUrl);
      soundEngine.playSuccess();
      setNotice('Rasm Firebase Storage ga yuklandi va havolasi nusxalandi!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Yuklashda xatolik');
    } finally {
      setUploadPct(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-sky-600 text-white flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
              GeoWorld Admin Boshqaruv Markazi
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Loyiha: <span className="font-mono">{firebaseConfig.projectId}</span> · Tasdiqlangan admin: {firebaseUser.email}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void loadAdminData()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Yangilash</span>
        </button>
      </section>

      {notice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notice}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 text-xs font-semibold text-rose-700 dark:text-rose-200">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: 'overview', label: 'Foydalanuvchilar & Obunalar', icon: Users },
            { id: 'countries', label: 'Davlat darslari', icon: Globe2 },
            { id: 'media', label: 'Firebase Storage Rasmlar', icon: ImagePlus },
            { id: 'quizzes', label: 'Viktorinalar yaratish', icon: Trophy },
            { id: 'games', label: 'O‘yinlar boshqaruvi', icon: Gamepad2 },
            { id: 'activity', label: 'Faollik jurnali', icon: Activity },
          ] as Array<{ id: AdminTab; label: string; icon: typeof Users }>
        ).map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setTab(t.id);
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border ${
                tab === t.id
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB: OVERVIEW & SUBSCRIPTIONS */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-sky-600" />
                <span>Ro‘yxatdan o‘tgan foydalanuvchilar</span>
              </p>
              <p className="font-mono text-2xl font-bold mt-1">{stats.totalUsers}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-500" />
                <span>Faol PRO obunachilar</span>
              </p>
              <p className="font-mono text-2xl font-bold mt-1">{stats.totalProUsers}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                <span>Saqlangan o‘yin natijalari</span>
              </p>
              <p className="font-mono text-2xl font-bold mt-1">{stats.totalGamesPlayed}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 overflow-x-auto">
            <h2 className="font-display text-lg font-bold">Foydalanuvchilar va PRO boshqaruvi</h2>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                  <th className="py-2 pr-4">Foydalanuvchi</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">XP</th>
                  <th className="py-2 pr-4">PRO Holati</th>
                  <th className="py-2">Amal</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b last:border-b-0 border-slate-100 dark:border-slate-800">
                    <td className="py-2.5 pr-4 font-semibold">{u.username}</td>
                    <td className="py-2.5 pr-4 text-slate-500">{u.email}</td>
                    <td className="py-2.5 pr-4 font-mono">{u.xp} XP</td>
                    <td className="py-2.5 pr-4">
                      {u.isPro ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                          PRO ({u.proPlan})
                        </span>
                      ) : (
                        <span className="text-slate-400">Free</span>
                      )}
                    </td>
                    <td className="py-2.5">
                      <button
                        type="button"
                        onClick={() => void handleToggleUserPro(u)}
                        className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 font-semibold"
                      >
                        {u.isPro ? 'Bekor qilish' : 'PRO berish'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: COUNTRY LESSONS */}
      {tab === 'countries' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleSaveCountry}
            className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3"
          >
            <h2 className="font-display text-lg font-bold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-sky-600" />
              <span>Davlat darsi qo‘shish / yangilash</span>
            </h2>
            <input
              required
              value={cId}
              onChange={(e) => setCId(e.target.value)}
              placeholder="Kod ID (masalan: uzbekistan)"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
            />
            <input
              required
              value={cName}
              onChange={(e) => setCName(e.target.value)}
              placeholder="Davlat nomi (masalan: O‘zbekiston)"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
            />
            <input
              required
              value={cCapital}
              onChange={(e) => setCCapital(e.target.value)}
              placeholder="Poytaxti (Toshkent)"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
            />
            <select
              value={cContinent}
              onChange={(e) => setCContinent(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
            >
              {['Osiyo', 'Yevropa', 'Afrika', 'Shimoliy Amerika', 'Janubiy Amerika', 'Okeaniya'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input
              value={cImage}
              onChange={(e) => setCImage(e.target.value)}
              placeholder="Rasm URL (Storage yuklamasidan avtomatik to‘ladi)"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
            />
            <textarea
              rows={3}
              value={cSummary}
              onChange={(e) => setCSummary(e.target.value)}
              placeholder="Dars tavsifi..."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-sky-600 text-white text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Firestore ga saqlash</span>
            </button>
          </form>

          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3">
            <h2 className="font-display text-lg font-bold">
              Firestore davlat darslari ({countries.length})
            </h2>
            {countries.length === 0 ? (
              <p className="text-xs text-slate-500">Hali maxsus dars qo‘shilmagan.</p>
            ) : (
              <div className="space-y-2.5">
                {countries.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="font-bold text-sm">{c.nameUz} — {c.capitalUz}</p>
                      <p className="text-xs text-slate-500">{c.continent} · {c.id}</p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!db) return;
                        await deleteDoc(doc(db, 'publicCountries', c.id));
                        void loadAdminData();
                      }}
                      className="p-2 rounded-lg text-rose-500 hover:bg-rose-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: MEDIA STORAGE */}
      {tab === 'media' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 max-w-2xl">
          <h2 className="font-display text-lg font-bold flex items-center gap-2">
            <ImagePlus className="w-5 h-5 text-emerald-600" />
            <span>O‘quv rasmlarini Firebase Storage ga yuklash</span>
          </h2>
          <input
            value={uploadTitle}
            onChange={(e) => setUploadTitle(e.target.value)}
            placeholder="Rasm nomi (masalan: Samarqand Registon maydoni)"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
          />
          <label className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer">
            <ImagePlus className="w-4 h-4" />
            <span>Rasm tanlash (PNG/JPG, maks 5MB)</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleAdminMediaUpload}
              className="hidden"
            />
          </label>
          {uploadPct !== null && (
            <p className="text-xs font-mono font-bold text-sky-600">
              Yuklanmoqda: {uploadPct}%
            </p>
          )}
          {uploadedUrl && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 space-y-2">
              <img
                src={uploadedUrl}
                alt="Yuklangan rasm"
                className="max-h-52 rounded-xl object-cover"
              />
              <p className="text-[11px] font-mono break-all text-slate-500">
                {uploadedUrl}
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB: QUIZZES */}
      {tab === 'quizzes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleSaveQuiz}
            className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3"
          >
            <h2 className="font-display text-lg font-bold">Yangi viktorina savoli</h2>
            <input
              required
              value={qTitle}
              onChange={(e) => setQTitle(e.target.value)}
              placeholder="Viktorina sarlavhasi"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                value={qCategory}
                onChange={(e) => setQCategory(e.target.value)}
                placeholder="Kategoriya"
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
              />
              <select
                value={qDifficulty}
                onChange={(e) => setQDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
              >
                <option value="easy">Oson</option>
                <option value="medium">O‘rta</option>
                <option value="hard">Qiyin</option>
              </select>
            </div>
            <input
              required
              value={qQuestion}
              onChange={(e) => setQQuestion(e.target.value)}
              placeholder="Savol matni"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <input required value={qOpt0} onChange={(e) => setQOpt0(e.target.value)} placeholder="1-variant" className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs" />
              <input required value={qOpt1} onChange={(e) => setQOpt1(e.target.value)} placeholder="2-variant" className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs" />
              <input value={qOpt2} onChange={(e) => setQOpt2(e.target.value)} placeholder="3-variant" className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs" />
              <input value={qOpt3} onChange={(e) => setQOpt3(e.target.value)} placeholder="4-variant" className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs" />
            </div>
            <select
              value={qCorrect}
              onChange={(e) => setQCorrect(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            >
              <option value={0}>To‘g‘ri javob: 1-variant</option>
              <option value={1}>To‘g‘ri javob: 2-variant</option>
              <option value={2}>To‘g‘ri javob: 3-variant</option>
              <option value={3}>To‘g‘ri javob: 4-variant</option>
            </select>
            <button type="submit" className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold">
              Viktorinani saqlash
            </button>
          </form>

          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3">
            <h2 className="font-display text-lg font-bold">Yaratilgan viktorinalar ({quizzes.length})</h2>
            {quizzes.map((q) => (
              <div key={q.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">{q.title} · {q.category}</p>
                  <p className="text-xs text-slate-500">{q.question}</p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    if (!db) return;
                    await deleteDoc(doc(db, 'quizzes', q.id));
                    void loadAdminData();
                  }}
                  className="p-2 text-rose-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: GAMES MANAGEMENT */}
      {tab === 'games' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form
            onSubmit={handleSaveGameConfig}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3"
          >
            <h2 className="font-display text-lg font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>O‘yin sozlamalari (XP Multiplikator & Holat)</span>
            </h2>
            <input
              required
              value={gId}
              onChange={(e) => setGId(e.target.value)}
              placeholder="O‘yin ID (masalan: map-find-country)"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
            />
            <div className="flex items-center gap-4 text-xs font-semibold">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={gEnabled} onChange={(e) => setGEnabled(e.target.checked)} />
                <span>O‘yin faol</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={gFeatured} onChange={(e) => setGFeatured(e.target.checked)} />
                <span>Tanlangan (Featured)</span>
              </label>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">XP koeffitsiyenti ({gMult}x)</label>
              <input
                type="number"
                min={0.5}
                max={5}
                step={0.5}
                value={gMult}
                onChange={(e) => setGMult(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
              />
            </div>
            <button type="submit" className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold">
              Saqlash
            </button>
          </form>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-2">
            <h2 className="font-display text-lg font-bold">Sozlangan o‘yinlar ({gameConfigs.length})</h2>
            {gameConfigs.map((g) => (
              <div key={g.gameId} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs flex justify-between">
                <span className="font-mono font-bold">{g.gameId}</span>
                <span>{g.enabled ? 'Faol' : 'O‘chirilgan'} · {g.xpMultiplier}x XP</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: ACTIVITY MONITORING */}
      {tab === 'activity' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3">
          <h2 className="font-display text-lg font-bold">Platforma faolligi (Firestore Logs)</h2>
          {activities.length === 0 ? (
            <p className="text-xs text-slate-500">Hozircha faollik yozuvlari yo‘q.</p>
          ) : (
            <div className="space-y-2">
              {activities.map((a) => (
                <div key={a.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs flex justify-between gap-3">
                  <div>
                    <p className="font-bold">{a.action}</p>
                    <p className="text-slate-500">{a.detail}</p>
                  </div>
                  <span className="font-mono text-slate-400">{a.uid.slice(0, 8)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
