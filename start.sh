#!/bin/bash
# Запуск для локальной разработки

set -e

echo "🏋️  tg-coach-bot: локальный запуск"
echo "================================="

# Backend
echo ""
echo "▶ Запуск Flask API (порт 5001)..."
cd backend
source venv/bin/activate 2>/dev/null || (python3 -m venv venv && source venv/bin/activate && pip install -r requirements_sqlite.txt -q)
export PORT=5001
python3 run.py &
BACKEND_PID=$!
echo "  Flask PID: $BACKEND_PID"

# Ждём пока Flask поднимется
sleep 2

# Инициализация БД если нужна
if [ ! -f "coach.db" ]; then
  echo "  Инициализация БД..."
  python3 -c "
from dotenv import load_dotenv; load_dotenv()
from app import create_app
app = create_app('development')
with app.app_context():
    from app.extensions import db; db.create_all()
    from app.seed import run_seed; run_seed()
print('  БД готова')
"
fi

cd ..

# Frontend
echo ""
echo "▶ Запуск Vite (порт 3000)..."
cd frontend
npm run dev -- --port 3000 &
FRONTEND_PID=$!
echo "  Vite PID: $FRONTEND_PID"

cd ..

echo ""
echo "================================="
echo "✅ Приложение запущено!"
echo ""
echo "  Mini App:  http://localhost:3000"
echo "  API:       http://localhost:5001"
echo "  Health:    http://localhost:5001/health"
echo ""
echo "Нажми Ctrl+C для остановки"
echo "================================="

# Останавливаем всё при выходе
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Остановлено.'" EXIT INT TERM
wait
