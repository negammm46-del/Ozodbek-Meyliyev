import { ArrowDownRight } from 'lucide-react';
import { PLANET_KPI_STATS } from '../data/geographyData';
import { ResilientImage } from './ResilientImage';

export function HeroSection() {
  return (
    <section
      id="bosh-sahifa"
      className="pt-12 pb-16 border-b border-slate-200 bg-slate-50"
    >
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-between py-2">
            <div>
              <p className="text-sm font-medium text-sky-700 mb-3">
                Geografiya darsligi · Interaktiv qo‘llanma
              </p>
              <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-[1.12] mb-5">
                Yer sayyorasini sodda va qiziqarli kashf eting
              </h1>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-[60ch] mb-8">
                Assalomu alaykum! Men sizning geografiya o‘qituvchingiz sifatida
                dunyo davlatlari, poytaxtlar, beshta buyuk okean, osmono‘par
                tog‘lar va tabiat mo‘jizalarini qisqa, tushunarli hamda yodda
                qoladigan dalillar bilan tushuntiraman.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <a
                href="#davlatlar"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-sky-700 rounded-lg hover:bg-sky-800 transition-colors whitespace-nowrap shrink-0"
              >
                Darsni boshlash
                <ArrowDownRight className="w-4 h-4" />
              </a>
              <a
                href="#viktorina"
                className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
              >
                Bilimni tekshirish
              </a>
            </div>
          </div>

          <div className="lg:col-span-6">
            <ResilientImage
              src="/src/assets/images/hero_world_atlas_1794721504517.jpg"
              alt="Dunyo materiklari, okean oqimlari va yer relefi xaritasi"
              caption="Yer yuzasining 71 foizini okean va dengizlar, 29 foizini esa oltita materik egallaydi."
              fallbackTitle="Dunyo Materiklari va Okeanlari Atlasi"
              className="rounded-xl border border-slate-200 aspect-[16/10] lg:aspect-auto lg:h-full bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
          {PLANET_KPI_STATS.map((stat) => (
            <div
              key={stat.label}
              className="bg-white border border-slate-200 rounded-xl p-5"
            >
              <p className="text-xs font-medium text-slate-500 mb-1">
                {stat.label}
              </p>
              <p className="font-mono text-2xl font-semibold text-slate-900 tabular-nums mb-1">
                {stat.value}
              </p>
              <p className="text-xs text-slate-600">{stat.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
