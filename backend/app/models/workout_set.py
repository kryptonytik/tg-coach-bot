from datetime import datetime, timezone
from app.extensions import db


class WorkoutSet(db.Model):
    __tablename__ = "workout_sets"

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(
        db.Integer, db.ForeignKey("workout_sessions.id"), nullable=False, index=True
    )
    exercise_id = db.Column(
        db.Integer, db.ForeignKey("exercises.id"), nullable=False, index=True
    )
    set_number = db.Column(db.Integer, nullable=False)
    weight = db.Column(db.Float, nullable=True)   # kg
    reps = db.Column(db.Integer, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    session = db.relationship("WorkoutSession", back_populates="sets")
    exercise = db.relationship(
        "Exercise",
        backref=db.backref("sets", lazy="dynamic"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "session_id": self.session_id,
            "exercise_id": self.exercise_id,
            "exercise_name": self.exercise.name if self.exercise else None,
            "exercise_category": self.exercise.category if self.exercise else None,
            "set_number": self.set_number,
            "weight": self.weight,
            "reps": self.reps,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return (
            f"<WorkoutSet id={self.id} session_id={self.session_id}"
            f" exercise_id={self.exercise_id} set={self.set_number}"
            f" weight={self.weight} reps={self.reps}>"
        )
