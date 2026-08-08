"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type LessonPhase = "start" | "execution" | "feedback" | "data";

type ConsultingLesson = {
  id: string;
  title: string;
  phase: LessonPhase;
  summary: string;
  actions: string[];
  deliverable: string;
  metrics?: string;
};

type ConsultingModule = {
  id: string;
  title: string;
  description: string;
  lessons: ConsultingLesson[];
};

type ConsultingStage = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  outcome: string;
  modules: ConsultingModule[];
};

type ConsultingProgress = {
  completed: string[];
  notes: Record<string, string>;
  activeLessonId: string;
};

const ACCENT = "#5B7CFA";
const GREEN = "#16A36A";
const EMPTY_PROGRESS: ConsultingProgress = {
  completed: [],
  notes: {},
  activeLessonId: "start-onboarding",
};

const phaseLabel: Record<LessonPhase, string> = {
  start: "Start Here",
  execution: "Value + Execution",
  feedback: "Feedback & Revision",
  data: "Data & Repeat",
};

const lessonCycle = (
  id: string,
  title: string,
  context: string,
  actions: string[],
  deliverable: string,
  metrics: string,
): ConsultingLesson[] => [
  {
    id: `${id}-execution`,
    title: `${title} — Value + Execution`,
    phase: "execution",
    summary: `${context} В этом уроке ты не просто разбираешь принцип, а сразу применяешь его к своему бизнесу. Задача — закончить урок с первой рабочей версией, которую можно показать на разборе.`,
    actions,
    deliverable,
    metrics,
  },
  {
    id: `${id}-feedback`,
    title: `${title} — Feedback & Revision`,
    phase: "feedback",
    summary: `Принеси подготовленный результат на разбор. Мы проверим логику, ясность для клиента и связь с общей воронкой. После обратной связи внеси правки в тот же артефакт — не создавай новую версию с нуля.`,
    actions: [
      `Подготовь ${deliverable.toLowerCase()} к разбору и выдели места, в которых сомневаешься.`,
      "Зафиксируй решения и правки, принятые во время созвона.",
      "Внеси изменения и отправь финальную версию на короткое подтверждение.",
    ],
    deliverable: `Проверенная и исправленная версия: ${deliverable.toLowerCase()}.`,
    metrics: "Количество существенных правок после разбора и статус финального подтверждения.",
  },
  {
    id: `${id}-data`,
    title: `${title} — Data & Repeat`,
    phase: "data",
    summary: `Запусти обновлённую версию в работу и оцени её не по ощущению, а по поведению аудитории и цифрам. Цель урока — понять, что сохраняем как систему, а что нужно повторить ещё одним циклом.`,
    actions: [
      "Примени итоговую версию в реальном профиле, контенте или диалогах.",
      `Зафиксируй показатели: ${metrics}`,
      "Сформулируй один вывод и одно изменение для следующей итерации.",
    ],
    deliverable: `Короткий data-review по результату «${title}» и решение: сохранить, улучшить или повторить.`,
    metrics,
  },
];

const CONSULTING_STAGES: ConsultingStage[] = [
  {
    id: "start",
    eyebrow: "START HERE",
    title: "Старт программы",
    description: "Фиксируем точку А, цель на 8 недель и правила совместной работы.",
    outcome: "Персональная дорожная карта и baseline-метрики, с которыми сравнивается итог программы.",
    modules: [
      {
        id: "start-module",
        title: "Онбординг и точка отсчёта",
        description: "Диагностика бизнеса до начала изменений.",
        lessons: [
          {
            id: "start-onboarding",
            title: "Онбординг-звонок",
            phase: "start",
            summary: "На стартовом созвоне мы разбираем текущую аудиторию, оффер, путь клиента и цель на ближайшие 8 недель. Наша задача — не обсуждать бизнес в общем, а определить конкретный результат программы и главное ограничение, которое мешает получать больше клиентов сейчас.",
            actions: [
              "Подготовь ссылки на основные площадки, текущий оффер и примеры последних заявок.",
              "Зафиксируй цель программы в одной измеримой формулировке.",
              "Определи главный разрыв между вниманием аудитории и продажами.",
            ],
            deliverable: "Согласованная цель программы, список ограничений и план первых действий.",
          },
          {
            id: "start-baseline",
            title: "Дорожная карта и baseline-метрики",
            phase: "start",
            summary: "Baseline — это честная запись текущего состояния до внедрения изменений. Эти цифры фиксируются один раз и становятся точкой сравнения на неделях 7–8. Без baseline невозможно доказать, что система стала сильнее.",
            actions: [
              "Зафиксируй средний охват контента за последние 30 дней.",
              "Посчитай заявки, начатые диалоги, назначенные звонки и продажи.",
              "Рассчитай текущие конверсии между каждым этапом воронки.",
            ],
            deliverable: "Таблица baseline: охват → заявка → диалог → звонок → продажа.",
            metrics: "Охват, заявки, конверсия в диалог, конверсия в звонок и конверсия в продажу.",
          },
        ],
      },
    ],
  },
  {
    id: "week-1",
    eyebrow: "НЕДЕЛЯ 1",
    title: "Диагностика: аудитория и позиция на рынке",
    description: "Понимаем, кто уже даёт внимание, почему это внимание не превращается в деньги и как выглядит текущая точка входа.",
    outcome: "Карта аудитории и список конкретных разрывов в оффере, bio и конкурентной позиции.",
    modules: [
      {
        id: "audience-audit",
        title: "Аудит аудитории",
        description: "Кто подписан, что удерживает внимание и где теряется коммерческий потенциал.",
        lessons: lessonCycle(
          "audience-audit",
          "Аудит аудитории",
          "Мы отделяем реальную аудиторию от воображаемой ЦА: смотрим, кто уже реагирует, задаёт вопросы и покупает.",
          [
            "Сегментируй подписчиков по запросу, уровню бизнеса и готовности покупать.",
            "Разбери последние входящие сообщения, заявки и продажи.",
            "Найди три причины, почему внимание не переходит в следующий шаг.",
          ],
          "Карта текущей аудитории и три приоритетных разрыва",
          "Доля целевых реакций, количество входящих запросов и конверсия внимания в заявку",
        ),
      },
      {
        id: "market-audit",
        title: "Аудит текущей упаковки и конкурентного поля",
        description: "Проверяем оффер, bio, точку входа и то, как клиент сравнивает тебя с альтернативами.",
        lessons: lessonCycle(
          "market-audit",
          "Аудит текущего оффера, bio и точки входа",
          "Профиль должен за несколько секунд объяснять, для кого ты, какое изменение создаёшь и куда человеку идти дальше.",
          [
            "Сделай скрин текущего bio, закрепов и главного CTA.",
            "Сравни свою упаковку с 5 прямыми и 3 косвенными альтернативами.",
            "Выпиши все места, где обещание размыто или следующий шаг неочевиден.",
          ],
          "Аудит упаковки с приоритетами исправлений",
          "Понятность оффера по тесту аудитории, переходы в точку входа и заявки из профиля",
        ),
      },
    ],
  },
  {
    id: "week-2",
    eyebrow: "НЕДЕЛЯ 2",
    title: "Позиционирование и оффер",
    description: "Собираем ясную историю бренда и предложение, которое соединяет запрос аудитории с измеримым результатом.",
    outcome: "Рабочая Brand Story, основной оффер и понятная ценовая линейка.",
    modules: [
      {
        id: "brand-story",
        title: "Brand Story",
        description: "Катализатор → core truth клиента → доказательство.",
        lessons: lessonCycle(
          "brand-story",
          "Катализатор и core truth клиента",
          "Сильная Brand Story начинается не с биографии эксперта, а с события и истины, в которой клиент узнаёт собственную ситуацию.",
          [
            "Определи катализатор: что заставляет клиента искать решение именно сейчас.",
            "Сформулируй одну core truth, которую клиент уже чувствует, но ещё не назвал.",
            "Подбери факты, опыт и кейсы, которые доказывают право говорить об этой истине.",
          ],
          "Brand Story по формуле катализатор → истина → доказательство",
          "Удержание, ответы с узнаванием себя и переходы к изучению оффера",
        ),
      },
      {
        id: "offer",
        title: "Оффер «аудитория → клиенты»",
        description: "Результат, механизм, формат работы и ценовая логика.",
        lessons: lessonCycle(
          "offer",
          "Формулировка оффера и ценовая линейка",
          "Оффер переводит экспертность в конкретное коммерческое изменение и объясняет, почему твой механизм заслуживает доверия.",
          [
            "Сформулируй клиента, исходную ситуацию и измеримый результат.",
            "Опиши механизм работы без абстрактных слов и лишних обещаний.",
            "Собери основное предложение и логичную ценовую линейку входа, ядра и продолжения.",
          ],
          "Одно основное предложение и ценовая линейка",
          "Ответы на оффер, квалифицированные заявки, конверсия в звонок и средний чек",
        ),
      },
    ],
  },
  {
    id: "week-3",
    eyebrow: "НЕДЕЛЯ 3",
    title: "Упаковка профиля",
    description: "Перестраиваем профиль так, чтобы новый посетитель быстро понимал ценность, видел доказательства и делал следующий шаг.",
    outcome: "Готовая точка входа: bio, визуальная логика, закрепы и proof-контент.",
    modules: [
      {
        id: "profile-bio",
        title: "Bio и визуальная точка входа",
        description: "Первый экран профиля под новый оффер.",
        lessons: lessonCycle(
          "profile-bio",
          "Профиль/bio под новый оффер",
          "Профиль — это не портфолио обо всём, что ты умеешь. Это короткий маршрут от узнавания проблемы к следующему действию.",
          [
            "Перепиши bio: кому помогаешь, какой результат создаёшь и куда перейти.",
            "Выстрой закрепы и актуальное по логике доверие → механизм → доказательство → действие.",
            "Проверь профиль на понятность у 5 представителей целевой аудитории.",
          ],
          "Обновлённый профиль и карта его точек входа",
          "Переходы по CTA, ответы после просмотра профиля и заявки из профиля",
        ),
      },
      {
        id: "social-proof",
        title: "Социальное доказательство",
        description: "Кейсы, до/после и доказательства механизма.",
        lessons: lessonCycle(
          "social-proof",
          "Кейсы, до/после, proof-контент",
          "Доказательство должно показывать не только красивый итог, но и исходную точку, механизм работы и конкретное изменение клиента.",
          [
            "Собери все кейсы, отзывы, цифры и наблюдаемые результаты.",
            "Упакуй минимум 3 доказательства в формате было → действие → стало.",
            "Закрой пробелы: запроси недостающие цифры или короткие отзывы у клиентов.",
          ],
          "Библиотека доказательств и минимум 3 готовых proof-единицы",
          "Досмотры proof-контента, сохранения, ответы и заявки после кейсов",
        ),
      },
    ],
  },
  {
    id: "week-4",
    eyebrow: "НЕДЕЛЯ 4",
    title: "Вход в воронку",
    description: "Создаём понятный обмен ценностью и квалификацию, которая не теряет сильных клиентов.",
    outcome: "Готовый лид-магнит, форма на бренде и рабочий путь до диалога.",
    modules: [
      {
        id: "lead-magnet",
        title: "Лид-магнит",
        description: "Тема, формат и обещание первого полезного результата.",
        lessons: lessonCycle(
          "lead-magnet",
          "Лид-магнит: тема, формат, обещание",
          "Лид-магнит решает одну дорогую часть проблемы и естественно подводит к следующему шагу, а не пытается заменить весь продукт.",
          [
            "Выбери один острый запрос аудитории, связанный с основным оффером.",
            "Сформулируй обещание конкретного результата без кликбейта.",
            "Собери первую версию материала и CTA к следующему шагу.",
          ],
          "Готовый лид-магнит с обещанием и CTA",
          "Конверсия просмотра CTA в получение, завершение материала и переход в диалог",
        ),
      },
      {
        id: "qualification",
        title: "Квалификационная форма и бот",
        description: "Сбор контекста клиента до личного диалога.",
        lessons: lessonCycle(
          "qualification",
          "Форма на личном домене/бренде и вопросы квалификации",
          "Форма должна дать достаточно контекста для сильного следующего шага, но не превращаться в длинный барьер перед общением.",
          [
            "Определи обязательные вопросы: ситуация, цель, бюджет, команда и срочность.",
            "Собери форму в бренде и настрой понятное подтверждение отправки.",
            "Проверь путь: лид-магнит → форма → CRM → личный диалог.",
          ],
          "Опубликованная форма и проверенный маршрут данных до CRM",
          "Начатые и завершённые формы, доля квалифицированных лидов и время ответа",
        ),
      },
    ],
  },
  {
    id: "week-5",
    eyebrow: "НЕДЕЛЯ 5",
    title: "Конверсионный контент",
    description: "Контент перестаёт быть отдельной активностью и начинает последовательно продавать следующий шаг.",
    outcome: "Готовый VSL и CTA-архитектура для основных площадок.",
    modules: [
      {
        id: "vsl",
        title: "VSL / продающий сценарий",
        description: "Структура, механизм и снятие возражений внутри видео.",
        lessons: lessonCycle(
          "vsl",
          "VSL: структура и снятие возражений",
          "VSL ведёт зрителя от узнавания своей ситуации к доверию в механизм и желанию обсудить следующий шаг.",
          [
            "Собери структуру: проблема → новая перспектива → механизм → доказательство → действие.",
            "Встрой ключевые возражения в сценарий до того, как их произнесёт клиент.",
            "Запиши и опубликуй первую рабочую версию VSL.",
          ],
          "Опубликованный VSL и текст его сценария",
          "Удержание, досмотры, переходы по CTA, начатые диалоги и заявки",
        ),
      },
      {
        id: "cta",
        title: "Контент, который продаёт следующий шаг",
        description: "CTA-архитектура: контент ведёт в диалог и звонок.",
        lessons: lessonCycle(
          "cta",
          "CTA-архитектура",
          "Не каждый материал должен продавать весь оффер. Контент продаёт следующий логичный шаг: ответ, файл, форму, диалог или звонок.",
          [
            "Назначь один следующий шаг каждому типу контента.",
            "Собери CTA для охватного, ценностного, proof- и VSL-контента.",
            "Убери действия, которые заставляют человека принимать слишком большое решение слишком рано.",
          ],
          "Карта CTA по типам контента и 10 готовых формулировок",
          "Реакции на CTA, переходы в диалог, заявки и звонки по каждому типу контента",
        ),
      },
    ],
  },
  {
    id: "week-6",
    eyebrow: "НЕДЕЛЯ 6",
    title: "Диалог и продажа",
    description: "Строим проактивный диалог, который квалифицирует человека и ведёт его к звонку без давления и выпрашивания.",
    outcome: "Готовая система сообщений, квалификации, возражений и follow-up.",
    modules: [
      {
        id: "dialogue",
        title: "Скрипты диалога",
        description: "Оупенеры, квалификация и дисциплина следующего шага.",
        lessons: lessonCycle(
          "dialogue",
          "Оупенеры и квалификация в переписке",
          "Сильный диалог сохраняет статус, быстро выявляет контекст и не оставляет лида без следующего понятного действия.",
          [
            "Собери оупенеры для входящих, исходящих и реактивации диалогов.",
            "Определи вопросы квалификации без ощущения допроса.",
            "Пропиши переход от контекста клиента к предложению звонка.",
          ],
          "Библиотека сообщений и схема квалификации",
          "Ответы на первое сообщение, квалифицированные диалоги и конверсия диалог → звонок",
        ),
      },
      {
        id: "objections",
        title: "Возражения и дожим",
        description: "Переводим абстрактное возражение в конкретную причину и следующий шаг.",
        lessons: lessonCycle(
          "objections",
          "Библиотека возражений",
          "Возражение нельзя побеждать заготовленной фразой. Сначала нужно понять конкретную причину, затем вернуть человеку ясность и договориться о следующем шаге.",
          [
            "Собери реальные формулировки возражений из последних диалогов и звонков.",
            "Для каждого возражения пропиши уточнение, ответ и следующий шаг.",
            "Добавь сценарии follow-up для «не сейчас», молчания и решения после созвона.",
          ],
          "Библиотека возражений и follow-up сценариев",
          "Возвраты в диалог, повторные звонки и продажи после возражения",
        ),
      },
    ],
  },
  {
    id: "week-7",
    eyebrow: "НЕДЕЛЯ 7",
    title: "Трекинг и оптимизация воронки",
    description: "Возвращаем контроль над каждым лидом и находим один этап, который сильнее всего ограничивает продажи.",
    outcome: "Актуальная CRM, дисциплина следующего шага и план исправления главного узкого места.",
    modules: [
      {
        id: "crm-discipline",
        title: "CRM и дисциплина следующего шага",
        description: "У каждого лида есть статус, контекст, дата и конкретное продолжение.",
        lessons: lessonCycle(
          "crm-discipline",
          "CRM и трекинг",
          "Лид не должен оставаться в тупике: после каждого контакта фиксируется результат и следующая дата действия.",
          [
            "Перенеси активных лидов в единую CRM без дублей.",
            "Заполни источник, этап, запрос, квалификацию и следующий шаг.",
            "Назначь дату продолжения каждому незакрытому лиду.",
          ],
          "Актуальная CRM без лидов в тупике",
          "Лиды без следующего шага, просроченные follow-up и скорость движения по этапам",
        ),
      },
      {
        id: "bottleneck",
        title: "Поиск узкого места воронки",
        description: "Охват → заявка → диалог → звонок → продажа.",
        lessons: lessonCycle(
          "bottleneck",
          "Разбор воронки по этапам",
          "Масштабирование начинается не с увеличения всего сразу, а с исправления этапа, где система теряет больше всего потенциальных клиентов.",
          [
            "Собери количество людей на каждом этапе за единый период.",
            "Рассчитай конверсии и сравни их с baseline.",
            "Выбери одно узкое место и сформулируй гипотезу его исправления.",
          ],
          "Воронка с конверсиями и одна приоритетная гипотеза",
          "Конверсии охват → заявка → диалог → звонок → продажа",
        ),
      },
    ],
  },
  {
    id: "week-8",
    eyebrow: "НЕДЕЛЯ 8",
    title: "Итог и план масштабирования",
    description: "Сравниваем результат с точкой А, закрепляем работающие элементы и выбираем следующий рычаг роста.",
    outcome: "Итоговый review программы и исполнимый план на следующие 90 дней.",
    modules: [
      {
        id: "baseline-review",
        title: "Ревью против baseline",
        description: "Сравнение всех ключевых показателей с записью Start Here.",
        lessons: lessonCycle(
          "baseline-review",
          "Сравнение метрик с неделей 1",
          "Итог оценивается по изменению системы и цифр относительно точки А, а не по количеству просмотренных уроков.",
          [
            "Собери финальные показатели за сопоставимый период.",
            "Сравни каждый этап воронки с baseline и объясни изменения.",
            "Отдели устойчивые улучшения от разовых всплесков.",
          ],
          "Итоговый отчёт baseline → результат",
          "Изменение охвата, заявок, диалогов, звонков, продаж и конверсий",
        ),
      },
      {
        id: "plan-90",
        title: "План на следующие 90 дней",
        description: "Что оставить системой, что улучшить и куда направить следующий ресурс.",
        lessons: lessonCycle(
          "plan-90",
          "Итоговый аудит и план на 90 дней",
          "План масштабирования сохраняет работающий фундамент и добавляет только те изменения, которые отвечают найденному узкому месту.",
          [
            "Зафиксируй процессы, которые становятся обязательной системой.",
            "Выбери один главный рычаг роста и три поддерживающих проекта.",
            "Разложи 90 дней на три 30-дневных спринта с KPI и ответственными.",
          ],
          "90-дневная карта масштабирования",
          "KPI каждого спринта, владельцы действий и контрольные даты",
        ),
      },
    ],
  },
];

const CONSULTING_CALLS = [
  ["01", "Онбординг и диагностика", "Цель, точка А и дорожная карта"],
  ["02", "Разбор недели 1", "Аудит аудитории и упаковки"],
  ["03", "Разбор недели 2", "Позиционирование и оффер"],
  ["04", "Разбор недели 3", "Профиль и социальное доказательство"],
  ["05", "Разбор недели 4", "Лид-магнит, форма и бот"],
  ["06", "Разбор недели 5", "VSL и CTA-архитектура"],
  ["07", "Разбор недели 6", "Диалоги, возражения и follow-up"],
  ["08", "Разбор недели 7", "CRM и узкое место воронки"],
  ["09", "Разбор недели 8", "Ревью результата против baseline"],
  ["10", "Финальный созвон", "План масштабирования на 90 дней"],
];

const allLessons = CONSULTING_STAGES.flatMap(stage =>
  stage.modules.flatMap(module => module.lessons.map(lesson => ({ lesson, module, stage }))),
);

const iconPaths = {
  program: "M4 5a2 2 0 012-2h12a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5z M8 8h8 M8 12h8 M8 16h5",
  calls: "M8 3h8a2 2 0 012 2v14l-6-3-6 3V5a2 2 0 012-2z M9 8h6 M9 12h4",
  resources: "M4 6a2 2 0 012-2h5l2 2h7a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V6z",
  play: "M9 7l7 5-7 5V7z",
  check: "M5 12l4 4L19 6",
  clock: "M12 7v5l3 2 M12 22a10 10 0 110-20 10 10 0 010 20z",
  file: "M6 2h8l4 4v16H6V2z M14 2v6h6",
  target: "M12 22a10 10 0 100-20 10 10 0 000 20z M12 18a6 6 0 100-12 6 6 0 000 12z M12 14a2 2 0 100-4 2 2 0 000 4z",
};

function Icon({ path, size = 18, color = "currentColor", strokeWidth = 1.7 }: { path: string; size?: number; color?: string; strokeWidth?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><path d={path}/></svg>;
}

function useMobile() {
  const [mobile, setMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 900);
  useEffect(() => {
    const onResize = () => setMobile(window.innerWidth < 900);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return mobile;
}

export default function FFConsulting({ userId, dark }: { userId: string; dark: boolean }) {
  const mobile = useMobile();
  const [view, setView] = useState<"program" | "calls" | "resources">("program");
  const [progress, setProgress] = useState<ConsultingProgress>(EMPTY_PROGRESS);
  const [ready, setReady] = useState(false);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "local">("saved");
  const hydrated = useRef(false);
  const localKey = `vizzy_consulting_progress_v1_${userId}`;

  const palette = useMemo(() => ({
    bg: dark ? "#0A0A0A" : "#F5F7FA",
    card: dark ? "#171717" : "#FFFFFF",
    card2: dark ? "#121212" : "#F8F9FB",
    text: dark ? "#ECECEC" : "#181818",
    muted: dark ? "#8A8A8A" : "#6B7280",
    border: dark ? "rgba(255,255,255,0.08)" : "#E5E7EB",
    soft: dark ? "rgba(91,124,250,0.11)" : "rgba(91,124,250,0.08)",
  }), [dark]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      let next = EMPTY_PROGRESS;
      try {
        const raw = localStorage.getItem(localKey);
        if (raw) next = { ...EMPTY_PROGRESS, ...JSON.parse(raw) };
      } catch {}
      try {
        const { data, error } = await supabase.from("consulting_progress").select("payload").eq("user_id", userId).maybeSingle();
        if (!error && data?.payload) next = { ...EMPTY_PROGRESS, ...data.payload };
      } catch {}
      if (!alive) return;
      const validActive = allLessons.some(item => item.lesson.id === next.activeLessonId) ? next.activeLessonId : EMPTY_PROGRESS.activeLessonId;
      setProgress({
        completed: Array.isArray(next.completed) ? next.completed : [],
        notes: next.notes && typeof next.notes === "object" ? next.notes : {},
        activeLessonId: validActive,
      });
      hydrated.current = true;
      setReady(true);
    };
    load();
    return () => { alive = false; };
  }, [localKey, userId]);

  useEffect(() => {
    if (!hydrated.current) return;
    try { localStorage.setItem(localKey, JSON.stringify(progress)); } catch {}
    setSaveState("saving");
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const { error } = await supabase.from("consulting_progress").upsert({
          user_id: userId,
          payload: progress,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
        if (!cancelled) setSaveState(error ? "local" : "saved");
      } catch {
        if (!cancelled) setSaveState("local");
      }
    }, 650);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [localKey, progress, userId]);

  const completedSet = useMemo(() => new Set(progress.completed), [progress.completed]);
  const doneCount = completedSet.size;
  const percent = Math.round((doneCount / allLessons.length) * 100);
  const active = allLessons.find(item => item.lesson.id === progress.activeLessonId) || allLessons[0];
  const activeStage = active.stage;
  const activeModule = active.module;
  const activeLesson = active.lesson;
  const currentIndex = allLessons.findIndex(item => item.lesson.id === activeLesson.id);
  const nextLesson = allLessons.slice(currentIndex + 1).find(item => !completedSet.has(item.lesson.id));
  const firstIncomplete = allLessons.find(item => !completedSet.has(item.lesson.id)) || allLessons[allLessons.length - 1];

  const selectLesson = (id: string) => {
    setProgress(prev => ({ ...prev, activeLessonId: id }));
    setView("program");
  };

  const toggleLesson = (id: string) => {
    setProgress(prev => {
      const exists = prev.completed.includes(id);
      return { ...prev, completed: exists ? prev.completed.filter(item => item !== id) : [...prev.completed, id] };
    });
  };

  const updateNote = (id: string, note: string) => {
    setProgress(prev => ({ ...prev, notes: { ...prev.notes, [id]: note } }));
  };

  const stageProgress = (stage: ConsultingStage) => {
    const ids = stage.modules.flatMap(module => module.lessons.map(lesson => lesson.id));
    const done = ids.filter(id => completedSet.has(id)).length;
    return { done, total: ids.length, percent: Math.round((done / ids.length) * 100) };
  };

  const panel: React.CSSProperties = {
    background: palette.card,
    border: `1px solid ${palette.border}`,
    borderRadius: 14,
    boxShadow: dark ? "0 10px 32px rgba(0,0,0,0.24)" : "0 4px 18px rgba(0,0,0,0.05)",
  };

  const tab = (id: "program" | "calls" | "resources", label: string, path: string) => {
    const selected = view === id;
    return <button type="button" aria-pressed={selected} onClick={() => setView(id)} style={{
      border: "none", borderRadius: 9, padding: mobile ? "9px 10px" : "9px 14px", cursor: "pointer",
      display: "flex", alignItems: "center", gap: 7, background: selected ? ACCENT : "transparent",
      color: selected ? "#fff" : palette.muted, fontSize: 12.5, fontWeight: selected ? 650 : 500,
    }}><Icon path={path} size={16}/>{label}</button>;
  };

  if (!ready) return <div style={{minHeight:420,display:"flex",alignItems:"center",justifyContent:"center",color:palette.muted,fontSize:13}}>Загружаю программу…</div>;

  return <div style={{maxWidth:1480,margin:"0 auto",padding:mobile?"14px 12px 92px":"24px 28px 48px",color:palette.text}}>
    <style>{`
      @keyframes fcPulse{0%,100%{opacity:.35}50%{opacity:1}}
      .fc-scroll::-webkit-scrollbar{width:4px;height:4px}.fc-scroll::-webkit-scrollbar-thumb{background:rgba(130,130,130,.25);border-radius:4px}
      .fc-lesson:hover{border-color:rgba(91,124,250,.42)!important;background:rgba(91,124,250,.06)!important}
    `}</style>

    <div style={{...panel,padding:mobile?18:24,overflow:"hidden",position:"relative",marginBottom:14}}>
      <div style={{position:"absolute",right:-80,top:-120,width:360,height:360,borderRadius:"50%",background:"radial-gradient(circle,rgba(91,124,250,.18),transparent 68%)",pointerEvents:"none"}}/>
      <div style={{position:"relative",display:"flex",justifyContent:"space-between",alignItems:mobile?"flex-start":"center",gap:18,flexDirection:mobile?"column":"row"}}>
        <div style={{maxWidth:760}}>
          <div style={{fontSize:10,fontWeight:750,letterSpacing:2.2,color:ACCENT,marginBottom:8}}>FF CONSULTING</div>
          <div style={{fontSize:mobile?25:32,fontWeight:760,letterSpacing:"-0.035em",lineHeight:1.08}}>Grow Acquisition</div>
          <div style={{fontSize:mobile?14:15,color:palette.muted,marginTop:8,lineHeight:1.5}}>8-недельная программа «Превращаю твою аудиторию в клиентов»</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:15}}>
            {["50 уроков","10 личных созвонов","8 недель","Постоянный контакт"].map(item => <span key={item} style={{fontSize:11.5,color:palette.text,padding:"6px 9px",borderRadius:8,background:palette.card2,border:`1px solid ${palette.border}`}}>{item}</span>)}
          </div>
        </div>
        <div style={{width:mobile?"100%":290,padding:16,borderRadius:12,background:dark?"rgba(0,0,0,.22)":"rgba(255,255,255,.72)",border:`1px solid ${palette.border}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}><span style={{fontSize:11,color:palette.muted}}>Общий прогресс</span><span style={{fontSize:23,fontWeight:760}}>{percent}%</span></div>
          <div style={{height:7,borderRadius:8,background:dark?"rgba(255,255,255,.08)":"#E8EBF1",overflow:"hidden",margin:"10px 0 9px"}}><div style={{height:"100%",width:`${percent}%`,background:`linear-gradient(90deg,${ACCENT},#7A96FF)`,borderRadius:8,transition:"width .25s ease"}}/></div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:10.5,color:palette.muted}}><span>{doneCount} из {allLessons.length} уроков</span><span>{saveState === "saving" ? "Сохраняю…" : saveState === "local" ? "Сохранено локально" : "Сохранено"}</span></div>
          <button onClick={() => selectLesson(firstIncomplete.lesson.id)} style={{width:"100%",marginTop:13,padding:"10px 12px",border:"none",borderRadius:9,background:ACCENT,color:"#fff",fontSize:12.5,fontWeight:650,cursor:"pointer"}}>{percent === 100 ? "Открыть программу" : "Продолжить обучение"}</button>
        </div>
      </div>
    </div>

    <div style={{...panel,padding:5,display:"flex",gap:3,width:"fit-content",maxWidth:"100%",marginBottom:14}}>
      {tab("program","Программа",iconPaths.program)}
      {tab("calls","Созвоны",iconPaths.calls)}
      {tab("resources","Материалы",iconPaths.resources)}
    </div>

    {view === "program" && <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"230px 300px minmax(0,1fr)",gap:12,alignItems:"start"}}>
      <div className="fc-scroll" style={{...panel,padding:8,maxHeight:mobile?"none":"calc(100vh - 170px)",overflowY:"auto",position:mobile?"static":"sticky",top:82}}>
        <div style={{padding:"8px 9px 10px",fontSize:10,fontWeight:700,letterSpacing:1.4,color:palette.muted}}>ДОРОЖНАЯ КАРТА</div>
        <div style={{display:mobile?"grid":"block",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:6}}>
          {CONSULTING_STAGES.map(stage => {
            const stats = stageProgress(stage);
            const selected = stage.id === activeStage.id;
            const first = stage.modules[0].lessons[0];
            return <button key={stage.id} onClick={() => selectLesson(first.id)} style={{
              width:"100%",textAlign:"left",border:`1px solid ${selected?"rgba(91,124,250,.45)":palette.border}`,
              background:selected?palette.soft:"transparent",borderRadius:10,padding:"10px 9px",cursor:"pointer",marginBottom:mobile?0:5,color:palette.text,
            }}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
                <span style={{fontSize:9.5,fontWeight:750,letterSpacing:1,color:selected?ACCENT:palette.muted}}>{stage.eyebrow}</span>
                <span style={{fontSize:9.5,color:stats.percent===100?GREEN:palette.muted}}>{stats.done}/{stats.total}</span>
              </div>
              <div style={{fontSize:11.5,fontWeight:600,lineHeight:1.35,marginTop:5}}>{stage.title}</div>
              <div style={{height:3,borderRadius:4,background:dark?"rgba(255,255,255,.07)":"#E9EBF0",marginTop:8,overflow:"hidden"}}><div style={{height:"100%",width:`${stats.percent}%`,background:stats.percent===100?GREEN:ACCENT}}/></div>
            </button>;
          })}
        </div>
      </div>

      <div className="fc-scroll" style={{...panel,padding:12,maxHeight:mobile?"none":"calc(100vh - 170px)",overflowY:"auto",position:mobile?"static":"sticky",top:82}}>
        <div style={{fontSize:9.5,fontWeight:750,letterSpacing:1.3,color:ACCENT}}>{activeStage.eyebrow}</div>
        <div style={{fontSize:16,fontWeight:700,lineHeight:1.25,marginTop:5}}>{activeStage.title}</div>
        <div style={{fontSize:11.5,color:palette.muted,lineHeight:1.5,marginTop:7,marginBottom:13}}>{activeStage.description}</div>
        {activeStage.modules.map(module => <div key={module.id} style={{marginTop:12}}>
          <div style={{padding:"9px 9px 7px",borderTop:`1px solid ${palette.border}`}}>
            <div style={{fontSize:11.5,fontWeight:700}}>{module.title}</div>
            <div style={{fontSize:10.5,color:palette.muted,lineHeight:1.4,marginTop:3}}>{module.description}</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            {module.lessons.map((lesson,index) => {
              const selected = lesson.id === activeLesson.id;
              const done = completedSet.has(lesson.id);
              return <button className="fc-lesson" key={lesson.id} onClick={() => selectLesson(lesson.id)} style={{
                display:"flex",alignItems:"flex-start",gap:9,textAlign:"left",border:`1px solid ${selected?"rgba(91,124,250,.5)":palette.border}`,
                background:selected?palette.soft:"transparent",borderRadius:9,padding:"9px",cursor:"pointer",color:palette.text,transition:"all .15s ease",
              }}>
                <span style={{width:20,height:20,borderRadius:6,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",background:done?GREEN:(selected?ACCENT:palette.card2),border:`1px solid ${done?GREEN:palette.border}`,color:"#fff",fontSize:9.5}}>{done?<Icon path={iconPaths.check} size={12} strokeWidth={2.4}/>:index+1}</span>
                <span style={{fontSize:11,lineHeight:1.4,fontWeight:selected?650:500}}>{lesson.title}</span>
              </button>;
            })}
          </div>
        </div>)}
      </div>

      <div style={{...panel,overflow:"hidden",minWidth:0}}>
        <div style={{padding:mobile?16:20,borderBottom:`1px solid ${palette.border}`}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
            <span style={{fontSize:10,fontWeight:750,color:ACCENT,letterSpacing:1.15}}>{activeStage.eyebrow} · {activeModule.title}</span>
            <span style={{fontSize:10.5,padding:"5px 8px",borderRadius:7,background:palette.card2,color:palette.muted,border:`1px solid ${palette.border}`}}>{phaseLabel[activeLesson.phase]}</span>
          </div>
          <h2 style={{fontSize:mobile?21:25,lineHeight:1.18,letterSpacing:"-.025em",margin:"12px 0 0",fontWeight:740}}>{activeLesson.title}</h2>
        </div>

        <div style={{padding:mobile?16:20,display:"grid",gap:14}}>
          <div style={{display:"flex",alignItems:"center",gap:13,padding:14,borderRadius:11,background:palette.card2,border:`1px dashed ${dark?"rgba(255,255,255,.14)":"#CDD3DE"}`}}>
            <div style={{width:38,height:38,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",background:palette.soft,color:ACCENT,flexShrink:0}}><Icon path={iconPaths.play} size={21}/></div>
            <div style={{minWidth:0}}><div style={{fontSize:12,fontWeight:650}}>Видео к уроку</div><div style={{fontSize:10.5,color:palette.muted,marginTop:3}}>Место подготовлено. Видеоматериал будет добавлен в следующей версии программы.</div></div>
          </div>

          <section>
            <div style={{fontSize:10,fontWeight:750,letterSpacing:1.2,color:palette.muted,marginBottom:7}}>СУТЬ УРОКА</div>
            <div style={{fontSize:13.5,lineHeight:1.68,color:palette.text}}>{activeLesson.summary}</div>
          </section>

          <section style={{padding:15,borderRadius:11,background:palette.card2,border:`1px solid ${palette.border}`}}>
            <div style={{fontSize:10,fontWeight:750,letterSpacing:1.2,color:palette.muted,marginBottom:10}}>ЧТО НУЖНО СДЕЛАТЬ</div>
            <div style={{display:"grid",gap:10}}>{activeLesson.actions.map((action,index) => <div key={action} style={{display:"flex",gap:10,alignItems:"flex-start"}}><span style={{width:21,height:21,borderRadius:7,background:palette.soft,color:ACCENT,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:750,flexShrink:0}}>{index+1}</span><span style={{fontSize:12.5,lineHeight:1.55}}>{action}</span></div>)}</div>
          </section>

          <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"1fr 1fr",gap:10}}>
            <div style={{padding:13,borderRadius:10,border:`1px solid ${palette.border}`,background:palette.card}}><div style={{display:"flex",alignItems:"center",gap:7,fontSize:10,fontWeight:750,letterSpacing:1,color:palette.muted}}><Icon path={iconPaths.file} size={15} color={ACCENT}/>АРТЕФАКТ</div><div style={{fontSize:12,lineHeight:1.5,marginTop:8}}>{activeLesson.deliverable}</div></div>
            <div style={{padding:13,borderRadius:10,border:`1px solid ${palette.border}`,background:palette.card}}><div style={{display:"flex",alignItems:"center",gap:7,fontSize:10,fontWeight:750,letterSpacing:1,color:palette.muted}}><Icon path={iconPaths.target} size={15} color={ACCENT}/>КОНТРОЛЬ</div><div style={{fontSize:12,lineHeight:1.5,marginTop:8}}>{activeLesson.metrics || "Готовность артефакта и подтверждение результата на разборе."}</div></div>
          </div>

          <section>
            <div style={{fontSize:10,fontWeight:750,letterSpacing:1.2,color:palette.muted,marginBottom:7}}>МОИ ЗАМЕТКИ</div>
            <textarea aria-label="Мои заметки к уроку" value={progress.notes[activeLesson.id] || ""} onChange={event => updateNote(activeLesson.id,event.target.value)} placeholder="Выводы, вопросы к разбору, принятые решения…" rows={4} style={{width:"100%",boxSizing:"border-box",resize:"vertical",border:`1px solid ${palette.border}`,borderRadius:10,background:palette.card2,color:palette.text,padding:"11px 12px",fontFamily:"inherit",fontSize:12.5,lineHeight:1.5,outline:"none"}}/>
          </section>

          <div style={{display:"flex",justifyContent:"space-between",alignItems:mobile?"stretch":"center",gap:9,flexDirection:mobile?"column":"row",paddingTop:2}}>
            <button onClick={() => toggleLesson(activeLesson.id)} style={{padding:"10px 15px",border:`1px solid ${completedSet.has(activeLesson.id)?GREEN:palette.border}`,borderRadius:9,background:completedSet.has(activeLesson.id)?"rgba(22,163,106,.11)":palette.card2,color:completedSet.has(activeLesson.id)?GREEN:palette.text,cursor:"pointer",fontSize:12.5,fontWeight:650,display:"flex",alignItems:"center",justifyContent:"center",gap:7}}><Icon path={iconPaths.check} size={16} strokeWidth={2.2}/>{completedSet.has(activeLesson.id)?"Урок завершён":"Отметить выполненным"}</button>
            {nextLesson && <button onClick={() => selectLesson(nextLesson.lesson.id)} style={{padding:"10px 15px",border:"none",borderRadius:9,background:ACCENT,color:"#fff",cursor:"pointer",fontSize:12.5,fontWeight:650}}>Следующий урок →</button>}
          </div>
        </div>
      </div>
    </div>}

    {view === "calls" && <div style={{...panel,padding:mobile?16:22}}>
      <div style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:mobile?"flex-start":"center",flexDirection:mobile?"column":"row",marginBottom:18}}>
        <div><div style={{fontSize:20,fontWeight:730}}>10 личных созвонов-разборов</div><div style={{fontSize:12.5,color:palette.muted,marginTop:6,lineHeight:1.5}}>Здесь будут храниться дата, итог, следующие действия и запись каждого созвона.</div></div>
        <span style={{fontSize:11,padding:"7px 10px",borderRadius:8,background:palette.soft,color:ACCENT}}>Записи будут добавлены позже</span>
      </div>
      <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"repeat(2,minmax(0,1fr))",gap:9}}>
        {CONSULTING_CALLS.map(([number,title,outcome]) => <div key={number} style={{padding:14,borderRadius:11,border:`1px solid ${palette.border}`,background:palette.card2,display:"flex",gap:12,alignItems:"flex-start"}}>
          <div style={{width:34,height:34,borderRadius:9,background:palette.soft,color:ACCENT,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:750,flexShrink:0}}>{number}</div>
          <div style={{flex:1,minWidth:0}}><div style={{fontSize:12.5,fontWeight:650}}>{title}</div><div style={{fontSize:11,color:palette.muted,lineHeight:1.45,marginTop:4}}>{outcome}</div><div style={{display:"flex",alignItems:"center",gap:6,fontSize:10.5,color:palette.muted,marginTop:10}}><Icon path={iconPaths.play} size={14}/>Запись пока не загружена</div></div>
        </div>)}
      </div>
    </div>}

    {view === "resources" && <div style={{...panel,padding:mobile?16:22}}>
      <div style={{fontSize:20,fontWeight:730}}>Материалы программы</div>
      <div style={{fontSize:12.5,color:palette.muted,marginTop:6,lineHeight:1.5,maxWidth:720}}>Первая версия программы уже содержит текстовую методику внутри каждого урока. Здесь подготовлены разделы для файлов, шаблонов и записей, которые будут добавляться по мере развития консалтинга.</div>
      <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"repeat(3,minmax(0,1fr))",gap:10,marginTop:18}}>
        {[
          ["Дорожная карта","Персональный план на 8 недель"],
          ["Шаблоны","Формы, скрипты и рабочие документы"],
          ["Baseline","Таблица метрик и сравнение результата"],
          ["Записи созвонов","Архив 10 личных разборов"],
          ["Кейсы и примеры","Эталонные разборы и референсы"],
          ["Связь с Кириллом","Вопросы и поддержка между личными разборами"],
        ].map(([title,description]) => <div key={title} style={{padding:16,borderRadius:11,border:`1px solid ${palette.border}`,background:palette.card2,minHeight:112}}><div style={{width:31,height:31,borderRadius:8,background:palette.soft,color:ACCENT,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:11}}><Icon path={iconPaths.resources} size={17}/></div><div style={{fontSize:12.5,fontWeight:650}}>{title}</div><div style={{fontSize:10.8,color:palette.muted,lineHeight:1.45,marginTop:5}}>{description}</div><div style={{fontSize:9.5,color:palette.muted,marginTop:10}}>Будет добавлено</div></div>)}
      </div>
    </div>}
  </div>;
}
