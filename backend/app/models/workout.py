from datetime import datetime, date, timezone
from app.extensions import db


class WorkoutSession(db.Model):
    __tablename__ = "workout_sessions"

    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(
        db.Integer, db.ForeignKey("clients.id"), nullable=False, index=True
    )
    trainer_id = db.Column(
        db.Integer, db.ForeignKey("users.id"), nullable=False, index=True
    )
    date = db.Column(db.Date, nullable=False, default=date.today)
    workout_type = db.Column(db.String(16), nullable=False)   # 'strength' | 'functional'
    category = db.Column(db.String(32), nullable=True)        # 'chest_biceps' etc
    notes = db.Column(db.Text, nullable=True)
    is_completed = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    client = db.relationship(
        "Client",
        back_populates="sessions",
    )
    trainer = db.relationship(
        "User",
        foreign_keys=[trainer_id],
        backref=db.backref("sessions_as_trainer", lazy="dynamic"),
    )
    sets = db.relationship(
        "WorkoutSet",
        back_populates="session",
        lazy="select",
        cascade="all, delete-orphan",
        order_by="WorkoutSet.set_number",
    )

    def to_dict(self, include_sets=True):
        data = {
            "id": self.id,
            "client_id": self.client_id,
            "trainer_id": self.trainer_id,
            "date": self.date.isoformat() if self.date else None,
            "workout_type": self.workout_type,
            "category": self.category,
            "notes": self.notes,
            "is_completed": self.is_completed,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if include_sets:
            data["sets"] = [s.to_dict() for s in self.sets]
        return data

    def __repr__(self):
        return (
            f"<WorkoutSession id={self.id} client_id={self.client_id}"
            f" date={self.date} type={self.workout_type!r}>"
        )
