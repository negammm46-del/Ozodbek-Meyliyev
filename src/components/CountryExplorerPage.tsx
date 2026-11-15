import { useMemo, useState } from 'react';
import {
  Banknote,
  Heart,
  Landmark,
  Languages,
  MapPin,
  Search,
  Users,
  X,
} from 'lucide-react';
import { GEO_COUNTRIES, type GeoCountry } from '../data/geoWorldData';
import type { MapContinentId } from '../data/worldMapData';
import { CountryFlag } from './CountryFlag';
import { soundEngine } from '../utils/sound';

type ExplorerFilter = 'Barchasi' | MapContinentId;

const FILTERS: ExplorerFilter[] = [
  'Barchasi',
  'Osiyo',
  'Yevropa',
  'Afrika',
  'Shimoliy Amerika',
  'Janubiy Amerika',
  'Okeaniya',
];

interface CountryExplorerPageProps {
  selectedCountry: GeoCountry;
  onSelectCountry: (country: GeoCountry) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  initialSearch?: string;
}

export function CountryExplorerPage({
  selectedCountry,
  onSelectCountry,
  favorites,
  onToggleFavorite,
  initialSearch = '',
}: CountryExplorerPageProps) {
  const [continentFilter, setContinentFilter] =
    useState<ExplorerFilter>('Barchasi');
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  const filteredCountries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return GEO_COUNTRIES.filter((c) => {
      if (onlyFavorites && !favorites.includes(c.id)) return false;
      if (continentFilter !== 'Barchasi' && c.continent !== continentFilter) {
        return false;
      }
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.capital.toLowerCase().includes(q) ||
        c.languages.toLowerCase().includes(q) ||
        c.continent.toLowerCase().includes(q)
      );
    });
  }, [continentFilter, searchQuery, onlyFavorites, favorites]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-1">
            Davlatlar katalogi · {GEO_COUNTRIES.length} ta mamlakat
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Har bir davlat haqida batafsil ma’lumot
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-1 max-w-[65ch]">
            Milliy bayroqlar, poytaxtlar, rasmiy tillar, valyutalar, mashhur
            obidalar va qiziqarli geografik dalillar.
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Davlat, poytaxt yoki til..."
              aria-label="Davlatlarni qidirish"
              className="w-full pl-9 pr-8 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-sky-600"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Tozalash"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setOnlyFavorites((prev) => !prev);
            }}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 ${
              onlyFavorites
                ? 'bg-rose-600 text-white border-rose-600'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Heart
              className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-white' : ''}`}
            />
            Sevimlilar ({favorites.length})
          </button>
        </div>
      </div>

      <div
        className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-200/70 dark:bg-slate-800/80 rounded-xl w-fit"
        role="tablist"
        aria-label="Qit’a bo‘yicha filtrlash"
      >
        {FILTERS.map((filter) => {
          const isActive = continentFilter === filter;
          return (
            <button
              key={filter}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => {
                soundEngine.playClick();
                setContinentFilter(filter);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {filter}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7">
          {filteredCountries.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                Tanlangan mezon bo‘yicha davlat topilmadi.
              </p>
              <button
                type="button"
                onClick={() => {
                  setContinentFilter('Barchasi');
                  setSearchQuery('');
                  setOnlyFavorites(false);
                }}
                className="text-sm font-semibold text-sky-600 dark:text-sky-400 hover:underline"
              >
                Filtrlarni tiklash
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredCountries.map((country) => {
                const isSelected = country.id === selectedCountry.id;
                const isFav = favorites.includes(country.id);
                return (
                  <div
                    key={country.id}
                    onClick={() => {
                      soundEngine.playClick();
                      onSelectCountry(country);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectCountry(country);
                      }
                    }}
                    className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-sky-50/80 dark:bg-sky-950/40 border-sky-600'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <CountryFlag
                          code={country.code}
                          name={country.name}
                          className="w-10 h-7"
                        />
                        <div className="min-w-0">
                          <h2 className="font-display text-base font-bold text-slate-900 dark:text-white truncate">
                            {country.name}
                          </h2>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {country.capital} · {country.continent}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          soundEngine.playClick();
                          onToggleFavorite(country.id);
                        }}
                        aria-label={`${country.name} sevimlilarga`}
                        className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors shrink-0"
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            isFav ? 'fill-rose-500 text-rose-500' : ''
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                      <span>{country.population}</span>
                      <span aria-hidden="true">·</span>
                      <span>{country.areaKm2}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <aside className="lg:col-span-5 lg:sticky lg:top-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3.5">
              <CountryFlag
                code={selectedCountry.code}
                name={selectedCountry.name}
                className="w-14 h-9"
              />
              <div>
                <p className="text-xs font-medium text-sky-700 dark:text-sky-400">
                  {selectedCountry.continent}
                </p>
                <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                  {selectedCountry.name}
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onToggleFavorite(selectedCountry.id);
              }}
              aria-label="Sevimli davlat sifatida belgilash"
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-500 transition-colors shrink-0"
            >
              <Heart
                className={`w-4 h-4 ${
                  favorites.includes(selectedCountry.id)
                    ? 'fill-rose-500 text-rose-500'
                    : ''
                }`}
              />
            </button>
          </div>

          <dl className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">
                Poytaxti
              </dt>
              <dd className="text-sm font-semibold text-slate-900 dark:text-white">
                {selectedCountry.capital}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400 mb-0.5 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-sky-600" />
                Aholisi
              </dt>
              <dd className="font-mono text-sm font-semibold text-slate-900 dark:text-white tabular-nums">
                {selectedCountry.population}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">
                Maydoni
              </dt>
              <dd className="font-mono text-sm font-semibold text-slate-900 dark:text-white tabular-nums">
                {selectedCountry.areaKm2}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400 mb-0.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-sky-600" />
                Koordinatasi
              </dt>
              <dd className="font-mono text-xs font-medium text-slate-700 dark:text-slate-300 tabular-nums">
                {selectedCountry.coordinates}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400 mb-0.5 flex items-center gap-1">
                <Languages className="w-3.5 h-3.5 text-emerald-600" />
                Tillari
              </dt>
              <dd className="text-xs font-semibold text-slate-900 dark:text-white">
                {selectedCountry.languages}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400 mb-0.5 flex items-center gap-1">
                <Banknote className="w-3.5 h-3.5 text-indigo-500" />
                Valyutasi
              </dt>
              <dd className="text-xs font-semibold text-slate-900 dark:text-white">
                {selectedCountry.currency}
              </dd>
            </div>
          </dl>

          <div>
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              Geografik tavsif
            </h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {selectedCountry.shortNote}
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
            <p className="text-xs font-semibold text-sky-700 dark:text-sky-400 mb-1">
              Qiziqarli fakt
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {selectedCountry.funFact}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2.5 flex items-center gap-1.5">
              <Landmark className="w-3.5 h-3.5 text-amber-500" />
              Mashhur diqqatga sazovor joylar
            </h3>
            <div className="space-y-2.5">
              {selectedCountry.landmarks.map((lm) => (
                <div
                  key={lm.name}
                  className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80"
                >
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {lm.name}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    {lm.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
