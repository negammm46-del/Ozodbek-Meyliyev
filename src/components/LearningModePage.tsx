import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Layers,
  Mountain,
  RotateCw,
  Waves,
} from 'lucide-react';
import { MOUNTAINS, OCEANS, OCEAN_ZONES } from '../data/geographyData';
import {
  GEO_COUNTRIES,
  GEO_FLASHCARDS,
  RIVERS_AND_DESERTS,
  type GeoFlashcard,
} from '../data/geoWorldData';
import { CONTINENT_FACTS, type MapContinentId } from '../data/worldMapData';
import { CountryFlag } from './CountryFlag';
import { soundEngine } from '../utils/sound';

type LearnTab =
  | 'flashcards'
  | 'capitals'
  | 'continents-oceans'
  | 'mountains-rivers';

interface LearningModePageProps {
  masteredIds: string[];
  onMasterFlashcard: (id: string) => void;
}

const CONTINENT_LIST: MapContinentId[] = [
  'Osiyo',
  'Yevropa',
  'Afrika',
  'Shimoliy Amerika',
  'Janubiy Amerika',
  'Okeaniya',
  'Antarktida',
];

export function LearningModePage({
  masteredIds,
  onMasterFlashcard,
}: LearningModePageProps) {
  const [activeTab, setActiveTab] = useState<LearnTab>('flashcards');

  // Flashcards state
  const [cardCategory, setCardCategory] = useState<
    'Barchasi' | GeoFlashcard['category']
  >('Barchasi');
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Capitals drill state
  const [revealedCapitals, setRevealedCapitals] = useState<string[]>([]);

  // Oceans depth visualizer state
  const [zoneIdx, setZoneIdx] = useState(0);
  const [selectedPeakId, setSelectedPeakId] = useState(MOUNTAINS[0].id);

  const filteredCards = useMemo(() => {
    if (cardCategory === 'Barchasi') return GEO_FLASHCARDS;
    return GEO_FLASHCARDS.filter((c) => c.category === cardCategory);
  }, [cardCategory]);

  const currentCard = filteredCards[cardIndex] ?? filteredCards[0];
  const selectedZone = OCEAN_ZONES[zoneIdx] ?? OCEAN_ZONES[0];
  const selectedPeak =
    MOUNTAINS.find((m) => m.id === selectedPeakId) ?? MOUNTAINS[0];

  function handleNextCard(delta: number) {
    soundEngine.playClick();
    setIsFlipped(false);
    setShowHint(false);
    setCardIndex((prev) => {
      const len = filteredCards.length;
      return (prev + delta + len) % len;
    });
  }

  function handleFlip() {
    soundEngine.playFlip();
    setIsFlipped((prev) => !prev);
  }

  function handleMarkMastered() {
    if (!currentCard) return;
    soundEngine.playSuccess();
    onMasterFlashcard(currentCard.id);
    handleNextCard(1);
  }

  function toggleRevealCapital(id: string) {
    soundEngine.playClick();
    setRevealedCapitals((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-1">
          Ta’lim rejimi · Interaktiv darslar va kartochkalar
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Geografiyani bosqichma-bosqich o‘rganing
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-1 max-w-[65ch]">
          3D kartochkalar yordamida tezkor yodlang, poytaxtlarni mashq qiling va
          okean chuqurligi hamda tog‘ balandligi modellarini sinab ko‘ring.
        </p>
      </div>

      <div
        className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-200/75 dark:bg-slate-800 rounded-xl w-fit"
        role="tablist"
        aria-label="Ta’lim bo‘limlari"
      >
        {(
          [
            ['flashcards', 'Kartochkalar'],
            ['capitals', 'Davlatlar va poytaxtlar'],
            ['continents-oceans', 'Qit’alar va okeanlar'],
            ['mountains-rivers', 'Tog‘lar, daryolar va cho‘llar'],
          ] as [LearnTab, string][]
        ).map(([id, label]) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                soundEngine.playClick();
                setActiveTab(id);
              }}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                active
                  ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Flashcards */}
      {activeTab === 'flashcards' && currentCard && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  'Barchasi',
                  'Davlatlar va poytaxtlar',
                  'Qit’alar va okeanlar',
                  'Tog‘lar, daryolar va cho‘llar',
                ] as const
              ).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setCardCategory(cat);
                    setCardIndex(0);
                    setIsFlipped(false);
                    setShowHint(false);
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                    cardCategory === cat
                      ? 'bg-sky-600 text-white border-sky-600'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
              O‘zlashtirildi: {masteredIds.length} / {GEO_FLASHCARDS.length}
            </span>
          </div>

          {/* 3D Flip Card */}
          <div className="max-w-2xl mx-auto">
            <div
              onClick={handleFlip}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleFlip();
                }
              }}
              aria-label="Kartochkani aylantirish"
              className="perspective-1000 cursor-pointer h-72 sm:h-80"
            >
              <div
                className={`relative w-full h-full transition-transform duration-500 preserve-3d ${
                  isFlipped ? 'rotate-y-180' : ''
                }`}
              >
                {/* Front */}
                <div className="absolute inset-0 backface-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-sky-50/70 dark:from-slate-800 dark:to-slate-900 p-8 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>{currentCard.category}</span>
                    <span className="font-mono tabular-nums">
                      {cardIndex + 1} / {filteredCards.length}
                    </span>
                  </div>

                  <div className="text-center space-y-3">
                    <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-snug">
                      {currentCard.front}
                    </h2>
                    {showHint && (
                      <p className="text-sm text-sky-700 dark:text-sky-400">
                        Maslahat: {currentCard.hint}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <RotateCw className="w-3.5 h-3.5" />
                    Javobni ko‘rish uchun bosing
                  </div>
                </div>

                {/* Back */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-2xl border border-emerald-500/60 bg-gradient-to-br from-emerald-600 via-teal-600 to-sky-700 p-8 text-white flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-emerald-100">
                    <span>To‘g‘ri javob</span>
                    <span>{currentCard.category}</span>
                  </div>

                  <div className="text-center space-y-3">
                    <h2 className="font-display text-2xl sm:text-3xl font-bold">
                      {currentCard.back}
                    </h2>
                    <p className="text-sm text-emerald-50 max-w-md mx-auto leading-relaxed">
                      {currentCard.detail}
                    </p>
                  </div>

                  <div className="text-center text-xs text-emerald-100">
                    Old tomonga qaytish uchun bosing
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 mt-5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleNextCard(-1)}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  aria-label="Oldingi kartochka"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setShowHint((prev) => !prev);
                  }}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  {showHint ? 'Maslahatni yopish' : 'Maslahat ko‘rish'}
                </button>
                <button
                  type="button"
                  onClick={() => handleNextCard(1)}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  aria-label="Keyingi kartochka"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleMarkMastered}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                <CheckCircle2 className="w-4 h-4" />
                {masteredIds.includes(currentCard.id)
                  ? 'O‘zlashtirilgan · Keyingisi'
                  : 'O‘zlashtirdim (+15 XP)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Capitals Trainer */}
      {activeTab === 'capitals' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                Davlatlar va poytaxtlarni yodlash mashqi
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Avval poytaxt nomini eslang, so‘ng tugmani bosib tekshiring.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                if (revealedCapitals.length === GEO_COUNTRIES.length) {
                  setRevealedCapitals([]);
                } else {
                  setRevealedCapitals(GEO_COUNTRIES.map((c) => c.id));
                }
              }}
              className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
            >
              {revealedCapitals.length === GEO_COUNTRIES.length
                ? 'Barchasini yashirish'
                : 'Barchasini ko‘rsatish'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {GEO_COUNTRIES.map((c) => {
              const revealed = revealedCapitals.includes(c.id);
              return (
                <div
                  key={c.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <CountryFlag code={c.code} name={c.name} className="w-9 h-6" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {c.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {c.continent}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleRevealCapital(c.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 ${
                      revealed
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sky-700 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {revealed ? (
                      c.capital
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        Poytaxti
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Continents & Oceans */}
      {activeTab === 'continents-oceans' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CONTINENT_LIST.map((cid) => {
              const c = CONTINENT_FACTS[cid];
              return (
                <div
                  key={c.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-2.5"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                      {c.name}
                    </h3>
                    <span className="font-mono text-xs text-sky-700 dark:text-sky-400 tabular-nums">
                      {c.areaKm2}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {c.countriesCount} · Aholisi: {c.population}
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {c.teacherSummary}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                    Cho‘qqi: {c.highestPeak} · Daryo: {c.longestRiver}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Animated Ocean Depth Simulator */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Waves className="w-5 h-5 text-sky-600" />
                  5 ta Dunyo okeani
                </h3>
                <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                  Maydon bo‘yicha
                </span>
              </div>
              <div className="space-y-3">
                {OCEANS.map((ocean) => {
                  const pct = Math.round((ocean.areaMillionKm2 / 165.2) * 100);
                  return (
                    <div key={ocean.id} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {ocean.name}
                        </span>
                        <span className="font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                          {ocean.areaMillionKm2} mln km² · Max: {ocean.maxDepthM} m
                        </span>
                      </div>
                      <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-sky-500 to-indigo-600 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-6 bg-gradient-to-b from-sky-900 via-sky-950 to-slate-950 border border-slate-800 rounded-2xl p-6 text-white flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-sky-300" />
                    <h3 className="font-display text-lg font-bold">
                      Okean chuqurligi simulyatori
                    </h3>
                  </div>
                  <span className="font-mono text-xs text-sky-300 tabular-nums">
                    {selectedZone.depthRange}
                  </span>
                </div>

                <input
                  type="range"
                  min={0}
                  max={OCEAN_ZONES.length - 1}
                  step={1}
                  value={zoneIdx}
                  onChange={(e) => {
                    soundEngine.playClick();
                    setZoneIdx(Number(e.target.value));
                  }}
                  aria-label="Okean chuqurlik qatlami"
                  className="w-full accent-sky-400 cursor-pointer mb-2"
                />
                <div className="flex justify-between text-[11px] font-mono text-sky-300/80 mb-5 tabular-nums">
                  <span>0 m</span>
                  <span>200 m</span>
                  <span>1 000 m</span>
                  <span>4 000 m</span>
                  <span>10 984 m</span>
                </div>

                <div className="bg-white/10 border border-white/15 rounded-xl p-4 space-y-2">
                  <h4 className="font-display text-lg font-bold text-white">
                    {selectedZone.name}
                  </h4>
                  <p className="text-xs text-sky-200 font-mono tabular-nums">
                    Yorug‘lik: {selectedZone.sunlight} · Bosim:{' '}
                    {selectedZone.pressureAtm} · Harorat:{' '}
                    {selectedZone.temperature}
                  </p>
                  <p className="text-sm text-slate-100 leading-relaxed">
                    {selectedZone.lifeSummary}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Mountains, Rivers & Deserts */}
      {activeTab === 'mountains-rivers' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Mountain className="w-5 h-5 text-amber-500" />
                  Eng baland tog‘ cho‘qqilari taqqoslanishi
                </h2>
                <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  0 – 9 000 m
                </span>
              </div>

              <div className="space-y-2.5">
                {MOUNTAINS.map((peak) => {
                  const pct = Math.round((peak.elevationM / 9000) * 100);
                  const active = peak.id === selectedPeak.id;
                  return (
                    <button
                      key={peak.id}
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        setSelectedPeakId(peak.id);
                      }}
                      className={`w-full text-left p-3 rounded-xl border transition-colors ${
                        active
                          ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-500'
                          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {peak.name} · {peak.range}
                        </span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                          {peak.elevationM.toLocaleString('uz-UZ')} m
                        </span>
                      </div>
                      <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            active ? 'bg-amber-500' : 'bg-slate-400 dark:bg-slate-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-1">
                  {selectedPeak.range} · {selectedPeak.originType} tog‘
                </p>
                <h3 className="font-display text-2xl font-bold text-slate-900 dark:text-white mb-1">
                  {selectedPeak.name}
                </h3>
                <p className="font-mono text-lg font-bold text-slate-700 dark:text-slate-300 tabular-nums mb-4">
                  {selectedPeak.elevationM.toLocaleString('uz-UZ')} m ·{' '}
                  {selectedPeak.countries}
                </p>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                  {selectedPeak.teacherSummary}
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">
                  Qiziqarli fakt
                </p>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {selectedPeak.funFact}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {RIVERS_AND_DESERTS.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <span className="text-xs font-semibold text-sky-700 dark:text-sky-400">
                      {item.type} · {item.region}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                      {item.metricValue}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white mb-2">
                    {item.name}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                    {item.summary}
                  </p>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800">
                  Fakt: {item.funFact}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
