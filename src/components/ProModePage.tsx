import { useEffect, useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  AlertTriangle,
  Award,
  Check,
  CheckCircle2,
  Crown,
  Gamepad2,
  GitCompare,
  Globe2,
  Infinity as InfinityIcon,
  Languages,
  Loader2,
  Settings,
  ShieldCheck,
  Sparkles,
  Tag,
  Trophy,
  XCircle,
} from 'lucide-react';
import {
  ALL_SOVEREIGN_COUNTRIES,
  formatCountryPopulation,
} from '../data/sovereignStatesCatalog';
import { type PromoRedeemResponse } from '../contexts/AuthContext';
import { useAuth } from '../hooks/useAuth';
import { type ServiceStatus, type UserProfile } from '../types/user';
import { type NavSection } from './HomePage';
import { CountryFlag } from './CountryFlag';
import { soundEngine } from '../utils/sound';

interface ProModePageProps {
  user: UserProfile | null;
  services: ServiceStatus;
  onOpenAuth: () => void;
  onNavigate: (sec: NavSection) => void;
  onUserUpdated?: (updated: UserProfile) => void;
}

const PRO_FEATURES = [
  'Cheklovsiz geografiya o‘yinlari va turnirlar',
  'Kengaytirilgan 3D globus missiyalari',
  '10 ta eksklyuziv PRO o‘yinlar (GeoMaster, Escape Room, Survival)',
  'Cheklovsiz insoniy GeoAI Geografiya Ustoz',
  'Shaxsiy AI Ingliz tili o‘qituvchisi (A1–C1)',
  'Individual o‘quv rejalari va chuqur tahlil',
  'Kengaytirilgan davlatlarni taqqoslash laboratoriyasi',
  'Maxsus PRO turnirlar va eksklyuziv yutuqlar',
  'Ekspert darajadagi olimpiada testlari va maxsus missiyalar',
  'Rasmiy PRO sertifikatlar va reklamasiz toza muhit',
];

export function ProModePage({
  user,
  services,
  onOpenAuth,
  onNavigate,
  onUserUpdated,
}: ProModePageProps) {
  const {
    firebaseUser,
    subscription,
    firebaseConfig,
    firestoreConnected,
    redeemPromoCode,
    refreshEntitlement,
  } = useAuth();

  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly');
  const [loading, setLoading] = useState(false);
  const [providerNotice, setProviderNotice] = useState<{
    message: string;
    requiredEnv?: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Promo Code Redemption state
  const [promoInput, setPromoInput] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoResult, setPromoResult] = useState<PromoRedeemResponse | null>(null);

  // Advanced Country Comparison Lab
  const [countryA, setCountryA] = useState('UZ');
  const [countryB, setCountryB] = useState('JP');

  // Verify backend PRO status & auto-expiration whenever PRO page opens
  useEffect(() => {
    if (!user && !firebaseUser) return;
    void refreshEntitlement().then((sub) => {
      if (sub && user && onUserUpdated) {
        const isLifetime =
          Boolean(sub.lifetimePro) ||
          sub.subscriptionType === 'lifetime' ||
          sub.subscriptionPlan === 'lifetime';
        const isActive =
          isLifetime ||
          (sub.entitlementStatus === 'pro' &&
            sub.subscriptionStatus === 'active' &&
            (!sub.subscriptionEndDate ||
              Date.now() < new Date(sub.subscriptionEndDate).getTime()));
        if (
          isActive !== user.isPro ||
          isLifetime !== Boolean(user.lifetimePro) ||
          sub.proStatus !== user.proStatus
        ) {
          onUserUpdated({
            ...user,
            isPro: isActive,
            proStatus: sub.proStatus,
            subscriptionType: sub.subscriptionType,
            proPlan: sub.subscriptionPlan,
            proExpiresAt: isLifetime ? null : sub.subscriptionEndDate,
            lifetimePro: isLifetime,
            promoCode: sub.promoCode,
          });
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUser?.uid, user?.id]);

  const isLifetimeActive = Boolean(
    subscription?.lifetimePro ||
      subscription?.subscriptionType === 'lifetime' ||
      subscription?.subscriptionPlan === 'lifetime' ||
      user?.lifetimePro ||
      user?.subscriptionType === 'lifetime' ||
      user?.proPlan === 'lifetime'
  );

  const activeEndDate =
    subscription?.subscriptionEndDate || user?.proExpiresAt || null;
  const isTimedExpired =
    !isLifetimeActive &&
    Boolean(activeEndDate && Date.now() >= new Date(activeEndDate).getTime());

  const isProActive = Boolean(
    isLifetimeActive ||
      (!isTimedExpired &&
        (subscription?.entitlementStatus === 'pro' || user?.isPro))
  );

  const isPromoExpired =
    !isProActive &&
    (subscription?.proStatus === 'expired' ||
      user?.proStatus === 'expired' ||
      isTimedExpired);

  const activeSubType = isLifetimeActive
    ? 'lifetime'
    : isProActive
      ? subscription?.subscriptionType || user?.subscriptionType || 'paid'
      : 'free';

  const activePlanName = isLifetimeActive
    ? 'lifetime'
    : isProActive
      ? subscription?.subscriptionPlan || user?.proPlan || 'monthly'
      : 'free';

  const normalizedTypedCode = promoInput.trim().toUpperCase();
  const basePlanPrice = billing === 'yearly' ? '$79.99' : '$9.99';
  const showPromoPriceDiscount =
    promoResult !== null ||
    (isProActive &&
      (activeSubType === 'promo' || activeSubType === 'lifetime'));

  const cA = useMemo(
    () =>
      ALL_SOVEREIGN_COUNTRIES.find((c) => c.iso2 === countryA) ??
      ALL_SOVEREIGN_COUNTRIES[0],
    [countryA]
  );
  const cB = useMemo(
    () =>
      ALL_SOVEREIGN_COUNTRIES.find((c) => c.iso2 === countryB) ??
      ALL_SOVEREIGN_COUNTRIES[6],
    [countryB]
  );

  async function handleRedeemPromo(e: React.FormEvent) {
    e.preventDefault();
    soundEngine.playClick();
    setPromoError(null);

    if (!user && !firebaseUser) {
      setPromoError('Promo kodni faollashtirish uchun avval hisobingizga kiring.');
      onOpenAuth();
      return;
    }

    if (!normalizedTypedCode) {
      setPromoError('Iltimos promo kodni kiriting.');
      return;
    }

    setPromoLoading(true);
    try {
      const result = await redeemPromoCode(normalizedTypedCode);
      setPromoResult(result);
      setPromoInput('');
      soundEngine.playSuccess();
      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.65 } });
      } catch {
        // ignore confetti error
      }

      if (onUserUpdated && result.user) {
        onUserUpdated(result.user as unknown as UserProfile);
      } else if (user && onUserUpdated) {
        onUserUpdated({
          ...user,
          isPro: true,
          proStatus: 'active',
          subscriptionType: result.redemption.subscriptionType,
          proPlan: result.redemption.subscriptionPlan,
          subscriptionStart: result.redemption.subscriptionStart,
          proExpiresAt: result.redemption.subscriptionEnd,
          lifetimePro: result.redemption.lifetimePro,
          promoCode: result.code,
        });
      }
    } catch (err) {
      soundEngine.playError();
      setPromoError(
        err instanceof Error ? err.message : 'Promo kodni faollashtirishda xatolik.'
      );
    } finally {
      setPromoLoading(false);
    }
  }

  async function handleUpgradeClick() {
    soundEngine.playClick();
    setError(null);
    setProviderNotice(null);

    if (!user) {
      onOpenAuth();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/pro/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: billing }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'To‘lov sessiyasini yaratib bo‘lmadi');
      }
      if (!data.configured) {
        setProviderNotice({
          message: data.message,
          requiredEnv: data.requiredEnv,
        });
        return;
      }
      if (data.checkoutUrl) {
        window.location.assign(data.checkoutUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Luxury PRO Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-amber-300/60 dark:border-amber-500/30 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white p-7 sm:p-10 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-bold tracking-wider uppercase">
              <Crown className="w-3.5 h-3.5" />
              <span>GEOWORLD PRO · EKSLYUZIV REJIM</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
              Geografiya va Ingliz tilini cheklovlarsiz o‘rganing
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              10 ta maxsus PRO o‘yinlar, 3D globus missiyalari, cheksiz GeoAI suhbatlari, shaxsiy AI Ingliz tili ustozi va global chempionatlar bir joyda.
            </p>
            <div className="flex flex-wrap gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => onNavigate('games')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold"
              >
                <Gamepad2 className="w-4 h-4" />
                <span>PRO O‘yinlarni ko‘rish</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('english-ai')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold"
              >
                <Languages className="w-4 h-4" />
                <span>AI English Teacher</span>
              </button>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 min-w-68 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-amber-300 font-semibold">Obuna boshqaruvi</p>
              {isLifetimeActive && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-bold uppercase">
                  <InfinityIcon className="w-3 h-3" />
                  <span>Umrbod</span>
                </span>
              )}
            </div>
            <p className="font-display text-2xl font-bold">
              {isLifetimeActive
                ? 'Lifetime PRO Faol'
                : isProActive
                  ? 'GEOWORLD PRO Faol'
                  : isPromoExpired
                    ? 'Promo Muddati Tugagan'
                    : 'Bepul Reja (Free)'}
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isLifetimeActive
                ? `Reja: lifetime · Turi: lifetime · Never expires (Hech qachon tugamaydi)`
                : isProActive
                  ? `Reja: ${activePlanName} · Turi: ${activeSubType} · Provayder: ${subscription?.paymentProvider || 'stripe'} · Muddati: ${activeEndDate ? activeEndDate.slice(0, 10) : '—'}`
                  : isPromoExpired
                    ? '30 kunlik bepul promo muddati tugadi. Quyidan obuna xarid qilishingiz mumkin.'
                    : 'PRO huquqlari promo kod yoki Stripe obuna tasdig‘i orqali ochiladi.'}
            </p>
          </div>
        </div>
      </section>

      {/* Promo Code Redemption Section */}
      <section className="relative overflow-hidden rounded-2xl border border-indigo-200 dark:border-indigo-800/70 bg-gradient-to-br from-white via-sky-50/60 to-indigo-50/70 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/30 p-6 sm:p-7 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <Tag className="w-4 h-4" />
              <span>Promo Kod Faollashtirish (100% Chegirma)</span>
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Maxsus GeoWorld PRO promo kodini kiriting
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Yaroqli promo kod kiritilganda to‘lov talab qilinmaydi ($0) va PRO huquqlari darhol backend hamda Firebase orqali ochiladi.
            </p>
          </div>

          <div className="flex items-center gap-4 px-4 py-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shrink-0">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Chegirma
              </p>
              <p className="font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {showPromoPriceDiscount ? '100%' : '0%'}
              </p>
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Yakuniy narx
              </p>
              <div className="flex items-baseline gap-1.5">
                {showPromoPriceDiscount && (
                  <span className="font-mono text-xs text-slate-400 line-through">
                    {basePlanPrice}
                  </span>
                )}
                <span className="font-mono text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                  {showPromoPriceDiscount ? '$0' : basePlanPrice}
                </span>
              </div>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleRedeemPromo}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={promoInput}
              onChange={(e) => {
                setPromoInput(e.target.value.toUpperCase());
                if (promoError) setPromoError(null);
              }}
              placeholder="Promo kodni kiriting (masalan: FREE100 yoki OZODBRO)"
              aria-label="Promo kod"
              disabled={promoLoading}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white placeholder:normal-case placeholder:font-sans placeholder:tracking-normal placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={promoLoading || !promoInput.trim()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white text-sm font-bold shadow-sm disabled:opacity-50 transition-all shrink-0 min-w-36"
          >
            {promoLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Tekshirilmoqda...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Qo‘llash</span>
              </>
            )}
          </button>
        </form>

        {/* Success Notification */}
        {promoResult && (
          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-base sm:text-lg font-bold text-emerald-900 dark:text-emerald-100">
                    {promoResult.headline}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-mono text-[11px] font-bold">
                    {promoResult.code}
                  </span>
                </div>
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                  {promoResult.subheadline}
                </p>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  Chegirma: <strong>{promoResult.discountPercent}%</strong> · Yakuniy narx:{' '}
                  <strong>${promoResult.finalPrice}</strong> · Holat:{' '}
                  <strong>{promoResult.redemption.proStatus}</strong>
                  {promoResult.redemption.subscriptionEnd
                    ? ` · Tugash sanasi: ${promoResult.redemption.subscriptionEnd.slice(0, 10)}`
                    : ' · Muddati: Cheksiz'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('games')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shrink-0"
            >
              PRO O‘yinlarni ochish
            </button>
          </div>
        )}

        {/* Active Lifetime / Promo Status Banner if already active from earlier session */}
        {!promoResult && isProActive && (activeSubType === 'lifetime' || activeSubType === 'promo') && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3 text-xs sm:text-sm text-emerald-800 dark:text-emerald-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              {isLifetimeActive ? (
                <span>
                  <strong>Lifetime PRO unlocked</strong> · <strong>Never expires</strong> — Barcha GeoWorld PRO funksiyalari umrbod faol ($0).
                </span>
              ) : (
                <span>
                  <strong>100% discount applied</strong> · <strong>Free PRO for 30 days</strong> — Muddati:{' '}
                  <strong className="font-mono">{activeEndDate?.slice(0, 10)}</strong>.
                </span>
              )}
            </div>
          </div>
        )}

        {/* Error Notification */}
        {promoError && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 flex items-center justify-between gap-3 text-xs sm:text-sm text-rose-700 dark:text-rose-200">
            <div className="flex items-center gap-2.5">
              <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
              <span className="font-medium">{promoError}</span>
            </div>
            {!user && !firebaseUser && (
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold shrink-0"
              >
                Kirish
              </button>
            )}
          </div>
        )}
      </section>

      {/* Billing & Plans */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
              Tarif rejalari va taqqoslash
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Oylik yoki yillik obunani tanlang yoki yuqorida promo koddan foydalaning.
            </p>
          </div>

          <div className="inline-flex p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800 self-start">
            <button
              type="button"
              onClick={() => setBilling('monthly')}
              className={`px-4 py-2 rounded-lg text-xs font-bold ${
                billing === 'monthly'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Oylik reja
            </button>
            <button
              type="button"
              onClick={() => setBilling('yearly')}
              className={`px-4 py-2 rounded-lg text-xs font-bold ${
                billing === 'yearly'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Yillik reja (33% tejamkor)
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        {providerNotice && (
          <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-amber-900 dark:text-amber-200">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>To‘lov provayderi ulanishi kutilmoqda (Stripe Configuration Required)</span>
            </div>
            <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300">
              {providerNotice.message}
            </p>
            {providerNotice.requiredEnv && (
              <p className="text-xs font-mono text-amber-900 dark:text-amber-100">
                Kerakli muhit o‘zgaruvchilari: {providerNotice.requiredEnv.join(', ')}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free Plan */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Bepul Reja
                </p>
                <h3 className="font-display text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  Free Explorer
                </h3>
                <p className="font-mono text-3xl font-bold text-slate-900 dark:text-white mt-3 tabular-nums">
                  $0 <span className="text-xs font-normal text-slate-500">/ doimiy</span>
                </p>
              </div>
              <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
                {[
                  '196 ta davlat darsi va 12 ta hudud',
                  'Asosiy xarita, bayroq, poytaxt va bilim o‘yinlari',
                  'Jonli WebSocket multiplayer xonalari',
                  'O‘zbekcha + Inglizcha lug‘at',
                  'GeoAI Ustoz standart rejimi',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-center text-xs font-semibold text-slate-600 dark:text-slate-300">
              {isProActive ? 'Asosiy reja' : 'Hozirgi faol rejangiz'}
            </div>
          </div>

          {/* PRO Plan */}
          <div className="relative bg-white dark:bg-slate-900 border-2 border-amber-500 rounded-2xl p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-md">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  GEOWORLD PRO
                </p>
                <span className="text-xs font-mono font-semibold text-slate-500">
                  {isLifetimeActive
                    ? 'Lifetime PRO'
                    : services.stripeConfigured
                      ? 'Stripe tayyor'
                      : 'Stripe sozlash kutilmoqda'}
                </span>
              </div>
              <h3 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                {isLifetimeActive ? 'Lifetime PRO Champion' : 'Pro Champion'}
              </h3>
              <p className="font-mono text-3xl font-bold text-slate-900 dark:text-white tabular-nums">
                {showPromoPriceDiscount ? (
                  <>
                    <span className="text-lg text-slate-400 line-through mr-2">
                      {basePlanPrice}
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      $0
                    </span>
                    <span className="text-xs font-normal text-emerald-600 dark:text-emerald-400 ml-2">
                      {isLifetimeActive ? '/ umrbod (100% chegirma)' : '/ 30 kun bepul'}
                    </span>
                  </>
                ) : (
                  <>
                    {basePlanPrice}{' '}
                    <span className="text-xs font-normal text-slate-500">
                      {billing === 'yearly' ? '/ yil ($6.66/oy)' : '/ oy'}
                    </span>
                  </>
                )}
              </p>

              <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                {PRO_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              disabled={loading || isProActive}
              onClick={handleUpgradeClick}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Crown className="w-4 h-4" />
              <span>
                {isLifetimeActive
                  ? 'Lifetime PRO faol (Cheksiz)'
                  : isProActive
                    ? 'PRO obuna faol'
                    : loading
                      ? 'Tekshirilmoqda...'
                      : 'PRO ga o‘tish'}
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Advanced Country Comparison Lab */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-amber-500" />
              <span>Davlatlarni Chuqur Taqqoslash Laboratoriyasi</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              196 ta mustaqil davlatdan istalgan ikkitasini barcha geografik va iqtisodiy mezonlar bo‘yicha solishtiring.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <select
            value={countryA}
            onChange={(e) => setCountryA(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold"
          >
            {ALL_SOVEREIGN_COUNTRIES.map((c) => (
              <option key={c.iso2} value={c.iso2}>
                {c.nameUz} ({c.capitalUz})
              </option>
            ))}
          </select>

          <select
            value={countryB}
            onChange={(e) => setCountryB(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold"
          >
            {ALL_SOVEREIGN_COUNTRIES.map((c) => (
              <option key={c.iso2} value={c.iso2}>
                {c.nameUz} ({c.capitalUz})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[cA, cB].map((st) => (
            <div
              key={st.iso2}
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5"
            >
              <div className="flex items-center gap-3">
                <CountryFlag code={st.iso2} name={st.nameUz} className="w-10 h-7" />
                <div>
                  <h3 className="font-display font-bold text-slate-900 dark:text-white">
                    {st.nameUz}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {st.capitalUz} · {st.continent}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500">Maydoni:</span>
                  <p className="font-mono font-bold">
                    {st.areaKm2.toLocaleString('en-US')} km²
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Aholisi:</span>
                  <p className="font-mono font-bold">
                    {formatCountryPopulation(st.populationM)}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Eng baland tog‘:</span>
                  <p className="font-semibold">{st.highestPeak}</p>
                </div>
                <div>
                  <span className="text-slate-500">Dengiz maqomi:</span>
                  <p className="font-semibold">{st.seaAccess}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500">Valyuta & Til:</span>
                  <p className="font-semibold">
                    {st.currencyUz} · {st.languagesUz}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PRO Special Missions & Perks */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            icon: Globe2,
            title: '3D Globus Missiyalari',
            desc: 'Yashirin koordinatalarni 3D Yer sharida aniqlash va kosmik navigatsiya vazifalari.',
          },
          {
            icon: Trophy,
            title: 'PRO Turnirlar',
            desc: 'Haftalik global musobaqalar, olimpiada darajasidagi savollar va eksklyuziv nishonlar.',
          },
          {
            icon: Award,
            title: 'Rasmiy Sertifikatlar',
            desc: 'Geografiya va Ingliz tili bo‘yicha shaxsiylashtirilgan tasdiqlangan sertifikatlar.',
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-2"
            >
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <Icon className="w-5 h-5" />
                <h3 className="font-display font-bold text-slate-900 dark:text-white">
                  {card.title}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                {card.desc}
              </p>
            </div>
          );
        })}
      </section>

      {/* Integrations Status & Configuration Screen */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-sky-600" />
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
            Tashqi xizmatlar va API ulanish holati
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1">
            <p className="font-bold text-slate-900 dark:text-white">Firebase Auth & Firestore</p>
            <p className={firebaseConfig.configured && firestoreConnected ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>
              {firebaseConfig.configured
                ? firestoreConnected
                  ? `Ulangan (${firebaseConfig.projectId})`
                  : `Sozlangan (${firebaseConfig.projectId})`
                : 'VITE_FIREBASE_* kiritilmagan'}
            </p>
            <p className="text-slate-500">Auth, Firestore va Cloud Functions himoyasi faol.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1">
            <p className="font-bold text-slate-900 dark:text-white">Gemini AI Ustoz</p>
            <p className={services.geminiConfigured ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>
              {services.geminiConfigured ? 'Ulangan va faol' : 'GEMINI_API_KEY kiritilmagan'}
            </p>
            {!services.geminiConfigured && (
              <p className="text-slate-500">Settings → Secrets bo‘limiga GEMINI_API_KEY qo‘shing.</p>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1">
            <p className="font-bold text-slate-900 dark:text-white">Stripe To‘lov Tizimi</p>
            <p className={services.stripeConfigured ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>
              {services.stripeConfigured ? 'Ulangan va tayyor' : 'Stripe kalitlari ulanmagan'}
            </p>
            {!services.stripeConfigured && (
              <p className="text-slate-500 font-mono">
                STRIPE_SECRET_KEY, STRIPE_PRICE_MONTHLY, STRIPE_PRICE_YEARLY
              </p>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1">
            <p className="font-bold text-slate-900 dark:text-white">Google Sign-In</p>
            <p className={services.googleAuthConfigured ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>
              {services.googleAuthConfigured ? 'Ulangan va tayyor' : 'GOOGLE_CLIENT_ID kiritilmagan'}
            </p>
            {!services.googleAuthConfigured && (
              <p className="text-slate-500">Firebase Google Provider sozlanishi kerak.</p>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3 text-xs text-slate-600 dark:text-slate-300 pt-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <p>
            GeoWorld hech qachon tasdiqlanmagan to‘lovni “muvaffaqiyatli” deb ko‘rsatmaydi. PRO huquqi va promo kodlar (FREE100 / OZODBRO) frontend orqali emas, balki faqat ishonchli backend va Cloud Functions tekshiruvi orqali beriladi.
          </p>
        </div>
      </section>
    </div>
  );
}
