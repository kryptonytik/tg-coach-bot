from datetime import datetime, timezone
from app.extensions import db

VALID_GOALS = ("weight_gain", "weight_loss", "recovery", "maintenance")


class Client(db.Model):
    __tablename__ = "clients"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True, index=True)
    trainer_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    first_name = db.Column(db.String(128), nullable=False)
    last_name = db.Column(db.String(128), nullable=True)
    phone = db.Column(db.String(32), nullable=True)
    telegram_username = db.Column(db.String(128), nullable=True, index=True)
    goal = db.Column(db.String(32), nullable=False, default="maintenance")
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user = db.relationship(
        "User",
        foreign_keys=[user_id],
        backref=db.backref("client_profile", uselist=False, lazy="select"),
    )
    trainer = db.relationship(
        "User",
        foreign_keys=[trainer_id],
        backref=db.backref("clients_as_trainer", lazy="dynamic"),
    )
    questionnaire = db.relationship(
        "Questionnaire",
        back_populates="client",
        uselist=False,
        lazy="select",
        cascade="all, delete-orphan",
    )
    sessions = db.relationship(
        "WorkoutSession",
        back_populates="client",
        lazy="dynamic",
        cascade="all, delete-orphan",
    )

    def to_dict(self, include_questionnaire=True, include_sessions=False):
        data = {
            "id": self.id,
            "user_id": self.user_id,
            "trainer_id": self.trainer_id,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "phone": self.phone,
            "telegram_username": self.telegram_username,
            "goal": self.goal,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if include_questionnaire:
            data["questionnaire"] = (
                self.questionnaire.to_dict() if self.questionnaire else None
            )
        if include_sessions:
            from app.models.workout import WorkoutSession  # avoid circular at module level

            recent = (
                self.sessions.order_by(WorkoutSession.date.desc()).limit(5).all()
            )
            data["recent_sessions"] = [s.to_dict(include_sets=False) for s in recent]
        return data

    def __repr__(self):
        return (
            f"<Client id={self.id} name={self.first_name!r} {self.last_name!r}"
            f" active={self.is_active}>"
        )
