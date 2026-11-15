import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Bot,
  Camera,
  CheckCircle2,
  Compass,
  Info,
  Landmark,
  MapPin,
  Scale,
  Sparkles,
} from 'lucide-react';
import { type DependentTerritory } from '../data/academyData';
import { formatAreaUz, formatCoordLabel } from '../data/sovereignStatesCatalog';
import { CountryFlag } from './CountryFlag';
import { CountryLocatorMap } from './CountryLocatorMap';
import { soundEngine } from '../utils/sound';

interface TerritoryLessonViewProps {
  territory: DependentTerritory;
  isCompleted: boolean;
  onBack: () => void;
  onComplete: (id: string) => void;
  onAskGeoAI: (prompt: string) => void;
}

export function TerritoryLessonView({
  territory,
  isCompleted,
  onBack,
  onComplete,
  onAskGeoAI,
}: TerritoryLessonViewProps) {
  const [images, setImages] = useState<Array<{ url: string; title: string }>>([]);
  const [broken, setBroken] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let active = true;
    setImages([]);
    setBroken({});
    fetch(
      `/api/country-live/${encodeURIComponent(territory.iso2)}?wiki=${encodeURIComponent(
        territory.nameEn
      )}`
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (active && json && Array.isArray(json.images)) {
          setImages(json.images);
        }
      })
      .catch(() => {
        // Fallback handled silently
      });
    return () => {
      active = false;
    };
  }, [territory.iso2, territory.nameEn]);

  const validImages = images.filter((img) => !broken[img.url]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            onBack();
          }}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>2-bosqich hududlariga qaytish</span>
        </button>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onAskGeoAI(
                `${territory.nameUz} (${territory.nameEn}) ning siyosiy maqomi va nima sababdan mustaqil davlat emasligini oddiy tilda tushuntirib ber.`
              );
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>AI Ustoz tahlili</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playSuccess();
              onComplete(territory.id);
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              isCompleted
                ? 'bg-emerald-600 text-white'
                : 'bg-sky-600 hover:bg-sky-700 text-white'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isCompleted ? 'O‘rganildi' : 'Hududni yakunlash (+35 XP)'}</span>
          </button>
        </div>
      </div>

      {/* Header */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <CountryFlag
            code={territory.iso2}
            name={territory.nameUz}
            className="w-28 h-20 sm:w-32 sm:h-22 rounded-lg shadow-sm"
          />
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              2-BOSQICH · MUSTAQIL BO‘LMAGAN / AVTONOM HUDUD
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              {territory.nameUz} ({territory.nameEn})
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Boshqaruv tizimi: <strong>{territory.administeringStateUz}</strong> · Ma’muriy markaz:{' '}
              <strong>{territory.adminCenterUz}</strong>
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Oxirgi yangilanish: <span className="font-mono tabular-nums">{territory.lastUpdated}</span> · Manbalar:{' '}
              {territory.sources.join(', ')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <p className="text-xs text-slate-500 dark:text-slate-400">Maydoni</p>
            <p className="mt-1 font-mono text-base font-bold text-slate-900 dark:text-white tabular-nums">
              {formatAreaUz(territory.areaKm2)}
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <p className="text-xs text-slate-500 dark:text-slate-400">Aholisi</p>
            <p className="mt-1 font-mono text-base font-bold text-slate-900 dark:text-white tabular-nums">
              {territory.populationUz}
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <p className="text-xs text-slate-500 dark:text-slate-400">Joylashuv mintaqasi</p>
            <p className="mt-1 text-xs font-semibold text-slate-900 dark:text-white">
              {territory.regionUz}
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <p className="text-xs text-slate-500 dark:text-slate-400">Koordinatalari</p>
            <p className="mt-1 font-mono text-sm font-bold text-slate-900 dark:text-white tabular-nums">
              {formatCoordLabel(territory.lat, territory.lng)}
            </p>
          </div>
        </div>
      </section>

      {/* Locator Map & Status Explanation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-sky-600" />
            <span>Geografik joylashuvi</span>
          </h2>
          <CountryLocatorMap
            mode="locator"
            lat={territory.lat}
            lng={territory.lng}
            highlightLabel={`${territory.nameUz} · ${territory.adminCenterUz}`}
            initialZoom={2.2}
            heightClass="h-64"
          />
        </div>

        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-2.5">
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-amber-600" />
              <span>Siyosiy maqomi va nima uchun mustaqil davlat emas?</span>
            </h2>
            <p className="text-xs font-semibold text-sky-700 dark:text-sky-300">
              {territory.politicalStatusUz}
            </p>
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {territory.whyNotIndependentUz}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-2">
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-600" />
              <span>O‘ziga xos geografik xususiyatlari</span>
            </h2>
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {territory.uniqueGeoTraitsUz}
            </p>
          </div>
        </div>
      </div>

      {/* Facts & Surprising info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3">
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Info className="w-5 h-5 text-sky-600" />
            <span>Geografik faktlari</span>
          </h2>
          <ul className="space-y-2.5">
            {territory.geoFacts.map((f, i) => (
              <li
                key={i}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-sm text-slate-700 dark:text-slate-200"
              >
                <span className="font-mono text-xs font-bold text-sky-600 mr-2">
                  0{i + 1}.
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3">
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span>Qiziqarli ma’lumotlari</span>
          </h2>
          <ul className="space-y-2.5">
            {territory.surprisingFacts.map((f, i) => (
              <li
                key={i}
                className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50 text-sm text-slate-800 dark:text-amber-100"
              >
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Photos */}
      {validImages.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-sky-600" />
            <span>Hudud manzaralari</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {validImages.map((img) => (
              <figure
                key={img.url}
                className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50"
              >
                <img
                  src={img.url}
                  alt={territory.nameUz}
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  onError={() => setBroken((p) => ({ ...p, [img.url]: true }))}
                  className="w-full h-36 object-cover"
                />
                <figcaption className="p-2 text-xs text-slate-600 dark:text-slate-300 truncate">
                  {img.title}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      )}

      {validImages.length === 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <Landmark className="w-4 h-4 text-sky-600 shrink-0" />
          <span>
            Hududning barcha rasmiy ma’lumotlari neytral zamonaviy xalqaro standartlar asosida taqdim etildi.
          </span>
        </div>
      )}
    </div>
  );
}
