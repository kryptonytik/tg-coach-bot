"""
Telegram бот для тренера Влада.
Запускает Mini App при нажатии /start.

Использование:
  1. Вставь BOT_TOKEN в backend/.env
  2. Замени MINI_APP_URL на URL задеплоенного фронтенда (или ngrok URL для теста)
  3. python3 bot.py
"""
import os
import logging
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

import telebot
from telebot.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BOT_TOKEN = os.environ.get('BOT_TOKEN')
MINI_APP_URL = os.environ.get('MINI_APP_URL', 'https://your-frontend-url.vercel.app')
TRAINER_TELEGRAM_IDS = os.environ.get('TRAINER_IDS', '').split(',')  # comma-separated Telegram user IDs

if not BOT_TOKEN or BOT_TOKEN == 'placeholder':
    raise ValueError("BOT_TOKEN не задан. Вставь токен от BotFather в backend/.env")

bot = telebot.TeleBot(BOT_TOKEN)


def make_app_keyboard():
    markup = InlineKeyboardMarkup()
    markup.add(
        InlineKeyboardButton(
            "🏋️ Открыть приложение",
            web_app=WebAppInfo(url=MINI_APP_URL)
        )
    )
    return markup


@bot.message_handler(commands=['start'])
def handle_start(message):
    user_id = str(message.from_user.id)
    is_trainer = user_id in TRAINER_TELEGRAM_IDS

    if is_trainer:
        text = (
            f"Привет, тренер Влад! 💪\n\n"
            f"Нажми кнопку ниже чтобы открыть приложение учёта тренировок."
        )
    else:
        text = (
            f"Привет! 👋\n\n"
            f"Это приложение для учёта тренировок.\n"
            f"Открой приложение, чтобы зарегистрироваться."
        )

    bot.send_message(
        message.chat.id,
        text,
        reply_markup=make_app_keyboard()
    )


@bot.message_handler(commands=['app'])
def handle_app(message):
    bot.send_message(
        message.chat.id,
        "Открыть приложение:",
        reply_markup=make_app_keyboard()
    )


@bot.message_handler(func=lambda m: True)
def handle_any(message):
    bot.send_message(
        message.chat.id,
        "Используй /start для открытия приложения 🏋️",
        reply_markup=make_app_keyboard()
    )


if __name__ == '__main__':
    logger.info(f"Bot started. Mini App URL: {MINI_APP_URL}")
    logger.info("Нажми Ctrl+C для остановки")
    bot.infinity_polling(timeout=60, long_polling_timeout=30)
