import os

from flask import Flask, jsonify
from flask_cors import CORS

from app.config import config_by_name
from app.extensions import db, migrate


def create_app(config_name=None) -> Flask:
    """Application factory."""
    if config_name is None:
        dev_mode = os.getenv("DEV_MODE", "false").lower() == "true"
        config_name = "development" if dev_mode else "production"

    app = Flask(__name__)
    app.config.from_object(config_by_name[config_name])

    # ── Extensions ────────────────────────────────────────────────────────────
    CORS(
        app,
        origins="*",
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    )

    db.init_app(app)
    migrate.init_app(app, db)

    # ── Models (must be imported before migrate/db usage) ─────────────────────
    with app.app_context():
        from app.models import (  # noqa: F401
            User,
            Client,
            Questionnaire,
            Exercise,
            WorkoutSession,
            WorkoutSet,
        )
        db.create_all()
        from app.seed import run_seed
        run_seed()

    # ── Blueprints ────────────────────────────────────────────────────────────
    from app.routes import register_blueprints

    register_blueprints(app)

    # ── Health check ──────────────────────────────────────────────────────────
    @app.get("/health")
    def health():
        return jsonify({"status": "ok", "dev_mode": app.config.get("DEV_MODE", False)})

    # ── CLI commands ──────────────────────────────────────────────────────────
    @app.cli.command("seed")
    def seed_command():
        """Seed the database with initial exercise data."""
        from app.seed import run_seed

        run_seed()

    @app.cli.command("create-trainer")
    def create_trainer_command():
        """Create or promote the dev trainer user."""
        from app.models.user import User

        user = User.query.filter_by(telegram_id="dev_trainer").first()
        if user is None:
            user = User(
                telegram_id="dev_trainer",
                username="dev_trainer",
                first_name="Влад",
                last_name="(Dev)",
                role="trainer",
            )
            db.session.add(user)
            db.session.commit()
            print(f"Created trainer: {user}")
        else:
            user.role = "trainer"
            db.session.commit()
            print(f"Updated to trainer: {user}")

    # ── Global error handlers ─────────────────────────────────────────────────
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Not found"}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({"error": "Method not allowed"}), 405

    @app.errorhandler(500)
    def internal_error(e):
        db.session.rollback()
        return jsonify({"error": "Internal server error"}), 500

    return app
