import { useMemo, useState } from 'react';
import { Search, MapPin, X } from 'lucide-react';
import { COUNTRIES, type Continent, type CountryItem } from '../data/geographyData';

const CONTINENTS: Continent[] = [
  'Barchasi',
  'Osiyo',
  'Yevropa',
  'Afrika',
  'Amerika',
  'Okeaniya',
];

export function CountriesSection() {
  const [selectedContinent, setSelectedContinent] = useState<Continent>('Barchasi');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCountry, setActiveCountry] = useState<CountryItem>(COUNTRIES[0]);

  const filteredCountries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return COUNTRIES.filter((country) => {
      const matchesContinent =
        selectedContinent === 'Barchasi' || country.continent === selectedContinent;
      const matchesQuery =
        q === '' ||
        country.name.toLowerCase().includes(q) ||
        country.capital.toLowerCase().includes(q) ||
        country.continent.toLowerCase().includes(q);
      return matchesContinent && matchesQuery;
    });
  }, [selectedContinent, searchQuery]);

  return (
    <section id="davlatlar" className="py-16 border-b border-slate-200 bg-white">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <p className="text-sm font-medium text-sky-700 mb-2">
              01. Siyosiy geografiya
            </p>
            <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900">
              Davlatlar va poytaxtlar
            </h2>
            <p className="text-base text-slate-600 mt-2 max-w-[65ch]">
              Har bir davlatning joylashuvi uning iqlimi, tili va hayot tarzini
              belgilaydi. Qit’ani tanlang yoki davlat va poytaxt nomini qidiring.
            </p>
          </div>

          <div className="relative w-full md:w-72 shrink-0">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Davlat yoki poytaxt..."
              aria-label="Davlat yoki poytaxtni qidirish"
              className="w-full pl-10 pr-9 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-700 focus:bg-white transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Qidiruvni tozalash"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div
          className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100 rounded-xl w-fit mb-8"
          role="tablist"
          aria-label="Qit’alar bo‘yicha filtrlash"
        >
          {CONTINENTS.map((continent) => {
            const isActive = selectedContinent === continent;
            return (
              <button
                key={continent}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setSelectedContinent(continent)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {continent}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7">
            {filteredCountries.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
                <p className="text-sm font-medium text-slate-700 mb-2">
                  Qidiruv bo‘yicha mos davlat topilmadi.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedContinent('Barchasi');
                    setSearchQuery('');
                  }}
                  className="text-sm font-semibold text-sky-700 hover:underline"
                >
                  Barcha davlatlarni ko‘rsatish
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredCountries.map((country) => {
                  const isSelected = activeCountry.id === country.id;
                  return (
                    <button
                      key={country.id}
                      type="button"
                      onClick={() => setActiveCountry(country)}
                      className={`text-left p-5 rounded-xl border transition-colors ${
                        isSelected
                          ? 'bg-sky-50/60 border-sky-700'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                      }`}
                    >
                      <div className="flex items-baseline justify-between gap-2 mb-1.5">
                        <h3 className="font-display text-lg font-semibold text-slate-900">
                          {country.name}
                        </h3>
                        <span className="text-xs font-medium text-sky-700 whitespace-nowrap shrink-0">
                          {country.capital}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 mb-3">
                        <span>{country.continent}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{country.areaKm2}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{country.populationM}</span>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                        {country.shortNote}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <aside className="lg:col-span-5 lg:sticky lg:top-24 bg-slate-50 border border-slate-200 rounded-xl p-6 sm:p-7">
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <p className="text-xs font-medium text-sky-700 mb-1">
                  O‘qituvchi izohi · {activeCountry.continent}
                </p>
                <h3 className="font-display text-2xl font-bold text-slate-900">
                  {activeCountry.name}
                </h3>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Poytaxti</p>
                <p className="font-display text-lg font-semibold text-slate-900">
                  {activeCountry.capital}
                </p>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-4 py-5 border-b border-slate-200">
              <div>
                <dt className="text-xs text-slate-500 mb-0.5">Maydoni</dt>
                <dd className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                  {activeCountry.areaKm2}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500 mb-0.5">Aholisi</dt>
                <dd className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                  {activeCountry.populationM}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500 mb-0.5">Rasmiy tili</dt>
                <dd className="text-sm font-medium text-slate-800">
                  {activeCountry.language}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500 mb-0.5">Koordinatasi</dt>
                <dd className="font-mono text-xs font-medium text-slate-700 tabular-nums inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-sky-700 shrink-0" />
                  {activeCountry.coordinates}
                </dd>
              </div>
            </dl>

            <div className="pt-5 space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-slate-500 mb-1.5">
                  Geografik xususiyati
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {activeCountry.shortNote}
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <p className="text-xs font-semibold text-sky-700 mb-1">
                  Qiziqarli fakt
                </p>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {activeCountry.funFact}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
