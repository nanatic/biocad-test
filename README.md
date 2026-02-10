# Figma Dashboard (Angular + Node.js)

Тестовый проект: веб-приложение с клиентской и серверной частями для просмотра дашбордов/ассетов, аналитики и журналирования действий.

## Что реализовано

- **Клиент**: Angular (standalone components, routing)
- **Сервер**: Node.js + Express
- **Навигация**:
  - `Dashboard` (дашборды)
  - `Asset` (карточка устройства с вкладками аналитики и описания)
  - `ErrorPage` (страница ошибки с возвратом)
- **Работа с ассетами**:
  - занять устройство
  - освободить устройство (с сохранением события ремонта/проверки)
- **Аналитика**:
  - фильтры по периоду, виду работ, пользователю, поиску по деталям
  - сортировка по дате
  - экспорт:
    - **PDF**
    - **Excel-совместимый CSV** (корректная кириллица для Windows/Excel)
- **Пользователь**:
  - загрузка аватара
- **Хранение данных**:
  - JSON-файлы на сервере (`server/data`)
  - загруженные файлы (`server/uploads`)

---

## Технологии

### Frontend
- Angular
- TypeScript
- RxJS
- SCSS

### Backend
- Node.js
- Express
- Multer
- Sharp
- CORS

### Экспорт
- `pdfmake` (PDF)
- CSV (Excel-compatible)

### Контейнеризация
- Docker
- Docker Compose

---

## Структура проекта

```text
figma-dashboard/
├─ src/                        # Angular-приложение
│  ├─ app/
│  │  ├─ pages/
│  │  │  ├─ dashboard-page/
│  │  │  ├─ asset-page/
│  │  │  │  └─ tabs/
│  │  │  │     ├─ asset-description/
│  │  │  │     └─ asset-analytics/
│  │  │  └─ error-page/
│  │  ├─ layout/header/
│  │  └─ shared/
│  │     ├─ components/asset-card/
│  │     ├─ services/
│  │     └─ models.ts
│  └─ ...
├─ server/
│  ├─ index.js                 # Express API
│  ├─ data/                    # users.json, assets.json, events.json
│  ├─ uploads/                 # аватары и прочие загрузки
│  └─ package.json
├─ Dockerfile
├─ docker-compose.yml
├─ proxy.conf.json
├─ angular.json
└─ package.json
````

---

## Требования

* Node.js 20+
* npm 10+
* (опционально) Docker + Docker Compose

---

## Запуск локально (без Docker)

### 1) Установить зависимости

```bash
npm install
cd server && npm install && cd ..
```

### 2) Запустить backend

```bash
cd server
npm run dev
```

Сервер поднимется на `http://127.0.0.1:3000`.

### 3) Запустить frontend (в новом терминале)

```bash
npm start
```

Frontend поднимется на `http://localhost:4200`.

> Для локальной разработки используется `proxy.conf.json` (`/api` и `/uploads` проксируются на backend).

---

## Запуск через Docker

```bash
docker compose up -d --build
```

После запуска приложение доступно по адресу:

* `http://<host>:8080`

Остановка:

```bash
docker compose down
```

Полная очистка (включая volumes):

```bash
docker compose down -v
```

---

## Основные маршруты UI

* `/dashboard` — дашборды
* `/asset/:id/description` — описание ассета
* `/asset/:id/analytics` — аналитика ассета
* `/error` — страница ошибки
* `*` → редирект на `/error`

---

## Основные API endpoints

* `GET /api/users`
* `GET /api/users/me`
* `POST /api/users/me/avatar`
* `GET /api/assets`
* `GET /api/assets/:id`
* `POST /api/assets/:id/claim`
* `POST /api/assets/:id/release`
* `GET /api/assets/:id/events`
* `GET /api/assets/:id/events/meta`
* `GET /uploads/*` (статические файлы)

---

## Данные и сиды

Сервер использует JSON-файлы:

* `server/data/users.json`
* `server/data/assets.json`
* `server/data/events.json`

При первом старте файлы создаются автоматически, если отсутствуют.

---

```md
# LINKS

- Deploy: https://biocad-test.remystorage.ru/dashboard
- Code: https://github.com/nanatic/biocad-test
```

---

