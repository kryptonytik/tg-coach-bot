"""
Seed the exercise catalog with common gym exercises.
Run inside an application context.
"""
from app.extensions import db
from app.models.exercise import Exercise

EXERCISES = [
    # ── Chest + Biceps ────────────────────────────────────────────────────────
    {
        "name": "Жим лёжа (штанга)",
        "category": "chest_biceps",
        "workout_type": "strength",
        "muscle_group": "Грудь",
    },
    {
        "name": "Жим лёжа (гантели)",
        "category": "chest_biceps",
        "workout_type": "strength",
        "muscle_group": "Грудь",
    },
    {
        "name": "Жим на наклонной скамье",
        "category": "chest_biceps",
        "workout_type": "strength",
        "muscle_group": "Верхняя грудь",
    },
    {
        "name": "Разводка гантелей",
        "category": "chest_biceps",
        "workout_type": "strength",
        "muscle_group": "Грудь",
    },
    {
        "name": "Отжимания на брусьях",
        "category": "chest_biceps",
        "workout_type": "strength",
        "muscle_group": "Грудь, трицепс",
    },
    {
        "name": "Подъём штанги на бицепс",
        "category": "chest_biceps",
        "workout_type": "strength",
        "muscle_group": "Бицепс",
    },
    {
        "name": "Подъём гантелей на бицепс",
        "category": "chest_biceps",
        "workout_type": "strength",
        "muscle_group": "Бицепс",
    },
    {
        "name": "Молоток",
        "category": "chest_biceps",
        "workout_type": "strength",
        "muscle_group": "Бицепс, плечо",
    },
    {
        "name": "Концентрированный подъём",
        "category": "chest_biceps",
        "workout_type": "strength",
        "muscle_group": "Бицепс",
    },
    # ── Back + Triceps ────────────────────────────────────────────────────────
    {
        "name": "Становая тяга",
        "category": "back_triceps",
        "workout_type": "strength",
        "muscle_group": "Спина, ягодицы",
    },
    {
        "name": "Подтягивания",
        "category": "back_triceps",
        "workout_type": "strength",
        "muscle_group": "Широчайшие",
    },
    {
        "name": "Тяга штанги в наклоне",
        "category": "back_triceps",
        "workout_type": "strength",
        "muscle_group": "Широчайшие, ромбовидные",
    },
    {
        "name": "Тяга гантели одной рукой",
        "category": "back_triceps",
        "workout_type": "strength",
        "muscle_group": "Широчайшие",
    },
    {
        "name": "Горизонтальная тяга",
        "category": "back_triceps",
        "workout_type": "strength",
        "muscle_group": "Средняя спина",
    },
    {
        "name": "Жим узким хватом",
        "category": "back_triceps",
        "workout_type": "strength",
        "muscle_group": "Трицепс",
    },
    {
        "name": "Французский жим",
        "category": "back_triceps",
        "workout_type": "strength",
        "muscle_group": "Трицепс",
    },
    {
        "name": "Разгибание на блоке",
        "category": "back_triceps",
        "workout_type": "strength",
        "muscle_group": "Трицепс",
    },
    {
        "name": "Кикбэк",
        "category": "back_triceps",
        "workout_type": "strength",
        "muscle_group": "Трицепс",
    },
    # ── Legs + Shoulders ──────────────────────────────────────────────────────
    {
        "name": "Приседания со штангой",
        "category": "legs_shoulders",
        "workout_type": "strength",
        "muscle_group": "Квадрицепс, ягодицы",
    },
    {
        "name": "Жим ногами",
        "category": "legs_shoulders",
        "workout_type": "strength",
        "muscle_group": "Квадрицепс",
    },
    {
        "name": "Выпады",
        "category": "legs_shoulders",
        "workout_type": "strength",
        "muscle_group": "Квадрицепс, ягодицы",
    },
    {
        "name": "Разгибание ног",
        "category": "legs_shoulders",
        "workout_type": "strength",
        "muscle_group": "Квадрицепс",
    },
    {
        "name": "Сгибание ног",
        "category": "legs_shoulders",
        "workout_type": "strength",
        "muscle_group": "Бицепс бедра",
    },
    {
        "name": "Икры в тренажёре",
        "category": "legs_shoulders",
        "workout_type": "strength",
        "muscle_group": "Икры",
    },
    {
        "name": "Армейский жим",
        "category": "legs_shoulders",
        "workout_type": "strength",
        "muscle_group": "Плечи",
    },
    {
        "name": "Жим гантелей сидя",
        "category": "legs_shoulders",
        "workout_type": "strength",
        "muscle_group": "Плечи",
    },
    {
        "name": "Боковые подъёмы",
        "category": "legs_shoulders",
        "workout_type": "strength",
        "muscle_group": "Средняя дельта",
    },
    {
        "name": "Тяга штанги к подбородку",
        "category": "legs_shoulders",
        "workout_type": "strength",
        "muscle_group": "Трапеции, дельты",
    },
    # ── Functional ────────────────────────────────────────────────────────────
    {
        "name": "Берпи",
        "category": "functional",
        "workout_type": "functional",
        "muscle_group": "Всё тело",
    },
    {
        "name": "Прыжки на ящик",
        "category": "functional",
        "workout_type": "functional",
        "muscle_group": "Ноги, кардио",
    },
    {
        "name": "Махи гирей",
        "category": "functional",
        "workout_type": "functional",
        "muscle_group": "Ягодицы, спина",
    },
    {
        "name": "Трастеры",
        "category": "functional",
        "workout_type": "functional",
        "muscle_group": "Всё тело",
    },
    {
        "name": "Подтягивания (кипинг)",
        "category": "functional",
        "workout_type": "functional",
        "muscle_group": "Широчайшие",
    },
    {
        "name": "Двойные прыжки на скакалке",
        "category": "functional",
        "workout_type": "functional",
        "muscle_group": "Кардио, икры",
    },
    {
        "name": "Пресс (ТРХ)",
        "category": "functional",
        "workout_type": "functional",
        "muscle_group": "Кор",
    },
    {
        "name": "Планка",
        "category": "functional",
        "workout_type": "functional",
        "muscle_group": "Кор",
    },
]


def seed_exercises():
    """Insert exercises that don't already exist (matched by name)."""
    existing_names = {e.name for e in Exercise.query.with_entities(Exercise.name).all()}
    new_count = 0
    for data in EXERCISES:
        if data["name"] not in existing_names:
            exercise = Exercise(
                name=data["name"],
                category=data["category"],
                workout_type=data["workout_type"],
                muscle_group=data.get("muscle_group"),
                description=data.get("description"),
                is_custom=False,
            )
            db.session.add(exercise)
            new_count += 1
    db.session.commit()
    return new_count


def run_seed():
    """Entry point: seed all data."""
    added = seed_exercises()
    print(f"Seeded {added} new exercises.")
