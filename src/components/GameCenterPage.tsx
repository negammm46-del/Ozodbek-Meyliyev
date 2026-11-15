import { useMemo, useState } from 'react';
import {
  Crown,
  Gamepad2,
  Lock,
  Play,
  Search,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react';
import {
  GAME_CATEGORIES,
  GAMES_CATALOG,
  type GameCategory,
  type GameDef,
} from '../data/gamesCatalog';
import { type UserProfile, type UserProgress } from '../types/user';
import { GamePlayEngine, type GameDifficulty } from './GamePlayEngine';
import { MultiplayerArena } from './MultiplayerArena';
import { soundEngine } from '../utils/sound';

const CATEGORY_LABELS_UZ: Record<GameCategory, string> = {
  'World Map Games': 'Jahon xaritasi',
  'Flag Games': 'Bayroq o‘yinlari',
  'Capital Games': 'Poytaxt o‘yinlari',
  'Geography Puzzle Games': 'Geografik pazllar',
  'Knowledge Games': 'Bilim o‘yinlari',
  '3D Games': '3D O‘yinlar',
  'Multiplayer Games': 'Multiplayer',
  'PRO Exclusive Games': 'PRO Eksklyuziv',
};

interface GameCenterPageProps {
  user: UserProfile | null;
  progress: UserProgress;
  isDark: boolean;
  onOpenPro: () => void;
  onRecordGameResult: (payload: {
    gameId: string;
    titleUz: string;
    score: number;
    xpEarned: number;
    won: boolean;
    difficulty: GameDifficulty;
  }) => void;
  onAwardXp: (xp: number, label: string) => void;
}

export function GameCenterPage({
  user,
  progress,
  isDark,
  onOpenPro,
  onRecordGameResult,
  onAwardXp,
}: GameCenterPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<'Barchasi' | GameCategory>(
    'Barchasi'
  );
  const [search, setSearch] = useState('');
  const [activeGame, setActiveGame] = useState<GameDef | null>(null);
  const [proGateGame, setProGateGame] = useState<GameDef | null>(null);

  const filteredGames = useMemo(() => {
    const q = search.trim().toLowerCase();
    return GAMES_CATALOG.filter((g) => {
      if (selectedCategory !== 'Barchasi' && g.category !== selectedCategory) {
        return false;
      }
      if (!q) return true;
      return (
        g.titleUz.toLowerCase().includes(q) ||
        g.titleEn.toLowerCase().includes(q) ||
        g.descriptionUz.toLowerCase().includes(q)
      );
    });
  }, [selectedCategory, search]);

  function handleLaunchGame(g: GameDef) {
    soundEngine.playClick();
    if (g.isPro && !user?.isPro) {
      setProGateGame(g);
      return;
    }
    setActiveGame(g);
  }

  if (activeGame) {
    if (
      activeGame.mechanic === 'multiplayer-ws' ||
      activeGame.mechanic === 'leaderboard'
    ) {
      return (
        <MultiplayerArena
          modeTitle={activeGame.titleUz}
          initialTab={
            activeGame.mechanic === 'leaderboard' ? 'leaderboard' : 'room'
          }
          user={user}
          onBack={() => setActiveGame(null)}
          onAwardXp={onAwardXp}
        />
      );
    }

    return (
      <GamePlayEngine
        game={activeGame}
        isDark={isDark}
        onBack={() => setActiveGame(null)}
        onFinishGame={onRecordGameResult}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
            Geografiya O‘yin Markazi · {GAMES_CATALOG.length} ta real o‘yin
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Interaktiv Geografiya O‘yinlari va Jonli Bellashuvlar
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Xarita, bayroqlar, poytaxtlar, tabiiy pazllar, 5 ishora, 3D globus missiyalari hamda WebSocket orqali do‘stlar bilan multiplayer duellar.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 shrink-0">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500">Yutilgan o‘yinlar</p>
            <p className="font-mono text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
              {progress.gamesWon}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500">O‘ynalgan rekordlar</p>
            <p className="font-mono text-2xl font-bold text-emerald-600 tabular-nums">
              {Object.keys(progress.highScores).length}
            </p>
          </div>
        </div>
      </section>

      {/* Search & Category Tabs */}
      <div className="space-y-3">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="O‘yin nomini qidiring..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setSelectedCategory('Barchasi');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
              selectedCategory === 'Barchasi'
                ? 'bg-sky-600 border-sky-600 text-white'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            Barchasi ({GAMES_CATALOG.length})
          </button>

          {GAME_CATEGORIES.map((cat) => {
            const count = GAMES_CATALOG.filter((g) => g.category === cat).length;
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setSelectedCategory(cat);
                }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
                  active
                    ? cat === 'PRO Exclusive Games'
                      ? 'bg-amber-500 border-amber-500 text-slate-950'
                      : 'bg-sky-600 border-sky-600 text-white'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {cat === 'PRO Exclusive Games' && <Crown className="w-3.5 h-3.5" />}
                {cat === 'Multiplayer Games' && <Users className="w-3.5 h-3.5" />}
                <span>
                  {CATEGORY_LABELS_UZ[cat]} ({count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGames.map((g) => {
          const locked = Boolean(g.isPro && !user?.isPro);
          const bestScore = progress.highScores[g.id];
          return (
            <div
              key={g.id}
              className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all ${
                g.isPro
                  ? 'border-amber-300/70 dark:border-amber-500/30 hover:border-amber-500'
                  : 'border-slate-200 dark:border-slate-800 hover:border-sky-500'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                    {CATEGORY_LABELS_UZ[g.category]}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {typeof bestScore === 'number' && bestScore > 0 && (
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        <Trophy className="w-3 h-3" />
                        {bestScore}
                      </span>
                    )}
                    {g.isPro && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[11px] font-bold">
                        <Crown className="w-3 h-3" />
                        PRO
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white leading-snug">
                  {g.titleUz}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {g.descriptionUz}
                </p>
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  +{g.xpReward} XP
                </span>

                <button
                  type="button"
                  onClick={() => handleLaunchGame(g)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                    locked
                      ? 'bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 hover:bg-amber-100'
                      : 'bg-sky-600 hover:bg-sky-700 text-white'
                  }`}
                >
                  {locked ? (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>PRO bilan ochish</span>
                    </>
                  ) : (
                    <>
                      {g.mechanic === 'multiplayer-ws' ? (
                        <Users className="w-3.5 h-3.5" />
                      ) : g.mechanic === 'leaderboard' ? (
                        <Trophy className="w-3.5 h-3.5" />
                      ) : (
                        <Play className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {g.mechanic === 'leaderboard' ? 'Reytingni ko‘rish' : 'O‘ynash'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* PRO Gate Modal */}
      {proGateGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-500/40 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-amber-600">
                  GEOWORLD PRO Eksklyuziv
                </p>
                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                  {proGateGame.titleUz}
                </h3>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Ushbu o‘yin faqat GEOWORLD PRO obunachilari uchun ochiq. PRO rejimida 10 ta eksklyuziv o‘yin, 3D globus missiyalari va cheksiz AI ustoz imkoniyatlari mavjud.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setProGateGame(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              >
                Yopish
              </button>
              <button
                type="button"
                onClick={() => {
                  setProGateGame(null);
                  onOpenPro();
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold"
              >
                <Gamepad2 className="w-4 h-4" />
                <span>PRO Rejani ko‘rish</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
