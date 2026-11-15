import { useState } from 'react';
import { CheckCircle2, XCircle, RotateCcw, ArrowRight } from 'lucide-react';
import { QUIZ_QUESTIONS } from '../data/geographyData';

export function QuizSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentQuestion = QUIZ_QUESTIONS[currentIndex];
  const hasAnswered = selectedOption !== null;
  const isCorrect = selectedOption === currentQuestion.correctIndex;

  function handleSelectOption(index: number) {
    if (hasAnswered) return;
    setSelectedOption(index);
    if (index === currentQuestion.correctIndex) {
      setCorrectCount((prev) => prev + 1);
    }
  }

  function handleNext() {
    if (currentIndex + 1 < QUIZ_QUESTIONS.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
    } else {
      setIsFinished(true);
    }
  }

  function handleRestart() {
    setCurrentIndex(0);
    setSelectedOption(null);
    setCorrectCount(0);
    setIsFinished(false);
  }

  function getTeacherFeedback(score: number, total: number) {
    const ratio = score / total;
    if (ratio >= 0.85) {
      return 'A’lo natija! Siz dunyo xaritasini, okeanlar va tog‘ tizmalarini haqiqiy geograf kabi yaxshi bilasiz.';
    }
    if (ratio >= 0.6) {
      return 'Yaxshi natija! Asosiy tushunchalarni yaxshi o‘zlashtirgansiz, yana bir bor qit’a va tabiat bo‘limlarini ko‘rib chiqsangiz mukammal bo‘ladi.';
    }
    return 'Yomon emas, lekin mashq qilishda davom eting! Yuqoridagi bo‘limlarni ko‘zdan kechirib, viktorinani qayta yechib ko‘ring.';
  }

  return (
    <section id="viktorina" className="py-16 bg-white">
      <div className="max-w-[900px] mx-auto px-6">
        <div className="text-center mb-10">
          <p className="text-sm font-medium text-sky-700 mb-2">
            05. Amaliy mashg‘ulot
          </p>
          <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900">
            Geografiya bilimingizni sinab ko‘ring
          </h2>
          <p className="text-base text-slate-600 mt-2 max-w-[55ch] mx-auto">
            Har bir savoldan keyin o‘qituvchi izohini o‘qib, yangi bilimlarni
            mustahkamlab oling.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 sm:p-8">
          {isFinished ? (
            <div className="text-center py-6">
              <p className="text-sm font-medium text-sky-700 mb-2">
                Viktorina yakunlandi
              </p>
              <p className="font-mono text-4xl font-bold text-slate-900 tabular-nums mb-3">
                {correctCount} / {QUIZ_QUESTIONS.length}
              </p>
              <p className="text-base text-slate-700 leading-relaxed max-w-[50ch] mx-auto mb-8">
                {getTeacherFeedback(correctCount, QUIZ_QUESTIONS.length)}
              </p>
              <button
                type="button"
                onClick={handleRestart}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-sky-700 rounded-lg hover:bg-sky-800 transition-colors whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-4 h-4" />
                Qaytadan boshlash
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between gap-4 pb-4 mb-6 border-b border-slate-200 text-xs font-medium text-slate-500">
                <span>Mavzu: {currentQuestion.topic}</span>
                <span className="font-mono tabular-nums">
                  Savol {currentIndex + 1} / {QUIZ_QUESTIONS.length} · To‘g‘ri:{' '}
                  {correctCount}
                </span>
              </div>

              <h3 className="font-display text-xl sm:text-2xl font-bold text-slate-900 leading-snug mb-6">
                {currentQuestion.question}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {currentQuestion.options.map((option, idx) => {
                  const isThisSelected = selectedOption === idx;
                  const isThisCorrect = idx === currentQuestion.correctIndex;

                  let buttonStyle =
                    'bg-white border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-100/70';

                  if (hasAnswered) {
                    if (isThisCorrect) {
                      buttonStyle =
                        'bg-emerald-50 border-emerald-600 text-emerald-950 font-semibold';
                    } else if (isThisSelected && !isThisCorrect) {
                      buttonStyle =
                        'bg-rose-50 border-rose-600 text-rose-950';
                    } else {
                      buttonStyle =
                        'bg-white/60 border-slate-200 text-slate-400';
                    }
                  }

                  return (
                    <button
                      key={option}
                      type="button"
                      disabled={hasAnswered}
                      onClick={() => handleSelectOption(idx)}
                      className={`text-left p-4 rounded-xl border transition-colors flex items-center justify-between gap-3 min-h-[52px] ${buttonStyle}`}
                    >
                      <span className="text-sm sm:text-base">{option}</span>
                      {hasAnswered && isThisCorrect && (
                        <CheckCircle2
                          className="w-5 h-5 text-emerald-700 shrink-0"
                          aria-hidden="true"
                        />
                      )}
                      {hasAnswered && isThisSelected && !isThisCorrect && (
                        <XCircle
                          className="w-5 h-5 text-rose-700 shrink-0"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {hasAnswered && (
                <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {isCorrect ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span className="text-xs font-bold text-emerald-700">
                            To‘g‘ri javob
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-rose-700 shrink-0" />
                          <span className="text-xs font-bold text-rose-700">
                            Noto‘g‘ri javob
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {currentQuestion.explanation}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-sky-700 rounded-lg hover:bg-sky-800 transition-colors whitespace-nowrap shrink-0"
                  >
                    {currentIndex + 1 < QUIZ_QUESTIONS.length
                      ? 'Keyingi savol'
                      : 'Natijani ko‘rish'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
