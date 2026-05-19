from datetime import date, timedelta

from flask import Blueprint, jsonify, g
from sqlalchemy import func

from app.auth import trainer_required
from app.extensions import db
from app.models.client import Client
from app.models.workout import WorkoutSession

trainer_bp = Blueprint("trainer", __name__, url_prefix="/api/trainer")


@trainer_bp.get("/stats")
@trainer_required
def get_stats():
    """
    GET /api/trainer/stats
    Returns aggregate statistics for the authenticated trainer.
    """
    trainer = g.current_user
    today = date.today()
    week_start = today - timedelta(days=today.weekday())  # Monday

    base_q = Client.query.filter_by(trainer_id=trainer.id)

    total_clients = base_q.count()
    active_clients = base_q.filter_by(is_active=True).count()
    inactive_clients = total_clients - active_clients

    sessions_today = (
        WorkoutSession.query.filter_by(trainer_id=trainer.id)
        .filter(WorkoutSession.date == today)
        .count()
    )
    sessions_this_week = (
        WorkoutSession.query.filter_by(trainer_id=trainer.id)
        .filter(WorkoutSession.date >= week_start)
        .count()
    )

    return jsonify(
        {
            "total_clients": total_clients,
            "active_clients": active_clients,
            "inactive_clients": inactive_clients,
            "sessions_today": sessions_today,
            "sessions_this_week": sessions_this_week,
        }
    )


@trainer_bp.get("/active-session/<int:client_id>")
@trainer_required
def get_active_session(client_id: int):
    """
    GET /api/trainer/active-session/<client_id>
    Check if there is an incomplete session today for the given client.
    Returns session data or null.
    """
    trainer = g.current_user
    today = date.today()

    client = Client.query.filter_by(id=client_id, trainer_id=trainer.id).first()
    if client is None:
        return jsonify({"error": "Client not found"}), 404

    session = (
        WorkoutSession.query.filter_by(
            client_id=client_id,
            trainer_id=trainer.id,
            is_completed=False,
        )
        .filter(WorkoutSession.date == today)
        .first()
    )

    return jsonify({"session": session.to_dict() if session else None})
