import os
import threading
from dotenv import load_dotenv

load_dotenv()

from app import create_app

app = create_app()

def _init_db():
    """Run in background so gunicorn binds port before DB migrations finish."""
    with app.app_context():
        try:
            from app.extensions import db
            from app.seed import run_seed

            db.create_all()
            run_seed()

            with db.engine.connect() as conn:
                conn.execute(db.text(
                    "ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_username VARCHAR(128)"
                ))
                conn.execute(db.text(
                    "ALTER TABLE clients ADD COLUMN IF NOT EXISTS telegram_username VARCHAR(128)"
                ))
                conn.execute(db.text(
                    "ALTER TABLE clients ADD COLUMN IF NOT EXISTS target_weight FLOAT"
                ))
                conn.commit()

            print("DB ready.")
        except Exception as e:
            print(f"DB init warning: {e}")

threading.Thread(target=_init_db, daemon=True).start()

if __name__ == "__main__":
    debug = os.getenv("DEV_MODE", "false").lower() == "true"
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=debug)
