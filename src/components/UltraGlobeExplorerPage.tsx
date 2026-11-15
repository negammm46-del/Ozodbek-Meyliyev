import { useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  BookOpen,
  CheckCircle2,
  Compass,
  Crown,
  Flame,
  GitCompare,
  Globe2,
  GraduationCap,
  Heart,
  HelpCircle,
  Landmark,
  Layers,
  Lock,
  MapPin,
  Mountain,
  Navigation,
  Search,
  Sparkles,
  Target,
  Trophy,
  Waves,
} from 'lucide-react';
import {
  ALL_SOVEREIGN_COUNTRIES,
  formatAreaUz,
  formatCountryPopulation,
  type FullCountryLesson,
} from '../data/sovereignStatesCatalog';
import {
  ALL_GLOBE_FEATURES,
  computeGreatCircleDistanceKm,
  findCountryByIso2,
  GLOBE_ISLANDS,
  GLOBE_LANDMARKS,
  GLOBE_MISSIONS,
  GLOBE_MOUNTAINS,
  GLOBE_OCEANS,
  GLOBE_RIVERS,
  type GlobeFeatureCategory,
  type GlobeGeoFeature,
  type GlobeMission,
} from '../data/globeFeaturesData';
import type { UserProfile } from '../types/user';
import { CountryFlag } from './CountryFlag';
import {
  DEFAULT_GLOBE_LAYERS,
  EarthGlobe3D,
  type GlobeLayerToggles,
} from './EarthGlobe3D';
import type { GlobeViewMode } from '../utils/earthTextures';
import { soundEngine } from '../utils/sound';

interface UltraGlobeExplorerPageProps {
  user: UserProfile | null;
  isDark: boolean;
  favorites: string[];
  completedMissions: string[];
  onToggleFavorite: (id: string) => void;
  onStartCountryLesson: (iso2: string) => void;
  onStartCountryQuiz: (country: FullCountryLesson) => void;
  onExploreCountryDetails: (country: FullCountryLesson) => void;
  onCompleteMission: (mission: GlobeMission) => void;
  onOpenPro: () => void;
}

type SideTab = 'inspect' | 'features' | 'compare' | 'missions';
type FeatureFilter = 'all' | GlobeFeatureCategory;

const FEATURE_TAB_META: Array<{
  id: FeatureFilter;
  label: string;
  icon: typeof Compass;
}> = [
  { id: 'landmark', label: 'Maskanlar', icon: Landmark },
  { id: 'mountain', label: 'Tog‘lar', icon: Mountain },
  { id: 'river', label: 'Daryolar', icon: Navigation },
  { id: 'island', label: 'Orollar', icon: Compass },
  { id: 'ocean', label: 'Okeanlar', icon: Waves },
];

export function UltraGlobeExplorerPage({
  user,
  isDark,
  favorites,
  completedMissions,
  onToggleFavorite,
  onStartCountryLesson,
  onStartCountryQuiz,
  onExploreCountryDetails,
  onCompleteMission,
  onOpenPro,
}: UltraGlobeExplorerPageProps) {
  const [viewMode, setViewMode] = useState<GlobeViewMode>('satellite');
  const [layers, setLayers] = useState<GlobeLayerToggles>({
    ...DEFAULT_GLOBE_LAYERS,
    landmarks: true,
    mountains: true,
  });

  const [selectedCountry, setSelectedCountry] = useState<FullCountryLesson>(
    () => findCountryByIso2('UZ') || ALL_SOVEREIGN_COUNTRIES[0]
  );
  const [selectedFeature, setSelectedFeature] = useState<GlobeGeoFeature | null>(null);
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number } | null>(
    null
  );

  const [flySeq, setFlySeq] = useState(0);
  const [flyTarget, setFlyTarget] = useState<{
    lat: number;
    lng: number;
    zoomDistance?: number;
    seq: number;
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [sideTab, setSideTab] = useState<SideTab>('inspect');
  const [featureCategory, setFeatureCategory] = useState<FeatureFilter>('landmark');
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Country Comparison state
  const [compareIsoA, setCompareIsoA] = useState('UZ');
  const [compareIsoB, setCompareIsoB] = useState('JP');

  // Interactive 3D Globe Mission state
  const [activeMission, setActiveMission] = useState<GlobeMission | null>(null);
  const [missionHits, setMissionHits] = useState<string[]>([]);
  const [missionToast, setMissionToast] = useState<string | null>(null);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return ALL_SOVEREIGN_COUNTRIES.filter(
      (c) =>
        c.nameUz.toLowerCase().includes(q) ||
        c.nameEn.toLowerCase().includes(q) ||
        c.capitalUz.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [searchQuery]);

  const compareCountryA = useMemo(
    () => findCountryByIso2(compareIsoA) || ALL_SOVEREIGN_COUNTRIES[0],
    [compareIsoA]
  );
  const compareCountryB = useMemo(
    () => findCountryByIso2(compareIsoB) || ALL_SOVEREIGN_COUNTRIES[6],
    [compareIsoB]
  );

  const compareDistanceKm = useMemo(
    () =>
      computeGreatCircleDistanceKm(
        compareCountryA.lat,
        compareCountryA.lng,
        compareCountryB.lat,
        compareCountryB.lng
      ),
    [compareCountryA, compareCountryB]
  );

  const filteredFeaturesList = useMemo(() => {
    if (featureCategory === 'landmark') return GLOBE_LANDMARKS;
    if (featureCategory === 'mountain') return GLOBE_MOUNTAINS;
    if (featureCategory === 'river') return GLOBE_RIVERS;
    if (featureCategory === 'island') return GLOBE_ISLANDS;
    if (featureCategory === 'ocean') return GLOBE_OCEANS;
    return ALL_GLOBE_FEATURES;
  }, [featureCategory]);

  function flyTo(lat: number, lng: number, zoomDistance = 2.35) {
    const nextSeq = flySeq + 1;
    setFlySeq(nextSeq);
    setFlyTarget({ lat, lng, zoomDistance, seq: nextSeq });
  }

  function handleSelectCountry(country: FullCountryLesson, fly = false) {
    soundEngine.playClick();
    setSelectedCountry(country);
    setSelectedFeature(null);
    if (fly) {
      flyTo(country.lat, country.lng, 2.25);
    }

    // Evaluate active 3D Globe Mission progress on country click!
    if (activeMission) {
      let matched = false;
      if (
        activeMission.type === 'continent-count' &&
        country.continent === activeMission.targetContinent
      ) {
        matched = true;
      } else if (
        (activeMission.type === 'find-country' ||
          activeMission.type === 'multi-country') &&
        activeMission.targetCountryIso2s?.includes(country.iso2)
      ) {
        matched = true;
      }

      if (matched) {
        setMissionHits((prev) => {
          if (prev.includes(country.iso2)) {
            setMissionToast(`${country.nameUz} allaqachon topilgan! Boshqa nishonni tanlang.`);
            return prev;
          }
          const next = [...prev, country.iso2];
          if (next.length >= activeMission.requiredCount) {
            soundEngine.playLevelUp();
            confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
            setMissionToast(
              `Missiya bajarildi! "${activeMission.titleUz}" (+${activeMission.xpReward} XP)`
            );
            onCompleteMission(activeMission);
          } else {
            soundEngine.playSuccess();
            setMissionToast(
              `${country.nameUz} topildi! (${next.length} / ${activeMission.requiredCount})`
            );
          }
          return next;
        });
      }
    }
  }

  function handleSelectFeature(feat: GlobeGeoFeature) {
    soundEngine.playClick();
    setSelectedFeature(feat);
    flyTo(feat.lat, feat.lng, 2.2);
    if (feat.countryIso2) {
      const c = findCountryByIso2(feat.countryIso2);
      if (c) setSelectedCountry(c);
    }

    if (activeMission) {
      let matched = false;
      if (
        activeMission.type === 'find-feature' &&
        activeMission.targetFeatureId === feat.id
      ) {
        matched = true;
      } else if (
        activeMission.type === 'category-count' &&
        activeMission.targetCategory === feat.category
      ) {
        matched = true;
      }

      if (matched) {
        setMissionHits((prev) => {
          if (prev.includes(feat.id)) return prev;
          const next = [...prev, feat.id];
          if (next.length >= activeMission.requiredCount) {
            soundEngine.playLevelUp();
            confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
            setMissionToast(
              `Missiya bajarildi! "${activeMission.titleUz}" (+${activeMission.xpReward} XP)`
            );
            onCompleteMission(activeMission);
          } else {
            soundEngine.playSuccess();
            setMissionToast(
              `${feat.nameUz} kashf etildi! (${next.length} / ${activeMission.requiredCount})`
            );
          }
          return next;
        });
      }
    }
  }

  function handleStartMission(m: GlobeMission) {
    soundEngine.playClick();
    if (m.isPro && !user?.isPro) {
      onOpenPro();
      return;
    }
    setActiveMission(m);
    setMissionHits([]);
    setMissionToast(`Missiya boshlandi: ${m.titleUz}`);
    // Auto-enable needed 3D layer for smooth mission experience
    setLayers((prev) => ({
      ...prev,
      borders: true,
      mountains: prev.mountains || m.targetFeatureId === 'mt-everest',
      islands: prev.islands || m.targetCategory === 'island',
      landmarks: prev.landmarks || m.targetCategory === 'landmark',
      oceans: prev.oceans || m.targetCategory === 'ocean',
    }));
    flyTo(m.focusLat, m.focusLng, 2.85);
  }

  function toggleLayer(key: keyof GlobeLayerToggles) {
    soundEngine.playClick();
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const favKey = selectedCountry.iso2.toLowerCase();
  const isFav =
    favorites.includes(favKey) ||
    favorites.includes(selectedCountry.nameEn.toLowerCase());

  const completedCount = completedMissions.length;

  return (
    <div className="space-y-6">
      {/* Top Exploration Bar */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
              Ultra 3D Yer Globusi · Real Geografik Chegaralar ({ALL_SOVEREIGN_COUNTRIES.length} davlat)
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-0.5">
              3D Sayyoraviy Tadqiqot Markazi
            </h1>
          </div>

          {/* Search & Fly to Country / Capital */}
          <div className="relative w-full lg:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Istalgan davlat yoki poytaxtga uchish..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:border-sky-500"
            />
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-30 overflow-hidden">
                {searchResults.map((c) => (
                  <button
                    key={c.iso2}
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSideTab('inspect');
                      handleSelectCountry(c, true);
                    }}
                    className="w-full px-3.5 py-2.5 flex items-center justify-between gap-3 hover:bg-slate-100 dark:hover:bg-slate-800 text-left text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CountryFlag code={c.iso2} name={c.nameUz} className="w-6 h-4 shrink-0" />
                      <span className="font-bold text-slate-900 dark:text-white truncate">
                        {c.nameUz}
                      </span>
                      <span className="text-slate-500 truncate">
                        · {c.capitalUz}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 whitespace-nowrap shrink-0">
                      Uchish →
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* View Mode + 3D Layers Control Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              Ko‘rinish:
            </span>
            {(
              [
                ['satellite', 'Sun’iy yo‘ldosh'],
                ['terrain', 'Relyef'],
                ['political', 'Siyosiy'],
                ['physical', 'Fizik'],
              ] as Array<[GlobeViewMode, string]>
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setViewMode(id);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  viewMode === id
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                ['nightLights', 'Kun/Tun nuri'],
                ['clouds', 'Bulutlar'],
                ['borders', 'Chegaralar'],
                ['grid', 'To‘r (Lat/Lng)'],
                ['labels', 'Nomlar'],
                ['landmarks', 'Maskanlar'],
                ['mountains', 'Tog‘lar'],
                ['rivers', 'Daryolar'],
                ['islands', 'Orollar'],
                ['oceans', 'Okeanlar'],
              ] as Array<[keyof GlobeLayerToggles, string]>
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => toggleLayer(key)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
                  layers[key]
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Active Mission Banner */}
      {activeMission && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
              <Target className="w-4 h-4 shrink-0" />
              <span>Faol 3D Missiya: {activeMission.titleUz}</span>
              <span className="font-mono tabular-nums">
                ({missionHits.length} / {activeMission.requiredCount})
              </span>
            </div>
            <p className="text-xs text-amber-900/90 dark:text-amber-200/90">
              {missionToast || activeMission.descriptionUz}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => flyTo(activeMission.focusLat, activeMission.focusLng, 2.75)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold whitespace-nowrap"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Mo‘ljalga burish
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveMission(null);
                setMissionToast(null);
              }}
              className="px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 text-xs font-semibold text-amber-900 dark:text-amber-200 whitespace-nowrap"
            >
              Yopish
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace: 3D Globe + Side Inspector / Missions / Comparison */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-7 space-y-3">
          <EarthGlobe3D
            selectedSovereignCountry={selectedCountry}
            onSelectSovereignCountry={(country) => {
              handleSelectCountry(country, false);
              setSideTab('inspect');
            }}
            highlightedIso2s={
              activeMission?.type === 'multi-country' ||
              activeMission?.type === 'continent-count'
                ? missionHits
                : []
            }
            onSelectGeoFeature={(feat) => {
              handleSelectFeature(feat);
            }}
            onCursorCoords={setCursorCoords}
            isDark={isDark}
            viewMode={viewMode}
            onChangeViewMode={setViewMode}
            layers={layers}
            compareArc={
              sideTab === 'compare'
                ? {
                    from: {
                      lat: compareCountryA.lat,
                      lng: compareCountryA.lng,
                      name: compareCountryA.nameUz,
                    },
                    to: {
                      lat: compareCountryB.lat,
                      lng: compareCountryB.lng,
                      name: compareCountryB.nameUz,
                    },
                  }
                : null
            }
            flyToCommand={flyTarget}
            heightClass="h-[460px] sm:h-[580px]"
            showModeChips={true}
            allowFullscreen={true}
          />

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 px-1">
            <span>
              Maslahat: Globusni aylantiring, kattalashtiring va istalgan davlat yoki
              3D obyekt ustiga bosing.
            </span>
            <span className="font-mono tabular-nums">
              {cursorCoords
                ? `Kursor: ${Math.abs(cursorCoords.lat).toFixed(2)}°${
                    cursorCoords.lat >= 0 ? 'N' : 'S'
                  } · ${Math.abs(cursorCoords.lng).toFixed(2)}°${
                    cursorCoords.lng >= 0 ? 'E' : 'W'
                  }`
                : `Tanlangan: ${selectedCountry.coordinatesLabel}`}
            </span>
          </div>
        </div>

        {/* Right Workspace Panel */}
        <div className="xl:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-5">
          {/* Side Workspace Tabs */}
          <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
            {(
              [
                ['inspect', 'Davlat'],
                ['features', 'Obyektlar'],
                ['compare', 'Taqqoslash'],
                ['missions', `Missiyalar (${completedCount}/${GLOBE_MISSIONS.length})`],
              ] as Array<[SideTab, string]>
            ).map(([tabId, label]) => (
              <button
                key={tabId}
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setSideTab(tabId);
                }}
                className={`py-2 px-1.5 rounded-lg text-xs font-bold transition-colors truncate ${
                  sideTab === tabId
                    ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* TAB 1: COUNTRY & FEATURE INSPECTOR */}
          {sideTab === 'inspect' && (
            <div className="space-y-4">
              {selectedFeature && (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold uppercase text-amber-700 dark:text-amber-300">
                      Tanlangan 3D Obyekt · {selectedFeature.metricLabel}:{' '}
                      {selectedFeature.metricValue}
                    </p>
                    <button
                      type="button"
                      onClick={() => setSelectedFeature(null)}
                      className="text-xs underline text-amber-800 dark:text-amber-200"
                    >
                      Yopish
                    </button>
                  </div>
                  <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                    {selectedFeature.nameUz}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {selectedFeature.descriptionUz}
                  </p>
                </div>
              )}

              {/* Selected Sovereign Country Card */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <CountryFlag
                    code={selectedCountry.iso2}
                    name={selectedCountry.nameUz}
                    className="w-14 h-9 shadow-xs shrink-0"
                  />
                  <div className="min-w-0">
                    <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white truncate">
                      {selectedCountry.nameUz}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {selectedCountry.continent} · {selectedCountry.coordinatesLabel}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    onToggleFavorite(favKey);
                  }}
                  aria-label="Sevimlilarga saqlash"
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-rose-400 shrink-0"
                >
                  <Heart
                    className={`w-4 h-4 ${
                      isFav ? 'fill-rose-500 text-rose-500' : 'text-slate-400'
                    }`}
                  />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70">
                  <span className="text-slate-500 dark:text-slate-400">Poytaxti</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedCountry.capitalUz}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70">
                  <span className="text-slate-500 dark:text-slate-400">Aholisi</span>
                  <p className="font-mono font-bold text-slate-900 dark:text-white mt-0.5 tabular-nums">
                    {formatCountryPopulation(selectedCountry.populationM)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70">
                  <span className="text-slate-500 dark:text-slate-400">Hududi</span>
                  <p className="font-mono font-bold text-slate-900 dark:text-white mt-0.5 tabular-nums">
                    {formatAreaUz(selectedCountry.areaKm2)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70">
                  <span className="text-slate-500 dark:text-slate-400">Pul birligi</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5 truncate">
                    {selectedCountry.currencyUz}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => flyTo(selectedCountry.lat, selectedCountry.lng, 2.05)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
                >
                  <MapPin className="w-3.5 h-3.5 text-sky-600" />
                  <span>Poytaxtga uchish</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setDetailModalOpen(true);
                    onExploreCountryDetails(selectedCountry);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold whitespace-nowrap shrink-0"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Davlatni o‘rganish</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    onStartCountryLesson(selectedCountry.iso2);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold whitespace-nowrap shrink-0"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Darsni boshlash</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    onStartCountryQuiz(selectedCountry);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold whitespace-nowrap shrink-0"
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Davlat viktorinasi</span>
                </button>
              </div>

              {/* PRO Advanced Telemetry Section */}
              <div className="p-4 rounded-xl border border-amber-300/70 dark:border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/20 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                    <Crown className="w-3.5 h-3.5" />
                    PRO Kengaytirilgan Statistika
                  </span>
                  {!user?.isPro && (
                    <button
                      type="button"
                      onClick={onOpenPro}
                      className="text-xs font-bold text-amber-700 dark:text-amber-400 underline"
                    >
                      PRO bilan ochish
                    </button>
                  )}
                </div>

                {user?.isPro ? (
                  <div className="grid grid-cols-1 gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                    <p>
                      <span className="font-semibold">Eng baland cho‘qqi:</span>{' '}
                      {selectedCountry.highestPeak}
                    </p>
                    <p>
                      <span className="font-semibold">Eng uzun daryo:</span>{' '}
                      {selectedCountry.longestRiver}
                    </p>
                    <p>
                      <span className="font-semibold">Iqlimi:</span>{' '}
                      {selectedCountry.climateUz}
                    </p>
                    <p>
                      <span className="font-semibold">Tabiiy boyliklar:</span>{' '}
                      {selectedCountry.resourcesUz}
                    </p>
                    <p>
                      <span className="font-semibold">Iqtisodiyot:</span>{' '}
                      {selectedCountry.economyUz}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Iqlim profili, foydali qazilmalar, boshqaruv shakli va iqtisodiy
                    tahlilni ko‘rish uchun GEOWORLD PRO rejimini faollashtiring.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: REALISTIC 3D FEATURE EXPLORER */}
          {sideTab === 'features' && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {FEATURE_TAB_META.map((tab) => {
                  const Icon = tab.icon;
                  const active = featureCategory === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        const cat = tab.id as GlobeFeatureCategory;
                        setFeatureCategory(cat);
                        setLayers((prev) => ({
                          ...prev,
                          landmarks: cat === 'landmark' ? true : prev.landmarks,
                          mountains: cat === 'mountain' ? true : prev.mountains,
                          rivers: cat === 'river' ? true : prev.rivers,
                          islands: cat === 'island' ? true : prev.islands,
                          oceans: cat === 'ocean' ? true : prev.oceans,
                        }));
                      }}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                        active
                          ? 'bg-sky-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="max-h-[400px] overflow-y-auto space-y-2 pr-1">
                {filteredFeaturesList.map((feat) => {
                  const isSel = selectedFeature?.id === feat.id;
                  return (
                    <button
                      key={feat.id}
                      type="button"
                      onClick={() => handleSelectFeature(feat)}
                      className={`w-full p-3 rounded-xl border text-left transition-colors ${
                        isSel
                          ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-500'
                          : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 hover:border-sky-400'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {feat.nameUz}
                        </span>
                        <span className="font-mono text-[11px] font-semibold text-sky-600 dark:text-sky-400 shrink-0">
                          {feat.metricValue}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {feat.countryUz} · {feat.continentUz}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                        {feat.descriptionUz}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: COUNTRY COMPARISON ON 3D GLOBE */}
          {sideTab === 'compare' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-sky-600 dark:text-sky-400">
                <GitCompare className="w-4 h-4" />
                <span>3D Globusda ikki davlat orasidagi masofa va taqqoslash</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    1-davlat
                  </label>
                  <select
                    value={compareIsoA}
                    onChange={(e) => {
                      setCompareIsoA(e.target.value);
                      const c = findCountryByIso2(e.target.value);
                      if (c) flyTo(c.lat, c.lng, 2.8);
                    }}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  >
                    {ALL_SOVEREIGN_COUNTRIES.map((c) => (
                      <option key={c.iso2} value={c.iso2}>
                        {c.nameUz}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    2-davlat
                  </label>
                  <select
                    value={compareIsoB}
                    onChange={(e) => {
                      setCompareIsoB(e.target.value);
                      const c = findCountryByIso2(e.target.value);
                      if (c) flyTo(c.lat, c.lng, 2.8);
                    }}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  >
                    {ALL_SOVEREIGN_COUNTRIES.map((c) => (
                      <option key={c.iso2} value={c.iso2}>
                        {c.nameUz}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center">
                <p className="text-[11px] text-amber-800 dark:text-amber-300 font-semibold">
                  To‘g‘ri chiziq (geodezik) masofa
                </p>
                <p className="font-mono text-xl font-bold text-slate-900 dark:text-white tabular-nums">
                  {compareDistanceKm.toLocaleString('uz-UZ')} km
                </p>
              </div>

              <div className="space-y-2 text-xs">
                {[
                  ['Poytaxti', compareCountryA.capitalUz, compareCountryB.capitalUz],
                  [
                    'Aholisi',
                    formatCountryPopulation(compareCountryA.populationM),
                    formatCountryPopulation(compareCountryB.populationM),
                  ],
                  [
                    'Maydoni',
                    formatAreaUz(compareCountryA.areaKm2),
                    formatAreaUz(compareCountryB.areaKm2),
                  ],
                  ['Eng baland nuqta', compareCountryA.highestPeak, compareCountryB.highestPeak],
                  ['Dengizga chiqishi', compareCountryA.seaAccess, compareCountryB.seaAccess],
                ].map(([label, valA, valB]) => (
                  <div
                    key={label}
                    className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 items-center"
                  >
                    <span className="font-semibold text-slate-500">{label}</span>
                    <span className="font-bold text-slate-900 dark:text-white truncate">
                      {valA}
                    </span>
                    <span className="font-bold text-sky-700 dark:text-sky-300 truncate">
                      {valB}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: INTERACTIVE 3D GLOBE MISSIONS */}
          {sideTab === 'missions' && (
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Bajarilgan: {completedCount} / {GLOBE_MISSIONS.length}</span>
                <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                  <Flame className="w-3.5 h-3.5" />
                  3D Globusda topshiriq bajarish
                </span>
              </div>

              {GLOBE_MISSIONS.map((m) => {
                const done = completedMissions.includes(m.id);
                const isActive = activeMission?.id === m.id;
                const locked = Boolean(m.isPro && !user?.isPro);

                return (
                  <div
                    key={m.id}
                    className={`p-3.5 rounded-xl border transition-colors space-y-2 ${
                      done
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-400'
                        : isActive
                        ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-400'
                        : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                          {done && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                          {m.isPro && !done && <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                          <span>{m.titleUz}</span>
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                          {m.descriptionUz}
                        </p>
                      </div>
                      <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap shrink-0">
                        +{m.xpReward} XP
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] font-semibold text-slate-500">
                        Nishon: {m.badgeTitleUz}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleStartMission(m)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                          locked
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                            : isActive
                            ? 'bg-amber-600 text-white'
                            : 'bg-sky-600 hover:bg-sky-700 text-white'
                        }`}
                      >
                        {locked ? (
                          <>
                            <Lock className="w-3 h-3" />
                            <span>PRO ochish</span>
                          </>
                        ) : isActive ? (
                          <span>Faol missiya</span>
                        ) : done ? (
                          <span>Qayta bajarish</span>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3" />
                            <span>Boshlash</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Country Encyclopedia Quick Modal (Explore Country action) */}
      {detailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75">
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <CountryFlag
                  code={selectedCountry.iso2}
                  name={selectedCountry.nameUz}
                  className="w-16 h-11 shadow-xs"
                />
                <div>
                  <h3 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                    {selectedCountry.nameUz} ({selectedCountry.nameEn})
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedCountry.capitalUz} · {selectedCountry.continent} ·{' '}
                    {selectedCountry.coordinatesLabel}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold"
              >
                Yopish
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70">
                <span className="text-slate-500">Maydoni</span>
                <p className="font-bold mt-0.5">{formatAreaUz(selectedCountry.areaKm2)}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70">
                <span className="text-slate-500">Aholisi</span>
                <p className="font-bold mt-0.5">
                  {formatCountryPopulation(selectedCountry.populationM)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70">
                <span className="text-slate-500">Davlat tili</span>
                <p className="font-bold mt-0.5">{selectedCountry.languagesUz}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70">
                <span className="text-slate-500">Boshqaruv shakli</span>
                <p className="font-bold mt-0.5">{selectedCountry.govFormUz}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70">
                <span className="text-slate-500">Eng baland tog‘</span>
                <p className="font-bold mt-0.5">{selectedCountry.highestPeak}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70">
                <span className="text-slate-500">Eng uzun daryo</span>
                <p className="font-bold mt-0.5">{selectedCountry.longestRiver}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-sky-600 dark:text-sky-400">
                Geografik xususiyatlari va qiziqarli faktlar:
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {selectedCountry.geoCharacteristics}
              </p>
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 list-disc pl-5">
                {selectedCountry.tenGeoFacts.slice(0, 5).map((f, idx) => (
                  <li key={idx}>{f}</li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setDetailModalOpen(false);
                  onStartCountryQuiz(selectedCountry);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
              >
                <Trophy className="w-4 h-4" />
                <span>Davlat viktorinasi</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setDetailModalOpen(false);
                  onStartCountryLesson(selectedCountry.iso2);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold"
              >
                <Globe2 className="w-4 h-4" />
                <span>To‘liq darsni boshlash</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
