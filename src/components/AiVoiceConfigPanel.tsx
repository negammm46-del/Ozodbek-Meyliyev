import { useEffect, useMemo, useState } from 'react';
import {
  AudioLines,
  CheckCircle2,
  Gauge,
  Play,
  RefreshCw,
  RotateCcw,
  Square,
  Volume2,
} from 'lucide-react';
import { soundEngine } from '../utils/sound';

interface AiVoiceConfigPanelProps {
  voiceUri: string;
  speechRate: number;
  onSaveConfig: (voiceUri: string, speechRate: number) => void;
  onOpenGeoAi?: () => void;
}

const SPEED_PRESETS = [
  { value: 0.75, label: '0.75x (Sekin)' },
  { value: 1.0, label: '1.0x (Tabiiy)' },
  { value: 1.25, label: '1.25x (Tez)' },
  { value: 1.5, label: '1.5x (Juda tez)' },
];

const SAMPLE_PHRASES = [
  {
    id: 'uz',
    label: 'O‘zbekcha namuna',
    lang: 'uz-UZ',
    text: 'Assalomu alaykum! Men GeoAI Ustozman. Bugun siz bilan dunyo geografiyasini o‘rganamiz.',
  },
  {
    id: 'en',
    label: 'English sample',
    lang: 'en-US',
    text: 'Hello! I am GeoAI Teacher. Let us explore world capitals, oceans, and mountains together.',
  },
];

export function AiVoiceConfigPanel({
  voiceUri,
  speechRate,
  onSaveConfig,
  onOpenGeoAi,
}: AiVoiceConfigPanelProps) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceUri, setSelectedVoiceUri] = useState<string>(voiceUri);
  const [rate, setRate] = useState<number>(speechRate);
  const [sampleLang, setSampleLang] = useState<'uz' | 'en'>('en');
  const [customPreviewText, setCustomPreviewText] = useState<string>(
    SAMPLE_PHRASES[1].text
  );
  const [isTesting, setIsTesting] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  const ttsSupported =
    typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    setSelectedVoiceUri(voiceUri);
  }, [voiceUri]);

  useEffect(() => {
    setRate(speechRate);
  }, [speechRate]);

  function loadVoices() {
    if (!ttsSupported) return;
    const list = window.speechSynthesis.getVoices();
    setVoices(list);
  }

  useEffect(() => {
    if (!ttsSupported) return;
    loadVoices();
    const handleVoicesChanged = () => loadVoices();
    window.speechSynthesis.addEventListener?.(
      'voiceschanged',
      handleVoicesChanged
    );
    return () => {
      window.speechSynthesis.removeEventListener?.(
        'voiceschanged',
        handleVoicesChanged
      );
      window.speechSynthesis.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ttsSupported]);

  const sortedVoices = useMemo(() => {
    const priority = (lang: string) => {
      const l = lang.toLowerCase();
      if (l.startsWith('uz')) return 0;
      if (l.startsWith('en')) return 1;
      if (l.startsWith('ru')) return 2;
      if (l.startsWith('tr')) return 3;
      return 4;
    };
    return [...voices].sort((a, b) => {
      const pa = priority(a.lang);
      const pb = priority(b.lang);
      if (pa !== pb) return pa - pb;
      return a.name.localeCompare(b.name);
    });
  }, [voices]);

  const activeVoiceObj = useMemo(
    () =>
      sortedVoices.find(
        (v) => v.voiceURI === selectedVoiceUri || v.name === selectedVoiceUri
      ) || null,
    [sortedVoices, selectedVoiceUri]
  );

  function stopPreview() {
    if (!ttsSupported) return;
    window.speechSynthesis.cancel();
    setIsTesting(false);
  }

  function handlePreviewVoice() {
    if (!ttsSupported) return;
    soundEngine.playClick();
    window.speechSynthesis.cancel();
    const text = customPreviewText.trim() || SAMPLE_PHRASES[0].text;
    const utter = new SpeechSynthesisUtterance(text);
    if (activeVoiceObj) {
      utter.voice = activeVoiceObj;
      utter.lang = activeVoiceObj.lang;
    } else {
      utter.lang = sampleLang === 'en' ? 'en-US' : 'uz-UZ';
    }
    utter.rate = rate;
    utter.onstart = () => setIsTesting(true);
    utter.onend = () => setIsTesting(false);
    utter.onerror = () => setIsTesting(false);
    setIsTesting(true);
    window.speechSynthesis.speak(utter);
  }

  function handleApply(nextUri = selectedVoiceUri, nextRate = rate) {
    soundEngine.playSuccess();
    onSaveConfig(nextUri, nextRate);
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 2500);
  }

  function handleReset() {
    soundEngine.playClick();
    stopPreview();
    setSelectedVoiceUri('');
    setRate(1.0);
    onSaveConfig('', 1.0);
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 2500);
  }

  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <AudioLines className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              AI Ovoz Sozlamalari (GeoAI Ustoz TTS)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              GeoAI Ustoz uchun Text-to-Speech ovozini va nutq tezligini moslang
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {savedNotice && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Saqlandi</span>
            </span>
          )}
          {onOpenGeoAi && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onOpenGeoAi();
              }}
              className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:border-indigo-500 transition-colors"
            >
              GeoAI Ustozga o‘tish →
            </button>
          )}
        </div>
      </div>

      {!ttsSupported ? (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200">
          Brauzeringiz Web Speech API (Text-to-Speech) funksiyasini qo‘llab-quvvatlamaydi. Chrome, Edge yoki Safari brauzeridan foydalaning.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Voice Selection */}
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="ai-voice-select"
                className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5"
              >
                <Volume2 className="w-3.5 h-3.5 text-sky-600" />
                <span>AI Ovozini tanlash ({sortedVoices.length} ta mavjud)</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  loadVoices();
                }}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Yangilash</span>
              </button>
            </div>

            <select
              id="ai-voice-select"
              value={selectedVoiceUri}
              onChange={(e) => {
                const nextUri = e.target.value;
                setSelectedVoiceUri(nextUri);
                handleApply(nextUri, rate);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">
                Avtomatik (GeoAI tanlangan tiliga mos standart ovoz)
              </option>
              {sortedVoices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang}){v.localService ? ' · Mahalliy' : ' · Bulut'}
                </option>
              ))}
            </select>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <p>
                <strong>Faol ovoz:</strong>{' '}
                {activeVoiceObj
                  ? `${activeVoiceObj.name} (${activeVoiceObj.lang})`
                  : 'Avtomatik (Tilga mos)'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                GeoAI Ustozdagi barcha o‘qib berish va “Talk with GeoAI” ovozli javoblari tanlangan ovoz bilan ijro etiladi.
              </p>
            </div>
          </div>

          {/* Speaking Speed Control */}
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="ai-speed-slider"
                className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5"
              >
                <Gauge className="w-3.5 h-3.5 text-indigo-600" />
                <span>Nutq tezligi (Speaking Speed)</span>
              </label>
              <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 font-mono text-xs font-bold text-indigo-700 dark:text-indigo-300 tabular-nums">
                {rate.toFixed(2).replace(/\.00$/, '.0')}x
              </span>
            </div>

            <input
              id="ai-speed-slider"
              type="range"
              min={0.6}
              max={1.6}
              step={0.05}
              value={rate}
              onChange={(e) => {
                const nextRate = Number(e.target.value);
                setRate(nextRate);
              }}
              onMouseUp={() => handleApply(selectedVoiceUri, rate)}
              onTouchEnd={() => handleApply(selectedVoiceUri, rate)}
              onKeyUp={() => handleApply(selectedVoiceUri, rate)}
              className="w-full accent-indigo-600 cursor-pointer"
            />

            <div className="flex flex-wrap gap-2">
              {SPEED_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setRate(preset.value);
                    handleApply(selectedVoiceUri, preset.value);
                  }}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                    Math.abs(rate - preset.value) < 0.03
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-400'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Live Voice Preview & Actions */}
          <div className="lg:col-span-12 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Ovozni sinab ko‘rish (Preview)
              </span>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_PHRASES.map((sp) => (
                  <button
                    key={sp.id}
                    type="button"
                    onClick={() => {
                      setSampleLang(sp.id as 'uz' | 'en');
                      setCustomPreviewText(sp.text);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                      sampleLang === sp.id
                        ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-400 text-sky-700 dark:text-sky-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {sp.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                value={customPreviewText}
                onChange={(e) => setCustomPreviewText(e.target.value)}
                placeholder="Sinov matnini kiriting..."
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
              <div className="flex items-center gap-2 shrink-0">
                {isTesting ? (
                  <button
                    type="button"
                    onClick={stopPreview}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold"
                  >
                    <Square className="w-3.5 h-3.5 fill-white" />
                    <span>To‘xtatish</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePreviewVoice}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Sinab ko‘rish</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleApply(selectedVoiceUri, rate)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                >
                  Saqlash
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  title="Standart holatga qaytarish"
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
