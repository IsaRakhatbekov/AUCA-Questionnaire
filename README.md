# AUCA-Questionnaire

Анкета для департаментов AUCA — сбор требований для редизайна сайта. Ответы сохраняются в Supabase, статистика доступна на вкладке «Статистика ответов».

## Локальный запуск

```bash
npm install
cp .env.example .env.local
# заполните SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY в .env.local
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

## Деплой на Vercel

Добавьте переменные окружения `SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY` (те же, что в `.env.local`).
