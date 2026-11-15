import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Crown,
  Play,
  Trophy,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { getLeaderboardFromFirestore } from '../firebase/firestore.js';
import { type LeaderboardEntry, type UserProfile } from '../types/user';
import { soundEngine } from '../utils/sound';

interface RoomState {
  code: string;
  mode: string;
  hostId: string;
  status: 'waiting' | 'playing' | 'finished';
  roundIndex: number;
  totalRounds: number;
  question: { prompt: string; options: string[]; hint: string } | null;
  players: Array<{
    id: string;
    name: string;
    avatar: string;
    score: number;
    answered: boolean;
  }>;
}

interface MultiplayerArenaProps {
  modeTitle: string;
  initialTab?: 'room' | 'leaderboard';
  user: UserProfile | null;
  onBack: () => void;
  onAwardXp: (xp: number, label: string) => void;
}

export function MultiplayerArena({
  modeTitle,
  initialTab = 'room',
  user,
  onBack,
  onAwardXp,
}: MultiplayerArenaProps) {
  const [tab, setTab] = useState<'room' | 'leaderboard'>(initialTab);
  const [connected, setConnected] = useState(false);
  const [myId, setMyId] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomState | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [playerName, setPlayerName] = useState(user?.username || 'Geograf');
  const [wsError, setWsError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    correctIndex: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [recentScores, setRecentScores] = useState<
    Array<{
      id: string;
      username: string;
      avatar: string;
      game_id: string;
      score: number;
      created_at: string;
    }>
  >([]);

  const wsRef = useRef<WebSocket | null>(null);
  const awardedRef = useRef(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/leaderboard')
        .then((r) => r.json())
        .catch(() => ({ topUsers: [], recentScores: [] })),
      getLeaderboardFromFirestore(20).catch(() => []),
    ])
      .then(([d, fsRows]) => {
        const backendRows: LeaderboardEntry[] = Array.isArray(d.topUsers)
          ? d.topUsers
          : [];
        const mappedFs: LeaderboardEntry[] = (
          fsRows as Array<Record<string, unknown>>
        ).map((row, idx) => ({
          rank: Number(row.rank || idx + 1),
          id: String(row.uid || `fs_${idx}`),
          username: String(row.displayName || 'Geograf'),
          avatar: '🌍',
          countryCode: String(row.country || 'UZ'),
          xp: Number(row.xp || 0),
          streak: Number(row.streak || 1),
          isPro: Boolean(row.isPro),
        }));

        const byId = new Map<string, LeaderboardEntry>();
        for (const row of [...mappedFs, ...backendRows]) {
          const prev = byId.get(row.id);
          if (!prev || row.xp > prev.xp) {
            byId.set(row.id, row);
          }
        }
        const merged = Array.from(byId.values())
          .sort((a, b) => b.xp - a.xp)
          .slice(0, 25)
          .map((item, i) => ({ ...item, rank: i + 1 }));

        setLeaderboard(merged);
        if (Array.isArray(d.recentScores)) setRecentScores(d.recentScores);
      })
      .catch(() => {});
  }, [tab, room?.status]);

  useEffect(() => {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${proto}//${window.location.host}/ws/multiplayer`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'connected') {
          setMyId(msg.playerId);
        } else if (msg.type === 'room_state') {
          setRoom((prev) => {
            if (prev && prev.roundIndex !== msg.room.roundIndex) {
              setFeedback(null);
            }
            return msg.room;
          });
          setWsError(null);
        } else if (msg.type === 'answer_feedback') {
          setFeedback({
            isCorrect: Boolean(msg.isCorrect),
            correctIndex: Number(msg.correctIndex),
          });
          if (msg.isCorrect) soundEngine.playSuccess();
          else soundEngine.playError();
        } else if (msg.type === 'error') {
          setWsError(msg.message);
        }
      } catch {
        // ignore
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    if (room?.status === 'finished' && !awardedRef.current) {
      awardedRef.current = true;
      const me = room.players.find((p) => p.id === myId);
      const earned = Math.max(20, Math.round((me?.score || 0) / 8));
      onAwardXp(earned, `Multiplayer: ${room.mode}`);
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.65 } });
    }
    if (room?.status === 'playing') {
      awardedRef.current = false;
    }
  }, [room?.status, room?.players, room?.mode, myId, onAwardXp]);

  function sendPacket(payload: Record<string, unknown>) {
    if (wsRef.current && wsRef.current.readyState === 1) {
      wsRef.current.send(JSON.stringify(payload));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>O‘yin markaziga qaytish</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTab('room')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold ${
              tab === 'room'
                ? 'bg-sky-600 text-white'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800'
            }`}
          >
            Jonli Xona (Multiplayer)
          </button>
          <button
            type="button"
            onClick={() => setTab('leaderboard')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold ${
              tab === 'leaderboard'
                ? 'bg-sky-600 text-white'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800'
            }`}
          >
            Global Reyting
          </button>
        </div>
      </div>

      {tab === 'room' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                {modeTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Real-vaqt WebSocket multiplayer serveri orqali do‘stlaringiz bilan bellashing
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                connected ? 'text-emerald-600' : 'text-rose-500'
              }`}
            >
              {connected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span>{connected ? 'Serverga ulangan' : 'Ulanmoqda...'}</span>
            </span>
          </div>

          {wsError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-xs text-rose-700 dark:text-rose-300">
              {wsError}
            </div>
          )}

          {!room ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                  Yangi xona yaratish
                </h3>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    O‘yinchi ismingiz
                  </label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
                  />
                </div>
                <button
                  type="button"
                  disabled={!connected}
                  onClick={() =>
                    sendPacket({
                      type: 'create_room',
                      name: playerName,
                      avatar: user?.avatar || '🧭',
                      mode: modeTitle,
                    })
                  }
                  className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold disabled:opacity-50"
                >
                  Xona kodi yaratish
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                  Kod orqali qo‘shilish
                </h3>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    6 xonali xona kodi
                  </label>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="MASALAN: A1B2C3"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-mono uppercase tracking-widest"
                  />
                </div>
                <button
                  type="button"
                  disabled={!connected || !joinCode.trim()}
                  onClick={() =>
                    sendPacket({
                      type: 'join_room',
                      roomCode: joinCode,
                      name: playerName,
                      avatar: user?.avatar || '🌍',
                    })
                  }
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-50"
                >
                  Xonaga kirish
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Room Code Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-sky-600" />
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Xona kodi</p>
                    <p className="font-mono text-2xl font-bold tracking-widest text-slate-900 dark:text-white">
                      {room.code}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(room.code);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copied ? 'Nusxalandi' : 'Nusxalash'}</span>
                  </button>
                </div>

                {room.status === 'waiting' && room.hostId === myId && (
                  <button
                    type="button"
                    onClick={() => sendPacket({ type: 'start_match' })}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold"
                  >
                    <Play className="w-4 h-4" />
                    <span>Musobaqani boshlash</span>
                  </button>
                )}
              </div>

              {/* Players List */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {room.players.map((p, idx) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xl">{p.avatar}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {p.name} {p.id === myId ? '(Siz)' : ''}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono tabular-nums">
                          #{idx + 1} · {p.score} ball
                        </p>
                      </div>
                    </div>
                    {p.answered && room.status === 'playing' && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    )}
                  </div>
                ))}
              </div>

              {room.status === 'waiting' && (
                <p className="text-sm text-center text-slate-500 py-4">
                  Do‘stlaringiz {room.code} kodi bilan qo‘shilishini kuting yoki yakka tartibda sinov uchun boshlash tugmasini bosing.
                </p>
              )}

              {room.status === 'playing' && room.question && (
                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-4">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>
                      Raund {room.roundIndex + 1} / {room.totalRounds}
                    </span>
                    {room.hostId === myId && (
                      <button
                        type="button"
                        onClick={() => sendPacket({ type: 'next_round' })}
                        className="text-sky-600 hover:underline"
                      >
                        Keyingi raundga o‘tish
                      </button>
                    )}
                  </div>
                  <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                    {room.question.prompt}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {room.question.options.map((opt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        disabled={Boolean(feedback)}
                        onClick={() =>
                          sendPacket({ type: 'submit_answer', optionIndex: idx })
                        }
                        className={`p-3.5 rounded-xl border text-left text-sm font-semibold transition-colors ${
                          feedback
                            ? idx === feedback.correctIndex
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-200'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 opacity-60'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-sky-500'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {room.status === 'finished' && (
                <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
                  <Trophy className="w-10 h-10 text-amber-500 mx-auto" />
                  <h3 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                    Musobaqa yakunlandi! G‘olib: {room.players[0]?.name}
                  </h3>
                  {room.hostId === myId && (
                    <button
                      type="button"
                      onClick={() => sendPacket({ type: 'start_match' })}
                      className="px-5 py-2.5 rounded-xl bg-sky-600 text-white text-sm font-semibold"
                    >
                      Qayta o‘ynash
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'leaderboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span>Global Reyting (Top XP)</span>
            </h2>
            {leaderboard.length === 0 ? (
              <p className="text-sm text-slate-500">
                Ro‘yxatdan o‘tgan birinchi o‘yinchi bo‘lib reytingda peshqadamlikni egallang!
              </p>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-sky-600 w-6 tabular-nums">
                        #{u.rank}
                      </span>
                      <span className="text-xl">{u.avatar}</span>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{u.username}</span>
                          {u.isPro && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                        </p>
                        <p className="text-xs text-slate-500">Streak: {u.streak} kun</p>
                      </div>
                    </div>
                    <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {u.xp} XP
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              So‘nggi o‘yin natijalari
            </h2>
            {recentScores.length === 0 ? (
              <p className="text-xs text-slate-500">Hali o‘yin natijalari qayd etilmagan.</p>
            ) : (
              <div className="space-y-2">
                {recentScores.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span>{s.avatar}</span>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{s.username}</p>
                        <p className="text-slate-500">{s.game_id}</p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-sky-600 tabular-nums">
                      {s.score} ball
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
