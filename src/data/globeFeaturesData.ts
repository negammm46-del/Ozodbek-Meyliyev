import {
  ALL_SOVEREIGN_COUNTRIES,
  type FullCountryLesson,
} from './sovereignStatesCatalog';

export type GlobeFeatureCategory =
  | 'landmark'
  | 'mountain'
  | 'river'
  | 'island'
  | 'ocean';

export interface GlobeGeoFeature {
  id: string;
  category: GlobeFeatureCategory;
  nameUz: string;
  nameEn: string;
  countryUz: string;
  countryIso2?: string;
  continentUz: string;
  lat: number;
  lng: number;
  metricLabel: string;
  metricValue: string;
  descriptionUz: string;
  isPro?: boolean;
  /** Optional river course polyline as [lng, lat][] */
  riverPath?: Array<[number, number]>;
}

export interface GlobeMission {
  id: string;
  titleUz: string;
  descriptionUz: string;
  hintUz: string;
  type: 'continent-count' | 'find-country' | 'find-feature' | 'category-count' | 'multi-country';
  targetContinent?: string;
  targetCountryIso2s?: string[];
  targetFeatureId?: string;
  targetCategory?: GlobeFeatureCategory;
  requiredCount: number;
  xpReward: number;
  badgeTitleUz: string;
  isPro?: boolean;
  focusLat: number;
  focusLng: number;
}

export const GLOBE_LANDMARKS: GlobeGeoFeature[] = [
  {
    id: 'lm-registon',
    category: 'landmark',
    nameUz: 'Registon maydoni',
    nameEn: 'Registan Square',
    countryUz: 'O‘zbekiston (Samarqand)',
    countryIso2: 'UZ',
    continentUz: 'Osiyo',
    lat: 39.6548,
    lng: 66.9757,
    metricLabel: 'YUNESKO merosi',
    metricValue: 'XV–XVII asr',
    descriptionUz:
      'Samarqand markazidagi uch buyuk madrasa — Ulug‘bek, Sherdor va Tillakori majmuasi Buyuk Ipak yo‘lining durdonasidir.',
  },
  {
    id: 'lm-ichan-qala',
    category: 'landmark',
    nameUz: 'Ichan Qal’a',
    nameEn: 'Itchan Kala',
    countryUz: 'O‘zbekiston (Xiva)',
    countryIso2: 'UZ',
    continentUz: 'Osiyo',
    lat: 41.3783,
    lng: 60.3596,
    metricLabel: 'Maqomi',
    metricValue: 'Ochiq osmon muzeyi',
    descriptionUz:
      'Markaziy Osiyodagi birinchi Butunjahon merosi obyekti bo‘lib, qadimiy Xorazm me’morchiligini to‘liq saqlab qolgan.',
  },
  {
    id: 'lm-eiffel',
    category: 'landmark',
    nameUz: 'Eyfel minorasi',
    nameEn: 'Eiffel Tower',
    countryUz: 'Fransiya (Parij)',
    countryIso2: 'FR',
    continentUz: 'Yevropa',
    lat: 48.8584,
    lng: 2.2945,
    metricLabel: 'Balandligi',
    metricValue: '330 m',
    descriptionUz:
      '1889-yilda Gyustav Eyfel tomonidan barpo etilgan temir panjarali minora — Parij va Fransiyaning bosh ramzi.',
  },
  {
    id: 'lm-taj-mahal',
    category: 'landmark',
    nameUz: 'Toj Mahal',
    nameEn: 'Taj Mahal',
    countryUz: 'Hindiston (Agra)',
    countryIso2: 'IN',
    continentUz: 'Osiyo',
    lat: 27.1751,
    lng: 78.0421,
    metricLabel: 'Qurilgan davri',
    metricValue: '1632–1653',
    descriptionUz:
      'Yamuna daryosi bo‘yida oq marmardan qurilgan Boburiylar davri me’morchiligi mo‘jizasi.',
  },
  {
    id: 'lm-giza',
    category: 'landmark',
    nameUz: 'Giza ehromlari',
    nameEn: 'Pyramids of Giza',
    countryUz: 'Misr (Qohira yaqinida)',
    countryIso2: 'EG',
    continentUz: 'Afrika',
    lat: 29.9792,
    lng: 31.1342,
    metricLabel: 'Yoshi',
    metricValue: '~4 500 yil',
    descriptionUz:
      'Qadimgi dunyoning yetti mo‘jizasidan bugungi kungacha saqlanib qolgan yagona obida.',
  },
  {
    id: 'lm-machu-picchu',
    category: 'landmark',
    nameUz: 'Machu-Pikchu',
    nameEn: 'Machu Picchu',
    countryUz: 'Peru (And tog‘lari)',
    countryIso2: 'PE',
    continentUz: 'Janubiy Amerika',
    lat: -13.1631,
    lng: -72.545,
    metricLabel: 'Balandligi',
    metricValue: '2 430 m',
    descriptionUz:
      'XV asrda Inklar imperiyasi tomonidan And tog‘lari tizmasida bunyod etilgan sirli tosh shahar.',
  },
  {
    id: 'lm-colosseum',
    category: 'landmark',
    nameUz: 'Kolizey',
    nameEn: 'Colosseum',
    countryUz: 'Italiya (Rim)',
    countryIso2: 'IT',
    continentUz: 'Yevropa',
    lat: 41.8902,
    lng: 12.4922,
    metricLabel: 'Sig‘imi',
    metricValue: '50 000+ tomoshabin',
    descriptionUz:
      'Milodiy 80-yilda ochilgan dunyodagi eng katta qadimiy Rim amfiteatri.',
  },
  {
    id: 'lm-great-wall',
    category: 'landmark',
    nameUz: 'Buyuk Xitoy devori',
    nameEn: 'Great Wall of China',
    countryUz: 'Xitoy',
    countryIso2: 'CN',
    continentUz: 'Osiyo',
    lat: 40.4319,
    lng: 116.5704,
    metricLabel: 'Umumiy uzunligi',
    metricValue: '21 196 km',
    descriptionUz:
      'Shimoliy Xitoy tog‘ tizmalari bo‘ylab cho‘zilgan insoniyat tarixidagi eng uzun mudofaa inshooti.',
  },
  {
    id: 'lm-statue-liberty',
    category: 'landmark',
    nameUz: 'Ozodlik haykali',
    nameEn: 'Statue of Liberty',
    countryUz: 'AQSH (Nyu-York)',
    countryIso2: 'US',
    continentUz: 'Shimoliy Amerika',
    lat: 40.6892,
    lng: -74.0445,
    metricLabel: 'Balandligi',
    metricValue: '93 m',
    descriptionUz:
      '1886-yilda Fransiya tomonidan sovg‘a qilingan mis haykal Nyu-York ko‘rfazida qad rostlagan.',
  },
  {
    id: 'lm-burj-khalifa',
    category: 'landmark',
    nameUz: 'Burj Xalifa',
    nameEn: 'Burj Khalifa',
    countryUz: 'BAA (Dubay)',
    countryIso2: 'AE',
    continentUz: 'Osiyo',
    lat: 25.1972,
    lng: 55.2744,
    metricLabel: 'Balandligi',
    metricValue: '828 m',
    descriptionUz:
      '163 qavatdan iborat dunyodagi eng baland bino va zamonaviy muhandislik cho‘qqisi.',
  },
  {
    id: 'lm-petra',
    category: 'landmark',
    nameUz: 'Petra tosh shahri',
    nameEn: 'Petra',
    countryUz: 'Iordaniya',
    countryIso2: 'JO',
    continentUz: 'Osiyo',
    lat: 30.3285,
    lng: 35.4444,
    metricLabel: 'Usuli',
    metricValue: 'Qizil qoya o‘ymakorligi',
    descriptionUz:
      'Nabatiylar tomonidan pushti qumtosh qoyalar ichiga o‘yib solingan qadimiy savdo markazi.',
  },
  {
    id: 'lm-sydney-opera',
    category: 'landmark',
    nameUz: 'Sidney opera teatri',
    nameEn: 'Sydney Opera House',
    countryUz: 'Avstraliya (Sidney)',
    countryIso2: 'AU',
    continentUz: 'Okeaniya',
    lat: -33.8568,
    lng: 151.2153,
    metricLabel: 'Ochilishi',
    metricValue: '1973-yil',
    descriptionUz:
      'Yelkan shaklidagi oq gumbazlari bilan Sidney ko‘rfazini bezab turgan zamonaviy san’at markazi.',
  },
  {
    id: 'lm-christ-rio',
    category: 'landmark',
    nameUz: 'Iso Masih haykali',
    nameEn: 'Christ the Redeemer',
    countryUz: 'Braziliya (Rio-de-Janeyro)',
    countryIso2: 'BR',
    continentUz: 'Janubiy Amerika',
    lat: -22.9519,
    lng: -43.2105,
    metricLabel: 'Joylashuvi',
    metricValue: 'Korkovadu tog‘i (710 m)',
    descriptionUz:
      'Rio-de-Janeyro uzra Tijuka milliy bog‘i cho‘qqisidan shaharga qarab turgan mashhur monument.',
  },
  {
    id: 'lm-angkor',
    category: 'landmark',
    nameUz: 'Angkor-Vat majmuasi',
    nameEn: 'Angkor Wat',
    countryUz: 'Kambodja',
    countryIso2: 'KH',
    continentUz: 'Osiyo',
    lat: 13.4125,
    lng: 103.867,
    metricLabel: 'Maydoni',
    metricValue: '162.6 gektar',
    descriptionUz:
      'Dunyodagi eng yirik diniy-me’moriy majmua bo‘lib, Kambodja bayrog‘ida ham tasvirlangan.',
  },
  {
    id: 'lm-acropolis',
    category: 'landmark',
    nameUz: 'Afina Akropoli',
    nameEn: 'Acropolis of Athens',
    countryUz: 'Gretsiya (Afina)',
    countryIso2: 'GR',
    continentUz: 'Yevropa',
    lat: 37.9715,
    lng: 23.7257,
    metricLabel: 'Asosiy inshoot',
    metricValue: 'Parfenon (mil. avv. V asr)',
    descriptionUz:
      'Qadimgi Yunoniston sivilizatsiyasi va demokratiya beshigining eng yuksak me’moriy yodgorligi.',
  },
  {
    id: 'lm-victoria-falls',
    category: 'landmark',
    nameUz: 'Viktoriya sharsharasi',
    nameEn: 'Victoria Falls',
    countryUz: 'Zambiya / Zimbabve',
    countryIso2: 'ZM',
    continentUz: 'Afrika',
    lat: -17.9243,
    lng: 25.8572,
    metricLabel: 'Kengligi',
    metricValue: '1 708 m',
    descriptionUz:
      'Zambezi daryosida joylashgan, mahalliy tilda "Gumburlovchi tutun" (Mosi-oa-Tunya) deb ataluvchi ulkan sharshara.',
  },
];

export const GLOBE_MOUNTAINS: GlobeGeoFeature[] = [
  {
    id: 'mt-everest',
    category: 'mountain',
    nameUz: 'Everest (Jomolungma)',
    nameEn: 'Mount Everest',
    countryUz: 'Nepal / Xitoy (Himolay)',
    countryIso2: 'NP',
    continentUz: 'Osiyo',
    lat: 27.9881,
    lng: 86.925,
    metricLabel: 'Balandligi',
    metricValue: '8 848.86 m',
    descriptionUz:
      'Dengiz sathidan Yer sayyorasining eng baland cho‘qqisi. Himolay tog‘ tizmasining Mahalangur bo‘limida joylashgan.',
  },
  {
    id: 'mt-k2',
    category: 'mountain',
    nameUz: 'K2 (Chogori)',
    nameEn: 'K2',
    countryUz: 'Pokiston / Xitoy (Qoraqurum)',
    countryIso2: 'PK',
    continentUz: 'Osiyo',
    lat: 35.8808,
    lng: 76.5155,
    metricLabel: 'Balandligi',
    metricValue: '8 611 m',
    descriptionUz:
      'Dunyodagi ikkinchi eng baland cho‘qqi bo‘lib, murakkab relyefi sabab "Yovvoyi tog‘" nomini olgan.',
  },
  {
    id: 'mt-aconcagua',
    category: 'mountain',
    nameUz: 'Akonkagua',
    nameEn: 'Aconcagua',
    countryUz: 'Argentina (And tog‘lari)',
    countryIso2: 'AR',
    continentUz: 'Janubiy Amerika',
    lat: -32.6532,
    lng: -70.0109,
    metricLabel: 'Balandligi',
    metricValue: '6 961 m',
    descriptionUz:
      'G‘arbiy va Janubiy yarimsharlarning, shuningdek Osiyodan tashqaridagi barcha qit’alarning eng baland cho‘qqisi.',
  },
  {
    id: 'mt-denali',
    category: 'mountain',
    nameUz: 'Denali (Mak-Kinli)',
    nameEn: 'Denali',
    countryUz: 'AQSH (Alyaska)',
    countryIso2: 'US',
    continentUz: 'Shimoliy Amerika',
    lat: 63.0692,
    lng: -151.007,
    metricLabel: 'Balandligi',
    metricValue: '6 190 m',
    descriptionUz:
      'Shimoliy Amerikaning eng baland tog‘ cho‘qqisi, asosidan uchigacha vertikal ko‘tarilishi bo‘yicha rekordchilardan.',
  },
  {
    id: 'mt-kilimanjaro',
    category: 'mountain',
    nameUz: 'Kilimanjaro',
    nameEn: 'Mount Kilimanjaro',
    countryUz: 'Tanzaniya',
    countryIso2: 'TZ',
    continentUz: 'Afrika',
    lat: -3.0674,
    lng: 37.3556,
    metricLabel: 'Balandligi',
    metricValue: '5 895 m',
    descriptionUz:
      'Afrikaning eng baland cho‘qqisi va dunyodagi eng baland alohida turgan (tizmaga kirmagan) stratovulqon.',
  },
  {
    id: 'mt-elbrus',
    category: 'mountain',
    nameUz: 'Elbrus',
    nameEn: 'Mount Elbrus',
    countryUz: 'Rossiya (Kavkaz)',
    countryIso2: 'RU',
    continentUz: 'Yevropa',
    lat: 43.3499,
    lng: 42.4453,
    metricLabel: 'Balandligi',
    metricValue: '5 642 m',
    descriptionUz:
      'Yevropaning eng baland cho‘qqisi — ikki boshli qadimiy so‘ngan vulqon.',
  },
  {
    id: 'mt-mont-blanc',
    category: 'mountain',
    nameUz: 'Monblan',
    nameEn: 'Mont Blanc',
    countryUz: 'Fransiya / Italiya (Alp)',
    countryIso2: 'FR',
    continentUz: 'Yevropa',
    lat: 45.8326,
    lng: 6.8652,
    metricLabel: 'Balandligi',
    metricValue: '4 808 m',
    descriptionUz:
      'G‘arbiy Yevropa va Alp tog‘larining eng baland muzlikli cho‘qqisi ("Oq tog‘").',
  },
  {
    id: 'mt-hazrati-sulton',
    category: 'mountain',
    nameUz: 'Hazrati Sulton',
    nameEn: 'Khazret Sultan',
    countryUz: 'O‘zbekiston (Hisor tizmasi)',
    countryIso2: 'UZ',
    continentUz: 'Osiyo',
    lat: 38.948,
    lng: 68.172,
    metricLabel: 'Balandligi',
    metricValue: '4 643 m',
    descriptionUz:
      'O‘zbekistonning eng baland cho‘qqisi, Surxondaryo viloyati va Tojikiston chegarasidagi Hisor tizmasida joylashgan.',
  },
  {
    id: 'mt-fuji',
    category: 'mountain',
    nameUz: 'Fudziyama',
    nameEn: 'Mount Fuji',
    countryUz: 'Yaponiya (Xonsyu oroli)',
    countryIso2: 'JP',
    continentUz: 'Osiyo',
    lat: 35.3606,
    lng: 138.7274,
    metricLabel: 'Balandligi',
    metricValue: '3 776 m',
    descriptionUz:
      'Simmetrik konus shakliga ega Yaponiyaning muqaddas vulqoni va eng baland nuqtasi.',
  },
  {
    id: 'mt-puncak-jaya',
    category: 'mountain',
    nameUz: 'Puncak Jaya (Karstens)',
    nameEn: 'Puncak Jaya',
    countryUz: 'Indoneziya (Yangi Gvineya)',
    countryIso2: 'ID',
    continentUz: 'Okeaniya',
    lat: -4.0833,
    lng: 137.1833,
    metricLabel: 'Balandligi',
    metricValue: '4 884 m',
    descriptionUz:
      'Dunyodagi har qanday orolda joylashgan eng baland cho‘qqi va Okeaniya-Avstraliya mintaqasi rekordchisi.',
  },
];

export const GLOBE_RIVERS: GlobeGeoFeature[] = [
  {
    id: 'rv-nile',
    category: 'river',
    nameUz: 'Nil daryosi',
    nameEn: 'Nile River',
    countryUz: 'Misr, Sudan, Uganda va b.',
    countryIso2: 'EG',
    continentUz: 'Afrika',
    lat: 21.5,
    lng: 31.3,
    metricLabel: 'Uzunligi',
    metricValue: '6 650 km',
    descriptionUz:
      'Afrikaning eng uzun daryosi — Viktoriya ko‘lidan boshlanib, O‘rta yer dengiziga ulkan delta hosil qilib quyiladi.',
    riverPath: [
      [32.5, 0.4],
      [31.6, 4.8],
      [32.5, 15.6],
      [33.9, 17.7],
      [31.8, 19.6],
      [32.9, 24.1],
      [31.2, 30.0],
      [31.0, 31.5],
    ],
  },
  {
    id: 'rv-amazon',
    category: 'river',
    nameUz: 'Amazonka daryosi',
    nameEn: 'Amazon River',
    countryUz: 'Braziliya, Peru, Kolumbiya',
    countryIso2: 'BR',
    continentUz: 'Janubiy Amerika',
    lat: -3.1,
    lng: -60.0,
    metricLabel: 'Uzunligi / Oqimi',
    metricValue: '6 400 km (eng sersuv)',
    descriptionUz:
      'Dunyodagi eng sersuv va eng katta havzali daryo; Atlantika okeaniga quyiladigan chuchuk suvning 20 foizini beradi.',
    riverPath: [
      [-76.2, -9.5],
      [-73.2, -3.7],
      [-67.5, -2.8],
      [-60.0, -3.1],
      [-55.0, -2.4],
      [-50.0, -0.5],
    ],
  },
  {
    id: 'rv-yangtze',
    category: 'river',
    nameUz: 'Yanszi daryosi',
    nameEn: 'Yangtze River',
    countryUz: 'Xitoy',
    countryIso2: 'CN',
    continentUz: 'Osiyo',
    lat: 30.6,
    lng: 114.3,
    metricLabel: 'Uzunligi',
    metricValue: '6 300 km',
    descriptionUz:
      'Osiyoning eng uzun va bir mamlakat ichidan to‘liq oqib o‘tadigan dunyodagi eng uzun daryo.',
    riverPath: [
      [94.0, 33.5],
      [102.0, 27.5],
      [106.5, 29.6],
      [111.3, 30.7],
      [114.3, 30.6],
      [118.8, 32.1],
      [121.8, 31.4],
    ],
  },
  {
    id: 'rv-mississippi',
    category: 'river',
    nameUz: 'Missisipi–Missuri',
    nameEn: 'Mississippi River',
    countryUz: 'AQSH',
    countryIso2: 'US',
    continentUz: 'Shimoliy Amerika',
    lat: 35.1,
    lng: -90.1,
    metricLabel: 'Uzunligi',
    metricValue: '6 275 km',
    descriptionUz:
      'Shimoliy Amerikaning bosh suv arteriyasi bo‘lib, Meksika qo‘ltig‘iga quyiladi.',
    riverPath: [
      [-95.2, 47.2],
      [-93.2, 44.9],
      [-90.2, 38.6],
      [-90.0, 35.1],
      [-91.2, 30.4],
      [-89.2, 29.1],
    ],
  },
  {
    id: 'rv-amudarya',
    category: 'river',
    nameUz: 'Amudaryo',
    nameEn: 'Amu Darya',
    countryUz: 'O‘zbekiston, Tojikiston, Turkmaniston',
    countryIso2: 'UZ',
    continentUz: 'Osiyo',
    lat: 39.1,
    lng: 63.6,
    metricLabel: 'Uzunligi',
    metricValue: '2 540 km',
    descriptionUz:
      'Markaziy Osiyoning eng sersuv daryosi. Pomir va Hindukush muzliklaridan boshlanib Orol havzasigacha oqadi.',
    riverPath: [
      [72.6, 37.0],
      [68.0, 37.2],
      [65.2, 37.9],
      [63.5, 39.1],
      [61.2, 41.0],
      [59.6, 42.5],
    ],
  },
  {
    id: 'rv-danube',
    category: 'river',
    nameUz: 'Dunay daryosi',
    nameEn: 'Danube River',
    countryUz: '10 ta Yevropa davlati',
    countryIso2: 'DE',
    continentUz: 'Yevropa',
    lat: 47.5,
    lng: 19.0,
    metricLabel: 'Uzunligi',
    metricValue: '2 850 km (10 davlat)',
    descriptionUz:
      'Dunyodagi eng ko‘p davlat hududidan (10 ta mamlakat va 4 ta poytaxt) oqib o‘tadigan xalqaro daryo.',
    riverPath: [
      [8.5, 48.0],
      [13.4, 48.6],
      [16.4, 48.2],
      [19.0, 47.5],
      [20.4, 44.8],
      [24.5, 43.7],
      [29.6, 45.2],
    ],
  },
  {
    id: 'rv-congo',
    category: 'river',
    nameUz: 'Kongo daryosi',
    nameEn: 'Congo River',
    countryUz: 'Kongo DR, Kongo',
    countryIso2: 'CD',
    continentUz: 'Afrika',
    lat: -1.8,
    lng: 16.5,
    metricLabel: 'Chuqurligi',
    metricValue: '220 m+ (eng chuqur)',
    descriptionUz:
      'Dunyodagi eng chuqur daryo va ekvator chizig‘ini ikki marta kesib o‘tadigan yagona yirik daryodir.',
    riverPath: [
      [25.2, 0.5],
      [22.5, 2.1],
      [18.2, 0.0],
      [15.3, -4.3],
      [12.4, -6.0],
    ],
  },
];

export const GLOBE_ISLANDS: GlobeGeoFeature[] = [
  {
    id: 'isl-greenland',
    category: 'island',
    nameUz: 'Grenlandiya oroli',
    nameEn: 'Greenland',
    countryUz: 'Daniya Qirolligi (Avtonomiya)',
    countryIso2: 'GL',
    continentUz: 'Shimoliy Amerika',
    lat: 71.7,
    lng: -42.6,
    metricLabel: 'Maydoni',
    metricValue: '2 166 086 km² (#1)',
    descriptionUz:
      'Dunyodagi eng katta orol. Hududining 80% qismi qalin Arktika muz qalqoni bilan qoplangan.',
  },
  {
    id: 'isl-new-guinea',
    category: 'island',
    nameUz: 'Yangi Gvineya',
    nameEn: 'New Guinea',
    countryUz: 'Indoneziya / Papua — Yangi Gvineya',
    countryIso2: 'PG',
    continentUz: 'Okeaniya',
    lat: -5.5,
    lng: 141.0,
    metricLabel: 'Maydoni',
    metricValue: '785 753 km² (#2)',
    descriptionUz:
      'Dunyodagi ikkinchi eng katta orol bo‘lib, 800 dan ortiq til va noyob tropik ekotizimlarga ega.',
  },
  {
    id: 'isl-borneo',
    category: 'island',
    nameUz: 'Borneo (Kalimantan)',
    nameEn: 'Borneo',
    countryUz: 'Indoneziya, Malayziya, Bruney',
    countryIso2: 'ID',
    continentUz: 'Osiyo',
    lat: 0.9,
    lng: 114.5,
    metricLabel: 'Xususiyati',
    metricValue: '3 davlat bo‘lishgan yagona orol',
    descriptionUz:
      'Jahondagi uchinchi eng katta orol; uch mustaqil davlat o‘rtasida bo‘lingan yagona yirik oroldir.',
  },
  {
    id: 'isl-madagascar',
    category: 'island',
    nameUz: 'Madagaskar oroli',
    nameEn: 'Madagascar',
    countryUz: 'Madagaskar',
    countryIso2: 'MG',
    continentUz: 'Afrika',
    lat: -18.8,
    lng: 46.8,
    metricLabel: 'Maydoni',
    metricValue: '587 041 km² (#4)',
    descriptionUz:
      'Endemik lemurlar, baobab xiyobonlari va boshqa hech qayerda uchramaydigan noyob flora-faunasi bilan mashhur.',
  },
  {
    id: 'isl-iceland',
    category: 'island',
    nameUz: 'Islandiya',
    nameEn: 'Iceland',
    countryUz: 'Islandiya',
    countryIso2: 'IS',
    continentUz: 'Yevropa',
    lat: 64.9,
    lng: -19.0,
    metricLabel: 'Maqomi',
    metricValue: 'Olov va muz oroli',
    descriptionUz:
      'O‘rta Atlantika tizmasi ustida joylashgan geyzerlar, faol vulqonlar va ulkan muzliklar diyori.',
  },
  {
    id: 'isl-cuba',
    category: 'island',
    nameUz: 'Kuba oroli',
    nameEn: 'Cuba',
    countryUz: 'Kuba',
    countryIso2: 'CU',
    continentUz: 'Shimoliy Amerika',
    lat: 21.5,
    lng: -78.5,
    metricLabel: 'Maydoni',
    metricValue: '109 884 km²',
    descriptionUz:
      'Karib dengizidagi eng katta orol — marjon riflari va tropik vodiylari bilan mashhur.',
  },
  {
    id: 'isl-sri-lanka',
    category: 'island',
    nameUz: 'Shri-Lanka (Seylon)',
    nameEn: 'Sri Lanka',
    countryUz: 'Shri-Lanka',
    countryIso2: 'LK',
    continentUz: 'Osiyo',
    lat: 7.9,
    lng: 80.7,
    metricLabel: 'Mashhurligi',
    metricValue: 'Hind okeani marvaridi',
    descriptionUz:
      'Hindiston yarimoroli janubida joylashgan choy plantatsiyalari, qadimiy qal’alar va fillar oroli.',
  },
  {
    id: 'isl-hawaii',
    category: 'island',
    nameUz: 'Gavayi orollari',
    nameEn: 'Hawaii',
    countryUz: 'AQSH (Tinch okeani)',
    countryIso2: 'US',
    continentUz: 'Okeaniya',
    lat: 19.6,
    lng: -155.5,
    metricLabel: 'Mauna-Kea',
    metricValue: '10 210 m (tubidan)',
    descriptionUz:
      'Tinch okeani markazidagi vulqon arxipelagi. Mauna-Kea okean tubidan hisoblaganda Everestdan balandroq.',
  },
];

export const GLOBE_OCEANS: GlobeGeoFeature[] = [
  {
    id: 'oc-pacific',
    category: 'ocean',
    nameUz: 'Tinch okeani',
    nameEn: 'Pacific Ocean',
    countryUz: 'Eng katta va eng chuqur okean',
    continentUz: 'Global',
    lat: 8.0,
    lng: -155.0,
    metricLabel: 'Mariana botig‘i',
    metricValue: '10 984 m · 165.2 mln km²',
    descriptionUz:
      'Yer yuzasining qariyb uchdan bir qismini egallaydi; barcha quruqliklar yig‘indisidan ham katta va "Olovli halqa" vulqonlari bilan o‘ralgan.',
  },
  {
    id: 'oc-atlantic',
    category: 'ocean',
    nameUz: 'Atlantika okeani',
    nameEn: 'Atlantic Ocean',
    countryUz: 'Ikkinchi eng katta okean',
    continentUz: 'Global',
    lat: 20.0,
    lng: -40.0,
    metricLabel: 'Puerto-Riko botig‘i',
    metricValue: '8 376 m · 106.5 mln km²',
    descriptionUz:
      'Amerika hamda Yevropa-Afrika qit’alarini ajratib turadi; iliq Golfstrim oqimi Yevropa iqlimini yumshatadi.',
  },
  {
    id: 'oc-indian',
    category: 'ocean',
    nameUz: 'Hind okeani',
    nameEn: 'Indian Ocean',
    countryUz: 'Eng iliq okean',
    continentUz: 'Global',
    lat: -15.0,
    lng: 76.0,
    metricLabel: 'Yava botig‘i',
    metricValue: '7 290 m · 70.6 mln km²',
    descriptionUz:
      'Shimolda Osiyo bilan chegaralangan, kuchli musson shamollari va qadimgi dengiz savdo yo‘llari bilan mashhur.',
  },
  {
    id: 'oc-arctic',
    category: 'ocean',
    nameUz: 'Shimoliy Muz okeani',
    nameEn: 'Arctic Ocean',
    countryUz: 'Eng kichik va eng sayoz okean',
    continentUz: 'Arktika',
    lat: 84.0,
    lng: 15.0,
    metricLabel: 'Molloy botig‘i',
    metricValue: '5 550 m · 14.1 mln km²',
    descriptionUz:
      'Shimoliy qutb atrofida joylashgan, yilning katta qismida suzuvchi muz qatlamlari bilan qoplanadi.',
  },
  {
    id: 'oc-southern',
    category: 'ocean',
    nameUz: 'Janubiy okean',
    nameEn: 'Southern Ocean',
    countryUz: 'Antarktida atrofidagi okean',
    continentUz: 'Antarktika',
    lat: -62.0,
    lng: 40.0,
    metricLabel: 'Janubiy Sandvich botig‘i',
    metricValue: '7 236 m · 20.3 mln km²',
    descriptionUz:
      'Antarktidani to‘liq o‘rab olgan va sayyoradagi eng kuchli sovuq sirkumpolyar oqim harakatlanadigan okean.',
  },
];

export const ALL_GLOBE_FEATURES: GlobeGeoFeature[] = [
  ...GLOBE_LANDMARKS,
  ...GLOBE_MOUNTAINS,
  ...GLOBE_RIVERS,
  ...GLOBE_ISLANDS,
  ...GLOBE_OCEANS,
];

export const GLOBE_MISSIONS: GlobeMission[] = [
  {
    id: 'asia-5',
    titleUz: 'Osiyoda 5 ta davlatni toping',
    descriptionUz:
      '3D globusni Osiyo qit’asiga buring va Osiyoga tegishli istalgan 5 ta davlat hududini bosing.',
    hintUz: 'Sharqiy yarimsharda joylashgan O‘zbekiston, Yaponiya, Hindiston, Xitoy yoki Turkiyadan boshlang.',
    type: 'continent-count',
    targetContinent: 'Osiyo',
    requiredCount: 5,
    xpReward: 120,
    badgeTitleUz: 'Osiyo Tadqiqotchisi',
    focusLat: 36,
    focusLng: 88,
  },
  {
    id: 'brazil-capital',
    titleUz: 'Braziliya poytaxti joylashuvini toping',
    descriptionUz:
      'Janubiy Amerikadagi eng yirik davlat — Braziliya hududini va uning poytaxti joylashuvini 3D globusda toping.',
    hintUz: 'Janubiy Amerikaning sharqiy qismiga, Amazonka havzasi atrofiga aylantiring.',
    type: 'find-country',
    targetCountryIso2s: ['BR'],
    requiredCount: 1,
    xpReward: 75,
    badgeTitleUz: 'Braziliya Sayyohi',
    focusLat: -14.2,
    focusLng: -51.9,
  },
  {
    id: 'everest-peak',
    titleUz: 'Dunyodagi eng baland tog‘ni toping',
    descriptionUz:
      'Tog‘lar qatlamini yoqing va Himolaydagi Everest cho‘qqisi (8 849 m) pinini 3D globusda bosing.',
    hintUz: 'Nepal va Xitoy chegarasidagi Himolay tog‘ tizmasiga qarang.',
    type: 'find-feature',
    targetFeatureId: 'mt-everest',
    requiredCount: 1,
    xpReward: 85,
    badgeTitleUz: 'Everest Alpinisti',
    focusLat: 28.0,
    focusLng: 86.9,
  },
  {
    id: 'islands-3',
    titleUz: '3 ta orolni kashf qiling',
    descriptionUz:
      'Orollar qatlamini yoqing va Grenlandiya, Madagaskar, Islandiya yoki Kuba kabi 3 ta orol markerini bosing.',
    hintUz: 'Orollar qatlami yoniq bo‘lganda zumrad rangli halqalar paydo bo‘ladi.',
    type: 'category-count',
    targetCategory: 'island',
    requiredCount: 3,
    xpReward: 95,
    badgeTitleUz: 'Orollar Kapitani',
    focusLat: 20,
    focusLng: -30,
  },
  {
    id: 'uzb-neighbors',
    titleUz: 'O‘zbekiston bilan chegaradosh davlatlarni toping',
    descriptionUz:
      'Markaziy Osiyoga yaqinlashtiring va O‘zbekistonga qo‘shni 5 davlatni (Qozog‘iston, Qirg‘iziston, Tojikiston, Afg‘oniston, Turkmaniston) toping.',
    hintUz: 'O‘zbekiston atrofidagi barcha 5 qo‘shni davlat hududini navbat bilan bosing.',
    type: 'multi-country',
    targetCountryIso2s: ['KZ', 'KG', 'TJ', 'AF', 'TM'],
    requiredCount: 5,
    xpReward: 140,
    badgeTitleUz: 'Markaziy Osiyo Bilimdoni',
    focusLat: 41.3,
    focusLng: 64.6,
  },
  {
    id: 'landmarks-5',
    titleUz: 'Dunyo mo‘jizalaridan 5 tasini toping',
    descriptionUz:
      'Mashhur joylar qatlamida Registon, Eyfel minorasi, Toj Mahal, Machu-Pikchu kabi 5 ta maskanni oching.',
    hintUz: 'Oltin yulduzli mashhur maskan markerlarini bosing.',
    type: 'category-count',
    targetCategory: 'landmark',
    requiredCount: 5,
    xpReward: 115,
    badgeTitleUz: 'Dunyo Sayyohi',
    focusLat: 30,
    focusLng: 45,
  },
  {
    id: 'oceans-all',
    titleUz: '5 ta dunyo okeanini kashf eting (PRO)',
    descriptionUz:
      'Tinch, Atlantika, Hind, Shimoliy Muz va Janubiy okeanlarni 3D globusda birma-bir o‘rganing.',
    hintUz: 'Okeanlar qatlamini faollashtirib ko‘k to‘lqinli okean markerlarini bosing.',
    type: 'category-count',
    targetCategory: 'ocean',
    requiredCount: 5,
    xpReward: 160,
    badgeTitleUz: 'Okean Tadqiqotchisi PRO',
    isPro: true,
    focusLat: 0,
    focusLng: 0,
  },
  {
    id: 'europe-5',
    titleUz: 'Yevropaning 5 ta yetakchi davlatini toping (PRO)',
    descriptionUz:
      'Fransiya, Germaniya, Italiya, Buyuk Britaniya va Ispaniyani 3D globusda aniq toping.',
    hintUz: 'G‘arbiy Yevropaga kattalashtirib davlatlar chegarasini bosing.',
    type: 'multi-country',
    targetCountryIso2s: ['FR', 'DE', 'IT', 'GB', 'ES'],
    requiredCount: 5,
    xpReward: 160,
    badgeTitleUz: 'Yevropa Strategi PRO',
    isPro: true,
    focusLat: 47,
    focusLng: 6,
  },
];

// Normalized atlas name aliases -> ISO2
const ATLAS_ALIASES_TO_ISO2: Record<string, string> = {
  'united states of america': 'US',
  'united states': 'US',
  'dem. rep. congo': 'CD',
  'democratic republic of the congo': 'CD',
  'congo': 'CG',
  'republic of the congo': 'CG',
  'central african rep.': 'CF',
  's. sudan': 'SS',
  'south sudan': 'SS',
  'eq. guinea': 'GQ',
  'ivory coast': 'CI',
  "côte d'ivoire": 'CI',
  'eswatini': 'SZ',
  'swaziland': 'SZ',
  'bosnia and herz.': 'BA',
  'macedonia': 'MK',
  'north macedonia': 'MK',
  'czechia': 'CZ',
  'czech republic': 'CZ',
  'dominican rep.': 'DO',
  'solomon is.': 'SB',
  'falkland is.': 'FK',
  'timor-leste': 'TL',
  'east timor': 'TL',
  'myanmar': 'MM',
  'lao pdr': 'LA',
  'laos': 'LA',
  'south korea': 'KR',
  'north korea': 'KP',
  'korea': 'KR',
  'russia': 'RU',
  'russian federation': 'RU',
  'vietnam': 'VN',
  'viet nam': 'VN',
  'iran': 'IR',
  'syria': 'SY',
  'venezuela': 'VE',
  'bolivia': 'BO',
  'tanzania': 'TZ',
  'moldova': 'MD',
  'brunei': 'BN',
  'the bahamas': 'BS',
  'bahamas': 'BS',
  'gambia': 'GM',
  'the gambia': 'GM',
  'n. cyprus': 'CY',
  'cyprus': 'CY',
  'palestine': 'PS',
  'kosovo': 'RS',
  'somaliland': 'SO',
  'w. sahara': 'MA',
  'greenland': 'DK',
  'taiwan': 'TW',
  'antarctica': '',
};

const COUNTRY_BY_ATLAS_LOWER = new Map<string, FullCountryLesson>();
const COUNTRY_BY_NAME_EN_LOWER = new Map<string, FullCountryLesson>();
const COUNTRY_BY_ISO2 = new Map<string, FullCountryLesson>();

for (const country of ALL_SOVEREIGN_COUNTRIES) {
  COUNTRY_BY_ATLAS_LOWER.set(country.atlasName.toLowerCase(), country);
  COUNTRY_BY_NAME_EN_LOWER.set(country.nameEn.toLowerCase(), country);
  COUNTRY_BY_ISO2.set(country.iso2.toUpperCase(), country);
}

export function resolveCountryFromAtlasName(
  atlasName: string | null | undefined
): FullCountryLesson | null {
  if (!atlasName) return null;
  const key = atlasName.trim().toLowerCase();
  if (!key) return null;

  const direct =
    COUNTRY_BY_ATLAS_LOWER.get(key) || COUNTRY_BY_NAME_EN_LOWER.get(key);
  if (direct) return direct;

  const aliasIso2 = ATLAS_ALIASES_TO_ISO2[key];
  if (aliasIso2) {
    return COUNTRY_BY_ISO2.get(aliasIso2) || null;
  }

  for (const country of ALL_SOVEREIGN_COUNTRIES) {
    if (
      country.atlasName.toLowerCase().includes(key) ||
      key.includes(country.atlasName.toLowerCase()) ||
      country.nameEn.toLowerCase().includes(key)
    ) {
      return country;
    }
  }
  return null;
}

export function findCountryByIso2(iso2: string): FullCountryLesson | null {
  return COUNTRY_BY_ISO2.get(iso2.toUpperCase()) || null;
}

export function findNearestCountryByLatLng(
  lat: number,
  lng: number,
  maxDegDist = 14
): FullCountryLesson | null {
  let best: FullCountryLesson | null = null;
  let bestScore = Infinity;

  for (const country of ALL_SOVEREIGN_COUNTRIES) {
    const dLat = country.lat - lat;
    let dLng = Math.abs(country.lng - lng);
    if (dLng > 180) dLng = 360 - dLng;
    const dist = Math.hypot(dLat, dLng);
    if (dist < bestScore && dist <= maxDegDist) {
      bestScore = dist;
      best = country;
    }
  }
  return best;
}

export function computeGreatCircleDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}
