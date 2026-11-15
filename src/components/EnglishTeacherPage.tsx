import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Headphones,
  KeyRound,
  Languages,
  Mic,
  MicOff,
  RefreshCw,
  Send,
  Sparkles,
  Square,
  Target,
  Volume2,
  XCircle,
} from 'lucide-react';
import { GEO_DICTIONARY_TERMS } from '../data/academyData';
import { soundEngine } from '../utils/sound';

type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
type EnglishTab =
  | 'speaking'
  | 'sentences'
  | 'listening'
  | 'vocab'
  | 'assessment';

interface EnglishTeacherPageProps {
  initialLevel?: string;
  geminiConfigured?: boolean;
  onAwardXp: (xp: number, label: string) => void;
  onUpdateEnglishLevel?: (lvl: string) => void;
}

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

const TOPICS = [
  { id: 'Japan & Tokyo', label: 'Yaponiya va Tokio (Japan)' },
  { id: 'Uzbekistan & Silk Road', label: 'O‘zbekiston (Silk Road)' },
  { id: 'World Oceans & Rivers', label: 'Okean va daryolar' },
  { id: 'Mountains & Climate', label: 'Tog‘lar va iqlim' },
  { id: 'Traveling & Capitals', label: 'Sayohat va poytaxtlar' },
];

const SENTENCE_TASKS = [
  {
    uz: 'Tokio — Yaponiyaning poytaxti.',
    words: ['Tokyo', 'is', 'the', 'capital', 'of', 'Japan.'],
    answer: 'Tokyo is the capital of Japan.',
  },
  {
    uz: 'O‘zbekiston Markaziy Osiyoning markazida joylashgan.',
    words: ['Uzbekistan', 'is', 'located', 'in', 'Central', 'Asia.'],
    answer: 'Uzbekistan is located in Central Asia.',
  },
  {
    uz: 'Tinch okeani Yerdagi eng chuqur okeandir.',
    words: ['The', 'Pacific', 'Ocean', 'is', 'the', 'deepest', 'ocean.'],
    answer: 'The Pacific Ocean is the deepest ocean.',
  },
  {
    uz: 'Everest dunyodagi eng baland tog‘ hisoblanadi.',
    words: ['Mount', 'Everest', 'is', 'the', 'highest', 'mountain.'],
    answer: 'Mount Everest is the highest mountain.',
  },
];

const LISTENING_EXERCISES = [
  {
    audioEn:
      'Japan is an island country in East Asia. Its capital city is Tokyo, and its highest mountain is Mount Fuji.',
    questionUz: 'Matnga ko‘ra Yaponiyaning eng baland tog‘i qaysi?',
    options: ['Mount Everest', 'Mount Fuji', 'Mount Kilimanjaro', 'Mount Elbrus'],
    correctIndex: 1,
  },
  {
    audioEn:
      'Uzbekistan is famous for the historic Silk Road cities of Samarkand, Bukhara, and Khiva. Tashkent is the capital city.',
    questionUz: 'Audio matnda qaysi shahar poytaxt sifatida aytildi?',
    options: ['Samarkand', 'Bukhara', 'Tashkent', 'Khiva'],
    correctIndex: 2,
  },
  {
    audioEn:
      'The Nile River flows northward through northeastern Africa and empties into the Mediterranean Sea.',
    questionUz: 'Nil daryosi qaysi dengizga quyiladi?',
    options: ['Red Sea', 'Mediterranean Sea', 'Black Sea', 'Arabian Sea'],
    correctIndex: 1,
  },
];

const ASSESSMENT_QUIZ = [
  {
    q: 'Choose the correct sentence:',
    options: [
      'Tokyo are the capital of Japan.',
      'Tokyo is the capital of Japan.',
      'Tokyo is capital of the Japan.',
      'Tokyo be capital of Japan.',
    ],
    correct: 1,
  },
  {
    q: 'Which geographical word means "Dengizga chiqmaydigan davlat"?',
    options: ['Archipelago', 'Peninsula', 'Landlocked country', 'Plateau'],
    correct: 2,
  },
  {
    q: 'Complete: "Uzbekistan is located ___ Central Asia."',
    options: ['on', 'at', 'in', 'to'],
    correct: 2,
  },
  {
    q: 'Which sentence is grammatically accurate at B1/B2 level?',
    options: [
      'Although it has no coastline, Uzbekistan has a rich Silk Road heritage.',
      'Although it has no coastline, but Uzbekistan has rich heritage.',
      'Despite it has no coastline, Uzbekistan is rich.',
      'Because no coastline, Uzbekistan has Silk Road.',
    ],
    correct: 0,
  },
];

const DAILY_MISSIONS = [
  { id: 'm1', label: 'AI Ustoz bilan 3 ta inglizcha gap mashq qiling', xp: 25 },
  { id: 'm2', label: 'Gap tuzish (Sentence Builder) mashqini bajaring', xp: 20 },
  { id: 'm3', label: 'Tinglab tushunish (Listening) topshirig‘ini yeching', xp: 20 },
];

const PRONUNCIATION_DRILLS = [
  {
    en: 'Tokyo is the capital of Japan.',
    uz: 'Tokio — Yaponiyaning poytaxti.',
    tip: '“capital” so‘zida urg‘u birinchi bo‘g‘inga tushadi: KAE-pi-tal.',
  },
  {
    en: 'Uzbekistan is located in Central Asia.',
    uz: 'O‘zbekiston Markaziy Osiyoda joylashgan.',
    tip: '“located” so‘zini lo-KEY-tid deb talaffuz qiling.',
  },
  {
    en: 'The Pacific Ocean is the deepest ocean on Earth.',
    uz: 'Tinch okeani Yerdagi eng chuqur okeandir.',
    tip: '“Pacific” — pa-SI-fik, “Ocean” — OU-shen.',
  },
  {
    en: 'Mount Everest is the highest mountain in the world.',
    uz: 'Everest dunyodagi eng baland tog‘dir.',
    tip: '“highest” — HAY-ist, “mountain” — MAUN-tin.',
  },
];

export function EnglishTeacherPage({
  initialLevel = 'A2',
  geminiConfigured = true,
  onAwardXp,
  onUpdateEnglishLevel,
}: EnglishTeacherPageProps) {
  const [level, setLevel] = useState<CefrLevel>(
    (['A1', 'A2', 'B1', 'B2', 'C1'].includes(initialLevel)
      ? initialLevel
      : 'A2') as CefrLevel
  );
  const [topic, setTopic] = useState(TOPICS[0].id);
  const [tab, setTab] = useState<EnglishTab>('speaking');

  // Speaking Coach Chat
  const [messages, setMessages] = useState<
    Array<{ id: string; role: 'user' | 'assistant'; text: string }>
  >([
    {
      id: 'init',
      role: 'assistant',
      text: 'Hello! I am GeoEnglish Coach. Let’s practice English through Geography!\nBugungi mavzu: Japan & Tokyo.\nCan you say: "Tokyo is the capital of Japan."? Mikrofon tugmasini bosib takrorlang yoki inglizcha yozing!',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configMissing, setConfigMissing] = useState(!geminiConfigured);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [repeatResult, setRepeatResult] = useState<string | null>(null);
  const [drillIdx, setDrillIdx] = useState(0);
  const [drillListening, setDrillListening] = useState(false);
  const [drillFeedback, setDrillFeedback] = useState<{
    spoken: string;
    scorePct: number;
  } | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    setConfigMissing(!geminiConfigured);
  }, [geminiConfigured]);

  // Sentence Builder
  const [sentIdx, setSentIdx] = useState(0);
  const [pickedWords, setPickedWords] = useState<number[]>([]);
  const [sentenceFeedback, setSentenceFeedback] = useState<boolean | null>(null);

  // Listening
  const [listenIdx, setListenIdx] = useState(0);
  const [listenChoice, setListenChoice] = useState<number | null>(null);

  // Vocab flashcard
  const [vocabIdx, setVocabIdx] = useState(0);
  const [vocabFlipped, setVocabFlipped] = useState(false);

  // Assessment
  const [assessAnswers, setAssessAnswers] = useState<Record<number, number>>({});
  const [assessedLevel, setAssessedLevel] = useState<string | null>(null);

  // Daily Missions
  const [doneMissions, setDoneMissions] = useState<string[]>([]);

  const currentSentence = SENTENCE_TASKS[sentIdx];
  const shuffledWords = useMemo(() => {
    return currentSentence.words
      .map((w, origIdx) => ({ w, origIdx }))
      .sort((a, b) => a.w.localeCompare(b.w));
  }, [currentSentence]);

  function markMission(id: string, xp: number, title: string) {
    if (!doneMissions.includes(id)) {
      setDoneMissions((prev) => [...prev, id]);
      onAwardXp(xp, title);
    }
  }

  function speakEnglish(text: string, rate = 0.92) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text.replace(/[*#_`]/g, '').slice(0, 600));
    utter.lang = 'en-US';
    utter.rate = rate;
    utter.onstart = () => setIsSpeaking(true);
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utter);
  }

  function stopVoice() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }

  async function sendEnglishChat(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    soundEngine.playClick();
    setError(null);
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: 'user', text: trimmed },
    ]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/geo-ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          mode: 'english-coach',
          language: 'both',
          englishLevel: level,
          topic,
          history: messages.slice(-8).map((m) => ({
            role: m.role === 'user' ? 'user' : 'model',
            text: m.text,
          })),
        }),
      });
      const data = await res.json();
      if (res.status === 503 || data.configured === false) {
        setConfigMissing(true);
        throw new Error(
          data.error ||
            'GEMINI_API_KEY sozlanmagan. Settings → Secrets bo‘limiga qo‘shing.'
        );
      }
      if (!res.ok) throw new Error(data.error || 'AI xatosi');
      const reply = String(data.reply || 'Great effort! Let us continue.');
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: 'assistant', text: reply },
      ]);
      speakEnglish(reply);
      markMission('m1', 25, 'English Speaking Coach');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Server xatosi');
    } finally {
      setLoading(false);
    }
  }

  function handleVoiceRepeat() {
    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionInstance;
      webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
    };
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRec) {
      setError('Brauzeringiz inglizcha nutqni aniqlashni qo‘llab-quvvatlamaydi.');
      return;
    }
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }
    stopVoice();
    const rec = new SpeechRec();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.onresult = (ev) => {
      const spoken = ev.results?.[0]?.[0]?.transcript || '';
      if (spoken) {
        setRepeatResult(`Siz aytdingiz: "${spoken}"`);
        void sendEnglishChat(spoken);
      }
    };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);
    recognitionRef.current = rec;
    setIsListening(true);
    rec.start();
  }

  function handlePronunciationDrill() {
    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionInstance;
      webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
    };
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRec) {
      setError('Brauzeringiz inglizcha nutqni aniqlashni qo‘llab-quvvatlamaydi.');
      return;
    }
    stopVoice();
    const rec = new SpeechRec();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.onresult = (ev) => {
      const spoken = ev.results?.[0]?.[0]?.transcript || '';
      if (spoken) {
        const targetWords = PRONUNCIATION_DRILLS[drillIdx].en
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .split(/\s+/)
          .filter(Boolean);
        const spokenWords = spoken
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .split(/\s+/)
          .filter(Boolean);
        const matched = targetWords.filter((w) => spokenWords.includes(w)).length;
        const scorePct = Math.round(
          (matched / Math.max(1, targetWords.length)) * 100
        );
        setDrillFeedback({ spoken, scorePct });
        if (scorePct >= 75) {
          soundEngine.playSuccess();
          onAwardXp(15, 'Inglizcha talaffuz mashqi');
        } else {
          soundEngine.playClick();
        }
      }
    };
    rec.onerror = () => setDrillListening(false);
    rec.onend = () => setDrillListening(false);
    setDrillListening(true);
    rec.start();
  }

  const currentDrill = PRONUNCIATION_DRILLS[drillIdx];
  const currentVocab = GEO_DICTIONARY_TERMS[vocabIdx % GEO_DICTIONARY_TERMS.length];
  const currentListen = LISTENING_EXERCISES[listenIdx];

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-sky-600 flex items-center justify-center text-white shrink-0">
              <Languages className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                AI Ingliz Tili O‘qituvchisi (Geografiya orqali)
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Talaffuz mashqlari · O‘zbekcha grammatika izohlari · Gap tuzish · Tinglab tushunish · Daraja testi
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
              {(['A1', 'A2', 'B1', 'B2', 'C1'] as CefrLevel[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setLevel(l);
                    onUpdateEnglishLevel?.(l);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold ${
                    level === l
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            {isSpeaking && (
              <button
                type="button"
                onClick={stopVoice}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold"
              >
                <Square className="w-3 h-3 fill-white" />
                <span>Stop</span>
              </button>
            )}
          </div>
        </div>

        {/* Daily English Missions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          {DAILY_MISSIONS.map((m) => {
            const done = doneMissions.includes(m.id);
            return (
              <div
                key={m.id}
                className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                  done
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-400 text-emerald-800 dark:text-emerald-200'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <span className="flex items-center gap-2 font-medium">
                  <Target className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{m.label}</span>
                </span>
                <span className="font-mono font-bold shrink-0">
                  {done ? '✓' : `+${m.xp} XP`}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: 'speaking', label: 'Jonli Suhbat & Talaffuz', icon: Mic },
            { id: 'sentences', label: 'Gap tuzish (Builder)', icon: Sparkles },
            { id: 'listening', label: 'Tinglab tushunish', icon: Headphones },
            { id: 'vocab', label: 'Lug‘at kartalari', icon: BookOpen },
            { id: 'assessment', label: 'Daraja testi (A1–C1)', icon: Award },
          ] as Array<{ id: EnglishTab; label: string; icon: typeof Mic }>
        ).map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setTab(t.id);
              }}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
                tab === t.id
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: SPEAKING & AI COACH */}
      {tab === 'speaking' && (
        <div className="space-y-4">
          {configMissing && (
            <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <KeyRound className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    AI Suhbat Murabbiyi uchun GEMINI_API_KEY sozlanmagan
                  </p>
                  <p className="text-xs text-amber-800 dark:text-amber-300">
                    Settings → Secrets bo‘limiga <code className="font-mono font-bold">GEMINI_API_KEY</code> qo‘shing. Quyidagi Talaffuz mashqi, Gap tuzish, Audio va Lug‘at bo‘limlari API kalitsiz ham ishlaydi!
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-amber-200/70 dark:bg-amber-900 text-amber-900 dark:text-amber-200 font-mono text-[11px] font-bold shrink-0">
                API Key zarur
              </span>
            </div>
          )}

          {/* Quick Pronunciation Repeat Coach */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Talaffuz mashqi (Repeat After Me · {drillIdx + 1}/{PRONUNCIATION_DRILLS.length})
                </p>
                <p className="text-base sm:text-lg font-display font-bold text-slate-900 dark:text-white mt-0.5">
                  “{currentDrill.en}”
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {currentDrill.uz} · <span className="text-sky-600 dark:text-sky-400">{currentDrill.tip}</span>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => speakEnglish(currentDrill.en, 0.85)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-xs font-bold text-sky-700 dark:text-sky-300"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Eshitish</span>
                </button>
                <button
                  type="button"
                  onClick={handlePronunciationDrill}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white ${
                    drillListening ? 'bg-rose-600' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                  <span>{drillListening ? 'Tinglanmoqda...' : 'Takrorlab ko‘rish'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDrillIdx((i) => (i + 1) % PRONUNCIATION_DRILLS.length);
                    setDrillFeedback(null);
                  }}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                >
                  Keyingi gap
                </button>
              </div>
            </div>
            {drillFeedback && (
              <div
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between ${
                  drillFeedback.scorePct >= 75
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                    : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300'
                }`}
              >
                <span>Siz aytdingiz: “{drillFeedback.spoken}”</span>
                <span className="font-mono font-bold">
                  Aniqlik: {drillFeedback.scorePct}% {drillFeedback.scorePct >= 75 ? '(+15 XP!)' : ''}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {TOPICS.map((tp) => (
              <button
                key={tp.id}
                type="button"
                onClick={() => setTopic(tp.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                  topic === tp.id
                    ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-500 text-sky-700 dark:text-sky-300'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                {tp.label}
              </button>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col h-[460px]">
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                      m.role === 'user'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    <p>{m.text}</p>
                    {m.role === 'assistant' && (
                      <button
                        type="button"
                        onClick={() => speakEnglish(m.text)}
                        className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Tinglash (English)</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <p className="text-xs text-slate-500 animate-pulse">
                  GeoEnglish Coach javob yozmoqda...
                </p>
              )}
            </div>

            {repeatResult && (
              <div className="mx-4 mb-2 px-3 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-xs text-sky-700 dark:text-sky-300">
                {repeatResult}
              </div>
            )}
            {error && (
              <div className="mx-4 mb-2 px-3 py-1.5 rounded-lg bg-rose-50 text-xs text-rose-700">
                {error}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void sendEnglishChat(input);
              }}
              className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
            >
              <button
                type="button"
                onClick={handleVoiceRepeat}
                className={`p-2.5 rounded-xl border ${
                  isListening
                    ? 'bg-rose-600 border-rose-600 text-white'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                }`}
                title="Inglizcha gapiring"
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ingliz tilida javob yozing (masalan: Tokyo is the capital of Japan)..."
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Yuborish</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: SENTENCE BUILDER */}
      {tab === 'sentences' && (
        <div className="max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-500">
              Mashq {sentIdx + 1} / {SENTENCE_TASKS.length}
            </span>
            <button
              type="button"
              onClick={() => speakEnglish(currentSentence.answer)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600"
            >
              <Volume2 className="w-4 h-4" />
              <span>Namuna talaffuzini eshitish</span>
            </button>
          </div>

          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
            O‘zbekcha gapni inglizchada yig‘ing: “{currentSentence.uz}”
          </h2>

          <div className="min-h-14 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-600 flex flex-wrap gap-2">
            {pickedWords.map((origIdx, i) => (
              <button
                key={`${origIdx}-${i}`}
                type="button"
                onClick={() =>
                  setPickedWords((prev) => prev.filter((_, idx) => idx !== i))
                }
                className="px-3 py-1.5 rounded-lg bg-sky-600 text-white text-sm font-semibold"
              >
                {currentSentence.words[origIdx]}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {shuffledWords.map((item) => {
              const used = pickedWords.includes(item.origIdx);
              return (
                <button
                  key={item.origIdx}
                  type="button"
                  disabled={used}
                  onClick={() => {
                    soundEngine.playClick();
                    setPickedWords((prev) => [...prev, item.origIdx]);
                    setSentenceFeedback(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg border text-sm font-semibold ${
                    used
                      ? 'opacity-35 border-slate-200 dark:border-slate-700'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-sky-500'
                  }`}
                >
                  {item.w}
                </button>
              );
            })}
          </div>

          {sentenceFeedback !== null && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                sentenceFeedback
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300'
              }`}
            >
              {sentenceFeedback ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              <span>
                {sentenceFeedback
                  ? 'Ajoyib! Gap grammatik jihatdan mutlaqo to‘g‘ri!'
                  : `Qayta urinib ko‘ring! To‘g‘ri javob: "${currentSentence.answer}"`}
              </span>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                const built = pickedWords
                  .map((i) => currentSentence.words[i])
                  .join(' ');
                const ok = built === currentSentence.answer;
                setSentenceFeedback(ok);
                if (ok) {
                  soundEngine.playSuccess();
                  speakEnglish(currentSentence.answer);
                  markMission('m2', 20, 'English Sentence Builder');
                } else {
                  soundEngine.playError();
                }
              }}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold"
            >
              Tekshirish
            </button>
            <button
              type="button"
              onClick={() => {
                setSentIdx((i) => (i + 1) % SENTENCE_TASKS.length);
                setPickedWords([]);
                setSentenceFeedback(null);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Keyingi gap</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: LISTENING EXERCISE */}
      {tab === 'listening' && (
        <div className="max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-500">
              Audio {listenIdx + 1} / {LISTENING_EXERCISES.length}
            </span>
            <button
              type="button"
              onClick={() => speakEnglish(currentListen.audioEn, 0.88)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold"
            >
              <Headphones className="w-4 h-4" />
              <span>Audioni eshitish (Play)</span>
            </button>
          </div>

          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
            {currentListen.questionUz}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentListen.options.map((opt, idx) => {
              const answered = listenChoice !== null;
              const isCorrect = idx === currentListen.correctIndex;
              return (
                <button
                  key={opt}
                  type="button"
                  disabled={answered}
                  onClick={() => {
                    setListenChoice(idx);
                    if (isCorrect) {
                      soundEngine.playSuccess();
                      markMission('m3', 20, 'English Listening');
                    } else {
                      soundEngine.playError();
                    }
                  }}
                  className={`p-3.5 rounded-xl border text-left text-sm font-semibold ${
                    answered
                      ? isCorrect
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500'
                        : idx === listenChoice
                        ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500'
                        : 'opacity-60 border-slate-200 dark:border-slate-700'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-sky-500'
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {listenChoice !== null && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-2">
              <p>
                <strong>Audio matni:</strong> {currentListen.audioEn}
              </p>
              <button
                type="button"
                onClick={() => {
                  setListenIdx((i) => (i + 1) % LISTENING_EXERCISES.length);
                  setListenChoice(null);
                }}
                className="text-sky-600 font-bold hover:underline"
              >
                Keyingi audio →
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: VOCABULARY FLASHCARDS */}
      {tab === 'vocab' && (
        <div className="max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 text-center">
          <p className="text-xs font-mono text-slate-500">
            So‘z {(vocabIdx % GEO_DICTIONARY_TERMS.length) + 1} /{' '}
            {GEO_DICTIONARY_TERMS.length}
          </p>
          <div
            onClick={() => setVocabFlipped((f) => !f)}
            className="cursor-pointer p-8 rounded-2xl bg-gradient-to-br from-sky-50 to-emerald-50 dark:from-sky-950/50 dark:to-emerald-950/50 border border-sky-200 dark:border-sky-800 space-y-2"
          >
            <p className="font-display text-3xl font-bold text-slate-900 dark:text-white">
              {vocabFlipped ? currentVocab.uz : currentVocab.en}
            </p>
            <p className="font-mono text-xs text-slate-500">
              {currentVocab.pronunciation}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300 pt-2">
              {vocabFlipped ? currentVocab.exampleUz : currentVocab.exampleEn}
            </p>
          </div>
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={() => speakEnglish(`${currentVocab.en}. ${currentVocab.exampleEn}`)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-semibold"
            >
              <Volume2 className="w-4 h-4" />
              <span>Talaffuz</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setVocabIdx((i) => i + 1);
                setVocabFlipped(false);
              }}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            >
              Keyingi so‘z
            </button>
          </div>
        </div>
      )}

      {/* TAB 5: ENGLISH LEVEL ASSESSMENT */}
      {tab === 'assessment' && (
        <div className="max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
            Ingliz tili darajasini aniqlash testi (CEFR Assessment)
          </h2>
          <div className="space-y-4">
            {ASSESSMENT_QUIZ.map((item, qIdx) => (
              <div
                key={qIdx}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 space-y-2.5"
              >
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {qIdx + 1}. {item.q}
                </p>
                <div className="grid grid-cols-1 gap-1.5">
                  {item.options.map((opt, oIdx) => (
                    <button
                      key={oIdx}
                      type="button"
                      onClick={() =>
                        setAssessAnswers((prev) => ({ ...prev, [qIdx]: oIdx }))
                      }
                      className={`text-left px-3 py-2 rounded-lg border text-xs font-semibold ${
                        assessAnswers[qIdx] === oIdx
                          ? 'bg-sky-600 border-sky-600 text-white'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              let correct = 0;
              ASSESSMENT_QUIZ.forEach((q, idx) => {
                if (assessAnswers[idx] === q.correct) correct += 1;
              });
              const detected: CefrLevel =
                correct === 4 ? 'B2' : correct === 3 ? 'B1' : correct === 2 ? 'A2' : 'A1';
              setLevel(detected);
              onUpdateEnglishLevel?.(detected);
              setAssessedLevel(
                `Natija: ${correct} / ${ASSESSMENT_QUIZ.length} to‘g‘ri. Tavsiya etilgan darajangiz: ${detected}`
              );
              soundEngine.playSuccess();
              onAwardXp(30, 'English Level Assessment');
            }}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold"
          >
            Darajamni aniqlash
          </button>
          {assessedLevel && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 text-sm font-bold text-emerald-800 dark:text-emerald-200">
              {assessedLevel}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
