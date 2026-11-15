import { useState } from 'react';
import { Waves, Layers } from 'lucide-react';
import { OCEANS, OCEAN_ZONES } from '../data/geographyData';
import { ResilientImage } from './ResilientImage';

export function OceansSection() {
  const [selectedOceanId, setSelectedOceanId] = useState(OCEANS[0].id);
  const [selectedZoneIndex, setSelectedZoneIndex] = useState(0);

  const selectedOcean =
    OCEANS.find((o) => o.id === selectedOceanId) ?? OCEANS[0];
  const selectedZone = OCEAN_ZONES[selectedZoneIndex] ?? OCEAN_ZONES[0];

  return (
    <section id="okeanlar" className="py-16 border-b border-slate-200 bg-slate-50">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="mb-10">
          <p className="text-sm font-medium text-sky-700 mb-2">
            02. Gidrosfera va Dunyo okeani
          </p>
          <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900">
            Beshta buyuk okean va suvosti qatlamlari
          </h2>
          <p className="text-base text-slate-600 mt-2 max-w-[68ch]">
            Yer yuzasidagi barcha okeanlar o‘zaro tutashib, yagona Dunyo okeanini
            tashkil qiladi. Okeanlarni taqqoslang va chuqurlik bo‘ylab pastga
            tushib ko‘ring.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mb-12">
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-4 mb-5">
                <h3 className="font-display text-xl font-semibold text-slate-900">
                  Okeanlar maydoni va chuqurligi
                </h3>
                <Waves className="w-5 h-5 text-sky-700 shrink-0" />
              </div>

              <div className="space-y-3">
                {OCEANS.map((ocean) => {
                  const isActive = ocean.id === selectedOcean.id;
                  const barWidth = Math.round((ocean.areaMillionKm2 / 165.2) * 100);
                  return (
                    <button
                      key={ocean.id}
                      type="button"
                      onClick={() => setSelectedOceanId(ocean.id)}
                      className={`w-full text-left p-3.5 rounded-lg border transition-colors ${
                        isActive
                          ? 'bg-sky-50/70 border-sky-700'
                          : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/70'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-display font-semibold text-sm text-slate-900">
                          {ocean.name}
                        </span>
                        <span className="font-mono text-xs font-medium text-slate-600 tabular-nums">
                          {ocean.areaMillionKm2.toFixed(1)} mln km² · {ocean.sharePercent}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isActive ? 'bg-sky-700' : 'bg-sky-500/70'
                          }`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-200">
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                <h4 className="font-display text-lg font-bold text-slate-900">
                  {selectedOcean.name}
                </h4>
                <span className="font-mono text-xs text-sky-700 font-medium tabular-nums">
                  Harorat: {selectedOcean.tempRange}
                </span>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed mb-4">
                {selectedOcean.teacherSummary}
              </p>

              <dl className="grid grid-cols-3 gap-3 bg-slate-50 border border-slate-200 rounded-lg p-3.5 mb-3">
                <div>
                  <dt className="text-[11px] text-slate-500">O‘rtacha chuqurlik</dt>
                  <dd className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                    {selectedOcean.avgDepthM.toLocaleString('uz-UZ')} m
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] text-slate-500">Eng chuqur joyi</dt>
                  <dd className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                    {selectedOcean.maxDepthM.toLocaleString('uz-UZ')} m
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] text-slate-500">Botiq nomi</dt>
                  <dd className="text-xs font-semibold text-slate-800 truncate">
                    {selectedOcean.deepestPoint}
                  </dd>
                </div>
              </dl>

              <p className="text-xs text-slate-600 leading-relaxed">
                <strong className="text-slate-900">Fakt:</strong> {selectedOcean.funFact}
              </p>
            </div>
          </div>

          <div className="lg:col-span-6 flex flex-col gap-5">
            <ResilientImage
              src="/src/assets/images/ocean_deep_trench_1794721505698.jpg"
              alt="Okean chuqurligi qatlamlari: quyoshli qatlamdan Mariana botig‘igacha"
              caption="Okean chuqurlashgani sari quyosh nuri yo‘qoladi, suv soviydi va bosim ming barobargacha ortadi."
              fallbackTitle="Okean Chuqurlik Qatlamlari Diagrammasi"
              className="rounded-xl border border-slate-200 aspect-[4/3] bg-slate-900"
            />

            <div className="bg-white border border-slate-200 rounded-xl p-6 flex-1">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-700 shrink-0" />
                  <h3 className="font-display text-base font-semibold text-slate-900">
                    Chuqurlik qatlamini tanlang
                  </h3>
                </div>
                <span className="font-mono text-xs font-medium text-sky-700 tabular-nums">
                  {selectedZone.depthRange}
                </span>
              </div>

              <div className="mb-4">
                <label htmlFor="ocean-depth-slider" className="sr-only">
                  Okean chuqurlik qatlami
                </label>
                <input
                  id="ocean-depth-slider"
                  type="range"
                  min={0}
                  max={OCEAN_ZONES.length - 1}
                  step={1}
                  value={selectedZoneIndex}
                  onChange={(e) => setSelectedZoneIndex(Number(e.target.value))}
                  className="w-full accent-sky-700 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] font-mono text-slate-500 mt-1 tabular-nums">
                  <span>0 m</span>
                  <span>200 m</span>
                  <span>1 000 m</span>
                  <span>4 000 m</span>
                  <span>10 984 m</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <h4 className="font-display text-base font-bold text-slate-900 mb-2">
                  {selectedZone.name}
                </h4>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mb-2.5">
                  <span>Yorug‘lik: {selectedZone.sunlight}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    Bosim: {selectedZone.pressureAtm}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    Harorat: {selectedZone.temperature}
                  </span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {selectedZone.lifeSummary}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
