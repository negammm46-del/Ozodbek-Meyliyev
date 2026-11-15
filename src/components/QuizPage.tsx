import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Clock,
  Lock,
  Medal,
  Play,
  RotateCcw,
  Trophy,
  XCircle,
} from 'lucide-react';
import {
  BADGE_DEFINITIONS,
  BASE_LEADERBOARD,
  QUIZ_BANK,
  type GeoQuizItem,
} from '../data/geoWorldData';
import { CountryFlag } from './CountryFlag';
import { soundEngine } from '../utils/sound';

type QuizCategory =
  | 'Barchasi'
  | 'Davlatlar'
  | 'Poytaxtlar'
  | 'Bayroqlar'
  | 'Tog‘lar'
  | 'Okeanlar';

type QuizDifficulty = 'Barchasi' | 'Oson' | 'O‘rta' | 'Qiyin';

const CATEGORIES: QuizCategory[] = [
  'Barchasi',
  'Davlatlar',
  'Poytaxtlar',
  'Bayroqlar',
  'Tog‘lar',
  'Okeanlar',
];

const DIFFICULTIES: QuizDifficulty[] = ['Barchasi', 'Oson', 'O‘rta', 'Qiyin'];

interface QuizPageProps {
  xp: number;
  unlockedBadges: string[];
  onFinishQuiz: (payload: {
    earnedXp: number;
    correctCount: number;
    totalQuestions: number;
    category: string;
  }) => void;
}

export function QuizPage({
  xp,
  unlockedBadges,
  onFinishQuiz,
}: QuizPageProps) {
  const [selectedCategory, setSelectedCategory] =
    useState<QuizCategory>('Barchasi');
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<QuizDifficulty>('Barchasi');

  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [sessionXp, setSessionXp] = useState(0);
  const [timeLeft, setTimeLeft] = useState(25);
  const [activeQuestions, setActiveQuestions] = useState<GeoQuizItem[]>([]);

  const matchingQuestions = useMemo(() => {
    return QUIZ_BANK.filter((q) => {
      const catOk =
        selectedCategory === 'Barchasi' || q.category === selectedCategory;
      const diffOk =
        selectedDifficulty === 'Barchasi' ||
        q.difficulty === selectedDifficulty;
      return catOk && diffOk;
    });
  }, [selectedCategory, selectedDifficulty]);

  const currentQuestion = activeQuestions[currentIndex];
  const hasAnswered = selectedOption !== null || timedOut;

  function getSecondsForDifficulty(diff: GeoQuizItem['difficulty']) {
    if (diff === 'Qiyin') return 15;
    if (diff === 'O‘rta') return 20;
    return 30;
  }

  function getXpForDifficulty(diff: GeoQuizItem['difficulty']) {
    if (diff === 'Qiyin') return 40;
    if (diff === 'O‘rta') return 25;
    return 15;
  }

  function startQuiz() {
    const pool =
      matchingQuestions.length > 0 ? matchingQuestions : QUIZ_BANK.slice(0, 6);
    const chosen = [...pool].slice(0, 8);
    soundEngine.playClick();
    setActiveQuestions(chosen);
    setCurrentIndex(0);
    setSelectedOption(null);
    setTimedOut(false);
    setCorrectCount(0);
    setSessionXp(0);
    setIsFinished(false);
    setIsPlaying(true);
    setTimeLeft(getSecondsForDifficulty(chosen[0].difficulty));
  }

  useEffect(() => {
    if (!isPlaying || isFinished || hasAnswered || !currentQuestion) return;

    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          setTimedOut(true);
          soundEngine.playError();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isPlaying, isFinished, hasAnswered, currentQuestion]);

  function handleAnswer(idx: number) {
    if (hasAnswered || !currentQuestion) return;
    setSelectedOption(idx);
    if (idx === currentQuestion.correctIndex) {
      soundEngine.playSuccess();
      const gained = getXpForDifficulty(currentQuestion.difficulty);
      setCorrectCount((prev) => prev + 1);
      setSessionXp((prev) => prev + gained);
    } else {
      soundEngine.playError();
    }
  }

  function handleNext() {
    if (currentIndex + 1 < activeQuestions.length) {
      const nextIdx = currentIndex + 1;
      soundEngine.playClick();
      setCurrentIndex(nextIdx);
      setSelectedOption(null);
      setTimedOut(false);
      setTimeLeft(getSecondsForDifficulty(activeQuestions[nextIdx].difficulty));
    } else {
      soundEngine.playLevelUp();
      setIsFinished(true);
      setIsPlaying(false);
      onFinishQuiz({
        earnedXp: sessionXp,
        correctCount,
        totalQuestions: activeQuestions.length,
        category: selectedCategory,
      });
    }
  }

  const leaderboardRows = useMemo(() => {
    const combined = [
      ...BASE_LEADERBOARD.map((row) => ({ ...row, isMe: false })),
      { name: 'Siz (O‘quvchi)', city: 'GeoWorld', xp, isMe: true },
    ];
    return combined.sort((a, b) => b.xp - a.xp);
  }, [xp]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-1">
          Bilim sinovi · Ballar, taymer va nishonlar
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Geografiya viktorinasi
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-1 max-w-[65ch]">
          Kategoriya va qiyinlik darajasini tanlang, vaqt tugashidan oldin
          javob bering va peshqadamlar jadvalida yuqoriga ko‘tariling.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Quiz Area */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8">
          {!isPlaying && !isFinished ? (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white mb-3">
                  1. Kategoriyani tanlang
                </h2>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => {
                    const active = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          soundEngine.playClick();
                          setSelectedCategory(cat);
                        }}
                        className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                          active
                            ? 'bg-sky-600 text-white border-sky-600'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white mb-3">
                  2. Qiyinlik darajasi
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {DIFFICULTIES.map((diff) => {
                    const active = selectedDifficulty === diff;
                    const hint =
                      diff === 'Oson'
                        ? '30s · +15 XP'
                        : diff === 'O‘rta'
                        ? '20s · +25 XP'
                        : diff === 'Qiyin'
                        ? '15s · +40 XP'
                        : 'Aralash';
                    return (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => {
                          soundEngine.playClick();
                          setSelectedDifficulty(diff);
                        }}
                        className={`p-3.5 rounded-xl border text-left transition-colors ${
                          active
                            ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-600 text-indigo-950 dark:text-indigo-100'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        <p className="font-display font-bold text-sm">{diff}</p>
                        <p className="font-mono text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                          {hint}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-sm text-slate-600 dark:text-slate-300 font-mono tabular-nums">
                  Mos savollar soni:{' '}
                  <strong className="text-slate-900 dark:text-white">
                    {matchingQuestions.length} ta
                  </strong>
                </p>
                <button
                  type="button"
                  onClick={startQuiz}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-sm font-semibold transition-all whitespace-nowrap shrink-0"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Viktorinani boshlash
                </button>
              </div>
            </div>
          ) : isFinished ? (
            <div className="text-center py-6 space-y-5">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white">
                <Trophy className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-medium text-sky-600 dark:text-sky-400 mb-1">
                  Viktorina yakunlandi
                </p>
                <h2 className="font-display text-3xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                  {correctCount} / {activeQuestions.length} to‘g‘ri
                </h2>
                <p className="font-mono text-base font-semibold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
                  +{sessionXp} XP qo‘shildi
                </p>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                {correctCount / activeQuestions.length >= 0.8
                  ? 'Ajoyib natija! Siz geografiya bilimdonisiz va yangi nishonlarga yaqinlashdingiz.'
                  : 'Yaxshi harakat! Bilimlarni mustahkamlash uchun Ta’lim rejimidagi kartochkalarni ko‘rib chiqing.'}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={startQuiz}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Qayta o‘ynash
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsFinished(false);
                    setIsPlaying(false);
                  }}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Kategoriyani o‘zgartirish
                </button>
              </div>
            </div>
          ) : (
            currentQuestion && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <span>{currentQuestion.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{currentQuestion.difficulty}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      Savol {currentIndex + 1} / {activeQuestions.length}
                    </span>
                  </div>

                  <div
                    className={`inline-flex items-center gap-1.5 font-mono text-sm font-bold tabular-nums ${
                      timeLeft <= 5
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-sky-700 dark:text-sky-400'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    {timeLeft}s
                  </div>
                </div>

                {currentQuestion.flagCode && (
                  <div className="flex justify-center py-2">
                    <CountryFlag
                      code={currentQuestion.flagCode}
                      name={currentQuestion.flagName ?? 'Davlat'}
                      className="w-36 h-24 rounded-lg"
                    />
                  </div>
                )}

                <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug">
                  {currentQuestion.question}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentQuestion.options.map((opt, idx) => {
                    const isSelected = selectedOption === idx;
                    const isCorrect = idx === currentQuestion.correctIndex;

                    let cls =
                      'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 hover:border-sky-500';
                    if (hasAnswered) {
                      if (isCorrect) {
                        cls =
                          'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-600 text-emerald-950 dark:text-emerald-200 font-semibold';
                      } else if (isSelected) {
                        cls =
                          'bg-rose-50 dark:bg-rose-950/60 border-rose-600 text-rose-950 dark:text-rose-200';
                      } else {
                        cls =
                          'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400';
                      }
                    }

                    return (
                      <button
                        key={opt}
                        type="button"
                        disabled={hasAnswered}
                        onClick={() => handleAnswer(idx)}
                        className={`p-4 rounded-xl border text-left transition-colors flex items-center justify-between gap-3 min-h-[54px] ${cls}`}
                      >
                        <span className="text-sm sm:text-base">{opt}</span>
                        {hasAnswered && isCorrect && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        )}
                        {hasAnswered && isSelected && !isCorrect && (
                          <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {hasAnswered && (
                  <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p
                        className={`text-xs font-bold mb-1 ${
                          selectedOption === currentQuestion.correctIndex
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-rose-700 dark:text-rose-400'
                        }`}
                      >
                        {timedOut
                          ? 'Vaqt tugadi'
                          : selectedOption === currentQuestion.correctIndex
                          ? 'To‘g‘ri javob'
                          : 'Noto‘g‘ri javob'}
                      </p>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        {currentQuestion.explanation}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleNext}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
                    >
                      {currentIndex + 1 < activeQuestions.length
                        ? 'Keyingi savol'
                        : 'Natijani ko‘rish'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )
          )}
        </div>

        {/* Leaderboard */}
        <aside className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Medal className="w-5 h-5 text-amber-500 shrink-0" />
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                Peshqadamlar jadvali
              </h2>
            </div>
            <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
              XP reyting
            </span>
          </div>

          <div className="space-y-2.5">
            {leaderboardRows.map((entry, idx) => (
              <div
                key={entry.name}
                className={`flex items-center justify-between gap-3 p-3 rounded-xl border ${
                  entry.isMe
                    ? 'bg-sky-50 dark:bg-sky-950/50 border-sky-600'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-xs font-bold w-5 text-slate-500 dark:text-slate-400 tabular-nums">
                    #{idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {entry.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {entry.city}
                    </p>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold text-sky-700 dark:text-sky-400 tabular-nums shrink-0">
                  {entry.xp} XP
                </span>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* Achievements & Badges */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
            Yutuqlar va nishonlar ({unlockedBadges.length} /{' '}
            {BADGE_DEFINITIONS.length})
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {BADGE_DEFINITIONS.map((badge) => {
            const unlocked = unlockedBadges.includes(badge.id);
            return (
              <div
                key={badge.id}
                className={`p-5 rounded-xl border transition-colors ${
                  unlocked
                    ? 'bg-white dark:bg-slate-900 border-emerald-500/60'
                    : 'bg-slate-100/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-80'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                    {badge.title}
                  </h3>
                  {unlocked ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                  {badge.description}
                </p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {unlocked ? 'Ochilgan' : `Shart: ${badge.requirementLabel}`}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
