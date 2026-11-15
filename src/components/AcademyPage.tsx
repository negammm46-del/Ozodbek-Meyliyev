import { useMemo, useState } from 'react';
import {
  Award,
  CheckCircle2,
  Compass,
  Flag,
  GitCompare,
  Globe2,
  GraduationCap,
  MapPin,
  Printer,
  Search,
  Sparkles,
  Trophy,
  Waves,
  XCircle,
} from 'lucide-react';
import {
  ALL_SOVEREIGN_COUNTRIES,
  formatAreaUz,
  formatCountryPopulation,
  type FullCountryLesson,
  type SeaAccessType,
} from '../data/sovereignStatesCatalog';
import {
  DEPENDENT_TERRITORIES,
  GEOGRAPHY_RECORDS,
  MAP_PIN_TASKS,
  OLYMPIAD_EXAM_QUESTIONS,
  type DependentTerritory,
} from '../data/academyData';
import { CountryFlag } from './CountryFlag';
import { CountryLessonView } from './CountryLessonView';
import { TerritoryLessonView } from './TerritoryLessonView';
import { CountryLocatorMap } from './CountryLocatorMap';
import { soundEngine } from '../utils/sound';

export type AcademyStage = 1 | 2 | 3 | 4 | 5;

interface AcademyPageProps {
  completedCountries: string[];
  completedTerritories: string[];
  expertCertified: boolean;
  onCompleteCountry: (iso2: string) => void;
  onCompleteTerritory: (id: string) => void;
  onUnlockCertificate: (studentName: string) => void;
  onAwardXp: (amount: number) => void;
  onAskGeoAI: (prompt: string) => void;
}

type SortKey = 'name' | 'area' | 'population';
type Stage3SubTab = 'map-find' | 'capitals-flags' | 'sea-access' | 'compare';
type Stage5SubTab = 'olympiad' | 'map-pin' | 'certificate';

const STAGES: Array<{ id: AcademyStage; title: string; subtitle: string }> = [
  { id: 1, title: '1-bosqich: Mustaqil davlatlar', subtitle: `${ALL_SOVEREIGN_COUNTRIES.length} ta davlat` },
  { id: 2, title: '2-bosqich: Mustaqil bo‘lmagan hududlar', subtitle: `${DEPENDENT_TERRITORIES.length} ta hudud` },
  { id: 3, title: '3-bosqich: Davlatlar geografiyasi', subtitle: 'Taqqoslash va mashqlar' },
  { id: 4, title: '4-bosqich: Geografik rekordlar', subtitle: '10 ta toifa' },
  { id: 5, title: '5-bosqich: Professional Geograf', subtitle: 'Imtihon va Sertifikat' },
];

export function AcademyPage({
  completedCountries,
  completedTerritories,
  expertCertified,
  onCompleteCountry,
  onCompleteTerritory,
  onUnlockCertificate,
  onAwardXp,
  onAskGeoAI,
}: AcademyPageProps) {
  const [stage, setStage] = useState<AcademyStage>(1);

  // Stage 1 filters & active lesson
  const [selectedCountry, setSelectedCountry] = useState<FullCountryLesson | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [continentFilter, setContinentFilter] = useState<string>('Barchasi');
  const [seaFilter, setSeaFilter] = useState<string>('Barchasi');
  const [sortBy, setSortBy] = useState<SortKey>('name');

  // Stage 2 active territory
  const [selectedTerritory, setSelectedTerritory] = useState<DependentTerritory | null>(null);
  const [territorySearch, setTerritorySearch] = useState('');

  // Stage 3 state
  const [stage3Tab, setStage3Tab] = useState<Stage3SubTab>('compare');
  const [compareA, setCompareA] = useState<string>('UZ');
  const [compareB, setCompareB] = useState<string>('JP');
  const [drillIdx, setDrillIdx] = useState(0);
  const [drillFeedback, setDrillFeedback] = useState<string | null>(null);
  const [mapFindIdx, setMapFindIdx] = useState(0);
  const [mapFindFeedback, setMapFindFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [seaTabFilter, setSeaTabFilter] = useState<SeaAccessType>('Ikki marta dengizga chiqmaydi');

  // Stage 4 state
  const [recordCatId, setRecordCatId] = useState(GEOGRAPHY_RECORDS[0].id);

  // Stage 5 state
  const [stage5Tab, setStage5Tab] = useState<Stage5SubTab>('olympiad');
  const [examIdx, setExamIdx] = useState(0);
  const [examAnswers, setExamAnswers] = useState<Record<number, number>>({});
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [pinTaskIdx, setPinTaskIdx] = useState(0);
  const [pinScore, setPinScore] = useState(0);
  const [pinMessage, setPinMessage] = useState<string | null>(null);
  const [studentName, setStudentName] = useState<string>(() => {
    if (typeof window === 'undefined') return 'GeoWorld Talabasi';
    return localStorage.getItem('geoworld_student_name') || 'GeoWorld Talabasi';
  });

  const filteredCountries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = ALL_SOVEREIGN_COUNTRIES.filter((c) => {
      const matchCont = continentFilter === 'Barchasi' || c.continent === continentFilter;
      const matchSea = seaFilter === 'Barchasi' || c.seaAccess === seaFilter;
      const matchQ =
        !q ||
        c.nameUz.toLowerCase().includes(q) ||
        c.nameEn.toLowerCase().includes(q) ||
        c.capitalUz.toLowerCase().includes(q);
      return matchCont && matchSea && matchQ;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'area') return b.areaKm2 - a.areaKm2;
      if (sortBy === 'population') return b.populationM - a.populationM;
      return a.nameUz.localeCompare(b.nameUz, 'uz');
    });
  }, [searchQuery, continentFilter, seaFilter, sortBy]);

  const filteredTerritories = useMemo(() => {
    const q = territorySearch.trim().toLowerCase();
    return DEPENDENT_TERRITORIES.filter(
      (t) =>
        !q ||
        t.nameUz.toLowerCase().includes(q) ||
        t.nameEn.toLowerCase().includes(q) ||
        t.administeringStateUz.toLowerCase().includes(q)
    );
  }, [territorySearch]);

  const totalMasteredPct = Math.round(
    ((completedCountries.length + completedTerritories.length) /
      (ALL_SOVEREIGN_COUNTRIES.length + DEPENDENT_TERRITORIES.length)) *
      100
  );

  // Stage 3 helpers
  const countryA = useMemo(
    () => ALL_SOVEREIGN_COUNTRIES.find((c) => c.iso2 === compareA) ?? ALL_SOVEREIGN_COUNTRIES[0],
    [compareA]
  );
  const countryB = useMemo(
    () => ALL_SOVEREIGN_COUNTRIES.find((c) => c.iso2 === compareB) ?? ALL_SOVEREIGN_COUNTRIES[6],
    [compareB]
  );

  const stage3MapTargets = useMemo(
    () =>
      ALL_SOVEREIGN_COUNTRIES.filter((c) =>
        ['UZ', 'KZ', 'TR', 'JP', 'FR', 'BR', 'EG', 'AU', 'CA', 'IN', 'DE', 'IT'].includes(c.iso2)
      ),
    []
  );
  const currentMapTarget = stage3MapTargets[mapFindIdx % stage3MapTargets.length];

  const capitalDrillOptions = useMemo(() => {
    const target = ALL_SOVEREIGN_COUNTRIES[(drillIdx * 7) % ALL_SOVEREIGN_COUNTRIES.length];
    const distractors = [1, 3, 5].map(
      (offset) =>
        ALL_SOVEREIGN_COUNTRIES[(drillIdx * 7 + offset) % ALL_SOVEREIGN_COUNTRIES.length]
          .capitalUz
    );
    const opts = [target.capitalUz, ...distractors];
    const rot = drillIdx % 4;
    return { target, options: [...opts.slice(rot), ...opts.slice(0, rot)] };
  }, [drillIdx]);

  // Stage 5 Exam score
  const examScore = useMemo(() => {
    return OLYMPIAD_EXAM_QUESTIONS.reduce((acc, q, idx) => {
      return acc + (examAnswers[idx] === q.correctIndex ? 1 : 0);
    }, 0);
  }, [examAnswers]);

  const activeRecordCategory =
    GEOGRAPHY_RECORDS.find((r) => r.id === recordCatId) ?? GEOGRAPHY_RECORDS[0];

  // If viewing a specific Stage 1 country lesson:
  if (stage === 1 && selectedCountry) {
    return (
      <CountryLessonView
        country={selectedCountry}
        isCompleted={completedCountries.includes(selectedCountry.iso2)}
        onBack={() => setSelectedCountry(null)}
        onSelectCountry={(next) => setSelectedCountry(next)}
        onCompleteLesson={onCompleteCountry}
        onAskGeoAI={onAskGeoAI}
      />
    );
  }

  // If viewing a specific Stage 2 territory lesson:
  if (stage === 2 && selectedTerritory) {
    return (
      <TerritoryLessonView
        territory={selectedTerritory}
        isCompleted={completedTerritories.includes(selectedTerritory.id)}
        onBack={() => setSelectedTerritory(null)}
        onComplete={onCompleteTerritory}
        onAskGeoAI={onAskGeoAI}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Academy Banner */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
              GEOWORLD · 5 BOSQICHLI GEOGRAFIYA AKADEMIYASI
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
              Davlatlarni o‘rganish akademiyasi
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              196 ta mustaqil davlat darslari, qaram hududlar, qiyosiy tahlil, jahon rekordlari va Professional Geograf sertifikati.
            </p>
          </div>

          <div className="min-w-60 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              <span>Umumiy o‘zlashtirish</span>
              <span className="font-mono tabular-nums text-sky-600 dark:text-sky-400">
                {totalMasteredPct}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all"
                style={{ width: `${Math.max(2, totalMasteredPct)}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-mono tabular-nums">
              {completedCountries.length}/{ALL_SOVEREIGN_COUNTRIES.length} davlat ·{' '}
              {completedTerritories.length}/{DEPENDENT_TERRITORIES.length} hudud
            </p>
          </div>
        </div>

        {/* 5-Stage Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 mt-6">
          {STAGES.map((st) => {
            const active = stage === st.id;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setStage(st.id);
                  setSelectedCountry(null);
                  setSelectedTerritory(null);
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  active
                    ? 'bg-sky-600 border-sky-600 text-white shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-sky-400'
                }`}
              >
                <p className="text-xs font-bold leading-snug">{st.title}</p>
                <p
                  className={`text-[11px] mt-1 ${
                    active ? 'text-sky-100' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {st.subtitle}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* ================= STAGE 1: SOVEREIGN COUNTRIES ================= */}
      {stage === 1 && (
        <div className="space-y-5">
          {/* Search, Filters & Sort */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-5 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Davlat yoki poytaxt nomini qidiring..."
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-sky-600"
                />
              </div>

              <div className="md:col-span-3">
                <select
                  value={seaFilter}
                  onChange={(e) => setSeaFilter(e.target.value)}
                  aria-label="Dengizga chiqish filtri"
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
                >
                  <option value="Barchasi">Barcha dengiz holatlari</option>
                  <option value="Okeanga chiqadi">Okeanga chiqadi</option>
                  <option value="Dengizga chiqadi">Dengizga chiqadi</option>
                  <option value="Dengizga chiqmaydi">Dengizga chiqmaydi</option>
                  <option value="Ikki marta dengizga chiqmaydi">Ikki marta dengizga chiqmaydi</option>
                  <option value="Orol davlati">Orol davlati</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortKey)}
                  aria-label="Saralash"
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
                >
                  <option value="name">Nomi (A–Z)</option>
                  <option value="area">Maydoni (katta)</option>
                  <option value="population">Aholisi (ko‘p)</option>
                </select>
              </div>

              <div className="md:col-span-2 flex items-center justify-end text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
                {filteredCountries.length} ta dars
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[
                'Barchasi',
                'Osiyo',
                'Yevropa',
                'Afrika',
                'Shimoliy Amerika',
                'Janubiy Amerika',
                'Okeaniya',
              ].map((cont) => (
                <button
                  key={cont}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setContinentFilter(cont);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    continentFilter === cont
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cont}
                </button>
              ))}
            </div>
          </div>

          {/* Country Lessons Grid */}
          {filteredCountries.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center text-sm text-slate-500 dark:text-slate-400">
              Tanlangan filtr bo‘yicha davlat topilmadi. Qidiruv yoki filtrlarni tozalab ko‘ring.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCountries.map((country) => {
                const done = completedCountries.includes(country.iso2);
                return (
                  <button
                    key={country.iso2}
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setSelectedCountry(country);
                    }}
                    className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-500 dark:hover:border-sky-500 rounded-2xl p-5 text-left transition-all shadow-2xs flex flex-col justify-between gap-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <CountryFlag
                          code={country.iso2}
                          name={country.nameUz}
                          className="w-12 h-8 shrink-0"
                        />
                        <div className="min-w-0">
                          <h2 className="font-display font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 truncate">
                            {country.nameUz}
                          </h2>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {country.capitalUz} · {country.continent}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-[11px] font-semibold shrink-0 ${
                          done
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {done ? 'Tugallangan' : `~${country.lessonDurationMin} daq`}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <div>
                        <span className="text-slate-400 block">Maydoni</span>
                        <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                          {formatAreaUz(country.areaKm2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Aholisi</span>
                        <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                          {formatCountryPopulation(country.populationM)}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= STAGE 2: DEPENDENT TERRITORIES ================= */}
      {stage === 2 && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={territorySearch}
                onChange={(e) => setTerritorySearch(e.target.value)}
                placeholder="Hudud yoki boshqaruvchi davlatni qidiring..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-sky-600"
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Barcha maqomlar neytral va xalqaro huquqiy holatga muvofiq keltirilgan.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTerritories.map((territory) => {
              const done = completedTerritories.includes(territory.id);
              return (
                <button
                  key={territory.id}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setSelectedTerritory(territory);
                  }}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500 rounded-2xl p-5 text-left transition-all flex flex-col justify-between gap-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <CountryFlag
                        code={territory.iso2}
                        name={territory.nameUz}
                        className="w-12 h-8 shrink-0"
                      />
                      <div className="min-w-0">
                        <h2 className="font-display font-bold text-slate-900 dark:text-white truncate">
                          {territory.nameUz}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {territory.administeringStateUz}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-[11px] font-semibold shrink-0 ${
                        done ? 'text-emerald-600' : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {done ? 'Tugallangan' : 'Jarayonda'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                    {territory.politicalStatusUz}
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-mono tabular-nums text-slate-600 dark:text-slate-400">
                    <span>{formatAreaUz(territory.areaKm2)}</span>
                    <span>{territory.populationUz}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= STAGE 3: COUNTRIES GEOGRAPHY LAB ================= */}
      {stage === 3 && (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'compare', label: 'Maydon va aholini taqqoslash', icon: GitCompare },
              { id: 'map-find', label: 'Xaritadan davlat topish', icon: MapPin },
              { id: 'capitals-flags', label: 'Poytaxt va bayroq mashqi', icon: Flag },
              { id: 'sea-access', label: 'Dengizga chiqish imkoniyati', icon: Waves },
            ].map((t) => {
              const Icon = t.icon;
              const active = stage3Tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setStage3Tab(t.id as Stage3SubTab);
                  }}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    active
                      ? 'bg-sky-600 text-white'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {stage3Tab === 'compare' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                    1-davlatni tanlang
                  </label>
                  <select
                    value={compareA}
                    onChange={(e) => setCompareA(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white"
                  >
                    {ALL_SOVEREIGN_COUNTRIES.map((c) => (
                      <option key={c.iso2} value={c.iso2}>
                        {c.nameUz} ({c.continent})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                    2-davlatni tanlang
                  </label>
                  <select
                    value={compareB}
                    onChange={(e) => setCompareB(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white"
                  >
                    {ALL_SOVEREIGN_COUNTRIES.map((c) => (
                      <option key={c.iso2} value={c.iso2}>
                        {c.nameUz} ({c.continent})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[countryA, countryB].map((c) => (
                  <div
                    key={c.iso2}
                    className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <CountryFlag code={c.iso2} name={c.nameUz} className="w-12 h-8" />
                      <div>
                        <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                          {c.nameUz}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {c.capitalUz} · {c.continent}
                        </p>
                      </div>
                    </div>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-slate-500">Hududi</dt>
                        <dd className="font-mono font-bold tabular-nums">{formatAreaUz(c.areaKm2)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-slate-500">Aholisi</dt>
                        <dd className="font-mono font-bold tabular-nums">{formatCountryPopulation(c.populationM)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-slate-500">Dengizga chiqishi</dt>
                        <dd className="font-semibold text-sky-600 dark:text-sky-400">{c.seaAccess}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-slate-500">Eng baland cho‘qqi</dt>
                        <dd className="font-semibold text-right">{c.highestPeak}</dd>
                      </div>
                    </dl>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-sm text-slate-800 dark:text-slate-200 flex flex-wrap items-center justify-between gap-3">
                <span>
                  <strong>Taqqoslash xulosasi:</strong>{' '}
                  {countryA.areaKm2 >= countryB.areaKm2
                    ? `${countryA.nameUz} hududi ${countryB.nameUz}dan ${(countryA.areaKm2 / Math.max(0.1, countryB.areaKm2)).toFixed(1)} barobar katta.`
                    : `${countryB.nameUz} hududi ${countryA.nameUz}dan ${(countryB.areaKm2 / Math.max(0.1, countryA.areaKm2)).toFixed(1)} barobar katta.`}{' '}
                  Aholi bo‘yicha{' '}
                  {countryA.populationM >= countryB.populationM ? countryA.nameUz : countryB.nameUz}{' '}
                  ko‘proq.
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onAskGeoAI(
                      `${countryA.nameUz} va ${countryB.nameUz} davlatlarini geografik joylashuvi, iqlimi va iqtisodiyoti bo‘yicha chuqur taqqoslab ber.`
                    )
                  }
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
                >
                  AI bilan chuqur tahlil
                </button>
              </div>
            </div>
          )}

          {stage3Tab === 'map-find' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-sky-600">
                    Xaritadan topish mashqi
                  </p>
                  <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mt-1">
                    <CountryFlag code={currentMapTarget.iso2} name={currentMapTarget.nameUz} className="w-8 h-5" />
                    <span>Toping: {currentMapTarget.nameUz} ({currentMapTarget.continent})</span>
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setMapFindIdx((i) => i + 1);
                    setMapFindFeedback(null);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold"
                >
                  Keyingi davlat
                </button>
              </div>

              <CountryLocatorMap
                mode="challenge"
                heightClass="h-80 sm:h-96"
                onSelectCountry={(atlasName) => {
                  if (atlasName.toLowerCase() === currentMapTarget.atlasName.toLowerCase()) {
                    soundEngine.playSuccess();
                    onAwardXp(20);
                    setMapFindFeedback({
                      ok: true,
                      msg: `Barakalla! Siz ${currentMapTarget.nameUz}ni to‘g‘ri topdingiz (+20 XP).`,
                    });
                  } else {
                    soundEngine.playError();
                    setMapFindFeedback({
                      ok: false,
                      msg: `Bu "${atlasName}" edi. ${currentMapTarget.nameUz} ${currentMapTarget.continent} qit’asida joylashgan — yana urinib ko‘ring!`,
                    });
                  }
                }}
              />

              {mapFindFeedback && (
                <p
                  className={`p-3 rounded-xl text-sm font-semibold ${
                    mapFindFeedback.ok
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                      : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  {mapFindFeedback.msg}
                </p>
              )}
            </div>
          )}

          {stage3Tab === 'capitals-flags' && (
            <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
              <div className="flex items-center gap-4">
                <CountryFlag
                  code={capitalDrillOptions.target.iso2}
                  name={capitalDrillOptions.target.nameUz}
                  className="w-20 h-14"
                />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {capitalDrillOptions.target.continent} · Bayroq va poytaxt mashqi
                  </p>
                  <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                    {capitalDrillOptions.target.nameUz} poytaxti qaysi?
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {capitalDrillOptions.options.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      if (opt === capitalDrillOptions.target.capitalUz) {
                        soundEngine.playSuccess();
                        onAwardXp(15);
                        setDrillFeedback(
                          `To‘g‘ri! ${capitalDrillOptions.target.nameUz} poytaxti — ${opt} (+15 XP).`
                        );
                      } else {
                        soundEngine.playError();
                        setDrillFeedback(
                          `Noto‘g‘ri. To‘g‘ri javob: ${capitalDrillOptions.target.capitalUz}.`
                        );
                      }
                    }}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-sky-500 text-sm font-semibold text-left"
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {drillFeedback && (
                <div className="flex items-center justify-between gap-3 pt-2">
                  <p className="text-sm font-semibold text-sky-700 dark:text-sky-300">
                    {drillFeedback}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setDrillIdx((i) => i + 1);
                      setDrillFeedback(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-semibold shrink-0"
                  >
                    Keyingisi
                  </button>
                </div>
              )}
            </div>
          )}

          {stage3Tab === 'sea-access' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    'Ikki marta dengizga chiqmaydi',
                    'Dengizga chiqmaydi',
                    'Orol davlati',
                    'Okeanga chiqadi',
                    'Dengizga chiqadi',
                  ] as SeaAccessType[]
                ).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setSeaTabFilter(t);
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold ${
                      seaTabFilter === t
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {t} (
                    {ALL_SOVEREIGN_COUNTRIES.filter((c) => c.seaAccess === t).length})
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {ALL_SOVEREIGN_COUNTRIES.filter((c) => c.seaAccess === seaTabFilter)
                  .slice(0, 18)
                  .map((c) => (
                    <button
                      key={c.iso2}
                      type="button"
                      onClick={() => {
                        setStage(1);
                        setSelectedCountry(c);
                      }}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left flex items-center gap-3 hover:border-sky-500"
                    >
                      <CountryFlag code={c.iso2} name={c.nameUz} className="w-8 h-5" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {c.nameUz}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{c.continent}</p>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= STAGE 4: WORLD GEOGRAPHY RECORDS ================= */}
      {stage === 4 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-2">
            {GEOGRAPHY_RECORDS.map((cat) => {
              const active = cat.id === activeRecordCategory.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setRecordCatId(cat.id);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-semibold transition-colors ${
                    active
                      ? 'bg-sky-600 border-sky-600 text-white'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-sky-400'
                  }`}
                >
                  {cat.titleUz}
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <div>
              <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Trophy className="w-6 h-6 text-amber-500" />
                <span>{activeRecordCategory.titleUz}</span>
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {activeRecordCategory.subtitleUz}
              </p>
            </div>

            <div className="space-y-3">
              {activeRecordCategory.items.map((item) => (
                <div
                  key={item.rank}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400 tabular-nums">
                        #{item.rank}
                      </span>
                      <h3 className="font-display font-bold text-slate-900 dark:text-white">
                        {item.titleUz}
                      </h3>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        · {item.locationUz}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{item.noteUz}</p>
                  </div>
                  <span className="font-mono text-sm sm:text-base font-bold text-emerald-700 dark:text-emerald-400 tabular-nums shrink-0">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= STAGE 5: PROFESSIONAL GEOGRAPHER ================= */}
      {stage === 5 && (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'olympiad', label: 'Olimpiada va Yakuniy Imtihon', icon: GraduationCap },
              { id: 'map-pin', label: 'Xaritada belgilash topshiriqlari', icon: Compass },
              { id: 'certificate', label: 'GeoWorld Expert Sertifikati', icon: Award },
            ].map((t) => {
              const Icon = t.icon;
              const active = stage5Tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setStage5Tab(t.id as Stage5SubTab);
                  }}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold ${
                    active
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {stage5Tab === 'olympiad' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
              {examSubmitted ? (
                <div className="text-center space-y-4 py-4">
                  <Sparkles className="w-12 h-12 text-amber-500 mx-auto" />
                  <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                    Yakuniy imtihon natijasi
                  </h2>
                  <p className="font-mono text-xl font-bold text-sky-600 dark:text-sky-400 tabular-nums">
                    {examScore} / {OLYMPIAD_EXAM_QUESTIONS.length} (
                    {Math.round((examScore / OLYMPIAD_EXAM_QUESTIONS.length) * 100)}%)
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                    {examScore / OLYMPIAD_EXAM_QUESTIONS.length >= 0.7
                      ? 'Tabriklaymiz! Siz 70% dan yuqori natija ko‘rsatib, GeoWorld Geography Expert sertifikatini qo‘lga kiritdingiz!'
                      : 'Sertifikat olish uchun kamida 70% to‘g‘ri javob to‘plashingiz kerak. Yana urinib ko‘ring!'}
                  </p>
                  <div className="flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setExamAnswers({});
                        setExamIdx(0);
                        setExamSubmitted(false);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold"
                    >
                      Qayta topshirish
                    </button>
                    {examScore / OLYMPIAD_EXAM_QUESTIONS.length >= 0.7 && (
                      <button
                        type="button"
                        onClick={() => setStage5Tab('certificate')}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold"
                      >
                        Sertifikatni ko‘rish
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <span>
                      {OLYMPIAD_EXAM_QUESTIONS[examIdx].topic} ·{' '}
                      {OLYMPIAD_EXAM_QUESTIONS[examIdx].difficulty}
                    </span>
                    <span className="font-mono tabular-nums">
                      Savol {examIdx + 1} / {OLYMPIAD_EXAM_QUESTIONS.length}
                    </span>
                  </div>

                  <h2 className="font-display text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                    {OLYMPIAD_EXAM_QUESTIONS[examIdx].question}
                  </h2>

                  <div className="grid grid-cols-1 gap-2.5">
                    {OLYMPIAD_EXAM_QUESTIONS[examIdx].options.map((opt, idx) => {
                      const chosen = examAnswers[examIdx];
                      const answered = typeof chosen === 'number';
                      const isCorrect = idx === OLYMPIAD_EXAM_QUESTIONS[examIdx].correctIndex;
                      const isSelected = chosen === idx;

                      let cls =
                        'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-500';
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
                          key={idx}
                          type="button"
                          disabled={answered}
                          onClick={() => {
                            setExamAnswers((prev) => ({ ...prev, [examIdx]: idx }));
                            if (isCorrect) soundEngine.playSuccess();
                            else soundEngine.playError();
                          }}
                          className={`p-3.5 rounded-xl border text-left text-sm font-semibold flex items-center justify-between ${cls}`}
                        >
                          <span>{opt}</span>
                          {answered && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                          {answered && isSelected && !isCorrect && (
                            <XCircle className="w-4 h-4 text-rose-600" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {typeof examAnswers[examIdx] === 'number' && (
                    <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                      <strong>Ilmiy izoh:</strong> {OLYMPIAD_EXAM_QUESTIONS[examIdx].explanation}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      disabled={examIdx === 0}
                      onClick={() => setExamIdx((i) => Math.max(0, i - 1))}
                      className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold disabled:opacity-40"
                    >
                      Oldingi
                    </button>

                    {examIdx + 1 < OLYMPIAD_EXAM_QUESTIONS.length ? (
                      <button
                        type="button"
                        onClick={() => setExamIdx((i) => i + 1)}
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
                      >
                        Keyingi savol
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setExamSubmitted(true);
                          const pct = examScore / OLYMPIAD_EXAM_QUESTIONS.length;
                          onAwardXp(examScore * 15);
                          if (pct >= 0.7) {
                            onUnlockCertificate(studentName);
                            soundEngine.playSuccess();
                          }
                        }}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold"
                      >
                        Imtihonni yakunlash
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {stage5Tab === 'map-pin' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    Topshiriq {(pinTaskIdx % MAP_PIN_TASKS.length) + 1} / {MAP_PIN_TASKS.length} · Ball:{' '}
                    <span className="font-mono tabular-nums">{pinScore}</span>
                  </p>
                  <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white mt-1">
                    {MAP_PIN_TASKS[pinTaskIdx % MAP_PIN_TASKS.length].clueUz}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Yordam: {MAP_PIN_TASKS[pinTaskIdx % MAP_PIN_TASKS.length].hintUz}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPinTaskIdx((i) => i + 1);
                    setPinMessage(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold"
                >
                  Keyingi topshiriq
                </button>
              </div>

              <CountryLocatorMap
                mode="challenge"
                heightClass="h-80 sm:h-96"
                onSelectCountry={(atlasName) => {
                  const task = MAP_PIN_TASKS[pinTaskIdx % MAP_PIN_TASKS.length];
                  if (atlasName.toLowerCase() === task.targetAtlasName.toLowerCase()) {
                    soundEngine.playSuccess();
                    setPinScore((s) => s + 1);
                    onAwardXp(25);
                    setPinMessage(`Ajoyib! ${task.targetNameUz} to‘g‘ri belgilandi (+25 XP).`);
                  } else {
                    soundEngine.playError();
                    setPinMessage(
                      `Siz "${atlasName}" hududini tanladingiz. ${task.targetNameUz} — ${task.continent}da.`
                    );
                  }
                }}
              />

              {pinMessage && (
                <p className="text-sm font-semibold text-sky-700 dark:text-sky-300">{pinMessage}</p>
              )}
            </div>
          )}

          {stage5Tab === 'certificate' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="flex-1 max-w-md">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                    Sertifikat egasining ismi va familiyasi
                  </label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => {
                      setStudentName(e.target.value);
                      localStorage.setItem('geoworld_student_name', e.target.value);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold"
                >
                  <Printer className="w-4 h-4" />
                  <span>Sertifikatni chop etish / PDF</span>
                </button>
              </div>

              <div className="border-4 border-double border-amber-500/70 rounded-2xl p-8 sm:p-10 bg-gradient-to-br from-slate-50 via-white to-sky-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 text-center space-y-4">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600">
                  <Award className="w-8 h-8" />
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-700 dark:text-sky-400">
                  GEOWORLD AKADEMIYASI · RASMIY SERTIFIKAT
                </p>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
                  GeoWorld Geography Expert
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Ushbu sertifikat egasi dunyo geografiyasi akademiyasi dasturini o‘zlashtirgani tasdiqlanadi:
                </p>
                <p className="font-display text-2xl sm:text-3xl font-bold text-indigo-700 dark:text-indigo-400 border-b border-slate-300 dark:border-slate-700 pb-3 max-w-md mx-auto">
                  {studentName || 'GeoWorld Talabasi'}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-6 pt-3 text-xs text-slate-500 dark:text-slate-400">
                  <span>
                    Holat:{' '}
                    <strong className={expertCertified ? 'text-emerald-600' : 'text-amber-600'}>
                      {expertCertified
                        ? 'Tasdiqlangan Ekspert'
                        : 'Olimpiada imtihonida ≥70% to‘plang'}
                    </strong>
                  </span>
                  <span className="font-mono tabular-nums">
                    O‘rganilgan davlatlar: {completedCountries.length}
                  </span>
                  <span className="font-mono tabular-nums">
                    Sana: {new Date().toISOString().slice(0, 10)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
