import { useMemo, useRef, useState } from 'react';
import { geoGraticule10, geoNaturalEarth1, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import {
  ArrowRight,
  Compass,
  Globe2,
  Heart,
  MapPin,
  Minus,
  Plus,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';
import countriesAtlas from 'world-atlas/countries-110m.json';
import { GEO_COUNTRIES, type GeoCountry } from '../data/geoWorldData';
import {
  ATLAS_NAME_TO_CONTINENT,
  CONTINENT_FACTS,
  FEATURED_ATLAS_COUNTRIES,
  getCountryFactByAtlasName,
  type MapContinentId,
} from '../data/worldMapData';
import { CountryFlag } from './CountryFlag';
import { soundEngine } from '../utils/sound';

type MapMode = 'countries' | 'continents';
type TopologyInput = Parameters<typeof feature>[0];
type GeoObjectInput = Parameters<typeof feature>[1];

interface AtlasFeature {
  id?: string | number;
  properties: {
    name?: string;
  };
  geometry: Parameters<ReturnType<typeof geoPath>>[0];
  type: 'Feature';
}

interface InteractiveMapPageProps {
  favorites: string[];
  exploredAtlasCountries: string[];
  onRecordMapVisit: (atlasName: string) => void;
  onToggleFavorite: (id: string) => void;
  onOpenCountryInExplorer: (country: GeoCountry) => void;
}

const MAP_WIDTH = 960;
const MAP_HEIGHT = 510;
const CONTINENT_ORDER: MapContinentId[] = [
  'Osiyo',
  'Yevropa',
  'Afrika',
  'Shimoliy Amerika',
  'Janubiy Amerika',
  'Okeaniya',
  'Antarktida',
];

export function InteractiveMapPage({
  favorites,
  exploredAtlasCountries,
  onRecordMapVisit,
  onToggleFavorite,
  onOpenCountryInExplorer,
}: InteractiveMapPageProps) {
  const [mode, setMode] = useState<MapMode>('countries');
  const [selectedContinent, setSelectedContinent] =
    useState<MapContinentId>('Osiyo');
  const [selectedCountryName, setSelectedCountryName] =
    useState<string>('Uzbekistan');
  const [hoveredName, setHoveredName] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [mapSearch, setMapSearch] = useState('');

  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const svgContainerRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<{
    x: number;
    y: number;
    panX: number;
    panY: number;
    moved: boolean;
  } | null>(null);

  const featuredSet = useMemo(() => new Set(FEATURED_ATLAS_COUNTRIES), []);

  const { countries, graticulePath, spherePath } = useMemo(() => {
    const topology = countriesAtlas as unknown as TopologyInput & {
      objects: { countries: GeoObjectInput };
    };
    const collection = feature(
      topology,
      topology.objects.countries
    ) as unknown as {
      type: 'FeatureCollection';
      features: AtlasFeature[];
    };

    const projection = geoNaturalEarth1().fitExtent(
      [
        [14, 14],
        [MAP_WIDTH - 14, MAP_HEIGHT - 14],
      ],
      { type: 'Sphere' }
    );

    const generator = geoPath(projection);
    const grat = generator(geoGraticule10()) ?? '';
    const sphere = generator({ type: 'Sphere' }) ?? '';

    const processed = collection.features.map((feat, idx) => {
      const atlasName = feat.properties?.name ?? `Region-${idx}`;
      const continent = ATLAS_NAME_TO_CONTINENT[atlasName] ?? 'Osiyo';
      const d = generator(feat as unknown as Parameters<typeof generator>[0]) ?? '';
      const centroid = generator.centroid(
        feat as unknown as Parameters<typeof generator>[0]
      );
      return {
        key: `${feat.id ?? atlasName}-${idx}`,
        atlasName,
        continent,
        d,
        centroid:
          Number.isFinite(centroid[0]) && Number.isFinite(centroid[1])
            ? centroid
            : null,
      };
    });

    return {
      countries: processed,
      graticulePath: grat,
      spherePath: sphere,
    };
  }, []);

  const richCountry = useMemo(
    () => GEO_COUNTRIES.find((c) => c.atlasName === selectedCountryName) ?? null,
    [selectedCountryName]
  );

  const activeCountryFact = useMemo(
    () => getCountryFactByAtlasName(selectedCountryName),
    [selectedCountryName]
  );

  const activeContinentFact = CONTINENT_FACTS[selectedContinent];

  const featuredInContinent = useMemo(() => {
    return FEATURED_ATLAS_COUNTRIES.filter(
      (name) => (ATLAS_NAME_TO_CONTINENT[name] ?? 'Osiyo') === selectedContinent
    ).map((name) => getCountryFactByAtlasName(name));
  }, [selectedContinent]);

  const searchMatches = useMemo(() => {
    const q = mapSearch.trim().toLowerCase();
    if (!q) return [];
    return GEO_COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.capital.toLowerCase().includes(q) ||
        c.atlasName.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [mapSearch]);

  const hoveredInfo = useMemo(() => {
    if (!hoveredName) return null;
    const fact = getCountryFactByAtlasName(hoveredName);
    return {
      countryName: fact.uzbekName,
      continent: fact.continent,
    };
  }, [hoveredName]);

  const hoveredContinent = hoveredName
    ? (ATLAS_NAME_TO_CONTINENT[hoveredName] ?? 'Osiyo')
    : null;

  const selectedCountryFeature = useMemo(
    () => countries.find((c) => c.atlasName === selectedCountryName),
    [countries, selectedCountryName]
  );

  function clampPan(nextX: number, nextY: number, currentZoom: number) {
    const maxOffsetX = (MAP_WIDTH * (currentZoom - 1)) / 2;
    const maxOffsetY = (MAP_HEIGHT * (currentZoom - 1)) / 2;
    return {
      x: Math.max(-maxOffsetX, Math.min(maxOffsetX, nextX)),
      y: Math.max(-maxOffsetY, Math.min(maxOffsetY, nextY)),
    };
  }

  function handleZoomStep(delta: number) {
    soundEngine.playClick();
    setZoom((prev) => {
      const next = Math.max(1, Math.min(4, Number((prev + delta).toFixed(2))));
      setPan((p) => clampPan(p.x, p.y, next));
      return next;
    });
  }

  function handleResetView() {
    soundEngine.playClick();
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (zoom <= 1) return;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
      moved: false,
    };
    setIsDragging(true);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (svgContainerRef.current) {
      const rect = svgContainerRef.current.getBoundingClientRect();
      setTooltipPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }

    if (!dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      dragStartRef.current.moved = true;
    }

    if (svgContainerRef.current && dragStartRef.current.moved) {
      const scaleX = MAP_WIDTH / svgContainerRef.current.clientWidth;
      const scaleY = MAP_HEIGHT / svgContainerRef.current.clientHeight;
      const nextPan = clampPan(
        dragStartRef.current.panX + dx * scaleX,
        dragStartRef.current.panY + dy * scaleY,
        zoom
      );
      setPan(nextPan);
    }
  }

  function handlePointerUp() {
    dragStartRef.current = null;
    setIsDragging(false);
  }

  function handleRegionClick(atlasName: string, continent: MapContinentId) {
    if (dragStartRef.current?.moved) return;
    soundEngine.playClick();
    if (mode === 'continents') {
      setSelectedContinent(continent);
    } else {
      setSelectedCountryName(atlasName);
      setSelectedContinent(continent);
      onRecordMapVisit(atlasName);
    }
  }

  function handleSelectSearchCountry(country: GeoCountry) {
    soundEngine.playClick();
    setMode('countries');
    setSelectedCountryName(country.atlasName);
    setSelectedContinent(country.continent);
    setMapSearch('');
    onRecordMapVisit(country.atlasName);
  }

  const transformString = `translate(${MAP_WIDTH / 2 + pan.x}, ${
    MAP_HEIGHT / 2 + pan.y
  }) scale(${zoom}) translate(${-MAP_WIDTH / 2}, ${-MAP_HEIGHT / 2})`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-sky-700 dark:text-sky-400 mb-1">
            Interaktiv xarita · {exploredAtlasCountries.length} ta hudud o‘rganildi
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Dunyo xaritasi bo‘ylab sayohat
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-1 max-w-[65ch]">
            Istalgan davlat yoki qit’a ustiga bosing — bayrog‘i, poytaxti,
            aholisi va qiziqarli faktlar darhol ko‘rinadi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              value={mapSearch}
              onChange={(e) => setMapSearch(e.target.value)}
              placeholder="Xaritadan davlat qidirish..."
              aria-label="Xaritadan davlat qidirish"
              className="w-full pl-9 pr-8 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-sky-600"
            />
            {mapSearch && (
              <button
                type="button"
                onClick={() => setMapSearch('')}
                aria-label="Qidiruvni tozalash"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {searchMatches.length > 0 && (
              <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden">
                {searchMatches.map((match) => (
                  <button
                    key={match.id}
                    type="button"
                    onClick={() => handleSelectSearchCountry(match)}
                    className="w-full px-3.5 py-2.5 text-left flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b last:border-b-0 border-slate-100 dark:border-slate-800"
                  >
                    <CountryFlag
                      code={match.code}
                      name={match.name}
                      className="w-7 h-5"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {match.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {match.capital} · {match.continent}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div
            className="flex items-center gap-1 p-1 bg-slate-200/75 dark:bg-slate-800 rounded-lg shrink-0"
            role="tablist"
            aria-label="Xarita ko‘rish rejimi"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'countries'}
              onClick={() => {
                soundEngine.playClick();
                setMode('countries');
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                mode === 'countries'
                  ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Davlatlar
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'continents'}
              onClick={() => {
                soundEngine.playClick();
                setMode('continents');
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                mode === 'continents'
                  ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Qit’alar
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 flex flex-col gap-3">
          <div
            ref={svgContainerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={() => {
              handlePointerUp();
              setHoveredName(null);
            }}
            className={`relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden select-none ${
              zoom > 1
                ? isDragging
                  ? 'cursor-grabbing'
                  : 'cursor-grab'
                : 'cursor-default'
            }`}
          >
            <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 rounded-lg p-1 shadow-xs">
              <button
                type="button"
                onClick={() => handleZoomStep(0.5)}
                disabled={zoom >= 4}
                aria-label="Yaqinlashtirish"
                className="p-1.5 rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleZoomStep(-0.5)}
                disabled={zoom <= 1}
                aria-label="Uzoqlashtirish"
                className="p-1.5 rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
              >
                <Minus className="w-4 h-4" />
              </button>
              {zoom > 1 && (
                <button
                  type="button"
                  onClick={handleResetView}
                  className="px-2 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Tiklash
                </button>
              )}
            </div>

            <svg
              viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
              className="w-full h-auto block bg-slate-100 dark:bg-slate-950"
              role="img"
              aria-label="Interaktiv dunyo xaritasi"
            >
              <g transform={transformString}>
                <path
                  d={spherePath}
                  className="fill-sky-50 dark:fill-slate-900 stroke-slate-300 dark:stroke-slate-700"
                  strokeWidth={1 / zoom}
                />
                <path
                  d={graticulePath}
                  fill="none"
                  className="stroke-sky-200/70 dark:stroke-slate-800"
                  strokeWidth={0.6 / zoom}
                />

                {countries.map((item) => {
                  const isFeatured = featuredSet.has(item.atlasName);
                  const isSelectedCountry =
                    mode === 'countries' &&
                    item.atlasName === selectedCountryName;
                  const isSelectedContinent =
                    mode === 'continents' &&
                    item.continent === selectedContinent;
                  const isHoveredCountry =
                    mode === 'countries' && hoveredName === item.atlasName;
                  const isHoveredContinent =
                    mode === 'continents' &&
                    hoveredContinent === item.continent;

                  let fill = '#CBD5E1';
                  if (mode === 'countries') {
                    if (isSelectedCountry) fill = '#0284C7';
                    else if (isHoveredCountry) fill = '#38BDF8';
                    else if (isFeatured) fill = '#7DD3FC';
                    else fill = '#CBD5E1';
                  } else {
                    if (isSelectedContinent) fill = '#0284C7';
                    else if (isHoveredContinent) fill = '#38BDF8';
                    else fill = '#CBD5E1';
                  }

                  return (
                    <path
                      key={item.key}
                      d={item.d}
                      fill={fill}
                      stroke={
                        isSelectedCountry || isSelectedContinent
                          ? '#0369A1'
                          : '#FFFFFF'
                      }
                      strokeWidth={(isSelectedCountry ? 1.1 : 0.55) / zoom}
                      className="cursor-pointer transition-colors duration-150 outline-none"
                      onMouseEnter={() => setHoveredName(item.atlasName)}
                      onClick={() =>
                        handleRegionClick(item.atlasName, item.continent)
                      }
                    />
                  );
                })}

                {mode === 'countries' && selectedCountryFeature?.centroid && (
                  <g
                    transform={`translate(${selectedCountryFeature.centroid[0]}, ${selectedCountryFeature.centroid[1]})`}
                    className="pointer-events-none"
                  >
                    <circle r={6 / zoom} fill="#FFFFFF" fillOpacity={0.95} />
                    <circle r={3.5 / zoom} fill="#F59E0B" />
                  </g>
                )}
              </g>
            </svg>

            {hoveredInfo && !isDragging && (
              <div
                className="pointer-events-none absolute z-20 px-3 py-1.5 bg-slate-900 text-white text-xs rounded-lg shadow-md whitespace-nowrap"
                style={{
                  left: Math.min(
                    tooltipPos.x + 12,
                    (svgContainerRef.current?.clientWidth ?? 600) - 180
                  ),
                  top: Math.max(10, tooltipPos.y - 36),
                }}
              >
                <span className="font-semibold">
                  {mode === 'continents'
                    ? hoveredInfo.continent
                    : hoveredInfo.countryName}
                </span>
                <span className="text-slate-300">
                  {' '}
                  ·{' '}
                  {mode === 'continents'
                    ? hoveredInfo.countryName
                    : hoveredInfo.continent}
                </span>
              </div>
            )}

            <div className="px-4 py-2.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex flex-wrap items-center gap-4">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-sky-600 inline-block" />
                  Tanlangan
                </span>
                {mode === 'countries' && (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-xs bg-sky-300 inline-block" />
                    Batafsil ma’lumotli davlatlar
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-slate-300 inline-block" />
                  Boshqa hududlar
                </span>
              </div>
              <span className="font-mono tabular-nums">
                Masshtab: {zoom.toFixed(1)}x
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {CONTINENT_ORDER.map((continent) => {
              const isActive =
                mode === 'continents'
                  ? selectedContinent === continent
                  : activeCountryFact.continent === continent;
              return (
                <button
                  key={continent}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setMode('continents');
                    setSelectedContinent(continent);
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-sky-600 text-white border-sky-600'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {continent}
                </button>
              );
            })}
          </div>
        </div>

        <aside className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          {mode === 'countries' ? (
            <div>
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  {richCountry ? (
                    <CountryFlag
                      code={richCountry.code}
                      name={richCountry.name}
                      className="w-11 h-7"
                    />
                  ) : (
                    <Globe2 className="w-7 h-7 text-sky-600 shrink-0" />
                  )}
                  <div>
                    <p className="text-xs font-medium text-sky-700 dark:text-sky-400">
                      {activeCountryFact.continent}
                    </p>
                    <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                      {activeCountryFact.uzbekName}
                    </h2>
                  </div>
                </div>

                {richCountry && (
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      onToggleFavorite(richCountry.id);
                    }}
                    aria-label="Sevimlilarga qo‘shish"
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-500 transition-colors shrink-0"
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        favorites.includes(richCountry.id)
                          ? 'fill-rose-500 text-rose-500'
                          : ''
                      }`}
                    />
                  </button>
                )}
              </div>

              {(activeCountryFact.capital ||
                activeCountryFact.areaKm2 ||
                activeCountryFact.population) && (
                <dl className="grid grid-cols-2 gap-4 py-4 border-b border-slate-200 dark:border-slate-800">
                  {activeCountryFact.capital && (
                    <div>
                      <dt className="text-xs text-slate-500 dark:text-slate-400">
                        Poytaxti
                      </dt>
                      <dd className="text-sm font-semibold text-slate-900 dark:text-white">
                        {activeCountryFact.capital}
                      </dd>
                    </div>
                  )}
                  {activeCountryFact.population && (
                    <div>
                      <dt className="text-xs text-slate-500 dark:text-slate-400">
                        Aholisi
                      </dt>
                      <dd className="font-mono text-sm font-semibold text-slate-900 dark:text-white tabular-nums">
                        {activeCountryFact.population}
                      </dd>
                    </div>
                  )}
                  {activeCountryFact.areaKm2 && (
                    <div>
                      <dt className="text-xs text-slate-500 dark:text-slate-400">
                        Maydoni
                      </dt>
                      <dd className="font-mono text-sm font-semibold text-slate-900 dark:text-white tabular-nums">
                        {activeCountryFact.areaKm2}
                      </dd>
                    </div>
                  )}
                  {activeCountryFact.coordinates && (
                    <div>
                      <dt className="text-xs text-slate-500 dark:text-slate-400">
                        Koordinatasi
                      </dt>
                      <dd className="font-mono text-xs font-medium text-slate-700 dark:text-slate-300 tabular-nums inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        {activeCountryFact.coordinates}
                      </dd>
                    </div>
                  )}
                </dl>
              )}

              <div className="py-4 space-y-4">
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {activeCountryFact.shortNote}
                </p>

                <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                  <p className="text-xs font-semibold text-sky-700 dark:text-sky-400 mb-1">
                    Qiziqarli fakt
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {activeCountryFact.funFact}
                  </p>
                </div>

                {richCountry && (
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      onOpenCountryInExplorer(richCountry);
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold transition-colors"
                  >
                    Davlat haqida to‘liq ma’lumot
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <p className="text-xs font-medium text-sky-700 dark:text-sky-400 mb-1">
                    Tanlangan qit’a
                  </p>
                  <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                    {activeContinentFact.name}
                  </h2>
                </div>
                <Compass className="w-6 h-6 text-sky-600 shrink-0 mt-1" />
              </div>

              <dl className="grid grid-cols-2 gap-4 py-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <dt className="text-xs text-slate-500 dark:text-slate-400">
                    Maydoni
                  </dt>
                  <dd className="font-mono text-sm font-semibold text-slate-900 dark:text-white tabular-nums">
                    {activeContinentFact.areaKm2}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500 dark:text-slate-400">
                    Aholisi
                  </dt>
                  <dd className="font-mono text-sm font-semibold text-slate-900 dark:text-white tabular-nums">
                    {activeContinentFact.population}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500 dark:text-slate-400">
                    Eng baland cho‘qqi
                  </dt>
                  <dd className="text-xs font-semibold text-slate-900 dark:text-white">
                    {activeContinentFact.highestPeak}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500 dark:text-slate-400">
                    Eng uzun daryo
                  </dt>
                  <dd className="text-xs font-semibold text-slate-900 dark:text-white">
                    {activeContinentFact.longestRiver}
                  </dd>
                </div>
              </dl>

              <div className="py-4 space-y-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Davlatlar soni: {activeContinentFact.countriesCount}
                </p>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {activeContinentFact.teacherSummary}
                </p>

                <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                  <p className="text-xs font-semibold text-sky-700 dark:text-sky-400 mb-1">
                    Qiziqarli fakt
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {activeContinentFact.funFact}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
              {selectedContinent} bo‘yicha asosiy davlatlar:
            </p>
            {featuredInContinent.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Antarktida — xalqaro ilmiy tadqiqot hududi.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {featuredInContinent.map((c) => (
                  <button
                    key={c.atlasName}
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setMode('countries');
                      setSelectedCountryName(c.atlasName);
                      onRecordMapVisit(c.atlasName);
                    }}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                      mode === 'countries' && selectedCountryName === c.atlasName
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {c.uzbekName}
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
