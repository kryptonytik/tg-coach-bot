import os


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-prod")
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL", "sqlite:///coach.db"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
    }
    BOT_TOKEN = os.getenv("BOT_TOKEN", "")
    DEV_MODE = os.getenv("DEV_MODE", "false").lower() == "true"


class DevelopmentConfig(Config):
    DEBUG = True
    DEV_MODE = True


class ProductionConfig(Config):
    DEBUG = False
    DEV_MODE = False


config_by_name = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}
