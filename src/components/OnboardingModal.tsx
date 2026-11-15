import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, CheckCircle2, Compass, Globe2, Languages, Target } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { updateUserProfileFields } from '../firebase/firestore.js';
import { type UserProfile } from '../types/user';
import { soundEngine } from '../utils/sound';

interface OnboardingModalProps {
  user: UserProfile;
  verificationHint?: string;
  onComplete: (updated: UserProfile) => void;
}

export function OnboardingModal({
  user,
  verificationHint,
  onComplete,
}: OnboardingModalProps) {
  const { firebaseUser } = useAuth();
  const [step, setStep] = useState(0);
  const [geoLevel, setGeoLevel] = useState(user.geoLevel || 'O‘rta');
  const [learningFocus, setLearningFocus] = useState(user.learningFocus || 'Ikkalasi');
  const [englishLevel, setEnglishLevel] = useState(user.englishLevel || 'A2');
  const [dailyGoalMin, setDailyGoalMin] = useState(user.dailyGoalMin || 20);
  const [favoriteContinent, setFavoriteContinent] = useState(
    user.favoriteContinent || 'Osiyo'
  );
  const [saving, setSaving] = useState(false);

  async function handleFinish() {
    setSaving(true);
    try {
      if (firebaseUser) {
        await updateUserProfileFields(firebaseUser.uid, {
          level: geoLevel,
          learningFocus,
          englishLevel,
          dailyGoalMin,
          favoriteContinent,
          onboardingDone: true,
        }).catch(() => {});
      }

      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          geoLevel,
          learningFocus,
          englishLevel,
          dailyGoalMin,
          favoriteContinent,
          onboardingDone: true,
        }),
      });
      const data = await res.json();
      soundEngine.playSuccess();
      onComplete(
        data.user || {
          ...user,
          geoLevel,
          learningFocus,
          englishLevel,
          dailyGoalMin,
          favoriteContinent,
          onboardingDone: true,
        }
      );
    } catch {
      onComplete({
        ...user,
        geoLevel,
        learningFocus,
        englishLevel,
        dailyGoalMin,
        favoriteContinent,
        onboardingDone: true,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
            Shaxsiy o‘quv rejangiz · {step + 1} / 4
          </span>
          <div className="flex gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={`h-1.5 w-7 rounded-full transition-colors ${
                  i <= step ? 'bg-sky-600' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        {verificationHint && step === 0 && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200">
            Xush kelibsiz, <strong>{user.username}</strong>! Email tasdiqlash kodingiz:{' '}
            <strong className="font-mono">{verificationHint}</strong> (Profil sahifasida tasdiqlashingiz mumkin).
          </div>
        )}

        {step === 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Compass className="w-6 h-6 text-sky-600" />
              <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                Geografiya darajangiz qanday?
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { id: 'Boshlang‘ich', desc: 'Qit’alar va asosiy davlatlarni endi o‘rganyapman' },
                { id: 'O‘rta', desc: 'Poytaxtlar va ko‘plab mamlakatlarni bilaman' },
                { id: 'Yuqori', desc: 'Rekordlar, chegaralar va iqlimni chuqur bilaman' },
                { id: 'Olimpiada', desc: 'Musobaqa va professional geografiya darajasi' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setGeoLevel(opt.id);
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    geoLevel === opt.id
                      ? 'border-sky-600 bg-sky-50 dark:bg-sky-950/50'
                      : 'border-slate-200 dark:border-slate-700 hover:border-sky-400'
                  }`}
                >
                  <p className="font-bold text-sm text-slate-900 dark:text-white">{opt.id}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Languages className="w-6 h-6 text-indigo-600" />
              <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                Geografiyani yoki Ingliz tilini o‘rganmoqchimisiz?
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-2.5">
              {[
                { id: 'Geografiya', desc: '196 ta davlat, xaritalar va jahon rekordlari' },
                { id: 'Ingliz tili', desc: 'Geografiya mavzulari orqali jonli inglizcha suhbat' },
                { id: 'Ikkalasi', desc: 'Geografiya akademiyasi + AI ingliz tili ustozi' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setLearningFocus(opt.id);
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    learningFocus === opt.id
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <p className="font-bold text-sm text-slate-900 dark:text-white">{opt.id}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                Ingliz tili darajangiz (CEFR)
              </label>
              <div className="flex gap-2">
                {['A1', 'A2', 'B1', 'B2', 'C1'].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setEnglishLevel(lvl)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border ${
                      englishLevel === lvl
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Target className="w-6 h-6 text-emerald-600" />
              <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                Kunlik o‘quv maqsadingiz qanday?
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { min: 10, label: 'Yengil · 10 daq/kun' },
                { min: 20, label: 'O‘rtacha · 20 daq/kun' },
                { min: 30, label: 'Jiddiy · 30 daq/kun' },
                { min: 45, label: 'Ekspert · 45 daq/kun' },
              ].map((g) => (
                <button
                  key={g.min}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setDailyGoalMin(g.min);
                  }}
                  className={`p-4 rounded-2xl border text-left font-semibold text-sm ${
                    dailyGoalMin === g.min
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200'
                      : 'border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Globe2 className="w-6 h-6 text-sky-600" />
              <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                Qaysi qit’a sizni ko‘proq qiziqtiradi?
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                'Osiyo',
                'Yevropa',
                'Afrika',
                'Shimoliy Amerika',
                'Janubiy Amerika',
                'Okeaniya',
              ].map((cont) => (
                <button
                  key={cont}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setFavoriteContinent(cont);
                  }}
                  className={`p-3.5 rounded-2xl border text-sm font-semibold ${
                    favoriteContinent === cont
                      ? 'border-sky-600 bg-sky-50 dark:bg-sky-950/50 text-sky-800 dark:text-sky-200'
                      : 'border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {cont}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 disabled:opacity-30"
          >
            Orqaga
          </button>

          {step < 3 ? (
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setStep((s) => s + 1);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold"
            >
              <span>Keyingisi</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={handleFinish}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{saving ? 'Saqlanmoqda...' : 'Rejani saqlash va boshlash'}</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
