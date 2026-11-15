export type Continent =
  | 'Barchasi'
  | 'Osiyo'
  | 'Yevropa'
  | 'Afrika'
  | 'Amerika'
  | 'Okeaniya';

export interface CountryItem {
  id: string;
  name: string;
  capital: string;
  continent: Exclude<Continent, 'Barchasi'>;
  areaKm2: string;
  populationM: string;
  language: string;
  coordinates: string;
  shortNote: string;
  funFact: string;
}

export interface OceanItem {
  id: string;
  name: string;
  areaMillionKm2: number;
  sharePercent: number;
  avgDepthM: number;
  maxDepthM: number;
  deepestPoint: string;
  tempRange: string;
  teacherSummary: string;
  funFact: string;
}

export interface OceanZone {
  id: string;
  name: string;
  depthRange: string;
  sunlight: string;
  pressureAtm: string;
  temperature: string;
  lifeSummary: string;
}

export interface MountainItem {
  id: string;
  name: string;
  range: string;
  continent: string;
  countries: string;
  elevationM: number;
  originType: 'Burmali' | 'Vulkanik' | 'Qalqonsimon';
  teacherSummary: string;
  funFact: string;
}

export interface NatureWonder {
  id: string;
  name: string;
  biome: string;
  region: string;
  climateType: string;
  keyMetricLabel: string;
  keyMetricValue: string;
  teacherSummary: string;
  funFact: string;
}

export interface QuizQuestion {
  id: string;
  topic: 'Davlatlar' | 'Okeanlar' | 'Tog‘lar' | 'Tabiat';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const PLANET_KPI_STATS = [
  {
    label: 'Yer sayyorasi maydoni',
    value: '510 mln km²',
    detail: '71% suv va 29% quruqlik',
  },
  {
    label: 'Tan olingan davlatlar',
    value: '195 ta',
    detail: '6 ta aholi yashaydigan qit’ada',
  },
  {
    label: 'Eng chuqur nuqta',
    value: '10 984 m',
    detail: 'Tinch okeani · Mariana botig‘i',
  },
  {
    label: 'Eng baland cho‘qqi',
    value: '8 849 m',
    detail: 'Himolay · Everest (Jomolungma)',
  },
];

export const COUNTRIES: CountryItem[] = [
  {
    id: 'uzbekistan',
    name: 'O‘zbekiston',
    capital: 'Toshkent',
    continent: 'Osiyo',
    areaKm2: '448 978 km²',
    populationM: '37.5 mln',
    language: 'O‘zbek tili',
    coordinates: '41.3° N, 69.2° E',
    shortNote:
      'Markaziy Osiyoning qoq markazida, Amudaryo va Sirdaryo oralig‘ida joylashgan qadimiy Buyuk Ipak yo‘li yurti.',
    funFact:
      'O‘zbekiston dunyodagi ikki marta dengizga chiqish yo‘li bo‘lmagan (double-landlocked) atigi ikkita davlatdan biridir.',
  },
  {
    id: 'japan',
    name: 'Yaponiya',
    capital: 'Tokio',
    continent: 'Osiyo',
    areaKm2: '377 975 km²',
    populationM: '124.5 mln',
    language: 'Yapon tili',
    coordinates: '35.7° N, 139.7° E',
    shortNote:
      'Tinch okeanining g‘arbiy qismida joylashgan, 14 mingdan ortiq orollardan tashkil topgan "Kunchiqar mamlakat".',
    funFact:
      'Tokio metropoliyasi aholi soni bo‘yicha sayyoradagi eng yirik shahar hududi bo‘lib, u yerda 37 milliondan ortiq kishi yashaydi.',
  },
  {
    id: 'brazil',
    name: 'Braziliya',
    capital: 'Braziliya',
    continent: 'Amerika',
    areaKm2: '8 515 767 km²',
    populationM: '212.6 mln',
    language: 'Portugal tili',
    coordinates: '15.8° S, 47.9° W',
    shortNote:
      'Janubiy Amerikaning qariyb yarmini egallagan, Amazonka o‘rmonlari va daryosi bilan mashhur eng yirik davlat.',
    funFact:
      'Braziliya poytaxti — Braziliya shahri atigi 41 oyda noldan qurilgan va yuqoridan qaraganda samolyot shakliga o‘xshaydi.',
  },
  {
    id: 'egypt',
    name: 'Misr',
    capital: 'Qohira',
    continent: 'Afrika',
    areaKm2: '1 002 450 km²',
    populationM: '114.5 mln',
    language: 'Arab tili',
    coordinates: '30.0° N, 31.2° E',
    shortNote:
      'Afrika va Osiyo (Sinay yarimoroli) tutashgan hududda, dunyodagi eng uzun Nil daryosi bo‘yida joylashgan davlat.',
    funFact:
      'Misr aholisining 95 foizdan ortig‘i mamlakat hududining atigi 5 foizini tashkil etuvchi Nil vodiysi va deltasida yashaydi.',
  },
  {
    id: 'norway',
    name: 'Norvegiya',
    capital: 'Oslo',
    continent: 'Yevropa',
    areaKm2: '385 207 km²',
    populationM: '5.5 mln',
    language: 'Norveg tili',
    coordinates: '59.9° N, 10.7° E',
    shortNote:
      'Skandinaviya yarimorolining g‘arbiy qismida, muzliklar o‘yib hosil qilgan chuqur dengiz qo‘ltiqlari — fyordlar mamlakati.',
    funFact:
      'Yoz oylarida Norvegiyaning shimoliy hududlarida quyosh bir necha hafta davomida umuman botmaydi ("oq tunlar").',
  },
  {
    id: 'australia',
    name: 'Avstraliya',
    capital: 'Kanberra',
    continent: 'Okeaniya',
    areaKm2: '7 692 024 km²',
    populationM: '27.1 mln',
    language: 'Ingliz tili',
    coordinates: '35.3° S, 149.1° E',
    shortNote:
      'Butun bir qit’ani egallagan yagona davlat. Katta qismi quruq cho‘l va yarimcho‘llardan iborat.',
    funFact:
      'Ko‘pchilik Sidney yoki Melburnni poytaxt deb o‘ylaydi, aslida bu ikki shahar o‘rtasidagi bahsni hal qilish uchun Kanberra poytaxt etib tanlangan.',
  },
  {
    id: 'switzerland',
    name: 'Shveysariya',
    capital: 'Bern',
    continent: 'Yevropa',
    areaKm2: '41 285 km²',
    populationM: '8.9 mln',
    language: 'Nemis, fransuz, italyan',
    coordinates: '46.9° N, 7.4° E',
    shortNote:
      'Markaziy Yevropadagi Alp tog‘lari bag‘rida joylashgan, ko‘llari va neytral siyosati bilan tanilgan tog‘li mamlakat.',
    funFact:
      'Shveysariyada yuridik jihatdan rasmiy poytaxt belgilanmagan, ammo Bern "federal shahar" sifatida poytaxt vazifasini bajaradi.',
  },
  {
    id: 'canada',
    name: 'Kanada',
    capital: 'Ottava',
    continent: 'Amerika',
    areaKm2: '9 984 670 km²',
    populationM: '41.0 mln',
    language: 'Ingliz va fransuz',
    coordinates: '45.4° N, 75.7° W',
    shortNote:
      'Maydoni bo‘yicha dunyoda ikkinchi o‘rinda turuvchi, minglab ko‘llar va cheksiz tayga o‘rmonlariga boy shimoliy davlat.',
    funFact:
      'Dunyodagi barcha tabiiy ko‘llarning qariyb 60 foizi Kanadada joylashgan va mamlakat qirg‘oq chizig‘i sayyoradagi eng uzunidir.',
  },
  {
    id: 'india',
    name: 'Hindiston',
    capital: 'Nyu-Dehli',
    continent: 'Osiyo',
    areaKm2: '3 287 263 km²',
    populationM: '1.44 mlrd',
    language: 'Hind va ingliz',
    coordinates: '28.6° N, 77.2° E',
    shortNote:
      'Shimolda baland Himolay tog‘lari, janubda esa Hind okeani bilan o‘ralgan aholisi eng ko‘p mamlakat.',
    funFact:
      'Hindistonning Meghalaya shtatidagi Mawsynram qishlog‘i Yer yuzidagi eng ko‘p yomg‘ir yog‘adigan joy hisoblanadi.',
  },
  {
    id: 'peru',
    name: 'Peru',
    capital: 'Lima',
    continent: 'Amerika',
    areaKm2: '1 285 216 km²',
    populationM: '34.4 mln',
    language: 'Ispan tili',
    coordinates: '12.0° S, 77.0° W',
    shortNote:
      'Tinch okeani sohilidagi cho‘ldan tortib baland And tog‘lari va Amazonka changalzorlarigacha uchta tabiat zonasini birlashtirgan yurt.',
    funFact:
      'Peru va Boliviya chegarasidagi Titikaka ko‘li dengiz sathidan 3 812 m balandlikda joylashgan eng yirik kema qatnaydigan ko‘ldir.',
  },
  {
    id: 'kenya',
    name: 'Keniya',
    capital: 'Nayrobi',
    continent: 'Afrika',
    areaKm2: '580 367 km²',
    populationM: '55.1 mln',
    language: 'Suaxili va ingliz',
    coordinates: '1.3° S, 36.8° E',
    shortNote:
      'Ekvator chizig‘i kesib o‘tadigan Sharqiy Afrika davlati, bepoyon savannalari va Buyuk Rift vodiysi bilan mashhur.',
    funFact:
      'Nayrobi — chegarasi ichida haqiqiy yovvoyi tabiat milliy bog‘i (sherlar va jirafalar bilan) joylashgan kamyob poytaxt shahardir.',
  },
  {
    id: 'iceland',
    name: 'Islandiya',
    capital: 'Reykyavik',
    continent: 'Yevropa',
    areaKm2: '103 000 km²',
    populationM: '0.39 mln',
    language: 'Island tili',
    coordinates: '64.1° N, 21.9° W',
    shortNote:
      'Shimoliy Atlantika okeanida joylashgan, muzliklar va faol vulqonlar yonma-yon yashaydigan "Muz va Olov" oroli.',
    funFact:
      'Reykyavik dunyodagi eng shimolda joylashgan mustaqil davlat poytaxti bo‘lib, uylarning 90% dan ortig‘i geotermal issiqlik bilan isitiladi.',
  },
];

export const OCEANS: OceanItem[] = [
  {
    id: 'pacific',
    name: 'Tinch okeani',
    areaMillionKm2: 165.2,
    sharePercent: 46,
    avgDepthM: 4280,
    maxDepthM: 10984,
    deepestPoint: 'Mariana botig‘i (Challenger tubi)',
    tempRange: '-1.4°C dan +30°C gacha',
    teacherSummary:
      'Sayyoramizdagi eng ulkan va eng chuqur okean. Uning maydoni Yer yuzasidagi barcha qit’alarning umumiy maydonidan ham kattaroqdir.',
    funFact:
      'Tinch okeani atrofida dunyodagi faol vulqonlarning 75 foizi joylashgan "Olovli halqa" mintaqasi o‘tadi.',
  },
  {
    id: 'atlantic',
    name: 'Atlantika okeani',
    areaMillionKm2: 106.5,
    sharePercent: 29,
    avgDepthM: 3646,
    maxDepthM: 8376,
    deepestPoint: 'Puerto-Riko botig‘i',
    tempRange: '-2°C dan +29°C gacha',
    teacherSummary:
      'Yevropa va Afrikani Amerika qit’alaridan ajratib turuvchi, shakli "S" harfiga o‘xshash okean. Dengiz savdosining eng gavjum yo‘li.',
    funFact:
      'Atlantika okeani har yili tektonik plitalar siljishi tufayli taxminan 2–3 santimetrga kengayib bormoqda.',
  },
  {
    id: 'indian',
    name: 'Hind okeani',
    areaMillionKm2: 70.6,
    sharePercent: 20,
    avgDepthM: 3741,
    maxDepthM: 7290,
    deepestPoint: 'Zond (Yava) botig‘i',
    tempRange: '+10°C dan +32°C gacha',
    teacherSummary:
      'Asosan Janubiy yarimsharda joylashgan eng iliq okean. Musson shamollari uning iqlimi va yog‘ingarchilik tartibini belgilaydi.',
    funFact:
      'Suvi iliq bo‘lgani uchun Hind okeanida planktonlar nisbatan kamroq o‘sadi, ammo u neft va gaz tashishning asosiy arteriyasidir.',
  },
  {
    id: 'southern',
    name: 'Janubiy okean',
    areaMillionKm2: 20.3,
    sharePercent: 6,
    avgDepthM: 3270,
    maxDepthM: 7434,
    deepestPoint: 'Janubiy Sandvich botig‘i',
    tempRange: '-2°C dan +10°C gacha',
    teacherSummary:
      'Antarktida qit’asini 60° janubiy kenglikdan boshlab o‘rab turgan yosh va sovuq okean. 2000-yilda rasman beshinchi okean deb tan olingan.',
    funFact:
      'Bu yerda g‘arbdan sharqqa qarab oquvchi Antarktika aylanma oqimi boshqa okeanlar suvini aralashtirib, Yer iqlimini muvozanatlaydi.',
  },
  {
    id: 'arctic',
    name: 'Shimoliy Muz okeani',
    areaMillionKm2: 14.1,
    sharePercent: 4,
    avgDepthM: 1205,
    maxDepthM: 5550,
    deepestPoint: 'Molloy chuqurligi',
    tempRange: '-1.8°C dan +4°C gacha',
    teacherSummary:
      'Okeanlar orasida eng kichigi va eng sayozi. Shimoliy qutb atrofida joylashgan bo‘lib, yilning katta qismida muz qatlami bilan qoplanadi.',
    funFact:
      'Qishda muz qatlami qalinligi 3 metrgacha yetadi va oq ayiqlar uchun qit’alararo ko‘prik vazifasini o‘taydi.',
  },
];

export const OCEAN_ZONES: OceanZone[] = [
  {
    id: 'epipelagic',
    name: 'Quyoshli qatlam (Epipelagik)',
    depthRange: '0 – 200 m',
    sunlight: 'To‘liq yorug‘lik',
    pressureAtm: '1 – 20 atm',
    temperature: '+15°C ... +30°C',
    lifeSummary:
      'Fotosintez sodir bo‘ladigan yagona qatlam. Marjon riflari, fitoplanktonlar, delfinlar va baliqlarning 90 foizi shu yerda yashaydi.',
  },
  {
    id: 'mesopelagic',
    name: 'Shafaq qatlami (Mezopelagik)',
    depthRange: '200 – 1 000 m',
    sunlight: 'Xira nur (fotosintez yo‘q)',
    pressureAtm: '20 – 100 atm',
    temperature: '+4°C ... +15°C',
    lifeSummary:
      'Yorug‘lik juda kam yetib boradi. Bu qatlamdagi ko‘plab jonzotlar (fonarli baliqlar, meduzalar) o‘z tanasidan nur chiqaradi (biolyuminestsensiya).',
  },
  {
    id: 'bathypelagic',
    name: 'Tun qatlami (Batipelagik)',
    depthRange: '1 000 – 4 000 m',
    sunlight: 'Mutlaq zulmat',
    pressureAtm: '100 – 400 atm',
    temperature: '+2°C ... +4°C',
    lifeSummary:
      'Quyosh nuri umuman tushmaydi, suv harorati deyarli muzlash nuqtasiga yaqin. Ulkan kalmarlar va qarmoqchi baliqlar shu bosimga moslashgan.',
  },
  {
    id: 'abyssal',
    name: 'Abissal tekislik',
    depthRange: '4 000 – 6 000 m',
    sunlight: 'Zulmat',
    pressureAtm: '400 – 600 atm',
    temperature: '+1°C ... +3°C',
    lifeSummary:
      'Okean tubining asosiy tekis qismi. Ozuqa yuqoridan tushuvchi organik qoldiqlardan iborat; dengiz bodringlari va qisqichbaqasimonlar yashaydi.',
  },
  {
    id: 'hadal',
    name: 'Xadal zonasi (Botiqlar)',
    depthRange: '6 000 – 10 984 m',
    sunlight: 'Zulmat',
    pressureAtm: '600 – 1 100 atm',
    temperature: '+1°C ... +2.5°C',
    lifeSummary:
      'Mariana kabi chuqur tektonik botiqlar tubi. Bosim shu qadar ulkanki, oddiy suvosti kemalarini ezib tashlaydi; faqat maxsus bakteriyalar va mayda qisqichbaqalar yashaydi.',
  },
];

export const MOUNTAINS: MountainItem[] = [
  {
    id: 'everest',
    name: 'Everest (Jomolungma)',
    range: 'Himolay tizmasi',
    continent: 'Osiyo',
    countries: 'Nepal · Xitoy',
    elevationM: 8849,
    originType: 'Burmali',
    teacherSummary:
      'Hindiston va Yevrosiyo tektonik plitalarining to‘qnashuvi natijasida ko‘tarilgan sayyoramizning eng baland cho‘qqisi.',
    funFact:
      'Tektonik plitalar harakati davom etayotgani sababli Everest har yili taxminan 4 millimetrga balandlashib bormoqda.',
  },
  {
    id: 'k2',
    name: 'K2 (Chogori)',
    range: 'Qoraqurum',
    continent: 'Osiyo',
    countries: 'Pokiston · Xitoy',
    elevationM: 8611,
    originType: 'Burmali',
    teacherSummary:
      'Balandligi bo‘yicha dunyoda ikkinchi o‘rinda turadi, lekin tik qoyalari va keskin ob-havosi tufayli alpinistlar uchun eng murakkab cho‘qqi sanaladi.',
    funFact:
      'K2 nomi 1856-yilda britaniyalik topograflar tomonidan Qoraqurum tizmasining ikkinchi o‘lchangan cho‘qqisi sifatida qo‘yilgan.',
  },
  {
    id: 'ismail-somoni',
    name: 'G‘alaba cho‘qqisi',
    range: 'Tyan-Shan',
    continent: 'Markaziy Osiyo',
    countries: 'Qirg‘iziston · Xitoy',
    elevationM: 7439,
    originType: 'Burmali',
    teacherSummary:
      'Tyan-Shan tog‘ tizmasining eng baland nuqtasi. Markaziy Osiyo daryolarini to‘yintiruvchi ulkan muzliklar manbai.',
    funFact:
      'O‘zbekistonning eng baland cho‘qqisi esa Hisor tizmasidagi Hazrati Sulton (Alpomish) cho‘qqisi bo‘lib, balandligi 4 643 metrni tashkil etadi.',
  },
  {
    id: 'aconcagua',
    name: 'Akonkagua',
    range: 'And tog‘lari',
    continent: 'Janubiy Amerika',
    countries: 'Argentina',
    elevationM: 6961,
    originType: 'Burmali',
    teacherSummary:
      'G‘arbiy va Janubiy yarimsharlarning eng baland cho‘qqisi. And tog‘lari dunyodagi eng uzun quruqlikdagi tog‘ tizmasidir (7 000 km).',
    funFact:
      'Akonkagua Osiyodan tashqarida joylashgan barcha tog‘ cho‘qqilari orasida eng balandidir.',
  },
  {
    id: 'denali',
    name: 'Denali',
    range: 'Alyaska tizmasi',
    continent: 'Shimoliy Amerika',
    countries: 'AQSH',
    elevationM: 6190,
    originType: 'Qalqonsimon',
    teacherSummary:
      'Shimoliy Amerikaning eng yuqori nuqtasi. Qutb doirasiga yaqin joylashgani uchun qor qoplami juda past balandlikdan boshlanadi.',
    funFact:
      'Asosidan cho‘qqisigacha bo‘lgan vertikal ko‘tarilish (5 500 m) bo‘yicha Denali hatto Everestning quruqlikdagi qiyosiy balandligidan ham tik ko‘rinadi.',
  },
  {
    id: 'kilimanjaro',
    name: 'Kilimanjaro',
    range: 'Sharqiy Afrika yorig‘i',
    continent: 'Afrika',
    countries: 'Tanzaniya',
    elevationM: 5895,
    originType: 'Vulkanik',
    teacherSummary:
      'Tizmaga birlashmagan holda yakka ko‘tarilgan dunyodagi eng baland so‘ngan vulqon va Afrikaning eng yuqori cho‘qqisi.',
    funFact:
      'Ekvatorga yaqin issiq tropikda joylashganiga qaramay, uning 5 895 metrlik cho‘qqisida abadiy muzliklar saqlanib qolgan.',
  },
  {
    id: 'elbrus',
    name: 'Elbrus',
    range: 'Kavkaz tog‘lari',
    continent: 'Yevropa',
    countries: 'Rossiya',
    elevationM: 5642,
    originType: 'Vulkanik',
    teacherSummary:
      'Ikki cho‘qqili qadimiy so‘ngan stratovulqon bo‘lib, geografik jihatdan Yevropaning eng baland nuqtasi hisoblanadi.',
    funFact:
      'Elbrus yonbag‘irlarida 22 ta yirik muzlik mavjud va ular Kuban hamda Terek daryolarini suv bilan ta’minlaydi.',
  },
  {
    id: 'mont-blanc',
    name: 'Monblan',
    range: 'Alp tog‘lari',
    continent: 'Yevropa',
    countries: 'Fransiya · Italiya',
    elevationM: 4808,
    originType: 'Burmali',
    teacherSummary:
      'G‘arbiy Yevropaning eng baland cho‘qqisi. "Oq tog‘" ma’nosini anglatadi va zamonaviy alpinizm vatani sanaladi.',
    funFact:
      'Tog‘ ostidan Fransiya va Italiyani bog‘lovchi 11.6 kilometrlik mashhur Monblan avtomobil tunneli o‘tgan.',
  },
];

export const NATURE_WONDERS: NatureWonder[] = [
  {
    id: 'amazon',
    name: 'Amazonka tropik o‘rmonlari',
    biome: 'Nam ekvatorial o‘rmon',
    region: 'Janubiy Amerika (9 ta davlat)',
    climateType: 'Doimiy issiq va seryog‘in ekvatorial',
    keyMetricLabel: 'Maydoni',
    keyMetricValue: '5.5 mln km²',
    teacherSummary:
      'Sayyoramizdagi barcha tropik o‘rmonlarning yarmidan ko‘pini tashkil etadi. Bu yerda o‘simlik va hayvonot turlari shu qadar ko‘pki, har gektarda yuzlab daraxt turlari uchraydi.',
    funFact:
      'Amazonka daryosi dunyodagi barcha daryolar okeanga quyadigan chuchuk suvning taxminan 20 foizini beradi.',
  },
  {
    id: 'sahara',
    name: 'Sahroi Kabir cho‘li',
    biome: 'Tropik cho‘l',
    region: 'Shimoliy Afrika (11 ta davlat)',
    climateType: 'Quruq keskin kontinental cho‘l',
    keyMetricLabel: 'Maydoni',
    keyMetricValue: '9.2 mln km²',
    teacherSummary:
      'Dunyodagi eng katta issiq cho‘l. Odamlar uni faqat qumli barxanlardan iborat deb o‘ylaydi, ammo hududining 70 foizi toshloq plato va shag‘alli tekisliklardan tashkil topgan.',
    funFact:
      'Sahroi Kabir qumlari shamol yordamida Atlantika okeani ustidan uchib o‘tib, Amazonka o‘rmonlari tuprog‘ini minerallar bilan oziqlantiradi.',
  },
  {
    id: 'baikal',
    name: 'Baykal ko‘li',
    biome: 'Chuchuk suv ekotizimi',
    region: 'Sharqiy Sibir, Osiyo',
    climateType: 'Mo‘tadil kontinental',
    keyMetricLabel: 'Eng chuqur joyi',
    keyMetricValue: '1 642 m',
    teacherSummary:
      'Yer yuzidagi eng chuqur va eng qadimiy tektonik ko‘l (yoshi 25 mln yildan ortiq). Sayyoradagi suyuq holatdagi chuchuk suv zaxirasining 20 foizi shu yerda jamlangan.',
    funFact:
      'Baykal suvi shu qadar shaffofki, quyoshli kunda 40 metr chuqurlikdagi toshlarni bemalol ko‘rish mumkin.',
  },
  {
    id: 'barrier-reef',
    name: 'Buyuk To‘siq rifi',
    biome: 'Dengiz marjon ekotizimi',
    region: 'Avstraliya shimoli-sharqi',
    climateType: 'Tropik dengiz iqlimi',
    keyMetricLabel: 'Uzunligi',
    keyMetricValue: '2 300 km',
    teacherSummary:
      'Tirik organizmlar — milliardlab mayda marjon poliplari tomonidan barpo etilgan Yer yuzidagi eng yirik biologik tuzilma.',
    funFact:
      'Buyuk To‘siq rifi koinotdan ham yaqqol ko‘rinadigan yagona tirik tabiat obidasidir.',
  },
  {
    id: 'serengeti',
    name: 'Serengeti savannasi',
    biome: 'Tropik savanna',
    region: 'Tanzaniya va Keniya',
    climateType: 'Subekvatorial (quruq va nam mavsum)',
    keyMetricLabel: 'Migratsiya masofasi',
    keyMetricValue: '1 000+ km',
    teacherSummary:
      'Baland o‘tloqlar va yakka-yakka o‘sgan akatsiya daraxtlaridan iborat savanna mintaqasi. Yomg‘ir mavsumiga qarab hayvonlar doimiy ko‘chib yuradi.',
    funFact:
      'Har yili 1.5 milliondan ortiq gnu antilopasi va zebralar suv hamda o‘t izlab "Buyuk migratsiya" safariga chiqadi.',
  },
  {
    id: 'antarctica',
    name: 'Antarktida muz qalqoni',
    biome: 'Qutbiy muz sahrosi',
    region: 'Janubiy qutb',
    climateType: 'Qattiq arktik/antarktik sovuq',
    keyMetricLabel: 'Muz qalinligi',
    keyMetricValue: '4 776 m gacha',
    teacherSummary:
      'Hech bir davlatga tegishli bo‘lmagan, faqat ilmiy tadqiqotlar uchun ajratilgan muz qit’asi. Yer yuzidagi chuchuk suvning qariyb 70 foizi shu muzliklarda saqlanadi.',
    funFact:
      'Antarktida rasman cho‘l hisoblanadi, chunki uning markaziy hududlariga yiliga o‘rtacha atigi 50 mm yog‘in (qor) tushadi.',
  },
];

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    topic: 'Davlatlar',
    question: 'Avstraliya davlatining rasmiy poytaxti qaysi shahar?',
    options: ['Sidney', 'Melburn', 'Kanberra', 'Pert'],
    correctIndex: 2,
    explanation:
      'Sidney va Melburn o‘rtasidagi raqobatni hal qilish maqsadida ikki shahar oralig‘ida joylashgan Kanberra poytaxt sifatida qurilgan.',
  },
  {
    id: 'q2',
    topic: 'Okeanlar',
    question: 'Yer yuzidagi eng chuqur nuqta — Mariana botig‘i qaysi okeanda joylashgan?',
    options: [
      'Atlantika okeani',
      'Tinch okeani',
      'Hind okeani',
      'Shimoliy Muz okeani',
    ],
    correctIndex: 1,
    explanation:
      'Mariana botig‘i (10 984 metr) Tinch okeanining g‘arbiy qismida joylashgan bo‘lib, uning tubiga Everest tog‘i ham bemalol sig‘ib ketadi.',
  },
  {
    id: 'q3',
    topic: 'Tog‘lar',
    question: 'Afrikaning eng baland cho‘qqisi — Kilimanjaro qaysi turdagi tog‘ hisoblanadi?',
    options: [
      'Burmali tog‘ tizmasi',
      'So‘ngan yakka vulqon',
      'Qalqonsimon plato',
      'Dengiz osti tizmasi',
    ],
    correctIndex: 1,
    explanation:
      'Kilimanjaro (5 895 m) tizmaga birlashmagan holda yakka ko‘tarilgan ulkan so‘ngan vulqondir.',
  },
  {
    id: 'q4',
    topic: 'Tabiat',
    question: 'Dunyodagi suyuq holatdagi chuchuk suv zaxirasining 20 foizi qaysi ko‘lda jamlangan?',
    options: ['Viktoriya ko‘li', 'Titikaka ko‘li', 'Baykal ko‘li', 'Orol dengizi'],
    correctIndex: 2,
    explanation:
      'Sharqiy Sibirdagi Baykal ko‘li (1 642 m chuqurlik) sayyoramizdagi eng chuqur va eng ko‘p chuchuk suv saqlovchi ko‘ldir.',
  },
  {
    id: 'q5',
    topic: 'Davlatlar',
    question: 'Qaysi davlat ikki marta dengizga chiqish yo‘li bo‘lmagan (double-landlocked) kamyob mamlakatlardan biridir?',
    options: ['Turkiya', 'O‘zbekiston', 'Norvegiya', 'Misr'],
    correctIndex: 1,
    explanation:
      'O‘zbekiston va Lixtenshteyn — okeanga chiqish uchun kamida ikkita davlat chegarasidan o‘tish kerak bo‘lgan dunyodagi yagona ikki davlatdir.',
  },
  {
    id: 'q6',
    topic: 'Okeanlar',
    question: 'Qaysi okean har yili tektonik plitalar siljishi hisobiga 2–3 santimetrga kengayib bormoqda?',
    options: ['Atlantika okeani', 'Tinch okeani', 'Hind okeani', 'Janubiy okean'],
    correctIndex: 0,
    explanation:
      'O‘rta Atlantika tizmasida yangi okean tubi hosil bo‘layotgani sababli Atlantika okeani sekin-asta kengaymoqda, Tinch okeani esa aksincha qisqarmoqda.',
  },
  {
    id: 'q7',
    topic: 'Tog‘lar',
    question: 'O‘zbekiston hududidagi eng baland cho‘qqi qaysi va uning balandligi qancha?',
    options: [
      'G‘alaba cho‘qqisi (7 439 m)',
      'Hazrati Sulton cho‘qqisi (4 643 m)',
      'Chimyon cho‘qqisi (3 309 m)',
      'Elbrus cho‘qqisi (5 642 m)',
    ],
    correctIndex: 1,
    explanation:
      'Hisor tog‘ tizmasida joylashgan Hazrati Sulton (Alpomish) cho‘qqisi 4 643 metr balandlikka ega.',
  },
  {
    id: 'q8',
    topic: 'Tabiat',
    question: 'Nima uchun Antarktida rasman cho‘l deb tasniflanadi?',
    options: [
      'Chunki u yerda qum bor',
      'Chunki markaziy qismiga yiliga juda kam yog‘in tushadi',
      'Chunki u yerda quyosh botmaydi',
      'Chunki u okean bilan o‘ralgan',
    ],
    correctIndex: 1,
    explanation:
      'Geografiyada cho‘l tushunchasi issiqlik bilan emas, yog‘in miqdori bilan o‘lchanadi. Antarktida markaziga yiliga atigi 50 mm atrofida qor yog‘adi.',
  },
];
