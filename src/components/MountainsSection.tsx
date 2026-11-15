import { useMemo, useState } from 'react';
import { Mountain } from 'lucide-react';
import { MOUNTAINS, type MountainItem } from '../data/geographyData';
import { ResilientImage } from './ResilientImage';

type OriginFilter = 'Barchasi' | 'Burmali' | 'Vulkanik' | 'Qalqonsimon';

const ORIGIN_FILTERS: OriginFilter[] = [
  'Barchasi',
  'Burmali',
  'Vulkanik',
  'Qalqonsimon',
];

export function MountainsSection() {
  const [originFilter, setOriginFilter] = useState<OriginFilter>('Barchasi');
  const [selectedPeak, setSelectedPeak] = useState<MountainItem>(MOUNTAINS[0]);

  const filteredMountains = useMemo(() => {
    if (originFilter === 'Barchasi') return MOUNTAINS;
    return MOUNTAINS.filter((m) => m.originType === originFilter);
  }, [originFilter]);

  return (
    <section id="toglar" className="py-16 border-b border-slate-200 bg-white">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <p className="text-sm font-medium text-sky-700 mb-2">
              03. Litosfera va relyef
            </p>
            <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900">
              Dunyoning eng baland tog‘lari va cho‘qqilari
            </h2>
            <p className="text-base text-slate-600 mt-2 max-w-[65ch]">
              Tog‘lar Yer po‘stining tektonik plitalari to‘qnashuvi yoki vulqon
              faoliyati natijasida paydo bo‘ladi. Har bir cho‘qqi ustiga bosib
              balandligini taqqoslang.
            </p>
          </div>

          <div
            className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit shrink-0"
            role="tablist"
            aria-label="Tog‘ kelib chiqishi bo‘yicha filtrlash"
          >
            {ORIGIN_FILTERS.map((origin) => {
              const isActive = originFilter === origin;
              return (
                <button
                  key={origin}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setOriginFilter(origin)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {origin}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-5 flex flex-col gap-5">
            <ResilientImage
              src="/src/assets/images/mountain_elevation_range_1794721505709.jpg"
              alt="Himolay tog‘ tizmasining qorli baland cho‘qqilari"
              caption="Balandlik oshgani sari har 1 000 metrda havo harorati o‘rtacha 6°C ga pasayadi."
              fallbackTitle="Himolay Tog‘ Tizmasi"
              className="rounded-xl border border-slate-200 aspect-[4/3] bg-slate-900"
            />

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="text-xs font-medium text-amber-700 mb-1">
                      {selectedPeak.range} · {selectedPeak.originType} tog‘
                    </p>
                    <h3 className="font-display text-2xl font-bold text-slate-900">
                      {selectedPeak.name}
                    </h3>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
                      {selectedPeak.elevationM.toLocaleString('uz-UZ')} m
                    </p>
                    <p className="text-xs text-slate-500">dengiz sathidan</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                  <span>{selectedPeak.continent}</span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedPeak.countries}</span>
                </div>

                <p className="text-sm text-slate-700 leading-relaxed mb-4">
                  {selectedPeak.teacherSummary}
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <p className="text-xs font-semibold text-amber-700 mb-1">
                  Geografik fakt
                </p>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {selectedPeak.funFact}
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-xl p-6">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Mountain className="w-5 h-5 text-amber-700 shrink-0" />
                <h3 className="font-display text-lg font-semibold text-slate-900">
                  Balandlik profili taqqoslanishi
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-mono tabular-nums">
                Shkalasi: 0 – 9 000 m
              </span>
            </div>

            <div className="space-y-3">
              {filteredMountains.map((peak) => {
                const isSelected = selectedPeak.id === peak.id;
                const widthPct = Math.round((peak.elevationM / 9000) * 100);
                return (
                  <button
                    key={peak.id}
                    type="button"
                    onClick={() => setSelectedPeak(peak)}
                    className={`w-full text-left p-4 rounded-xl border transition-colors ${
                      isSelected
                        ? 'bg-white border-amber-600 shadow-xs'
                        : 'bg-white/70 border-slate-200 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-3 mb-2">
                      <div>
                        <span className="font-display font-semibold text-base text-slate-900 mr-2">
                          {peak.name}
                        </span>
                        <span className="text-xs text-slate-500">
                          {peak.range} · {peak.continent}
                        </span>
                      </div>
                      <span className="font-mono text-sm font-semibold text-slate-900 tabular-nums shrink-0">
                        {peak.elevationM.toLocaleString('uz-UZ')} m
                      </span>
                    </div>

                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isSelected ? 'bg-amber-600' : 'bg-slate-400'
                        }`}
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 pt-5 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
              <div>
                <p className="font-semibold text-slate-900 mb-1">
                  Burmali tog‘lar qanday hosil bo‘ladi?
                </p>
                <p className="leading-relaxed">
                  Ikki litosfera plitasi sekin-asta bir-biriga urilganda Yer
                  qobig‘i qatlamlari burmalanib yuqoriga ko‘tariladi (Himolay,
                  Alp, Tyan-Shan).
                </p>
              </div>
              <div>
                <p className="font-semibold text-slate-900 mb-1">
                  Vulkanik tog‘lar farqi nimada?
                </p>
                <p className="leading-relaxed">
                  Yer qa’ridan chiqqan magma va kul qatlam-qatlam yig‘ilib,
                  konussimon yakka baland cho‘qqilarni hosil qiladi (Kilimanjaro,
                  Elbrus, Fudzi).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
