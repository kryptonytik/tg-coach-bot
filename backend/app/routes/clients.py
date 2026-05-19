from datetime import datetime, timezone

from flask import Blueprint, jsonify, request, g

from app.auth import trainer_required
from app.extensions import db
from app.models.client import Client, VALID_GOALS
from app.models.questionnaire import Questionnaire

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

    active_param = request.args.get("active")
    if active_param is not None:
        is_active = active_param.lower() == "true"
        query = query.filter_by(is_active=is_active)

    clients = query.order_by(Client.first_name, Client.last_name).all()
    return jsonify([c.to_dict() for c in clients])


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
