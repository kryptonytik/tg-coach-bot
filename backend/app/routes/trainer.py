from datetime import date, timedelta

from flask import Blueprint, jsonify, request, g
from sqlalchemy import func

from app.auth import trainer_required, auth_required
from app.extensions import db
from app.models.client import Client
from app.models.workout import WorkoutSession
from app.models.workout_set import WorkoutSet

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

    base_q = Client.query.filter_by(trainer_id=trainer.id).filter(
        db.or_(Client.user_id == None, Client.user_id != trainer.id)
    )

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
@auth_required
def get_active_session(client_id: int):
    """
    GET /api/trainer/active-session/<client_id>
    Check if there is an incomplete session today for the given client.
    Returns session data or null.
    Clients may only query their own client_id.
    """
    user = g.current_user
    today = date.today()

    if user.role == "trainer":
        client = Client.query.filter_by(id=client_id, trainer_id=user.id).first()
        if client is None:
            return jsonify({"error": "Client not found"}), 404
        trainer_id_filter = user.id
    else:
        # Clients can only check their own active session
        from app.models.client import Client as _Client
        own_client = _Client.query.filter_by(user_id=user.id).first()
        if own_client is None or own_client.id != client_id:
            return jsonify({"error": "Forbidden"}), 403
        client = own_client
        trainer_id_filter = client.trainer_id

    session = (
        WorkoutSession.query.filter_by(
            client_id=client_id,
            trainer_id=trainer_id_filter,
            is_completed=False,
        )
        .filter(WorkoutSession.date == today)
        .first()
    )

    return jsonify({"session": session.to_dict() if session else None})


@trainer_bp.get("/my-client-profile")
@trainer_required
def get_my_client_profile():
    """
    GET /api/trainer/my-client-profile
    Returns or creates a personal client profile for the trainer
    (user_id = trainer.id AND trainer_id = trainer.id).
    Allows the trainer to use the standard workout flow with themselves as client.
    """
    trainer = g.current_user

    client = Client.query.filter_by(
        user_id=trainer.id, trainer_id=trainer.id
    ).first()

    if client is None:
        client = Client(
            user_id=trainer.id,
            trainer_id=trainer.id,
            first_name=trainer.first_name,
            last_name=trainer.last_name,
            goal="maintenance",
            is_active=True,
        )
        db.session.add(client)
        db.session.commit()

    return jsonify(client.to_dict(include_questionnaire=False))


@trainer_bp.get("/my-workout-history")
@trainer_required
def get_my_workout_history():
    """
    GET /api/trainer/my-workout-history?limit=20&offset=0
    Returns completed workout sessions for the trainer's self-client profile.
    """
    trainer = g.current_user

    client = Client.query.filter_by(user_id=trainer.id, trainer_id=trainer.id).first()
    if client is None:
        return jsonify([])

    limit = min(request.args.get("limit", 20, type=int), 100)
    offset = request.args.get("offset", 0, type=int)

    sessions = (
        WorkoutSession.query
        .filter_by(client_id=client.id, is_completed=True)
        .order_by(WorkoutSession.date.desc())
        .limit(limit)
        .offset(offset)
        .all()
    )

    result = []
    for s in sessions:
        sets_count = WorkoutSet.query.filter_by(session_id=s.id).count()
        exercises_count = (
            db.session.query(func.count(func.distinct(WorkoutSet.exercise_id)))
            .filter(WorkoutSet.session_id == s.id)
            .scalar()
        ) or 0
        result.append({
            "id": s.id,
            "date": s.date.isoformat() if s.date else None,
            "workout_type": s.workout_type,
            "category": s.category,
            "sets_count": sets_count,
            "exercises_count": exercises_count,
        })

    return jsonify(result)
