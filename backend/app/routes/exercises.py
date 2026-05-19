from flask import Blueprint, jsonify, request, g

from app.auth import auth_required, trainer_required
from app.extensions import db
from app.models.exercise import Exercise, VALID_CATEGORIES, VALID_WORKOUT_TYPES

exercises_bp = Blueprint("exercises", __name__, url_prefix="/api/exercises")


@exercises_bp.get("")
@auth_required
def list_exercises():
    """
    GET /api/exercises?category=&type=
    Returns exercise list, optionally filtered by category and/or workout_type.
    """
    query = Exercise.query

    category = request.args.get("category")
    if category:
        if category not in VALID_CATEGORIES:
            return jsonify(
                {"error": f"category must be one of: {', '.join(VALID_CATEGORIES)}"}
            ), 400
        query = query.filter_by(category=category)

    workout_type = request.args.get("type")
    if workout_type:
        if workout_type not in VALID_WORKOUT_TYPES:
            return jsonify(
                {"error": f"type must be one of: {', '.join(VALID_WORKOUT_TYPES)}"}
            ), 400
        # 'both' exercises match any type filter
        query = query.filter(
            db.or_(
                Exercise.workout_type == workout_type,
                Exercise.workout_type == "both",
            )
        )

    query = query.filter(Exercise.is_active != False)  # noqa: E712 — handles NULL from old rows
    exercises = query.order_by(Exercise.category, Exercise.name).all()
    return jsonify([e.to_dict() for e in exercises])


@exercises_bp.post("")
@trainer_required
def create_exercise():
    """
    POST /api/exercises
    Body: {name, category, workout_type, muscle_group?, description?}
    Add a custom exercise (trainer only).
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "name is required"}), 400

    category = data.get("category")
    if category not in VALID_CATEGORIES:
        return jsonify(
            {"error": f"category must be one of: {', '.join(VALID_CATEGORIES)}"}
        ), 400

    workout_type = data.get("workout_type")
    if workout_type not in VALID_WORKOUT_TYPES:
        return jsonify(
            {"error": f"workout_type must be one of: {', '.join(VALID_WORKOUT_TYPES)}"}
        ), 400

    # Prevent duplicate names (case-insensitive)
    existing = Exercise.query.filter(
        db.func.lower(Exercise.name) == name.lower()
    ).first()
    if existing:
        return jsonify({"error": "An exercise with this name already exists"}), 409

    exercise = Exercise(
        name=name,
        category=category,
        workout_type=workout_type,
        muscle_group=(data.get("muscle_group") or "").strip() or None,
        description=(data.get("description") or "").strip() or None,
        is_custom=True,
        is_active=True,
    )
    db.session.add(exercise)
    db.session.commit()
    return jsonify(exercise.to_dict()), 201


@exercises_bp.patch("/<int:exercise_id>")
@trainer_required
def update_exercise(exercise_id: int):
    """
    PATCH /api/exercises/<id>
    Updatable: name, muscle_group, category, workout_type.
    """
    exercise = Exercise.query.get(exercise_id)
    if exercise is None:
        return jsonify({"error": "Exercise not found"}), 404

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    if "name" in data:
        name = (data["name"] or "").strip()
        if not name:
            return jsonify({"error": "name cannot be empty"}), 400
        exercise.name = name

    if "muscle_group" in data:
        exercise.muscle_group = (data["muscle_group"] or "").strip() or None

    if "category" in data:
        category = data["category"]
        if category not in VALID_CATEGORIES:
            return jsonify(
                {"error": f"category must be one of: {', '.join(VALID_CATEGORIES)}"}
            ), 400
        exercise.category = category

    if "workout_type" in data:
        workout_type = data["workout_type"]
        if workout_type not in VALID_WORKOUT_TYPES:
            return jsonify(
                {"error": f"workout_type must be one of: {', '.join(VALID_WORKOUT_TYPES)}"}
            ), 400
        exercise.workout_type = workout_type

    db.session.commit()
    return jsonify(exercise.to_dict())


@exercises_bp.delete("/<int:exercise_id>")
@trainer_required
def delete_exercise(exercise_id: int):
    """
    DELETE /api/exercises/<id>
    Soft delete: sets is_active=False.
    """
    exercise = Exercise.query.get(exercise_id)
    if exercise is None:
        return jsonify({"error": "Exercise not found"}), 404

    exercise.is_active = False
    db.session.commit()
    return jsonify({"message": "deleted", "id": exercise_id})
