from app.extensions import db

VALID_CATEGORIES = (
    "chest_biceps",
    "back_triceps",
    "legs_shoulders",
    "functional",
    "other",
)

VALID_WORKOUT_TYPES = ("strength", "functional", "both")


class Exercise(db.Model):
    __tablename__ = "exercises"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(256), nullable=False)
    category = db.Column(db.String(32), nullable=False)       # see VALID_CATEGORIES
    workout_type = db.Column(db.String(16), nullable=False)   # see VALID_WORKOUT_TYPES
    muscle_group = db.Column(db.String(128), nullable=True)
    description = db.Column(db.Text, nullable=True)
    is_custom = db.Column(db.Boolean, nullable=False, default=False)

    # Relationship back-refs from WorkoutSet
    # sets -> backref from WorkoutSet.exercise

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "workout_type": self.workout_type,
            "muscle_group": self.muscle_group,
            "description": self.description,
            "is_custom": self.is_custom,
        }

    def __repr__(self):
        return (
            f"<Exercise id={self.id} name={self.name!r}"
            f" category={self.category!r}>"
        )
