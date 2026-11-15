import type { MapContinentId } from './worldMapData';

export interface GeoCountry {
  id: string;
  code: string;
  atlasName: string;
  name: string;
  capital: string;
  continent: MapContinentId;
  areaKm2: string;
  population: string;
  languages: string;
  currency: string;
  lat: number;
  lng: number;
  coordinates: string;
  shortNote: string;
  funFact: string;
  landmarks: { name: string; description: string }[];
  featured?: boolean;
}

export interface GeoFlashcard {
  id: string;
  category: 'Davlatlar va poytaxtlar' | 'Qit’alar va okeanlar' | 'Tog‘lar, daryolar va cho‘llar';
  front: string;
  hint: string;
  back: string;
  detail: string;
}

export interface GeoQuizItem {
  id: string;
  category: 'Davlatlar' | 'Poytaxtlar' | 'Bayroqlar' | 'Tog‘lar' | 'Okeanlar';
  difficulty: 'Oson' | 'O‘rta' | 'Qiyin';
  question: string;
  flagCode?: string;
  flagName?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface RiverDesertItem {
  id: string;
  type: 'Daryo' | 'Cho‘l';
  name: string;
  region: string;
  metricLabel: string;
  metricValue: string;
  summary: string;
  funFact: string;
}

export interface BadgeDef {
  id: string;
  title: string;
  description: string;
  requirementLabel: string;
}

export const GEO_COUNTRIES: GeoCountry[] = [
  {
    id: 'uzbekistan',
    code: 'UZ',
    atlasName: 'Uzbekistan',
    name: 'O‘zbekiston',
    capital: 'Toshkent',
    continent: 'Osiyo',
    areaKm2: '448 978 km²',
    population: '37.5 mln',
    languages: 'O‘zbek tili',
    currency: 'O‘zbekiston so‘mi (UZS)',
    lat: 41.3,
    lng: 64.6,
    coordinates: '41.3° N, 69.2° E',
    shortNote:
      'Markaziy Osiyoning markazida, Amudaryo va Sirdaryo oralig‘ida joylashgan qadimiy Buyuk Ipak yo‘li yurti.',
    funFact:
      'O‘zbekiston dunyoda okeanga chiqish uchun kamida ikki davlat chegarasidan o‘tish kerak bo‘lgan atigi ikkita davlatdan biridir.',
    landmarks: [
      { name: 'Registon maydoni', description: 'Samarqanddagi XV–XVII asr me’moriy ansambli' },
      { name: 'Ichan Qal’a', description: 'Xivadagi UNESCO himoyasidagi qadimiy shahar-muzey' },
    ],
    featured: true,
  },
  {
    id: 'japan',
    code: 'JP',
    atlasName: 'Japan',
    name: 'Yaponiya',
    capital: 'Tokio',
    continent: 'Osiyo',
    areaKm2: '377 975 km²',
    population: '124.5 mln',
    languages: 'Yapon tili',
    currency: 'Yapon iyenasi (JPY)',
    lat: 36.2,
    lng: 138.2,
    coordinates: '35.7° N, 139.7° E',
    shortNote:
      'Tinch okeanining g‘arbiy qismida 14 mingdan ortiq oroldan tashkil topgan "Kunchiqar mamlakat".',
    funFact:
      'Tokio aglomeratsiyasi 37 milliondan ortiq aholisi bilan sayyoramizdagi eng yirik shahar hududi hisoblanadi.',
    landmarks: [
      { name: 'Fudziyama tog‘i', description: '3 776 m balandlikdagi muqaddas so‘ngan vulqon' },
      { name: 'Kiyoto ibodatxonalari', description: 'Yaponiyaning qadimiy madaniy poytaxti yodgorliklari' },
    ],
    featured: true,
  },
  {
    id: 'brazil',
    code: 'BR',
    atlasName: 'Brazil',
    name: 'Braziliya',
    capital: 'Braziliya',
    continent: 'Janubiy Amerika',
    areaKm2: '8 515 767 km²',
    population: '212.6 mln',
    languages: 'Portugal tili',
    currency: 'Braziliya reali (BRL)',
    lat: -14.2,
    lng: -51.9,
    coordinates: '15.8° S, 47.9° W',
    shortNote:
      'Janubiy Amerikaning qariyb yarmini egallagan, Amazonka o‘rmonlari va daryosi bilan mashhur eng yirik davlat.',
    funFact:
      'Poytaxt Braziliya shahri atigi 41 oy ichida noldan qurilgan va yuqoridan qaraganda samolyot shakliga o‘xshaydi.',
    landmarks: [
      { name: 'Iso Masih haykali', description: 'Rio-de-Janeyro uzra qad rostlagan dunyo mo‘jizasi' },
      { name: 'Iguasu sharsharalari', description: '275 ta sharsharadan iborat ulkan tabiiy majmua' },
    ],
    featured: true,
  },
  {
    id: 'egypt',
    code: 'EG',
    atlasName: 'Egypt',
    name: 'Misr',
    capital: 'Qohira',
    continent: 'Afrika',
    areaKm2: '1 002 450 km²',
    population: '114.5 mln',
    languages: 'Arab tili',
    currency: 'Misr funti (EGP)',
    lat: 26.8,
    lng: 30.8,
    coordinates: '30.0° N, 31.2° E',
    shortNote:
      'Afrika va Osiyo tutashgan hududda, dunyodagi eng uzun Nil daryosi bo‘yida joylashgan qadimiy tamaddun o‘chog‘i.',
    funFact:
      'Misr aholisining 95 foizdan ortig‘i mamlakat maydonining atigi 5 foizini tashkil etuvchi Nil vodiysida yashaydi.',
    landmarks: [
      { name: 'Giza ehromlari', description: 'Qadimgi dunyoning saqlanib qolgan yagona mo‘jizasi' },
      { name: 'Luksordagi Karnak', description: 'Fir’avnlar davriga oid ulkan ibodatxonalar majmuasi' },
    ],
    featured: true,
  },
  {
    id: 'norway',
    code: 'NO',
    atlasName: 'Norway',
    name: 'Norvegiya',
    capital: 'Oslo',
    continent: 'Yevropa',
    areaKm2: '385 207 km²',
    population: '5.5 mln',
    languages: 'Norveg tili',
    currency: 'Norvegiya kronasi (NOK)',
    lat: 60.5,
    lng: 8.5,
    coordinates: '59.9° N, 10.7° E',
    shortNote:
      'Skandinaviya yarimorolining g‘arbida, muzliklar o‘yib hosil qilgan chuqur dengiz qo‘ltiqlari — fyordlar mamlakati.',
    funFact:
      'Yoz oylarida Norvegiya shimolida quyosh bir necha hafta davomida umuman botmaydi ("oq tunlar").',
    landmarks: [
      { name: 'Geyranger-fyord', description: 'Tik qoyalar va sharsharalar bilan o‘ralgan dengiz qo‘ltig‘i' },
      { name: 'Trolltunga qoyasi', description: 'Ko‘l uzra 700 metr balandlikda osilib turgan tosh til' },
    ],
    featured: true,
  },
  {
    id: 'australia',
    code: 'AU',
    atlasName: 'Australia',
    name: 'Avstraliya',
    capital: 'Kanberra',
    continent: 'Okeaniya',
    areaKm2: '7 692 024 km²',
    population: '27.1 mln',
    languages: 'Ingliz tili',
    currency: 'Avstraliya dollari (AUD)',
    lat: -25.3,
    lng: 133.8,
    coordinates: '35.3° S, 149.1° E',
    shortNote:
      'Butun bir materikni egallagan yagona davlat. Katta qismi cho‘l va yarimcho‘llardan, sohillari esa yirik shaharlardan iborat.',
    funFact:
      'Sidney va Melburn o‘rtasidagi raqobatni hal qilish uchun ikki shahar oralig‘idagi Kanberra poytaxt etib tanlangan.',
    landmarks: [
      { name: 'Sidney opera teatri', description: 'Yelkan shaklidagi zamonaviy me’morchilik ramzi' },
      { name: 'Uluru qoyasi', description: 'Markaziy cho‘ldagi ulkan qizil qumtosh monoliti' },
    ],
    featured: true,
  },
  {
    id: 'switzerland',
    code: 'CH',
    atlasName: 'Switzerland',
    name: 'Shveysariya',
    capital: 'Bern',
    continent: 'Yevropa',
    areaKm2: '41 285 km²',
    population: '8.9 mln',
    languages: 'Nemis, fransuz, italyan',
    currency: 'Shveysariya franki (CHF)',
    lat: 46.8,
    lng: 8.2,
    coordinates: '46.9° N, 7.4° E',
    shortNote:
      'Alp tog‘lari bag‘rida joylashgan, musaffo ko‘llari va uzoq yillik betaraf siyosati bilan mashhur tog‘li mamlakat.',
    funFact:
      'Shveysariyada yuridik jihatdan rasmiy poytaxt belgilanmagan, Bern "federal shahar" sifatida poytaxt vazifasini bajaradi.',
    landmarks: [
      { name: 'Matterxorn cho‘qqisi', description: '4 478 m balandlikdagi mashhur piramida shaklidagi tog‘' },
      { name: 'Jeneva ko‘li', description: 'Markaziy Yevropadagi eng yirik va go‘zal tog‘ ko‘llaridan biri' },
    ],
  },
  {
    id: 'canada',
    code: 'CA',
    atlasName: 'Canada',
    name: 'Kanada',
    capital: 'Ottava',
    continent: 'Shimoliy Amerika',
    areaKm2: '9 984 670 km²',
    population: '41.0 mln',
    languages: 'Ingliz va fransuz',
    currency: 'Kanada dollari (CAD)',
    lat: 56.1,
    lng: -106.3,
    coordinates: '45.4° N, 75.7° W',
    shortNote:
      'Maydoni bo‘yicha dunyoda ikkinchi o‘rinda turuvchi, minglab ko‘llar va cheksiz tayga o‘rmonlariga boy shimoliy davlat.',
    funFact:
      'Dunyodagi barcha tabiiy ko‘llarning qariyb 60 foizi Kanadada joylashgan va mamlakat qirg‘oq chizig‘i eng uzunidir.',
    landmarks: [
      { name: 'Niagara sharsharasi', description: 'Shimoliy Amerikadagi eng qudratli sharsharalardan biri' },
      { name: 'Banff milliy bog‘i', description: 'Qoyali tog‘lardagi zumrad rangli muzlik ko‘llari' },
    ],
  },
  {
    id: 'india',
    code: 'IN',
    atlasName: 'India',
    name: 'Hindiston',
    capital: 'Nyu-Dehli',
    continent: 'Osiyo',
    areaKm2: '3 287 263 km²',
    population: '1.44 mlrd',
    languages: 'Hind va ingliz',
    currency: 'Hind rupiyasi (INR)',
    lat: 20.6,
    lng: 79.0,
    coordinates: '28.6° N, 77.2° E',
    shortNote:
      'Shimolda baland Himolay tog‘lari, janubda esa Hind okeani bilan o‘ralgan aholisi eng ko‘p davlat.',
    funFact:
      'Hindistondagi Mawsynram qishlog‘i Yer yuzidagi eng ko‘p yomg‘ir yog‘adigan aholi punkti hisoblanadi.',
    landmarks: [
      { name: 'Toj Mahal', description: 'Agradagi oq marmardan qurilgan jahon me’morchiligi durdonasi' },
      { name: 'Jaypur qal’alari', description: '"Pushti shahar"dagi qadimiy saroy va rasadxonalar' },
    ],
  },
  {
    id: 'peru',
    code: 'PE',
    atlasName: 'Peru',
    name: 'Peru',
    capital: 'Lima',
    continent: 'Janubiy Amerika',
    areaKm2: '1 285 216 km²',
    population: '34.4 mln',
    languages: 'Ispan va kechua',
    currency: 'Peru soli (PEN)',
    lat: -9.2,
    lng: -75.0,
    coordinates: '12.0° S, 77.0° W',
    shortNote:
      'Sohil cho‘lidan tortib baland And tog‘lari va Amazonka changalzorlarigacha uchta tabiat zonasini birlashtirgan yurt.',
    funFact:
      'Peru va Boliviya chegarasidagi Titikaka ko‘li 3 812 m balandlikda joylashgan eng yirik kema qatnaydigan ko‘ldir.',
    landmarks: [
      { name: 'Machu-Pikchu', description: 'And tog‘lari cho‘qqisidagi qadimgi inklar shahri' },
      { name: 'Naska chiziqlari', description: 'Cho‘l yuzasiga chizilgan sirli ulkan geogliflar' },
    ],
  },
  {
    id: 'kenya',
    code: 'KE',
    atlasName: 'Kenya',
    name: 'Keniya',
    capital: 'Nayrobi',
    continent: 'Afrika',
    areaKm2: '580 367 km²',
    population: '55.1 mln',
    languages: 'Suaxili va ingliz',
    currency: 'Keniya shillingi (KES)',
    lat: 0.0,
    lng: 37.9,
    coordinates: '1.3° S, 36.8° E',
    shortNote:
      'Ekvator chizig‘i kesib o‘tadigan Sharqiy Afrika davlati, bepoyon savannalari va Buyuk Rift vodiysi bilan mashhur.',
    funFact:
      'Nayrobi — chegarasi ichida haqiqiy yovvoyi hayvonot milliy bog‘i joylashgan kamyob poytaxt shahardir.',
    landmarks: [
      { name: 'Masai-Mara qo‘riqxonasi', description: 'Yovvoyi hayvonlarning buyuk migratsiyasi o‘tadigan savanna' },
      { name: 'Keniya tog‘i', description: 'Afrikadagi ikkinchi eng baland cho‘qqi (5 199 m)' },
    ],
  },
  {
    id: 'iceland',
    code: 'IS',
    atlasName: 'Iceland',
    name: 'Islandiya',
    capital: 'Reykyavik',
    continent: 'Yevropa',
    areaKm2: '103 000 km²',
    population: '0.39 mln',
    languages: 'Island tili',
    currency: 'Islandiya kronasi (ISK)',
    lat: 64.9,
    lng: -19.0,
    coordinates: '64.1° N, 21.9° W',
    shortNote:
      'Shimoliy Atlantika okeanida joylashgan, muzliklar va faol vulqonlar yonma-yon yashaydigan "Muz va Olov" oroli.',
    funFact:
      'Reykyavik dunyodagi eng shimoliy mustaqil davlat poytaxti bo‘lib, uylarning 90 foizidan ortig‘i geotermal energiya bilan isitiladi.',
    landmarks: [
      { name: 'Moviy laguna', description: 'Vulqon lavasi orasidagi tabiiy issiq geotermal suv havzasi' },
      { name: 'Gullfoss sharsharasi', description: 'Muzlik daryosidagi ikki pog‘onali qudratli sharshara' },
    ],
  },
  {
    id: 'usa',
    code: 'US',
    atlasName: 'United States of America',
    name: 'AQSH',
    capital: 'Vashington',
    continent: 'Shimoliy Amerika',
    areaKm2: '9 833 520 km²',
    population: '335 mln',
    languages: 'Ingliz tili',
    currency: 'AQSH dollari (USD)',
    lat: 39.8,
    lng: -98.6,
    coordinates: '38.9° N, 77.0° W',
    shortNote:
      'Atlantika va Tinch okeanlari oralig‘ida joylashgan, 50 ta shtatdan iborat yirik federativ mamlakat.',
    funFact:
      'AQSHda deyarli barcha asosiy iqlim zonalari — Alyaskadagi arktik sovuqdan Gavayidagi tropik o‘rmonlargacha uchraydi.',
    landmarks: [
      { name: 'Buyuk Kanyon', description: 'Kolorado daryosi million yillar davomida o‘ygan ulkan dara' },
      { name: 'Ozodlik haykali', description: 'Nyu-York bandargohidagi mashhur me’moriy yodgorlik' },
    ],
    featured: true,
  },
  {
    id: 'china',
    code: 'CN',
    atlasName: 'China',
    name: 'Xitoy',
    capital: 'Pekin',
    continent: 'Osiyo',
    areaKm2: '9 596 961 km²',
    population: '1.41 mlrd',
    languages: 'Xitoy tili',
    currency: 'Xitoy yuani (CNY)',
    lat: 35.9,
    lng: 104.2,
    coordinates: '39.9° N, 116.4° E',
    shortNote:
      'Sharqiy Osiyodagi ulkan mamlakat. G‘arbi baland Tibet tog‘ligi, sharqi esa Yanszi va Xuanxe daryolari tekisliklaridan iborat.',
    funFact:
      'Xitoy hududi 5 ta geografik vaqt mintaqasini qamrab olsa-da, butun mamlakat yagona Pekin vaqti bilan ishlaydi.',
    landmarks: [
      { name: 'Buyuk Xitoy devori', description: 'Tog‘ tizmalari bo‘ylab minglab kilometrga cho‘zilgan qadimiy inshoot' },
      { name: 'Chjanjiajie ustunlari', description: 'Tuman orasida qad rostlagan tik qumtosh qoyalari' },
    ],
  },
  {
    id: 'kazakhstan',
    code: 'KZ',
    atlasName: 'Kazakhstan',
    name: 'Qozog‘iston',
    capital: 'Ostona',
    continent: 'Osiyo',
    areaKm2: '2 724 900 km²',
    population: '20.1 mln',
    languages: 'Qozoq va rus',
    currency: 'Qozog‘iston tengesi (KZT)',
    lat: 48.0,
    lng: 66.9,
    coordinates: '51.2° N, 71.4° E',
    shortNote:
      'Dunyodagi dengizga chiqish yo‘li bo‘lmagan eng katta davlat va O‘zbekistonning shimoliy qo‘shnisi.',
    funFact:
      'Qozog‘iston g‘arbidagi Kaspiy dengizi aslida yopiq suv havzasi bo‘lib, dunyodagi eng katta ko‘ldir.',
    landmarks: [
      { name: 'Charin kanyoni', description: 'Qizil qumtosh qoyalaridan iborat go‘zal tabiat darasi' },
      { name: 'Boyqo‘ng‘ir kosmodromi', description: 'Insoniyat tarixidagi birinchi fazoviy parvoz amalga oshirilgan maskan' },
    ],
  },
  {
    id: 'turkey',
    code: 'TR',
    atlasName: 'Turkey',
    name: 'Turkiya',
    capital: 'Anqara',
    continent: 'Osiyo',
    areaKm2: '783 562 km²',
    population: '85.3 mln',
    languages: 'Turk tili',
    currency: 'Turk lirasi (TRY)',
    lat: 39.0,
    lng: 35.2,
    coordinates: '39.9° N, 32.9° E',
    shortNote:
      'Osiyo va Yevropa qit’alarini Bosfor va Dardanell bo‘g‘ozlari orqali bog‘lab turuvchi strategik mamlakat.',
    funFact:
      'Istanbul shahri bir vaqtning o‘zida ikki qit’ada — ham Osiyoda, ham Yevropada joylashgan dunyodagi yagona yirik shahardir.',
    landmarks: [
      { name: 'Kappadokiya', description: 'Vulqon qoyalariga o‘yilgan g‘or shaharlar va havo sharlari vodiysi' },
      { name: 'Pamukkale', description: 'Oq ohaktoshli tabiiy issiq mineral hovuzlar' },
    ],
  },
  {
    id: 'germany',
    code: 'DE',
    atlasName: 'Germany',
    name: 'Germaniya',
    capital: 'Berlin',
    continent: 'Yevropa',
    areaKm2: '357 592 km²',
    population: '84.6 mln',
    languages: 'Nemis tili',
    currency: 'Yevro (EUR)',
    lat: 51.2,
    lng: 10.4,
    coordinates: '52.5° N, 13.4° E',
    shortNote:
      'Markaziy Yevropada joylashgan, 9 ta davlat bilan chegaradosh va Reyn hamda Dunay daryolari kesib o‘tuvchi mamlakat.',
    funFact:
      'Germaniya Yevropada eng ko‘p qo‘shni davlatga ega mamlakatlardan biri bo‘lib, shimoldan ikki dengizga chiqadi.',
    landmarks: [
      { name: 'Brandenburg darvozasi', description: 'Berlin markazidagi tarixiy klassik me’moriy obida' },
      { name: 'Noyshvanshtayn qasri', description: 'Bavariya Alplaridagi ertaknamo tog‘ qasri' },
    ],
  },
  {
    id: 'france',
    code: 'FR',
    atlasName: 'France',
    name: 'Fransiya',
    capital: 'Parij',
    continent: 'Yevropa',
    areaKm2: '551 695 km²',
    population: '68.4 mln',
    languages: 'Fransuz tili',
    currency: 'Yevro (EUR)',
    lat: 46.6,
    lng: 2.2,
    coordinates: '48.9° N, 2.3° E',
    shortNote:
      'Atlantika okeani va O‘rta yer dengizi sohillariga ega, g‘arbi tekislik, janubi-sharqi esa Alp tog‘laridan iborat davlat.',
    funFact:
      'Dengiz orti hududlari tufayli Fransiya dunyoda eng ko‘p vaqt mintaqasiga (12 ta) ega davlatdir.',
    landmarks: [
      { name: 'Eyfel minorasi', description: 'Parij ramziga aylangan 330 metrlik metall inshoot' },
      { name: 'Mon-Sen-Mishel', description: 'Suv ko‘tarilganda orolga aylanadigan qadimiy qal’a' },
    ],
  },
  {
    id: 'italy',
    code: 'IT',
    atlasName: 'Italy',
    name: 'Italiya',
    capital: 'Rim',
    continent: 'Yevropa',
    areaKm2: '301 340 km²',
    population: '58.9 mln',
    languages: 'Italyan tili',
    currency: 'Yevro (EUR)',
    lat: 42.5,
    lng: 12.6,
    coordinates: '41.9° N, 12.5° E',
    shortNote:
      'O‘rta yer dengiziga kirib borgan Apennin yarimorolida joylashgan, xaritada etik shakliga o‘xshash mamlakat.',
    funFact:
      'Italiya hududi ichida ikkita mustaqil mitti davlat — Vatikan va San-Marino joylashgan.',
    landmarks: [
      { name: 'Kolizey', description: 'Qadimgi Rimning mashhur amfiteatri' },
      { name: 'Venetsiya kanallari', description: '118 ta orol ustida ko‘priklar bilan bog‘langan suv shahri' },
    ],
  },
  {
    id: 'uk',
    code: 'GB',
    atlasName: 'United Kingdom',
    name: 'Buyuk Britaniya',
    capital: 'London',
    continent: 'Yevropa',
    areaKm2: '243 610 km²',
    population: '68.3 mln',
    languages: 'Ingliz tili',
    currency: 'Funt sterling (GBP)',
    lat: 54.0,
    lng: -2.0,
    coordinates: '51.5° N, 0.1° W',
    shortNote:
      'Yevropaning shimoli-g‘arbidagi Britaniya orollarida joylashgan, Golfstrim iliq oqimi ta’siridagi dengiz iqlimli davlat.',
    funFact:
      'Dunyo soat mintaqalarini hisoblash nuqtasi — Grinvich bosh meridiani (0°) London hududidan o‘tadi.',
    landmarks: [
      { name: 'Big Ben va Parlament', description: 'Temza daryosi bo‘yidagi London timsoli' },
      { name: 'Stounxenj', description: 'Ming yillik tarixga ega sirli megalit tosh doirasi' },
    ],
  },
  {
    id: 'argentina',
    code: 'AR',
    atlasName: 'Argentina',
    name: 'Argentina',
    capital: 'Buenos-Ayres',
    continent: 'Janubiy Amerika',
    areaKm2: '2 780 400 km²',
    population: '46.6 mln',
    languages: 'Ispan tili',
    currency: 'Argentina pesosi (ARS)',
    lat: -38.4,
    lng: -63.6,
    coordinates: '34.6° S, 58.4° W',
    shortNote:
      'Janubiy Amerikaning janubi-sharqida, And tog‘lari etagidan Atlantika okeanigacha cho‘zilgan bepoyon pampas dashtlari yurti.',
    funFact:
      'Dunyodagi eng janubiy shaharlardan biri — Ushuaya Argentinaning Olovli Yer orolida joylashgan.',
    landmarks: [
      { name: 'Perito Moreno muzligi', description: 'Patagoniyadagi ulkan harakatlanuvchi muz devori' },
      { name: 'Akonkagua tog‘i', description: 'Amerikadagi eng baland cho‘qqi (6 961 m)' },
    ],
  },
  {
    id: 'saudi',
    code: 'SA',
    atlasName: 'Saudi Arabia',
    name: 'Saudiya Arabistoni',
    capital: 'Ar-Riyod',
    continent: 'Osiyo',
    areaKm2: '2 149 690 km²',
    population: '36.9 mln',
    languages: 'Arab tili',
    currency: 'Saudiya riali (SAR)',
    lat: 23.9,
    lng: 45.1,
    coordinates: '24.7° N, 46.7° E',
    shortNote:
      'Arabiston yarimorolining asosiy qismini egallagan, Qizil dengiz va Fors ko‘rfazi oralig‘idagi cho‘l mamlakati.',
    funFact:
      'Saudiya Arabistoni — hududida yil davomida doimiy oqib turuvchi birorta ham tabiiy daryo bo‘lmagan dunyodagi eng katta davlatdir.',
    landmarks: [
      { name: 'Al-Ula qoyalari', description: 'Qumtosh qoyalariga o‘yilgan qadimiy shahar yodgorliklari' },
      { name: 'Rub-al-Xoli cho‘li', description: 'Dunyodagi eng katta uzluksiz qum cho‘llaridan biri' },
    ],
  },
  {
    id: 'indonesia',
    code: 'ID',
    atlasName: 'Indonesia',
    name: 'Indoneziya',
    capital: 'Jakarta',
    continent: 'Osiyo',
    areaKm2: '1 904 569 km²',
    population: '279 mln',
    languages: 'Indonez tili',
    currency: 'Indoneziya rupiyasi (IDR)',
    lat: -2.5,
    lng: 118.0,
    coordinates: '6.2° S, 106.8° E',
    shortNote:
      'Tinch va Hind okeanlari tutashgan ekvator mintaqasida joylashgan dunyodagi eng yirik orollar davlati (arxipelag).',
    funFact:
      'Indoneziya 17 000 dan ortiq oroldan tashkil topgan va unda 120 dan ziyod faol vulqon mavjud.',
    landmarks: [
      { name: 'Bromo vulqoni', description: 'Yava orolidagi tutab turgan mashhur vulqon krateri' },
      { name: 'Komodo milliy bog‘i', description: 'Dunyodagi eng yirik kaltakesaklar yashaydigan orollar' },
    ],
  },
  {
    id: 'south-africa',
    code: 'ZA',
    atlasName: 'South Africa',
    name: 'Janubiy Afrika',
    capital: 'Pretoriya',
    continent: 'Afrika',
    areaKm2: '1 221 037 km²',
    population: '62.0 mln',
    languages: 'Ingliz, zulu, kosa va b.',
    currency: 'Janubiy Afrika rendi (ZAR)',
    lat: -30.6,
    lng: 22.9,
    coordinates: '25.7° S, 28.2° E',
    shortNote:
      'Afrika materigining eng janubiy qismida, Atlantika va Hind okeanlari tutashadigan hududda joylashgan davlat.',
    funFact:
      'Janubiy Afrika dunyoda uchta rasmiy poytaxtga ega yagona mamlakat: Pretoriya, Keyptaun va Blumfonteyn.',
    landmarks: [
      { name: 'Stol tog‘i', description: 'Keyptaun ustida tekis cho‘qqisi bilan ajralib turuvchi tog‘' },
      { name: 'Kryuger milliy bog‘i', description: 'Afrikadagi eng yirik yovvoyi tabiat qo‘riqxonalaridan biri' },
    ],
  },
  {
    id: 'new-zealand',
    code: 'NZ',
    atlasName: 'New Zealand',
    name: 'Yangi Zelandiya',
    capital: 'Vellington',
    continent: 'Okeaniya',
    areaKm2: '268 021 km²',
    population: '5.2 mln',
    languages: 'Ingliz va maori',
    currency: 'Yangi Zelandiya dollari (NZD)',
    lat: -41.0,
    lng: 174.0,
    coordinates: '41.3° S, 174.8° E',
    shortNote:
      'Tinch okeanining janubi-g‘arbida ikkita yirik orolda joylashgan, geyzerlar va baland tog‘larga boy mamlakat.',
    funFact:
      'Vellington dunyodagi eng janubda joylashgan mustaqil davlat poytaxti hisoblanadi.',
    landmarks: [
      { name: 'Milford Saund', description: 'Janubiy oroldagi chuqur tog‘ fyordi va sharsharalar' },
      { name: 'Aoraki (Kuk tog‘i)', description: 'Yangi Zelandiyaning eng baland qorli cho‘qqisi' },
    ],
  },
  {
    id: 'mexico',
    code: 'MX',
    atlasName: 'Mexico',
    name: 'Meksika',
    capital: 'Mexiko',
    continent: 'Shimoliy Amerika',
    areaKm2: '1 964 375 km²',
    population: '129 mln',
    languages: 'Ispan tili',
    currency: 'Meksika pesosi (MXN)',
    lat: 23.6,
    lng: -102.5,
    coordinates: '19.4° N, 99.1° W',
    shortNote:
      'Shimoliy va Janubiy Amerikani bog‘lovchi qismda, Tinch okeani va Meksika ko‘rfazi oralig‘ida joylashgan tog‘li davlat.',
    funFact:
      'Mexiko poytaxti qadimiy atsteklar shahri o‘rnida — dengiz sathidan 2 240 metr balandlikdagi tog‘ vodiysida joylashgan.',
    landmarks: [
      { name: 'Chichen-Itsa', description: 'Yukatan yarimorolidagi mayya tamadduni piramidasi' },
      { name: 'Mis kanoni', description: 'Tog‘lar orasidagi ulkan daralar tizimi' },
    ],
  },
  {
    id: 'south-korea',
    code: 'KR',
    atlasName: 'South Korea',
    name: 'Janubiy Koreya',
    capital: 'Seul',
    continent: 'Osiyo',
    areaKm2: '100 210 km²',
    population: '51.7 mln',
    languages: 'Koreys tili',
    currency: 'Koreya voni (KRW)',
    lat: 35.9,
    lng: 127.8,
    coordinates: '37.6° N, 127.0° E',
    shortNote:
      'Koreya yarimorolining janubiy qismida joylashgan, uch tomondan dengizlar bilan o‘ralgan tog‘li mamlakat.',
    funFact:
      'Janubiy Koreya hududining qariyb 70 foizini o‘rmonli tog‘ va tepaliklar egallagan.',
    landmarks: [
      { name: 'Cheju oroli', description: 'Mamlakat janubidagi vulqon kelib chiqishli orol va Xallasan tog‘i' },
      { name: 'Kyongbokkun saroyi', description: 'Seuldagi tarixiy qirollik majmuasi' },
    ],
  },
  {
    id: 'morocco',
    code: 'MA',
    atlasName: 'Morocco',
    name: 'Marokash',
    capital: 'Rabot',
    continent: 'Afrika',
    areaKm2: '446 550 km²',
    population: '37.8 mln',
    languages: 'Arab va berber',
    currency: 'Marokash dirhami (MAD)',
    lat: 31.8,
    lng: -7.1,
    coordinates: '34.0° N, 6.8° W',
    shortNote:
      'Afrikaning shimoli-g‘arbida, Atlantika okeani va O‘rta yer dengizi tutashgan Gibraltar bo‘g‘ozi yaqinidagi davlat.',
    funFact:
      'Marokashdan Ispaniyagacha Gibraltar bo‘g‘ozi orqali masofa atigi 14 kilometrni tashkil etadi.',
    landmarks: [
      { name: 'Atlas tog‘lari', description: 'Shimoliy Afrikaning eng baland tog‘ tizmasi (Tubkal, 4 167 m)' },
      { name: 'Shefshauen', description: 'Rif tog‘laridagi ko‘k rangga bo‘yalgan mashhur shahar' },
    ],
  },
];

export const DAILY_FACTS: string[] = [
  'Tinch okeanidagi Mariana botig‘i shunchalik chuqurki, uning tubiga Everest tog‘ini qo‘ysak ham ustidan 2 kilometrdan ortiq suv qoladi.',
  'Sahroi Kabir cho‘lidan ko‘tarilgan chang va qum zarralari shamol bilan Atlantika okeani ustidan uchib o‘tib, Amazonka o‘rmonlari tuprog‘ini minerallar bilan boyitadi.',
  'Afrika bir vaqtning o‘zida to‘rttala yarimsharda (Shimoliy, Janubiy, Sharqiy va G‘arbiy) joylashgan sayyoradagi yagona materikdir.',
  'O‘zbekiston dunyoda okeanga chiqish uchun kamida ikkita davlat chegarasini kesib o‘tish zarur bo‘lgan atigi ikkita mamlakatdan biridir.',
  'Antarktida qalin muz qatlami bilan qoplangan bo‘lsa-da, markaziga yiliga atigi 50 mm atrofida yog‘in tushgani uchun rasman cho‘l hisoblanadi.',
  'Kanada hududida Yer yuzidagi barcha tabiiy ko‘llarning qariyb 60 foizi joylashgan.',
  'Islandiyada quyoshli issiqlik elektrdan ko‘ra yer ostidan chiqadigan geotermal bug‘ hisobiga uylarning 90 foizidan ortig‘i isitiladi.',
  'Istanbul shahri Bosfor bo‘g‘ozining ikki qirg‘og‘ida joylashgani uchun bir vaqtning o‘zida ham Yevropada, ham Osiyoda yashaydigan yagona yirik shahardir.',
  'Baykal ko‘lida sayyoramizdagi suyuq holatdagi chuchuk suv zaxirasining 20 foizi saqlanadi.',
  'Atlantika okeani tektonik plitalar siljishi tufayli har yili taxminan 2–3 santimetrga kengayib bormoqda.',
];

export const RIVERS_AND_DESERTS: RiverDesertItem[] = [
  {
    id: 'nile',
    type: 'Daryo',
    name: 'Nil daryosi',
    region: 'Sharqiy va Shimoliy Afrika',
    metricLabel: 'Uzunligi',
    metricValue: '6 650 km',
    summary:
      'Dunyodagi eng uzun daryo. 11 ta davlat hududidan oqib o‘tib, O‘rta yer dengiziga ulkan delta hosil qilib quyiladi.',
    funFact:
      'Qadimgi Misr sivilizatsiyasi aynan Nilning har yili toshib, unumdor loyqa olib kelishi tufayli gullab-yashnagan.',
  },
  {
    id: 'amazon-river',
    type: 'Daryo',
    name: 'Amazonka daryosi',
    region: 'Janubiy Amerika',
    metricLabel: 'Suv hajmi',
    metricValue: '209 ming m³/s',
    summary:
      'Dunyodagi eng sersuv daryo. Unda barcha boshqa yirik daryolar birgalikda beradigan suvdan ko‘proq chuchuk suv oqadi.',
    funFact:
      'Amazonka daryosi ustidan birorta ham avtomobil ko‘prigi qurilmagan, chunki uning o‘zani mavsumga qarab juda kengayib ketadi.',
  },
  {
    id: 'amudarya',
    type: 'Daryo',
    name: 'Amudaryo',
    region: 'Markaziy Osiyo (O‘zbekiston)',
    metricLabel: 'Uzunligi',
    metricValue: '2 540 km',
    summary:
      'Pomir va Hindukush tog‘laridagi abadiy muzliklardan boshlanuvchi Markaziy Osiyoning eng sersuv daryosi.',
    funFact:
      'Qadimiy manbalarda Amudaryo "Oksus" yoki "Jayhun" nomlari bilan mashhur bo‘lgan.',
  },
  {
    id: 'sahara-desert',
    type: 'Cho‘l',
    name: 'Sahroi Kabir',
    region: 'Shimoliy Afrika',
    metricLabel: 'Maydoni',
    metricValue: '9.2 mln km²',
    summary:
      'Sayyoramizdagi eng katta issiq cho‘l. Hududining katta qismi toshloq platolar va qum barxanlaridan tashkil topgan.',
    funFact:
      'Sahroi Kabirda kunduzi havo +50°C dan oshsa, tunda +0°C gacha sovib ketishi mumkin.',
  },
  {
    id: 'kyzylkum',
    type: 'Cho‘l',
    name: 'Qizilqum cho‘li',
    region: 'O‘zbekiston · Qozog‘iston',
    metricLabel: 'Maydoni',
    metricValue: '300 ming km²',
    summary:
      'Amudaryo va Sirdaryo oralig‘ida joylashgan, qizg‘ish qumli barxanlari va qoldiq tog‘lariga ega Markaziy Osiyoning yirik cho‘li.',
    funFact:
      'Qizilqum cho‘li ostida ulkan gaz, oltin va fosforit zaxiralari joylashgan.',
  },
  {
    id: 'atacama',
    type: 'Cho‘l',
    name: 'Atakama cho‘li',
    region: 'Chili (Janubiy Amerika)',
    metricLabel: 'Yillik yog‘in',
    metricValue: '< 15 mm',
    summary:
      'Yer yuzidagi eng qurg‘oqchil qutbsiz cho‘l. And tog‘lari va sovuq Peru oqimi bu yerga namlik o‘tishiga to‘sqinlik qiladi.',
    funFact:
      'Atakamaning ayrim nuqtalarida yuzlab yillar davomida bir tomchi ham yomg‘ir yog‘magan; NASA bu yerda Mars apparatlarini sinaydi.',
  },
];

export const GEO_FLASHCARDS: GeoFlashcard[] = [
  {
    id: 'fc1',
    category: 'Davlatlar va poytaxtlar',
    front: 'Avstraliyaning poytaxti qaysi shahar?',
    hint: 'Sidney va Melburn o‘rtasida qurilgan shahar',
    back: 'Kanberra',
    detail: '1908-yilda Sidney va Melburn o‘rtasidagi bahsni hal qilish uchun poytaxt etib tanlangan.',
  },
  {
    id: 'fc2',
    category: 'Davlatlar va poytaxtlar',
    front: 'Shveysariyaning amaldagi poytaxti qaysi shahar?',
    hint: 'Federal shahar maqomiga ega',
    back: 'Bern',
    detail: 'Shveysariya konstitutsiyasida rasmiy poytaxt yozilmagan, Bern hukumat qarorgohi sifatida poytaxt sanaladi.',
  },
  {
    id: 'fc3',
    category: 'Davlatlar va poytaxtlar',
    front: 'Janubiy Amerikaning eng katta davlati va uning poytaxti?',
    hint: 'Portugal tilida so‘zlashadi',
    back: 'Braziliya — Braziliya shahri',
    detail: 'Maydoni 8.5 mln km² dan ortiq bo‘lib, qit’aning qariyb yarmini egallaydi.',
  },
  {
    id: 'fc4',
    category: 'Davlatlar va poytaxtlar',
    front: 'Dunyodagi eng shimolda joylashgan mustaqil davlat poytaxti?',
    hint: 'Geotermal issiqlik shahri',
    back: 'Reykyavik (Islandiya)',
    detail: '64° shimoliy kenglikda joylashgan va "Tutunli ko‘rfaz" ma’nosini anglatadi.',
  },
  {
    id: 'fc5',
    category: 'Davlatlar va poytaxtlar',
    front: 'Qaysi shahar ham Yevropada, ham Osiyoda joylashgan?',
    hint: 'Bosfor bo‘g‘ozi ikkiga bo‘ladi',
    back: 'Istanbul (Turkiya)',
    detail: 'Turkiyaning rasmiy poytaxti esa Anqara shahridir.',
  },
  {
    id: 'fc6',
    category: 'Qit’alar va okeanlar',
    front: 'Sayyoramizdagi eng katta va eng chuqur okean qaysi?',
    hint: 'Mariana botig‘i shu yerda joylashgan',
    back: 'Tinch okeani',
    detail: 'Maydoni 165.2 mln km² — barcha qit’alarning umumiy maydonidan ham kattaroq.',
  },
  {
    id: 'fc7',
    category: 'Qit’alar va okeanlar',
    front: 'To‘rttala yarimsharda ham joylashgan yagona qit’a qaysi?',
    hint: 'Ekvator ham, bosh meridian ham kesib o‘tadi',
    back: 'Afrika',
    detail: 'Afrikada 54 ta davlat joylashgan bo‘lib, davlatlar soni bo‘yicha birinchi o‘rinda turadi.',
  },
  {
    id: 'fc8',
    category: 'Qit’alar va okeanlar',
    front: 'Qaysi okean har yili 2–3 sm ga kengayib bormoqda?',
    hint: 'Yevropa va Amerikani ajratib turadi',
    back: 'Atlantika okeani',
    detail: 'O‘rta Atlantika suvosti tizmasida yangi yer qobig‘i hosil bo‘layotgani sababli kengayadi.',
  },
  {
    id: 'fc9',
    category: 'Qit’alar va okeanlar',
    front: 'Okeanlar orasida eng kichigi va eng sayozi qaysi?',
    hint: 'Shimoliy qutb atrofida joylashgan',
    back: 'Shimoliy Muz okeani',
    detail: 'O‘rtacha chuqurligi 1 205 metr bo‘lib, yilning katta qismida muz bilan qoplanadi.',
  },
  {
    id: 'fc10',
    category: 'Tog‘lar, daryolar va cho‘llar',
    front: 'O‘zbekiston hududidagi eng baland cho‘qqi qaysi?',
    hint: 'Hisor tog‘ tizmasida joylashgan',
    back: 'Hazrati Sulton cho‘qqisi (4 643 m)',
    detail: 'Shuningdek Alpomish cho‘qqisi nomi bilan ham ataladi.',
  },
  {
    id: 'fc11',
    category: 'Tog‘lar, daryolar va cho‘llar',
    front: 'Dunyodagi eng sersuv daryo qaysi?',
    hint: 'Janubiy Amerikadagi tropik o‘rmonlardan oqadi',
    back: 'Amazonka daryosi',
    detail: 'Okeanga quyiladigan barcha daryo suvining 20 foizini aynan Amazonka beradi.',
  },
  {
    id: 'fc12',
    category: 'Tog‘lar, daryolar va cho‘llar',
    front: 'Afrikaning eng baland cho‘qqisi qaysi?',
    hint: 'Yakka so‘ngan vulqon, Tanzaniya',
    back: 'Kilimanjaro (5 895 m)',
    detail: 'Ekvator yaqinida joylashganiga qaramay, cho‘qqisida abadiy muzliklar bor.',
  },
  {
    id: 'fc13',
    category: 'Tog‘lar, daryolar va cho‘llar',
    front: 'Quruqlikdagi eng uzun tog‘ tizmasi qaysi?',
    hint: 'Janubiy Amerikaning g‘arbiy sohili bo‘ylab 7 000 km cho‘zilgan',
    back: 'And tog‘lari',
    detail: 'Eng baland nuqtasi — Akonkagua cho‘qqisi (6 961 m).',
  },
  {
    id: 'fc14',
    category: 'Tog‘lar, daryolar va cho‘llar',
    front: 'Yer yuzidagi eng chuqur ko‘l qaysi?',
    hint: 'Sharqiy Sibirda joylashgan',
    back: 'Baykal ko‘li (1 642 m)',
    detail: 'Sayyoradagi suyuq chuchuk suvning 20 foizini o‘zida saqlaydi.',
  },
];

export const QUIZ_BANK: GeoQuizItem[] = [
  // Oson
  {
    id: 'qz1',
    category: 'Poytaxtlar',
    difficulty: 'Oson',
    question: 'Avstraliya davlatining poytaxti qaysi shahar?',
    options: ['Sidney', 'Melburn', 'Kanberra', 'Brisben'],
    correctIndex: 2,
    explanation:
      'Sidney va Melburn o‘rtasidagi raqobatni hal qilish uchun ikki shahar oralig‘idagi Kanberra poytaxt etib tanlangan.',
  },
  {
    id: 'qz2',
    category: 'Okeanlar',
    difficulty: 'Oson',
    question: 'Dunyodagi eng katta va eng chuqur okean qaysi?',
    options: ['Atlantika okeani', 'Tinch okeani', 'Hind okeani', 'Janubiy okean'],
    correctIndex: 1,
    explanation:
      'Tinch okeani 165.2 mln km² maydoni va 10 984 metrli Mariana botig‘i bilan barcha okeanlardan katta va chuqur.',
  },
  {
    id: 'qz3',
    category: 'Tog‘lar',
    difficulty: 'Oson',
    question: 'Yer yuzidagi eng baland cho‘qqi Everest qaysi tog‘ tizmasida joylashgan?',
    options: ['Alp', 'And', 'Himolay', 'Kavkaz'],
    correctIndex: 2,
    explanation:
      'Everest (8 849 m) Osiyodagi Himolay tog‘ tizmasida, Nepal va Xitoy chegarasida joylashgan.',
  },
  {
    id: 'qz4',
    category: 'Bayroqlar',
    difficulty: 'Oson',
    question: 'Ushbu bayroq qaysi davlatga tegishli?',
    flagCode: 'JP',
    flagName: 'Yaponiya',
    options: ['Janubiy Koreya', 'Yaponiya', 'Xitoy', 'Indoneziya'],
    correctIndex: 1,
    explanation:
      'Oq fonda qizil quyosh doirasi tasvirlangan bayroq Yaponiyaga ("Kunchiqar mamlakat") tegishli.',
  },
  {
    id: 'qz5',
    category: 'Davlatlar',
    difficulty: 'Oson',
    question: 'Afrikaning qaysi davlati Nil daryosi va qadimiy ehromlari bilan mashhur?',
    options: ['Keniya', 'Marokash', 'Misr', 'Janubiy Afrika'],
    correctIndex: 2,
    explanation:
      'Misr aholisining 95 foizdan ortig‘i Nil daryosi vodiysi va deltasida yashaydi.',
  },
  {
    id: 'qz6',
    category: 'Bayroqlar',
    difficulty: 'Oson',
    question: 'Ushbu bayroq qaysi davlatniki?',
    flagCode: 'UZ',
    flagName: 'O‘zbekiston',
    options: ['Qozog‘iston', 'O‘zbekiston', 'Turkiya', 'Ozarbayjon'],
    correctIndex: 1,
    explanation:
      'Moviy, oq va yashil yo‘llar hamda yarim oy va 12 yulduz tasvirlangan bayroq O‘zbekiston Respublikasi bayrog‘idir.',
  },
  // O'rta
  {
    id: 'qz7',
    category: 'Poytaxtlar',
    difficulty: 'O‘rta',
    question: 'Qaysi poytaxt shahar chegarasi ichida haqiqiy yovvoyi hayvonot milliy bog‘i joylashgan?',
    options: ['Qohira', 'Nayrobi', 'Lima', 'Jakarta'],
    correctIndex: 1,
    explanation:
      'Keniya poytaxti Nayrobi shahri hududida sherlar, jirafalar va karkidonlar yashaydigan milliy bog‘ mavjud.',
  },
  {
    id: 'qz8',
    category: 'Davlatlar',
    difficulty: 'O‘rta',
    question: 'Qaysi davlat ikki marta dengizga chiqish yo‘li bo‘lmagan (double-landlocked) mamlakat sanaladi?',
    options: ['Shveysariya', 'O‘zbekiston', 'Qozog‘iston', 'Turkiya'],
    correctIndex: 1,
    explanation:
      'O‘zbekistondan ochiq okeanga chiqish uchun kamida ikkita davlat chegarasidan o‘tish zarur.',
  },
  {
    id: 'qz9',
    category: 'Bayroqlar',
    difficulty: 'O‘rta',
    question: 'Rasmdagi bayroq qaysi Skandinaviya mamlakatiga tegishli?',
    flagCode: 'NO',
    flagName: 'Norvegiya',
    options: ['Islandiya', 'Shveysariya', 'Norvegiya', 'Buyuk Britaniya'],
    correctIndex: 2,
    explanation:
      'Qizil fonda oq hoshiyali to‘q ko‘k Skandinaviya xochi Norvegiya bayrog‘ini anglatadi.',
  },
  {
    id: 'qz10',
    category: 'Tog‘lar',
    difficulty: 'O‘rta',
    question: 'Afrikaning eng baland nuqtasi — Kilimanjaro cho‘qqisi qanday hosil bo‘lgan?',
    options: [
      'Ikki plita to‘qnashuvidan burmalangan',
      'Yakka so‘ngan vulqon sifatida',
      'Daryo eroziyasi natijasida',
      'Muzliklar to‘planishidan',
    ],
    correctIndex: 1,
    explanation:
      'Kilimanjaro (5 895 m) tizmaga birlashmagan ulkan yakka so‘ngan vulqondir.',
  },
  {
    id: 'qz11',
    category: 'Okeanlar',
    difficulty: 'O‘rta',
    question: 'Qaysi okean tektonik plitalar siljishi tufayli har yili 2–3 santimetrga kengayib bormoqda?',
    options: ['Tinch okeani', 'Hind okeani', 'Atlantika okeani', 'Shimoliy Muz okeani'],
    correctIndex: 2,
    explanation:
      'O‘rta Atlantika suvosti tizmasi bo‘ylab yangi yer po‘sti hosil bo‘layotgani sababli Atlantika kengaymoqda.',
  },
  {
    id: 'qz12',
    category: 'Bayroqlar',
    difficulty: 'O‘rta',
    question: 'Markazida sariq romb va ko‘k yulduzli doira joylashgan bayroq qaysi davlatniki?',
    flagCode: 'BR',
    flagName: 'Braziliya',
    options: ['Argentina', 'Meksika', 'Braziliya', 'Peru'],
    correctIndex: 2,
    explanation:
      'Yashil fonda sariq romb va ko‘k osmon shari tasviri Braziliya davlat bayrog‘idir.',
  },
  // Qiyin
  {
    id: 'qz13',
    category: 'Davlatlar',
    difficulty: 'Qiyin',
    question: 'Qaysi davlat hududida yil davomida doimiy oqib turuvchi birorta ham tabiiy daryo yo‘q?',
    options: ['Marokash', 'Saudiya Arabistoni', 'Avstraliya', 'Meksika'],
    correctIndex: 1,
    explanation:
      'Saudiya Arabistoni doimiy daryosi bo‘lmagan dunyodagi eng katta davlatdir.',
  },
  {
    id: 'qz14',
    category: 'Poytaxtlar',
    difficulty: 'Qiyin',
    question: 'Dunyodagi eng janubda joylashgan mustaqil davlat poytaxti qaysi?',
    options: ['Buenos-Ayres', 'Kanberra', 'Vellington', 'Keyptaun'],
    correctIndex: 2,
    explanation:
      'Yangi Zelandiya poytaxti Vellington 41.3° janubiy kenglikda joylashgan eng janubiy poytaxtdir.',
  },
  {
    id: 'qz15',
    category: 'Tog‘lar',
    difficulty: 'Qiyin',
    question: 'G‘arbiy va Janubiy yarimsharlarning eng baland cho‘qqisi qaysi?',
    options: ['Denali', 'Akonkagua', 'Elbrus', 'Monblan'],
    correctIndex: 1,
    explanation:
      'And tog‘laridagi Akonkagua cho‘qqisi (6 961 m, Argentina) Osiyodan tashqaridagi eng baland cho‘qqidir.',
  },
  {
    id: 'qz16',
    category: 'Okeanlar',
    difficulty: 'Qiyin',
    question: 'Okeanning 200 m dan 1 000 m gacha bo‘lgan, biolyuminestsent jonzotlar yashaydigan qatlami nima deb ataladi?',
    options: ['Epipelagik', 'Mezopelagik (Shafaq)', 'Abissal', 'Xadal'],
    correctIndex: 1,
    explanation:
      'Mezopelagik qatlamga quyosh nuri juda kam tushadi, shu bois baliqlar va meduzalar o‘z tanasidan nur chiqaradi.',
  },
  {
    id: 'qz17',
    category: 'Bayroqlar',
    difficulty: 'Qiyin',
    question: 'Ushbu bayroq qaysi orol davlatiga tegishli?',
    flagCode: 'IS',
    flagName: 'Islandiya',
    options: ['Norvegiya', 'Islandiya', 'Buyuk Britaniya', 'Yangi Zelandiya'],
    correctIndex: 1,
    explanation:
      'Ko‘k fonda oq hoshiyali qizil Skandinaviya xochi Islandiya davlat bayrog‘ini bildiradi.',
  },
  {
    id: 'qz18',
    category: 'Bayroqlar',
    difficulty: 'Qiyin',
    question: 'Markazida qizil va ko‘k Taegukgi ramzi hamda to‘rtta qora trigramma bor bayroq qaysi davlatniki?',
    flagCode: 'KR',
    flagName: 'Janubiy Koreya',
    options: ['Yaponiya', 'Janubiy Koreya', 'Xitoy', 'Tailand'],
    correctIndex: 1,
    explanation:
      'Oq fonda qizil-ko‘k doira va to‘rt burchakdagi trigrammalar Janubiy Koreya bayrog‘iga xos.',
  },
];

export const BADGE_DEFINITIONS: BadgeDef[] = [
  {
    id: 'first-quiz',
    title: 'Ilk qadam',
    description: 'Birinchi geografiya viktorinasini yakunladingiz.',
    requirementLabel: '1 ta viktorina yakunlash',
  },
  {
    id: 'flag-master',
    title: 'Bayroq ustasi',
    description: 'Bayroqlar kategoriyasida kamida 80% natija qayd etdingiz.',
    requirementLabel: 'Bayroqlar testida 80%+',
  },
  {
    id: 'map-explorer',
    title: 'Xarita sayyohi',
    description: 'Interaktiv xaritada 5 ta davlatni kashf qildingiz.',
    requirementLabel: '5 ta davlatni ko‘rish',
  },
  {
    id: 'flashcard-pro',
    title: 'Kartochka bilimdoni',
    description: 'Ta’lim rejimida kamida 6 ta kartochkani o‘zlashtirdingiz.',
    requirementLabel: '6 ta kartochka yodlash',
  },
  {
    id: 'daily-streak',
    title: 'Kunlik faol',
    description: 'Kunlik geografiya topshirig‘ini muvaffaqiyatli bajardingiz.',
    requirementLabel: 'Kunlik vazifani bajarish',
  },
  {
    id: 'geo-champion',
    title: 'Geografiya chempioni',
    description: 'Jami 300 XP dan ortiq bilim ballini to‘pladingiz.',
    requirementLabel: '300 XP to‘plash',
  },
];

export const BASE_LEADERBOARD = [
  { name: 'Azizbek Karimov', city: 'Toshkent', xp: 640 },
  { name: 'Madina Tursunova', city: 'Samarqand', xp: 520 },
  { name: 'Sardorbek Alimov', city: 'Buxoro', xp: 410 },
  { name: 'Dilnoza Rahimova', city: 'Farg‘ona', xp: 290 },
  { name: 'Jasur Abdullayev', city: 'Namangan', xp: 180 },
];
