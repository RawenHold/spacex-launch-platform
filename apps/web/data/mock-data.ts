import type {
  Article,
  FAQItem,
  Launch,
  MissionTimelineEvent,
  NewsItem,
  SourceRecord,
} from "@/types/space"

const mockSource: SourceRecord = {
  id: "mock-planning-dataset",
  kind: "mock_dataset",
  title: {
    en: "Internal MVP mock planning dataset",
    ru: "Внутренний тестовый набор данных MVP",
  },
  publisher: "SpaceX MVP workspace",
  confidenceLevel: "estimated",
  isPrimary: false,
  notes: {
    en: "Placeholder data created for UI development. Not official launch data.",
    ru: "Тестовые данные для разработки интерфейса. Не являются официальными данными о запуске.",
  },
}

const officialChannelSource: SourceRecord = {
  id: "official-youtube-channel",
  kind: "official_youtube",
  title: {
    en: "Official SpaceX YouTube channel",
    ru: "Официальный YouTube-канал SpaceX",
  },
  publisher: "SpaceX",
  url: "https://www.youtube.com/@SpaceX",
  confidenceLevel: "official_confirmed",
  isPrimary: true,
  notes: {
    en: "Channel existence is official; attached stream placeholders are still mock values.",
    ru: "Канал официальный; привязанные трансляции в MVP остаются тестовыми значениями.",
  },
}

function timeline(prefix: string): MissionTimelineEvent[] {
  return [
    {
      id: `${prefix}-liftoff`,
      type: "liftoff",
      title: { en: "Liftoff", ru: "Старт" },
      description: {
        en: "The vehicle clears the pad and begins powered ascent.",
        ru: "Ракета покидает стартовый стол и начинает активный участок подъема.",
      },
      relativeTime: "T+00:00",
      status: "planned",
      confidenceLevel: "estimated",
    },
    {
      id: `${prefix}-max-q`,
      type: "max_q",
      title: { en: "Max Q", ru: "Max Q" },
      description: {
        en: "Maximum aerodynamic pressure during ascent.",
        ru: "Момент максимального аэродинамического давления при подъеме.",
      },
      relativeTime: "T+01:12",
      status: "estimated",
      confidenceLevel: "estimated",
    },
    {
      id: `${prefix}-meco`,
      type: "meco",
      title: { en: "MECO", ru: "MECO" },
      description: {
        en: "Main engine cutoff before stage separation.",
        ru: "Отключение маршевых двигателей перед разделением ступеней.",
      },
      relativeTime: "T+02:30",
      status: "estimated",
      confidenceLevel: "estimated",
    },
    {
      id: `${prefix}-stage-separation`,
      type: "stage_separation",
      title: { en: "Stage separation", ru: "Разделение ступеней" },
      description: {
        en: "The first stage separates from the upper stage.",
        ru: "Первая ступень отделяется от верхней ступени.",
      },
      relativeTime: "T+02:42",
      status: "estimated",
      confidenceLevel: "estimated",
    },
    {
      id: `${prefix}-ses`,
      type: "ses",
      title: { en: "SES", ru: "SES" },
      description: {
        en: "Second engine start for orbital insertion.",
        ru: "Запуск двигателя второй ступени для выхода на расчетную траекторию.",
      },
      relativeTime: "T+02:50",
      status: "estimated",
      confidenceLevel: "estimated",
    },
    {
      id: `${prefix}-seco`,
      type: "seco",
      title: { en: "SECO", ru: "SECO" },
      description: {
        en: "Second engine cutoff after ascent burn.",
        ru: "Отключение двигателя второй ступени после участка выведения.",
      },
      relativeTime: "T+08:35",
      status: "estimated",
      confidenceLevel: "estimated",
    },
    {
      id: `${prefix}-landing-burn`,
      type: "landing_burn",
      title: { en: "Landing burn", ru: "Посадочный импульс" },
      description: {
        en: "The booster reignites for final descent control.",
        ru: "Ускоритель повторно включает двигатели для финального управления снижением.",
      },
      relativeTime: "T+08:45",
      status: "estimated",
      confidenceLevel: "estimated",
    },
    {
      id: `${prefix}-booster-landing`,
      type: "booster_landing",
      title: { en: "Booster landing", ru: "Посадка ускорителя" },
      description: {
        en: "The booster targets a landing pad or droneship placeholder.",
        ru: "Ускоритель наводится на посадочную площадку или условную платформу.",
      },
      relativeTime: "T+09:10",
      status: "estimated",
      confidenceLevel: "estimated",
    },
    {
      id: `${prefix}-payload`,
      type: "payload_deployment",
      title: { en: "Payload deployment", ru: "Отделение полезной нагрузки" },
      description: {
        en: "Payload deployment or orbit insertion milestone.",
        ru: "Отделение полезной нагрузки или ключевая точка выхода на орбиту.",
      },
      relativeTime: "T+59:00",
      status: "estimated",
      confidenceLevel: "estimated",
    },
  ]
}

export const launches: Launch[] = [
  {
    id: "upcoming-starlink-falcon9",
    slug: "starlink-group-12-9-mock",
    missionName: {
      en: "Starlink Group 12-9",
      ru: "Starlink Group 12-9",
    },
    summary: {
      en: "Mock Falcon 9 Starlink deployment mission for the public MVP.",
      ru: "Тестовая миссия Falcon 9 по выводу Starlink для публичного MVP.",
    },
    details: {
      en: "This placeholder mission demonstrates launch cards, countdowns, a planned timeline, and source-confidence display.",
      ru: "Эта тестовая миссия показывает карточки запусков, обратный отсчет, плановый таймлайн и отображение доверия к источникам.",
    },
    status: "tbd",
    category: "starlink",
    missionType: "communications",
    rocket: { id: "falcon-9", name: "Falcon 9", family: "falcon_9" },
    launchPad: {
      id: "scl-40",
      name: "SLC-40",
      location: {
        en: "Cape Canaveral Space Force Station, Florida",
        ru: "Мыс Канаверал, Флорида",
      },
    },
    netUtc: "2026-07-10T02:14:00.000Z",
    windowEndUtc: "2026-07-10T06:14:00.000Z",
    orbit: { en: "Low Earth orbit", ru: "Низкая околоземная орбита" },
    trajectory: { en: "Northeast ascent corridor", ru: "Северо-восточный коридор подъема" },
    payload: { en: "Starlink broadband satellites", ru: "Спутники широкополосной связи Starlink" },
    videos: [
      {
        id: "starlink-placeholder-stream",
        provider: "youtube",
        title: { en: "Official livestream placeholder", ru: "Плейсхолдер официальной трансляции" },
        url: "https://www.youtube.com/@SpaceX",
        state: "upcoming",
        sourceLabel: { en: "Official channel placeholder", ru: "Плейсхолдер официального канала" },
        isPlaceholder: true,
      },
    ],
    timeline: timeline("starlink"),
    sourceRecords: [mockSource, officialChannelSource],
    confidenceLevel: "estimated",
    isMock: true,
    tags: ["mock", "upcoming", "starlink", "falcon-9"],
  },
  {
    id: "upcoming-starship-test",
    slug: "starship-integrated-test-mock",
    missionName: {
      en: "Starship Integrated Test",
      ru: "Интегрированное испытание Starship",
    },
    summary: {
      en: "Mock Starship test flight-style mission with ascent, separation, and splashdown placeholders.",
      ru: "Тестовая миссия в стиле испытательного полета Starship с условными этапами подъема, разделения и приводнения.",
    },
    details: {
      en: "The mission animation uses original vector geometry to suggest a Starship-like stack without copying official assets.",
      ru: "Анимация использует оригинальную векторную геометрию, напоминающую компоновку Starship без копирования официальных ассетов.",
    },
    status: "tbd",
    category: "starship",
    missionType: "test_flight",
    rocket: { id: "starship", name: "Starship-class vehicle", family: "starship" },
    launchPad: {
      id: "starbase",
      name: "Starbase OLP",
      location: { en: "South Texas", ru: "Южный Техас" },
    },
    netUtc: "2026-08-21T13:30:00.000Z",
    orbit: {
      en: "Suborbital / near-orbital test profile",
      ru: "Суборбитальный / околоорбитальный испытательный профиль",
    },
    trajectory: { en: "Gulf-to-ocean test corridor", ru: "Испытательный коридор от побережья к океану" },
    payload: { en: "Vehicle test objectives", ru: "Цели испытаний корабля" },
    videos: [],
    timeline: timeline("starship"),
    sourceRecords: [mockSource],
    confidenceLevel: "estimated",
    isMock: true,
    tags: ["mock", "upcoming", "starship"],
  },
  {
    id: "upcoming-crew-dragon",
    slug: "crew-dragon-orbital-mission-mock",
    missionName: {
      en: "Crew Dragon Orbital Mission",
      ru: "Орбитальная миссия Crew Dragon",
    },
    summary: {
      en: "Mock crew/Dragon-type launch for bilingual mission detail and safety-copy patterns.",
      ru: "Тестовый запуск типа Crew/Dragon для двуязычной страницы миссии и важных пояснений.",
    },
    details: {
      en: "This placeholder prepares the data model for crew, cargo, and NASA-related source records.",
      ru: "Этот плейсхолдер готовит модель данных для экипажей, грузов и источников NASA.",
    },
    status: "hold",
    category: "dragon_crew",
    missionType: "crew",
    rocket: { id: "falcon-9", name: "Falcon 9 + Dragon", family: "dragon_crew" },
    launchPad: {
      id: "lc-39a",
      name: "LC-39A",
      location: { en: "Kennedy Space Center, Florida", ru: "Космический центр Кеннеди, Флорида" },
    },
    netUtc: "2026-09-14T18:45:00.000Z",
    orbit: { en: "Low Earth orbit rendezvous profile", ru: "Профиль сближения на низкой околоземной орбите" },
    trajectory: { en: "Northeast ascent corridor", ru: "Северо-восточный коридор подъема" },
    payload: { en: "Crew Dragon spacecraft", ru: "Корабль Crew Dragon" },
    videos: [],
    timeline: timeline("crew-dragon"),
    sourceRecords: [mockSource],
    confidenceLevel: "unverified",
    isMock: true,
    tags: ["mock", "upcoming", "dragon", "crew"],
  },
  {
    id: "past-falcon-heavy",
    slug: "falcon-heavy-demonstration-replay-mock",
    missionName: { en: "Falcon Heavy Demo Replay", ru: "Falcon Heavy Demo Replay" },
    summary: {
      en: "Mock past Falcon Heavy card for archive and replay states.",
      ru: "Тестовая прошедшая миссия Falcon Heavy для архива и режима replay.",
    },
    details: {
      en: "Archive record used to validate past mission summaries and replay CTAs.",
      ru: "Архивная запись для проверки summary прошедших миссий и CTA для replay.",
    },
    status: "success",
    category: "falcon_heavy",
    missionType: "test_flight",
    rocket: { id: "falcon-heavy", name: "Falcon Heavy", family: "falcon_heavy" },
    launchPad: {
      id: "lc-39a",
      name: "LC-39A",
      location: { en: "Kennedy Space Center, Florida", ru: "Космический центр Кеннеди, Флорида" },
    },
    netUtc: "2026-03-03T20:20:00.000Z",
    orbit: { en: "Demonstration orbit", ru: "Демонстрационная орбита" },
    trajectory: { en: "Eastward ascent corridor", ru: "Восточный коридор подъема" },
    payload: { en: "Demo payload placeholder", ru: "Тестовая полезная нагрузка" },
    result: { en: "Successful mock replay", ru: "Успешный тестовый replay" },
    videos: [
      {
        id: "falcon-heavy-replay-placeholder",
        provider: "youtube",
        title: { en: "Replay placeholder", ru: "Плейсхолдер записи" },
        url: "https://www.youtube.com/@SpaceX",
        state: "completed",
        sourceLabel: { en: "Official channel placeholder", ru: "Плейсхолдер официального канала" },
        isPlaceholder: true,
      },
    ],
    timeline: timeline("falcon-heavy"),
    sourceRecords: [mockSource, officialChannelSource],
    confidenceLevel: "estimated",
    isMock: true,
    tags: ["mock", "past", "falcon-heavy"],
  },
  {
    id: "past-cargo-dragon",
    slug: "cargo-dragon-resupply-mock",
    missionName: { en: "Cargo Dragon Resupply", ru: "Грузовая миссия Dragon" },
    summary: {
      en: "Mock cargo/Dragon-type past launch with education-focused replay text.",
      ru: "Тестовый прошедший запуск Cargo Dragon с обучающим описанием replay.",
    },
    details: {
      en: "Prepared for future NASA source linking and article/news cross-references.",
      ru: "Подготовлено для будущих ссылок на источники NASA и связей со статьями/новостями.",
    },
    status: "success",
    category: "dragon_crew",
    missionType: "cargo",
    rocket: { id: "falcon-9", name: "Falcon 9 + Cargo Dragon", family: "dragon_crew" },
    launchPad: {
      id: "scl-40",
      name: "SLC-40",
      location: { en: "Cape Canaveral Space Force Station, Florida", ru: "Мыс Канаверал, Флорида" },
    },
    netUtc: "2025-12-18T09:12:00.000Z",
    orbit: { en: "ISS rendezvous profile", ru: "Профиль сближения с МКС" },
    trajectory: { en: "Northeast ascent corridor", ru: "Северо-восточный коридор подъема" },
    payload: { en: "Cargo Dragon spacecraft", ru: "Грузовой корабль Dragon" },
    result: { en: "Successful mock archive", ru: "Успешная тестовая архивная запись" },
    videos: [],
    timeline: timeline("cargo-dragon"),
    sourceRecords: [mockSource],
    confidenceLevel: "estimated",
    isMock: true,
    tags: ["mock", "past", "dragon", "cargo"],
  },
  {
    id: "past-starship-hop",
    slug: "starship-landing-test-mock",
    missionName: { en: "Starship Landing Test", ru: "Тест посадки Starship" },
    summary: {
      en: "Mock Starship category card for past launch grouping.",
      ru: "Тестовая карточка категории Starship для группировки архива.",
    },
    details: {
      en: "Used to exercise Starship category filtering and animation copy.",
      ru: "Используется для проверки фильтра Starship и текстов анимации.",
    },
    status: "partial_failure",
    category: "starship",
    missionType: "test_flight",
    rocket: { id: "starship", name: "Starship-class vehicle", family: "starship" },
    launchPad: {
      id: "starbase",
      name: "Starbase test pad",
      location: { en: "South Texas", ru: "Южный Техас" },
    },
    netUtc: "2025-10-07T15:00:00.000Z",
    orbit: { en: "Atmospheric test", ru: "Атмосферное испытание" },
    trajectory: { en: "Low-altitude test profile", ru: "Низковысотный испытательный профиль" },
    payload: { en: "Vehicle test objectives", ru: "Цели испытаний корабля" },
    result: { en: "Partial mock objective", ru: "Частично выполненная тестовая цель" },
    videos: [],
    timeline: timeline("starship-hop"),
    sourceRecords: [mockSource],
    confidenceLevel: "estimated",
    isMock: true,
    tags: ["mock", "past", "starship"],
  },
]

export const articles: Article[] = [
  {
    id: "article-timeline",
    slug: "understanding-launch-timeline",
    title: {
      en: "Understanding a launch timeline",
      ru: "Как читать таймлайн запуска",
    },
    excerpt: {
      en: "A compact guide to Liftoff, Max Q, MECO, SECO, landing burn, and payload deployment.",
      ru: "Краткий гид по Liftoff, Max Q, MECO, SECO, посадочному импульсу и отделению нагрузки.",
    },
    category: "education",
    readingMinutes: 5,
    publishedAt: "2026-05-01T10:00:00.000Z",
    isMock: true,
  },
  {
    id: "article-confidence",
    slug: "why-source-confidence-matters",
    title: {
      en: "Why source confidence matters",
      ru: "Почему важен уровень доверия к источникам",
    },
    excerpt: {
      en: "How official, admin-verified, estimated, and conflicting labels protect launch accuracy.",
      ru: "Как метки официальных, проверенных, оценочных и конфликтующих данных защищают точность.",
    },
    category: "data",
    readingMinutes: 4,
    publishedAt: "2026-05-10T10:00:00.000Z",
    isMock: true,
  },
  {
    id: "article-animation",
    slug: "designing-2d5-launch-motion",
    title: {
      en: "Designing 2.5D launch motion",
      ru: "Проектирование 2.5D-анимации запуска",
    },
    excerpt: {
      en: "How vector motion can explain ascent and recovery without pretending to be telemetry.",
      ru: "Как векторная анимация объясняет подъем и возврат, не притворяясь телеметрией.",
    },
    category: "design",
    readingMinutes: 6,
    publishedAt: "2026-05-18T10:00:00.000Z",
    isMock: true,
  },
]

export const newsItems: NewsItem[] = [
  {
    id: "news-source-sync",
    slug: "source-sync-planned",
    title: {
      en: "Source sync architecture prepared",
      ru: "Архитектура синхронизации источников подготовлена",
    },
    summary: {
      en: "Launch Library, official pages, NASA, FAA, and YouTube can be added behind the mock layer in later stages.",
      ru: "Launch Library, официальные страницы, NASA, FAA и YouTube можно подключить поверх мок-слоя позже.",
    },
    sourceLabel: "Internal MVP note",
    publishedAt: "2026-05-20T12:00:00.000Z",
    confidenceLevel: "estimated",
    isMock: true,
  },
  {
    id: "news-admin-drafts",
    slug: "admin-drafts-next",
    title: {
      en: "Admin draft workflow reserved for Stage 3",
      ru: "AI draft workflow зарезервирован для Stage 3",
    },
    summary: {
      en: "The public MVP reserves data structures for drafts, approvals, and source conflict review.",
      ru: "Публичный MVP резервирует структуры для черновиков, согласований и ревью конфликтов источников.",
    },
    sourceLabel: "Product roadmap",
    publishedAt: "2026-05-22T12:00:00.000Z",
    confidenceLevel: "admin_verified",
    isMock: true,
  },
]

export const faqs: FAQItem[] = [
  {
    id: "faq-basics-1",
    group: "basics",
    question: {
      en: "Is this an official SpaceX website?",
      ru: "Это официальный сайт SpaceX?",
    },
    answer: {
      en: "No. This MVP is independent and uses mock data. It does not use official brand assets or live telemetry.",
      ru: "Нет. Это независимый MVP на мок-данных. Он не использует официальные бренд-ассеты или live-телеметрию.",
    },
    isMock: true,
  },
  {
    id: "faq-falcon9-1",
    group: "falcon9",
    question: {
      en: "What is Falcon 9?",
      ru: "Что такое Falcon 9?",
    },
    answer: {
      en: "Falcon 9 is represented here as a reusable launch vehicle family for mock mission cards.",
      ru: "Здесь Falcon 9 представлен как семейство многоразовых ракет для тестовых карточек миссий.",
    },
    isMock: true,
  },
  {
    id: "faq-starship-1",
    group: "starship",
    question: {
      en: "Why does the Starship animation look abstract?",
      ru: "Почему анимация Starship выглядит абстрактно?",
    },
    answer: {
      en: "The animation uses original vector shapes so the platform can suggest vehicle classes without copying official assets.",
      ru: "Анимация использует оригинальные векторные формы, чтобы намекать на класс ракеты без копирования официальных ассетов.",
    },
    isMock: true,
  },
  {
    id: "faq-timeline-1",
    group: "timeline",
    question: {
      en: "What is Max Q?",
      ru: "Что такое Max Q?",
    },
    answer: {
      en: "Max Q is the point of maximum aerodynamic pressure during ascent.",
      ru: "Max Q — момент максимального аэродинамического давления во время подъема.",
    },
    isMock: true,
  },
  {
    id: "faq-livestreams-1",
    group: "livestreams",
    question: {
      en: "Why are livestreams placeholders?",
      ru: "Почему трансляции пока плейсхолдеры?",
    },
    answer: {
      en: "Stage 2 avoids real API integrations. Verified YouTube videos can be attached once source sync or admin review exists.",
      ru: "Stage 2 не подключает реальные API. Проверенные YouTube-видео можно добавить после синхронизации источников или админ-ревью.",
    },
    isMock: true,
  },
  {
    id: "faq-accuracy-1",
    group: "accuracy",
    question: {
      en: "How does the site handle estimated data?",
      ru: "Как сайт работает с оценочными данными?",
    },
    answer: {
      en: "Estimated data is labeled as estimated and must never be presented as official telemetry.",
      ru: "Оценочные данные помечаются как оценочные и не должны выдаваться за официальную телеметрию.",
    },
    isMock: true,
  },
  {
    id: "faq-reminders-1",
    group: "reminders",
    question: {
      en: "Do reminders work in this MVP?",
      ru: "Работают ли напоминания в этом MVP?",
    },
    answer: {
      en: "Reminder buttons are placeholders that prepare the workflow for calendar export and notifications.",
      ru: "Кнопки напоминаний — плейсхолдеры для будущего экспорта календаря и уведомлений.",
    },
    isMock: true,
  },
]

export const timelineExplainers = [
  "max_q",
  "meco",
  "seco",
  "booster_landing",
  "payload_deployment",
] as const
