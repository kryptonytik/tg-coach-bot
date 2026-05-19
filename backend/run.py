import os
from dotenv import load_dotenv

load_dotenv()

from app import create_app

app = create_app()

# Initialize DB tables and seed on startup (idempotent)
with app.app_context():
    try:
        from app.extensions import db
        from app.seed import run_seed

        db.create_all()
        run_seed()

        # Migrate: add new columns if they don't exist (safe on existing DBs)
        with db.engine.connect() as conn:
            conn.execute(db.text(
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_username VARCHAR(128)"
            ))
            conn.execute(db.text(
                "ALTER TABLE clients ADD COLUMN IF NOT EXISTS telegram_username VARCHAR(128)"
            ))
            conn.commit()

        print("DB ready.")
    except Exception as e:
        print(f"DB init warning: {e}")

if __name__ == "__main__":
    debug = os.getenv("DEV_MODE", "false").lower() == "true"
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=debug)
