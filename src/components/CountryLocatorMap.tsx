import { useMemo, useState } from 'react';
import {
  geoGraticule10,
  geoNaturalEarth1,
  geoPath,
  type GeoPermissibleObjects,
} from 'd3-geo';
import { feature } from 'topojson-client';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import countriesAtlas from 'world-atlas/countries-110m.json';
import { getCountryFactByAtlasName } from '../data/worldMapData';

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

interface CountryLocatorMapProps {
  mode?: 'locator' | 'challenge';
  targetAtlasName?: string;
  lat?: number;
  lng?: number;
  highlightLabel?: string;
  initialZoom?: number;
  selectedAtlasName?: string | null;
  onSelectCountry?: (atlasName: string) => void;
  heightClass?: string;
}

const WIDTH = 820;
const HEIGHT = 420;

export function CountryLocatorMap({
  mode = 'locator',
  targetAtlasName,
  lat,
  lng,
  highlightLabel,
  initialZoom,
  selectedAtlasName,
  onSelectCountry,
  heightClass = 'h-64 sm:h-80',
}: CountryLocatorMapProps) {
  const [zoom, setZoom] = useState<number>(initialZoom ?? (mode === 'locator' ? 2.4 : 1));
  const [hoveredName, setHoveredName] = useState<string | null>(null);

  const { features, graticulePath, spherePath, projection } = useMemo(() => {
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

    const proj = geoNaturalEarth1().fitExtent(
      [
        [10, 10],
        [WIDTH - 10, HEIGHT - 10],
      ],
      { type: 'Sphere' }
    );
    const generator = geoPath(proj);

    const items = collection.features.map((feat, idx) => {
      const name = feat.properties?.name ?? `Area-${idx}`;
      return {
        key: `${feat.id ?? name}-${idx}`,
        atlasName: name,
        d: generator(feat as unknown as GeoPermissibleObjects) ?? '',
      };
    });

    return {
      features: items,
      graticulePath: generator(geoGraticule10()) ?? '',
      spherePath: generator({ type: 'Sphere' }) ?? '',
      projection: proj,
    };
  }, []);

  const markerXY = useMemo(() => {
    if (typeof lat !== 'number' || typeof lng !== 'number') return null;
    const projected = projection([lng, lat]);
    return projected && Number.isFinite(projected[0]) && Number.isFinite(projected[1])
      ? projected
      : null;
  }, [lat, lng, projection]);

  const viewTransform = useMemo(() => {
    if (zoom <= 1.05 || !markerXY || mode === 'challenge') {
      const cx = WIDTH / 2;
      const cy = HEIGHT / 2;
      return `translate(${cx} ${cy}) scale(${zoom}) translate(${-cx} ${-cy})`;
    }
    const cx = WIDTH / 2;
    const cy = HEIGHT / 2;
    const [mx, my] = markerXY;
    const clampedX = Math.max(WIDTH * 0.14, Math.min(WIDTH * 0.86, mx));
    const clampedY = Math.max(HEIGHT * 0.16, Math.min(HEIGHT * 0.84, my));
    return `translate(${cx} ${cy}) scale(${zoom}) translate(${-clampedX} ${-clampedY})`;
  }, [zoom, markerXY, mode]);

  const targetLower = targetAtlasName?.toLowerCase();
  const selectedLower = selectedAtlasName?.toLowerCase();

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-sky-50/70 dark:bg-slate-950">
      <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1">
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(5, +(z + 0.6).toFixed(1)))}
          aria-label="Xaritani kattalashtirish"
          className="p-1.5 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(1, +(z - 0.6).toFixed(1)))}
          aria-label="Xaritani kichiklashtirish"
          className="p-1.5 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setZoom(mode === 'locator' ? 2.4 : 1)}
          aria-label="Xaritani tiklash"
          className="p-1.5 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {hoveredName && mode === 'challenge' && (
        <div className="absolute top-2.5 left-2.5 z-10 px-2.5 py-1 rounded-lg bg-slate-900/90 text-white text-xs font-medium pointer-events-none">
          {getCountryFactByAtlasName(hoveredName)?.uzbekName ?? hoveredName}
        </div>
      )}

      {highlightLabel && mode === 'locator' && (
        <div className="absolute bottom-2.5 left-2.5 z-10 px-2.5 py-1 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100">
          {highlightLabel}
        </div>
      )}

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className={`w-full ${heightClass} block select-none`}
        role="img"
        aria-label={highlightLabel ? `${highlightLabel} xaritadagi joylashuvi` : 'Interaktiv dunyo xaritasi'}
      >
        <g transform={viewTransform} className="transition-transform duration-300 ease-out">
          <path d={spherePath} className="fill-sky-100 dark:fill-slate-900" />
          <path
            d={graticulePath}
            className="fill-none stroke-sky-200/80 dark:stroke-slate-800/70"
            strokeWidth={0.5 / Math.sqrt(zoom)}
          />
          {features.map((feat) => {
            const lower = feat.atlasName.toLowerCase();
            const isTarget = Boolean(targetLower && lower === targetLower);
            const isSelected = Boolean(selectedLower && lower === selectedLower);
            const isHovered = hoveredName === feat.atlasName;

            let fillClass = 'fill-slate-200 dark:fill-slate-700/80';
            if (isTarget) fillClass = 'fill-emerald-500 dark:fill-emerald-500';
            else if (isSelected) fillClass = 'fill-sky-500 dark:fill-sky-400';
            else if (isHovered) fillClass = 'fill-sky-300 dark:fill-sky-600';

            return (
              <path
                key={feat.key}
                d={feat.d}
                onMouseEnter={() => setHoveredName(feat.atlasName)}
                onMouseLeave={() => setHoveredName((prev) => (prev === feat.atlasName ? null : prev))}
                onClick={() => {
                  if (onSelectCountry) onSelectCountry(feat.atlasName);
                }}
                className={`${fillClass} stroke-white dark:stroke-slate-900 transition-colors ${
                  onSelectCountry ? 'cursor-pointer' : ''
                }`}
                strokeWidth={(isTarget || isSelected ? 1.1 : 0.45) / Math.sqrt(zoom)}
              />
            );
          })}

          {markerXY && (
            <g transform={`translate(${markerXY[0]} ${markerXY[1]})`}>
              <circle
                r={10 / Math.sqrt(zoom)}
                className="fill-rose-500/25 animate-ping"
              />
              <circle
                r={4.5 / Math.sqrt(zoom)}
                className="fill-rose-600 stroke-white"
                strokeWidth={1.5 / Math.sqrt(zoom)}
              />
            </g>
          )}
        </g>
      </svg>
    </div>
  );
}
