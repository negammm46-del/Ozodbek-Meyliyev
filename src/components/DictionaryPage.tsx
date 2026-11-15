import { useMemo, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Languages,
  RotateCw,
  Search,
  Sparkles,
  Trophy,
  Volume2,
  XCircle,
} from 'lucide-react';
import { GEO_DICTIONARY_TERMS, type DictionaryTerm } from '../data/academyData';
import { soundEngine } from '../utils/sound';

type DictTab = 'table' | 'flashcards' | 'quiz';
type CategoryFilter = 'Barchasi' | DictionaryTerm['category'];

interface DictionaryPageProps {
  onAwardXp: (amount: number) => void;
}

function speakEnglish(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'en-US';
  utter.rate = 0.9;
  window.speechSynthesis.speak(utter);
}

export function DictionaryPage({ onAwardXp }: DictionaryPageProps) {
  const [tab, setTab] = useState<DictTab>('table');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('Barchasi');

  // Flashcards state
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [learnedIds, setLearnedIds] = useState<string[]>([]);

  // Quiz state
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
  const [quizFinished, setQuizFinished] = useState(false);

  const filteredTerms = useMemo(() => {
    const q = query.trim().toLowerCase();
    return GEO_DICTIONARY_TERMS.filter((term) => {
      const catOk = category === 'Barchasi' || term.category === category;
      const qOk =
        !q ||
        term.en.toLowerCase().includes(q) ||
        term.uz.toLowerCase().includes(q) ||
        term.exampleUz.toLowerCase().includes(q);
      return catOk && qOk;
    });
  }, [query, category]);

  const quizItems = useMemo(() => {
    return GEO_DICTIONARY_TERMS.slice(0, 10).map((term, idx) => {
      const distractors = GEO_DICTIONARY_TERMS.filter((t) => t.id !== term.id)
        .slice(idx % 12, (idx % 12) + 3)
        .map((t) => t.uz);
      const options = [term.uz, ...distractors];
      // deterministic rotation so correct answer isn't always first
      const shift = idx % options.length;
      const rotated = [...options.slice(shift), ...options.slice(0, shift)];
      return { term, options: rotated };
    });
  }, []);

  const currentCard = filteredTerms[cardIndex % Math.max(1, filteredTerms.length)];

  function handleMarkLearned(id: string) {
    soundEngine.playSuccess();
    if (!learnedIds.includes(id)) {
      setLearnedIds((prev) => [...prev, id]);
      onAwardXp(10);
    }
    setFlipped(false);
    setCardIndex((i) => (i + 1) % Math.max(1, filteredTerms.length));
  }

  function handleAnswerQuiz(opt: string) {
    if (selectedOpt !== null) return;
    setSelectedOpt(opt);
    const current = quizItems[quizIndex];
    if (opt === current.term.uz) {
      soundEngine.playSuccess();
      setQuizScore((s) => s + 1);
    } else {
      soundEngine.playError();
    }
  }

  function handleNextQuiz() {
    soundEngine.playClick();
    if (quizIndex + 1 >= quizItems.length) {
      setQuizFinished(true);
      onAwardXp(quizScore * 10);
    } else {
      setQuizIndex((i) => i + 1);
      setSelectedOpt(null);
    }
  }

  function handleRestartQuiz() {
    soundEngine.playClick();
    setQuizIndex(0);
    setQuizScore(0);
    setSelectedOpt(null);
    setQuizFinished(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400 mb-1">
            Ikki tilli atamalar bazasi
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            O‘zbekcha + Inglizcha Geografik Lug‘at
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Xalqaro geografiya atamalarini talaffuzi, misol gaplari, fleshkartalar va lug‘at testi orqali o‘rganing.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { id: 'table', label: 'Lug‘at jadvali', icon: Languages },
            { id: 'flashcards', label: 'Fleshkartalar', icon: BookOpen },
            { id: 'quiz', label: 'Lug‘at testi', icon: Trophy },
          ].map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setTab(item.id as DictTab);
                }}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  active
                    ? 'bg-sky-600 text-white'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      {tab !== 'quiz' && (
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setCardIndex(0);
              }}
              placeholder="So‘z yoki tarjimani qidiring (masalan: Border, Daryo)..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-sky-600"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(
              ['Barchasi', 'Siyosiy geografiya', 'Tabiiy geografiya', 'Iqlim va Hudud'] as CategoryFilter[]
            ).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setCategory(cat);
                  setCardIndex(0);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  category === cat
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TABLE TAB */}
      {tab === 'table' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          {filteredTerms.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
              Qidiruv bo‘yicha atama topilmadi.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-3.5 px-4">English</th>
                    <th className="py-3.5 px-4">O‘zbekcha</th>
                    <th className="py-3.5 px-4 hidden md:table-cell">Misol gap</th>
                    <th className="py-3.5 px-4 text-right">Talaffuz</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {filteredTerms.map((term) => (
                    <tr
                      key={term.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900 dark:text-white">{term.en}</p>
                        <p className="font-mono text-xs text-slate-400">{term.pronunciation}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-sky-700 dark:text-sky-300">{term.uz}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{term.category}</p>
                      </td>
                      <td className="py-3.5 px-4 hidden md:table-cell">
                        <p className="text-slate-800 dark:text-slate-200">{term.exampleEn}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{term.exampleUz}</p>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => speakEnglish(term.en)}
                          aria-label={`${term.en} talaffuzini eshitish`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-sky-100 dark:hover:bg-sky-900 text-xs font-semibold text-slate-700 dark:text-slate-200"
                        >
                          <Volume2 className="w-3.5 h-3.5 text-sky-600" />
                          <span>Tinglash</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* FLASHCARDS TAB */}
      {tab === 'flashcards' && currentCard && (
        <div className="max-w-xl mx-auto space-y-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>
              Karta {(cardIndex % filteredTerms.length) + 1} / {filteredTerms.length}
            </span>
            <span className="font-mono tabular-nums">
              O‘zlashtirildi: {learnedIds.length} ta
            </span>
          </div>

          <div
            onClick={() => {
              soundEngine.playClick();
              setFlipped((f) => !f);
            }}
            className="cursor-pointer bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-8 min-h-64 flex flex-col items-center justify-center text-center shadow-xs hover:border-sky-500 transition-colors select-none"
          >
            {!flipped ? (
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                  English Term
                </p>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
                  {currentCard.en}
                </h2>
                <p className="font-mono text-sm text-slate-400">{currentCard.pronunciation}</p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    speakEnglish(currentCard.en);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-xs font-semibold text-sky-700 dark:text-sky-300"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Talaffuzni eshitish</span>
                </button>
                <p className="text-xs text-slate-400 pt-2">Tarjimani ko‘rish uchun bosing</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  O‘zbekcha ma’nosi
                </p>
                <h2 className="font-display text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                  {currentCard.uz}
                </h2>
                <p className="text-sm text-slate-700 dark:text-slate-200 max-w-md">
                  “{currentCard.exampleEn}”
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {currentCard.exampleUz}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setFlipped(false);
                setCardIndex((i) => (i + 1) % filteredTerms.length);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-200"
            >
              <RotateCw className="w-4 h-4" />
              <span>Keyingi karta</span>
            </button>
            <button
              type="button"
              onClick={() => handleMarkLearned(currentCard.id)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Yodladim (+10 XP)</span>
            </button>
          </div>
        </div>
      )}

      {/* QUIZ TAB */}
      {tab === 'quiz' && (
        <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8">
          {quizFinished ? (
            <div className="text-center space-y-4">
              <Sparkles className="w-10 h-10 text-amber-500 mx-auto" />
              <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                Lug‘at testi yakunlandi!
              </h2>
              <p className="font-mono text-lg font-bold text-sky-600 dark:text-sky-400 tabular-nums">
                Natija: {quizScore} / {quizItems.length} (+{quizScore * 10} XP)
              </p>
              <button
                type="button"
                onClick={handleRestartQuiz}
                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold"
              >
                Qaytadan topshirish
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>
                  Savol {quizIndex + 1} / {quizItems.length}
                </span>
                <span className="font-mono tabular-nums">To‘g‘ri: {quizScore}</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Ushbu inglizcha atamaning o‘zbekcha tarjimasini toping:
                  </p>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
                    {quizItems[quizIndex].term.en}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => speakEnglish(quizItems[quizIndex].term.en)}
                  aria-label="Talaffuzni eshitish"
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Volume2 className="w-5 h-5 text-sky-600" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {quizItems[quizIndex].options.map((opt) => {
                  const answered = selectedOpt !== null;
                  const isCorrect = opt === quizItems[quizIndex].term.uz;
                  const isSelected = selectedOpt === opt;

                  let cls =
                    'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:border-sky-500';
                  if (answered) {
                    if (isCorrect)
                      cls =
                        'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-200';
                    else if (isSelected)
                      cls =
                        'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-800 dark:text-rose-200';
                  }
                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={answered}
                      onClick={() => handleAnswerQuiz(opt)}
                      className={`w-full px-4 py-3 rounded-xl border text-left text-sm font-semibold flex items-center justify-between transition-colors ${cls}`}
                    >
                      <span>{opt}</span>
                      {answered && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      {answered && isSelected && !isCorrect && (
                        <XCircle className="w-4 h-4 text-rose-600" />
                      )}
                    </button>
                  );
                })}
              </div>

              {selectedOpt !== null && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleNextQuiz}
                    className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold"
                  >
                    {quizIndex + 1 >= quizItems.length ? 'Natijani ko‘rish' : 'Keyingi savol'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
