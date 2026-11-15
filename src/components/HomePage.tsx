import { useState } from 'react';
import {
  ArrowRight,
  Award,
  BookOpen,
  Bot,
  CheckCircle2,
  Compass,
  Crown,
  Flame,
  Gamepad2,
  GraduationCap,
  Heart,
  Languages,
  RefreshCw,
  Sparkles,
  Trophy,
  XCircle,
} from 'lucide-react';
import {
  DAILY_FACTS,
  GEO_COUNTRIES,
  type GeoCountry,
} from '../data/geoWorldData';
import { CountryFlag } from './CountryFlag';
import { EarthGlobe3D } from './EarthGlobe3D';
import { soundEngine } from '../utils/sound';

export type NavSection =
  | 'home'
  | 'academy'
  | 'games'
  | 'geo-ai'
  | 'english-ai'
  | 'pro'
  | 'dictionary'
  | 'map'
  | 'explorer'
  | 'quiz'
  | 'learn'
  | 'profile'
  | 'admin';

interface HomePageProps {
  xp: number;
  masteredFlashcards: number;
  totalFlashcards: number;
  quizzesCompleted: number;
  favorites: string[];
  dailyCompleted: boolean;
  isDark: boolean;
  onCompleteDailyChallenge: () => void;
  onToggleFavorite: (id: string) => void;
  onNavigate: (section: NavSection) => void;
  onOpenCountryInExplorer: (country: GeoCountry) => void;
}

export function HomePage({
  xp,
  masteredFlashcards,
  totalFlashcards,
  quizzesCompleted,
  favorites,
  dailyCompleted,
  isDark,
  onCompleteDailyChallenge,
  onToggleFavorite,
  onNavigate,
  onOpenCountryInExplorer,
}: HomePageProps) {
  const [selectedGlobeCountry, setSelectedGlobeCountry] = useState<GeoCountry>(
    GEO_COUNTRIES[0]
  );
  const [factIndex, setFactIndex] = useState(0);
  const [dailyAnswer, setDailyAnswer] = useState<number | null>(null);

  const dailyQuestion = {
    question:
      'Qaysi qit’a bir vaqtning o‘zida to‘rttala yarimsharda ham joylashgan yagona materikdir?',
    options: ['Osiyo', 'Afrika', 'Janubiy Amerika', 'Avstraliya'],
    correctIndex: 1,
    explanation:
      'Ekvator ham, Grinvich bosh meridiani ham Afrika hududini kesib o‘tadi, shuning uchun u to‘rttala yarimsharda joylashgan.',
  };

  const level = Math.floor(xp / 150) + 1;
  const levelProgress = Math.round(((xp % 150) / 150) * 100);
  const featuredCountries = GEO_COUNTRIES.filter((c) => c.featured).slice(0, 6);

  function handleRandomFact() {
    soundEngine.playClick();
    setFactIndex((prev) => {
      let next = Math.floor(Math.random() * DAILY_FACTS.length);
      if (next === prev) next = (prev + 1) % DAILY_FACTS.length;
      return next;
    });
  }

  function handleDailyOption(idx: number) {
    if (dailyAnswer !== null || dailyCompleted) return;
    setDailyAnswer(idx);
    if (idx === dailyQuestion.correctIndex) {
      soundEngine.playSuccess();
      onCompleteDailyChallenge();
    } else {
      soundEngine.playError();
    }
  }

  return (
    <div className="space-y-10">
      {/* Hero + 3D Globe */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        <div className="xl:col-span-5 flex flex-col justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8">
          <div>
            <p className="text-sm font-semibold bg-gradient-to-r from-sky-600 via-emerald-600 to-indigo-600 dark:from-sky-400 dark:via-emerald-400 dark:to-indigo-400 bg-clip-text text-transparent mb-3">
              GeoWorld · Interaktiv Geografiya Platformasi
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.15] mb-4">
              Sayyoramizni 3D globus va o‘yinlar orqali kashf eting
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              Dunyo davlatlari, poytaxtlar, bayroqlar, okeanlar va baland
              tog‘lar haqida o‘zbek tilida qiziqarli bilimlarni egallang. 3D
              globusni aylantiring va nuqtalar ustiga bosing!
            </p>

            {/* Selected Globe Country Preview */}
            <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <CountryFlag
                    code={selectedGlobeCountry.code}
                    name={selectedGlobeCountry.name}
                    className="w-10 h-7"
                  />
                  <div className="min-w-0">
                    <h2 className="font-display text-base font-bold text-slate-900 dark:text-white truncate">
                      {selectedGlobeCountry.name}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      Poytaxti: {selectedGlobeCountry.capital} ·{' '}
                      {selectedGlobeCountry.continent}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    onToggleFavorite(selectedGlobeCountry.id);
                  }}
                  aria-label="Sevimlilarga qo‘shish"
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors shrink-0"
                >
                  <Heart
                    className={`w-4 h-4 ${
                      favorites.includes(selectedGlobeCountry.id)
                        ? 'fill-rose-500 text-rose-500'
                        : ''
                    }`}
                  />
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300 font-mono tabular-nums mb-3">
                <span>Aholisi: {selectedGlobeCountry.population}</span>
                <span aria-hidden="true">·</span>
                <span>Maydoni: {selectedGlobeCountry.areaKm2}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                {selectedGlobeCountry.shortNote}
              </p>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onOpenCountryInExplorer(selectedGlobeCountry);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 dark:text-sky-400 hover:underline"
              >
                Katalogda batafsil ko‘rish
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onNavigate('academy');
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 rounded-xl shadow-xs transition-all whitespace-nowrap shrink-0"
            >
              <GraduationCap className="w-4 h-4" />
              5 Bosqichli Akademiya
            </button>
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onNavigate('geo-ai');
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 rounded-xl transition-colors whitespace-nowrap shrink-0"
            >
              <Bot className="w-4 h-4" />
              GeoAI Ustoz
            </button>
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onNavigate('games');
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 rounded-xl transition-colors whitespace-nowrap shrink-0"
            >
              <Gamepad2 className="w-4 h-4" />
              O‘yin markazi
            </button>
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onNavigate('english-ai');
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900 border border-sky-200 dark:border-sky-800 rounded-xl transition-colors whitespace-nowrap shrink-0"
            >
              <Languages className="w-4 h-4" />
              AI Ingliz tili
            </button>
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onNavigate('pro');
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-amber-950 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 rounded-xl transition-all whitespace-nowrap shrink-0"
            >
              <Crown className="w-4 h-4" />
              GEOWORLD PRO
            </button>
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onNavigate('quiz');
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors whitespace-nowrap shrink-0"
            >
              <Trophy className="w-4 h-4 text-amber-500" />
              Viktorina
            </button>
          </div>
        </div>

        <div className="xl:col-span-7">
          <EarthGlobe3D
            countries={GEO_COUNTRIES}
            selectedCountry={selectedGlobeCountry}
            onSelectCountry={(country) => {
              soundEngine.playClick();
              setSelectedGlobeCountry(country);
            }}
            isDark={isDark}
          />
        </div>
      </section>

      {/* Progress Dashboard */}
      <section aria-label="O‘quv jarayoni ko‘rsatkichlari">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
              Sizning o‘quv ko‘rsatkichlaringiz
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {level}-bosqich sayyoh · Keyingi bosqichgacha {150 - (xp % 150)}{' '}
              XP qoldi
            </p>
          </div>
          <div className="w-full sm:w-64">
            <div className="flex justify-between text-xs font-mono text-slate-500 dark:text-slate-400 mb-1 tabular-nums">
              <span>Daraja {level}</span>
              <span>{levelProgress}%</span>
            </div>
            <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-500 via-emerald-500 to-indigo-500 rounded-full transition-all duration-300"
                style={{ width: `${levelProgress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Jami bilim balli
              </span>
              <Sparkles className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
            </div>
            <p className="font-mono text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
              {xp} XP
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {level}-daraja geograf
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Kartochkalar
              </span>
              <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            </div>
            <p className="font-mono text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
              {masteredFlashcards} / {totalFlashcards}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              O‘zlashtirilgan mavzular
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Viktorinalar
              </span>
              <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            </div>
            <p className="font-mono text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
              {quizzesCompleted} ta
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Yakunlangan sinovlar
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Sevimli davlatlar
              </span>
              <Heart className="w-4 h-4 text-rose-500 shrink-0" />
            </div>
            <p className="font-mono text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
              {favorites.length} ta
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Saqlangan mamlakatlar
            </p>
          </div>
        </div>
      </section>

      {/* Daily Fact + Daily Challenge */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-6 bg-gradient-to-br from-sky-600 via-indigo-600 to-purple-700 rounded-2xl p-6 sm:p-7 text-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-sky-200 shrink-0" />
                <h2 className="font-display text-xl font-bold">
                  Kunlik geografiya fakti
                </h2>
              </div>
              <button
                type="button"
                onClick={handleRandomFact}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Tasodifiy fakt
              </button>
            </div>
            <p className="text-base sm:text-lg text-sky-50 leading-relaxed">
              {DAILY_FACTS[factIndex]}
            </p>
          </div>
          <p className="text-xs text-sky-200 mt-6 font-mono tabular-nums">
            Fakt #{factIndex + 1} / {DAILY_FACTS.length}
          </p>
        </div>

        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-500 shrink-0" />
                <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                  Kunlik vazifa
                </h2>
              </div>
              <span className="font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                {dailyCompleted ? 'Bajarildi (+40 XP)' : 'Mukofot: +40 XP'}
              </span>
            </div>

            <p className="text-sm sm:text-base font-medium text-slate-800 dark:text-slate-100 mb-4">
              {dailyQuestion.question}
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              {dailyQuestion.options.map((opt, idx) => {
                const answered = dailyAnswer !== null || dailyCompleted;
                const isCorrect = idx === dailyQuestion.correctIndex;
                const isSelected = dailyAnswer === idx;

                let cls =
                  'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:border-sky-500';
                if (answered) {
                  if (isCorrect) {
                    cls =
                      'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-600 text-emerald-900 dark:text-emerald-200 font-semibold';
                  } else if (isSelected) {
                    cls =
                      'bg-rose-50 dark:bg-rose-950/60 border-rose-600 text-rose-900 dark:text-rose-200';
                  } else {
                    cls =
                      'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400';
                  }
                }

                return (
                  <button
                    key={opt}
                    type="button"
                    disabled={answered}
                    onClick={() => handleDailyOption(idx)}
                    className={`p-3 rounded-xl border text-left text-sm transition-colors flex items-center justify-between gap-2 ${cls}`}
                  >
                    <span>{opt}</span>
                    {answered && isCorrect && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                    {answered && isSelected && !isCorrect && (
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {(dailyAnswer !== null || dailyCompleted) && (
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 leading-relaxed">
              {dailyQuestion.explanation}
            </p>
          )}
        </div>
      </section>

      {/* Featured Countries */}
      <section>
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
              Tanlangan davlatlar
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Dunyoning eng qiziqarli mamlakatlari bilan tanishing
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onNavigate('explorer');
            }}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-700 dark:text-sky-400 hover:underline whitespace-nowrap shrink-0"
          >
            Barcha davlatlar
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {featuredCountries.map((country) => (
            <div
              key={country.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-sky-500/60 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <CountryFlag
                      code={country.code}
                      name={country.name}
                      className="w-11 h-7"
                    />
                    <div>
                      <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                        {country.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {country.capital} · {country.continent}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      onToggleFavorite(country.id);
                    }}
                    aria-label={`${country.name} sevimlilarga`}
                    className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        favorites.includes(country.id)
                          ? 'fill-rose-500 text-rose-500'
                          : ''
                      }`}
                    />
                  </button>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed mb-4">
                  {country.shortNote}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  {country.population} · {country.areaKm2}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    onOpenCountryInExplorer(country);
                  }}
                  className="text-xs font-semibold text-sky-700 dark:text-sky-400 hover:underline whitespace-nowrap shrink-0"
                >
                  Batafsil
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
