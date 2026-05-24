import { en } from "./en"

export const ru: typeof en = {
  localeName: "Русский",
  meta: {
    homeTitle: "Платформа запусков SpaceX",
    homeDescription:
      "Публичный MVP на мок-данных: будущие запуски, таймлайны миссий, обратный отсчет, места для трансляций и прозрачность источников.",
    upcomingTitle: "Будущие запуски",
    pastTitle: "Прошедшие запуски",
    calendarTitle: "Календарь запусков",
    articlesTitle: "Статьи",
    newsTitle: "Новости компании",
    faqTitle: "FAQ",
  },
  nav: {
    home: "Главная",
    upcoming: "Будущие",
    past: "Архив",
    calendar: "Календарь",
    articles: "Статьи",
    news: "Новости",
    faq: "FAQ",
  },
  common: {
    mockNotice: "Мок-данные планирования",
    mockWarning:
      "В этом MVP используются тестовые данные. Это не официальная телеметрия в реальном времени.",
    utc: "UTC",
    localTime: "Локальное время",
    localPlaceholder: "Плейсхолдер времени браузера",
    sourceTransparency: "Прозрачность источников",
    filters: "Фильтры",
    all: "Все",
    reset: "Сбросить",
    readMore: "Читать",
    externalSource: "Внешний источник",
    missionDetails: "Детали миссии",
    watchOnline: "Смотреть онлайн",
    moreInformation: "Подробнее",
    addReminder: "Напомнить",
    reminderAdded: "Напоминание добавлено",
    exportIcs: "Экспорт .ics",
    googleCalendar: "Google Calendar",
    noStream: "Трансляция пока недоступна",
    officialLink: "Официальная ссылка",
    sourceList: "Список источников",
    payload: "Полезная нагрузка",
    orbit: "Орбита",
    trajectory: "Траектория",
    launchPad: "Стартовая площадка",
    rocket: "Ракета",
    status: "Статус",
    result: "Результат",
  },
  home: {
    eyebrow: "Публичный режим mission control",
    title: "Пусковая аналитика новой эпохи",
    subtitle:
      "Двуязычная платформа запусков: страницы миссий, обратный отсчет, плановые таймлайны, встраивание трансляций и метки доверия к данным.",
    nextLaunch: "Следующий запуск",
    timelinePreview: "Превью таймлайна",
    upcomingPreview: "Будущие запуски",
    pastPreview: "Архив по категориям",
    articlesPreview: "Статьи",
    newsPreview: "Новости компании",
    faqPreview: "Превью FAQ",
  },
  pages: {
    upcoming: {
      eyebrow: "Манифест",
      title: "Будущие запуски",
      subtitle:
        "Фильтруйте тестовые записи по ракете, площадке, типу миссии и статусу. Реальная синхронизация появится позже.",
    },
    past: {
      eyebrow: "Архив",
      title: "Прошедшие запуски",
      subtitle:
        "Карточки в стиле replay, сгруппированные по семейству ракеты и категории миссии.",
    },
    calendar: {
      eyebrow: "Расписание",
      title: "Календарь запусков",
      subtitle:
        "Гибрид месячного и списочного календаря с плейсхолдерами напоминаний и экспорта.",
    },
    articles: {
      eyebrow: "Брифинги",
      title: "Статьи",
      subtitle:
        "SEO-ready карточки для образовательных и редакционных материалов будущей CMS.",
    },
    news: {
      eyebrow: "Сигналы",
      title: "Новости компании",
      subtitle:
        "Тестовые новости с метками источников и уровнем доверия для будущего импорта.",
    },
    faq: {
      eyebrow: "Справочник",
      title: "FAQ",
      subtitle:
        "Сгруппированные ответы о запусках, ракетах, трансляциях, терминах, точности данных и напоминаниях.",
    },
  },
  filters: {
    rocket: "Ракета",
    pad: "Площадка",
    missionType: "Тип миссии",
    status: "Статус",
    category: "Категория",
  },
  launchStatus: {
    go: "Готов",
    tbd: "Уточняется",
    hold: "Пауза",
    success: "Успех",
    partial_failure: "Частичный сбой",
    failure: "Сбой",
    scrubbed: "Отмена",
    unknown: "Неизвестно",
  },
  confidence: {
    official_confirmed: "Официально подтверждено",
    admin_verified: "Проверено админом",
    multi_source_confirmed: "Подтверждено несколькими источниками",
    estimated: "Оценка",
    unverified: "Не проверено",
    conflicting: "Конфликт данных",
  },
  timelineStatus: {
    planned: "План",
    confirmed: "Подтверждено",
    skipped: "Пропущено",
    failed: "Сбой",
    estimated: "Оценка",
  },
  missionTypes: {
    communications: "Связь",
    crew: "Экипаж",
    cargo: "Груз",
    test_flight: "Испытание",
    rideshare: "Попутная миссия",
    science: "Наука",
    other: "Другое",
  },
  categories: {
    starship: "Starship",
    falcon_9: "Falcon 9",
    falcon_heavy: "Falcon Heavy",
    dragon_crew: "Dragon / Crew",
    starlink: "Starlink",
    other: "Другое",
  },
  youtube: {
    upcoming: "Будущая трансляция",
    live: "В эфире",
    completed: "Запись",
    unavailable: "Недоступно",
    placeholder:
      "Зона трансляции готова. Проверенное YouTube-видео можно подключить при синхронизации источников или ревью админа.",
  },
  countdown: {
    label: "Обратный отсчет",
    days: "Дни",
    hours: "Часы",
    minutes: "Минуты",
    seconds: "Секунды",
    elapsed: "Окно запуска прошло",
  },
  detail: {
    dataWarning:
      "В этой миссии есть оценочные или тестовые значения. Не воспринимайте страницу как официальную телеметрию.",
    educational: "Термины таймлайна",
    animationTitle: "2.5D-анимация миссии",
    animationDescription:
      "Оригинальная векторная схема подъема, разделения ступеней, возврата ускорителя, посадочного импульса и вывода нагрузки.",
  },
  faqGroups: {
    basics: "Основы SpaceX",
    falcon9: "Falcon 9",
    starship: "Starship",
    timeline: "Термины таймлайна",
    livestreams: "Трансляции",
    accuracy: "Точность данных",
    reminders: "Напоминания",
  },
  footer: {
    description:
      "Независимый MVP платформы запусков SpaceX. Использует мок-данные и метки доверия к источникам.",
    disclaimer:
      "Проект не связан со SpaceX. В MVP не используются официальные бренд-ассеты или телеметрия в реальном времени.",
  },
}
