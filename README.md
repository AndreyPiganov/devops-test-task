# DevOps test task

CI/CD-пайплайн для демо-приложения: при пуше в `main` автоматически запускаются
проверки и тесты, при успехе выполняется деплой на Vercel.

- **Репозиторий:** https://github.com/AndreyPiganov/devops-test-task
- **Задеплоенная версия:** https://devops-test-task.vercel.app
  (проверка: [`/health`](https://devops-test-task.vercel.app/health) → `{"status":"ok"}`)

## Приложение

Небольшой NestJS-сервис (Node.js 22, TypeScript, ESM). Выбран собственный
мини-проект вместо статической страницы, чтобы показать пайплайн на примере,
приближенном к реальному бэкенду: с линтером, типизацией, unit- и e2e-тестами.

HTTP endpoints:

- `GET /` — информация о сервисе;
- `GET /health` — проверка доступности, успешный ответ: `{"status":"ok"}`.

## Как устроен пайплайн

Один workflow `.github/workflows/main.yml`, этапы разделены на зависимые jobs:

```text
quality -> test -> build -> deploy
```

- **`quality`** — `npm ci`, проверка форматирования (Prettier), ESLint, type-check
  (`tsc --noEmit`). Самый дешёвый этап идёт первым, чтобы падать быстро.
- **`test`** — unit-тесты и e2e-тесты (Jest, e2e поднимает приложение и ходит
  в него через HTTP).
- **`build`** — `nest build`, валидация `docker-compose.yml` и сборка production
  Docker-образа. Проверяет, что артефакты собираются, ещё до деплоя.
- **`deploy`** — только при push в `main` и только после успешных предыдущих
  этапов: `vercel build --prod` собирает deployment, `vercel deploy --prebuilt
  --prod` его публикует, после чего `curl` проверяет `/health` уже задеплоенной
  версии как smoke-тест. Если health-check упал — пайплайн красный.

Проверки запускаются на push в любую ветку, деплой — только из `main`
(условие на job `deploy`). Настроен `concurrency` с `cancel-in-progress`:
новый push в ту же ветку отменяет устаревший прогон.

### Почему такие инструменты

- **GitHub Actions** — бесплатен для публичных репозиториев, живёт рядом с
  кодом, статусы проверок видны прямо в PR. Самый распространённый вариант,
  отдельная CI-система тут ничего не дала бы. 
  Всегда пользовался этим инструментом если проект небольшой.
- **Vercel** — managed-хостинг с нулевой конфигурацией инфраструктуры: TLS,
  домен, масштабирование из коробки; поддерживает NestJS entrypoint
  `src/main.ts` без serverless-адаптеров. Для раннего этапа проекта это
  снимает вопрос эксплуатации серверов.
- **`npm ci`** вместо `npm install` — воспроизводимая установка строго по
  lock-файлу; плюс кэширование `node_modules` через `setup-node`.

## Мониторинг доступности

Базовая схема — внешний HTTP(S)-monitor в UptimeRobot:

- URL: `https://devops-test-task.vercel.app/health`;
- интервал: 5 минут;
- ожидаемый результат: HTTP `200`;
- уведомления: email или Telegram.

Почему так: сервис stateless, поэтому внешней проверки доступности достаточно,
чтобы отличить «лежит хостинг/деплой» от «всё работает»; UptimeRobot сам делает
подтверждающие повторные запросы перед статусом Down, что отсекает ложные
срабатывания. Для диагностики причин используются runtime-логи деплоя в Vercel.

## Локальный запуск

Требования: Node.js 22 и npm.

```bash
cp .env.example .env
npm ci
npm run start:dev
```

Сервис будет доступен по адресу `http://localhost:5000`.

Основные команды:

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

## Docker

```bash
docker compose up --build
```

Compose запускает только приложение: база данных этому сервису не требуется.
Контейнер проверяется через `GET /health`.

Для проверки production-образа:

```bash
docker build --target production -t devops-test-task .
docker run --rm -p 5000:5000 -e HOST=0.0.0.0 -e PORT=5000 devops-test-task
```
