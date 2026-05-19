from datetime import date, datetime, timezone

from flask import Blueprint, jsonify, request, g

from app.auth import auth_required
from app.extensions import db
from app.models.client import Client, VALID_GOALS
from app.models.questionnaire import Questionnaire
from app.models.body_measurement import BodyMeasurement
from app.models.workout import WorkoutSession
from app.models.user import User

me_bp = Blueprint("me", __name__, url_prefix="/api/me")

QUESTIONNAIRE_FIELDS = [
    "had_training_before",
    "previous_sports",
    "time_since_last_workout",
    "physical_limitations",
    "joint_pain",
    "pressure_issues",
    "surgeries",
    "congenital_conditions",
    "gi_issues",
    "spine_conditions",
    "chest_pain",
    "supplements",
    "fitness_level",
    "age",
    "height",
    "weight",
]


@me_bp.get("")
@auth_required
def get_me():
    """
    GET /api/me
    Returns current user info and their client profile (if any).
    """
    user = g.current_user
    user_dict = user.to_dict()

    client_profile = user.client_profile
    if client_profile is not None:
        user_dict["client"] = client_profile.to_dict(include_questionnaire=True)
    else:
        user_dict["client"] = None

    return jsonify(user_dict)


@me_bp.post("/register")
@auth_required
def register_as_client():
    """
    POST /api/me/register
    Allows a Telegram user to self-register as a client.
    Auto-assigns to the first trainer in the system.
    Returns 409 if already registered.
    """
    user = g.current_user

    if user.client_profile is not None:
        return jsonify({"error": "Already registered as a client"}), 409

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    first_name = (data.get("first_name") or "").strip()
    if not first_name:
        return jsonify({"error": "first_name is required"}), 400

    goal = data.get("goal", "maintenance")
    if goal not in VALID_GOALS:
        return jsonify(
            {"error": "goal must be one of: {}".format(", ".join(VALID_GOALS))}
        ), 400

    # Find the default trainer (first user with role='trainer')
    trainer = User.query.filter_by(role="trainer").first()
    if trainer is None:
        return jsonify({"error": "No trainer available in the system"}), 503

    client = Client(
        trainer_id=trainer.id,
        user_id=user.id,
        first_name=first_name,
        last_name=(data.get("last_name") or "").strip() or None,
        phone=(data.get("phone") or "").strip() or None,
        telegram_username=data.get("telegram_username") or user.telegram_username,
        goal=goal,
    )
    db.session.add(client)
    db.session.flush()

    questionnaire_data = data.get("questionnaire")
    if questionnaire_data and isinstance(questionnaire_data, dict):
        q = Questionnaire(client_id=client.id)
        for field in QUESTIONNAIRE_FIELDS:
            if field in questionnaire_data:
                setattr(q, field, questionnaire_data[field])
        db.session.add(q)

    db.session.commit()
    return jsonify(client.to_dict()), 201


@me_bp.get("/stats")
@auth_required
def get_my_stats():
    """
    GET /api/me/stats
    Returns the client's own workout and measurement stats.
    """
    user = g.current_user
    client = user.client_profile
    if client is None:
        return jsonify({"error": "No client profile found"}), 404

    today = date.today()

    # Sessions this month
    month_start = today.replace(day=1)
    sessions_this_month = (
        WorkoutSession.query
        .filter(
            WorkoutSession.client_id == client.id,
            WorkoutSession.date >= month_start,
        )
        .count()
    )

    # Sessions this week (Monday-based)
    week_start = today.fromordinal(today.toordinal() - today.weekday())
    sessions_this_week = (
        WorkoutSession.query
        .filter(
            WorkoutSession.client_id == client.id,
            WorkoutSession.date >= week_start,
        )
        .count()
    )

    # Last measurement
    last_measurement = (
        BodyMeasurement.query
        .filter_by(client_id=client.id)
        .order_by(BodyMeasurement.date.desc())
        .first()
    )

    last_measurement_data = None
    if last_measurement is not None:
        last_measurement_data = {
            "weight": last_measurement.weight,
            "date": last_measurement.date.isoformat() if last_measurement.date else None,
        }

    return jsonify({
        "sessions_this_month": sessions_this_month,
        "sessions_this_week": sessions_this_week,
        "goal": client.goal,
        "last_measurement": last_measurement_data,
    })


@me_bp.post("/measurements")
@auth_required
def add_measurement():
    """
    POST /api/me/measurements
    Body: { weight?, chest?, waist?, hips?, arm?, thigh?, notes?, date? }
    Creates a BodyMeasurement for the current user's client profile.
    """
    user = g.current_user
    client = user.client_profile
    if client is None:
        return jsonify({"error": "No client profile found"}), 404

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    measurement_date = None
    raw_date = data.get("date")
    if raw_date:
        try:
            measurement_date = date.fromisoformat(str(raw_date))
        except (ValueError, TypeError):
            return jsonify({"error": "date must be in YYYY-MM-DD format"}), 400

    measurement = BodyMeasurement(
        client_id=client.id,
        date=measurement_date or date.today(),
        weight=data.get("weight"),
        chest=data.get("chest"),
        waist=data.get("waist"),
        hips=data.get("hips"),
        arm=data.get("arm"),
        thigh=data.get("thigh"),
        notes=data.get("notes"),
    )
    db.session.add(measurement)
    db.session.commit()
    return jsonify(measurement.to_dict()), 201


@me_bp.get("/measurements")
@auth_required
def list_measurements():
    """
    GET /api/me/measurements
    Returns the last 20 measurements for the current user's client profile.
    """
    user = g.current_user
    client = user.client_profile
    if client is None:
        return jsonify({"error": "No client profile found"}), 404

    measurements = (
        BodyMeasurement.query
        .filter_by(client_id=client.id)
        .order_by(BodyMeasurement.date.desc())
        .limit(20)
        .all()
    )
    return jsonify([m.to_dict() for m in measurements])
