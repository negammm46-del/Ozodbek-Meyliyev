export interface DependentTerritory {
  id: string;
  iso2: string;
  nameUz: string;
  nameEn: string;
  administeringStateUz: string;
  politicalStatusUz: string;
  regionUz: string;
  adminCenterUz: string;
  populationUz: string;
  areaKm2: number;
  lat: number;
  lng: number;
  whyNotIndependentUz: string;
  uniqueGeoTraitsUz: string;
  geoFacts: string[];
  surprisingFacts: string[];
  lastUpdated: string;
  sources: string[];
}

export const DEPENDENT_TERRITORIES: DependentTerritory[] = [
  {
    id: 'greenland',
    iso2: 'GL',
    nameUz: 'Grenlandiya',
    nameEn: 'Greenland',
    administeringStateUz: 'Daniya Qirolligi',
    politicalStatusUz: 'Keng avtonomiyaga ega o‘zini o‘zi boshqaruvchi hudud',
    regionUz: 'Shimoliy Atlantika / Arktika (geografik jihatdan Shimoliy Amerika)',
    adminCenterUz: 'Nuuk',
    populationUz: '56 800 kishi',
    areaKm2: 2166086,
    lat: 71.7,
    lng: -42.6,
    whyNotIndependentUz:
      '1979-yilda o‘zini o‘zi boshqarish va 2009-yilda kengaytirilgan avtonomiya maqomini olgan bo‘lsa-da, tashqi siyosat, mudofaa va pul tizimi hamon Daniya Qirolligi tarkibida qolmoqda; iqtisodiyoti ham Daniyadan keladigan yillik subsidiyalarga bog‘liq.',
    uniqueGeoTraitsUz:
      'Hududining qariyb 80 foizi qalinligi 3 km gacha yetadigan qit’a muz qalqoni bilan qoplangan. Dunyodagi eng katta orol bo‘lishiga qaramay, aholi zichligi bo‘yicha eng siyrak hududdir.',
    geoFacts: [
      'Dunyodagi eng katta orol (Avstraliya materik hisoblanadi).',
      'Shimoliy qutbdan atigi ~700 km uzoqlikda joylashgan Kaffeklubben oroli Yerning eng shimoliy quruqlik nuqtasidir.',
      'Qirg‘oqlari chuqur fyordlar va muzlik vodiylari bilan kesilgan.',
      'Aholining deyarli barchasi g‘arbiy va janubi-g‘arbiy muzsiz sohillarda yashaydi.',
      'Shaharlarni bog‘lovchi yagona avtomobil yo‘llari tarmog‘i yo‘q — transport samolyot va kemalarda amalga oshiriladi.',
    ],
    surprisingFacts: [
      'Grenlandiya muzlari to‘liq erisa, dunyo okeani sathi taxminan 7.4 metrga ko‘tarilar edi.',
      '“Grenlandiya” nomi “Yashil yurt” degan ma’noni anglatadi, bu nom X asrda ko‘chmanchilarni jalb qilish uchun qo‘yilgan.',
      'Bu yerda dunyodagi eng yirik milliy bog‘ — Shimoli-Sharqiy Grenlandiya milliy bog‘i joylashgan (maydoni ko‘pgina davlatlardan katta).',
    ],
    lastUpdated: '2026-11',
    sources: ['Statistics Greenland', 'UN Statistics Division'],
  },
  {
    id: 'puerto-rico',
    iso2: 'PR',
    nameUz: 'Puerto-Riko',
    nameEn: 'Puerto Rico',
    administeringStateUz: 'Amerika Qo‘shma Shtatlari',
    politicalStatusUz: 'AQSHning inkorporatsiya qilinmagan uyushgan hududi (Hamdo‘stlik)',
    regionUz: 'Karib dengizi (Katta Antil orollari)',
    adminCenterUz: 'San-Xuan',
    populationUz: '3.2 mln kishi',
    areaKm2: 9104,
    lat: 18.2,
    lng: -66.6,
    whyNotIndependentUz:
      '1898-yildan beri AQSH yurisdiksiyasi ostida. Aholisi AQSH fuqaroligiga ega, biroq prezidentlik saylovlarida ovoz bermaydi va Kongressda ovoz berish huquqiga ega senatorlari yo‘q; siyosiy maqom bo‘yicha (shtatlik, mustaqillik yoki mavjud holat) referendumlar davom etib kelmoqda.',
    uniqueGeoTraitsUz:
      'Karst g‘orlari, El-Yunke tropik yomg‘ir o‘rmoni va dunyoda sanoqli bo‘lgan biolyuminessent (tunda yorug‘lik taratuvchi) ko‘rfazlarga ega.',
    geoFacts: [
      'Atlantika okeani va Karib dengizi tutashgan strategik nuqtada joylashgan.',
      'El-Yunke — AQSH o‘rmon tizimidagi yagona tropik yomg‘ir o‘rmonidir.',
      'Shimolidagi Puerto-Riko chuqurligi (8 376 m) Atlantika okeanining eng chuqur joyidir.',
      'Asosiy til ispan va ingliz tillaridir.',
    ],
    surprisingFacts: [
      'Viyekes orolidagi Mosquito Bay ko‘rfazi suvda yashovchi mikroorganizmlar tufayli tunda ko‘k rangda charaqlaydi.',
      'San-Xuan shahri G‘arbiy yarimshardagi eng qadimiy uzluksiz yashab kelinayotgan shaharlardan biridir.',
      'Olimpiya o‘yinlarida Puerto-Riko mustaqil terma jamoa sifatida qatnashadi.',
    ],
    lastUpdated: '2026-11',
    sources: ['US Census Bureau', 'UN Data'],
  },
  {
    id: 'hong-kong',
    iso2: 'HK',
    nameUz: 'Gonkong',
    nameEn: 'Hong Kong',
    administeringStateUz: 'Xitoy Xalq Respublikasi',
    politicalStatusUz: 'Maxsus ma’muriy hudud (SAR — “Bir davlat, ikki tizim”)',
    regionUz: 'Sharqiy Osiyo (Janubiy Xitoy dengizi sohili)',
    adminCenterUz: 'Viktoriya / Gonkong',
    populationUz: '7.5 mln kishi',
    areaKm2: 1114,
    lat: 22.3,
    lng: 114.2,
    whyNotIndependentUz:
      '1997-yil 1-iyulda Buyuk Britaniyadan Xitoy suverenitetiga qaytarilgan. Asosiy qonunga ko‘ra mudofaa va tashqi ishlar Pekin vakolatida, ichki iqtisodiy, huquqiy va valyuta tizimi esa maxsus avtonomiya asosida ishlaydi.',
    uniqueGeoTraitsUz:
      'Koulun yarimoroli va 260 dan ortiq oroldan iborat bo‘lib, relyefining keskin tog‘liligi sababli aholi juda zich yashaydi; hududining ~40% qismi esa yashil tabiat qo‘riqxonalaridir.',
    geoFacts: [
      'Chjutszyan (Marvarid) daryosi deltasining sharqiy qismida joylashgan tabiiy chuqur bandargoh.',
      'Dunyodagi eng zich osmono‘par binolar siluetiga ega megapolis.',
      'O‘z valyutasi — Gonkong dollari (HKD) va alohida bojxona hududiga ega.',
      'Subtropik mussonli iqlimga ega, yoz oylarida tayfunlar tez-tez kuzatiladi.',
    ],
    surprisingFacts: [
      'Gonkong dunyodagi eng baland turar-joy va tijorat binolari soni bo‘yicha birinchi o‘rinda turadi.',
      'Shahar markazidan 20 daqiqa narida yovvoyi tog‘ so‘qmoqlari va sokin plyajlar boshlanadi.',
      'Ko‘plab xalqaro sport musobaqalarida “Hong Kong, China” nomi bilan alohida qatnashadi.',
    ],
    lastUpdated: '2026-11',
    sources: ['Census and Statistics Dept HK', 'World Bank'],
  },
  {
    id: 'macau',
    iso2: 'MO',
    nameUz: 'Makao',
    nameEn: 'Macau',
    administeringStateUz: 'Xitoy Xalq Respublikasi',
    politicalStatusUz: 'Maxsus ma’muriy hudud (SAR)',
    regionUz: 'Sharqiy Osiyo (Marvarid daryosi deltasi)',
    adminCenterUz: 'Makao',
    populationUz: '686 ming kishi',
    areaKm2: 33,
    lat: 22.2,
    lng: 113.5,
    whyNotIndependentUz:
      '1999-yil 20-dekabrda Portugaliyadan Xitoy tarkibiga maxsus ma’muriy hudud sifatida o‘tgan. Tashqi siyosat va mudofaa Xitoy hukumatiga tegishli, ichki boshqaruv va pataka valyutasi esa avtonomdir.',
    uniqueGeoTraitsUz:
      'Atigi 33 km² maydoni bilan dunyodagi aholi eng zich joylashgan hududdir; hududning katta qismi dengizdan yer o‘zlashtirish (melioratsiya) hisobiga kengaytirilgan.',
    geoFacts: [
      'Gonkongdan g‘arbda, Chjutszyan daryosi quyilishida joylashgan.',
      'Gonkong–Chjuxay–Makao ko‘prigi orqali materik va Gonkong bilan bog‘langan.',
      'Xitoy va portugal tillari rasmiy maqomga ega.',
    ],
    surprisingFacts: [
      'Aholi zichligi 1 km² ga 20 000 kishidan oshadi — dunyodagi eng yuqori ko‘rsatkich.',
      'Makao tarixiy markazi YUNESKO Jahon merosi ro‘yxatiga kiritilgan.',
      'Dastlabki maydoni XX asr boshlariga nisbatan dengiz hisobiga qariyb 3 barobar kattalashgan.',
    ],
    lastUpdated: '2026-11',
    sources: ['DSEC Macau', 'World Bank'],
  },
  {
    id: 'french-polynesia',
    iso2: 'PF',
    nameUz: 'Fransuz Polineziyasi',
    nameEn: 'French Polynesia',
    administeringStateUz: 'Fransiya Respublikasi',
    politicalStatusUz: 'Fransiyaning dengizorti hamjamiyati (Overseas Collectivity)',
    regionUz: 'Okeaniya (Markaziy Tinch okeani)',
    adminCenterUz: 'Papeete (Taiti oroli)',
    populationUz: '280 ming kishi',
    areaKm2: 4167,
    lat: -17.6,
    lng: -149.4,
    whyNotIndependentUz:
      'Fransiya tarkibidagi avtonom dengizorti hudud bo‘lib, o‘z parlamenti va hukumatiga ega bo‘lsa-da, mudofaa, adliya va tashqi vakolatlar Fransiya davlati zimmasida qoladi.',
    uniqueGeoTraitsUz:
      '118 ta vulqon va marjon atoll orolidan iborat 5 ta arxipelag (Taiti, Bora-Bora, Markiz va b.) G‘arbiy Yevropa maydoniga teng okean akvatoriyasiga sochilib ketgan.',
    geoFacts: [
      'Mashhur Taiti va Bora-Bora orollari shu hududda joylashgan.',
      'Orohena tog‘i (2 241 m) eng baland nuqtasi hisoblanadi.',
      'Pul birligi — Tinch okeani franki (XPF).',
    ],
    surprisingFacts: [
      'Qora marvarid yetishtirish bo‘yicha dunyoda yetakchi o‘rinlardan birini egallaydi.',
      '2024-yilgi Olimpiadaning syorfing musobaqalari aynan Taiti sohilidagi Teahupoo to‘lqinlarida o‘tkazilgan.',
      'Orollar orasidagi masofa shu qadar kattaki, g‘arbdan sharqgacha 2 000 km dan oshadi.',
    ],
    lastUpdated: '2026-11',
    sources: ['ISPF', 'UN Statistics Division'],
  },
  {
    id: 'guam',
    iso2: 'GU',
    nameUz: 'Guam',
    nameEn: 'Guam',
    administeringStateUz: 'Amerika Qo‘shma Shtatlari',
    politicalStatusUz: 'AQSHning inkorporatsiya qilinmagan uyushgan hududi',
    regionUz: 'Okeaniya (Mikroneziya, Mariana orollari)',
    adminCenterUz: 'Xagatna',
    populationUz: '172 ming kishi',
    areaKm2: 544,
    lat: 13.4,
    lng: 144.8,
    whyNotIndependentUz:
      '1898-yildan beri AQSH boshqaruvi ostida. Mahalliy saylangan gubernator va parlament mavjud, biroq Tinch okeanidagi strategik ahamiyati va AQSH konstitutsiyaviy maqomi tufayli suveren davlat emas.',
    uniqueGeoTraitsUz:
      'Mariana arxipelagining eng katta va eng janubiy oroli; yonida Yer yuzasining eng chuqur nuqtasi — Mariana botig‘i (Challenger Deep) joylashgan.',
    geoFacts: [
      'Xalqaro sana chizig‘iga yaqin joylashgani uchun “Amerikaning kuni boshlanadigan joy” deb ataladi.',
      'Lamlam tog‘i dengiz sathidan 406 m baland, ammo Mariana botig‘i tubidan o‘lchanganda Everestdan balandroq hisoblanadi.',
      'Mahalliy tub aholisi — chamorro xalqi.',
    ],
    surprisingFacts: [
      'Guamdagi yo‘l qoplamalarining bir qismida marjon ohaktoshidan foydalaniladi.',
      'Mariana botig‘i Chuqur nuqtasi oroldan atigi ~340 km janubi-g‘arbda joylashgan.',
      'Guam aholisi AQSH fuqaroligiga ega, ammo prezidentlik saylovlarida ovoz bera olmaydi.',
    ],
    lastUpdated: '2026-11',
    sources: ['US Census Bureau', 'UN Decolonization Committee'],
  },
  {
    id: 'bermuda',
    iso2: 'BM',
    nameUz: 'Bermuda orollari',
    nameEn: 'Bermuda',
    administeringStateUz: 'Buyuk Britaniya',
    politicalStatusUz: 'Britaniya dengizorti hududi (British Overseas Territory)',
    regionUz: 'Shimoliy Atlantika okeani',
    adminCenterUz: 'Gamilton',
    populationUz: '64 ming kishi',
    areaKm2: 53.2,
    lat: 32.3,
    lng: -64.8,
    whyNotIndependentUz:
      'O‘zining saylangan parlamenti va ichki boshqaruviga ega bo‘lsa-da, mudofaa va tashqi munosabatlar Buyuk Britaniya tomonidan yuritiladi; 1995-yilgi referendumda saylovchilar mustaqillikni rad etgan.',
    uniqueGeoTraitsUz:
      'Shimoliy Atlantikadagi 181 ta kichik ohaktosh va marjon orollaridan iborat bo‘lib, Golfstrim iliq oqimi tufayli sub-tropik iqlim va pushti qumli sohillarga ega.',
    geoFacts: [
      'Eng yaqin materik qirg‘og‘i (AQSHning Shimoliy Karolinasi) dan 1 000 km dan uzoqda yolg‘iz joylashgan.',
      'Hududda tabiiy chuchuk suv daryolari yo‘q — ichimlik suvi tomlardan yomg‘ir suvini yig‘ish orqali olinadi.',
      'Jahondagi eng yirik qayta sug‘urta va moliya markazlaridan biri.',
    ],
    surprisingFacts: [
      'Bermuda uylari yomg‘ir suvini tozalab yig‘ish uchun oq pog‘onali ohaktosh tomlar bilan quriladi.',
      'Mashhur “Bermuda uchburchagi”ning shimoliy uchi aynan shu orollarga tutashadi.',
      'Dunyodagi aholi jon boshiga YIM ko‘rsatkichi eng yuqori hududlar qatoriga kiradi.',
    ],
    lastUpdated: '2026-11',
    sources: ['Bermuda Dept of Statistics', 'UN Data'],
  },
  {
    id: 'faroe-islands',
    iso2: 'FO',
    nameUz: 'Farer orollari',
    nameEn: 'Faroe Islands',
    administeringStateUz: 'Daniya Qirolligi',
    politicalStatusUz: 'Keng avtonomiyaga ega o‘zini o‘zi boshqaruvchi hudud',
    regionUz: 'Shimoliy Yevropa (Shimoliy Atlantika)',
    adminCenterUz: 'Torsxavn',
    populationUz: '54 ming kishi',
    areaKm2: 1393,
    lat: 61.9,
    lng: -6.9,
    whyNotIndependentUz:
      'Daniya Qirolligi tarkibiga kiruvchi avtonom hudud. O‘z parlamenti (Løgting), tili va alohida baliqchilik siyosatiga ega (Yevropa Ittifoqi a’zosi emas), ammo mudofaa va tashqi siyosatda Daniya bilan bog‘langan.',
    uniqueGeoTraitsUz:
      'Islandiya va Shotlandiya o‘rtasida joylashgan 18 ta tik qoyali bazalt vulqon orollaridan iborat; deyarli daraxtsiz yashil tepaliklar va dengiz osti tunnellari bilan mashhur.',
    geoFacts: [
      'Orollarda yilning qariyb 300 kuni yomg‘irli yoki tumanli bo‘ladi.',
      'Sørvágsvatn ko‘li okean ustidan baland qoya tepasida osilib turgandek optik illyuziya hosil qiladi.',
      'Orollarni bir-biri bilan dunyodagi yagona dengiz osti aylanma yo‘lli (roundabout) tunnel bog‘laydi.',
    ],
    surprisingFacts: [
      'Orolda odamlardan ko‘ra qo‘ylar soni ko‘proq (“Farer” nomi “Qo‘y orollari” ma’nosini beradi).',
      'UEFA va FIFA musobaqalarida alohida terma jamoa sifatida qatnashadi.',
      'Har qanday nuqtadan okeangacha bo‘lgan masofa 5 kilometrdan oshmaydi.',
    ],
    lastUpdated: '2026-11',
    sources: ['Hagstova Føroya', 'Nordic Statistics'],
  },
  {
    id: 'gibraltar',
    iso2: 'GI',
    nameUz: 'Gibraltar',
    nameEn: 'Gibraltar',
    administeringStateUz: 'Buyuk Britaniya',
    politicalStatusUz: 'Britaniya dengizorti hududi',
    regionUz: 'Janubiy Yevropa (Pireney yarimoroli janubiy uchi)',
    adminCenterUz: 'Gibraltar',
    populationUz: '34 ming kishi',
    areaKm2: 6.8,
    lat: 36.14,
    lng: -5.35,
    whyNotIndependentUz:
      '1713-yilgi Utrext shartnomasiga ko‘ra Buyuk Britaniyaga berilgan. Mahalliy o‘zini o‘zi boshqarish hukumati bor, biroq mudofaa va tashqi ishlar Buyuk Britaniya vakolatida.',
    uniqueGeoTraitsUz:
      'Atigi 6.8 km² maydonda mashhur 426 metrlik Gibraltar ohaktosh qoyasi qad rostlagan; Atlantika okeani va O‘rta yer dengizini bog‘lovchi 14 km kenglikdagi bo‘g‘ozni nazorat qiladi.',
    geoFacts: [
      'Quruqlikda Ispaniya bilan chegaradosh; Afrika qirg‘og‘igacha bo‘lgan dengiz masofasi atigi 14 km.',
      'Yevropada yovvoyi maymunlar (Barbari makakalari) erkin yashaydigan yagona hududdir.',
      'O‘rta yer dengizi va Atlantika suv almashinuvi tufayli kuchli dengiz oqimlari kuzatiladi.',
    ],
    surprisingFacts: [
      'Gibraltar aeroportining uchish-qo‘nish yo‘lagini avtomobil va piyoda yo‘llari (tunnel qurilishidan avval) kesib o‘tgan.',
      'Qoya ichida 50 km dan ortiq sun’iy va tabiiy g‘or tunnellari tizimi mavjud.',
      'Ochiq kunda qoyadan Marokashning Rif tog‘lari ko‘rinib turadi.',
    ],
    lastUpdated: '2026-11',
    sources: ['HM Government of Gibraltar', 'UN Statistics'],
  },
  {
    id: 'new-caledonia',
    iso2: 'NC',
    nameUz: 'Yangi Kaledoniya',
    nameEn: 'New Caledonia',
    administeringStateUz: 'Fransiya Respublikasi',
    politicalStatusUz: 'Fransiyaning maxsus maqomli hamjamiyati (Sui generis collectivity)',
    regionUz: 'Okeaniya (Melaneziya, Tinch okeani janubi-g‘arbi)',
    adminCenterUz: 'Numea',
    populationUz: '271 ming kishi',
    areaKm2: 18576,
    lat: -20.9,
    lng: 165.6,
    whyNotIndependentUz:
      '1998-yilgi Numea kelishuvi asosida keng avtonomiyaga ega. 2018, 2020 va 2021-yillarda o‘tkazilgan uchta referendumdan so‘ng ham amaldagi maqom bo‘yicha siyosiy muloqot davom etmoqda.',
    uniqueGeoTraitsUz:
      'Dunyodagi eng katta doimiy marjon lagunalaridan biri (YUNESKO merosi) va Gondvana qadimiy qit’asidan meros qolgan noyob endemik o‘simliklarga ega.',
    geoFacts: [
      'Avstraliyadan taxminan 1 210 km sharqda joylashgan.',
      'Dunyo nikel zaxiralarining katta qismi shu orolda joylashgan.',
      'Grande-Terre bosh oroli va Loyalty orollaridan tashkil topgan.',
    ],
    surprisingFacts: [
      'Oroldagi o‘simlik turlarining 75 foizdan ortig‘i Yerning boshqa hech bir joyida uchramaydi.',
      'Yangi Kaledoniya to‘siq rifi uzunligi bo‘yicha faqat Avstraliya Buyuk To‘siq rifidan keyin turadi.',
      'Kagu nomli ucholmaydigan noyob qush faqat shu orolda yashaydi.',
    ],
    lastUpdated: '2026-11',
    sources: ['ISEE New Caledonia', 'UNESCO'],
  },
  {
    id: 'aruba',
    iso2: 'AW',
    nameUz: 'Aruba',
    nameEn: 'Aruba',
    administeringStateUz: 'Niderlandiya Qirolligi',
    politicalStatusUz: 'Niderlandiya Qirolligi tarkibidagi avtonom ta’sischi mamlakat',
    regionUz: 'Karib dengizi janubi (Venesuela sohiliga yaqin)',
    adminCenterUz: 'Oranjestad',
    populationUz: '108 ming kishi',
    areaKm2: 180,
    lat: 12.5,
    lng: -70.0,
    whyNotIndependentUz:
      '1986-yildan beri Niderlandiya Qirolligi tarkibida alohida avtonom maqomga ega. Ichki siyosat va byudjet mustaqil, ammo mudofaa, tashqi ishlar va pasport tizimi Niderlandiya Qirolligi orqali amalga oshiriladi.',
    uniqueGeoTraitsUz:
      'Karib dengizining boshqa orollaridan farqli o‘laroq, qurg‘oqchil iqlimli bo‘lib, kaktuslar va shamol ta’sirida egilgan Divi-divi daraxtlari o‘sadi.',
    geoFacts: [
      'Bo‘ronlar (dovullar) yo‘lagidan janubda joylashgani uchun yil bo‘yi quyoshli ob-havo hukmron.',
      'Rasmiy tillari — niderland va papiamento tillari.',
      'Venesuela qirg‘oqlaridan atigi 29 km shimolda joylashgan.',
    ],
    surprisingFacts: [
      'Arubada 90 dan ortiq millat vakillari tinch-totuv yashaydi va aholi odatda 3–4 tilda bemalol gaplashadi.',
      'Dengiz suvini chuchuklashtirish orqali dunyodagi eng toza ichimlik suvlaridan birini ishlab chiqaradi.',
    ],
    lastUpdated: '2026-11',
    sources: ['CBS Aruba', 'UN Statistics'],
  },
  {
    id: 'falkland-islands',
    iso2: 'FK',
    nameUz: 'Folklend orollari',
    nameEn: 'Falkland Islands',
    administeringStateUz: 'Buyuk Britaniya (suvereniteti Argentina bilan bahsli)',
    politicalStatusUz: 'O‘zini o‘zi boshqaruvchi Britaniya dengizorti hududi',
    regionUz: 'Janubiy Atlantika okeani',
    adminCenterUz: 'Stenli',
    populationUz: '3 660 kishi',
    areaKm2: 12173,
    lat: -51.8,
    lng: -59.5,
    whyNotIndependentUz:
      'Buyuk Britaniya dengizorti hududi sifatida boshqariladi; 2013-yilgi mahalliy referendumda aholi hozirgi maqomni saqlab qolishga ovoz bergan. Shu bilan birga, Argentina orollarga tarixiy-geografik da’vo bildirib keladi.',
    uniqueGeoTraitsUz:
      '700 dan ortiq shamolli va daraxtsiz subantarktik orollardan iborat; pingvinlarning 5 ta turi ko‘payadigan muhim maskandir.',
    geoFacts: [
      'Sharqiy Folklend va G‘arbiy Folklend asosiy ikki yirik oroldir.',
      'Okeanli sovuq mo‘tadil iqlimga ega, kuchli g‘arbiy shamollar esib turadi.',
      'Asosiy iqtisodiyoti baliqchilik va qo‘ychilikka tayanadi.',
    ],
    surprisingFacts: [
      'Orolda odamlar sonidan ko‘ra pingvinlar soni yuz barobar ko‘p (~1 million atrofida).',
      'Orollarda “tosh daryolari” (stone runs) — muzlik davridan qolgan noyob geologik hodisa mavjud.',
    ],
    lastUpdated: '2026-11',
    sources: ['Falkland Islands Govt', 'UN Decolonization Info'],
  },
];

export interface RecordItem {
  rank: number;
  titleUz: string;
  value: string;
  locationUz: string;
  noteUz: string;
}

export interface GeographyRecordCategory {
  id: string;
  titleUz: string;
  subtitleUz: string;
  items: RecordItem[];
}

export const GEOGRAPHY_RECORDS: GeographyRecordCategory[] = [
  {
    id: 'largest-countries',
    titleUz: 'Eng katta davlatlar',
    subtitleUz: 'Umumiy yer va ichki suv maydoni (km²) bo‘yicha rekordchilar',
    items: [
      { rank: 1, titleUz: 'Rossiya', value: '17 098 246 km²', locationUz: 'Yevrosiyo', noteUz: 'Yer quruqligining qariyb 11 foizini egallaydi va 11 ta vaqt mintaqasiga cho‘zilgan.' },
      { rank: 2, titleUz: 'Kanada', value: '9 984 670 km²', locationUz: 'Shimoliy Amerika', noteUz: 'Dunyodagi eng uzun dengiz sohili (202 080 km) va ko‘llar soni bo‘yicha mutlaq yetakchi.' },
      { rank: 3, titleUz: 'Xitoy', value: '9 596 961 km²', locationUz: 'Osiyo', noteUz: '14 ta davlat bilan quruqlik chegarasiga ega bo‘lib, Himolaydan Tinch okeanigacha cho‘zilgan.' },
      { rank: 4, titleUz: 'AQSH', value: '9 833 520 km²', locationUz: 'Shimoliy Amerika', noteUz: 'Alyaska va Gavayi bilan birga barcha asosiy iqlim mintaqalarini o‘z ichiga oladi.' },
      { rank: 5, titleUz: 'Braziliya', value: '8 515 767 km²', locationUz: 'Janubiy Amerika', noteUz: 'Janubiy Amerikaning qariyb yarmini va Amazonka havzasining asosiy qismini egallaydi.' },
    ],
  },
  {
    id: 'smallest-countries',
    titleUz: 'Eng kichik davlatlar',
    subtitleUz: 'Hududi bo‘yicha Yer yuzidagi eng mitti mustaqil davlatlar',
    items: [
      { rank: 1, titleUz: 'Vatikan', value: '0.49 km²', locationUz: 'Yevropa (Rim ichida)', noteUz: 'Dunyodagi eng kichik mustaqil davlat — atigi 49 gektar maydon.' },
      { rank: 2, titleUz: 'Monako', value: '2.02 km²', locationUz: 'Yevropa', noteUz: 'Aholi zichligi eng yuqori mustaqil davlat; Nyu-Yorkdagi Markaziy bog‘dan ham kichik.' },
      { rank: 3, titleUz: 'Nauru', value: '21 km²', locationUz: 'Okeaniya', noteUz: 'Dunyodagi eng kichik orol-respublika; rasmiy poytaxtsiz yagona davlat (markazi Yaren).' },
      { rank: 4, titleUz: 'Tuvalu', value: '26 km²', locationUz: 'Okeaniya', noteUz: '9 ta marjon atollidan iborat davlat; dengiz sathi ko‘tarilishiga eng sezgir hudud.' },
      { rank: 5, titleUz: 'San-Marino', value: '61 km²', locationUz: 'Yevropa', noteUz: '301-yilda asos solingan va dunyodagi eng qadimiy uzluksiz respublika hisoblanadi.' },
    ],
  },
  {
    id: 'most-populous',
    titleUz: 'Eng ko‘p aholili davlatlar',
    subtitleUz: 'Eng so‘nggi demografik ko‘rsatkichlar asosida',
    items: [
      { rank: 1, titleUz: 'Hindiston', value: '1.44 mlrd', locationUz: 'Osiyo', noteUz: '2023-yildan buyon aholisi soni bo‘yicha dunyoda birinchi o‘rinda.' },
      { rank: 2, titleUz: 'Xitoy', value: '1.41 mlrd', locationUz: 'Osiyo', noteUz: 'Aholining katta qismi sharqiy qirg‘oqbo‘yi tekisliklarida jamlangan.' },
      { rank: 3, titleUz: 'AQSH', value: '335 mln', locationUz: 'Shimoliy Amerika', noteUz: 'G‘arbiy yarimshardagi aholisi eng ko‘p davlat.' },
      { rank: 4, titleUz: 'Indoneziya', value: '281 mln', locationUz: 'Osiyo', noteUz: 'Aholining yarmidan ko‘pi faqat Yava orolida yashaydi.' },
      { rank: 5, titleUz: 'Pokiston', value: '241.5 mln', locationUz: 'Osiyo', noteUz: 'Aholi asosan Hind daryosi havzasi bo‘ylab joylashgan.' },
    ],
  },
  {
    id: 'least-populous',
    titleUz: 'Eng kam aholili davlatlar',
    subtitleUz: 'Aholisi 50 ming kishiga yetmaydigan mustaqil davlatlar',
    items: [
      { rank: 1, titleUz: 'Vatikan', value: '~825 kishi', locationUz: 'Yevropa', noteUz: 'Aholisi asosan ruhoniylar, diplomatlar va Shveysariya gvardiyasidan iborat.' },
      { rank: 2, titleUz: 'Tuvalu', value: '11 400 kishi', locationUz: 'Okeaniya', noteUz: 'Tinch okeanidagi kichik atollarda yashovchi sokin jamoa.' },
      { rank: 3, titleUz: 'Nauru', value: '12 700 kishi', locationUz: 'Okeaniya', noteUz: 'Butun orolni piyoda 3–4 soatda aylanib chiqish mumkin.' },
      { rank: 4, titleUz: 'Palau', value: '18 000 kishi', locationUz: 'Okeaniya', noteUz: '340 ga yaqin marjon va vulqon orollaridan iborat.' },
      { rank: 5, titleUz: 'San-Marino', value: '33 600 kishi', locationUz: 'Yevropa', noteUz: 'Italiya bilan o‘ralgan tog‘li anklav davlat.' },
    ],
  },
  {
    id: 'highest-mountains',
    titleUz: 'Eng baland tog‘lar',
    subtitleUz: 'Dengiz sathidan balandligi (m) bo‘yicha cho‘qqilar',
    items: [
      { rank: 1, titleUz: 'Everest (Jomolungma)', value: '8 848.86 m', locationUz: 'Nepal / Xitoy (Himolay)', noteUz: 'Yerning dengiz sathidan eng baland cho‘qqisi; tektonik siljish tufayli yiliga ~4 mm o‘sadi.' },
      { rank: 2, titleUz: 'K2 (Chogori)', value: '8 611 m', locationUz: 'Pokiston / Xitoy (Qoraqurum)', noteUz: 'Texnik jihatdan chiqish eng qiyin bo‘lgan “Yovvoyi tog‘”.' },
      { rank: 3, titleUz: 'Kanchenjanga', value: '8 586 m', locationUz: 'Nepal / Hindiston', noteUz: 'Hindistonning eng baland cho‘qqisi va besh xazina tog‘i.' },
      { rank: 4, titleUz: 'Akonkagua', value: '6 961 m', locationUz: 'Argentina (And)', noteUz: 'Osiyodan tashqaridagi va G‘arbiy/Janubiy yarimsharlardagi eng baland cho‘qqi.' },
      { rank: 5, titleUz: 'Kilimanjaro', value: '5 895 m', locationUz: 'Tanzaniya', noteUz: 'Dunyodagi eng baland yakka turgan vulqon tog‘i.' },
    ],
  },
  {
    id: 'longest-rivers',
    titleUz: 'Eng uzun daryolar',
    subtitleUz: 'Suv havzasi va uzunligi bo‘yicha buyuk daryolar',
    items: [
      { rank: 1, titleUz: 'Nil', value: '6 650 km', locationUz: 'Afrika (11 davlat)', noteUz: 'Oq va Ko‘k Nil qo‘shilishidan hosil bo‘lib, janubdan shimolga O‘rta yer dengiziga quyiladi.' },
      { rank: 2, titleUz: 'Amazonka', value: '6 400 km', locationUz: 'Janubiy Amerika', noteUz: 'Suv hajmi bo‘yicha mutlaq #1 — okeanga quyiladigan chuchuk suvning 20% ini beradi.' },
      { rank: 3, titleUz: 'Yanszi', value: '6 300 km', locationUz: 'Xitoy (Osiyo)', noteUz: 'Bir davlat hududidan oqib o‘tuvchi eng uzun daryo.' },
      { rank: 4, titleUz: 'Missisipi — Missuri', value: '6 275 km', locationUz: 'AQSH', noteUz: 'Shimoliy Amerikaning asosiy suv transporti arteriyasi.' },
      { rank: 5, titleUz: 'Yenisey — Angara', value: '5 539 km', locationUz: 'Rossiya / Mongoliya', noteUz: 'Shimoliy Muz okeaniga quyiluvchi eng yirik daryo tizimi.' },
    ],
  },
  {
    id: 'largest-islands',
    titleUz: 'Eng katta orollar',
    subtitleUz: 'Qit’alardan tashqari eng yirik orol hududlari',
    items: [
      { rank: 1, titleUz: 'Grenlandiya', value: '2 166 086 km²', locationUz: 'Shimoliy Atlantika', noteUz: 'Ikkinchi o‘rindagi oroldan qariyb uch barobar katta.' },
      { rank: 2, titleUz: 'Yangi Gvineya', value: '785 753 km²', locationUz: 'Okeaniya / Osiyo', noteUz: 'Indoneziya va Papua — Yangi Gvineya o‘rtasida bo‘lingan.' },
      { rank: 3, titleUz: 'Borneo (Kalimantan)', value: '748 168 km²', locationUz: 'Janubi-Sharqiy Osiyo', noteUz: 'Uchta davlat (Indoneziya, Malayziya, Bruney) joylashgan yagona orol.' },
      { rank: 4, titleUz: 'Madagaskar', value: '587 041 km²', locationUz: 'Hind okeani', noteUz: 'Noyob lemurlar va baobablar vatani.' },
      { rank: 5, titleUz: 'Baffin Yeri', value: '507 451 km²', locationUz: 'Kanada (Arktika)', noteUz: 'Kanadaning eng katta arktik oroli.' },
    ],
  },
  {
    id: 'deepest-lakes',
    titleUz: 'Eng chuqur ko‘llar',
    subtitleUz: 'Tektonik yoriqlarda shakllangan gigant ko‘llar',
    items: [
      { rank: 1, titleUz: 'Baykal ko‘li', value: '1 642 m', locationUz: 'Rossiya (Sibir)', noteUz: 'Yer yuzidagi barcha suyuq chuchuk suvning ~20% ini saqlaydi.' },
      { rank: 2, titleUz: 'Tanganika ko‘li', value: '1 470 m', locationUz: 'Sharqiy Afrika', noteUz: 'Dunyodagi eng uzun chuchuk suvli ko‘l (673 km).' },
      { rank: 3, titleUz: 'Kaspiy dengizi (ko‘li)', value: '1 025 m', locationUz: 'O‘zbekiston g‘arbi / 5 davlat', noteUz: 'Maydoni bo‘yicha (371 000 km²) dunyodagi eng katta berk suv havzasi.' },
      { rank: 4, titleUz: 'Vostok ko‘li', value: '~900 m', locationUz: 'Antarktida', noteUz: '4 km muz qatlami ostida millionlab yillardan beri saqlanib kelayotgan ko‘l.' },
      { rank: 5, titleUz: 'O’Higgins / San-Martin', value: '836 m', locationUz: 'Chili / Argentina', noteUz: 'Janubiy Amerikaning eng chuqur muzlik ko‘li.' },
    ],
  },
  {
    id: 'extreme-climates',
    titleUz: 'Eng issiq va sovuq hududlar',
    subtitleUz: 'Sayyoramizning meteorologik ekstremal nuqtalari',
    items: [
      { rank: 1, titleUz: 'O‘lim vodiysi (Death Valley)', value: '+56.7 °C', locationUz: 'Kaliforniya, AQSH', noteUz: 'Rasmiy qayd etilgan eng yuqori havo harorati.' },
      { rank: 2, titleUz: 'Lut cho‘li (Dasht-e Lut)', value: '+70.7 °C (yer yuzasi)', locationUz: 'Eron', noteUz: 'Sun’iy yo‘ldoshlar qayd etgan eng qaynoq yer yuzasi.' },
      { rank: 3, titleUz: 'Vostok stansiyasi', value: '-89.2 °C', locationUz: 'Antarktida', noteUz: 'Yerda meteorologik stansiya o‘lchagan eng past harorat (1983).' },
      { rank: 4, titleUz: 'Oymyakon qishlog‘i', value: '-67.7 °C', locationUz: 'Saxaa (Yakutiya), Rossiya', noteUz: 'Doimiy aholi yashaydigan eng sovuq maskan ("Sovuq qutbi").' },
      { rank: 5, titleUz: 'Mavsinram / Cherrapunji', value: '11 871 mm/yil', locationUz: 'Meghalaya, Hindiston', noteUz: 'Yer yuzidagi eng seryog‘in hudud.' },
    ],
  },
  {
    id: 'unique-phenomena',
    titleUz: 'Noyob geografik hodisalar',
    subtitleUz: 'Tabiat va geofizika yaratgan hayratlanarli hodisalar',
    items: [
      { rank: 1, titleUz: 'Chimboraso va Yer shakli', value: '6 263 m (markazdan eng uzoq)', locationUz: 'Ekvador', noteUz: 'Yer ekvatorda qabariq bo‘lgani uchun Chimboraso cho‘qqisi Yer markazidan Everestga qaraganda uzoqroqdir.' },
      { rank: 2, titleUz: 'Mariana botig‘i (Challenger Deep)', value: '-10 935 m', locationUz: 'Tinch okeani', noteUz: 'Okean tubidagi eng chuqur joy; bosim dengiz sathidan 1 000 barobar yuqori.' },
      { rank: 3, titleUz: 'Marakaybo ko‘li chaqmoqlari (Katatumbo)', value: 'Yiliga 260 kecha', locationUz: 'Venesuela', noteUz: 'Bir daqiqada o‘nlab chaqmoq chaqnaydigan sayyoraning eng elektrli nuqtasi.' },
      { rank: 4, titleUz: 'O‘lik dengiz cho‘kmasi', value: '-430 m', locationUz: 'Iordaniya / Isroil', noteUz: 'Quruqlikdagi eng past ochiq nuqta; sho‘rligi ~34% bo‘lib, odam cho‘kmasdan suzadi.' },
      { rank: 5, titleUz: 'Darvaza gaz krateri', value: '1971-yildan beri yonadi', locationUz: 'Turkmaniston (Qoraqum)', noteUz: 'O‘rta Osiyodagi mashhur geologik alangali krater.' },
    ],
  },
];

export interface OlympiadQuestion {
  id: string;
  topic: string;
  difficulty: 'Olimpiada' | 'Ekspert' | 'Tahliliy';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const OLYMPIAD_EXAM_QUESTIONS: OlympiadQuestion[] = [
  {
    id: 'oly-1',
    topic: 'Siyosiy geografiya',
    difficulty: 'Olimpiada',
    question: 'Dunyoda okeanga chiqish uchun kamida ikki davlat chegarasini kesib o‘tish zarur bo‘lgan (“double-landlocked”) ikkita davlat qaysilar?',
    options: [
      'O‘zbekiston va Lixtenshteyn',
      'Shveysariya va Tojikiston',
      'Andorra va Lyuksemburg',
      'Boliviya va Paragvay',
    ],
    correctIndex: 0,
    explanation: 'Yer yuzida faqat O‘zbekiston (O‘rta Osiyo) va Lixtenshteyn (Yevropa) ikki marta dengizga chiqmaydigan davlatlardir.',
  },
  {
    id: 'oly-2',
    topic: 'Matematik geografiya',
    difficulty: 'Tahliliy',
    question: 'Qaysi davlat eng ko‘p vaqt mintaqalarini (dengizorti hududlari bilan birga) o‘z ichiga oladi?',
    options: ['Rossiya (11 ta)', 'Fransiya (12 ta)', 'AQSH (11 ta)', 'Buyuk Britaniya (9 ta)'],
    correctIndex: 1,
    explanation: 'Fransiya dengizorti departament va hududlari (Tinch, Hind va Atlantika okeanlari) hisobiga 12 ta vaqt mintaqasiga ega.',
  },
  {
    id: 'oly-3',
    topic: 'Gidrologiya',
    difficulty: 'Olimpiada',
    question: 'Qaysi daryo ekvator chizig‘ini ikki marta kesib o‘tadi va chuqurligi bo‘yicha dunyoda birinchi o‘rinda turadi?',
    options: ['Amazonka', 'Kongo', 'Nil', 'Orinoko'],
    correctIndex: 1,
    explanation: 'Kongo daryosi ekvatorni ikki marta kesib o‘tadi va quyi oqimida chuqurligi 220 metrdan oshadi.',
  },
  {
    id: 'oly-4',
    topic: 'Geodeziya',
    difficulty: 'Ekspert',
    question: 'Yerning ekvatordagi qabariqligi sababli Yer markazidan eng uzoqda joylashgan nuqta qaysi?',
    options: [
      'Everest (Nepal/Xitoy)',
      'Kilimanjaro (Tanzaniya)',
      'Chimboraso (Ekvador)',
      'Mauna-Kea (Gavayi)',
    ],
    correctIndex: 2,
    explanation: 'Chimboraso ekvator yaqinida joylashgani sababli Yer markazidan 6 384.4 km uzoqlikda — Everestdan ~2.1 km uzoqroqda.',
  },
  {
    id: 'oly-5',
    topic: 'Chegaralar',
    difficulty: 'Olimpiada',
    question: 'Fransiya eng uzun quruqlik chegarasiga qaysi davlat bilan ega?',
    options: ['Ispaniya', 'Germaniya', 'Italiya', 'Braziliya'],
    correctIndex: 3,
    explanation: 'Janubiy Amerikadagi Fransuz Gvianasi tufayli Fransiya va Braziliya chegarasi (730 km) Fransiyaning eng uzun quruqlik chegarasidir.',
  },
  {
    id: 'oly-6',
    topic: 'Hududiy maqom',
    difficulty: 'Tahliliy',
    question: 'Qaysi hudud “Bir davlat, ikki tizim” tamoyili asosida Xitoyning maxsus ma’muriy hududi maqomida boshqariladi?',
    options: ['Tayvan', 'Gonkong va Makao', 'Singapur', 'Guam'],
    correctIndex: 1,
    explanation: '1997 va 1999-yillardan beri Gonkong va Makao maxsus ma’muriy hudud (SAR) maqomiga ega.',
  },
  {
    id: 'oly-7',
    topic: 'Okeanografiya',
    difficulty: 'Olimpiada',
    question: 'O‘z qirg‘oqlariga ega bo‘lmagan, faqat okean oqimlari bilan chegaralangan yagona dengiz qaysi?',
    options: ['Sargass dengizi', 'Bering dengizi', 'Tasman dengizi', 'Qizil dengiz'],
    correctIndex: 0,
    explanation: 'Atlantika okeanidagi Sargass dengizi 4 ta yirik okean oqimi bilan o‘ralgan va quruqlik qirg‘og‘iga ega emas.',
  },
  {
    id: 'oly-8',
    topic: 'Iqlimshunoslik',
    difficulty: 'Tahliliy',
    question: 'Nima uchun Janubiy Amerikadagi Atakama cho‘li ekvatorga yaqin bo‘lsa-da Yer yuzasidagi eng quruq qutbsiz cho‘l hisoblanadi?',
    options: [
      'Sovuq Gumboldt oqimi va And tog‘larining yomg‘ir soyasi tufayli',
      'Golfstrim issiq oqimi tufayli',
      'Shimoliy shamollar ta’sirida',
      'Atmosfera bosimi pastligi tufayli',
    ],
    correctIndex: 0,
    explanation: 'Sovuq Peru (Gumboldt) oqimi havoni sovutib yomg‘ir hosil bo‘lishini to‘sadi, And tog‘lari esa sharqdan keladigan namlikni ushlab qoladi.',
  },
  {
    id: 'oly-9',
    topic: 'Demografiya',
    difficulty: 'Ekspert',
    question: 'Qaysi mustaqil davlat hududida poytaxt ham, aholi soni ham to‘liq bitta shahar chegarasi doirasida bo‘lib, u bir vaqtning o‘zida ikki qit’ada emas, balki Malay yarimoroli janubida joylashgan orol shahar-davlatdir?',
    options: ['Monako', 'Singapur', 'Bahrayn', 'Malta'],
    correctIndex: 1,
    explanation: 'Singapur — Janubi-Sharqiy Osiyodagi dunyoning eng yirik zamonaviy shahar-orol davlatidir.',
  },
  {
    id: 'oly-10',
    topic: 'Tektonika',
    difficulty: 'Olimpiada',
    question: 'Sharqiy Afrika yoriq vodiysida (Great Rift Valley) joylashgan va chuqurligi bo‘yicha dunyoda ikkinchi o‘rinda turuvchi ko‘l qaysi?',
    options: ['Viktoriya ko‘li', 'Malavi ko‘li', 'Tanganika ko‘li', 'Turkana ko‘li'],
    correctIndex: 2,
    explanation: 'Tanganika ko‘li chuqurligi 1 470 m bo‘lib, faqat Baykal ko‘lidan keyin turadi.',
  },
  {
    id: 'oly-11',
    topic: 'Anklavlar',
    difficulty: 'Ekspert',
    question: 'Janubiy Afrika hududi bilan to‘liq o‘ralgan (anklav) mustaqil tog‘li qirollik qaysi?',
    options: ['Esvatini', 'Lesoto', 'Botsvana', 'Malavi'],
    correctIndex: 1,
    explanation: 'Lesoto butunlay Janubiy Afrika Respublikasi bilan o‘ralgan va dengiz sathidan eng past nuqtasi 1 400 metr bo‘lgan noyob davlatdir.',
  },
  {
    id: 'oly-12',
    topic: 'Osiyo geografiyasi',
    difficulty: 'Tahliliy',
    question: 'Qaysi uchta davlat bir vaqtning o‘zida bitta Borneo (Kalimantan) orolida hududga ega?',
    options: [
      'Indoneziya, Malayziya, Bruney',
      'Indoneziya, Filippin, Sharqiy Timor',
      'Malayziya, Singapur, Tailand',
      'Papua — Yangi Gvineya, Indoneziya, Avstraliya',
    ],
    correctIndex: 0,
    explanation: 'Borneo oroli uch mustaqil davlat — Indoneziya, Malayziya va Bruney o‘rtasida bo‘lingan.',
  },
];

export interface MapPinTask {
  id: string;
  targetAtlasName: string;
  targetNameUz: string;
  clueUz: string;
  hintUz: string;
  continent: string;
}

export const MAP_PIN_TASKS: MapPinTask[] = [
  {
    id: 'pin-uz',
    targetAtlasName: 'Uzbekistan',
    targetNameUz: 'O‘zbekiston',
    clueUz: 'Markaziy Osiyo markazida joylashgan, ikki marta dengizga chiqmaydigan davlatni xaritada toping va bosing.',
    hintUz: 'Orol dengizidan janubi-sharqda, Qozog‘istondan janubda.',
    continent: 'Osiyo',
  },
  {
    id: 'pin-jp',
    targetAtlasName: 'Japan',
    targetNameUz: 'Yaponiya',
    clueUz: 'Tinch okeanining g‘arbidagi Fudziyama vulqoni joylashgan orol davlatni xaritada belgilang.',
    hintUz: 'Koreya yarimorolidan sharqda.',
    continent: 'Osiyo',
  },
  {
    id: 'pin-br',
    targetAtlasName: 'Brazil',
    targetNameUz: 'Braziliya',
    clueUz: 'Amazonka o‘rmonlarining asosiy qismini egallagan Janubiy Amerikadagi eng katta davlatni bosing.',
    hintUz: 'Janubiy Amerikaning sharqiy va markaziy qismi.',
    continent: 'Janubiy Amerika',
  },
  {
    id: 'pin-eg',
    targetAtlasName: 'Egypt',
    targetNameUz: 'Misr',
    clueUz: 'Suvaysh kanali va Nil deltasi orqali Osiyo hamda Afrikani bog‘lovchi davlatni toping.',
    hintUz: 'Afrikaning shimoli-sharqiy burchagi.',
    continent: 'Afrika',
  },
  {
    id: 'pin-no',
    targetAtlasName: 'Norway',
    targetNameUz: 'Norvegiya',
    clueUz: 'Skandinaviya yarimorolining g‘arbiy qismida chuqur fyordlarga ega shimoliy davlatni belgilang.',
    hintUz: 'Shvetsiyadan g‘arbda, Shimoliy Yevropa.',
    continent: 'Yevropa',
  },
  {
    id: 'pin-au',
    targetAtlasName: 'Australia',
    targetNameUz: 'Avstraliya',
    clueUz: 'Butun bir qit’ani egallagan, Buyuk To‘siq rifiga ega davlatni xaritada toping.',
    hintUz: 'Janubiy yarimshar, Hind va Tinch okeanlari orasida.',
    continent: 'Okeaniya',
  },
  {
    id: 'pin-cl',
    targetAtlasName: 'Chile',
    targetNameUz: 'Chili',
    clueUz: 'And tog‘lari va Tinch okeani orasida shimoldan janubga 4 300 km cho‘zilgan ingichka davlatni toping.',
    hintUz: 'Janubiy Amerikaning g‘arbiy qirg‘og‘i.',
    continent: 'Janubiy Amerika',
  },
  {
    id: 'pin-ca',
    targetAtlasName: 'Canada',
    targetNameUz: 'Kanada',
    clueUz: 'Dunyo bo‘yicha eng uzun dengiz sohili va maydoni jihatidan 2-o‘rindagi davlatni belgilang.',
    hintUz: 'AQSHdan shimolda.',
    continent: 'Shimoliy Amerika',
  },
];

export interface DictionaryTerm {
  id: string;
  en: string;
  uz: string;
  pronunciation: string;
  category: 'Siyosiy geografiya' | 'Tabiiy geografiya' | 'Iqlim va Hudud';
  exampleEn: string;
  exampleUz: string;
}

export const GEO_DICTIONARY_TERMS: DictionaryTerm[] = [
  { id: 't-country', en: 'Country', uz: 'Davlat', pronunciation: '[ˈkʌntri]', category: 'Siyosiy geografiya', exampleEn: 'Uzbekistan is a country in Central Asia.', exampleUz: 'O‘zbekiston — Markaziy Osiyodagi davlat.' },
  { id: 't-capital', en: 'Capital', uz: 'Poytaxt', pronunciation: '[ˈkæpɪtl]', category: 'Siyosiy geografiya', exampleEn: 'Tashkent is the capital of Uzbekistan.', exampleUz: 'Toshkent — O‘zbekistonning poytaxti.' },
  { id: 't-population', en: 'Population', uz: 'Aholi', pronunciation: '[ˌpɒpjəˈleɪʃn]', category: 'Siyosiy geografiya', exampleEn: 'The world population exceeds 8 billion.', exampleUz: 'Dunyo aholisi 8 milliarddan oshadi.' },
  { id: 't-area', en: 'Area', uz: 'Maydon', pronunciation: '[ˈeəriə]', category: 'Iqlim va Hudud', exampleEn: 'Canada has the second largest area.', exampleUz: 'Kanada maydoni bo‘yicha ikkinchi o‘rinda.' },
  { id: 't-border', en: 'Border', uz: 'Chegara', pronunciation: '[ˈbɔːdə]', category: 'Siyosiy geografiya', exampleEn: 'Two countries share a mountain border.', exampleUz: 'Ikki davlat tog‘li chegaraga ega.' },
  { id: 't-mountain', en: 'Mountain', uz: 'Tog‘', pronunciation: '[ˈmaʊntən]', category: 'Tabiiy geografiya', exampleEn: 'Everest is the highest mountain on Earth.', exampleUz: 'Everest — Yerdagi eng baland tog‘.' },
  { id: 't-river', en: 'River', uz: 'Daryo', pronunciation: '[ˈrɪvə]', category: 'Tabiiy geografiya', exampleEn: 'The Amu Darya is a major river.', exampleUz: 'Amudaryo — yirik daryodir.' },
  { id: 't-ocean', en: 'Ocean', uz: 'Okean', pronunciation: '[ˈəʊʃn]', category: 'Tabiiy geografiya', exampleEn: 'The Pacific is the deepest ocean.', exampleUz: 'Tinch okeani — eng chuqur okean.' },
  { id: 't-continent', en: 'Continent', uz: 'Qit’a (Materik)', pronunciation: '[ˈkɒntɪnənt]', category: 'Tabiiy geografiya', exampleEn: 'Asia is the largest continent.', exampleUz: 'Osiyo — eng katta qit’a.' },
  { id: 't-island', en: 'Island', uz: 'Orol', pronunciation: '[ˈaɪlənd]', category: 'Tabiiy geografiya', exampleEn: 'Greenland is the largest island.', exampleUz: 'Grenlandiya — eng katta orol.' },
  { id: 't-peninsula', en: 'Peninsula', uz: 'Yarimorol', pronunciation: '[pəˈnɪnsjələ]', category: 'Tabiiy geografiya', exampleEn: 'Arabia is the largest peninsula.', exampleUz: 'Arabiston — eng katta yarimorol.' },
  { id: 't-climate', en: 'Climate', uz: 'Iqlim', pronunciation: '[ˈklaɪmət]', category: 'Iqlim va Hudud', exampleEn: 'Deserts have an arid climate.', exampleUz: 'Cho‘llar quruq iqlimga ega.' },
  { id: 't-territory', en: 'Territory', uz: 'Hudud', pronunciation: '[ˈterətəri]', category: 'Iqlim va Hudud', exampleEn: 'Greenland is an autonomous territory.', exampleUz: 'Grenlandiya — avtonom hudud.' },
  { id: 't-independence', en: 'Independence', uz: 'Mustaqillik', pronunciation: '[ˌɪndɪˈpendəns]', category: 'Siyosiy geografiya', exampleEn: 'Independence Day is celebrated every year.', exampleUz: 'Mustaqillik kuni har yili nishonlanadi.' },
  { id: 't-government', en: 'Government', uz: 'Hukumat', pronunciation: '[ˈɡʌvənmənt]', category: 'Siyosiy geografiya', exampleEn: 'A republic has an elected government.', exampleUz: 'Respublikada saylangan hukumat bo‘ladi.' },
  { id: 't-currency', en: 'Currency', uz: 'Pul birligi (Valyuta)', pronunciation: '[ˈkʌrənsi]', category: 'Siyosiy geografiya', exampleEn: 'The currency of Japan is the yen.', exampleUz: 'Yaponiya pul birligi — iyena.' },
  { id: 't-language', en: 'Language', uz: 'Til', pronunciation: '[ˈlæŋɡwɪdʒ]', category: 'Siyosiy geografiya', exampleEn: 'Official language is used in schools.', exampleUz: 'Rasmiy til maktablarda o‘qitiladi.' },
  { id: 't-neighbor', en: 'Neighboring country', uz: 'Qo‘shni davlat', pronunciation: '[ˈneɪbərɪŋ ˈkʌntri]', category: 'Siyosiy geografiya', exampleEn: 'Kazakhstan is a neighboring country.', exampleUz: 'Qozog‘iston — qo‘shni davlat.' },
  { id: 't-landlocked', en: 'Landlocked country', uz: 'Dengizga chiqmaydigan davlat', pronunciation: '[ˈlændlɒkt ˈkʌntri]', category: 'Iqlim va Hudud', exampleEn: 'Bolivia is a landlocked country.', exampleUz: 'Boliviya — dengizga chiqmaydigan davlat.' },
  { id: 't-archipelago', en: 'Archipelago', uz: 'Arxipelag (orollar guruhi)', pronunciation: '[ˌɑːkɪˈpeləɡəʊ]', category: 'Tabiiy geografiya', exampleEn: 'Indonesia is a vast archipelago.', exampleUz: 'Indoneziya — ulkan arxipelag.' },
  { id: 't-desert', en: 'Desert', uz: 'Cho‘l', pronunciation: '[ˈdezət]', category: 'Tabiiy geografiya', exampleEn: 'The Kyzylkum is a sandy desert.', exampleUz: 'Qizilqum — qumli cho‘ldir.' },
  { id: 't-plateau', en: 'Plateau', uz: 'Plato (yassitog‘lik)', pronunciation: '[ˈplætəʊ]', category: 'Tabiiy geografiya', exampleEn: 'Tibet is the highest plateau.', exampleUz: 'Tibet — eng baland plato.' },
  { id: 't-valley', en: 'Valley', uz: 'Vodiy', pronunciation: '[ˈvæli]', category: 'Tabiiy geografiya', exampleEn: 'The Fergana Valley is fertile.', exampleUz: 'Farg‘ona vodiysi unumdor.' },
  { id: 't-strait', en: 'Strait', uz: 'Bo‘g‘oz', pronunciation: '[streɪt]', category: 'Tabiiy geografiya', exampleEn: 'The Strait of Gibraltar connects seas.', exampleUz: 'Gibraltar bo‘g‘ozi dengizlarni bog‘laydi.' },
  { id: 't-glacier', en: 'Glacier', uz: 'Muzlik', pronunciation: '[ˈɡlæsiə]', category: 'Iqlim va Hudud', exampleEn: 'Glaciers store fresh water in mountains.', exampleUz: 'Muzliklar tog‘larda chuchuk suv saqlaydi.' },
  { id: 't-volcano', en: 'Volcano', uz: 'Vulqon', pronunciation: '[vɒlˈkeɪnəʊ]', category: 'Tabiiy geografiya', exampleEn: 'Mount Fuji is a dormant volcano.', exampleUz: 'Fudziyama — harakatsiz vulqon.' },
  { id: 't-equator', en: 'Equator', uz: 'Ekvator', pronunciation: '[ɪˈkweɪtə]', category: 'Iqlim va Hudud', exampleEn: 'Kenya lies directly on the equator.', exampleUz: 'Keniya bevosita ekvatorda joylashgan.' },
  { id: 't-hemisphere', en: 'Hemisphere', uz: 'Yarimshar', pronunciation: '[ˈhemɪsfɪə]', category: 'Iqlim va Hudud', exampleEn: 'Australia is in the Southern Hemisphere.', exampleUz: 'Avstraliya Janubiy yarimsharda joylashgan.' },
  { id: 't-coastline', en: 'Coastline', uz: 'Qirg‘oq chizig‘i', pronunciation: '[ˈkəʊstlaɪn]', category: 'Tabiiy geografiya', exampleEn: 'Norway has a long fjord coastline.', exampleUz: 'Norvegiya uzun fyord qirg‘oq chizig‘iga ega.' },
  { id: 't-resources', en: 'Natural resources', uz: 'Tabiiy boyliklar', pronunciation: '[ˈnætʃrəl rɪˈzɔːsɪz]', category: 'Iqlim va Hudud', exampleEn: 'Natural gas and gold are key resources.', exampleUz: 'Tabiiy gaz va oltin asosiy boyliklardir.' },
];
