import { useMemo, useRef, useState } from 'react';
import {
  geoGraticule10,
  geoNaturalEarth1,
  geoPath,
  type GeoPermissibleObjects,
} from 'd3-geo';
import { feature } from 'topojson-client';
import {
  Compass,
  Globe2,
  MapPin,
  Minus,
  Plus,
  RotateCcw,
} from 'lucide-react';
import countriesAtlas from 'world-atlas/countries-110m.json';
import {
  ATLAS_NAME_TO_CONTINENT,
  CONTINENT_FACTS,
  FEATURED_ATLAS_COUNTRIES,
  getCountryFactByAtlasName,
  type MapContinentId,
} from '../data/worldMapData';

type MapMode = 'countries' | 'continents';

type TopologyInput = Parameters<typeof feature>[0];
type GeoObjectInput = Parameters<typeof feature>[1];

interface AtlasFeature {
  id?: string | number;
  properties: {
    name?: string;
  };
  geometry: GeoPermissibleObjects;
  type: 'Feature';
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

export function WorldMapSection() {
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

  const featuredSet = useMemo(
    () => new Set(FEATURED_ATLAS_COUNTRIES),
    []
  );

  const { countries, pathGenerator, graticulePath, spherePath } = useMemo(() => {
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
      const d = generator(feat as unknown as GeoPermissibleObjects) ?? '';
      const centroid = generator.centroid(
        feat as unknown as GeoPermissibleObjects
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
      pathGenerator: generator,
      graticulePath: grat,
      spherePath: sphere,
    };
  }, []);

  void pathGenerator;

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
    setZoom((prev) => {
      const next = Math.max(1, Math.min(4, Number((prev + delta).toFixed(2))));
      setPan((p) => clampPan(p.x, p.y, next));
      return next;
    });
  }

  function handleResetView() {
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
    if (mode === 'continents') {
      setSelectedContinent(continent);
    } else {
      setSelectedCountryName(atlasName);
      setSelectedContinent(continent);
    }
  }

  function handleSelectFeaturedCountry(atlasName: string) {
    setMode('countries');
    setSelectedCountryName(atlasName);
    setSelectedContinent(ATLAS_NAME_TO_CONTINENT[atlasName] ?? 'Osiyo');
  }

  const transformString = `translate(${MAP_WIDTH / 2 + pan.x}, ${
    MAP_HEIGHT / 2 + pan.y
  }) scale(${zoom}) translate(${-MAP_WIDTH / 2}, ${-MAP_HEIGHT / 2})`;

  return (
    <section id="xarita" className="py-16 border-b border-slate-200 bg-slate-50">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <p className="text-sm font-medium text-sky-700 mb-2">
              Interaktiv dunyo atlasi
            </p>
            <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900">
              Xarita orqali qit’alar va davlatlarni o‘rganing
            </h2>
            <p className="text-base text-slate-600 mt-2 max-w-[65ch]">
              Qit’a yoki davlat ustiga bosing — o‘qituvchi izohi va asosiy
              geografik dalillar yon panelda darhol ochiladi.
            </p>
          </div>

          <div
            className="flex items-center gap-1 p-1 bg-slate-200/75 rounded-lg w-fit shrink-0"
            role="tablist"
            aria-label="Xarita ko‘rish rejimi"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'countries'}
              onClick={() => setMode('countries')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                mode === 'countries'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Davlatlar bo‘yicha
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'continents'}
              onClick={() => setMode('continents')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                mode === 'continents'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Qit’alar bo‘yicha
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div
              ref={svgContainerRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={() => {
                handlePointerUp();
                setHoveredName(null);
              }}
              className={`relative bg-white border border-slate-200 rounded-xl overflow-hidden select-none ${
                zoom > 1
                  ? isDragging
                    ? 'cursor-grabbing'
                    : 'cursor-grab'
                  : 'cursor-default'
              }`}
            >
              <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-lg p-1 shadow-xs">
                <button
                  type="button"
                  onClick={() => handleZoomStep(0.5)}
                  disabled={zoom >= 4}
                  aria-label="Xaritani kattalashtirish"
                  className="p-1.5 rounded-md text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleZoomStep(-0.5)}
                  disabled={zoom <= 1}
                  aria-label="Xaritani kichiklashtirish"
                  className="p-1.5 rounded-md text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                {zoom > 1 && (
                  <button
                    type="button"
                    onClick={handleResetView}
                    aria-label="Xarita ko‘rinishini tiklash"
                    className="px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md inline-flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Tiklash
                  </button>
                )}
              </div>

              <svg
                viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
                className="w-full h-auto block bg-slate-50"
                role="img"
                aria-label="Dunyo qit’alari va davlatlarining interaktiv xaritasi"
              >
                <g transform={transformString}>
                  <path
                    d={spherePath}
                    fill="#F1F5F9"
                    stroke="#CBD5E1"
                    strokeWidth={1 / zoom}
                  />
                  <path
                    d={graticulePath}
                    fill="none"
                    stroke="#E2E8F0"
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

                    let fill = '#E2E8F0';
                    if (mode === 'countries') {
                      if (isSelectedCountry) fill = '#0369A1';
                      else if (isHoveredCountry) fill = '#0284C7';
                      else if (isFeatured) fill = '#BAE6FD';
                      else fill = '#E2E8F0';
                    } else {
                      if (isSelectedContinent) fill = '#0369A1';
                      else if (isHoveredContinent) fill = '#38BDF8';
                      else fill = '#DCE7F1';
                    }

                    return (
                      <path
                        key={item.key}
                        d={item.d}
                        fill={fill}
                        stroke={
                          isSelectedCountry || isSelectedContinent
                            ? '#0C4A6E'
                            : '#FFFFFF'
                        }
                        strokeWidth={
                          (isSelectedCountry ? 1.1 : 0.55) / zoom
                        }
                        className="cursor-pointer transition-colors duration-150 outline-none"
                        tabIndex={isFeatured || mode === 'continents' ? 0 : -1}
                        aria-label={`${
                          getCountryFactByAtlasName(item.atlasName).uzbekName
                        } (${item.continent})`}
                        onMouseEnter={() => setHoveredName(item.atlasName)}
                        onClick={() =>
                          handleRegionClick(item.atlasName, item.continent)
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleRegionClick(item.atlasName, item.continent);
                          }
                        }}
                      />
                    );
                  })}

                  {mode === 'countries' &&
                    selectedCountryFeature?.centroid && (
                      <g
                        transform={`translate(${selectedCountryFeature.centroid[0]}, ${selectedCountryFeature.centroid[1]})`}
                        className="pointer-events-none"
                      >
                        <circle
                          r={6 / zoom}
                          fill="#FFFFFF"
                          fillOpacity={0.9}
                        />
                        <circle r={3.5 / zoom} fill="#D97706" />
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

              <div className="px-4 py-2.5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-xs bg-sky-700 inline-block" />
                    Tanlangan hudud
                  </span>
                  {mode === 'countries' && (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-xs bg-sky-200 border border-sky-300 inline-block" />
                      Batafsil faktli davlatlar
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-xs bg-slate-200 inline-block" />
                    Barcha hududlar bosiladigan
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
                      setMode('continents');
                      setSelectedContinent(continent);
                    }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'bg-sky-700 text-white border-sky-700'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {continent}
                  </button>
                );
              })}
            </div>
          </div>

          <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
            {mode === 'countries' ? (
              <div>
                <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200">
                  <div>
                    <p className="text-xs font-medium text-sky-700 mb-1">
                      Tanlangan davlat · {activeCountryFact.continent}
                    </p>
                    <h3 className="font-display text-2xl font-bold text-slate-900">
                      {activeCountryFact.uzbekName}
                    </h3>
                  </div>
                  <Globe2 className="w-5 h-5 text-sky-700 shrink-0 mt-1" />
                </div>

                {(activeCountryFact.capital ||
                  activeCountryFact.areaKm2 ||
                  activeCountryFact.population) && (
                  <dl className="grid grid-cols-2 gap-4 py-4 border-b border-slate-200">
                    {activeCountryFact.capital && (
                      <div>
                        <dt className="text-xs text-slate-500 mb-0.5">
                          Poytaxti
                        </dt>
                        <dd className="text-sm font-semibold text-slate-900">
                          {activeCountryFact.capital}
                        </dd>
                      </div>
                    )}
                    {activeCountryFact.population && (
                      <div>
                        <dt className="text-xs text-slate-500 mb-0.5">
                          Aholisi
                        </dt>
                        <dd className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                          {activeCountryFact.population}
                        </dd>
                      </div>
                    )}
                    {activeCountryFact.areaKm2 && (
                      <div>
                        <dt className="text-xs text-slate-500 mb-0.5">
                          Maydoni
                        </dt>
                        <dd className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                          {activeCountryFact.areaKm2}
                        </dd>
                      </div>
                    )}
                    {activeCountryFact.coordinates && (
                      <div>
                        <dt className="text-xs text-slate-500 mb-0.5">
                          Koordinatasi
                        </dt>
                        <dd className="font-mono text-xs font-medium text-slate-700 tabular-nums inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-sky-700 shrink-0" />
                          {activeCountryFact.coordinates}
                        </dd>
                      </div>
                    )}
                  </dl>
                )}

                <div className="py-4 space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 mb-1.5">
                      O‘qituvchi izohi
                    </h4>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {activeCountryFact.shortNote}
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <p className="text-xs font-semibold text-sky-700 mb-1">
                      Qiziqarli fakt
                    </p>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {activeCountryFact.funFact}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200">
                  <div>
                    <p className="text-xs font-medium text-sky-700 mb-1">
                      Tanlangan qit’a
                    </p>
                    <h3 className="font-display text-2xl font-bold text-slate-900">
                      {activeContinentFact.name}
                    </h3>
                  </div>
                  <Compass className="w-5 h-5 text-sky-700 shrink-0 mt-1" />
                </div>

                <dl className="grid grid-cols-2 gap-4 py-4 border-b border-slate-200">
                  <div>
                    <dt className="text-xs text-slate-500 mb-0.5">Maydoni</dt>
                    <dd className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                      {activeContinentFact.areaKm2}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500 mb-0.5">Aholisi</dt>
                    <dd className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                      {activeContinentFact.population}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500 mb-0.5">
                      Eng baland cho‘qqi
                    </dt>
                    <dd className="text-xs font-semibold text-slate-900">
                      {activeContinentFact.highestPeak}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500 mb-0.5">
                      Eng uzun daryo
                    </dt>
                    <dd className="text-xs font-semibold text-slate-900">
                      {activeContinentFact.longestRiver}
                    </dd>
                  </div>
                </dl>

                <div className="py-4 space-y-4">
                  <p className="text-xs text-slate-500">
                    Davlatlar soni: {activeContinentFact.countriesCount}
                  </p>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {activeContinentFact.teacherSummary}
                  </p>

                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <p className="text-xs font-semibold text-sky-700 mb-1">
                      Qiziqarli fakt
                    </p>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {activeContinentFact.funFact}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-200">
              <p className="text-xs font-medium text-slate-500 mb-2.5">
                {selectedContinent} bo‘yicha asosiy davlatlar:
              </p>
              {featuredInContinent.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Antarktida hech bir davlatga tegishli bo‘lmagan xalqaro ilmiy
                  hududdir.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {featuredInContinent.map((c) => (
                    <button
                      key={c.atlasName}
                      type="button"
                      onClick={() => handleSelectFeaturedCountry(c.atlasName)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                        mode === 'countries' &&
                        selectedCountryName === c.atlasName
                          ? 'bg-sky-700 text-white border-sky-700'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
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
    </section>
  );
}
