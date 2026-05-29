/*
 * HÍRKERESŐ MODERN - APPLICATION ENGINE
 * High-fidelity Hungarian news aggregator simulation with interactive widgets.
 */

// --- HUNGARIAN NAME DAYS DATABASE (COMPACT SYSTEM) ---
const NAMEDAYS = {
  0: { // Január
    1: "Fruzsina", 2: "Ábel", 3: "Genovéva", 4: "Titusz", 5: "Simon", 6: "Boldizsár", 7: "Attila", 8: "Gyöngyvér",
    9: "Marcell", 10: "Melánia", 11: "Ágota", 12: "Ernő", 13: "Veronika", 14: "Bódog", 15: "Lóránt", 16: "Gusztáv",
    17: "Antal", 18: "Piroska", 19: "Sára", 20: "Fábián", 21: "Ágnes", 22: "Vince", 23: "Zelma", 24: "Timót",
    25: "Pál", 26: "Vanda", 27: "Angéla", 28: "Károly", 29: "Adél", 30: "Martina", 31: "Marcella"
  },
  1: { // Február
    1: "Ignác", 2: "Karolina", 3: "Balázs", 4: "Ráhel", 5: "Ágota", 6: "Dorottya", 7: "Tódor", 8: "Aranka",
    9: "Abigél", 10: "Elvira", 11: "Bertold", 12: "Lívia", 13: "Ella", 14: "Bálint", 15: "Kolos", 16: "Julianna",
    17: "Donát", 18: "Bernadett", 19: "Zsuzsanna", 20: "Aladár", 21: "Eleonóra", 22: "Gerzson", 23: "Alfréd", 24: "Mátyás",
    25: "Géza", 26: "Edina", 27: "Ákos", 28: "Elemér", 29: "Eszter"
  },
  2: { // Március
    1: "Albin", 2: "Lujza", 3: "Kornélia", 4: "Kázmér", 5: "Adorján", 6: "Leonóra", 7: "Tamás", 8: "Zoltán",
    9: "Fanny", 10: "Ildikó", 11: "Szilárd", 12: "Gergely", 13: "Krisztián", 14: "Matild", 15: "Kristóf", 16: "Henrietta",
    17: "Gertrúd", 18: "Sándor", 19: "József", 20: "Klaudia", 21: "Benedek", 22: "Beáta", 23: "Emőke", 24: "Gábor",
    25: "Irén", 26: "Emánuel", 27: "Hajnalka", 28: "Gedeon", 29: "Auguszta", 30: "Zalán", 31: "Árpád"
  },
  3: { // Április
    1: "Hugó", 2: "Áron", 3: "Buda", 4: "Izidor", 5: "Vince", 6: "Bíborka", 7: "Herman", 8: "Dénes",
    9: "Erhard", 10: "Zsolt", 11: "Leó", 12: "Gyula", 13: "Ida", 14: "Tibor", 15: "Anasztázia", 16: "Csongor",
    17: "Rudolf", 18: "Andrea", 19: "Emma", 20: "Tivadar", 21: "Konrád", 22: "Csilla", 23: "Béla", 24: "György",
    25: "Márk", 26: "Ervin", 27: "Zita", 28: "Valéria", 29: "Péter", 30: "Katalin"
  },
  4: { // Május
    1: "Fülöp", 2: "Zsigmond", 3: "Tímea", 4: "Mónika", 5: "Györgyi", 6: "Ivett", 7: "Gizella", 8: "Mihály",
    9: "Gergely", 10: "Ármin", 11: "Ferenc", 12: "Pongrác", 13: "Szervác", 14: "Bonifác", 15: "Zsófia", 16: "Botond",
    17: "Paszkál", 18: "Erik", 19: "Ivó", 20: "Bernát", 21: "Konstantin", 22: "Júlia", 23: "Dezső", 24: "Eszter",
    25: "Orbán", 26: "Fülöp", 27: "Hella", 28: "Emil", 29: "Magdolna", 30: "Janka", 31: "Angéla"
  },
  5: { // Június
    1: "Tünde", 2: "Kármen", 3: "Klothild", 4: "Bulcsú", 5: "Fatime", 6: "Norbert", 7: "Róbert", 8: "Medárd",
    9: "Félix", 10: "Margit", 11: "Barnabás", 12: "Villő", 13: "Antal", 14: "Vazul", 15: "Jolán", 16: "Jusztin",
    17: "Laura", 18: "Arnold", 19: "Gyárfás", 20: "Rafael", 21: "Alajos", 22: "Paulina", 23: "Zoltán", 24: "Iván",
    25: "Vilmos", 26: "János", 27: "László", 28: "Levente", 29: "Péter", 30: "Pál"
  },
  6: { // Július
    1: "Tihamér", 2: "Ottó", 3: "Kornél", 4: "Ulrik", 5: "Emese", 6: "Csaba", 7: "Appolónia", 8: "Ellák",
    9: "Lukrécia", 10: "Amália", 11: "Nóra", 12: "Izabella", 13: "Jenő", 14: "Örs", 15: "Henrik", 16: "Valter",
    17: "Endre", 18: "Frigyes", 19: "Emília", 20: "Illés", 21: "Dániel", 22: "Magdolna", 23: "Lenke", 24: "Kinga",
    25: "Kristóf", 26: "Anna", 27: "Olga", 28: "Szabolcs", 29: "Márta", 30: "Judit", 31: "Oszkár"
  },
  7: { // Augusztus
    1: "Boglárka", 2: "Lehel", 3: "Hermina", 4: "Dominik", 5: "Krisztina", 6: "Berta", 7: "Ibolya", 8: "László",
    9: "Emőd", 10: "Lőrinc", 11: "Zsuzsanna", 12: "Klára", 13: "Ipoly", 14: "Marcell", 15: "Mária", 16: "Ábrahám",
    17: "Jácint", 18: "Ilona", 19: "Huba", 20: "István", 21: "Sámuel", 22: "Menyhért", 23: "Bence", 24: "Bertalan",
    25: "Lajos", 26: "Izsó", 27: "Gáspár", 28: "Ágoston", 29: "Beatrix", 30: "Rózsa", 31: "Erika"
  },
  8: { // Szeptember
    1: "Egyed", 2: "Rebeka", 3: "Hilda", 4: "Rozália", 5: "Viktor", 6: "Zakariás", 7: "Regina", 8: "Mária",
    9: "Ádám", 10: "Nikolett", 11: "Teodóra", 12: "Mária", 13: "Kornél", 14: "Szeréna", 15: "Enikő", 16: "Edit",
    17: "Zsófia", 18: "Diána", 19: "Wilhelmina", 20: "Friderika", 21: "Máté", 22: "Móric", 23: "Tekla", 24: "Gellért",
    25: "Eufrozina", 26: "Jusztina", 27: "Adalbert", 28: "Vencel", 29: "Mihály", 30: "Jeromos"
  },
  9: { // Október
    1: "Malvin", 2: "Petra", 3: "Helga", 4: "Ferenc", 5: "Aurél", 6: "Brúnó", 7: "Amália", 8: "Koppány",
    9: "Dénes", 10: "Gedeon", 11: "Brigitta", 12: "Miksa", 13: "Kálmán", 14: "Helén", 15: "Teréz", 16: "Gál",
    17: "Hedvig", 18: "Lukács", 19: "Nándor", 20: "Vendel", 21: "Orsolya", 22: "Előd", 23: "Gyöngyvér", 24: "Salamon",
    25: "Blanka", 26: "Dömötör", 27: "Szabina", 28: "Simon", 29: "Nárcisz", 30: "Alfonz", 31: "Farkas"
  },
  10: { // November
    1: "Marianna", 2: "Achilles", 3: "Győző", 4: "Károly", 5: "Imre", 6: "Lénárd", 7: "Rezső", 8: "Zsombor",
    9: "Tivadar", 10: "Réka", 11: "Márton", 12: "Jónás", 13: "Szilvia", 14: "Aliz", 15: "Albert", 16: "Ödön",
    17: "Hortenzia", 18: "Jenő", 19: "Erzsébet", 20: "Jolán", 21: "Olivér", 22: "Cecília", 23: "Kelemen", 24: "Emma",
    25: "Katalin", 26: "Virág", 27: "Virgil", 28: "Stefánia", 29: "Taksony", 30: "András"
  },
  11: { // December
    1: "Elza", 2: "Melinda", 3: "Ferenc", 4: "Borbála", 5: "Vilma", 6: "Miklós", 7: "Ambrus", 8: "Mária",
    9: "Natália", 10: "Judit", 11: "Árpád", 12: "Gabriella", 13: "Luca", 14: "Szilárda", 15: "Valér", 16: "Etelka",
    17: "Lázár", 18: "Auguszta", 19: "Viola", 20: "Teofil", 21: "Tamás", 22: "Zénó", 23: "Viktória", 24: "Ádám",
    25: "Eugénia", 26: "István", 27: "János", 28: "Kamilla", 29: "Tamara", 30: "Dávid", 31: "Szilveszter"
  }
};

// --- MOCK DATABASES FOR HEADLINES ---
const NEWS_TEMPLATES = {
  belfold: [
    "Rendkívüli kormányinfót hirdettek mára: fontos bejelentések várhatók",
    "Lezárják a Margit hidat a hétvégén felújítási munkálatok miatt",
    "Új traffipaxokat helyeznek ki az autópályákon – itt a teljes lista",
    "Átadták a felújított főteret [City]-ben: látványos videón a beruházás",
    "Változik a MÁV menetrendje a [Season] időszakban: mutatjuk a legfontosabb járatokat",
    "Megnyílik Magyarország legújabb [Activity] parkja a Dunakanyarban",
    "Ismét drágulnak az autópálya-matricák: ennyit kell fizetni jövőre",
    "Elképesztő vihar csapott le [City]-re: fákat csavart ki a szél",
    "Újra jár a történelmi kisvasút a hegyekben",
    "Fontos figyelmeztetést adtak ki a magyarországi bankok: csalók trükköznek",
    "Csodás régészeti leletre bukkantak a [City] melletti ásatásokon",
    "Rekordszámú látogatót vonzott a hétvégi gasztrofesztivál",
    "Mérföldkőhöz érkezett a hazai vasúti járműgyártás",
    "Lakossági fórumot tartanak [City]-ben a tervezett kerékpárutakról",
    "Kötelezővé teszik a szelektív gyűjtést az új lakóparkokban"
  ],
  kulfold: [
    "Rendkívüli csúcstalálkozót hívott össze az Európai Unió Brüsszelben",
    "Erős földrengés rázta meg [Country] déli részét: megrongálódtak a műemlékek",
    "Újabb szigorításokat vezetnek be az osztrák határon a turistáknak",
    "Elképesztő hőségriadó tombol Dél-Európában: [Temp] fokot mértek [Country]-ban",
    "Hatalmas vihar bénította meg [Capital] repülőterének forgalmát",
    "Fontos megállapodást írt alá [Country] és szomszédja az energiabiztonságról",
    "Történelmi választásokra készülnek [Country]-ban: szoros küzdelem várható",
    "Környezetvédelmi zónákat vezetnek be a [Capital] belvárosában",
    "Sikeresen landolt a legújabb űrszonda a Hold túlsó oldalán",
    "Új nemzetközi vasútvonal kötheti össze Közép-Európa fővárosait",
    "Eltörlik az autópályadíjat a turistáknak ebben a közkedvelt [Country] régióban",
    "Gigantikus naperőmű-park épül a sivatag szélén",
    "Rendkívüli intézkedéseket hoztak a légszennyezettség miatt [Capital]-ban",
    "Újra megnyitották az évtizedek óta lezárt határátkelőt",
    "Váratlan vulkánkitörés miatt kellett evakuálni egy népszerű szigetet"
  ],
  gazdasag: [
    "Történelmi csúcsra erősödött a forint az euróval szemben a jegybank döntése után",
    "Csökken a benzin és a gázolaj ára a hazai kutakon szerdától",
    "Aggasztó inflációs adatok érkeztek: elemzők szerint még nincs vége a nehezének",
    "Megugrott az ingatlanok iránti kereslet a Balaton környékén: itt vannak a négyzetméterárak",
    "Új gyárat épít egy nemzetközi autóipari óriás Kelet-Magyarországon",
    "Zuhan az euró ára: [Number] forint alatt is jegyezték ma reggel",
    "Jelentősen emelkedik a minimálbér jövő hónaptól: ennyit kapnak kézhez a dolgozók",
    "A vártnál jobb GDP-adatok érkeztek: talpra áll a magyar gazdaság?",
    "Új támogatási program indul a kis- és középvállalkozások részére",
    "Rekordszinten a magyarországi foglalkoztatottság a friss elemzések szerint",
    "Megugrott az arany világpiaci ára: mindenki a biztonságos menedéket keresi",
    "Nem várt döntést hozott az MNB a kamatdöntő ülésén",
    "Komoly adókedvezményekre számíthatnak a fiatal munkavállalók jövőre",
    "Több tízezer új munkahelyet teremthet a hazai zöldenergia-szektor",
    "Jelentős átrendeződés látható a hazai kiskereskedelmi láncok piacán"
  ],
  tech: [
    "Új funkciót vezet be a Google a levelezőrendszerében: ennek sokan fognak örülni",
    "Aggasztó felfedezést tettek a tudósok a sarkvidéki jégtakaró alatt",
    "Új szupercsillagképet fedezett fel a James Webb űrteleszkóp",
    "Kritikus biztonsági hiba miatt azonnali frissítést kérnek az iPhone tulajdonosoktól",
    "Magyar kutatók fejlesztettek ki egy új eljárást a rákos sejtek korai felismerésére",
    "Már tesztelik a legújabb szuperszámítógépet, ami megváltoztatja az időjárás-előrejelzést",
    "Bemutatták a világ első teljesen átlátszó képernyős okostelefonját",
    "Veszélyes kártevő terjed a közösségi médiában: így védekezhet ellene",
    "Forradalmi akkumulátort fejlesztettek ki: percek alatt tölthető és ezer kilométert bír",
    "Csillagászati áttörés: közvetlen bizonyítékot találtak egy távoli lakható bolygón",
    "Megérkezett a legújabb operációs rendszer frissítés: mutatjuk a leghasznosabb trükköket",
    "Önvezető buszokat állítanak forgalomba [Capital] tömegközlekedésében",
    "Különleges robotkar segít a sebészeknek a bonyolult műtétek során",
    "Új módszerrel vonnák ki a szén-dioxidot a légkörből a magyar mérnökök",
    "Így változtatja meg a kvantumszámítás a kiberbiztonság jövőjét"
  ],
  sport: [
    "Drámai hajrában aratott győzelmet a magyar válogatott az Európa-bajnoki selejtezőn",
    "Szoboszlai Dominik gólpasszal segítette csapatát a bajnoki rangadón",
    "Új magyar aranyérem született a kajak-kenu világbajnokságon",
    "Óriási meglepetés a tenisz-világbajnokságon: a favorit már az első körben kiesett",
    "Szenzációs formában játszik a magyar kézilabda-válogatott, elődöntőbe jutottak",
    "Megvan az új szövetségi kapitány: komoly tervekkel érkezik a tapasztalt szakember",
    "Újabb rangadót nyert meg a Ferencváros a labdarúgó-bajnokságban",
    "Fantasztikus egyéni csúccsal nyert ezüstérmet a magyar úszóklasszis",
    "Bejelentette visszavonulását a többszörös olimpiai bajnok magyar legenda",
    "Komoly átigazolási hírek: európai sztárcsapat csábítja a fiatal magyar tehetséget",
    "Rekordidővel nyerte meg a maratont a kenyai futózseni",
    "Óriási csatában védte meg világbajnoki címét a magyar kardcsapat",
    "Kihirdették a magyar olimpiai keret legújabb tagjait",
    "Új, ultramodern sportközpontot építenek [City]-ben a jövő tehetségeinek",
    "Szenzációsan kezdte az idényt a magyar gyorsasági motorversenyző"
  ],
  bulvar: [
    "Kiderült a titok: így telnek a népszerű magyar énekesnő hétköznapjai",
    "Hatalmas botrány a televíziós tehetségkutató forgatásán: élő adásban sétált ki a zsűri",
    "Luxusnyaralásról posztolt a magyar sztárpár: itt töltik az ünnepeket",
    "Meglepő vallomást tett a népszerű színművész a magánéletéről",
    "Különleges fotókat osztott meg rajongóival a híres magyar modell",
    "Váratlanul feloszlott a közkedvelt hazai popzenekar: megszólalt az alapító tag",
    "Titkos esküvő: szűk családi körben mondta ki a boldogító igent a magyar műsorvezető",
    "Íme a legújabb divatőrület a hazai sztárvilágban: mindenkinek ilyen cipője van",
    "Megható történetet osztott meg kutyájáról a népszerű magyar színésznő",
    "Visszatér a képernyőre a kilencvenes évek közkedvelt magyar talkshow-ja",
    "Így néz ki smink nélkül a népszerű hazai televíziós személyiség",
    "Kiderült, mennyi pénzt keresnek valójában a legsikeresebb magyar influenszerek",
    "Óriási bulival ünnepelte születésnapját a magyar zenei legenda",
    "Közös képpel jelentette be szerelmét a két ismert magyar fiatal",
    "Sokkban a rajongók: szakított a közkedvelt magyar álompár"
  ],
  eletmod: [
    "5 egyszerű módszer, amellyel csökkentheted a mindennapi stresszt",
    "Ezek a tavasz legnépszerűbb gasztronómiai trendjei: kipróbáltuk a Michelin-csillagos receptet",
    "Mit együnk a kánikulában? Dietetikus tanácsai a nyári napokra",
    "Így alakítsd át az otthonodat zöld oázissá: tippek a szobanövények gondozásához",
    "Kiderült, mi a hosszú élet titka ezen a csodás mediterrán szigeten",
    "Elképesztő változás: 45 kilót fogyott a magyar családanya ezzel az egyszerű étrenddel",
    "Hogyan aludjunk jobban? Alvásszakértő tippjei a pihentető éjszakákért",
    "Az 5 legjobb kirándulóhely Magyarországon, amit idén tavasszal fel kell keresned",
    "Ezért igyál citromos vizet minden reggel: lenyűgöző hatások a szervezetre",
    "Hogyan spóroljunk a havi bevásárláson? 7 bevált praktika háziasszonyoktól",
    "A jóga jótékony hatásai: így változtatja meg a tested és a lelked hetek alatt",
    "Különleges kávézók Budapesten, ahol garantáltan feltöltődsz a dolgos hétköznapokon",
    "Így válaszd ki a bőrtípusodnak megfelelő hidratáló krémet a tavaszi szélben",
    "A kovászos kenyér készítésének művészete: lépésről lépésre kezdőknek",
    "Ezek a legfontosabb vitaminok, amikre a szervezetednek szüksége van tavasszal"
  ],
  kultura: [
    "Hatalmas sikerrel nyitott a Szépművészeti Múzeum új kiállítása",
    "Új magyar játékfilmet mutatnak be a Cannes-i Fesztiválon: a kritikusok már most imádják",
    "Megjelent az év legjobban várt magyar regénye: azonnal a toplisták élére ugrott",
    "Nemzetközi elismerést kapott a Budapesti Fesztiválzenekar",
    "Különleges színházi bemutatóra készülnek a Vígszínházban",
    "Ritkán látott kincsek kerültek elő a Nemzeti Múzeum raktárából",
    "Kortárs magyar képzőművészek alkotásaiból nyílik szabadtéri tárlat a fővárosban",
    "Életműdíjat kapott a legendás magyar rendező a rangos fesztiválon",
    "Különleges akusztikus koncertet ad a közkedvelt magyar indie zenekar",
    "Ingyenes múzeumi belépés és tárlatvezetések a Múzeumok Éjszakáján",
    "Restaurálták az ikonikus magyar műemlék épület csodálatos freskóit",
    "Megdöbbentő levelek kerültek elő a híres magyar költő hagyatékából",
    "Új irodalmi kávéház nyílik a Palotanegyedben",
    "A legnépszerűbb magyar néptáncegyüttes világkörüli turnéra indul",
    "Megfilmesítik a zseniális magyar történelmi kalandregényt"
  ]
};

const CITIES = ["Budapest", "Debrecen", "Szeged", "Pécs", "Győr", "Miskolc", "Nyíregyháza", "Kecskemét", "Székesfehérvár", "Sopron"];
const COUNTRIES = ["Ausztria", "Horvátország", "Olaszország", "Spanyolország", "Görögország", "Németország", "Franciaország", "Románia"];
const CAPITALS = ["Bécs", "Róma", "Madrid", "Párizs", "Berlin", "London", "Prága", "Pozsony", "Zágráb"];
const SEASONS = ["nyári", "tavaszi", "őszi", "téli"];
const ACTIVITIES = ["kaland", "öko", "szabadidő", "családi", "vízi"];

const PUBLISHERS = [
  { slug: "index", name: "Index", bias: ["belfold", "kulfold", "sport", "bulvar", "tech"] },
  { slug: "telex", name: "Telex", bias: ["belfold", "kulfold", "gazdasag", "tech", "kultura"] },
  { slug: "24-hu", name: "24.hu", bias: ["belfold", "kulfold", "bulvar", "eletmod", "sport"] },
  { slug: "hvg", name: "HVG", bias: ["belfold", "kulfold", "gazdasag", "tech", "kultura"] },
  { slug: "444", name: "444", bias: ["belfold", "kulfold", "bulvar", "kultura"] },
  { slug: "portfolio", name: "Portfolio", bias: ["gazdasag", "belfold", "kulfold"] },
  { slug: "blikk", name: "Blikk", bias: ["bulvar", "sport", "eletmod", "belfold"] },
  { slug: "qubit", name: "Qubit", bias: ["tech"] },
  { slug: "g7", name: "G7", bias: ["gazdasag"] },
  { slug: "nepszava", name: "Népszava", bias: ["belfold", "kulfold", "kultura"] },
  { slug: "mandiner", name: "Mandiner", bias: ["belfold", "kulfold", "kultura"] }
];

const CATEGORIES = {
  all: "Összes hír",
  belfold: "Belföld",
  kulfold: "Külföld",
  gazdasag: "Gazdaság",
  tech: "Tech-Tudomány",
  sport: "Sport",
  bulvar: "Bulvár",
  eletmod: "Életmód",
  kultura: "Kultúra"
};

// --- APPLICATION STATE ---
let allNews = [];
let bookmarks = [];
let activeCategory = "all";
let activeTimeFilter = "all";
let activePublisher = "all";
let searchQuery = "";
let visibleNewsCount = 30;

// Current values for Widgets
let currentExchangeRates = {
  EUR: { val: 396.42, dir: "up", change: "+0.12%" },
  USD: { val: 364.18, dir: "down", change: "-0.08%" },
  CHF: { val: 402.15, dir: "up", change: "+0.24%" },
  BTC: { val: 68450, dir: "up", change: "+1.45%" }
};

const HOROSCOPE_TEXTS = {
  kos: "Ma tele vagy energiával! Olyan feladatokba is bátran belevághatsz, amelyeket korábban halogattál. A szerelemben kellemes meglepetés érhet.",
  bika: "Fontos pénzügyi döntés előtt állsz, de ne siess el semmit. Hallgass a megérzéseidre! Egy baráti beszélgetés ma új kapukat nyithat meg előtted.",
  ikrek: "A kommunikációs készséged ma a fegyvereddé válik. Bármilyen vitás helyzetet könnyedén elsimíthatsz a munkahelyeden vagy a családban.",
  rak: "Kicsit befelé fordulóbb napod lehet, ami tökéletes alkalom a tervezésre és a testi-lelki feltöltődésre. Kerüld a stresszes helyzeteket!",
  oroszlan: "A figyelem középpontjában tündökölhetsz. Remek ötleteid vannak, amelyeket a feletteseid is értékelni fognak. Este szánj időt a pihenésre.",
  szuz: "Rendkívül produktív nap áll előtted. Minden részletre odafigyelsz, így hibátlan munkát adsz ki a kezedből. Egy váratlan üzenet vidámmá teszi a délutánt.",
  merleg: "Törekedj a harmóniára az emberi kapcsolataidban. Egy kisebb félreértés tisztázódhat ma. Kedvező időszak új hobbi elkezdésére.",
  skorpio: "Mély érzelmek és nagy felismerések napja. Valami, ami régóta nyomaszt, végre megoldódhat. Pénzügyekben legyél kicsit óvatosabb.",
  nyilas: "Kalandvágyad és optimizmusod ma másokra is átragad. Kiváló alkalom utazások tervezésére vagy tanulmányok megkezdésére. Légy nyitott!",
  bak: "Kitartásod meghozza a gyümölcsét. Bár keményen kell dolgoznod, a siker garantált. Egészségedre figyelj jobban, igyál elég vizet!",
  vizonto: "Kreativitásod ma szárnyal. Olyan egyedi megoldások jutnak eszedbe, amelyekkel megleped a környezeted. Barátokkal teli, vidám este vár rád.",
  halak: "Intuíciód rendkívül erős ma. Képes vagy a sorok között olvasni, így könnyen átlátsz a szitán. Családod körében békés pillanatokra számíthatsz."
};

const WEATHER_DATA = {
  Budapest: { temp: 24, desc: "Napos", icon: "sunny" },
  Debrecen: { temp: 22, desc: "Enyhén felhős", icon: "partly-cloudy" },
  Szeged: { temp: 26, desc: "Derült", icon: "sunny" },
  Pécs: { temp: 23, desc: "Gomolyfelhők", icon: "partly-cloudy" },
  Győr: { temp: 21, desc: "Zápor", icon: "rainy" }
};

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
  init();
});

function init() {
  // Load saved bookmarks from localStorage
  const savedBookmarks = localStorage.getItem("hirkereso_bookmarks");
  if (savedBookmarks) {
    bookmarks = JSON.parse(savedBookmarks);
  }

  // Generate initial database of mock news
  allNews = generateMockNews(160);
  
  // Set date and name day
  setupDateAndNameDay();
  
  // Initial render of widgets
  renderWeather("Budapest");
  renderExchangeRates();
  renderHoroscope("kos");
  
  // Render main content
  renderNews();
  updateCategoryBadges();
  renderTop24();
  renderBookmarks();
  
  // Setup event handling
  setupEventListeners();
  
  // Start dynamic simulator for new articles
  setInterval(simulateLiveAggregation, 45000);
}

// --- DATA GENERATOR ENGINE ---
function generateMockNews(count) {
  const news = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const id = "news_" + Math.random().toString(36).substr(2, 9);
    
    // Select random category
    const catKeys = Object.keys(NEWS_TEMPLATES);
    const category = catKeys[Math.floor(Math.random() * catKeys.length)];
    
    // Choose suitable publisher based on bias
    const matchedPublishers = PUBLISHERS.filter(p => p.bias.includes(category));
    const publisher = matchedPublishers.length > 0 
      ? matchedPublishers[Math.floor(Math.random() * matchedPublishers.length)]
      : PUBLISHERS[Math.floor(Math.random() * PUBLISHERS.length)];
      
    // Generate authentic title
    const title = getRealisticTitle(category);
    
    // Calculate timestamp (spread news across last 72 hours)
    // The first 30 news should be newer (within last 4 hours)
    let minutesAgo;
    if (i < 30) {
      minutesAgo = Math.floor(Math.random() * 240); // 0 to 4 hours
    } else if (i < 80) {
      minutesAgo = Math.floor(Math.random() * 1200) + 240; // 4 to 24 hours
    } else {
      minutesAgo = Math.floor(Math.random() * 2880) + 1440; // 24 to 72 hours
    }
    
    const timestamp = new Date(now.getTime() - minutesAgo * 60000);
    
    // Importance / Click count for TOP list
    const clicks = Math.floor(Math.random() * 15000) + (i < 40 ? 5000 : 100);
    
    news.push({
      id,
      title,
      category,
      source: publisher.slug,
      sourceName: publisher.name,
      timestamp,
      clicks
    });
  }
  
  // Sort news by timestamp descending (newest first)
  return news.sort((a, b) => b.timestamp - a.timestamp);
}

function getRealisticTitle(category) {
  const templates = NEWS_TEMPLATES[category];
  let title = templates[Math.floor(Math.random() * templates.length)];
  
  // Replace tokens with high-fidelity random values
  title = title.replace("[City]", CITIES[Math.floor(Math.random() * CITIES.length)]);
  title = title.replace("[Country]", COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)]);
  title = title.replace("[Capital]", CAPITALS[Math.floor(Math.random() * CAPITALS.length)]);
  title = title.replace("[Season]", SEASONS[Math.floor(Math.random() * SEASONS.length)]);
  title = title.replace("[Activity]", ACTIVITIES[Math.floor(Math.random() * ACTIVITIES.length)]);
  title = title.replace("[Temp]", Math.floor(Math.random() * 6) + 38); // 38-43
  title = title.replace("[Number]", (Math.floor(Math.random() * 15) + 380)); // 380-395
  
  return title;
}

// --- DATE & NAMEDAY WIDGET SYSTEM ---
function setupDateAndNameDay() {
  const dateTodayEl = document.getElementById("date-today");
  const namedaySpan = document.getElementById("nameday-name");
  
  if (!dateTodayEl || !namedaySpan) return;
  
  const now = new Date();
  
  // Hungarian Month & Day formatting
  const months = ["január", "február", "március", "április", "május", "június", "július", "augusztus", "szeptember", "október", "november", "december"];
  const days = ["vasárnap", "hétfő", "kedd", "szerda", "csütörtök", "péntek", "szombat"];
  
  const monthStr = months[now.getMonth()];
  const dayName = days[now.getDay()];
  const formattedDate = `${now.getFullYear()}. ${monthStr} ${now.getDate()}., ${dayName}`;
  
  dateTodayEl.textContent = formattedDate;
  
  // Find Name day
  const m = now.getMonth();
  const d = now.getDate();
  const nameDay = NAMEDAYS[m] && NAMEDAYS[m][d] ? NAMEDAYS[m][d] : "Boldizsár";
  namedaySpan.textContent = nameDay;
}

// --- WEATHER WIDGET ---
function renderWeather(city) {
  const tempEl = document.getElementById("weather-temp-val");
  const descEl = document.getElementById("weather-desc-text");
  const iconEl = document.getElementById("weather-icon-box");
  
  if (!tempEl || !descEl || !iconEl) return;
  
  const data = WEATHER_DATA[city] || WEATHER_DATA["Budapest"];
  tempEl.textContent = `${data.temp}°C`;
  descEl.textContent = data.desc;
  
  // Render clean modern inline SVG icons based on weather state
  let svgIcon = "";
  if (data.icon === "sunny") {
    svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="weather-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>`;
  } else if (data.icon === "partly-cloudy") {
    svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="weather-icon-svg" style="color: hsl(210, 20%, 60%)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v2M4.93 4.93l1.41 1.41M20 12h2M19.07 4.93l-1.41 1.41"/><path d="M15.9 10.1A5 5 0 0 0 6 13c0 2.8 2.2 5 5 5h5a4 4 0 0 0 0-8h-.1z" fill="currentColor" fill-opacity="0.2"/></svg>`;
  } else {
    svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="weather-icon-svg" style="color: hsl(200, 70%, 50%)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 13a4 4 0 0 0-8 0 4 4 0 0 0 0 8h8a4 4 0 0 0 0-8z"/><path d="M8 15v4M12 17v4M16 15v4"/></svg>`;
  }
  iconEl.innerHTML = svgIcon;
}

// --- CURRENCY WIDGET ---
function renderExchangeRates() {
  const container = document.getElementById("exchange-rates-container");
  if (!container) return;
  
  container.innerHTML = Object.entries(currentExchangeRates).map(([code, data]) => {
    const isUp = data.dir === "up";
    const changeClass = isUp ? "up" : "down";
    const arrow = isUp ? "▲" : "▼";
    const symbol = code === "BTC" ? "$" : " Ft";
    
    return `
      <div class="currency-item">
        <div class="currency-info">
          <div class="currency-icon">${code === "BTC" ? "₿" : (code === "EUR" ? "€" : "$")}</div>
          <div>
            <span class="currency-code">${code}/HUF</span>
            <span class="currency-name">${code === "BTC" ? "Bitcoin" : (code === "EUR" ? "Euró" : "USA Dollár")}</span>
          </div>
        </div>
        <div class="currency-values">
          <div class="currency-price">${data.val.toLocaleString('hu-HU')}${symbol}</div>
          <span class="currency-change ${changeClass}">${arrow} ${data.change}</span>
        </div>
      </div>
    `;
  }).join("");
}

function updateExchangeRates() {
  // Simulate natural exchange fluctuation
  Object.keys(currentExchangeRates).forEach(code => {
    const rate = currentExchangeRates[code];
    const changePct = (Math.random() * 0.4 - 0.2); // -0.2% to +0.2%
    const direction = changePct >= 0 ? "up" : "down";
    const formattedPct = `${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%`;
    
    rate.val = +(rate.val * (1 + changePct / 100)).toFixed(code === "BTC" ? 0 : 2);
    rate.dir = direction;
    rate.change = formattedPct;
  });
  
  renderExchangeRates();
  showToast("Árfolyamok sikeresen frissítve!");
}

// --- HOROSCOPE WIDGET ---
function renderHoroscope(sign) {
  const container = document.getElementById("horoscope-text-box");
  if (!container) return;
  
  const text = HOROSCOPE_TEXTS[sign] || "Válassz csillagjegyet!";
  container.textContent = text;
}

// --- RENDER MAIN NEWS FEED ---
function renderNews(append = false) {
  const feedContainer = document.getElementById("news-feed-list");
  if (!feedContainer) return;
  
  // Pipeline: Apply Search, Category, Source, and Recency filters
  const filtered = allNews.filter(item => {
    // 1. Category Filter
    if (activeCategory !== "all" && item.category !== activeCategory) return false;
    
    // 2. Source Filter
    if (activePublisher !== "all" && item.source !== activePublisher) return false;
    
    // 3. Time range Filter
    if (activeTimeFilter !== "all") {
      const hoursAgo = (new Date() - item.timestamp) / 3600000;
      if (activeTimeFilter === "4h" && hoursAgo > 4) return false;
      if (activeTimeFilter === "12h" && hoursAgo > 12) return false;
      if (activeTimeFilter === "24h" && hoursAgo > 24) return false;
    }
    
    // 4. Search text Filter (accent insensitive mock)
    if (searchQuery) {
      const q = searchQuery.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const titleClean = item.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const sourceClean = item.sourceName.toLowerCase();
      if (!titleClean.includes(q) && !sourceClean.includes(q)) return false;
    }
    
    return true;
  });
  
  // Handle empty state
  if (filtered.length === 0) {
    feedContainer.innerHTML = `
      <div class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" class="empty-state-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div class="empty-state-title">Nincs találat</div>
        <div class="empty-state-desc">Próbáld megváltoztatni a szűrési feltételeket vagy a keresési kulcsszót!</div>
      </div>
    `;
    toggleLoadMoreBtn(false);
    return;
  }
  
  // Get slice of articles to display
  const sliced = filtered.slice(0, visibleNewsCount);
  
  // Map articles to high-density HTML markup
  const newsHtml = sliced.map(item => {
    const hoursAgo = (new Date() - item.timestamp) / 3600000;
    
    // Determine recency class
    let recencyClass = "old";
    if (hoursAgo <= 1) recencyClass = "fresh";
    else if (hoursAgo <= 4) recencyClass = "medium";
    
    // Format timestamp: "14:23" if today, otherwise "Tegnap 18:10" or date string
    const itemDate = item.timestamp;
    const today = new Date();
    let timeStr = "";
    
    if (itemDate.toDateString() === today.toDateString()) {
      timeStr = `${String(itemDate.getHours()).padStart(2, '0')}:${String(itemDate.getMinutes()).padStart(2, '0')}`;
    } else {
      const yesterday = new Date(today.getTime() - 86400000);
      if (itemDate.toDateString() === yesterday.toDateString()) {
        timeStr = `Tegnap ${String(itemDate.getHours()).padStart(2, '0')}:${String(itemDate.getMinutes()).padStart(2, '0')}`;
      } else {
        timeStr = `${itemDate.getMonth() + 1}.${itemDate.getDate()}. ${String(itemDate.getHours()).padStart(2, '0')}:${String(itemDate.getMinutes()).padStart(2, '0')}`;
      }
    }
    
    const isSaved = bookmarks.includes(item.id);
    const bookmarkClass = isSaved ? "bookmark-btn saved" : "bookmark-btn";
    
    // Elegant SVG Bookmark icons
    const bookmarkIcon = isSaved 
      ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M6.32 2.577a3 3 0 0 1 3.16.03l5.72 3.678a3 3 0 0 1 1.3 2.5v7.71a3 3 0 0 1-3.16 3H10.5v-3.75a.75.75 0 0 0-1.5 0v3.75H8.32a3 3 0 0 1-3.16-3V8.785a3 3 0 0 1 1.3-2.5l5.72-3.678Z" clip-rule="evenodd"/><path d="M12 2.25a.75.75 0 0 1 .75.75v12.75H12a.75.75 0 0 1 0-1.5h.75V3a.75.75 0 0 1 .75-.75Z" style="display:none"/><path d="M5.625 3.75a2.625 2.625 0 0 0-2.625 2.625v15.75a.75.75 0 0 0 1.285.53l6.465-6.465 6.465 6.465a.75.75 0 0 0 1.285-.53V6.375A2.625 2.625 0 0 0 18.375 3.75H5.625Z"/></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" /></svg>`;

    return `
      <article class="news-item" id="${item.id}">
        <div class="news-item-left">
          <span class="recency-indicator ${recencyClass}" title="Friss hír"></span>
          <span class="news-time">${timeStr}</span>
          <a href="#" class="news-title" onclick="event.preventDefault(); window.open('https://' + '${item.source}' + '.hu', '_blank')">${item.title}</a>
        </div>
        <div class="news-item-right">
          <span class="source-badge ${item.source}">${item.sourceName}</span>
          <span class="item-cat-badge">${CATEGORIES[item.category]}</span>
          <button class="${bookmarkClass}" onclick="toggleBookmark('${item.id}')" title="Könyvjelzőkhöz adás/eltávolítás">
            ${bookmarkIcon}
          </button>
        </div>
      </article>
    `;
  }).join("");
  
  if (append) {
    feedContainer.innerHTML += newsHtml;
  } else {
    feedContainer.innerHTML = newsHtml;
  }
  
  // Show / Hide Load More trigger
  toggleLoadMoreBtn(filtered.length > visibleNewsCount);
}

function toggleLoadMoreBtn(show) {
  const loadMoreEl = document.getElementById("load-more-btn-container");
  if (loadMoreEl) {
    loadMoreEl.style.display = show ? "flex" : "none";
  }
}

function loadMoreNews() {
  visibleNewsCount += 30;
  renderNews();
}

function updateCategoryBadges() {
  const buttons = document.querySelectorAll("#cat-list button");
  buttons.forEach(btn => {
    const cat = btn.getAttribute("data-cat");
    let count = 0;
    if (cat === "all") {
      count = allNews.length;
    } else {
      count = allNews.filter(item => item.category === cat).length;
    }
    const badge = btn.querySelector(".cat-badge");
    if (badge) {
      badge.textContent = count;
    }
  });
}

// --- RENDER TOP24 LIST ---
function renderTop24() {
  const container = document.getElementById("top-news-list-container");
  if (!container) return;
  
  // Get the highest clicked news (sorted by clicks)
  const topNews = [...allNews]
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);
    
  container.innerHTML = topNews.map((item, idx) => {
    return `
      <div class="top-news-item">
        <span class="top-rank">${idx + 1}</span>
        <div class="top-content">
          <a href="#" class="top-title" onclick="event.preventDefault(); window.open('https://' + '${item.source}' + '.hu', '_blank')">${item.title}</a>
          <div class="top-meta">
            <span class="top-source source-badge ${item.source}" style="padding:0 4px; font-size:10px">${item.sourceName}</span>
            <span>•</span>
            <span>${item.clicks.toLocaleString('hu-HU')} kattintás</span>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

// --- BOOKMARK SYSTEM ---
function toggleBookmark(id) {
  const idx = bookmarks.indexOf(id);
  const item = allNews.find(n => n.id === id);
  if (!item) return;
  
  if (idx === -1) {
    bookmarks.push(id);
    showToast(`Mentve a könyvjelzőkhöz!`);
  } else {
    bookmarks.splice(idx, 1);
    showToast("Eltávolítva a könyvjelzők közül!");
  }
  
  // Save to localStorage
  localStorage.setItem("hirkereso_bookmarks", JSON.stringify(bookmarks));
  
  // Re-render
  renderNews();
  renderBookmarks();
}

function renderBookmarks() {
  const container = document.getElementById("bookmark-list-container");
  if (!container) return;
  
  if (bookmarks.length === 0) {
    container.innerHTML = `<div class="bookmark-empty">Még nincsenek elmentett híreid. Kattints a hír melletti könyvjelző ikonra a mentéshez!</div>`;
    return;
  }
  
  // Find news objects for saved bookmark IDs
  const bookmarkedItems = allNews.filter(item => bookmarks.includes(item.id));
  
  container.innerHTML = bookmarkedItems.map(item => {
    return `
      <div class="bookmark-item">
        <a href="#" class="bookmark-item-title" onclick="event.preventDefault(); window.open('https://' + '${item.source}' + '.hu', '_blank')">${item.title}</a>
        <button class="remove-bookmark-btn" onclick="toggleBookmark('${item.id}')" title="Törlés">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
        </button>
      </div>
    `;
  }).join("");
}

// --- SIMULATED REAL-TIME NEWS AGGREGATION ---
function simulateLiveAggregation() {
  const now = new Date();
  const catKeys = Object.keys(NEWS_TEMPLATES);
  const category = catKeys[Math.floor(Math.random() * catKeys.length)];
  
  const matchedPublishers = PUBLISHERS.filter(p => p.bias.includes(category));
  const publisher = matchedPublishers[Math.floor(Math.random() * matchedPublishers.length)];
  const title = getRealisticTitle(category);
  
  const id = "news_" + Math.random().toString(36).substr(2, 9);
  const newArticle = {
    id,
    title,
    category,
    source: publisher.slug,
    sourceName: publisher.name,
    timestamp: now,
    clicks: 0
  };
  
  // Insert at the absolute beginning of our database
  allNews.unshift(newArticle);
  
  // Cap aggregate memory size to 300 to prevent heavy browser DOM footprint
  if (allNews.length > 300) {
    allNews.pop();
  }
  
  // Re-evaluate render if it fits our current filter selections
  let isMatchesActiveFilters = true;
  if (activeCategory !== "all" && category !== activeCategory) isMatchesActiveFilters = false;
  if (activePublisher !== "all" && publisher.slug !== activePublisher) isMatchesActiveFilters = false;
  
  if (isMatchesActiveFilters) {
    // Show toast for real-time aggregation updates
    showToast(`Új hír érkezett: ${publisher.name}`);
    renderNews();
  }
  updateCategoryBadges();
}

// --- EVENT HANDLERS & LISTENERS ---
function setupEventListeners() {
  // Category quick-filters (Sidebar left navigation)
  const catBtns = document.querySelectorAll("#cat-list button");
  catBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
      catBtns.forEach(b => b.closest(".cat-nav-item").classList.remove("active"));
      const parentLi = btn.closest(".cat-nav-item");
      parentLi.classList.add("active");
      
      activeCategory = btn.getAttribute("data-cat");
      visibleNewsCount = 30; // reset scroll count
      renderNews();
    });
  });
  
  // Time scale filters (Center column top)
  const timeBtns = document.querySelectorAll(".time-btn");
  timeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      timeBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      activeTimeFilter = btn.getAttribute("data-time");
      visibleNewsCount = 30; // reset scroll count
      renderNews();
    });
  });
  
  // Publisher tag filters (Center column publisher bar)
  const pubTags = document.querySelectorAll(".pub-tag");
  pubTags.forEach(tag => {
    tag.addEventListener("click", () => {
      const isAlreadyActive = tag.classList.contains("active");
      
      pubTags.forEach(t => t.classList.remove("active"));
      
      if (isAlreadyActive) {
        activePublisher = "all";
      } else {
        tag.classList.add("active");
        activePublisher = tag.getAttribute("data-pub");
      }
      
      visibleNewsCount = 30; // reset scroll count
      renderNews();
    });
  });
  
  // Search bar input handling (Live search with debounce)
  const searchInput = document.getElementById("search-news");
  if (searchInput) {
    let searchDebounceTimer;
    searchInput.addEventListener("input", (e) => {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        searchQuery = e.target.value.trim();
        visibleNewsCount = 30; // reset scroll count
        renderNews();
      }, 250);
    });
  }
  
  // Weather location change
  const weatherSelect = document.getElementById("weather-city-select");
  if (weatherSelect) {
    weatherSelect.addEventListener("change", (e) => {
      renderWeather(e.target.value);
    });
  }
  
  // Horoscope sign change
  const horoscopeSelect = document.getElementById("horoscope-sign-select");
  if (horoscopeSelect) {
    horoscopeSelect.addEventListener("change", (e) => {
      renderHoroscope(e.target.value);
    });
  }
}

// --- PREMIUM TOAST NOTIFICATION ---
function showToast(message) {
  const toast = document.getElementById("toast-alert");
  const toastText = document.getElementById("toast-text");
  
  if (!toast || !toastText) return;
  
  toastText.textContent = message;
  toast.classList.add("show");
  
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3500);
}
