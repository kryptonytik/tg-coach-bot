from datetime import date, datetime, timezone

from flask import Blueprint, jsonify, request, g

from app.auth import trainer_required
from app.extensions import db
from app.models.client import Client
from app.models.exercise import Exercise
from app.models.workout import WorkoutSession
from app.models.workout_set import WorkoutSet

workouts_bp = Blueprint("workouts", __name__, url_prefix="/api/workouts")

VALID_WORKOUT_TYPES = ("strength", "functional")
VALID_CATEGORIES = (
    "chest_biceps",
    "back_triceps",
    "legs_shoulders",
    "functional",
    "other",
)


# ── Sessions ──────────────────────────────────────────────────────────────────


@workouts_bp.get("/sessions")
@trainer_required
def list_sessions():
    """
    GET /api/workouts/sessions?client_id=&date=YYYY-MM-DD&limit=20
    Returns workout sessions for the trainer.
    """
    trainer = g.current_user
    query = WorkoutSession.query.filter_by(trainer_id=trainer.id)

    client_id = request.args.get("client_id", type=int)
    if client_id:
        query = query.filter_by(client_id=client_id)

    date_param = request.args.get("date")
    if date_param:
        try:
            filter_date = date.fromisoformat(date_param)
            query = query.filter(WorkoutSession.date == filter_date)
        except ValueError:
            return jsonify({"error": "date must be in YYYY-MM-DD format"}), 400

    limit = min(request.args.get("limit", 20, type=int), 100)
    sessions = query.order_by(WorkoutSession.date.desc()).limit(limit).all()
    return jsonify([s.to_dict(include_sets=False) for s in sessions])


@workouts_bp.post("/sessions")
@trainer_required
def create_session():
    """
    POST /api/workouts/sessions
    Body: {client_id, workout_type, category?, date?, notes?}
    Creates a new session or returns existing incomplete session for today.
    """
    trainer = g.current_user
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    client_id = data.get("client_id")
    if not client_id:
        return jsonify({"error": "client_id is required"}), 400

    client = Client.query.filter_by(id=client_id, trainer_id=trainer.id).first()
    if client is None:
        return jsonify({"error": "Client not found"}), 404

    workout_type = data.get("workout_type")
    if workout_type not in VALID_WORKOUT_TYPES:
        return jsonify(
            {"error": f"workout_type must be one of: {', '.join(VALID_WORKOUT_TYPES)}"}
        ), 400

    category = data.get("category")
    if category and category not in VALID_CATEGORIES:
        return jsonify(
            {"error": f"category must be one of: {', '.join(VALID_CATEGORIES)}"}
        ), 400

    # Parse date or default to today
    session_date = date.today()
    if data.get("date"):
        try:
            session_date = date.fromisoformat(data["date"])
        except ValueError:
            return jsonify({"error": "date must be in YYYY-MM-DD format"}), 400

    # Return existing incomplete session for same client+day if present
    existing = (
        WorkoutSession.query.filter_by(
            client_id=client_id,
            trainer_id=trainer.id,
            is_completed=False,
        )
        .filter(WorkoutSession.date == session_date)
        .first()
    )
    if existing:
        return jsonify(existing.to_dict()), 200

    session = WorkoutSession(
        client_id=client_id,
        trainer_id=trainer.id,
        date=session_date,
        workout_type=workout_type,
        category=category,
        notes=data.get("notes"),
    )
    db.session.add(session)
    db.session.commit()
    return jsonify(session.to_dict()), 201


@workouts_bp.get("/sessions/<int:session_id>")
@trainer_required
def get_session(session_id: int):
    """
    GET /api/workouts/sessions/<id>
    Returns full session with all sets and exercise details.
    """
    trainer = g.current_user
    session = WorkoutSession.query.filter_by(
        id=session_id, trainer_id=trainer.id
    ).first()
    if session is None:
        return jsonify({"error": "Session not found"}), 404

    return jsonify(session.to_dict(include_sets=True))


@workouts_bp.patch("/sessions/<int:session_id>")
@trainer_required
def update_session(session_id: int):
    """
    PATCH /api/workouts/sessions/<id>
    Updatable: notes, is_completed, category, workout_type.
    """
    trainer = g.current_user
    session = WorkoutSession.query.filter_by(
        id=session_id, trainer_id=trainer.id
    ).first()
    if session is None:
        return jsonify({"error": "Session not found"}), 404

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    if "notes" in data:
        session.notes = data["notes"]
    if "is_completed" in data:
        session.is_completed = bool(data["is_completed"])
    if "category" in data:
        category = data["category"]
        if category and category not in VALID_CATEGORIES:
            return jsonify(
                {"error": f"category must be one of: {', '.join(VALID_CATEGORIES)}"}
            ), 400
        session.category = category
    if "workout_type" in data:
        wt = data["workout_type"]
        if wt not in VALID_WORKOUT_TYPES:
            return jsonify(
                {"error": f"workout_type must be one of: {', '.join(VALID_WORKOUT_TYPES)}"}
            ), 400
        session.workout_type = wt

    db.session.commit()
    return jsonify(session.to_dict(include_sets=True))


# ── Sets ──────────────────────────────────────────────────────────────────────


@workouts_bp.post("/sessions/<int:session_id>/sets")
@trainer_required
def add_set(session_id: int):
    """
    POST /api/workouts/sessions/<id>/sets
    Body: {exercise_id, set_number, weight?, reps?, notes?}
    Adds a set to the session.
    """
    trainer = g.current_user
    session = WorkoutSession.query.filter_by(
        id=session_id, trainer_id=trainer.id
    ).first()
    if session is None:
        return jsonify({"error": "Session not found"}), 404

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    exercise_id = data.get("exercise_id")
    if not exercise_id:
        return jsonify({"error": "exercise_id is required"}), 400

    exercise = Exercise.query.get(exercise_id)
    if exercise is None:
        return jsonify({"error": "Exercise not found"}), 404

    set_number = data.get("set_number")
    if set_number is None:
        return jsonify({"error": "set_number is required"}), 400
    try:
        set_number = int(set_number)
        if set_number < 1:
            raise ValueError
    except (ValueError, TypeError):
        return jsonify({"error": "set_number must be a positive integer"}), 400

    weight = data.get("weight")
    if weight is not None:
        try:
            weight = float(weight)
        except (ValueError, TypeError):
            return jsonify({"error": "weight must be a number"}), 400

    reps = data.get("reps")
    if reps is not None:
        try:
            reps = int(reps)
        except (ValueError, TypeError):
            return jsonify({"error": "reps must be an integer"}), 400

    workout_set = WorkoutSet(
        session_id=session_id,
        exercise_id=exercise_id,
        set_number=set_number,
        weight=weight,
        reps=reps,
        notes=data.get("notes"),
    )
    db.session.add(workout_set)
    db.session.commit()
    return jsonify(workout_set.to_dict()), 201


@workouts_bp.delete("/sessions/<int:session_id>/sets/<int:set_id>")
@trainer_required
def delete_set(session_id: int, set_id: int):
    """
    DELETE /api/workouts/sessions/<id>/sets/<set_id>
    Removes a set from the session.
    """
    trainer = g.current_user
    session = WorkoutSession.query.filter_by(
        id=session_id, trainer_id=trainer.id
    ).first()
    if session is None:
        return jsonify({"error": "Session not found"}), 404

    workout_set = WorkoutSet.query.filter_by(id=set_id, session_id=session_id).first()
    if workout_set is None:
        return jsonify({"error": "Set not found"}), 404

    db.session.delete(workout_set)
    db.session.commit()
    return jsonify({"message": "Set deleted", "id": set_id})


# ── Exercise history ──────────────────────────────────────────────────────────


@workouts_bp.get("/exercise-history")
@trainer_required
def exercise_history():
    """
    GET /api/workouts/exercise-history?client_id=&exercise_id=&limit=5
    Returns last N sessions where this exercise was logged for the client.
    Powers the "previous workout data" UI while logging sets.

    Response: [{date, session_id, sets: [{weight, reps, set_number}]}]
    """
    trainer = g.current_user

    client_id = request.args.get("client_id", type=int)
    exercise_id = request.args.get("exercise_id", type=int)
    limit = min(request.args.get("limit", 5, type=int), 20)

    if not client_id:
        return jsonify({"error": "client_id is required"}), 400
    if not exercise_id:
        return jsonify({"error": "exercise_id is required"}), 400

    client = Client.query.filter_by(id=client_id, trainer_id=trainer.id).first()
    if client is None:
        return jsonify({"error": "Client not found"}), 404

    exercise = Exercise.query.get(exercise_id)
    if exercise is None:
        return jsonify({"error": "Exercise not found"}), 404

    # Find sessions (for this client) that contain at least one set of this exercise
    sessions_with_exercise = (
        db.session.query(WorkoutSession)
        .join(WorkoutSet, WorkoutSet.session_id == WorkoutSession.id)
        .filter(
            WorkoutSession.client_id == client_id,
            WorkoutSet.exercise_id == exercise_id,
        )
        .order_by(WorkoutSession.date.desc())
        .limit(limit)
        .all()
    )

    result = []
    for s in sessions_with_exercise:
        sets = (
            WorkoutSet.query.filter_by(session_id=s.id, exercise_id=exercise_id)
            .order_by(WorkoutSet.set_number)
            .all()
        )
        result.append(
            {
                "date": s.date.isoformat(),
                "session_id": s.id,
                "sets": [
                    {
                        "set_number": ws.set_number,
                        "weight": ws.weight,
                        "reps": ws.reps,
                    }
                    for ws in sets
                ],
            }
        )

    return jsonify(result)
