# DevOps test task

Небольшой NestJS-сервис с Docker-сборкой, автоматическими проверками, деплоем в Vercel и внешним health-check мониторингом.

## HTTP endpoints

- `GET /` — информация о сервисе.
- `GET /health` — проверка доступности, успешный ответ: `{"status":"ok"}`.

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

Compose запускает только приложение: база данных этому сервису не требуется. Контейнер проверяется через `GET /health`.

Для проверки production-образа:

```bash
docker build --target production -t devops-test-task .
docker run --rm -p 5000:5000 -e HOST=0.0.0.0 -e PORT=5000 devops-test-task
```

## CI/CD

Workflow `.github/workflows/main.yml` оставлен одним файлом, а этапы разделены на зависимые jobs:

```text
quality -> test -> build -> deploy
```

- `quality` проверяет форматирование, ESLint и типы.
- `test` запускает unit- и e2e-тесты.
- `build` собирает приложение и production Docker image.
- `deploy` выполняется только при push в `main` и только после успешных предыдущих jobs.

Для этого тестового проекта отдельные `ci.yml` и `deploy.yml` добавили бы больше навигации и дублирования, но не дали бы практической изоляции. Разделить workflow имеет смысл позже, если у deploy появятся отдельные права доступа, ручные approvals, несколько окружений или независимый release cycle.

### Настройка Vercel

Vercel поддерживает обычный NestJS entrypoint `src/main.ts`, поэтому отдельный serverless adapter не нужен.

1. Создать или привязать Vercel-проект командой `npx vercel@59.16.0 link`.
2. Создать Vercel access token.
3. В GitHub добавить Actions secrets:
   - `VERCEL_TOKEN` — access token;
   - `VERCEL_ORG_ID` — `orgId` из `.vercel/project.json`;
   - `VERCEL_PROJECT_ID` — `projectId` из `.vercel/project.json`.
4. При необходимости настроить protection rules для GitHub environment `production`.

Git-интеграция Vercel для этого варианта не требуется: production deployment выполняет GitHub Actions. Если она уже подключена, автоматические production deployments следует отключить, иначе один push вызовет два деплоя.

## Мониторинг

После первого production deployment нужно создать HTTP(S)-monitor в UptimeRobot:

- URL: `https://<production-domain>/health`;
- интервал: 5 минут;
- ожидаемый результат: HTTP `200`;
- уведомления: email или Telegram.

UptimeRobot отвечает за внешнюю проверку доступности и время ответа и сам выполняет подтверждающие повторные запросы перед переводом HTTP-monitor в состояние Down. Для диагностики ошибок используются runtime logs конкретного deployment в Vercel. После настройки нужно отправить встроенное тестовое уведомление каждому подключённому alert contact.
