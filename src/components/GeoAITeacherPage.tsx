import { useEffect, useRef, useState } from 'react';
import {
  Bot,
  CalendarDays,
  CheckCircle2,
  GitCompare,
  Headphones,
  HelpCircle,
  KeyRound,
  Languages,
  Mic,
  MicOff,
  Radio,
  Send,
  Settings,
  Sparkles,
  Square,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { soundEngine } from '../utils/sound';

interface MiniQuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  viaVoice?: boolean;
  miniQuiz?: MiniQuizQuestion[];
}

interface GeoAITeacherPageProps {
  initialPrompt?: string | null;
  studentLevel?: string;
  englishLevel?: string;
  geminiConfigured?: boolean;
  aiVoiceUri?: string;
  aiSpeechRate?: number;
  onChangeSpeechRate?: (rate: number) => void;
  onOpenVoiceSettings?: () => void;
  onClearInitialPrompt?: () => void;
  onAwardXp?: (xp: number, label?: string) => void;
}

type AiLang = 'uz' | 'en' | 'both' | 'mixed';

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

export function GeoAITeacherPage({
  initialPrompt,
  studentLevel = 'O‘rta',
  englishLevel = 'A2',
  geminiConfigured = true,
  aiVoiceUri = '',
  aiSpeechRate = 1.0,
  onChangeSpeechRate,
  onOpenVoiceSettings,
  onClearInitialPrompt,
  onAwardXp,
}: GeoAITeacherPageProps) {
  const [language, setLanguage] = useState<AiLang>('uz');
  const [talkMode, setTalkMode] = useState(false);
  const [voiceMode, setVoiceMode] = useState(true);
  const [speechRate, setSpeechRate] = useState<number>(aiSpeechRate);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showVoiceHistory, setShowVoiceHistory] = useState(false);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configMissing, setConfigMissing] = useState(!geminiConfigured);
  const [miniQuizAnswers, setMiniQuizAnswers] = useState<Record<string, number>>({});

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Assalomu alaykum! Men sizning GeoAI Ustozingizman. Xuddi yoningizda o‘tirgan murabbiy kabi geografiya va ingliz tilini jonli suhbat orqali o‘rgataman. Savol bering, davlatlarni taqqoslang yoki "Talk with GeoAI" rejimida ovozli gaplashing!',
    },
  ]);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    setSpeechRate(aiSpeechRate);
  }, [aiSpeechRate]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const syncVoices = () => setAvailableVoices(window.speechSynthesis.getVoices());
    syncVoices();
    window.speechSynthesis.addEventListener?.('voiceschanged', syncVoices);
    return () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', syncVoices);
      window.speechSynthesis.cancel();
      recognitionRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    setConfigMissing(!geminiConfigured);
  }, [geminiConfigured]);

  useEffect(() => {
    if (initialPrompt) {
      void sendMessage(initialPrompt, 'chat');
      onClearInitialPrompt?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt]);

  function stopSpeaking() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }

  function speakText(text: string, lang: AiLang, rate = speechRate) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/[*#_`]/g, '').slice(0, 700);
    const utter = new SpeechSynthesisUtterance(clean);
    const list =
      availableVoices.length > 0
        ? availableVoices
        : window.speechSynthesis.getVoices();
    const matchedVoice = aiVoiceUri
      ? list.find((v) => v.voiceURI === aiVoiceUri || v.name === aiVoiceUri)
      : undefined;
    if (matchedVoice) {
      utter.voice = matchedVoice;
      utter.lang = matchedVoice.lang;
    } else {
      utter.lang = lang === 'en' ? 'en-US' : 'uz-UZ';
    }
    utter.rate = rate;
    utter.onstart = () => setIsSpeaking(true);
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utter);
  }

  async function sendMessage(
    promptText: string,
    mode: 'chat' | 'mini-quiz' | 'study-plan' | 'talk' = talkMode ? 'talk' : 'chat',
    viaVoice = false,
    overrideLang?: AiLang
  ) {
    const trimmed = promptText.trim();
    if (!trimmed || loading) return;

    const effectiveLang = overrideLang ?? language;
    soundEngine.playClick();
    setError(null);

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: trimmed,
      viaVoice,
    };

    const historyForApi = messages
      .filter((m) => m.id !== 'welcome')
      .slice(-10)
      .map((m) => ({
        role: m.role === 'user' ? ('user' as const) : ('model' as const),
        text: m.text,
      }));

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/geo-ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          language: effectiveLang,
          mode,
          studentLevel,
          englishLevel,
          history: historyForApi,
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
      if (!res.ok) {
        throw new Error(data.error || 'GeoAI serverida xatolik yuz berdi');
      }

      if (mode === 'mini-quiz' && Array.isArray(data.questions)) {
        const aiMsg: ChatMessage = {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: 'Quyida siz uchun tayyorlangan interaktiv mini-test:',
          miniQuiz: data.questions,
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        const replyText =
          typeof data.reply === 'string' && data.reply.trim()
            ? data.reply
            : 'Javob olinmadi, qayta urinib ko‘ring.';
        const aiMsg: ChatMessage = {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: replyText,
          viaVoice: viaVoice || talkMode,
        };
        setMessages((prev) => [...prev, aiMsg]);
        if (voiceMode && (talkMode || viaVoice)) {
          speakText(replyText, effectiveLang);
        }
      }
      onAwardXp?.(10, 'GeoAI suhbati');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'GeoAI Ustoz bilan bog‘lanishda xatolik yuz berdi.'
      );
    } finally {
      setLoading(false);
    }
  }

  function handleToggleMic() {
    if (typeof window === 'undefined') return;
    stopSpeaking();

    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionInstance;
      webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
    };
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRec) {
      setError('Brauzeringiz ovozli kiritishni qo‘llab-quvvatlamaydi.');
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const rec = new SpeechRec();
    rec.lang = language === 'en' ? 'en-US' : 'uz-UZ';
    rec.interimResults = false;
    rec.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) {
        if (talkMode) {
          void sendMessage(transcript, 'talk', true);
        } else {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      }
    };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);
    recognitionRef.current = rec;
    setIsListening(true);
    rec.start();
  }

  const displayedMessages = showVoiceHistory
    ? messages.filter((m) => m.viaVoice)
    : messages;

  const quickActions: Array<{
    label: string;
    prompt: string;
    mode: 'chat' | 'mini-quiz' | 'study-plan' | 'talk';
    lang?: AiLang;
    icon: typeof Sparkles;
  }> = [
    {
      label: 'O‘zbekcha tushuntirib, inglizchasini takrorla',
      prompt: 'Yaponiya va O‘zbekiston geografiyasini qisqacha o‘zbek tilida tushuntir, so‘ngra asosiy xulosani ingliz tilida takrorla.',
      mode: talkMode ? 'talk' : 'chat',
      lang: 'both',
      icon: Languages,
    },
    {
      label: 'O‘zbekiston vs Yaponiya taqqoslash',
      prompt: 'O‘zbekiston va Yaponiyani hududi, aholisi, iqlimi va iqtisodiyoti bo‘yicha insoniy ustozdek qiziqarli taqqoslab tushuntir.',
      mode: talkMode ? 'talk' : 'chat',
      icon: GitCompare,
    },
    {
      label: 'Menga savol ber va xatomni tushuntir',
      prompt: 'Menga dunyo geografiyasi bo‘yicha qiziqarli 1 ta savol ber va javobimni kut.',
      mode: talkMode ? 'talk' : 'chat',
      icon: HelpCircle,
    },
    {
      label: '7 kunlik individual o‘quv rejasi',
      prompt: 'Menga 196 ta davlat va geografik rekordlarni o‘rganish uchun 7 kunlik individual o‘quv rejasini tuzib ber.',
      mode: 'study-plan',
      icon: CalendarDays,
    },
    {
      label: 'Mini-test tuzish (3 savol)',
      prompt: 'Osiyo va Yevropa davlatlari poytaxtlari hamda tog‘lari bo‘yicha 3 ta test tuzing.',
      mode: 'mini-quiz',
      icon: Sparkles,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-sky-600 flex items-center justify-center text-white shrink-0">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                GeoAI Ustoz — Insoniy AI Murabbiy & Talk with GeoAI
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Darajangizga moslashadi ({studentLevel}) · O‘zbek, Ingliz va aralash til · Real-vaqt ovozli muloqot
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setTalkMode((v) => !v);
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
                talkMode
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
              }`}
            >
              <Radio className="w-4 h-4" />
              <span>Talk with GeoAI {talkMode ? 'Faol' : 'Rejimi'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setShowVoiceHistory((v) => !v);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border ${
                showVoiceHistory
                  ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-500 text-sky-700 dark:text-sky-300'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>Ovozli tarix</span>
            </button>
          </div>
        </div>

        {/* Language, Speed & Voice Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="inline-flex flex-wrap rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
            {(
              [
                { id: 'uz', label: 'O‘zbekcha' },
                { id: 'en', label: 'English' },
                { id: 'both', label: 'UZ → EN' },
                { id: 'mixed', label: 'Aralash' },
              ] as Array<{ id: AiLang; label: string }>
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setLanguage(opt.id);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  language === opt.id
                    ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-mono">
              <span className="px-2 text-slate-500">Tezlik:</span>
              {[0.75, 1.0, 1.25].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setSpeechRate(r);
                    onChangeSpeechRate?.(r);
                  }}
                  className={`px-2 py-1 rounded-lg font-bold ${
                    Math.abs(speechRate - r) < 0.03
                      ? 'bg-white dark:bg-slate-900 text-sky-600'
                      : 'text-slate-500'
                  }`}
                >
                  {r}x
                </button>
              ))}
              {![0.75, 1.0, 1.25].some((r) => Math.abs(speechRate - r) < 0.03) && (
                <span className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 text-indigo-600 font-bold">
                  {speechRate.toFixed(2).replace(/\.00$/, '.0')}x
                </span>
              )}
            </div>

            {onOpenVoiceSettings && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onOpenVoiceSettings();
                }}
                title="Sozlamalarda AI ovozini tanlash"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-indigo-500"
              >
                <Settings className="w-3.5 h-3.5 text-indigo-600" />
                <span className="max-w-32 truncate">
                  {aiVoiceUri
                    ? availableVoices.find((v) => v.voiceURI === aiVoiceUri)?.name ||
                      'Tanlangan ovoz'
                    : 'Ovoz sozlamalari'}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                if (voiceMode) stopSpeaking();
                setVoiceMode((v) => !v);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold ${
                voiceMode
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {voiceMode ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span>{voiceMode ? 'Ovozli javob yoqilgan' : 'Ovozsiz'}</span>
            </button>

            {isSpeaking && (
              <button
                type="button"
                onClick={stopSpeaking}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold"
              >
                <Square className="w-3.5 h-3.5 fill-white" />
                <span>Ovozni to‘xtatish</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Talk with GeoAI Voice Banner */}
        {(talkMode || isListening || isSpeaking) && (
          <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                className={`w-3 h-3 rounded-full ${
                  isListening
                    ? 'bg-rose-500 animate-ping'
                    : isSpeaking
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-indigo-500'
                }`}
              />
              <p className="text-xs sm:text-sm font-semibold text-indigo-900 dark:text-indigo-200">
                {isListening
                  ? 'Sizni tinglayapman... Gapiring!'
                  : isSpeaking
                  ? 'GeoAI gapirmoqda (to‘xtatish tugmasi bilan bo‘lishingiz mumkin)...'
                  : 'Talk with GeoAI tayyor! Mikrofon tugmasini bosing va bemalol gaplashing.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleMic}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold ${
                isListening
                  ? 'bg-rose-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              <span>{isListening ? 'Tinglashni to‘xtatish' : 'Gapirishni boshlash'}</span>
            </button>
          </div>
        )}
      </div>

      {configMissing && (
        <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                GeoAI Ustoz uchun Gemini API kaliti talab qilinadi
              </h2>
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                Real insoniy AI suhbat, mini-test yaratish va ovozli muloqot ishlashi uchun AI Studio{' '}
                <strong>Settings → Secrets</strong> (yoki <code className="font-mono">.env</code>) bo‘limiga{' '}
                <code className="font-mono font-bold">GEMINI_API_KEY</code> o‘zgaruvchisini kiriting va serverni qayta ishga tushiring.
              </p>
            </div>
          </div>
          <span className="px-3 py-1.5 rounded-xl bg-amber-200/70 dark:bg-amber-900 text-amber-900 dark:text-amber-200 font-mono text-xs font-bold shrink-0 self-start sm:self-center">
            GEMINI_API_KEY: Sozlanmagan
          </span>
        </div>
      )}

      {/* Quick Prompts */}
      <div className="flex flex-wrap gap-2">
        {quickActions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.label}
              type="button"
              disabled={loading}
              onClick={() => void sendMessage(act.prompt, act.mode, false, act.lang)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-sky-500 transition-colors disabled:opacity-50"
            >
              <Icon className="w-3.5 h-3.5 text-sky-600" />
              <span>{act.label}</span>
            </button>
          );
        })}
      </div>

      {/* Chat Stream */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col h-[520px]">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {displayedMessages.length === 0 ? (
            <p className="text-center text-xs text-slate-500 py-10">
              Hali ovozli suhbatlar yozilmagan. Talk with GeoAI orqali gaplashib ko‘ring!
            </p>
          ) : (
            displayedMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[88%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {msg.miniQuiz && (
                    <div className="mt-3 space-y-3">
                      {msg.miniQuiz.map((q, qIdx) => {
                        const key = `${msg.id}-${qIdx}`;
                        const chosen = miniQuizAnswers[key];
                        const answered = typeof chosen === 'number';
                        return (
                          <div
                            key={key}
                            className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2"
                          >
                            <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                              {qIdx + 1}. {q.question}
                            </p>
                            <div className="grid grid-cols-1 gap-1.5">
                              {q.options.map((opt, optIdx) => {
                                const isCorrect = optIdx === q.correctIndex;
                                const isSelected = chosen === optIdx;
                                let cls =
                                  'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100';
                                if (answered) {
                                  if (isCorrect)
                                    cls =
                                      'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200';
                                  else if (isSelected)
                                    cls =
                                      'border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200';
                                }
                                return (
                                  <button
                                    key={optIdx}
                                    type="button"
                                    disabled={answered}
                                    onClick={() => {
                                      setMiniQuizAnswers((prev) => ({
                                        ...prev,
                                        [key]: optIdx,
                                      }));
                                      if (optIdx === q.correctIndex) {
                                        soundEngine.playSuccess();
                                        onAwardXp?.(15, 'GeoAI mini-test');
                                      } else {
                                        soundEngine.playError();
                                      }
                                    }}
                                    className={`text-left px-3 py-2 rounded-lg border text-xs font-medium flex items-center justify-between ${cls}`}
                                  >
                                    <span>{opt}</span>
                                    {answered && isCorrect && (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                            {answered && (
                              <p className="text-xs text-slate-600 dark:text-slate-300">
                                <strong>Izoh:</strong> {q.explanation}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {msg.role === 'assistant' && (
                    <div className="mt-2 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => speakText(msg.text, language)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-sky-600"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>O‘qib berish</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="flex justify-start">
              <div className="px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 animate-pulse">
                GeoAI Ustoz o‘ylamoqda...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {error && (
          <div className="mx-4 mb-2 px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        {/* Composer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void sendMessage(input, talkMode ? 'talk' : 'chat');
          }}
          className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
        >
          <button
            type="button"
            onClick={handleToggleMic}
            aria-label={isListening ? 'Mikrofonni to‘xtatish' : 'Ovoz bilan yozish'}
            className={`p-2.5 rounded-xl border transition-colors shrink-0 ${
              isListening
                ? 'bg-rose-600 border-rose-600 text-white'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              talkMode
                ? 'Yozing yoki mikrofon orqali GeoAI bilan jonli gaplashing...'
                : 'Istalgan davlat, tog‘, iqlim yoki geografik savolni yozing...'
            }
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-sky-600"
          />

          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold disabled:opacity-50 shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Yuborish</span>
          </button>
        </form>
      </div>
    </div>
  );
}
