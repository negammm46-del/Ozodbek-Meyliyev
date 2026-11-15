import { useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Crown,
  Eye,
  Heart,
  HelpCircle,
  KeyRound,
  Lock,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  Unlock,
  XCircle,
} from 'lucide-react';
import { geoNaturalEarth1, geoPath, type GeoPermissibleObjects } from 'd3-geo';
import { feature } from 'topojson-client';
import countriesAtlas from 'world-atlas/countries-110m.json';
import { type GameDef } from '../data/gamesCatalog';
import {
  ALL_SOVEREIGN_COUNTRIES,
  type FullCountryLesson,
} from '../data/sovereignStatesCatalog';
import { GEO_COUNTRIES, type GeoCountry } from '../data/geoWorldData';
import {
  GEOGRAPHY_RECORDS,
  OLYMPIAD_EXAM_QUESTIONS,
} from '../data/academyData';
import { CountryFlag } from './CountryFlag';
import { CountryLocatorMap } from './CountryLocatorMap';
import { EarthGlobe3D } from './EarthGlobe3D';
import { soundEngine } from '../utils/sound';

export type GameDifficulty = 'Oson' | 'O‘rta' | 'Qiyin';

interface GamePlayEngineProps {
  game: GameDef;
  isDark: boolean;
  onBack: () => void;
  onFinishGame: (payload: {
    gameId: string;
    titleUz: string;
    score: number;
    xpEarned: number;
    won: boolean;
    difficulty: GameDifficulty;
  }) => void;
}

interface McqQuestion {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  flagIso2?: string;
  flagName?: string;
  country?: FullCountryLesson;
}

interface TfStatement {
  statement: string;
  isTrue: boolean;
  explanation: string;
}

interface CluesItem {
  country: FullCountryLesson;
  clues: string[];
  options: FullCountryLesson[];
}

interface EscapeRoomStage {
  roomNumber: number;
  titleUz: string;
  riddleUz: string;
  options: string[];
  correctIndex: number;
  unlockNoteUz: string;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

type TopologyInput = Parameters<typeof feature>[0];
type GeoObjectInput = Parameters<typeof feature>[1];

const ATLAS_FEATURE_MAP: Map<string, GeoPermissibleObjects> = (() => {
  const map = new Map<string, GeoPermissibleObjects>();
  const topology = countriesAtlas as unknown as TopologyInput & {
    objects: { countries: GeoObjectInput };
  };
  const collection = feature(topology, topology.objects.countries) as unknown as {
    features: Array<{ properties?: { name?: string }; geometry: unknown; type: 'Feature' }>;
  };
  for (const feat of collection.features) {
    const name = feat.properties?.name;
    if (name) {
      map.set(name.toLowerCase(), feat as unknown as GeoPermissibleObjects);
    }
  }
  return map;
})();

function getCountryShapeSvgPath(atlasName: string): string | null {
  const feat = ATLAS_FEATURE_MAP.get(atlasName.toLowerCase());
  if (!feat) return null;
  const proj = geoNaturalEarth1().fitExtent(
    [
      [16, 16],
      [264, 154],
    ],
    feat
  );
  return geoPath(proj)(feat) || null;
}

function pickPoolByDifficulty(difficulty: GameDifficulty): FullCountryLesson[] {
  if (difficulty === 'Oson') {
    return ALL_SOVEREIGN_COUNTRIES.filter(
      (c) => c.populationM >= 15 || c.areaKm2 >= 350000
    );
  }
  if (difficulty === 'O‘rta') {
    return ALL_SOVEREIGN_COUNTRIES.filter((c) => c.populationM >= 3);
  }
  return ALL_SOVEREIGN_COUNTRIES;
}

const SIMILAR_FLAG_GROUPS: string[][] = [
  ['ID', 'MC', 'PL'],
  ['NO', 'IS', 'DK', 'FI'],
  ['TD', 'RO', 'MD'],
  ['IE', 'CI', 'IT'],
  ['NL', 'LU', 'FR'],
  ['AU', 'NZ', 'FJ'],
  ['CO', 'EC', 'VE'],
  ['ML', 'GN', 'SN'],
  ['JO', 'PS', 'SD'],
  ['SI', 'SK', 'RU'],
];

const ESCAPE_STAGES: EscapeRoomStage[] = [
  {
    roomNumber: 1,
    titleUz: '1-Xona: Ikki marta yopiq eshik',
    riddleUz:
      'Dunyoda ochiq okeanga chiqish uchun kamida ikkita qo‘shni davlat chegarasidan o‘tish zarur bo‘lgan atigi ikkita davlat bor. Ulardan biri — O‘zbekiston, ikkinchisi qaysi?',
    options: ['Shveysariya', 'Lixtenshteyn', 'Andorra', 'Lyuksemburg'],
    correctIndex: 1,
    unlockNoteUz: 'To‘g‘ri! Lixtenshteyn va O‘zbekiston — sayyoramizdagi ikkita double-landlocked davlat.',
  },
  {
    roomNumber: 2,
    titleUz: '2-Xona: Ekvator va Meridian siri',
    riddleUz:
      'Qaysi materik bir vaqtning o‘zida Shimoliy, Janubiy, Sharqiy va G‘arbiy yarimsharlarning barchasida joylashgan?',
    options: ['Osiyo', 'Janubiy Amerika', 'Afrika', 'Avstraliya'],
    correctIndex: 2,
    unlockNoteUz: 'Barakalla! Ekvator ham, Grinvich meridiani ham Afrikani kesib o‘tadi.',
  },
  {
    roomNumber: 3,
    titleUz: '3-Xona: Koinotga eng yaqin cho‘qqi',
    riddleUz:
      'Yerning ekvatordagi qabariqligi tufayli Yer markazidan eng uzoqda turgan tog‘ cho‘qqisi qaysi?',
    options: ['Everest', 'K2', 'Chimboraso', 'Kilimanjaro'],
    correctIndex: 2,
    unlockNoteUz: 'Ekvadordagi Chimboraso vulqoni Yer markazidan 6 384.4 km uzoqda joylashgan.',
  },
  {
    roomNumber: 4,
    titleUz: '4-Xona: Qirg‘oqsiz dengiz kaliti',
    riddleUz:
      'Quruqlik qirg‘og‘iga ega bo‘lmagan, faqat Atlantika oqimlari bilan chegaralangan yagona dengiz qaysi?',
    options: ['Sargass dengizi', 'Bering dengizi', 'O‘lik dengiz', 'Qizil dengiz'],
    correctIndex: 0,
    unlockNoteUz: 'Tabriklaymiz! Barcha 4 ta geografik qulf muvaffaqiyatli ochildi!',
  },
];

function buildMcqQuestions(
  game: GameDef,
  difficulty: GameDifficulty
): McqQuestion[] {
  const pool = shuffle(pickPoolByDifficulty(difficulty));
  const count = game.mechanic === 'survival' || game.mechanic === 'flag-elimination' ? 20 : 8;

  if (game.mechanic === 'flag-similar') {
    const questions: McqQuestion[] = [];
    for (const grp of shuffle(SIMILAR_FLAG_GROUPS).slice(0, 8)) {
      const candidates = grp
        .map((iso) => ALL_SOVEREIGN_COUNTRIES.find((c) => c.iso2 === iso))
        .filter((c): c is FullCountryLesson => Boolean(c));
      if (candidates.length < 2) continue;
      const target = candidates[0];
      const fillers = shuffle(
        ALL_SOVEREIGN_COUNTRIES.filter((c) => !grp.includes(c.iso2))
      ).slice(0, Math.max(0, 4 - candidates.length));
      const opts = shuffle([...candidates, ...fillers]).slice(0, 4);
      if (!opts.some((o) => o.iso2 === target.iso2)) opts[0] = target;
      const finalOpts = shuffle(opts);
      questions.push({
        prompt: 'Bu o‘xshash bayroq qaysi davlatga tegishli?',
        options: finalOpts.map((o) => o.nameUz),
        correctIndex: finalOpts.findIndex((o) => o.iso2 === target.iso2),
        explanation: `Bu ${target.nameUz} (${target.capitalUz}) bayrog‘i. O‘xshash rang va chiziqlar tartibiga e’tibor bering.`,
        flagIso2: target.iso2,
        flagName: target.nameUz,
      });
    }
    return questions;
  }

  if (game.mechanic === 'flag-mcq' || game.mechanic === 'flag-elimination') {
    return pool.slice(0, count).map((target) => {
      const distractors = shuffle(
        pool.filter((c) => c.iso2 !== target.iso2)
      ).slice(0, 3);
      const opts = shuffle([target, ...distractors]);
      return {
        prompt: 'Ko‘rsatilgan bayroq qaysi davlatga tegishli?',
        options: opts.map((o) => o.nameUz),
        correctIndex: opts.findIndex((o) => o.iso2 === target.iso2),
        explanation: `To‘g‘ri javob: ${target.nameUz}. Poytaxti — ${target.capitalUz} (${target.continent}).`,
        flagIso2: target.iso2,
        flagName: target.nameUz,
      };
    });
  }

  if (game.mechanic === 'capital-mcq') {
    return pool.slice(0, count).map((target, idx) => {
      const distractors = shuffle(
        pool.filter((c) => c.iso2 !== target.iso2)
      ).slice(0, 3);
      const opts = shuffle([target, ...distractors]);
      const askCapital = game.id !== 'capital-missing' || idx % 2 === 0;
      return {
        prompt: askCapital
          ? `${target.nameUz} davlatining rasmiy poytaxti qaysi shahar?`
          : `${target.capitalUz} shahri qaysi davlatning poytaxti hisoblanadi?`,
        options: opts.map((o) => (askCapital ? o.capitalUz : o.nameUz)),
        correctIndex: opts.findIndex((o) => o.iso2 === target.iso2),
        explanation: `${target.nameUz}ning poytaxti — ${target.capitalUz}.`,
      };
    });
  }

  if (game.mechanic === 'puzzle-continent') {
    const continents = [
      'Osiyo',
      'Yevropa',
      'Afrika',
      'Shimoliy Amerika',
      'Janubiy Amerika',
      'Okeaniya',
    ];
    return pool.slice(0, count).map((target) => {
      const others = shuffle(continents.filter((c) => c !== target.continent)).slice(
        0,
        3
      );
      const opts = shuffle([target.continent, ...others]);
      return {
        prompt: `${target.nameUz} (${target.capitalUz}) xaritada qaysi qit’aga joylashadi?`,
        options: opts,
        correctIndex: opts.indexOf(target.continent),
        explanation: `${target.nameUz} geografik jihatdan ${target.continent} qit’asida joylashgan.`,
        flagIso2: target.iso2,
        flagName: target.nameUz,
      };
    });
  }

  if (game.topicFilter === 'island') {
    const islandStates = shuffle(
      ALL_SOVEREIGN_COUNTRIES.filter((c) => c.seaAccess === 'Orol davlati')
    );
    const islandRecs =
      GEOGRAPHY_RECORDS.find((r) => r.id === 'largest-islands')?.items ?? [];
    const qs: McqQuestion[] = islandRecs.map((item) => {
      const others = shuffle(
        islandRecs.filter((x) => x.titleUz !== item.titleUz)
      ).slice(0, 3);
      const opts = shuffle([item, ...others]);
      return {
        prompt: `"${item.noteUz}" — bu tavsif qaysi yirik orolga tegishli? (${item.locationUz})`,
        options: opts.map((o) => o.titleUz),
        correctIndex: opts.findIndex((o) => o.titleUz === item.titleUz),
        explanation: `${item.titleUz} — maydoni ${item.value}, ${item.locationUz}.`,
      };
    });
    for (const st of islandStates.slice(0, 4)) {
      const dist = shuffle(
        ALL_SOVEREIGN_COUNTRIES.filter((c) => c.iso2 !== st.iso2)
      ).slice(0, 3);
      const opts = shuffle([st, ...dist]);
      qs.push({
        prompt: `${st.continent}dagi ushbu orol davlatining poytaxti ${st.capitalUz} bo‘lib, eng baland nuqtasi ${st.highestPeak}. Bu qaysi davlat?`,
        options: opts.map((o) => o.nameUz),
        correctIndex: opts.findIndex((o) => o.iso2 === st.iso2),
        explanation: `${st.nameUz} — ${st.continent}dagi orol davlati.`,
        flagIso2: st.iso2,
        flagName: st.nameUz,
      });
    }
    return shuffle(qs).slice(0, 8);
  }

  if (game.topicFilter === 'mountain') {
    const mRecs =
      GEOGRAPHY_RECORDS.find((r) => r.id === 'highest-mountains')?.items ?? [];
    const fromRecords: McqQuestion[] = mRecs.map((m) => {
      const others = shuffle(mRecs.filter((x) => x.titleUz !== m.titleUz)).slice(0, 3);
      const opts = shuffle([m, ...others]);
      return {
        prompt: `${m.locationUz} hududida joylashgan va balandligi ${m.value} bo‘lgan mashhur cho‘qqi qaysi?`,
        options: opts.map((o) => o.titleUz),
        correctIndex: opts.findIndex((o) => o.titleUz === m.titleUz),
        explanation: `${m.titleUz} (${m.value}) — ${m.noteUz}`,
      };
    });
    const fromCountries: McqQuestion[] = pool.slice(0, 4).map((c) => {
      const others = shuffle(pool.filter((x) => x.iso2 !== c.iso2)).slice(0, 3);
      const opts = shuffle([c, ...others]);
      return {
        prompt: `${c.highestPeak} — bu qaysi davlatning eng baland cho‘qqisi?`,
        options: opts.map((o) => o.nameUz),
        correctIndex: opts.findIndex((o) => o.iso2 === c.iso2),
        explanation: `${c.highestPeak} ${c.nameUz} hududida joylashgan.`,
      };
    });
    return shuffle([...fromRecords, ...fromCountries]).slice(0, 8);
  }

  if (game.topicFilter === 'river') {
    const rRecs =
      GEOGRAPHY_RECORDS.find((r) => r.id === 'longest-rivers')?.items ?? [];
    const fromRecords: McqQuestion[] = rRecs.map((rv) => {
      const others = shuffle(rRecs.filter((x) => x.titleUz !== rv.titleUz)).slice(0, 3);
      const opts = shuffle([rv, ...others]);
      return {
        prompt: `${rv.locationUz} hududidan oqib o‘tuvchi, uzunligi ${rv.value} bo‘lgan buyuk daryo qaysi?`,
        options: opts.map((o) => o.titleUz),
        correctIndex: opts.findIndex((o) => o.titleUz === rv.titleUz),
        explanation: `${rv.titleUz}: ${rv.noteUz}`,
      };
    });
    const fromCountries: McqQuestion[] = pool
      .filter((c) => !c.longestRiver.toLowerCase().includes('yo‘q'))
      .slice(0, 4)
      .map((c) => {
        const others = shuffle(pool.filter((x) => x.iso2 !== c.iso2)).slice(0, 3);
        const opts = shuffle([c, ...others]);
        return {
          prompt: `${c.longestRiver} daryosi qaysi davlat geografiyasi bilan bog‘liq?`,
          options: opts.map((o) => o.nameUz),
          correctIndex: opts.findIndex((o) => o.iso2 === c.iso2),
          explanation: `${c.nameUz}ning asosiy daryosi — ${c.longestRiver}.`,
        };
      });
    return shuffle([...fromRecords, ...fromCountries]).slice(0, 8);
  }

  if (game.topicFilter === 'ocean') {
    const oceanQs: McqQuestion[] = [
      {
        prompt: 'Yer yuzasidagi eng katta va eng chuqur okean qaysi?',
        options: ['Atlantika okeani', 'Tinch okeani', 'Hind okeani', 'Shimoliy Muz okeani'],
        correctIndex: 1,
        explanation: 'Tinch okeani Yer suv yuzasining qariyb yarmini egallaydi (Mariana botig‘i 10 935 m).',
      },
      {
        prompt: 'Sargass dengizi — qirg‘og‘i bo‘lmagan yagona dengiz qaysi okeanda joylashgan?',
        options: ['Tinch okeani', 'Hind okeani', 'Atlantika okeani', 'Janubiy okean'],
        correctIndex: 2,
        explanation: 'Sargass dengizi Shimoliy Atlantika okean oqimlari orasida joylashgan.',
      },
      {
        prompt: 'Puerto-Riko chuqurligi (8 376 m) qaysi okeanning eng chuqur nuqtasi?',
        options: ['Hind okeani', 'Atlantika okeani', 'Shimoliy Muz okeani', 'Tinch okeani'],
        correctIndex: 1,
        explanation: 'Puerto-Riko botig‘i Atlantika okeanining eng chuqur qismidir.',
      },
      {
        prompt: 'Suvaysh kanali O‘rta yer dengizini Qizil dengiz va qaysi okean bilan bog‘laydi?',
        options: ['Hind okeani', 'Tinch okeani', 'Shimoliy Muz okeani', 'Janubiy okean'],
        correctIndex: 0,
        explanation: 'Qizil dengiz orqali kemalar Hind okeaniga chiqadi.',
      },
      {
        prompt: 'Dunyodagi eng katta marjon rifi — Buyuk To‘siq rifi qaysi okeanda joylashgan?',
        options: ['Atlantika okeani', 'Tinch okeani', 'Hind okeani', 'Shimoliy Muz okeani'],
        correctIndex: 1,
        explanation: 'Avstraliya shimoli-sharqidagi Marjon dengizi Tinch okeani havzasiga kiradi.',
      },
      {
        prompt: 'Okeanlar orasida maydoni eng kichik va eng sayoz okean qaysi?',
        options: ['Hind okeani', 'Janubiy okean', 'Shimoliy Muz okeani', 'Atlantika okeani'],
        correctIndex: 2,
        explanation: 'Shimoliy Muz okeani (~14.06 mln km²) eng kichik okean hisoblanadi.',
      },
      {
        prompt: 'Yava (Sunda) botig‘i (~7 725 m) qaysi okeanning eng chuqur qismi?',
        options: ['Hind okeani', 'Atlantika okeani', 'Tinch okeani', 'Janubiy okean'],
        correctIndex: 0,
        explanation: 'Indoneziya janubidagi Yava botig‘i Hind okeanidagi eng chuqur nuqtadir.',
      },
      {
        prompt: 'Antarktida qit’asini to‘liq o‘rab turgan okean qaysi?',
        options: ['Janubiy okean', 'Shimoliy Muz okeani', 'Hind okeani', 'Atlantika okeani'],
        correctIndex: 0,
        explanation: 'Janubiy okean Antarktida qirg‘oqlarini 60° janubiy kenglikkacha o‘rab turadi.',
      },
    ];
    return shuffle(oceanQs);
  }

  if (game.topicFilter === 'border') {
    return pool.slice(0, 8).map((c) => {
      const hasNeighbors =
        c.neighborsUz.length > 0 && !c.neighborsUz[0].startsWith('Dengiz chegarasi');
      if (hasNeighbors) {
        const realNeighbor = c.neighborsUz[0];
        const fakePool = shuffle(
          ALL_SOVEREIGN_COUNTRIES.filter(
            (x) =>
              x.iso2 !== c.iso2 &&
              !c.neighborsUz.some((n) =>
                n.toLowerCase().includes(x.nameUz.toLowerCase())
              )
          )
        )
          .slice(0, 3)
          .map((x) => x.nameUz);
        const opts = shuffle([realNeighbor, ...fakePool]);
        return {
          prompt: `Quyidagi davlatlardan qaysi biri ${c.nameUz} bilan quruqlikda qo‘shni (yoki bevosita chegaradosh)?`,
          options: opts,
          correctIndex: opts.indexOf(realNeighbor),
          explanation: `${c.nameUz}ning qo‘shnilari: ${c.neighborsUz.join(', ')}.`,
          flagIso2: c.iso2,
          flagName: c.nameUz,
        };
      }
      const seaTypes = [
        'Okeanga chiqadi',
        'Dengizga chiqadi',
        'Dengizga chiqmaydi',
        'Orol davlati',
      ];
      return {
        prompt: `${c.nameUz}ning suv chegaralari va dengizga chiqish maqomi qanday?`,
        options: seaTypes,
        correctIndex: Math.max(0, seaTypes.indexOf(c.seaAccess)),
        explanation: `${c.nameUz}: ${c.seaAccessDetail}`,
      };
    });
  }

  if (game.id === 'pro-championship' || game.id === 'pro-civilization') {
    const oly = shuffle(OLYMPIAD_EXAM_QUESTIONS).map((o) => ({
      prompt: `[${o.topic}] ${o.question}`,
      options: o.options,
      correctIndex: o.correctIndex,
      explanation: o.explanation,
    }));
    return oly.slice(0, 10);
  }

  // General Knowledge / Trivia / Survival / Continent Challenge
  const olyItems: McqQuestion[] = shuffle(OLYMPIAD_EXAM_QUESTIONS)
    .slice(0, 4)
    .map((o) => ({
      prompt: o.question,
      options: o.options,
      correctIndex: o.correctIndex,
      explanation: o.explanation,
    }));

  const countryItems: McqQuestion[] = pool.slice(0, count).map((c, idx) => {
    const dist = shuffle(pool.filter((x) => x.iso2 !== c.iso2)).slice(0, 3);
    const opts = shuffle([c, ...dist]);
    if (idx % 3 === 0) {
      return {
        prompt: `${c.currencyUz} pul birligi qaysi davlatda qo‘llaniladi?`,
        options: opts.map((o) => o.nameUz),
        correctIndex: opts.findIndex((o) => o.iso2 === c.iso2),
        explanation: `${c.nameUz} pul birligi — ${c.currencyUz}.`,
      };
    }
    if (idx % 3 === 1) {
      return {
        prompt: `"${c.landmarksUz[0] || c.capitalUz}" mashhur maskani qaysi davlatda joylashgan?`,
        options: opts.map((o) => o.nameUz),
        correctIndex: opts.findIndex((o) => o.iso2 === c.iso2),
        explanation: `${c.landmarksUz[0] || c.capitalUz} ${c.nameUz}da joylashgan.`,
      };
    }
    return {
      prompt: `${c.nameUz} qaysi qit’ada joylashgan va poytaxti qaysi?`,
      options: opts.map((o) => `${o.continent} · ${o.capitalUz}`),
      correctIndex: opts.findIndex((o) => o.iso2 === c.iso2),
      explanation: `${c.nameUz} — ${c.continent}, poytaxti ${c.capitalUz}.`,
    };
  });

  return shuffle([...olyItems, ...countryItems]).slice(0, count);
}

function buildTfStatements(difficulty: GameDifficulty): TfStatement[] {
  const pool = shuffle(pickPoolByDifficulty(difficulty)).slice(0, 10);
  return pool.map((c, idx) => {
    const makeTrue = idx % 2 === 0;
    if (makeTrue) {
      return {
        statement: `${c.nameUz} davlatining poytaxti ${c.capitalUz} shahri bo‘lib, u ${c.continent} qit’asida joylashgan.`,
        isTrue: true,
        explanation: `To‘g‘ri! ${c.nameUz} — ${c.continent}, poytaxti ${c.capitalUz}.`,
      };
    }
    const other =
      ALL_SOVEREIGN_COUNTRIES.find(
        (x) => x.iso2 !== c.iso2 && x.continent !== c.continent
      ) ?? ALL_SOVEREIGN_COUNTRIES[0];
    return {
      statement: `${c.nameUz} davlatining poytaxti ${other.capitalUz} shahridir.`,
      isTrue: false,
      explanation: `Noto‘g‘ri! ${other.capitalUz} — ${other.nameUz} poytaxti; ${c.nameUz}ning poytaxti esa ${c.capitalUz}.`,
    };
  });
}

function build5CluesItems(difficulty: GameDifficulty): CluesItem[] {
  const pool = shuffle(pickPoolByDifficulty(difficulty)).slice(0, 5);
  return pool.map((target) => {
    const dist = shuffle(pool.filter((x) => x.iso2 !== target.iso2)).slice(0, 3);
    const fill =
      dist.length < 3
        ? shuffle(
            ALL_SOVEREIGN_COUNTRIES.filter((x) => x.iso2 !== target.iso2)
          ).slice(0, 3)
        : dist;
    const options = shuffle([target, ...fill]);
    return {
      country: target,
      clues: [
        `1-ishora (Hudud): Bu davlat ${target.continent} qit’asida joylashgan va ${target.seaAccess.toLowerCase()} maqomiga ega.`,
        `2-ishora (Tabiat): Eng baland cho‘qqisi — ${target.highestPeak}; asosiy daryosi — ${target.longestRiver}.`,
        `3-ishora (Iqtisodiyot & Til): Davlat tili — ${target.languagesUz}; pul birligi — ${target.currencyUz}.`,
        `4-ishora (Mashhur joylar): Sayyohlar ${target.landmarksUz.slice(0, 2).join(' va ')} maskanlariga boradi.`,
        `5-ishora (Poytaxt): Ushbu mamlakatning poytaxti — ${target.capitalUz} shahri.`,
      ],
      options,
    };
  });
}

export function GamePlayEngine({
  game,
  isDark,
  onBack,
  onFinishGame,
}: GamePlayEngineProps) {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'results'>('intro');
  const [difficulty, setDifficulty] = useState<GameDifficulty>('O‘rta');
  const [timeLeft, setTimeLeft] = useState(game.timeLimitSec || 90);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [streak, setStreak] = useState(0);
  const [roundIdx, setRoundIdx] = useState(0);
  const [feedback, setFeedback] = useState<{
    correct: boolean;
    message: string;
  } | null>(null);

  // Pools generated once per game start
  const [mcqPool, setMcqPool] = useState<McqQuestion[]>([]);
  const [tfPool, setTfPool] = useState<TfStatement[]>([]);
  const [cluesPool, setCluesPool] = useState<CluesItem[]>([]);
  const [cluesRevealed, setCluesRevealed] = useState(1);

  // Map & 3D Globe
  const [mapTargets, setMapTargets] = useState<FullCountryLesson[]>([]);
  const [selectedAtlas, setSelectedAtlas] = useState<string | null>(null);
  const [globeTarget, setGlobeTarget] = useState<GeoCountry>(GEO_COUNTRIES[0]);
  const [globeSelected, setGlobeSelected] = useState<GeoCountry>(GEO_COUNTRIES[0]);

  // Memory cards (12 cards = 6 pairs)
  const [memoryCards, setMemoryCards] = useState<
    Array<{
      uid: string;
      pairId: string;
      kind: 'flag' | 'text';
      iso2?: string;
      label: string;
    }>
  >([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);

  // Two-column Match Board
  const [matchLeft, setMatchLeft] = useState<FullCountryLesson[]>([]);
  const [matchRight, setMatchRight] = useState<FullCountryLesson[]>([]);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);

  // Photo Guess state
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [photoLoading, setPhotoLoading] = useState(false);

  const submittedFinishRef = useRef(false);

  const diffMultiplier = difficulty === 'Qiyin' ? 1.5 : difficulty === 'O‘rta' ? 1.2 : 1;

  function startGame() {
    soundEngine.playClick();
    submittedFinishRef.current = false;
    setScore(0);
    setCorrectCount(0);
    setAnsweredCount(0);
    setHearts(3);
    setStreak(0);
    setRoundIdx(0);
    setFeedback(null);
    setSelectedAtlas(null);
    setCluesRevealed(1);
    setTimeLeft(game.timeLimitSec || 90);

    const pool = shuffle(pickPoolByDifficulty(difficulty));

    if (game.mechanic === 'map-click' || game.mechanic === 'map-timed') {
      const clickablePool = pool.filter(
        (c) =>
          ATLAS_FEATURE_MAP.has(c.atlasName.toLowerCase()) &&
          (difficulty === 'Qiyin' || c.areaKm2 >= 25000)
      );
      setMapTargets(
        (clickablePool.length >= 8 ? clickablePool : pool).slice(
          0,
          game.mechanic === 'map-timed' ? 30 : 8
        )
      );
    } else if (game.mechanic === 'globe-3d') {
      const gPool = shuffle(GEO_COUNTRIES).slice(0, 6);
      setMapTargets(
        gPool.map(
          (g) =>
            ALL_SOVEREIGN_COUNTRIES.find((c) => c.iso2 === g.code) ??
            ALL_SOVEREIGN_COUNTRIES[0]
        )
      );
      setGlobeTarget(gPool[0]);
      setGlobeSelected(GEO_COUNTRIES[0]);
    } else if (game.mechanic === 'flag-memory') {
      const picked = pool.slice(0, 6);
      const deck = shuffle([
        ...picked.map((c, i) => ({
          uid: `a-${i}`,
          pairId: c.iso2,
          kind: 'flag' as const,
          iso2: c.iso2,
          label: c.nameUz,
        })),
        ...picked.map((c, i) => ({
          uid: `b-${i}`,
          pairId: c.iso2,
          kind: 'flag' as const,
          iso2: c.iso2,
          label: c.nameUz,
        })),
      ]);
      setMemoryCards(deck);
      setFlippedIndices([]);
      setMatchedPairs([]);
    } else if (game.mechanic === 'capital-memory') {
      const picked = pool.slice(0, 6);
      const deck = shuffle([
        ...picked.map((c, i) => ({
          uid: `c-${i}`,
          pairId: c.iso2,
          kind: 'text' as const,
          iso2: c.iso2,
          label: c.nameUz,
        })),
        ...picked.map((c, i) => ({
          uid: `cap-${i}`,
          pairId: c.iso2,
          kind: 'text' as const,
          label: `Poytaxt: ${c.capitalUz}`,
        })),
      ]);
      setMemoryCards(deck);
      setFlippedIndices([]);
      setMatchedPairs([]);
    } else if (game.mechanic === 'capital-match') {
      const picked = pool.slice(0, 6);
      setMatchLeft(picked);
      setMatchRight(shuffle(picked));
      setSelectedLeft(null);
      setMatchedIds([]);
    } else if (game.mechanic === 'knowledge-tf') {
      setTfPool(buildTfStatements(difficulty));
    } else if (
      game.mechanic === 'knowledge-5clues' ||
      game.mechanic === 'knowledge-photo'
    ) {
      const base = build5CluesItems(difficulty);
      if (game.id === 'puzzle-country-shape') {
        const shapePool = shuffle(
          pool.filter(
            (c) =>
              ATLAS_FEATURE_MAP.has(c.atlasName.toLowerCase()) && c.areaKm2 >= 40000
          )
        ).slice(0, 5);
        if (shapePool.length === 5) {
          setCluesPool(
            shapePool.map((target) => {
              const dist = shuffle(
                ALL_SOVEREIGN_COUNTRIES.filter((x) => x.iso2 !== target.iso2)
              ).slice(0, 3);
              return {
                country: target,
                clues: [
                  `1-ishora: Ushbu hudud ${target.continent} qit’asida joylashgan.`,
                  `2-ishora: Maydoni ${target.areaKm2.toLocaleString('en-US')} km², ${target.seaAccess.toLowerCase()}.`,
                  `3-ishora: Eng baland nuqtasi — ${target.highestPeak}.`,
                  `4-ishora: Asosiy daryosi — ${target.longestRiver}.`,
                  `5-ishora: Poytaxti — ${target.capitalUz}.`,
                ],
                options: shuffle([target, ...dist]),
              };
            })
          );
        } else {
          setCluesPool(base);
        }
      } else {
        setCluesPool(base);
      }
    } else {
      setMcqPool(buildMcqQuestions(game, difficulty));
    }

    setPhase('playing');
  }

  // Countdown timer
  useEffect(() => {
    if (phase !== 'playing') return;
    if (timeLeft <= 0) {
      setPhase('results');
      return;
    }
    const id = window.setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase, timeLeft]);

  // Fetch Wikimedia real photos for knowledge-photo
  const currentClueItem = cluesPool[roundIdx];
  useEffect(() => {
    if (phase !== 'playing' || game.mechanic !== 'knowledge-photo' || !currentClueItem)
      return;
    let active = true;
    setPhotoLoading(true);
    setPhotoUrls([]);
    fetch(
      `/api/country-live/${encodeURIComponent(
        currentClueItem.country.iso2
      )}?wiki=${encodeURIComponent(currentClueItem.country.nameEn)}`
    )
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        const urls = Array.isArray(d.images)
          ? (d.images as Array<{ url: string }>).map((img) => img.url).slice(0, 3)
          : [];
        setPhotoUrls(urls);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setPhotoLoading(false);
      });
    return () => {
      active = false;
    };
  }, [phase, game.mechanic, currentClueItem]);

  // Trigger confetti & save results once when entering results phase
  useEffect(() => {
    if (phase !== 'results' || submittedFinishRef.current) return;
    submittedFinishRef.current = true;
    const won = score >= 150 || correctCount >= 3;
    if (won) {
      confetti({ particleCount: 75, spread: 65, origin: { y: 0.65 } });
      soundEngine.playSuccess();
    }
    const xpEarned = Math.max(
      15,
      Math.round((game.xpReward * Math.max(0.4, score / 450)) * diffMultiplier)
    );
    onFinishGame({
      gameId: game.id,
      titleUz: game.titleUz,
      score,
      xpEarned,
      won,
      difficulty,
    });
  }, [phase, score, correctCount, game.id, game.titleUz, game.xpReward, diffMultiplier, difficulty, onFinishGame]);

  const totalRounds = useMemo(() => {
    if (game.mechanic === 'knowledge-escape') return ESCAPE_STAGES.length;
    if (game.mechanic === 'knowledge-tf') return tfPool.length;
    if (
      game.mechanic === 'knowledge-5clues' ||
      game.mechanic === 'knowledge-photo'
    )
      return cluesPool.length;
    if (game.mechanic === 'map-click' || game.mechanic === 'map-timed')
      return mapTargets.length;
    if (game.mechanic === 'globe-3d') return mapTargets.length;
    return mcqPool.length || 6;
  }, [
    game.mechanic,
    tfPool.length,
    cluesPool.length,
    mapTargets.length,
    mcqPool.length,
  ]);

  function advanceOrFinish(nextScore?: number) {
    const nextIdx = roundIdx + 1;
    if (nextIdx >= totalRounds) {
      if (typeof nextScore === 'number') setScore(nextScore);
      setPhase('results');
    } else {
      setRoundIdx(nextIdx);
      setFeedback(null);
      setSelectedAtlas(null);
      setCluesRevealed(1);
      if (game.mechanic === 'globe-3d' && mapTargets[nextIdx]) {
        const g =
          GEO_COUNTRIES.find((c) => c.code === mapTargets[nextIdx].iso2) ??
          GEO_COUNTRIES[0];
        setGlobeTarget(g);
      }
    }
  }

  function handleMcqChoice(optIdx: number, correctIndex: number, explanation: string) {
    if (feedback) return;
    const isCorrect = optIdx === correctIndex;
    setAnsweredCount((c) => c + 1);

    if (isCorrect) {
      soundEngine.playSuccess();
      const gained = Math.round((100 + streak * 15) * diffMultiplier);
      setScore((s) => s + gained);
      setCorrectCount((c) => c + 1);
      setStreak((st) => st + 1);
      setFeedback({ correct: true, message: `To‘g‘ri! (+${gained} ball) ${explanation}` });
    } else {
      soundEngine.playError();
      setStreak(0);
      setFeedback({ correct: false, message: `Xato! ${explanation}` });
      if (
        game.mechanic === 'survival' ||
        game.mechanic === 'flag-elimination'
      ) {
        const remaining = hearts - 1;
        setHearts(remaining);
        if (remaining <= 0) {
          setTimeout(() => setPhase('results'), 950);
          return;
        }
      }
    }

    setTimeout(() => advanceOrFinish(), 950);
  }

  function handleMapClick(atlasName: string) {
    if (feedback) return;
    const target = mapTargets[roundIdx];
    if (!target) return;
    setSelectedAtlas(atlasName);
    setAnsweredCount((c) => c + 1);
    const isMatch =
      atlasName.toLowerCase() === target.atlasName.toLowerCase() ||
      atlasName.toLowerCase().includes(target.nameEn.toLowerCase());

    if (isMatch) {
      soundEngine.playSuccess();
      const gained = Math.round(120 * diffMultiplier);
      setScore((s) => s + gained);
      setCorrectCount((c) => c + 1);
      setFeedback({
        correct: true,
        message: `Barakalla! ${target.nameUz} (${target.capitalUz}) to‘g‘ri topildi (+${gained} ball).`,
      });
    } else {
      soundEngine.playError();
      setFeedback({
        correct: false,
        message: `Siz ${atlasName} hududini bosdingiz. To‘g‘ri javob: ${target.nameUz}.`,
      });
    }
    setTimeout(() => advanceOrFinish(), 1000);
  }

  function handleGlobePinClick(picked: GeoCountry) {
    setGlobeSelected(picked);
    if (feedback) return;
    setAnsweredCount((c) => c + 1);
    const isMatch = picked.id === globeTarget.id;
    if (isMatch) {
      soundEngine.playSuccess();
      const gained = Math.round(150 * diffMultiplier);
      setScore((s) => s + gained);
      setCorrectCount((c) => c + 1);
      setFeedback({
        correct: true,
        message: `Ajoyib! 3D globusdan ${globeTarget.name} aniq topildi (+${gained} ball).`,
      });
    } else {
      soundEngine.playError();
      setFeedback({
        correct: false,
        message: `Bu ${picked.name}. Biz ${globeTarget.name}ni qidiryapmiz!`,
      });
    }
    setTimeout(() => advanceOrFinish(), 1100);
  }

  function handleMemoryFlip(index: number) {
    const card = memoryCards[index];
    if (
      !card ||
      flippedIndices.includes(index) ||
      matchedPairs.includes(card.pairId) ||
      flippedIndices.length >= 2
    ) {
      return;
    }
    soundEngine.playClick();
    const nextFlipped = [...flippedIndices, index];
    setFlippedIndices(nextFlipped);

    if (nextFlipped.length === 2) {
      setAnsweredCount((c) => c + 1);
      const first = memoryCards[nextFlipped[0]];
      const second = memoryCards[nextFlipped[1]];
      if (first.pairId === second.pairId) {
        soundEngine.playSuccess();
        const gained = Math.round(110 * diffMultiplier);
        setScore((s) => s + gained);
        setCorrectCount((c) => c + 1);
        const nextMatched = [...matchedPairs, first.pairId];
        setMatchedPairs(nextMatched);
        setTimeout(() => {
          setFlippedIndices([]);
          if (nextMatched.length >= 6) {
            setPhase('results');
          }
        }, 450);
      } else {
        setTimeout(() => setFlippedIndices([]), 750);
      }
    }
  }

  function handleMatchPick(side: 'left' | 'right', iso2: string) {
    if (matchedIds.includes(iso2)) return;
    soundEngine.playClick();
    if (side === 'left') {
      setSelectedLeft(iso2);
      return;
    }
    if (!selectedLeft) return;
    setAnsweredCount((c) => c + 1);
    if (selectedLeft === iso2) {
      soundEngine.playSuccess();
      const gained = Math.round(100 * diffMultiplier);
      setScore((s) => s + gained);
      setCorrectCount((c) => c + 1);
      const nextMatched = [...matchedIds, iso2];
      setMatchedIds(nextMatched);
      setSelectedLeft(null);
      if (nextMatched.length >= matchLeft.length) {
        setTimeout(() => setPhase('results'), 500);
      }
    } else {
      soundEngine.playError();
      setSelectedLeft(null);
    }
  }

  // ================= INTRO SCREEN =================
  if (phase === 'intro') {
    return (
      <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-sky-600"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>O‘yin markaziga qaytish</span>
        </button>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
              {game.category}
            </span>
            {game.isPro && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-xs font-bold">
                <Crown className="w-3 h-3" />
                PRO
              </span>
            )}
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            {game.titleUz}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {game.descriptionUz}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1.5">
          <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-sky-600" />
            <span>O‘yin qoidasi va yo‘riqnoma:</span>
          </p>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {game.instructionsUz}
          </p>
        </div>

        <div>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
            Qiyinlik darajasini tanlang:
          </p>
          <div className="grid grid-cols-3 gap-2.5">
            {(['Oson', 'O‘rta', 'Qiyin'] as GameDifficulty[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setDifficulty(d);
                }}
                className={`py-2.5 rounded-xl border text-xs sm:text-sm font-bold transition-colors ${
                  difficulty === d
                    ? 'border-sky-600 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
            Vaqt: {game.timeLimitSec} soniya · Mukofot: +{game.xpReward} XP gacha
          </div>
          <button
            type="button"
            onClick={startGame}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-sm font-bold shadow-xs"
          >
            <Play className="w-4 h-4" />
            <span>O‘yinni boshlash</span>
          </button>
        </div>
      </div>
    );
  }

  // ================= RESULTS SCREEN =================
  if (phase === 'results') {
    const accuracy =
      answeredCount > 0
        ? Math.min(100, Math.round((correctCount / answeredCount) * 100))
        : 0;
    const xpEarned = Math.max(
      15,
      Math.round((game.xpReward * Math.max(0.4, score / 450)) * diffMultiplier)
    );

    return (
      <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-7 sm:p-9 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 mx-auto flex items-center justify-center">
          <Trophy className="w-9 h-9" />
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
            O‘yin yakunlandi
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
            {game.titleUz}
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70">
            <p className="text-xs text-slate-500">Natija</p>
            <p className="font-mono text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
              {score}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70">
            <p className="text-xs text-slate-500">Aniqlik</p>
            <p className="font-mono text-2xl font-bold text-sky-600 tabular-nums">
              {accuracy}%
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70">
            <p className="text-xs text-slate-500">XP</p>
            <p className="font-mono text-2xl font-bold text-emerald-600 tabular-nums">
              +{xpEarned}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={startGame}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Qayta o‘ynash</span>
          </button>
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            O‘yin markaziga qaytish
          </button>
        </div>
      </div>
    );
  }

  // ================= ACTIVE GAMEPLAY =================
  const currentMcq = mcqPool[roundIdx];
  const currentTf = tfPool[roundIdx];
  const currentMapTarget = mapTargets[roundIdx];
  const currentEscape = ESCAPE_STAGES[roundIdx];

  return (
    <div className="space-y-5">
      {/* Top HUD */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Chiqish"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {game.titleUz}
            </h2>
            <p className="text-xs text-slate-500">Daraja: {difficulty}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 font-mono text-xs sm:text-sm font-bold tabular-nums">
          {(game.mechanic === 'survival' || game.mechanic === 'flag-elimination') && (
            <div className="flex items-center gap-1 text-rose-500">
              {Array.from({ length: 3 }).map((_, i) => (
                <Heart
                  key={i}
                  className={`w-4 h-4 ${i < hearts ? 'fill-rose-500' : 'opacity-25'}`}
                />
              ))}
            </div>
          )}

          <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
            <Sparkles className="w-4 h-4" />
            <span>{score} ball</span>
          </span>

          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${
              timeLeft <= 12
                ? 'bg-rose-100 dark:bg-rose-950 text-rose-600'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{timeLeft}s</span>
          </span>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs sm:text-sm font-semibold flex items-center gap-2 ${
            feedback.correct
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-800 dark:text-rose-200'
          }`}
        >
          {feedback.correct ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* 1. MAP CLICK & MAP TIMED */}
      {(game.mechanic === 'map-click' || game.mechanic === 'map-timed') &&
        currentMapTarget && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs text-slate-500 font-mono">
                  Vazifa {roundIdx + 1} / {totalRounds}
                </p>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  {game.id === 'map-find-capital'
                    ? `Poytaxti "${currentMapTarget.capitalUz}" bo‘lgan davlatni xaritada bosing`
                    : `Xaritadan toping: ${currentMapTarget.nameUz}`}
                </h3>
              </div>
              <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">
                Qit’a: {currentMapTarget.continent}
              </span>
            </div>

            <CountryLocatorMap
              mode="challenge"
              targetAtlasName={feedback ? currentMapTarget.atlasName : undefined}
              selectedAtlasName={selectedAtlas}
              onSelectCountry={handleMapClick}
              heightClass="h-80 sm:h-[420px]"
            />
          </div>
        )}

      {/* 2. 3D GLOBE MISSION */}
      {game.mechanic === 'globe-3d' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-mono text-amber-600 dark:text-amber-400">
                3D Missiya {roundIdx + 1} / {totalRounds}
              </p>
              <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                3D Globusni aylantiring va{' '}
                <span className="text-sky-600 dark:text-sky-400">
                  {globeTarget.name}
                </span>{' '}
                nuqtasini bosing!
              </h3>
            </div>
            <span className="text-xs text-slate-500">
              Poytaxti: {globeTarget.capital}
            </span>
          </div>
          <EarthGlobe3D
            countries={GEO_COUNTRIES}
            selectedCountry={globeSelected}
            onSelectCountry={handleGlobePinClick}
            isDark={isDark}
          />
        </div>
      )}

      {/* 3. MEMORY BOARDS (FLAG MEMORY & CAPITAL MEMORY) */}
      {(game.mechanic === 'flag-memory' || game.mechanic === 'capital-memory') && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Topilgan juftliklar: {matchedPairs.length} / 6</span>
            <span>Urinishlar: {answeredCount}</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {memoryCards.map((card, idx) => {
              const revealed =
                flippedIndices.includes(idx) || matchedPairs.includes(card.pairId);
              return (
                <button
                  key={card.uid}
                  type="button"
                  onClick={() => handleMemoryFlip(idx)}
                  className={`h-24 sm:h-28 rounded-xl border p-2 flex flex-col items-center justify-center text-center transition-all ${
                    matchedPairs.includes(card.pairId)
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500'
                      : revealed
                      ? 'bg-white dark:bg-slate-800 border-sky-500'
                      : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-sky-400'
                  }`}
                >
                  {revealed ? (
                    card.kind === 'flag' && card.iso2 ? (
                      <div className="flex flex-col items-center gap-1.5">
                        <CountryFlag
                          code={card.iso2}
                          name={card.label}
                          className="w-14 h-9"
                        />
                        <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100 line-clamp-1">
                          {card.label}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        {card.label}
                      </span>
                    )
                  ) : (
                    <span className="font-mono text-lg font-bold text-slate-400">
                      ?
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. TWO-COLUMN MATCHING BOARD (CAPITALS OR FLAGS) */}
      {game.mechanic === 'capital-match' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Moslangan juftliklar: {matchedIds.length} / {matchLeft.length}</span>
            <span>Avval chapdan, so‘ngra o‘ngdan tanlang</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2.5">
              {matchLeft.map((c) => {
                const done = matchedIds.includes(c.iso2);
                const active = selectedLeft === c.iso2;
                return (
                  <button
                    key={c.iso2}
                    type="button"
                    disabled={done}
                    onClick={() => handleMatchPick('left', c.iso2)}
                    className={`w-full p-3 rounded-xl border flex items-center gap-3 text-left text-xs sm:text-sm font-bold transition-colors ${
                      done
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 opacity-70'
                        : active
                        ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-600'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <CountryFlag code={c.iso2} name={c.nameUz} className="w-9 h-6" />
                    {game.id !== 'flag-match' && <span>{c.nameUz}</span>}
                    {game.id === 'flag-match' && (
                      <span className="text-slate-500 text-xs">Bayroq</span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="space-y-2.5">
              {matchRight.map((c) => {
                const done = matchedIds.includes(c.iso2);
                return (
                  <button
                    key={c.iso2}
                    type="button"
                    disabled={done}
                    onClick={() => handleMatchPick('right', c.iso2)}
                    className={`w-full p-3.5 rounded-xl border text-left text-xs sm:text-sm font-bold transition-colors ${
                      done
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 opacity-70'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-sky-500'
                    }`}
                  >
                    {game.id === 'flag-match' ? c.nameUz : c.capitalUz}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 5. TRUE / FALSE */}
      {game.mechanic === 'knowledge-tf' && currentTf && (
        <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 text-center">
          <p className="text-xs font-mono text-slate-500">
            Fakt {roundIdx + 1} / {totalRounds}
          </p>
          <h3 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug">
            {currentTf.statement}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              disabled={Boolean(feedback)}
              onClick={() =>
                handleMcqChoice(0, currentTf.isTrue ? 0 : 1, currentTf.explanation)
              }
              className="py-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 font-bold text-base hover:bg-emerald-100"
            >
              To‘g‘ri
            </button>
            <button
              type="button"
              disabled={Boolean(feedback)}
              onClick={() =>
                handleMcqChoice(1, currentTf.isTrue ? 0 : 1, currentTf.explanation)
              }
              className="py-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300 font-bold text-base hover:bg-rose-100"
            >
              Noto‘g‘ri
            </button>
          </div>
        </div>
      )}

      {/* 6. 5 CLUES & PHOTO GUESS */}
      {(game.mechanic === 'knowledge-5clues' || game.mechanic === 'knowledge-photo') &&
        currentClueItem && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-mono text-slate-500">
                Raund {roundIdx + 1} / {totalRounds}
              </span>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                Maksimal mukofot: {Math.max(20, 120 - cluesRevealed * 20)} ball
              </span>
            </div>

            {game.id === 'puzzle-country-shape' && (() => {
              const shapePath = getCountryShapeSvgPath(currentClueItem.country.atlasName);
              return shapePath ? (
                <div className="p-4 rounded-xl bg-sky-50/70 dark:bg-slate-950 border border-sky-200 dark:border-slate-800 flex flex-col items-center gap-2">
                  <p className="text-xs font-bold text-sky-700 dark:text-sky-300">
                    Davlat konturi (shakli) bo‘yicha toping:
                  </p>
                  <svg
                    viewBox="0 0 280 170"
                    className="w-64 h-40"
                    role="img"
                    aria-label="Davlat geografik shakli"
                  >
                    <path
                      d={shapePath}
                      className="fill-emerald-500/85 dark:fill-emerald-500 stroke-emerald-900 dark:stroke-emerald-200"
                      strokeWidth={1.5}
                    />
                  </svg>
                </div>
              ) : null;
            })()}

            {game.mechanic === 'knowledge-photo' && (
              <div className="space-y-3">
                {photoLoading ? (
                  <div className="h-44 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse flex items-center justify-center text-xs text-slate-500">
                    Manzara suratlari yuklanmoqda...
                  </div>
                ) : photoUrls.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {photoUrls.map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        alt="Geografik manzara"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                        className="w-full h-40 object-cover rounded-xl border border-slate-200 dark:border-slate-700"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-5 rounded-xl bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-sky-950/60 dark:to-indigo-950/60 border border-sky-200 dark:border-sky-800 space-y-1">
                    <p className="text-xs font-bold text-sky-700 dark:text-sky-300">
                      Mashhur maskanlar tasviri va tavsifi:
                    </p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {currentClueItem.country.landmarksUz.join(' · ')}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Iqlimi: {currentClueItem.country.climateUz}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              {currentClueItem.clues.slice(0, cluesRevealed).map((clue, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-100"
                >
                  {clue}
                </div>
              ))}
              {cluesRevealed < 5 && !feedback && (
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setCluesRevealed((r) => Math.min(5, r + 1));
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:underline"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Keyingi ishorani ochish (-20 ball)</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentClueItem.options.map((opt) => (
                <button
                  key={opt.iso2}
                  type="button"
                  disabled={Boolean(feedback)}
                  onClick={() => {
                    const isCorrect = opt.iso2 === currentClueItem.country.iso2;
                    setAnsweredCount((c) => c + 1);
                    if (isCorrect) {
                      soundEngine.playSuccess();
                      const gained = Math.round(
                        Math.max(20, 120 - cluesRevealed * 20) * diffMultiplier
                      );
                      setScore((s) => s + gained);
                      setCorrectCount((c) => c + 1);
                      setFeedback({
                        correct: true,
                        message: `Topdingiz! Bu ${currentClueItem.country.nameUz} (${currentClueItem.country.capitalUz}) (+${gained} ball).`,
                      });
                    } else {
                      soundEngine.playError();
                      setFeedback({
                        correct: false,
                        message: `Xato! To‘g‘ri javob: ${currentClueItem.country.nameUz}.`,
                      });
                    }
                    setTimeout(() => advanceOrFinish(), 1100);
                  }}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-sky-500 text-left text-sm font-bold text-slate-900 dark:text-white"
                >
                  {opt.nameUz}
                </button>
              ))}
            </div>
          </div>
        )}

      {/* 7. GEOGRAPHY ESCAPE ROOM */}
      {game.mechanic === 'knowledge-escape' && currentEscape && (
        <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
              {feedback?.correct ? (
                <Unlock className="w-4 h-4 text-emerald-500" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              <span>{currentEscape.titleUz}</span>
            </span>
            <span className="font-mono text-xs text-slate-500">
              Qulf {roundIdx + 1} / {ESCAPE_STAGES.length}
            </span>
          </div>

          <p className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white leading-relaxed">
            {currentEscape.riddleUz}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentEscape.options.map((opt, idx) => (
              <button
                key={opt}
                type="button"
                disabled={Boolean(feedback)}
                onClick={() =>
                  handleMcqChoice(
                    idx,
                    currentEscape.correctIndex,
                    currentEscape.unlockNoteUz
                  )
                }
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-amber-500 text-left text-sm font-bold flex items-center gap-2"
              >
                <KeyRound className="w-4 h-4 text-amber-500 shrink-0" />
                <span>{opt}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 8. STANDARD MCQ / FLAGS / CAPITALS / PUZZLES / SURVIVAL */}
      {![
        'map-click',
        'map-timed',
        'globe-3d',
        'flag-memory',
        'capital-memory',
        'capital-match',
        'knowledge-tf',
        'knowledge-5clues',
        'knowledge-photo',
        'knowledge-escape',
      ].includes(game.mechanic) &&
        currentMcq && (
          <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between text-xs font-mono text-slate-500">
              <span>
                Savol {roundIdx + 1} / {totalRounds}
              </span>
              {streak > 1 && (
                <span className="text-amber-600 font-bold">Seriya: {streak}x</span>
              )}
            </div>

            {currentMcq.flagIso2 && (
              <div className="flex justify-center py-2">
                <CountryFlag
                  code={currentMcq.flagIso2}
                  name={currentMcq.flagName || currentMcq.flagIso2}
                  className="w-44 h-28 shadow-md rounded-xl"
                />
              </div>
            )}

            <h3 className="font-display text-lg sm:text-xl font-bold text-slate-900 dark:text-white text-center">
              {currentMcq.prompt}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentMcq.options.map((opt, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={Boolean(feedback)}
                  onClick={() =>
                    handleMcqChoice(
                      idx,
                      currentMcq.correctIndex,
                      currentMcq.explanation
                    )
                  }
                  className={`p-3.5 rounded-xl border text-left text-sm font-semibold transition-colors ${
                    feedback
                      ? idx === currentMcq.correctIndex
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-200'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-60'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-sky-500 text-slate-900 dark:text-white'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}
    </div>
  );
}
