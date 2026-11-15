import { useState } from 'react';
import { Trees } from 'lucide-react';
import { NATURE_WONDERS } from '../data/geographyData';
import { ResilientImage } from './ResilientImage';

export function NatureSection() {
  const [selectedId, setSelectedId] = useState(NATURE_WONDERS[0].id);
  const activeWonder =
    NATURE_WONDERS.find((item) => item.id === selectedId) ?? NATURE_WONDERS[0];

  return (
    <section id="tabiat" className="py-16 border-b border-slate-200 bg-slate-50">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="mb-10">
          <p className="text-sm font-medium text-emerald-700 mb-2">
            04. Biosfera va iqlim mintaqalari
          </p>
          <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900">
            Tabiat zonalari va sayyora mo‘jizalari
          </h2>
          <p className="text-base text-slate-600 mt-2 max-w-[68ch]">
            Ekvatordan qutblarga tomon harorat va namlik o‘zgarishi natijasida
            o‘rmonlar, savannalar, cho‘llar va muz sahrolari almashinib boradi.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-6 flex flex-col gap-5">
            <ResilientImage
              src="/src/assets/images/nature_biomes_amazon_1794721505569.jpg"
              alt="Amazonka tropik o‘rmonlari uzra ilonizi daryo manzarasi"
              caption="Amazonka havzasi sayyoramizdagi eng boy biologik xilma-xillik markazidir."
              fallbackTitle="Amazonka Tropik O‘rmonlari"
              className="rounded-xl border border-slate-200 aspect-[4/3] bg-emerald-950"
            />

            <div className="bg-white border border-slate-200 rounded-xl p-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <p className="text-xs font-medium text-emerald-700 mb-1">
                      {activeWonder.biome} · {activeWonder.region}
                    </p>
                    <h3 className="font-display text-2xl font-bold text-slate-900">
                      {activeWonder.name}
                    </h3>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[11px] text-slate-500">
                      {activeWonder.keyMetricLabel}
                    </p>
                    <p className="font-mono text-lg font-bold text-slate-900 tabular-nums">
                      {activeWonder.keyMetricValue}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-500 mb-4">
                  Iqlim turi: {activeWonder.climateType}
                </p>

                <p className="text-sm text-slate-700 leading-relaxed mb-4">
                  {activeWonder.teacherSummary}
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="text-xs font-semibold text-emerald-700 mb-1">
                  Tabiat siri
                </p>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {activeWonder.funFact}
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 flex flex-col justify-between gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {NATURE_WONDERS.map((wonder) => {
                const isSelected = wonder.id === activeWonder.id;
                return (
                  <button
                    key={wonder.id}
                    type="button"
                    onClick={() => setSelectedId(wonder.id)}
                    className={`text-left p-5 rounded-xl border transition-colors flex flex-col justify-between ${
                      isSelected
                        ? 'bg-white border-emerald-700 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-medium text-emerald-700 mb-1">
                        {wonder.biome}
                      </p>
                      <h4 className="font-display text-lg font-semibold text-slate-900 mb-2">
                        {wonder.name}
                      </h4>
                      <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed mb-4">
                        {wonder.teacherSummary}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
                      <span>{wonder.region}</span>
                      <span className="font-mono font-semibold text-slate-800 tabular-nums shrink-0">
                        {wonder.keyMetricValue}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-start gap-4">
              <Trees className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-display text-sm font-semibold text-slate-900 mb-1">
                  O‘qituvchi eslatmasi: Iqlim va tabiat bog‘liqligi
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Ekvatorga yaqin joylarda quyosh nuri tik tushadi — shuning
                  uchun bu yerda doimiy yashil Amazonka o‘rmonlari o‘sadi.
                  30-kengliklarda esa havo pastga tushib quruqlashadi va Sahroi
                  Kabir kabi buyuk cho‘llar paydo bo‘ladi.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
