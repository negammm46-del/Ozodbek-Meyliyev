import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bot,
  Camera,
  CheckCircle2,
  Compass,
  ExternalLink,
  Globe2,
  Landmark,
  Languages,
  MapPin,
  Mountain,
  RefreshCw,
  Shield,
  Sparkles,
  TrendingUp,
  Volume2,
  Waves,
} from 'lucide-react';
import {
  ALL_SOVEREIGN_COUNTRIES,
  formatAreaUz,
  formatCountryPopulation,
  type FullCountryLesson,
} from '../data/sovereignStatesCatalog';
import { GEO_DICTIONARY_TERMS } from '../data/academyData';
import { CountryFlag } from './CountryFlag';
import { CountryLocatorMap } from './CountryLocatorMap';
import { soundEngine } from '../utils/sound';

interface LiveCountryData {
  code: string;
  live: boolean;
  lastUpdated: string;
  sources: string[];
  population: number | null;
  populationYear: string | null;
  areaKm2: number | null;
  flagUrl: string | null;
  openStreetMapUrl: string | null;
  images: Array<{ url: string; title: string; source: string }>;
}

interface MiniQuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface CountryLessonViewProps {
  country: FullCountryLesson;
  isCompleted: boolean;
  onBack: () => void;
  onSelectCountry: (country: FullCountryLesson) => void;
  onCompleteLesson: (iso2: string) => void;
  onAskGeoAI: (prompt: string) => void;
}

type LessonTab = 'overview' | 'nature' | 'facts' | 'vocab-quiz';

function formatExactNumber(num: number | null): string {
  if (!num || !Number.isFinite(num)) return '—';
  return num.toLocaleString('uz-UZ');
}

function speakWord(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'en-US';
  utter.rate = 0.92;
  window.speechSynthesis.speak(utter);
}

export function CountryLessonView({
  country,
  isCompleted,
  onBack,
  onSelectCountry,
  onCompleteLesson,
  onAskGeoAI,
}: CountryLessonViewProps) {
  const [activeTab, setActiveTab] = useState<LessonTab>('overview');
  const [liveData, setLiveData] = useState<LiveCountryData | null>(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  // Inline AI mini-quiz state
  const [miniQuiz, setMiniQuiz] = useState<MiniQuizQuestion[] | null>(null);
  const [miniQuizLoading, setMiniQuizLoading] = useState(false);
  const [miniQuizError, setMiniQuizError] = useState<string | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});

  const currentIdx = useMemo(
    () => ALL_SOVEREIGN_COUNTRIES.findIndex((c) => c.iso2 === country.iso2),
    [country.iso2]
  );
  const prevCountry =
    currentIdx > 0 ? ALL_SOVEREIGN_COUNTRIES[currentIdx - 1] : null;
  const nextCountry =
    currentIdx >= 0 && currentIdx < ALL_SOVEREIGN_COUNTRIES.length - 1
      ? ALL_SOVEREIGN_COUNTRIES[currentIdx + 1]
      : null;

  async function fetchLiveCountryInfo() {
    setLiveLoading(true);
    setLiveError(null);
    try {
      const res = await fetch(
        `/api/country-live/${encodeURIComponent(country.iso2)}?wiki=${encodeURIComponent(
          country.nameEn
        )}`
      );
      if (!res.ok) throw new Error('Server javob bermadi');
      const json = (await res.json()) as LiveCountryData;
      setLiveData(json);
      setBrokenImages({});
    } catch {
      setLiveError('Jonli ma’lumotlarni yuklab bo‘lmadi; akademiya bazasi ko‘rsatilmoqda.');
    } finally {
      setLiveLoading(false);
    }
  }

  useEffect(() => {
    setLiveData(null);
    setMiniQuiz(null);
    setQuizAnswers({});
    setMiniQuizError(null);
    setBrokenImages({});
    void fetchLiveCountryInfo();
  }, [country.iso2]);

  async function handleGenerateMiniQuiz() {
    soundEngine.playClick();
    setMiniQuizLoading(true);
    setMiniQuizError(null);
    setQuizAnswers({});
    try {
      const res = await fetch('/api/geo-ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'mini-quiz',
          language: 'uz',
          countryContext: `${country.nameUz} (${country.nameEn}), poytaxti: ${country.capitalUz}, qit’asi: ${country.continent}, maydoni: ${country.areaKm2} km2, eng baland tog‘i: ${country.highestPeak}, daryosi: ${country.longestRiver}, iqlimi: ${country.climateUz}, dengizga chiqishi: ${country.seaAccess}`,
          message: `${country.nameUz} darsi bo‘yicha 3 ta test tuzing`,
        }),
      });
      const json = await res.json();
      if (!res.ok || !Array.isArray(json.questions)) {
        throw new Error(json.error || 'Mini-test yaratib bo‘lmadi');
      }
      setMiniQuiz(json.questions);
    } catch (err) {
      setMiniQuizError(
        err instanceof Error ? err.message : 'Mini-test yaratishda xatolik yuz berdi.'
      );
    } finally {
      setMiniQuizLoading(false);
    }
  }

  const neighborMatches = useMemo(() => {
    return country.neighborsUz.map((rawName) => {
      const clean = rawName
        .replace(/^Dengiz chegarasi:\s*/i, '')
        .replace(/\s*\([^)]*\)/g, '')
        .trim();
      const found = ALL_SOVEREIGN_COUNTRIES.find(
        (c) => c.nameUz.toLowerCase() === clean.toLowerCase()
      );
      return { label: rawName, match: found ?? null };
    });
  }, [country.neighborsUz]);

  const effectivePopulationText =
    liveData?.population && liveData.population > 0
      ? `${formatExactNumber(liveData.population)} kishi (${liveData.populationYear ?? 'World Bank'})`
      : formatCountryPopulation(country.populationM);

  const effectiveAreaText =
    liveData?.areaKm2 && liveData.areaKm2 > 0
      ? formatAreaUz(liveData.areaKm2)
      : formatAreaUz(country.areaKm2);

  const validImages = (liveData?.images ?? []).filter((img) => !brokenImages[img.url]);

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            onBack();
          }}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>1-bosqich katalogiga qaytish</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {prevCountry && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onSelectCountry(prevCountry);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{prevCountry.nameUz}</span>
            </button>
          )}
          {nextCountry && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onSelectCountry(nextCountry);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <span>{nextCountry.nameUz}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              soundEngine.playSuccess();
              onCompleteLesson(country.iso2);
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              isCompleted
                ? 'bg-emerald-600 text-white'
                : 'bg-sky-600 hover:bg-sky-700 text-white'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isCompleted ? 'Dars tugallangan' : 'Darsni yakunlash (+50 XP)'}</span>
          </button>
        </div>
      </div>

      {/* Hero Header Card */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <CountryFlag
              code={country.iso2}
              name={country.nameUz}
              className="w-28 h-20 sm:w-36 sm:h-24 rounded-lg shadow-sm"
            />
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                1-BOSQICH · MUSTAQIL DAVLAT DARSI · {country.continent}
              </p>
              <h1 className="font-display text-2xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                {country.nameUz}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                {country.nameEn} · Poytaxt: <strong className="text-slate-800 dark:text-slate-200">{country.capitalUz}</strong> ·{' '}
                <span className="font-mono tabular-nums">{country.coordinatesLabel}</span> · ~{country.lessonDurationMin} daqiqa
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Oxirgi yangilanish: <span className="font-mono tabular-nums">{liveData?.lastUpdated ?? country.lastUpdated}</span> · Manbalar:{' '}
                {(liveData?.sources ?? country.sources).join(', ')}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={fetchLiveCountryInfo}
              disabled={liveLoading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${liveLoading ? 'animate-spin' : ''}`} />
              <span>{liveLoading ? 'Yangilanmoqda...' : 'Jonli ma’lumotni yangilash'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onAskGeoAI(
                  `${country.nameUz} (${country.nameEn}) haqida qiziqarli geografik tahlil ber va meni qisqacha savol-javob qil.`
                );
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>GeoAI Ustozdan so‘rash</span>
            </button>
          </div>
        </div>

        {liveError && (
          <p className="mt-4 text-xs text-amber-600 dark:text-amber-400">{liveError}</p>
        )}

        {/* Quick Vital Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70">
            <p className="text-xs text-slate-500 dark:text-slate-400">Hududi (km²)</p>
            <p className="mt-1 font-mono text-base sm:text-lg font-bold text-slate-900 dark:text-white tabular-nums">
              {effectiveAreaText}
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70">
            <p className="text-xs text-slate-500 dark:text-slate-400">Aholi soni</p>
            <p className="mt-1 font-mono text-base sm:text-lg font-bold text-slate-900 dark:text-white tabular-nums">
              {effectivePopulationText}
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70">
            <p className="text-xs text-slate-500 dark:text-slate-400">Pul birligi</p>
            <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
              {country.currencyUz}
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70">
            <p className="text-xs text-slate-500 dark:text-slate-400">Dengizga chiqishi</p>
            <p className="mt-1 text-sm font-bold text-sky-700 dark:text-sky-300">
              {country.seaAccess}
            </p>
          </div>
        </div>
      </section>

      {/* Section Tabs */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Dars bo‘limlari">
        {[
          { id: 'overview', label: 'Joylashuv, Rasmlar va Chegaralar', icon: Compass },
          { id: 'nature', label: 'Tabiat, Tarix va Iqtisodiyot', icon: Mountain },
          { id: 'facts', label: '10 ta Fakt + 5 ta Noyob Ma’lumot', icon: Sparkles },
          { id: 'vocab-quiz', label: 'Lug‘at va AI Mini-Test', icon: BookOpen },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                soundEngine.playClick();
                setActiveTab(tab.id as LessonTab);
              }}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                active
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW, MAP, REAL PHOTOS & BORDERS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-sky-600" />
                  <span>Interaktiv xaritada joylashuvi</span>
                </h2>
                {liveData?.openStreetMapUrl && (
                  <a
                    href={liveData.openStreetMapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                  >
                    <span>OpenStreetMap</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <CountryLocatorMap
                mode="locator"
                targetAtlasName={country.atlasName}
                lat={country.lat}
                lng={country.lng}
                highlightLabel={`${country.nameUz} · ${country.capitalUz}`}
                heightClass="h-64 sm:h-72"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {country.seaAccessDetail}
              </p>
            </div>

            <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600" />
                <span>Davlat tuzilishi va tillari</span>
              </h2>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <dt className="text-slate-500 dark:text-slate-400">Poytaxti</dt>
                  <dd className="font-semibold text-slate-900 dark:text-white text-right">
                    {country.capitalUz}
                  </dd>
                </div>
                <div className="flex justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <dt className="text-slate-500 dark:text-slate-400">Qit’asi</dt>
                  <dd className="font-semibold text-slate-900 dark:text-white text-right">
                    {country.continent}
                  </dd>
                </div>
                <div className="flex justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <dt className="text-slate-500 dark:text-slate-400">Boshqaruv shakli</dt>
                  <dd className="font-semibold text-slate-900 dark:text-white text-right">
                    {country.govFormUz}
                  </dd>
                </div>
                <div className="flex justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <dt className="text-slate-500 dark:text-slate-400">Tillar</dt>
                  <dd className="font-semibold text-slate-900 dark:text-white text-right">
                    {country.languagesUz}
                  </dd>
                </div>
                <div className="flex justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <dt className="text-slate-500 dark:text-slate-400">Chegaralar</dt>
                  <dd className="font-semibold text-slate-900 dark:text-white text-right">
                    {country.borderSummary}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500 dark:text-slate-400">Mustaqillik / Sana</dt>
                  <dd className="font-semibold text-slate-900 dark:text-white text-right">
                    {country.independenceUz}
                  </dd>
                </div>
              </dl>

              <div className="pt-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Qo‘shni va chegaradosh davlatlar
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {neighborMatches.map((item, idx) =>
                    item.match ? (
                      <button
                        key={`${item.label}-${idx}`}
                        type="button"
                        onClick={() => {
                          soundEngine.playClick();
                          onSelectCountry(item.match!);
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-xs font-semibold text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900"
                      >
                        <CountryFlag code={item.match.iso2} name={item.match.nameUz} className="w-4 h-3" />
                        <span>{item.match.nameUz}</span>
                      </button>
                    ) : (
                      <span
                        key={`${item.label}-${idx}`}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300"
                      >
                        {item.label}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Real Geographic Photos */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-sky-600" />
                <span>{country.nameUz} — Real geografik rasmlar</span>
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Manba: Wikimedia Commons
              </span>
            </div>

            {validImages.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {validImages.map((img) => (
                  <figure
                    key={img.url}
                    className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50"
                  >
                    <img
                      src={img.url}
                      alt={`${country.nameUz} — ${img.title}`}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      onError={() =>
                        setBrokenImages((prev) => ({ ...prev, [img.url]: true }))
                      }
                      className="w-full h-40 object-cover"
                    />
                    <figcaption className="p-2.5 text-xs text-slate-600 dark:text-slate-300 truncate">
                      {img.title}
                    </figcaption>
                  </figure>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {country.landmarksUz.slice(0, 3).map((spot, idx) => (
                  <div
                    key={spot}
                    className="rounded-xl p-5 border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-sky-50 via-white to-emerald-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 flex flex-col justify-between min-h-36"
                  >
                    <div className="flex items-center justify-between text-sky-600 dark:text-sky-400">
                      <Landmark className="w-5 h-5" />
                      <span className="font-mono text-xs tabular-nums">0{idx + 1}</span>
                    </div>
                    <div>
                      <p className="font-display font-bold text-slate-900 dark:text-white">
                        {spot}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {country.nameUz}ning mashhur geografik maskani
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: NATURE, CLIMATE, HISTORY, TOURISM & ECONOMY */}
      {activeTab === 'nature' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Mountain className="w-5 h-5 text-emerald-600" />
              <span>Relyef, suv havzalari va iqlim</span>
            </h2>
            <div className="space-y-3 text-sm">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Eng baland tog‘i / nuqtasi
                </p>
                <p className="font-semibold text-slate-900 dark:text-white mt-0.5">
                  {country.highestPeak}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Waves className="w-3.5 h-3.5 text-sky-600" />
                  <span>Eng uzun daryosi</span>
                </p>
                <p className="font-semibold text-slate-900 dark:text-white mt-0.5">
                  {country.longestRiver}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Iqlimi
                </p>
                <p className="text-slate-800 dark:text-slate-200 mt-0.5">{country.climateUz}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Tabiiy boyliklari
                </p>
                <p className="text-slate-800 dark:text-slate-200 mt-0.5">{country.resourcesUz}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <span>Shaharlar, Turizm va Iqtisodiyot</span>
            </h2>
            <div className="space-y-3 text-sm">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Yirik shaharlari
                </p>
                <p className="font-semibold text-slate-900 dark:text-white mt-0.5">
                  {country.majorCitiesUz.join(' · ')}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Mashhur joylari
                </p>
                <p className="font-semibold text-slate-900 dark:text-white mt-0.5">
                  {country.landmarksUz.join(' · ')}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Turizm salohiyati
                </p>
                <p className="text-slate-800 dark:text-slate-200 mt-0.5">{country.tourismUz}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Iqtisodiyoti haqida
                </p>
                <p className="text-slate-800 dark:text-slate-200 mt-0.5">{country.economyUz}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: 10 GEO FACTS + 5 SURPRISING FACTS + CHARACTERISTICS + DIFFERENCES */}
      {activeTab === 'facts' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3">
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Globe2 className="w-5 h-5 text-sky-600" />
                <span>Geografik xususiyatlari</span>
              </h2>
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {country.geoCharacteristics}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3">
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <span>Boshqa davlatlardan farqli jihatlari</span>
              </h2>
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {country.uniqueDifferences}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                10 ta qiziqarli geografik fakt
              </h2>
              <ol className="space-y-2.5">
                {country.tenGeoFacts.map((fact, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-sm text-slate-700 dark:text-slate-200"
                  >
                    <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400 mt-0.5 tabular-nums shrink-0">
                      {String(idx + 1).padStart(2, '0')}.
                    </span>
                    <span>{fact}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                5 ta noodatiy va hayratlanarli ma’lumot
              </h2>
              <ul className="space-y-3">
                {country.fiveSurprisingFacts.map((fact, idx) => (
                  <li
                    key={idx}
                    className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50 text-sm text-slate-800 dark:text-amber-100"
                  >
                    <span className="font-bold text-amber-700 dark:text-amber-400 mr-1.5">
                      #{idx + 1}
                    </span>
                    {fact}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BILINGUAL VOCABULARY + LIVE AI MINI-QUIZ */}
      {activeTab === 'vocab-quiz' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Languages className="w-5 h-5 text-sky-600" />
              <span>Darsga oid O‘zbekcha + Inglizcha lug‘at</span>
            </h2>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {GEO_DICTIONARY_TERMS.slice(0, 12).map((term) => (
                <div
                  key={term.id}
                  className="py-2.5 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {term.en}{' '}
                      <span className="font-mono text-xs font-normal text-slate-400">
                        {term.pronunciation}
                      </span>
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {term.uz} — {term.exampleEn}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => speakWord(term.en)}
                    aria-label={`${term.en} talaffuzini tinglash`}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Bot className="w-5 h-5 text-indigo-600" />
                <span>{country.nameUz} bo‘yicha AI Mini-Test</span>
              </h2>
              <button
                type="button"
                onClick={handleGenerateMiniQuiz}
                disabled={miniQuizLoading}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-60"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{miniQuizLoading ? 'Tuzilmoqda...' : 'Mini-test tuzish'}</span>
              </button>
            </div>

            {miniQuizError && (
              <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl">
                {miniQuizError}
              </p>
            )}

            {!miniQuiz && !miniQuizLoading && (
              <div className="p-6 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Darsni mustahkamlash uchun GeoAI Ustozdan {country.nameUz} haqida 3 ta shaxsiy savol tuzib berishini so‘rang.
                </p>
              </div>
            )}

            {miniQuiz && (
              <div className="space-y-4">
                {miniQuiz.map((q, qIdx) => {
                  const chosen = quizAnswers[qIdx];
                  const answered = typeof chosen === 'number';
                  return (
                    <div
                      key={qIdx}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5"
                    >
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {qIdx + 1}. {q.question}
                      </p>
                      <div className="grid grid-cols-1 gap-1.5">
                        {q.options.map((opt, optIdx) => {
                          const isCorrect = optIdx === q.correctIndex;
                          const isSelected = chosen === optIdx;
                          let cls =
                            'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-sky-400';
                          if (answered) {
                            if (isCorrect)
                              cls =
                                'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-200';
                            else if (isSelected)
                              cls =
                                'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-800 dark:text-rose-200';
                          }
                          return (
                            <button
                              key={optIdx}
                              type="button"
                              disabled={answered}
                              onClick={() => {
                                setQuizAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
                                if (optIdx === q.correctIndex) soundEngine.playSuccess();
                                else soundEngine.playError();
                              }}
                              className={`text-left px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${cls}`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                      {answered && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 pt-1">
                          <strong>Izoh:</strong> {q.explanation}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
