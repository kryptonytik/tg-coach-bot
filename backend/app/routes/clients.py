from datetime import date, datetime, timezone

from flask import Blueprint, jsonify, request, g
from sqlalchemy import func

from app.auth import trainer_required
from app.extensions import db
from app.models.body_measurement import BodyMeasurement
from app.models.client import Client, VALID_GOALS
from app.models.questionnaire import Questionnaire
from app.models.workout import WorkoutSession
from app.models.workout_set import WorkoutSet

clients_bp = Blueprint("clients", __name__, url_prefix="/api/clients")

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


@clients_bp.get("")
@trainer_required
def list_clients():
    """
    GET /api/clients?active=true|false
    Returns list of clients belonging to the authenticated trainer.
    """
    trainer = g.current_user
    query = Client.query.filter_by(trainer_id=trainer.id)

    query = query.filter(
        db.or_(Client.user_id == None, Client.user_id != trainer.id)
    )

    active_param = request.args.get("active")
    if active_param is not None:
        is_active = active_param.lower() == "true"
        query = query.filter_by(is_active=is_active)

    clients = query.order_by(Client.first_name, Client.last_name).all()

    client_ids = [c.id for c in clients]
    last_dates = {}
    if client_ids:
        rows = (
            db.session.query(WorkoutSession.client_id, func.max(WorkoutSession.date).label('last_date'))
            .filter(WorkoutSession.client_id.in_(client_ids), WorkoutSession.is_completed == True)
            .group_by(WorkoutSession.client_id)
            .all()
        )
        last_dates = {row.client_id: row.last_date for row in rows}

    result = []
    for c in clients:
        d = c.to_dict(include_questionnaire=False)
        last_d = last_dates.get(c.id)
        d['last_workout_date'] = last_d.isoformat() if last_d else None
        result.append(d)
    return jsonify(result)


@clients_bp.post("")
@trainer_required
def create_client():
    """
    POST /api/clients
    Body: {first_name, last_name?, phone?, goal, questionnaire?: {...}}
    Creates Client + optional Questionnaire atomically.
    """
    trainer = g.current_user
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    first_name = (data.get("first_name") or "").strip()
    if not first_name:
        return jsonify({"error": "first_name is required"}), 400

    goal = data.get("goal", "maintenance")
    if goal not in VALID_GOALS:
        return jsonify(
            {"error": f"goal must be one of: {', '.join(VALID_GOALS)}"}
        ), 400

    target_weight = data.get("target_weight")
    if target_weight is not None:
        try:
            target_weight = float(target_weight)
        except (ValueError, TypeError):
            return jsonify({"error": "target_weight must be a number"}), 400

    client = Client(
        trainer_id=trainer.id,
        user_id=data.get("user_id"),
        first_name=first_name,
        last_name=(data.get("last_name") or "").strip() or None,
        phone=(data.get("phone") or "").strip() or None,
        telegram_username=(data.get("telegram_username") or "").strip() or None,
        goal=goal,
        target_weight=target_weight,
    )
    db.session.add(client)
    db.session.flush()  # get client.id before commit

    questionnaire_data = data.get("questionnaire")
    if questionnaire_data and isinstance(questionnaire_data, dict):
        q = Questionnaire(client_id=client.id)
        for field in QUESTIONNAIRE_FIELDS:
            if field in questionnaire_data:
                setattr(q, field, questionnaire_data[field])
        db.session.add(q)

        q_weight = questionnaire_data.get("weight")
        if q_weight is not None:
            try:
                baseline = BodyMeasurement(
                    client_id=client.id, date=date.today(), weight=float(q_weight)
                )
                db.session.add(baseline)
            except (ValueError, TypeError):
                pass

    db.session.commit()
    return jsonify(client.to_dict()), 201


@clients_bp.get("/<int:client_id>")
@trainer_required
def get_client(client_id: int):
    """
    GET /api/clients/<id>
    Returns full client details + questionnaire + last 5 sessions.
    """
    trainer = g.current_user
    client = Client.query.filter_by(id=client_id, trainer_id=trainer.id).first()
    if client is None:
        return jsonify({"error": "Client not found"}), 404

    return jsonify(client.to_dict(include_questionnaire=True, include_sessions=True))


@clients_bp.patch("/<int:client_id>")
@trainer_required
def update_client(client_id: int):
    """
    PATCH /api/clients/<id>
    Updatable fields: is_active, goal, phone, first_name, last_name.
    Questionnaire sub-object is also patchable.
    """
    trainer = g.current_user
    client = Client.query.filter_by(id=client_id, trainer_id=trainer.id).first()
    if client is None:
        return jsonify({"error": "Client not found"}), 404

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    if "is_active" in data:
        client.is_active = bool(data["is_active"])
    if "goal" in data:
        if data["goal"] not in VALID_GOALS:
            return jsonify(
                {"error": f"goal must be one of: {', '.join(VALID_GOALS)}"}
            ), 400
        client.goal = data["goal"]
    if "phone" in data:
        client.phone = (data["phone"] or "").strip() or None
    if "first_name" in data:
        first_name = (data["first_name"] or "").strip()
        if not first_name:
            return jsonify({"error": "first_name cannot be empty"}), 400
        client.first_name = first_name
    if "last_name" in data:
        client.last_name = (data["last_name"] or "").strip() or None
    if "notes" in data:
        val = data.get("notes")
        client.notes = val.strip() if isinstance(val, str) and val.strip() else None

    # Patch questionnaire fields if provided
    questionnaire_data = data.get("questionnaire")
    if questionnaire_data and isinstance(questionnaire_data, dict):
        q = client.questionnaire
        if q is None:
            q = Questionnaire(client_id=client.id)
            db.session.add(q)
        for field in QUESTIONNAIRE_FIELDS:
            if field in questionnaire_data:
                setattr(q, field, questionnaire_data[field])
        q.updated_at = datetime.now(timezone.utc)

    db.session.commit()
    return jsonify(client.to_dict())


@clients_bp.get("/<int:client_id>/workout-history")
@trainer_required
def get_client_workout_history(client_id: int):
    """
    GET /api/clients/<id>/workout-history?limit=20&offset=0
    Returns completed sessions for this client ordered by date desc.
    Each item: {id, date, workout_type, category, sets_count, exercises_count}
    """
    trainer = g.current_user
    client = Client.query.filter_by(id=client_id, trainer_id=trainer.id).first()
    if client is None:
        return jsonify({"error": "Client not found"}), 404

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


@clients_bp.get("/<int:client_id>/measurements")
@trainer_required
def get_client_measurements(client_id: int):
    """
    GET /api/clients/<id>/measurements
    Returns last 30 BodyMeasurement records for this client ordered by date desc.
    """
    trainer = g.current_user
    client = Client.query.filter_by(id=client_id, trainer_id=trainer.id).first()
    if client is None:
        return jsonify({"error": "Client not found"}), 404

    measurements = (
        BodyMeasurement.query
        .filter_by(client_id=client.id)
        .order_by(BodyMeasurement.date.desc())
        .limit(30)
        .all()
    )
    return jsonify([m.to_dict() for m in measurements])


@clients_bp.delete("/<int:client_id>/permanent")
@trainer_required
def permanent_delete_client(client_id: int):
    """
    DELETE /api/clients/<id>/permanent
    Hard delete: removes the client and all related data (sessions, sets, measurements, questionnaire).
    All cascades are defined on the ORM relationships, so db.session.delete(client) suffices.
    """
    trainer = g.current_user
    client = Client.query.filter_by(id=client_id, trainer_id=trainer.id).first()
    if client is None:
        return jsonify({"error": "Client not found"}), 404

    db.session.delete(client)
    db.session.commit()
    return jsonify({"message": "deleted", "id": client_id})


@clients_bp.delete("/<int:client_id>")
@trainer_required
def delete_client(client_id: int):
    """
    DELETE /api/clients/<id>
    Soft delete: sets is_active=False.
    """
    trainer = g.current_user
    client = Client.query.filter_by(id=client_id, trainer_id=trainer.id).first()
    if client is None:
        return jsonify({"error": "Client not found"}), 404

    client.is_active = False
    db.session.commit()
    return jsonify({"message": "Client deactivated", "id": client.id})
